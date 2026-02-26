import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Upload, Zap, Shield, ChevronRight, Files } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary-100 selection:text-primary-700">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary-200">
                        <MessageSquare size={18} />
                    </div>
                    <span className="text-lg font-black tracking-tight">DeepDoc AI</span>
                </div>
                <div className="flex items-center gap-6">
                    <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Login</Link>
                    <Link to="/signup" className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-all shadow-xl shadow-slate-200 hover:scale-105 active:scale-95">Get Started</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-40 pb-20 px-8">
                <div className="max-w-6xl mx-auto text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ring-1 ring-primary-100"
                    >
                        <Zap size={14} fill="currentColor" />
                        Next-Gen RAG Intelligence
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 leading-[0.9]"
                    >
                        Interact with your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">Documents</span> like never before.
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-xl text-slate-500 max-w-2xl mx-auto font-medium"
                    >
                        DeepDoc AI uses enterprise-grade RAG to turn your PDFs into interactive knowledge stores. Instant answers, cited sources, and seamless collaboration.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
                    >
                        <Link to="/signup" className="w-full sm:w-auto bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-2xl shadow-slate-300 hover:scale-105 flex items-center justify-center gap-2">
                            Start Chatting for Free <ChevronRight size={20} />
                        </Link>
                        <button className="w-full sm:w-auto bg-white border border-slate-200 text-slate-600 px-10 py-5 rounded-2xl font-bold text-lg hover:border-slate-300 transition-all flex items-center justify-center gap-2">
                            Watch Demo
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 px-8 bg-white border-y border-slate-100">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            { icon: <Upload className="text-orange-500" />, title: "Instant Indexing", desc: "Upload multi-gigabyte PDFs and start chatting in seconds. High-performance vector processing." },
                            { icon: <Files className="text-blue-500" />, title: "Smart Folders", desc: "Group related documents and query across your entire project library simultaneously." },
                            { icon: <Shield className="text-emerald-500" />, title: "Enterprise Security", desc: "Your data is encrypted and partitioned. We prioritize privacy and document integrity." }
                        ].map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="space-y-4 p-8 rounded-3xl hover:bg-slate-50 transition-colors group"
                            >
                                <div className="w-14 h-14 bg-white shadow-xl shadow-slate-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    {f.icon}
                                </div>
                                <h3 className="text-xl font-black text-slate-900">{f.title}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Proof Placeholder */}
            <section className="py-20 px-8 text-center bg-slate-50">
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-10">Trusted by modern engineering teams</p>
                <div className="flex flex-wrap justify-center items-center gap-12 opacity-30 grayscale underline cursor-default font-black text-2xl italic">
                    <span>TECH_CORP</span>
                    <span>AI_STUDIO</span>
                    <span>DEV_LABS</span>
                    <span>DATA_FLOW</span>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-10 px-8 border-t border-slate-100 text-center">
                <p className="text-slate-400 text-sm font-medium">© 2026 DeepDoc AI. Built for the future of document intelligence.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
