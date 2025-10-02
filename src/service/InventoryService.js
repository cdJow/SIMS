export const InventoryService = {
    // Get auth token helper
    getAuthToken() {
        return localStorage.getItem('authToken') || '';
    },

    // Fetch real low-stock items from backend API
    async getLowStockItems() {
        try {
            console.log('� Fetching low stock report (test mode)');

            const response = await fetch('http://localhost:5000/low-stock-report-test', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                throw new Error(`Server error: ${response.status} - ${response.statusText}`);
            }

            const result = await response.json();
            console.log('🔍 Low Stock API Response:', result);
            
            // Return the data array from the API response
            return result.data || [];
        } catch (error) {
            console.error('❌ Error fetching low stock items:', error);
            throw error;
        }
    },

    // Fetch stock alerts for dashboard
    async getStockAlerts() {
        try {
            const token = this.getAuthToken();
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }

            const response = await fetch('http://localhost:5000/stock-alerts', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 422 || response.status === 401) {
                    throw new Error('Authentication failed. Please log in again.');
                }
                throw new Error(`Server error: ${response.status} - ${response.statusText}`);
            }

            const result = await response.json();
            return result.alerts || [];
        } catch (error) {
            console.error('❌ Error fetching stock alerts:', error);
            throw error;
        }
    },

    // Export low stock report (currently unused - using client-side export)
    async exportLowStockReport() {
        try {
            console.log('📤 Note: Using client-side export instead of server export');
            
            // This method is currently not used since we're doing client-side export
            // But keeping it for future server-side export implementation
            const token = this.getAuthToken();
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }

            const response = await fetch('http://localhost:5000/export-low-stock', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 422 || response.status === 401) {
                    throw new Error('Authentication failed. Please log in again.');
                }
                throw new Error(`Server error: ${response.status} - ${response.statusText}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('❌ Error exporting low stock report:', error);
            throw error;
        }
    },

    // Fetch real expired items from backend API
    async getExpiredItems() {
        try {
            console.log('🔍 Fetching expired items (test mode)');

            const response = await fetch('http://localhost:5000/test-expired-items', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                throw new Error(`Server error: ${response.status} - ${response.statusText}`);
            }

            const result = await response.json();
            console.log('🔍 Expired Items API Response:', result);
            
            // Return the data array from the API response
            return result.data || [];
        } catch (error) {
            console.error('❌ Error fetching expired items:', error);
            throw error;
        }
    },

    // Fetch real near expire items from backend API
    async getNearExpireItems() {
        try {
            console.log('🔍 Fetching near expire items (test mode)');

            const response = await fetch('http://localhost:5000/test-near-expire-items', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                throw new Error(`Server error: ${response.status} - ${response.statusText}`);
            }

            const result = await response.json();
            console.log('🔍 Near Expire Items API Response:', result);
            
            // Return the data array from the API response
            return result.data || [];
        } catch (error) {
            console.error('❌ Error fetching near expire items:', error);
            throw error;
        }
    },

    // Fetch stock movements summary from backend API
    async getStockMovementsSummary() {
        try {
            console.log('📊 Fetching stock movements summary');

            const token = this.getAuthToken();
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }

            const response = await fetch('http://localhost:5000/stock-movements', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                if (response.status === 422 || response.status === 401) {
                    throw new Error('Authentication failed. Please log in again.');
                }
                throw new Error(`Server error: ${response.status} - ${response.statusText}`);
            }

            const result = await response.json();
            console.log('📊 Stock Movements API Response:', result);
            
            // Transform the data to match the expected format for StockMovement.vue
            const transformedData = result.map(movement => ({
                itemName: movement.itemName || 'Unknown Item',
                movementType: movement.qtyChanged > 0 ? 'Addition' : 'Reduction',
                quantity: Math.abs(movement.qtyChanged),
                date: movement.dateTime,
                remarks: movement.actionType || 'Stock Movement'
            }));
            
            console.log('📊 Transformed stock movements:', transformedData);
            return transformedData;
        } catch (error) {
            console.error('❌ Error fetching stock movements summary:', error);
            throw error;
        }
    },
};
