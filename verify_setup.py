import sys
import os

def check_imports():
    print("Checking dependencies...")
    try:
        import fastapi
        import uvicorn
        import chromadb
        import sentence_transformers
        import PyPDF2
        import groq
        print("✅ All dependencies installed correctly.")
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        sys.exit(1)

def check_env():
    print("\nChecking environment variables...")
    from backend.config import settings
    
    if not settings.GROQ_API_KEY:
        print("⚠️  GROQ_API_KEY is not set. The LLM feature will not work.")
    else:
        print("✅ GROQ_API_KEY is found.")
        
    print(f"✅ ChromaDB Persist Dir: {settings.CHROMA_PERSIST_DIR}")
    print(f"✅ Embedding Model: {settings.EMBEDDING_MODEL}")

if __name__ == "__main__":
    # Add backend to path to allow imports
    sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))
    
    check_imports()
    # check_env() # Commented out to avoid circular import issues if .env is missing or path issues, but can be enabled if path is fixed.
    # Simple path fix for check_env
    try:
        sys.path.append(os.getcwd())
        from backend.config import settings
        if not settings.GROQ_API_KEY:
             print("⚠️  GROQ_API_KEY is missing in env (using default empty string from config).")
        else:
             print("✅ GROQ_API_KEY is configured.")
    except Exception as e:
        print(f"⚠️  Could not check config: {e}")

    print("\n🚀 Verification Complete! You can now run the server with:")
    print("cd backend && uvicorn main:app --reload")
