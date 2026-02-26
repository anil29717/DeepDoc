# Implementation Plan - AI-Powered PDF Chatbot with RAG

## Goal Description
Create a web application that allows users to upload PDF documents and ask questions about their content using RAG (Retrieval-Augmented Generation) with ChromaDB and free LLMs (Groq). The system will process documents locally to ensure privacy and provide accurate, context-aware answers.

## User Review Required
> [!IMPORTANT]
> - **API Keys**: Ensure `GROQ_API_KEY` is obtained.
> - **Database**: Local MySQL instance is required for metadata.
> - **Storage**: Ensure sufficient local disk space for ChromaDB and uploaded PDFs.
> - **Privacy**: Confirm that local processing meets all privacy requirements.

## Proposed Changes

### Backend (Python/FastAPI)
#### [NEW] [main.py](file:///d:/RagStudent/backend/main.py)
- Setup FastAPI app
- Define API routes and middleware

#### [NEW] [config.py](file:///d:/RagStudent/backend/config.py)
- Load environment variables (Groq Key, DB Creds)
- Configuration for ChromaDB and Embedding models

#### [NEW] [services/pdf_processor.py](file:///d:/RagStudent/backend/services/pdf_processor.py)
- Implement PDF text extraction using `PyPDF2`
- Chunking logic (500 chars, 50 overlap)

#### [NEW] [services/rag_engine.py](file:///d:/RagStudent/backend/services/rag_engine.py)
- Initialize ChromaDB client
- Implement `add_document` (embed & store)
- Implement `query` (search & generate answer via Groq)

#### [NEW] [database.py](file:///d:/RagStudent/backend/database.py)
- MySQL connection setup using `SQLAlchemy` or `tortoise-orm`

#### [NEW] [models.py](file:///d:/RagStudent/backend/models.py)
- Define SQL models: `User`, `Document`, `Conversation`, `Message`

### Frontend (React + TailwindCSS)
#### [NEW] [index.css](file:///d:/RagStudent/frontend/src/index.css)
- Tailwind imports and custom styles

#### [NEW] [App.jsx](file:///d:/RagStudent/frontend/src/App.jsx)
- Main application component with routing

#### [NEW] [components/Upload.jsx](file:///d:/RagStudent/frontend/src/components/Upload.jsx)
- File upload input with progress bar

#### [NEW] [components/Chat.jsx](file:///d:/RagStudent/frontend/src/components/Chat.jsx)
- Chat interface for Q&A

### Infrastructure
#### [NEW] [requirements.txt](file:///d:/RagStudent/requirements.txt)
- Python dependencies: `fastapi`, `uvicorn`, `chromadb`, `sentence-transformers`, `pypdf2`, `groq`, `mysql-connector-python`

#### [NEW] [docker-compose.yml](file:///d:/RagStudent/docker-compose.yml)
- (Optional for Phase 2) Service orchestration

## Verification Plan

### Automated Tests
- **Unit Tests**: Test PDF extraction and chunking logic.
- **Integration Tests**: Test API endpoints `POST /upload`, `POST /chat`.

### Manual Verification
- **Upload**: Upload a sample PDF (e.g., a technical manual). Verify chunks are stored in ChromaDB.
- **Query**: Ask a specific question found in the PDF. Verify the answer is accurate and cites the correct source.
- **Persistence**: Restart the server and verify documents/chats are still accessible.
