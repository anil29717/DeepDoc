import PyPDF2
from fastapi import UploadFile, HTTPException
import io

class PDFProcessor:
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    async def process_pdf(self, file: UploadFile):
        """
        Reads a PDF file, extracts text, and chunks it.
        """
        if file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        try:
            content = await file.read()
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            
            full_text = ""
            chunks = []
            
            for page_num, page in enumerate(pdf_reader.pages):
                text = page.extract_text()
                if text:
                    full_text += text
                    # Simple chunking logic (can be improved)
                    page_chunks = self._chunk_text(text, page_num)
                    chunks.extend(page_chunks)
            
            return {
                "filename": file.filename,
                "total_pages": len(pdf_reader.pages),
                "chunks": chunks
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

    def _chunk_text(self, text: str, page_num: int):
        """
        Splits text into chunks with overlap.
        """
        chunks = []
        start = 0
        text_len = len(text)
        
        while start < text_len:
            end = start + self.chunk_size
            chunk_text = text[start:end]
            
            chunks.append({
                "page_number": page_num + 1,
                "text": chunk_text
            })
            
            start += self.chunk_size - self.chunk_overlap
            
        return chunks
