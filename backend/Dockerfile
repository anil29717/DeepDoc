# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for PyMuPDF and MySQL client
RUN apt-get update && apt-get install -y \
    gcc \
    libmariadb-dev-compat \
    libmariadb-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn pymysql

# Copy application code
COPY . .

# Create directory for ChromaDB
RUN mkdir -p /app/chroma_db

# Expose port
EXPOSE 8000

# Run with gunicorn for production
CMD ["gunicorn", "main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]