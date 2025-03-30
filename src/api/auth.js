import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000';

export const signup = (name, email, password, role = 'user') => {
    return axios.post(`${API_URL}/signup`, { name, email, password, role });
};

export const login = (email, password) => {
    return axios.post(`${API_URL}/login`, { email, password });
};

export const getDashboardData = async (token) => {
    return axios.get(`${API_URL}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
