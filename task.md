# Task List for AI-Powered PDF Chatbot with RAG

## Phase 1: MVP (Week 1-2)
- [x] Basic FastAPI setup <!-- id: 0 -->
- [x] PDF upload and text extraction (PyPDF2) <!-- id: 1 -->
- [x] ChromaDB integration (Setup & Schema) <!-- id: 2 -->
- [x] Embedding generation (sentence-transformers) <!-- id: 3 -->
- [x] Simple question answering endpoint <!-- id: 4 -->
- [x] Groq API integration for LLM <!-- id: 5 -->
- [x] Verify end-to-end flow (CLI or simple script) <!-- id: 6 -->
    - [x] Create verify_setup.py
    - [x] Create cli.py for manual testing

## Phase 2: API & Database (Week 3-4)
- [x] MySQL database setup (Schema creation) <!-- id: 7 -->
    - [x] Create database.py (SQLAlchemy setup)
    - [x] Create models.py (DB schemas)
- [x] Implement Document Management APIs (Upload, List, Delete) <!-- id: 8 -->
    - [x] Update /upload to save to DB
    - [x] Create GET /documents
    - [x] Create DELETE /documents/{id}

- [x] Implement Chat APIs (Ask, History) <!-- id: 9 -->
    - [x] Update /chat to save history to DB
    - [x] Create GET /chat/history/{document_id}

- [x] Error handling and Logging <!-- id: 10 -->
    - [x] Add global exception handler
    - [x] Setup logging

- [x] Dockerize the application <!-- id: 11 -->
    - [x] Create Dockerfile
    - [x] Create docker-compose.yml

## Phase 3: Frontend (Week 5-6)

- [/] React app setup with TailwindCSS <!-- id: 12 -->
    - [ ] Initialize Vite + React
    - [ ] Install dependencies (Tailwind, Lucide, Axios)
- [ ] Create Upload Component <!-- id: 13 -->
- [ ] Create Chat Interface <!-- id: 14 -->
- [ ] Create Document List View <!-- id: 15 -->
- [ ] Integrate Frontend with Backend APIs <!-- id: 16 -->

## Phase 4: Polish (Week 7-8)
- [ ] Implement Rate Limiting <!-- id: 17 -->
- [ ] Add Caching <!-- id: 18 -->
- [ ] Performance Optimization <!-- id: 19 -->
- [ ] User Feedback System <!-- id: 20 -->
- [ ] Final Testing & Deployment Preparation <!-- id: 21 -->
