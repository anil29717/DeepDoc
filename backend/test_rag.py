import sys
import os
sys.path.append(os.getcwd())

from services.rag_engine import RAGEngine
import logging

logging.basicConfig(level=logging.INFO)

def test_query():
    try:
        engine = RAGEngine()
        print("Engine initialized.")
        
        # Check collection count
        count = engine.collection.count()
        print(f"Collection count: {count}")
        
        if count == 0:
            print("Warning: Collection is empty. Query might fail or return empty.")
            
        print("Running test query...")
        result = engine.query("What is this document about?")
        print("Query successful!")
        print(f"Answer: {result['answer']}")
        
    except Exception as e:
        print(f"Query failed with error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_query()
