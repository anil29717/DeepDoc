import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { MessageSquare, Mail, Lock, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const res = await login(email, password);
        if (res.success) {
            navigate('/app');
        } else {
            setError(res.message || 'Login failed');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <Link to="/" className="inline-flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
                            <MessageSquare size={22} />
                        </div>
                        <span className="text-2xl font-black tracking-tight">DeepDoc AI</span>
                    </Link>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back</h1>
                    <p className="text-slate-500 font-medium">Enter your credentials to access your library</p>
                </div>

                <div className="bg-white p-10 rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-200">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-1">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/5 focus:border-primary-400 transition-all font-medium"
                                    placeholder="email or username"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Password</label>
                                <a href="#" className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700">Forgot?</a>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/5 focus:border-primary-400 transition-all font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-bold transition-all shadow-xl shadow-slate-200 hover:shadow-2xl hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <>Sign In <ChevronRight size={18} /></>}
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm font-medium text-slate-500">
                    Don't have an account? <Link to="/signup" className="text-primary-600 font-bold hover:underline">Create one for free</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
