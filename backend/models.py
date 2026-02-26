from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

class DocumentStatus(enum.Enum):
    PROCESSING = "PROCESSING"
    READY = "READY"
    FAILED = "FAILED"

class Folder(Base):
    __tablename__ = "folders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="folders")
    documents = relationship("Document", back_populates="folder")
    conversations = relationship("Conversation", back_populates="folder")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    name = Column(String(100))
    hashed_password = Column(String(255))
    is_active = Column(Integer, default=1) # 1 for True, 0 for False
    is_admin = Column(Integer, default=0) # 1 for True, 0 for False
    created_at = Column(DateTime, default=datetime.utcnow)

    documents = relationship("Document", back_populates="user")
    folders = relationship("Folder", back_populates="user")

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    filename = Column(String(255))
    file_path = Column(String(500))
    chroma_collection_id = Column(String(100), unique=True)
    page_count = Column(Integer)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.PROCESSING)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="documents")
    folder = relationship("Folder", back_populates="documents")

# User.documents = relationship("Document", order_by=Document.id, back_populates="user")

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    folder = relationship("Folder", back_populates="conversations")

class Role(enum.Enum):
    USER = "USER"
    ASSISTANT = "ASSISTANT"

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    role = Column(Enum(Role))
    content = Column(Text)
    tokens_used = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
