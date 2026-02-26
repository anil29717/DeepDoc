import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const res = await api.post('/api/auth/login', { email, password });
            const { access_token, user } = res.data;
            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            return { success: true };
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || err.response?.data?.detail || "Connection failed"
            };
        }
    };

    const signup = async (email, password, name) => {
        try {
            await api.post('/api/auth/signup', { email, password, name });
            return { success: true };
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || err.response?.data?.detail || "Connection failed"
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
