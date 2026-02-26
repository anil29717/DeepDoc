import React, { useState, useEffect, useRef } from 'react';
import { Upload, MessageSquare, Files, Heart, Trash2, Send, Loader2, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { documentApi, chatApi, folderApi } from './services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AdminDashboard from './pages/AdminDashboard';
import { useAuth } from './context/AuthContext';
import { Shield } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-primary-600" size={40} />
    </div>
  );
  if (!user) return <Navigate to="/" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-primary-600" size={40} />
    </div>
  );
  if (!user || !user.is_admin) return <Navigate to="/app" />;
  return children;
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [loading, setLoading] = useState({
    uploading: false,
    chatting: false,
    fetchingDocs: false,
    fetchingHistory: false,
    creatingFolder: false
  });
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
    fetchFolders();
  }, []);

  useEffect(() => {
    if (selectedDoc && activeTab === 'chat') {
      setSelectedFolder(null); // Clear folder context when doc is selected
      loadChatHistory(selectedDoc.id, false);
    }
  }, [selectedDoc, activeTab]);

  useEffect(() => {
    if (selectedFolder && activeTab === 'chat') {
      setSelectedDoc(null); // Clear doc context when folder is selected
      loadChatHistory(selectedFolder.id, true);
    }
  }, [selectedFolder, activeTab]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchDocuments = async () => {
    setLoading(prev => ({ ...prev, fetchingDocs: true }));
    try {
      const res = await documentApi.list();
      setDocuments(res.data);
      if (res.data && res.data.length > 0 && !selectedDoc && !selectedFolder) {
        setSelectedDoc(res.data[0]);
      }
    } catch (err) {
      console.error("Fetch documents failed:", err.response || err);
      setError("Failed to fetch documents");
    } finally {
      setLoading(prev => ({ ...prev, fetchingDocs: false }));
    }
  };

  const fetchFolders = async () => {
    try {
      const res = await folderApi.list();
      setFolders(res.data);
    } catch (err) {
      console.error("Failed to fetch folders", err);
    }
  };

  const createFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setLoading(prev => ({ ...prev, creatingFolder: true }));
    try {
      const res = await folderApi.create(newFolderName);
      setFolders(prev => [...prev, res.data]);
      setNewFolderName('');
      setShowFolderModal(false);
    } catch (err) {
      setError("Failed to create folder");
    } finally {
      setLoading(prev => ({ ...prev, creatingFolder: false }));
    }
  };

  const loadChatHistory = async (id, isFolder) => {
    setLoading(prev => ({ ...prev, fetchingHistory: true }));
    try {
      const res = await chatApi.getHistory(id, isFolder);
      setMessages(res.data);
    } catch (err) {
      console.error("Load history failed:", err.response || err);
    } finally {
      setLoading(prev => ({ ...prev, fetchingHistory: false }));
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    setLoading(prev => ({ ...prev, uploading: true }));
    setUploadProgress({ current: 0, total: files.length });
    setError(null);
    try {
      let count = 0;
      for (const file of files) {
        const res = await documentApi.upload(file, selectedFolder?.id);
        count++;
        setUploadProgress({ current: count, total: files.length });
        // Only switch view if it's the last file and we are currently not in a folder chat
        if (!selectedFolder) {
          setSelectedDoc(res.data);
          setActiveTab('chat');
        }
      }
      await fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed");
    } finally {
      setLoading(prev => ({ ...prev, uploading: false }));
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || (!selectedDoc && !selectedFolder) || loading.chatting) return;

    const userMsg = { role: 'USER', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(prev => ({ ...prev, chatting: true }));

    try {
      const res = await chatApi.ask(input, {
        documentId: selectedDoc?.id,
        folderId: selectedFolder?.id
      });
      setMessages(prev => [...prev, { role: 'ASSISTANT', content: res.data.answer }]);
    } catch (err) {
      console.error("Ask query failed:", err.response || err);
      setError("Failed to get response");
    } finally {
      setLoading(prev => ({ ...prev, chatting: false }));
    }
  };

  const deleteDoc = async (id) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      await documentApi.delete(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      if (selectedDoc?.id === id) setSelectedDoc(null);
    } catch (err) {
      setError("Delete failed");
    }
  };

  const deleteFolder = async (id) => {
    if (!window.confirm("Delete this folder? This will NOT delete the files inside, but they will become uncategorized.")) return;
    try {
      await folderApi.delete(id);
      setFolders(prev => prev.filter(f => f.id !== id));
      // Refresh docs to show them as uncategorized
      await fetchDocuments();
      if (selectedFolder?.id === id) setSelectedFolder(null);
    } catch (err) {
      setError("Delete failed");
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm z-20">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
              <MessageSquare size={20} />
            </div>
            <span>DeepDoc AI</span>
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">Main</div>
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'chat'
              ? 'bg-primary-50 text-primary-600 font-bold shadow-sm ring-1 ring-primary-100'
              : 'text-slate-600 hover:bg-slate-50'
              }`}
          >
            <MessageSquare size={18} />
            Chat Room
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'docs'
              ? 'bg-primary-50 text-primary-600 font-bold shadow-sm ring-1 ring-primary-100'
              : 'text-slate-600 hover:bg-slate-50'
              }`}
          >
            My Library
          </button>

          {useAuth().user?.is_admin && (
            <Link
              to="/admin"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-indigo-600 hover:bg-indigo-50 font-bold border border-indigo-100/50 shadow-sm"
            >
              <Shield size={18} />
              Admin Panel
            </Link>
          )}

          <div className="pt-6 px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center justify-between">
            Folders & Documents
            <button onClick={() => setShowFolderModal(true)} className="text-primary-600 hover:text-primary-700">
              <span className="text-xl">+</span>
            </button>
          </div>
          <div className="space-y-4">
            {folders.map(folder => (
              <div key={folder.id} className="space-y-1 group/folder relative">
                <button
                  onClick={() => { setSelectedFolder(folder); setActiveTab('chat'); }}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm truncate transition-colors flex items-center gap-2 pr-10 ${selectedFolder?.id === folder.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50 font-semibold'
                    }`}
                >
                  <span className="text-lg">📁</span> {folder.name}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                  className="absolute right-2 top-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover/folder:opacity-100 transition-all"
                >
                  <Trash2 size={14} />
                </button>
                <div className="ml-6 border-l border-slate-200 pl-2 space-y-1">
                  {documents.filter(d => d.folder_id === folder.id).map(doc => (
                    <div key={doc.id} className="group/file relative">
                      <button
                        onClick={() => { setSelectedDoc(doc); setActiveTab('chat'); }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs truncate transition-colors pr-8 ${selectedDoc?.id === doc.id ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-500 hover:bg-slate-50'
                          }`}
                      >
                        📄 {doc.filename}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteDoc(doc.id); }}
                        className="absolute right-1 top-1.5 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover/file:opacity-100 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {documents.filter(d => d.folder_id === folder.id).length === 0 && (
                    <div className="px-3 py-1.5 text-[10px] text-slate-400 italic">No files</div>
                  )}
                </div>
              </div>
            ))}

            {/* Uncategorized Files */}
            <div className="space-y-1">
              <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Uncategorized</div>
              <div className="ml-4 space-y-1">
                {documents.filter(d => !d.folder_id).map(doc => (
                  <div key={doc.id} className="group/file relative">
                    <button
                      onClick={() => { setSelectedDoc(doc); setActiveTab('chat'); }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs truncate transition-colors pr-8 ${selectedDoc?.id === doc.id ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                      📄 {doc.filename}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteDoc(doc.id); }}
                      className="absolute right-1 top-1.5 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover/file:opacity-100 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf"
            multiple
          />
          <button
            onClick={() => fileInputRef.current.click()}
            disabled={loading.uploading}
            className="w-full bg-white border border-slate-200 hover:border-primary-300 hover:shadow-md py-3 rounded-xl text-sm font-semibold text-slate-700 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading.uploading ? <Loader2 className="animate-spin text-primary-600" size={18} /> : <Upload size={18} className="text-slate-400 group-hover:text-primary-600" />}
            {loading.uploading
              ? `Processing ${uploadProgress.current}/${uploadProgress.total} (${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%)`
              : 'Upload New PDF'}
          </button>
        </div>

        <div className="p-4 border-t border-slate-100 mt-auto">
          <button
            onClick={() => useAuth().logout()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
          >
            <X size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative bg-slate-50">
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              {activeTab === 'chat' ? 'Current Session' : 'Documents Library'}
            </h2>
            {(selectedDoc || selectedFolder) && activeTab === 'chat' && (
              <>
                <div className="w-1 h-4 bg-slate-200 rounded-full" />
                <span className="text-sm font-semibold text-slate-700 truncate max-w-[200px]">
                  {selectedFolder ? `📁 ${selectedFolder.name}` : selectedDoc?.filename}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {error && (
              <div className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-full flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={14} />
                {error}
                <button onClick={() => setError(null)}><X size={14} /></button>
              </div>
            )}
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs ring-2 ring-white">
              JD
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-hidden relative">
          {activeTab === 'chat' ? (
            <div className="h-full flex flex-col">
              {/* Chat View */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {(!selectedDoc && !selectedFolder) ? (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-700">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary-400 blur-3xl opacity-20 animate-pulse" />
                      <div className="relative w-24 h-24 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-primary-200">
                        <Upload size={40} strokeWidth={2.5} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Ready to analyze?</h3>
                      <p className="text-slate-500 mt-3 leading-relaxed font-medium">Upload a PDF document or select a Folder to start a multi-file conversation.</p>
                    </div>
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="group relative bg-slate-900 hover:bg-black text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95"
                    >
                      Browse Files
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full border-2 border-white scale-0 group-hover:scale-100 transition-transform duration-300" />
                    </button>
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto space-y-8 pb-32">
                    {messages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role?.toUpperCase() === 'USER' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`max-w-[85%] rounded-3xl px-6 py-4 shadow-sm ${msg.role?.toUpperCase() === 'USER'
                          ? 'bg-primary-600 text-white font-medium rounded-tr-none'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                          }`}>
                          {msg.role?.toUpperCase() === 'USER' ? (
                            msg.content
                          ) : (
                            <div className="prose prose-sm prose-slate max-w-none 
                              prose-p:leading-relaxed 
                              prose-strong:text-slate-900 
                              prose-strong:font-black 
                              prose-strong:bg-primary-50 
                              prose-strong:px-1 
                              prose-strong:rounded-sm
                              prose-pre:bg-slate-900 
                              prose-pre:text-slate-100 
                              prose-li:my-1">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {loading.uploading && (
                      <div className="flex justify-start animate-in fade-in duration-300">
                        <div className="bg-blue-50 border border-blue-100 rounded-3xl rounded-tl-none px-6 py-4 shadow-sm flex items-center gap-3">
                          <Loader2 className="animate-spin text-blue-600" size={18} />
                          <span className="text-sm font-bold text-blue-600 tracking-widest uppercase">
                            Processing {uploadProgress.current}/{uploadProgress.total} ({Math.round((uploadProgress.current / uploadProgress.total) * 100)}%)
                          </span>
                        </div>
                      </div>
                    )}
                    {loading.chatting && (
                      <div className="flex justify-start animate-in fade-in duration-300">
                        <div className="bg-white border border-slate-200 rounded-3xl rounded-tl-none px-6 py-4 shadow-sm flex items-center gap-3">
                          <Loader2 className="animate-spin text-primary-500" size={18} />
                          <span className="text-sm font-bold text-slate-400 tracking-widest uppercase">Analyzing...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input Area */}
              {(selectedDoc || selectedFolder) && (
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent">
                  <form
                    onSubmit={handleSendMessage}
                    className="max-w-4xl mx-auto flex items-center gap-2 bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-200 p-2 focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-500/5 transition-all"
                  >
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={`Ask about ${selectedFolder ? selectedFolder.name : (selectedDoc?.filename || 'document')}...`}
                      className="flex-1 px-4 py-3 outline-none text-slate-800 font-medium placeholder:text-slate-400"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || loading.chatting}
                      className="w-12 h-12 bg-slate-900 hover:bg-black disabled:bg-slate-200 text-white rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95"
                    >
                      <Send size={20} />
                    </button>
                  </form>
                  <p className="text-center text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-4">Powered by RAG & DeepDoc LLM Pipeline</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full p-8 max-w-6xl mx-auto overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Your Digital Library</h3>
                <div className="text-xs font-bold text-slate-400 tracking-widest uppercase">{documents.length} Files Total</div>
              </div>

              {documents.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                    <Files size={32} />
                  </div>
                  <h4 className="font-bold text-slate-700">No documents found</h4>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto">Upload documents to see them listed here and start chatting.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {documents.map(doc => (
                    <div
                      key={doc.id}
                      className={`relative overflow-hidden bg-white border ${selectedDoc?.id === doc.id ? 'border-primary-500 ring-2 ring-primary-50' : 'border-slate-200'} p-6 rounded-3xl hover:shadow-2xl hover:shadow-slate-200 transition-all group`}
                    >
                      <div className="h-40 bg-slate-50 rounded-2xl mb-5 flex items-center justify-center text-slate-200 group-hover:text-primary-100 transition-colors">
                        <Files size={56} strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate pr-8">{doc.filename}</h4>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${doc.status === 'READY' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                            {doc.status}
                          </span>
                          {doc.folder_id && (
                            <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 uppercase tracking-widest px-2 py-1 rounded-md">
                              📁 {folders.find(f => f.id === doc.folder_id)?.name || 'Folder'}
                            </span>
                          )}
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{doc.page_count} Pages</span>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteDoc(doc.id)}
                        className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>

                      <button
                        onClick={() => { setSelectedDoc(doc); setActiveTab('chat'); }}
                        className="mt-6 w-full py-3 bg-slate-50 group-hover:bg-primary-600 group-hover:text-white rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 transition-all"
                      >
                        Open Chat
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Folder Creation Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Create New Folder</h3>
              <button onClick={() => setShowFolderModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={createFolder} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Folder Name</label>
                <input
                  type="text"
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Project Alpha"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-4 focus:ring-primary-500/5 outline-none font-medium transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading.creatingFolder || !newFolderName.trim()}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading.creatingFolder ? <Loader2 size={18} className="animate-spin" /> : 'Create Folder'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/app" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
