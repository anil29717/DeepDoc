import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            console.warn("Unauthorized access detected. Logging out...");
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export const folderApi = {
    create: (name) => api.post('/api/folders', { name }),
    list: () => api.get('/api/folders'),
    getDocuments: (id) => api.get(`/api/folders/${id}/documents`),
    delete: (id) => api.delete(`/api/folders/${id}`),
};

export const documentApi = {
    upload: (file, folderId = null) => {
        const formData = new FormData();
        formData.append('file', file);
        const url = folderId ? `/api/documents/upload?folder_id=${folderId}` : '/api/documents/upload';
        return api.post(url, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    list: () => api.get('/api/documents'),
    delete: (id) => api.delete(`/api/documents/${id}`),
};

export const chatApi = {
    ask: (question, { documentId = null, folderId = null }) => {
        const payload = { question };
        if (documentId) payload.document_id = documentId;
        if (folderId) payload.folder_id = folderId;
        return api.post('/api/chat/ask', payload);
    },
    getHistory: (id, isFolder = false) =>
        api.get(`/api/chat/history/${id}${isFolder ? '?is_folder=true' : ''}`),
};

export default api;
