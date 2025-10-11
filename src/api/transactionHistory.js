import axios from 'axios'

// Base URL for API
const API_BASE_URL = 'http://127.0.0.1:5000'

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            // Redirect to login if needed
            if (window.location.pathname !== '/pages/website/login') {
                window.location.href = '/pages/website/login'
            }
        }
        return Promise.reject(error)
    }
)

/**
 * Fetch transaction history for the authenticated user
 * @returns {Promise<Array>} Array of user transactions with booking and payment details
 */
export const fetchTransactionHistory = async () => {
    try {
        const response = await api.get('/transaction-history')
        return response.data
    } catch (error) {
        console.error('Error fetching transaction history:', error)
        throw new Error(error.response?.data?.error || 'Failed to fetch transaction history')
    }
}

/**
 * Fetch transaction summary statistics for the authenticated user
 * @returns {Promise<Object>} Summary statistics object
 */
export const fetchTransactionSummary = async () => {
    try {
        const response = await api.get('/transaction-summary')
        return response.data
    } catch (error) {
        console.error('Error fetching transaction summary:', error)
        throw new Error(error.response?.data?.error || 'Failed to fetch transaction summary')
    }
}

export default {
    fetchTransactionHistory,
    fetchTransactionSummary
}