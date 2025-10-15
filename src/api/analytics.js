// API functions for analytics and charts
import axios from 'axios'

const API_BASE_URL = 'http://127.0.0.1:5000'

// Set up axios defaults
axios.defaults.baseURL = API_BASE_URL

// Request interceptor to add auth token
axios.interceptors.request.use(
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

/**
 * Get popular rooms analytics data
 * @param {string} mode - 'weekly', 'monthly', or 'yearly'
 * @param {string} periodKey - Period key like 'W-2025-10-07_2025-10-13'
 * @param {number} limit - Maximum number of rooms to return
 * @returns {Promise} API response with popular rooms data
 */
export const getPopularRooms = async (mode = 'weekly', periodKey = '', limit = 30) => {
  try {
    const params = {
      mode,
      limit
    }
    
    if (periodKey) {
      params.period_key = periodKey
    }
    
    const response = await axios.get('/analytics/popular-rooms', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching popular rooms:', error)
    throw error
  }
}

/**
 * Get room occupancy trends for multiple periods
 * @param {string} mode - 'weekly', 'monthly', or 'yearly'
 * @param {number} periods - Number of periods to fetch
 * @returns {Promise} API response with trend data
 */
export const getRoomTrends = async (mode = 'weekly', periods = 12) => {
  try {
    // This could be extended to fetch multiple periods for trend analysis
    // For now, we'll use the popular rooms endpoint
    const response = await axios.get('/analytics/popular-rooms', {
      params: { mode, limit: 30 }
    })
    return response.data
  } catch (error) {
    console.error('Error fetching room trends:', error)
    throw error
  }
}

export default {
  getPopularRooms,
  getRoomTrends
}