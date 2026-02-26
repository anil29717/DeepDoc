import mysql.connector
from config import settings

def create_tables():
    conn = mysql.connector.connect(
        host=settings.MYSQL_HOST,
        user=settings.MYSQL_USER,
        password=settings.MYSQL_PASSWORD,
        database=settings.MYSQL_DATABASE
    )
    cursor = conn.cursor()
    
    # Drop tables to ensure schema update
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
    cursor.execute("DROP TABLE IF EXISTS messages")
    cursor.execute("DROP TABLE IF EXISTS conversations")
    cursor.execute("DROP TABLE IF EXISTS documents")
    cursor.execute("DROP TABLE IF EXISTS users")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

    # Create Users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(100),
        hashed_password VARCHAR(255),
        is_active TINYINT DEFAULT 1,
        is_admin TINYINT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Create Folders
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS folders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        name VARCHAR(100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)
    
    # Create Documents
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        folder_id INT NULL,
        filename VARCHAR(255),
        file_path VARCHAR(500),
        chroma_collection_id VARCHAR(100) UNIQUE,
        page_count INT,
        status ENUM('PROCESSING', 'READY', 'FAILED') DEFAULT 'PROCESSING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
    )
    """)
    
    # Create Conversations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        document_id INT NULL,
        folder_id INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
        FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
    )
    """)
    
    # Create Messages
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT,
        role ENUM('USER', 'ASSISTANT'),
        content TEXT,
        tokens_used INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    )
    """)
    
    conn.commit()
    cursor.close()
    conn.close()
    print("Tables created manually.")

if __name__ == "__main__":
    create_tables()
