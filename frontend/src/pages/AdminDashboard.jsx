import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Users, Upload, Shield, Search, UserPlus, Loader2, CheckCircle2, AlertCircle, ChevronRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [allDocuments, setAllDocuments] = useState([]);
    const [loading, setLoading] = useState({ fetch: true, upload: false, files: true });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [uploadFile, setUploadFile] = useState(null);

    useEffect(() => {
        fetchUsers();
        fetchAllDocuments();
    }, []);

    const fetchAllDocuments = async () => {
        try {
            const res = await api.get('/api/admin/documents');
            setAllDocuments(res.data);
        } catch (err) {
            console.error("Failed to load documents", err);
        } finally {
            setLoading(prev => ({ ...prev, files: false }));
        }
    };

    const toggleUserStatus = async (user) => {
        try {
            await api.patch(`/api/admin/users/${user.id}/status`);
            setUsers(prev => prev.map(u =>
                u.id === user.id ? { ...u, is_active: u.is_active === 1 ? 0 : 1 } : u
            ));
        } catch (err) {
            setError("Failed to update status");
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/api/admin/users');
            setUsers(res.data);
        } catch (err) {
            setError("Failed to load users");
        } finally {
            setLoading(prev => ({ ...prev, fetch: false }));
        }
    };

    const handleAdminUpload = async (e) => {
        e.preventDefault();
        if (!selectedUserId || !uploadFile) return;

        setLoading(prev => ({ ...prev, upload: true }));
        setError('');
        setSuccess('');

        const formData = new FormData();
        formData.append('file', uploadFile);

        try {
            await api.post(`/api/admin/upload-for-user?user_id=${selectedUserId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccess("Document uploaded successfully for user!");
            setUploadFile(null);
        } catch (err) {
            setError(err.response?.data?.detail || "Upload failed");
        } finally {
            setLoading(prev => ({ ...prev, upload: false }));
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-slate-900 text-white px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Shield size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight uppercase">Admin Control Panel</h1>
                        <p className="text-indigo-300 text-[10px] font-black tracking-[0.2em] uppercase">Enterprise Management</p>
                    </div>
                </div>
                <Link to="/app" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                    Back to Dashboard <ChevronRight size={16} />
                </Link>
            </header>

            <main className="flex-1 p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User Management */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-200">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                                <Users className="text-primary-600" size={24} />
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Users</h2>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl flex items-center gap-2">
                                <Search size={16} className="text-slate-400" />
                                <input type="text" placeholder="Search accounts..." className="bg-transparent text-sm outline-none font-medium w-40" />
                            </div>
                        </div>

                        {loading.fetch ? (
                            <div className="flex flex-col items-center justify-center py-20 grayscale opacity-20">
                                <Loader2 className="animate-spin mb-4" size={40} />
                                <p className="font-bold tracking-widest uppercase">Fetching User Database...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                            <th className="pb-4 pl-2">User</th>
                                            <th className="pb-4">Email</th>
                                            <th className="pb-4">Role</th>
                                            <th className="pb-4">Status</th>
                                            <th className="pb-4">ID</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {users.map(u => (
                                            <tr key={u.id} className="group hover:bg-slate-50 transition-colors">
                                                <td className="py-4 pl-2 font-black text-slate-900">{u.name}</td>
                                                <td className="py-4 text-slate-500 font-medium">{u.email}</td>
                                                <td className="py-4">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${u.is_admin ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100' : 'bg-slate-50 text-slate-500 ring-1 ring-slate-100'}`}>
                                                        {u.is_admin ? 'Admin' : 'User'}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <button
                                                        onClick={() => toggleUserStatus(u)}
                                                        className={`flex items-center gap-1.5 text-xs font-bold transition-all hover:opacity-70 px-3 py-1.5 rounded-xl ${u.is_active ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' : 'bg-red-50 text-red-600 ring-1 ring-red-100'
                                                            }`}
                                                    >
                                                        <div className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                                        {u.is_active ? 'Active' : 'Inactive'}
                                                    </button>
                                                </td>
                                                <td className="py-4 text-slate-300 font-mono text-xs">#{u.id}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Admin Actions */}
                <div className="space-y-8">
                    <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-200 h-fit">
                        <div className="flex items-center gap-2 mb-6">
                            <Upload className="text-orange-500" size={24} />
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admin Upload</h2>
                        </div>
                        <p className="text-slate-500 text-sm font-medium mb-6 leading-relaxed">
                            Force-upload a document directly into any user's private library. Use with caution.
                        </p>

                        <form onSubmit={handleAdminUpload} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold ring-1 ring-red-100">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold ring-1 ring-emerald-100">
                                    <CheckCircle2 size={16} />
                                    {success}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Target User</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/5 transition-all font-bold text-slate-700"
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    required
                                >
                                    <option value="">Select an account...</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Document Source</label>
                                <div className="border-2 border-dashed border-slate-100 rounded-3xl p-8 hover:border-primary-400 transition-colors cursor-pointer text-center group bg-slate-50/50 relative">
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => setUploadFile(e.target.files[0])}
                                        accept=".pdf"
                                    />
                                    {uploadFile ? (
                                        <div className="flex flex-col items-center gap-2 animate-in zoom-in-95">
                                            <FileText className="text-primary-600" size={32} />
                                            <span className="text-sm font-black text-slate-900 truncate max-w-full italic">{uploadFile.name}</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 grayscale group-hover:grayscale-0 transition-all opacity-40 group-hover:opacity-100">
                                            <Upload size={32} />
                                            <span className="text-xs font-black uppercase tracking-tighter">Choose PDF</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading.upload || !selectedUserId || !uploadFile}
                                className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-bold transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-30 disabled:grayscale"
                            >
                                {loading.upload ? <Loader2 className="animate-spin" /> : <>Process Administrative Upload <ChevronRight size={18} /></>}
                            </button>
                        </form>
                    </div>
                </div>
            </main>

            {/* Global Files Section */}
            <div className="p-8 max-w-7xl mx-auto w-full">
                <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-200">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <FileText className="text-orange-600" size={24} />
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Global Files</h2>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl flex items-center gap-2">
                            <Search size={16} className="text-slate-400" />
                            <input type="text" placeholder="Filter files..." className="bg-transparent text-sm outline-none font-medium w-40" />
                        </div>
                    </div>

                    {loading.files ? (
                        <div className="flex flex-col items-center justify-center py-20 grayscale opacity-20">
                            <Loader2 className="animate-spin mb-4" size={40} />
                            <p className="font-bold tracking-widest uppercase">Scanning Global Storage...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                        <th className="pb-4 pl-2">Filename</th>
                                        <th className="pb-4">Owner</th>
                                        <th className="pb-4">Status</th>
                                        <th className="pb-4">Uploaded</th>
                                        <th className="pb-4">ID</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {allDocuments.map(doc => (
                                        <tr key={doc.id} className="group hover:bg-slate-50 transition-colors">
                                            <td className="py-4 pl-2 font-black text-slate-900 flex items-center gap-2">
                                                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                                                    <FileText size={16} />
                                                </div>
                                                {doc.filename}
                                            </td>
                                            <td className="py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">{doc.owner.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium">{doc.owner.email}</span>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${doc.status === 'READY' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' : 'bg-orange-50 text-orange-600 ring-1 ring-orange-100'
                                                    }`}>
                                                    {doc.status}
                                                </span>
                                            </td>
                                            <td className="py-4 text-slate-500 font-medium text-xs">
                                                {new Date(doc.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="py-4 text-slate-300 font-mono text-xs">#{doc.id}</td>
                                        </tr>
                                    ))}
                                    {allDocuments.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest grayscale opacity-30">
                                                No documents found in ecosystem
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
