# Phase 1: MVP Walkthrough

I have completed the Phase 1 tasks for the AI-Powered PDF Chatbot. The backend structure is set up, and the core RAG logic (PDF processing, ChromaDB integration, Groq LLM) is implemented.

## Changes Implemented

### Backend Core
- **`backend/main.py`**: Initialized FastAPI app with `/upload` and `/chat` endpoints.
- **`backend/config.py`**: Centralized configuration for Environment variables (Groq Key, DB paths).
- **`requirements.txt`**: Added necessary dependencies (`fastapi`, `uvicorn`, `chromadb`, `groq`, etc.).

### PDF Processing
- **`backend/services/pdf_processor.py`**: Added logic to read PDFs, extract text using `PyPDF2`, and split them into chunks.

### RAG Engine
- **`backend/services/rag_engine.py`**: 
    - Initializes **ChromaDB** client and **SentenceTransformer** embedding function.
    - `add_document`: Embeds and stores chunks in ChromaDB.
    - `query`: Retrieves relevant chunks and generates answers using **Groq API**.

## verification

### 1. Install Dependencies
Ensure you have Python installed, then run:
```bash
pip install -r requirements.txt
```

### 2. Set Environment Variables
Create a `.env` file in `d:/RagStudent/.env` with your Groq API Key:
```env
GROQ_API_KEY=gsk_...
GROQ_MODEL=mixtral-8x7b-32768
CHROMA_PERSIST_DIR=./chroma_db
```

### 3. Verify Setup
Run the verification script to check imports and environment:
```bash
python verify_setup.py
```

### 4. Run the Server
Start the backend server:
```bash
cd backend
uvicorn main:app --reload
```

### 5. Check Endpoints
- **Health Check**: `GET http://localhost:8000/health`
- **Upload PDF**: `POST http://localhost:8000/upload` (form-data: `file=@your_pdf.pdf`)
- **Chat**: `POST http://localhost:8000/chat` (body: `{"question": "What is this PDF about?", "document_id": 1}`)

---

## Phase 2: API & Database (Completed)

I have enhanced the backend with a persistent data layer and structured APIs.

### Changes Implemented
- **MySQL Integration**: Added `database.py` and `models.py` using SQLAlchemy.
- **Metadata Persistence**: Documents now save their filename, page count, and processing status to MySQL.
- **Chat History**: Conversations and messages are now stored in the database, allowing you to retrieve history.
- **Document Management**: Added `GET /api/documents` and `DELETE /api/documents/{id}` endpoints.
- **Error Handling**: Implemented a global exception handler and structured logging.
- **Dockerization**: Created `Dockerfile` and `docker-compose.yml` for unified deployment.

### How to Run with Docker
1.  Ensure Docker and Docker Compose are installed.
2.  Run the following in the project root:
    ```bash
    docker-compose up --build
    ```
    This will spin up both the MySQL database and the FastAPI backend.

### Verify Document & Chat API
- **List Documents**: `GET http://localhost:8000/api/documents`
- **Chat History**: `GET http://localhost:8000/api/chat/history/1` (for document ID 1)

