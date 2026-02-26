import chromadb
from chromadb.utils import embedding_functions
from config import settings
import uuid
from groq import Groq

class RAGEngine:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=settings.EMBEDDING_MODEL
        )
        self.collection = self.client.get_or_create_collection(
            name="pdf_documents",
            embedding_function=self.embedding_fn
        )
        self.groq_client = Groq(api_key=settings.GROQ_API_KEY)

    def add_document(self, filename: str, chunks: list, folder_id: int = None):
        """
        Adds document chunks to ChromaDB.
        """
        ids = [str(uuid.uuid4()) for _ in chunks]
        documents = [chunk["text"] for chunk in chunks]
        
        # Metadata must have primitive types for filtering
        metadatas = []
        for chunk in chunks:
            m = {"filename": filename, "page": chunk["page_number"]}
            if folder_id:
                m["folder_id"] = str(folder_id)
            metadatas.append(m)
        
        self.collection.add(
            ids=ids,
            documents=documents,
            metadatas=metadatas
        )

    def query(self, query_text: str, n_results: int = 5, folder_id: int = None, document_id: int = None, history: list = None):
        """
        Searches for relevant chunks and generates an answer using Groq.
        """
        where_filter = {}
        if folder_id:
            where_filter["folder_id"] = str(folder_id)
            
        results = self.collection.query(
            query_texts=[query_text],
            n_results=n_results,
            where=where_filter if where_filter else None
        )
        
        if not results['documents'] or not results['documents'][0]:
            context = "No relevant context found in the document."
        else:
            context = "\n\n".join(results['documents'][0])
        
        system_prompt = (
            "You are a helpful assistant. Use the provided context to answer the user's question. "
            "If the answer is not in the context, say you don't know.\n\n"
            "Format your response for maximum readability:\n"
            "1. Use **bold text** for all key terms, names, dates, and important concepts.\n"
            "2. Use bullet points or numbered lists for steps or multiple items.\n"
            "3. Use tables for comparisons.\n"
            "4. Ensure your response is well-structured and easy to scan."
        )

        messages = [{"role": "system", "content": system_prompt}]
        
        # Add history if available
        if history:
            for msg in history:
                messages.append({"role": msg["role"].lower(), "content": msg["content"]})
        
        # Add current context and question
        user_prompt = f"Context:\n{context}\n\nQuestion: {query_text}"
        messages.append({"role": "user", "content": user_prompt})
        
        chat_completion = self.groq_client.chat.completions.create(
            messages=messages,
            model=settings.GROQ_MODEL,
        )
        
        return {
            "answer": chat_completion.choices[0].message.content,
            "sources": results['metadatas'][0]
        }
