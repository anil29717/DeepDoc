from fastapi import FastAPI, Depends, UploadFile, File, Request
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import logging
import time
import models
from config import settings
from database import engine, Base, get_db
from services.pdf_processor import PDFProcessor
from services.rag_engine import RAGEngine
from pydantic import BaseModel, EmailStr
import auth

# Logging Setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("pdf-chatbot")

app = FastAPI(
    title="AI-Powered PDF Chatbot",
    description="A RAG-based chatbot for interacting with PDF documents",
    version="1.0.0"
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error: {exc}", exc_info=True)
    response = JSONResponse(
        status_code=500,
        content={"message": "An internal server error occurred.", "detail": str(exc)}
    )
    # Manually add CORS headers so the browser doesn't hide the 500 error behind a CORS block
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

# Middleware for request timing
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"Path: {request.url.path} - Time: {process_time:.4f}s")
    return response

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services Initialization
pdf_processor = PDFProcessor()
rag_engine = RAGEngine()

@app.on_event("startup")
async def startup_event():
    # Create database tables
    try:
        models.Base.metadata.create_all(bind=engine)
        logger.info("Database tables created or verified.")
    except Exception as e:
        logger.error(f"Could not create database tables: {e}")

    # Seed default admin user
    from database import SessionLocal
    db = SessionLocal()
    try:
        admin_email = "admin@deepdoc.ai"
        admin = db.query(models.User).filter(models.User.email == admin_email).first()
        if not admin:
            hashed_pwd = auth.get_password_hash("admin123")
            admin = models.User(
                email=admin_email, 
                name="System Administrator",
                hashed_password=hashed_pwd,
                is_admin=1
            )
            db.add(admin)
            db.commit()
            logger.info("Default admin user seeded.")
    except Exception as e:
        logger.warning(f"Could not seed admin user: {e}")
    finally:
        db.close()

@app.get("/")
async def root():
    return {"message": "Welcome to AI-Powered PDF Chatbot API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

# --- Auth ---

class SignupRequest(BaseModel):
    email: str
    password: str
    name: str

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/auth/signup")
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == request.email).first()
    if db_user:
        return JSONResponse(status_code=400, content={"message": "Email already registered"})
    
    hashed_pwd = auth.get_password_hash(request.password)
    new_user = models.User(
        email=request.email,
        name=request.name,
        hashed_password=hashed_pwd
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully", "user_id": new_user.id}

@app.post("/api/auth/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user or not auth.verify_password(request.password, user.hashed_password):
        return JSONResponse(status_code=401, content={"message": "Invalid credentials"})
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "email": user.email, 
            "name": user.name,
            "is_admin": bool(user.is_admin)
        }
    }

# --- Admin ---

@app.get("/api/admin/users")
async def admin_list_users(db: Session = Depends(get_db), admin: models.User = Depends(auth.get_current_admin)):
    return db.query(models.User).all()

@app.patch("/api/admin/users/{user_id}/status")
async def admin_toggle_user_status(
    user_id: int, 
    db: Session = Depends(get_db), 
    admin: models.User = Depends(auth.get_current_admin)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Toggle 1 and 0
    user.is_active = 0 if user.is_active == 1 else 1
    db.commit()
    db.refresh(user)
    return {"message": f"User status updated to {'Active' if user.is_active else 'Inactive'}", "is_active": bool(user.is_active)}

@app.get("/api/admin/documents")
async def admin_list_all_documents(db: Session = Depends(get_db), admin: models.User = Depends(auth.get_current_admin)):
    # Join with User to show who owns the file
    docs = db.query(models.Document, models.User.name.label("owner_name"), models.User.email.label("owner_email"))\
             .join(models.User, models.Document.user_id == models.User.id)\
             .all()
    
    result = []
    for doc, owner_name, owner_email in docs:
        result.append({
            "id": doc.id,
            "filename": doc.filename,
            "status": doc.status,
            "created_at": doc.created_at,
            "owner": {"name": owner_name, "email": owner_email}
        })
    return result

@app.post("/api/admin/upload-for-user")
async def admin_upload_for_user(
    user_id: int,
    folder_id: Optional[int] = None,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.get_current_admin)
):
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        return JSONResponse(status_code=404, content={"message": "Target user not found"})

    try:
        result = await pdf_processor.process_pdf(file)
    except Exception as e:
        logger.error(f"Admin PDF processing failed: {e}")
        return JSONResponse(status_code=400, content={"message": "Invalid PDF file."})

    filename = result["filename"]
    db_doc = models.Document(
        user_id=user_id,
        folder_id=folder_id,
        filename=filename,
        file_path=filename,
        page_count=result["total_pages"],
        status=models.DocumentStatus.PROCESSING
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    try:
        rag_engine.add_document(filename, result["chunks"], folder_id=folder_id)
        db_doc.status = models.DocumentStatus.READY
        db.commit()
    except Exception as e:
        logger.error(f"Admin Indexing failed for {filename}: {e}")
        db_doc.status = models.DocumentStatus.FAILED
        db.commit()

    return {"message": f"PDF uploaded for user {target_user.name}", "document_id": db_doc.id}

# --- Folders ---

class FolderCreate(BaseModel):
    name: str

@app.post("/api/folders")
async def create_folder(folder: FolderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_folder = models.Folder(user_id=current_user.id, name=folder.name)
    db.add(db_folder)
    db.commit()
    db.refresh(db_folder)
    return db_folder

@app.get("/api/folders")
async def list_folders(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Folder).filter(models.Folder.user_id == current_user.id).all()

@app.get("/api/folders/{folder_id}/documents")
async def list_folder_documents(folder_id: int, db: Session = Depends(get_db)):
    return db.query(models.Document).filter(models.Document.folder_id == folder_id).all()

@app.delete("/api/folders/{folder_id}")
async def delete_folder(folder_id: int, db: Session = Depends(get_db)):
    folder = db.query(models.Folder).filter(models.Folder.id == folder_id).first()
    if not folder:
        return JSONResponse(status_code=404, content={"message": "Folder not found"})
    
    db.delete(folder)
    db.commit()
    return {"message": "Folder deleted successfully"}

# --- Document Management ---

@app.post("/api/documents/upload")
async def upload_pdf(
    file: UploadFile = File(...), 
    folder_id: int = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    try:
        result = await pdf_processor.process_pdf(file)
    except Exception as e:
        logger.error(f"PDF processing failed: {e}")
        return JSONResponse(status_code=400, content={"message": "Invalid PDF file or processing error."})
    
    filename = result["filename"]
    page_count = result["total_pages"]
    
    db_doc = models.Document(
        user_id=current_user.id, 
        folder_id=folder_id,
        filename=filename,
        file_path=filename,
        page_count=page_count,
        status=models.DocumentStatus.PROCESSING
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    
    try:
        rag_engine.add_document(filename, result["chunks"], folder_id=folder_id)
        db_doc.status = models.DocumentStatus.READY
        db.commit()
    except Exception as e:
        logger.error(f"Indexing failed for {filename}: {e}")
        db_doc.status = models.DocumentStatus.FAILED
        db.commit()
    
    return {
        "message": "PDF uploaded successfully",
        "document_id": db_doc.id,
        "filename": filename,
        "status": db_doc.status.value
    }

@app.get("/api/documents")
async def list_documents(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Document).filter(models.Document.user_id == current_user.id).all()

@app.get("/api/documents/{document_id}")
async def get_document(document_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    doc = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == current_user.id
    ).first()
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Document not found"})
    return doc

@app.get("/api/documents/{document_id}/status")
async def get_document_status(document_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    doc = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == current_user.id
    ).first()
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Document not found"})
    return {"status": doc.status.value}

@app.delete("/api/documents/{document_id}")
async def delete_document(document_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    doc = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == current_user.id
    ).first()
    if not doc:
        return JSONResponse(status_code=404, content={"message": "Document not found"})
    
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}

# --- Chat ---

class ChatRequest(BaseModel):
    question: str
    document_id: Optional[int] = None
    folder_id: Optional[int] = None

@app.post("/api/chat/ask")
async def chat(request: ChatRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not request.document_id and not request.folder_id:
        return JSONResponse(status_code=400, content={"message": "Must provide document_id or folder_id"})

    if request.document_id:
        doc = db.query(models.Document).filter(models.Document.id == request.document_id).first()
        if not doc:
            return JSONResponse(status_code=404, content={"message": "Document not found"})
        if doc.status != models.DocumentStatus.READY:
            return JSONResponse(status_code=400, content={"message": "Document is not ready for chat yet."})
        
        conv = db.query(models.Conversation).filter(
            models.Conversation.document_id == request.document_id,
            models.Conversation.user_id == current_user.id
        ).first()
        if not conv:
            conv = models.Conversation(user_id=current_user.id, document_id=request.document_id)
            db.add(conv)
            db.commit()
            db.refresh(conv)
    else:
        folder = db.query(models.Folder).filter(
            models.Folder.id == request.folder_id,
            models.Folder.user_id == current_user.id
        ).first()
        if not folder:
            return JSONResponse(status_code=404, content={"message": "Folder not found"})
        
        conv = db.query(models.Conversation).filter(
            models.Conversation.folder_id == request.folder_id,
            models.Conversation.user_id == current_user.id
        ).first()
        if not conv:
            conv = models.Conversation(user_id=current_user.id, folder_id=request.folder_id)
            db.add(conv)
            db.commit()
            db.refresh(conv)
    
    user_msg = models.Message(
        conversation_id=conv.id,
        role="user",
        content=request.question
    )
    db.add(user_msg)
    
    # Fetch recent chat history (last 10 messages)
    history_msgs = db.query(models.Message).filter(
        models.Message.conversation_id == conv.id
    ).order_by(models.Message.created_at.desc()).limit(10).all()
    
    # Reverse to get chronological order and format for Groq
    chat_history = []
    for m in reversed(history_msgs):
        chat_history.append({"role": m.role.name, "content": m.content})

    try:
        result = rag_engine.query(
            request.question, 
            folder_id=request.folder_id,
            document_id=request.document_id,
            history=chat_history
        )
    except Exception as e:
        logger.error(f"Chat query failed: {e}")
        return JSONResponse(status_code=500, content={"message": "Failed to generate answer."})
    
    assistant_msg = models.Message(
        conversation_id=conv.id,
        role="assistant",
        content=result["answer"]
    )
    db.add(assistant_msg)
    db.commit()
    
    return {
        "answer": result["answer"],
        "sources": result["sources"],
        "conversation_id": conv.id
    }

@app.get("/api/chat/history/{id}")
async def get_chat_history(id: int, is_folder: bool = False, db: Session = Depends(get_db)):
    if is_folder:
        conv = db.query(models.Conversation).filter(models.Conversation.folder_id == id).first()
    else:
        conv = db.query(models.Conversation).filter(models.Conversation.document_id == id).first()
    
    if not conv:
        return []
    
    return db.query(models.Message).filter(
        models.Message.conversation_id == conv.id
    ).order_by(models.Message.created_at.asc()).all()

class FeedbackRequest(BaseModel):
    message_id: int
    rating: int
    comment: str = None

@app.post("/api/chat/feedback")
async def chat_feedback(request: FeedbackRequest, db: Session = Depends(get_db)):
    logger.info(f"Feedback received for message {request.message_id}: {request.rating} - {request.comment}")
    return {"message": "Feedback recorded successfully"}
