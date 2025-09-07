import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000';



// -- Axios interceptor for JWT (put at the top of your file) --
axios.interceptors.request.use(
  (config) => {
    if (!config.url.endsWith("/login") && !config.url.endsWith("/signup")) {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      window.location.href = "/pages/auth/login";
    }
    return Promise.reject(error);
  }
);



export const signup = (name, email, password, role = 'user') => {
    return axios.post(`${API_URL}/signup`, { name, email, password, role });
};

export const login = (email, password) => {
    return axios.post(`${API_URL}/login`, { email, password });
};

export const getDashboardData = async () => {
  return axios.get(`${API_URL}/dashboard`);
};

export const addItem = (itemData) =>
  axios.post(`${API_URL}/add-item`, itemData);

export const addProduct = (productData) => {
  return axios.post(`${API_URL}/products/add`, productData);
};

export const getProducts = () => {
  return axios.get(`${API_URL}/products`);
};


export const generateBatchNumber = (product_id) =>
  axios.post(`${API_URL}/generate-batch-number`, { product_id });

export const generateSerialNumbers = (product_id, quantity) =>
  axios.post(`${API_URL}/generate-serial-numbers`, { product_id, quantity });

export const getCurrentQuantity = async (productId) => {
  return axios.get(`${API_URL}/product/${productId}/current-quantity`);
};


// ROOM CATEGORIES
export const fetchRoomCategories = () => axios.get(`${API_URL}/room-categories`);
export const addRoomCategory = (payload) => axios.post(`${API_URL}/room-categories`, payload);
export const updateRoomCategory = (id, payload) => axios.put(`${API_URL}/room-categories/${id}`, payload);
export const deleteRoomCategory = (id) => axios.delete(`${API_URL}/room-categories/${id}`);

// ROOM TYPES
export const fetchRoomTypes = () => axios.get(`${API_URL}/room-types`);
export const addRoomType = (payload) => axios.post(`${API_URL}/room-types`, payload);
export const updateRoomType = (id, payload) => axios.put(`${API_URL}/room-types/${id}`, payload);
export const deleteRoomType = (id) => axios.delete(`${API_URL}/room-types/${id}`);

// DISCOUNT
export const applyRoomTypeDiscount = (id, payload) => axios.post(`${API_URL}/room-types/${id}/discount`, payload);
export const removeRoomTypeDiscount = (id) => axios.delete(`${API_URL}/room-types/${id}/discount`);



/////////////////////////////////////
// 1. Fetch all room types
export function getRoomTypes() {
    return axios.get(`${API_URL}/room-types`);
}

// 2. Fetch all available amenities (serial numbers)
// Fetch all available amenities (serial numbers)
export function getAvailableAmenities() {
    return axios.get(`${API_URL}/available-amenities`);
}



// 3. Add a new room
export function addRoom(roomData) {
    // roomData should be a FormData object!
    return axios.post(`${API_URL}/add-room`, roomData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
}

// 4. (Optional) Get all rooms (for listing)
export function getRooms() {
    return axios.get(`${API_URL}/rooms`);
}

export const getSerialTypes = () => axios.get(`${API_URL}/serial-types`);


// Fetch all rooms
export async function fetchRooms() {
  return await axios.get(`${API_URL}/rooms`);
}

export const uploadRoomImage = (roomId, formData) =>
  axios.post(`http://127.0.0.1:5000/rooms/${roomId}/upload-image`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });


// Fetch all serial numbers
export async function fetchSerialNumbers() {
  return await axios.get(`${API_URL}/serial-numbers`);
}

// Get serial numbers assigned to a room
export async function getRoomSerialNumbers(roomId) {
  return await axios.get(`${API_URL}/rooms/${roomId}/serial-numbers`);
}

// Update a room (PUT)
export async function updateRoom(roomId, payload) {
  return await axios.put(`${API_URL}/rooms/${roomId}`, payload);
}

// Update assigned serial numbers
export const updateRoomSerialNumbers = (roomId, data) => {
  return axios.put(`${API_URL}/rooms/${roomId}/serial-numbers`, data);
}


// Delete a room
export async function deleteRoom(roomId) {
  return await axios.delete(`${API_URL}/rooms/${roomId}`);
}

export const getUsers = () => axios.get(`${API_URL}/users`);
export const addUser = (user) => axios.post(`${API_URL}/users/add`, user);
export function updateUser(userId, payload) {
    return axios.put(`${API_URL}/users/${userId}`, payload);
}
export const deleteUser = (id) => axios.delete(`${API_URL}/users/${id}`);

// Now send both current_password and new_password
export const resetUserPassword = (id, payload) =>
  axios.post(`${API_URL}/users/${id}/reset-password`, payload);

export const uploadUserImage = (id, formData) => axios.post(`${API_URL}/users/${id}/upload-image`, formData);
// If you have logs API:
export const getUserLogs = (id) => axios.get(`${API_URL}/users/${id}/logs`);

export const adminResetUserPassword = (id, payload) =>
  axios.post(`${API_URL}/users/${id}/admin-reset-password`, payload);



export function getCurrentUser(userId) {
    return axios.get(`${API_URL}/user/${userId}`);
}

export const logoutUserLog = (userId) =>
    axios.post(`${API_URL}/logout`, { user_id: userId });


export const updateUserProfile = (userId, formData) =>
    axios.post(`${API_URL}/users/${userId}/update-profile`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });


export async function getRoomTypeRates(typeId) {
    return axios.get(`${API_URL}/room-type/${typeId}/rates`);
}

export async function bookRoom(bookingData) {
    return axios.post(`${API_URL}/bookings`, bookingData);
}

export async function fetchLatestBooking(roomId) {
    return axios.get(`${API_URL}/bookings/room/${roomId}/latest`);
}

export async function cancelBooking(bookingId) {
  return axios.delete(`${API_URL}/bookings/${bookingId}`);
}

export async function checkInBooking(bookingId, payload = {}) {
  return axios.put(`${API_URL}/bookings/${bookingId}/checkin`, payload);
}

export async function checkoutRoom(roomId) {
  return axios.put(`${API_URL}/rooms/${roomId}/checkout`);
}

export async function cleaningComplete(roomId) {
  return axios.put(`${API_URL}/rooms/${roomId}/cleaning-complete`);
}

export async function setRoomMaintenance(roomId) {
  return axios.put(`${API_URL}/rooms/${roomId}/maintenance`);
}



// 1. Fetch all consumable products for POS
export function fetchPOSProducts() {
    return axios.get(`${API_URL}/pos/products`);
}
export function posCheckout(data) {
    return axios.post(`${API_URL}/pos/checkout`, data);
}
export function fetchBills() {
    return axios.get(`${API_URL}/pos/bills`);
}
export function deleteBill(id) {
    return axios.delete(`${API_URL}/pos/bills/${id}`);
}

export function fetchPOSPreview(data) {
  return axios.post(`${API_URL}/pos/preview`, data); // expects {items:[{id,quantity}]}
}

// Cancelled bookings API
export function fetchCancelledBookings() {
  return axios.get(`${API_URL}/bookings/cancelled`);
}
export function deleteCancelledBooking(bookingId) {
  return axios.delete(`${API_URL}/bookings/cancelled/${bookingId}`);
}


export async function getDiscounts(params = {}) {
  // params: { q?: string, active?: 0|1 }
  return axios.get(`${API_URL}/discounts`, { params });
}

export async function addDiscount(payload) {
  // payload: { name: string, percent: number, active?: boolean, starts_at?: string, ends_at?: string }
  return axios.post(`${API_URL}/discounts`, payload);
}

export async function updateDiscount(id, payload) {
  // payload: { name: string, percent: number, active?: boolean, starts_at?: string, ends_at?: string }
  return axios.put(`${API_URL}/discounts/${id}`, payload);
}

export async function deleteDiscount(id) {
  return axios.delete(`${API_URL}/discounts/${id}`);
}