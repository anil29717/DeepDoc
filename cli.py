import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent / "backend"))

try:
    from services.pdf_processor import PDFProcessor
    from services.rag_engine import RAGEngine
    from fastapi import UploadFile
except ImportError as e:
    print(f"Error importing modules: {e}")
    print("Please ensure you are in the project root and have installed dependencies.")
    sys.exit(1)

async def main():
    print("=== AI-Powered PDF Chatbot CLI ===")
    
    # Initialize services
    processor = PDFProcessor()
    rag = RAGEngine()

    # Step 1: Upload (Train)
    pdf_path = input("\nEnter the path to your PDF file: ").strip()
    if not os.path.exists(pdf_path):
        print("Error: File not found.")
        return

    print(f"\nTraining on {os.path.basename(pdf_path)}...")
    
    # Simulate FastAPI UploadFile
    with open(pdf_path, "rb") as f:
        # Simple wrapper to mimic UploadFile
        class MockFile:
            def __init__(self, name, content):
                self.filename = name
                self.content = content
                self.content_type = "application/pdf"
            async def read(self):
                return self.content
        
        mock_file = MockFile(os.path.basename(pdf_path), f.read())
        result = await processor.process_pdf(mock_file)
        
        # Index in ChromaDB
        rag.add_document(result["filename"], result["chunks"])
        print(f"Index complete! Extracted {len(result['chunks'])} chunks.")

    # Step 2: Chat
    print("\nYou can now ask questions about the PDF (type 'exit' to quit).")
    while True:
        question = input("\nQuestion: ").strip()
        if question.lower() in ["exit", "quit"]:
            break
        
        print("Thinking...")
        try:
            response = rag.query(question)
            print(f"\nAnswer: {response['answer']}")
            print("-" * 20)
            print("Sources (Pages):", ", ".join(set(str(m['page']) for m in response['sources'])))
        except Exception as e:
            print(f"Error querying Groq: {e}")
            print("Hint: Make sure your GROQ_API_KEY is correct in .env")

if __name__ == "__main__":
    asyncio.run(main())
