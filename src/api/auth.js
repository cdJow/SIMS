import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000';

// Set axios base URL for all requests
axios.defaults.baseURL = API_URL;

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

// 2b. Fetch available amenities specifically for AddRoom (more lenient filtering)
export function getAvailableAmenitiesAddRoom() {
    return axios.get(`${API_URL}/available-amenities-addroom`);
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

// Room serial numbers (assigned amenities)
export const getRoomSerialNumbers = (roomId) =>
  axios.get(`${API_URL}/rooms/${roomId}/serial-numbers`);


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

// Extend an occupied/active booking
export function extendBooking(bookingId, payload) {
  return axios.put(`${API_URL}/bookings/${bookingId}/extend`, payload);
}


export async function checkoutRoom(roomId, payload = {}) {
  return axios.put(`${API_URL}/rooms/${roomId}/checkout`, payload);
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
export function fetchAmenityRentals() {
  return axios.get(`${API_URL}/pos/amenity-rentals`);
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

export const fetchDiscounts = (params = {}) =>
  axios.get(`${API_URL}/discounts`, { params }); // e.g. { status: 'active' }

// Check-in payments (store payment header + amenity charges)
export function createCheckinPayment(payload){
  return axios.post(`${API_URL}/checkin-payments`, payload);
}

// Update the latest check-in payment note for a room/booking
export function updateCheckinPaymentNote(payload){
  // payload: { room_id: number, booking_id?: number, note: string }
  return axios.put(`${API_URL}/checkin-payments/note`, payload);
}

export function updateCheckinPaymentAmount(payload){
  // payload: { room_id: number, booking_id?: number, amount_received?: number, total_due?: number, change_amount?: number, deposit_amount?: number, damage_charges?: number }
  return axios.put(`${API_URL}/checkin-payments/amount`, payload);
}

export function extendCheckinPayment(payload){
  // payload: { room_id, booking_id?, extend_hours, extend_amount, amount_received, change_amount }
  return axios.put(`${API_URL}/checkin-payments/extend`, payload);
}

export function updateCheckinPaymentExtras(payload){
  // payload: { room_id, booking_id?, extras_total, amenities_total, extras_bill_id?, amenities? }
  return axios.put(`${API_URL}/checkin-payments/extras`, payload);
}

// Fetch check-in list with payment information
export function fetchCheckInList() {
  return axios.get(`${API_URL}/check-in-list`);
}

// Fetch check-out list with payment information
export function fetchCheckOutList() {
  return axios.get(`${API_URL}/check-out-list`);
}

// Damage Reports API
export function fetchRoomsForDamageReport() {
  return axios.get(`${API_URL}/damage-reports/rooms`);
}

export function fetchRoomAmenitiesWithDamageStatus(roomId) {
  return axios.get(`${API_URL}/damage-reports/rooms/${roomId}/amenities`);
}

export function createDamageReport(damageData) {
  return axios.post(`${API_URL}/damage-reports`, damageData);
}

export function updateDamageReport(damageReportId, updateData) {
  return axios.put(`${API_URL}/damage-reports/${damageReportId}`, updateData);
}

export function removeDamageReport(damageReportId) {
  return axios.delete(`${API_URL}/damage-reports/${damageReportId}`);
}

export function exportDamageReports() {
  return axios.get(`${API_URL}/damage-reports/export`, {
    responseType: 'blob'
  });
}

export function exportRoomDamageReports(roomId) {
  return axios.get(`${API_URL}/damage-reports/export/room/${roomId}`, {
    responseType: 'blob'
  });
}

// Room Invoice Admin API
export function fetchRoomInvoiceAdmin() {
  return axios.get(`${API_URL}/room-invoice-admin`);
}

export function deleteRoomInvoice(invoiceId) {
  return axios.delete(`${API_URL}/room-invoice-admin/${invoiceId}`);
}

export function fetchInvoiceSummary() {
  return axios.get(`${API_URL}/room-invoice-admin/summary`);
}

// Manage Items API
export const getProductsWithItems = () => {
  return axios.get(`${API_URL}/manage-items/products`);
}

export const getProductsSimple = () => {
  return axios.get(`${API_URL}/manage-items/products/simple`);
}

// Update product
export const updateProduct = (productId, productData) => {
  return axios.put(`${API_URL}/manage-items/product/${productId}`, productData);
}

// Delete product
export const deleteProductById = (productId) => {
  return axios.delete(`${API_URL}/manage-items/product/${productId}`);
}

// Update batch
export const updateBatch = (batchId, batchData) => {
  return axios.put(`${API_URL}/manage-items/batch/${batchId}`, batchData);
}

// Delete batch
export const deleteBatchById = (batchId) => {
  return axios.delete(`${API_URL}/manage-items/batch/${batchId}`);
}

// Delete serial number
export const deleteSerialById = (serialNumber) => {
  return axios.delete(`${API_URL}/manage-items/serial/${serialNumber}`);
}

// Assign item to room
export const assignItemToRoom = (serialNumber, roomId) => {
  return axios.post(`${API_URL}/manage-items/assign-to-room`, {
    serialNumber,
    roomId
  });
}

// Unassign item from room
export const unassignItemFromRoom = (serialNumber) => {
  return axios.post(`${API_URL}/manage-items/unassign-from-room`, {
    serialNumber
  });
}

// Update serial number
export const updateSerialNumber = (serialId, serialData) => {
  return axios.put(`${API_URL}/manage-items/serial/${serialId}`, serialData);
}

// Rental Summary APIs
export const getRentalSummary = () => {
  return axios.get(`${API_URL}/rental-summary`);
}

export const getRentalItems = () => {
  return axios.get(`${API_URL}/rental-items`);
}

export const getRentalCategories = () => {
  return axios.get(`${API_URL}/rental-categories`);
}

export const getLowStockRentals = () => {
  return axios.get(`${API_URL}/low-stock-rentals`);
}

// Stock Movement APIs (using StockTable endpoints)
export const getStockMovements = () => {
  return axios.get(`${API_URL}/stock-movements`);
}

export const forceRefreshStockMovements = () => {
  return axios.post(`${API_URL}/force-refresh-stock-movements`);
}

export const debugStockData = () => {
  return axios.get(`${API_URL}/debug-stock-data`);
}

// Revenue Stats API
export const getRevenueStats = () => {
  return axios.get(`${API_URL}/stats/revenue`);
}

export const getRevenueBreakdown = (period, offset) => {
  return axios.get(`${API_URL}/revenue-breakdown-chart`, {
    params: { period, offset }
  });
};

export const getCategoryBreakdown = (period) => {
  return axios.get(`${API_URL}/category-breakdown-chart`, {
    params: { period }
  });
}

