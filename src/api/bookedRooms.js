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
 * Fetch all available rooms
 * @returns {Promise<Array>} Array of available rooms
 */
export const fetchAvailableRooms = async () => {
    try {
        const response = await api.get('/available-rooms')
        return response.data
    } catch (error) {
        console.error('Error fetching available rooms:', error)
        throw new Error(error.response?.data?.error || 'Failed to fetch available rooms')
    }
}

/**
 * Fetch details for a specific room
 * @param {number} roomId - The ID of the room
 * @returns {Promise<Object>} Room details
 */
export const fetchRoomDetails = async (roomId) => {
    try {
        const response = await api.get(`/room-details/${roomId}`)
        return response.data
    } catch (error) {
        console.error('Error fetching room details:', error)
        throw new Error(error.response?.data?.error || 'Failed to fetch room details')
    }
}

/**
 * Fetch current user's bookings (requires authentication)
 * @returns {Promise<Array>} Array of user bookings
 */
export const fetchUserBookings = async () => {
    try {
        const response = await api.get('/user-bookings')
        return response.data
    } catch (error) {
        console.error('Error fetching user bookings:', error)
        throw new Error(error.response?.data?.error || 'Failed to fetch user bookings')
    }
}

/**
 * Create a new room booking
 * @param {Object} bookingData - Booking information
 * @returns {Promise<Object>} Booking confirmation
 */
export const createBooking = async (bookingData) => {
    try {
        const response = await api.post('/create-booking', bookingData)
        return response.data
    } catch (error) {
        console.error('Error creating booking:', error)
        throw new Error(error.response?.data?.error || 'Failed to create booking')
    }
}

/**
 * Cancel a booking
 * @param {number} bookingId - The ID of the booking to cancel
 * @returns {Promise<Object>} Cancellation confirmation
 */
export const cancelBooking = async (bookingId) => {
    try {
        const response = await api.put(`/cancel-booking/${bookingId}`)
        return response.data
    } catch (error) {
        console.error('Error canceling booking:', error)
        throw new Error(error.response?.data?.error || 'Failed to cancel booking')
    }
}

/**
 * Check and automatically cancel expired bookings
 * @returns {Promise<Object>} Expiration check results
 */
export const checkExpiredBookings = async () => {
    try {
        const response = await api.post('/check-expired-bookings')
        return response.data
    } catch (error) {
        console.error('Error checking expired bookings:', error)
        throw new Error(error.response?.data?.error || 'Failed to check expired bookings')
    }
}

/**
 * Fetch all guest bookings (created_by_guest = 1)
 * @returns {Promise<Array>} Array of guest bookings with status updates
 */
export const fetchGuestBookings = async () => {
    try {
        const response = await api.get('/guest-bookings')
        return response.data
    } catch (error) {
        console.error('Error fetching guest bookings:', error)
        throw new Error(error.response?.data?.error || 'Failed to fetch guest bookings')
    }
}

export default {
    fetchAvailableRooms,
    fetchRoomDetails,
    fetchUserBookings,
    createBooking,
    cancelBooking,
    checkExpiredBookings,
    fetchGuestBookings
}