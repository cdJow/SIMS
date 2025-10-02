<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useToast } from "primevue/usetoast";
import axios from 'axios';

// Configuration
const API_BASE_URL = 'http://localhost:5000';
const toast = useToast();

const stockMovements = ref([]); // Full stock movement data
const filteredStockMovements = ref([]); // Filtered stock movement data
const isLoading = ref(true);
const errorMessage = ref("");
const searchQuery = ref(""); // Reactive search query
const stockSummary = ref([]);
const autoRefreshInterval = ref(null);
const lastRefreshTime = ref(null);
const isAutoRefresh = ref(true);
const isUpdating = ref(false);
const isExporting = ref(false);

// Get auth token from localStorage
const getAuthToken = () => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('access_token') || '';
    console.log('🔑 Auth token found:', token ? 'Yes (length: ' + token.length + ')' : 'No');
    return token;
};

// Fetch stock movements data
onMounted(() => {
    fetchStockMovements();
    fetchStockSummary();
    startAutoRefresh();
});

// Cleanup on unmount
onUnmounted(() => {
    stopAutoRefresh();
});

// Auto-refresh functionality
function startAutoRefresh() {
    if (autoRefreshInterval.value) return;
    
    // Refresh every 60 seconds to prevent flickering
    autoRefreshInterval.value = setInterval(() => {
        if (isAutoRefresh.value) {
            console.log('🔄 Auto-refreshing stock movements...');
            fetchStockMovements(true); // true = silent refresh
        }
    }, 60000);
}

function stopAutoRefresh() {
    if (autoRefreshInterval.value) {
        clearInterval(autoRefreshInterval.value);
        autoRefreshInterval.value = null;
    }
}

function toggleAutoRefresh() {
    isAutoRefresh.value = !isAutoRefresh.value;
    if (isAutoRefresh.value) {
        startAutoRefresh();
    } else {
        stopAutoRefresh();
    }
} 

// Fetch function with error handling - directly from backend API
async function fetchStockMovements(silentRefresh = false) {
    // Prevent overlapping requests
    if (silentRefresh && isUpdating.value) {
        console.log("📊 Skipping refresh - already updating");
        return;
    }
    
    if (!silentRefresh) {
        isLoading.value = true;
        errorMessage.value = "";
    } else {
        isUpdating.value = true;
    }
    
    try {
        const token = getAuthToken();
        
        if (!token) {
            console.warn('⚠️ No authentication token found. Trying without auth...');
        }
        
        // Add timestamp to avoid cache and get latest data
        const timestamp = new Date().getTime();
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Only add Authorization header if token exists
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        console.log('🌐 Making request to:', `${API_BASE_URL}/stock-movements`);
        console.log('📋 Request headers:', headers);
        
        const response = await axios.get(`${API_BASE_URL}/stock-movements?t=${timestamp}`, {
            headers,
            timeout: 10000 // 10 second timeout
        });
        
        if (response.data && Array.isArray(response.data)) {
            const newData = response.data;
            const previousCount = stockMovements.value.length;
            
            // For silent refresh, only update if there's actually new data
            if (silentRefresh) {
                // Check if data actually changed by comparing first and last item IDs (much faster than JSON.stringify)
                const dataChanged = newData.length !== previousCount || 
                                  (newData.length > 0 && stockMovements.value.length > 0 && 
                                   (newData[0].id !== stockMovements.value[0].id || 
                                    newData[newData.length-1].id !== stockMovements.value[stockMovements.value.length-1].id));
                
                if (dataChanged) {
                    stockMovements.value = newData;
                    filteredStockMovements.value = newData;
                    lastRefreshTime.value = new Date();
                    console.log(`📊 Silent refresh: Updated ${newData.length} stock movements`);
                } else {
                    console.log("📊 Silent refresh: No changes detected, keeping existing data");
                }
            } else {
                // For manual refresh, always update
                stockMovements.value = newData;
                filteredStockMovements.value = newData;
                lastRefreshTime.value = new Date();
                console.log("Stock movements fetched successfully:", newData.length, "records");
                
                // Debug: Show all unique action types
                const actionTypes = [...new Set(newData.map(m => m.actionType))];
                console.log("📋 Found action types:", actionTypes);
            }
        } else {
            console.warn("No stock movement data received");
            // Only clear data for manual refresh, keep existing data for silent refresh
            if (!silentRefresh) {
                stockMovements.value = [];
                filteredStockMovements.value = [];
            }
        }
        
        // Clear error message on successful fetch
        if (errorMessage.value && !silentRefresh) {
            errorMessage.value = "";
        }
        
    } catch (error) {
        console.error("❌ Error fetching stock movements:", error);
        console.error("📊 Error details:", {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            config: error.config
        });
        
        if (!silentRefresh) {
            if (error.code === 'ECONNABORTED') {
                errorMessage.value = "Connection timeout. Please check if the backend server is running.";
            } else if (error.response?.status === 401) {
                errorMessage.value = "Authentication failed. Please log in again.";
            } else if (error.response?.status === 500) {
                errorMessage.value = `Server error: ${error.response?.data?.error || 'Internal server error'}`;
            } else if (error.code === 'ECONNREFUSED') {
                errorMessage.value = "Cannot connect to server. Please check if the backend is running on port 5000.";
            } else {
                errorMessage.value = error.response?.data?.error || error.message || "Failed to load stock movements data.";
            }
            
            // Fallback to empty array on error
            stockMovements.value = [];
            filteredStockMovements.value = [];
        } else {
            console.warn("Silent refresh failed, keeping existing data");
        }
    } finally {
        if (!silentRefresh) {
            isLoading.value = false;
        } else {
            isUpdating.value = false;
        }
    }
}

// Fetch stock summary for additional insights
async function fetchStockSummary() {
    try {
        const token = getAuthToken();
        const response = await axios.get(`${API_BASE_URL}/stock-summary`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data && Array.isArray(response.data)) {
            stockSummary.value = response.data;
            console.log("Stock summary fetched successfully:", response.data.length, "products");
        }
        
    } catch (error) {
        console.error("Error fetching stock summary:", error);
    }
}

// Note: fetchTodaysActivities removed - all data is already included in main stock-movements endpoint

// Watch search input and filter stock movements
const filteredData = computed(() => {
    if (!searchQuery.value.trim()) {
        return stockMovements.value;
    }
    return stockMovements.value.filter((movement) =>
        Object.values(movement).some((value) =>
            String(value)
                .toLowerCase()
                .includes(searchQuery.value.toLowerCase())
        )
    );
});

// Clear search input
const clearFilters = () => {
    searchQuery.value = "";
};

// Export stock movements to CSV
function exportStockMovements() {
    isExporting.value = true;
    
    try {
        // Check if we have data to export
        if (!filteredData.value || filteredData.value.length === 0) {
            toast.add({
                severity: 'warn',
                summary: 'No Data to Export',
                detail: searchQuery.value ? 'No movements match your current search criteria.' : 'No stock movements available to export.',
                life: 3000
            });
            console.warn('No stock movements data to export');
            return;
        }
        
        // Show loading toast
        toast.add({
            severity: 'info',
            summary: 'Exporting...',
            detail: 'Preparing CSV file for download.',
            life: 2000
        });
        
        // Prepare data for CSV export with proper field names
        const exportData = filteredData.value.map(movement => ({
            'Date/Time': formatDateTime(movement.dateTime),
            'Item Name': movement.itemName || '',
            'Action Type': movement.actionType || '',
            'Quantity Changed': movement.qtyChanged || 0,
            'Current Balance': movement.balance || 0,
            'Reference/Batch': movement.reference || '',
            'Source Type': movement.reference || 'Other',
            'Notes': movement.notes || '',
            'Record ID': movement.id || ''
        }));
        
        // Convert to CSV format
        const csvContent = convertToCSV(exportData);
        
        // Generate filename with current date and time
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
        const filename = `stock_movements_${dateStr}_${timeStr}.csv`;
        
        // Download the file
        downloadCSV(csvContent, filename);
        
        // Show success toast
        toast.add({
            severity: 'success',
            summary: 'Export Successful',
            detail: `${exportData.length} stock movements exported successfully.`,
            life: 4000
        });
        
        console.log(`✅ Exported ${exportData.length} stock movement records to ${filename}`);
        
    } catch (error) {
        console.error('❌ Error exporting stock movements:', error);
        
        // Show error toast
        toast.add({
            severity: 'error',
            summary: 'Export Failed',
            detail: 'Failed to export stock movements data.',
            life: 5000
        });
        
        errorMessage.value = "Failed to export stock movements data.";
    } finally {
        isExporting.value = false;
    }
}

// Convert data to CSV format
function convertToCSV(data) {
    if (!data || data.length === 0) {
        console.warn('No data to convert to CSV');
        return '';
    }
    
    try {
        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');
        
        const csvRows = data.map(row => {
            return headers.map(header => {
                let value = row[header];
                
                // Handle null/undefined values
                if (value === null || value === undefined) {
                    value = '';
                }
                
                // Convert to string
                value = String(value);
                
                // Escape commas, quotes, and newlines in CSV
                if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
                    value = `"${value.replace(/"/g, '""')}"`;
                }
                
                return value;
            }).join(',');
        });
        
        return [csvHeaders, ...csvRows].join('\n');
    } catch (error) {
        console.error('❌ Error converting to CSV:', error);
        throw new Error('Failed to convert data to CSV format');
    }
}

// Download CSV file
function downloadCSV(csvContent, filename) {
    try {
        if (!csvContent) {
            throw new Error('No content to download');
        }
        
        // Create blob with UTF-8 BOM for proper Excel compatibility
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // Check if browser supports download
        const link = document.createElement('a');
        if (link.download === undefined) {
            throw new Error('Browser does not support file downloads');
        }
        
        // Create download link
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        // Add to DOM, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        console.log('✅ CSV file downloaded successfully:', filename);
        
    } catch (error) {
        console.error('❌ Error downloading CSV:', error);
        throw new Error('Failed to download CSV file');
    }
}

// Refresh data
function refreshData() {
    console.log('🔄 Manual refresh triggered');
    fetchStockMovements(false); // Force full refresh
    fetchStockSummary();
}

// Force refresh (bypass cache)
function forceRefresh() {
    console.log('🔄 Force refresh triggered');
    // Clear existing data first
    stockMovements.value = [];
    filteredStockMovements.value = [];
    errorMessage.value = "";
    
    fetchStockMovements(false);
    fetchStockSummary();
}

// Format date and time utility
function formatDateTime(dateTime) {
    if (!dateTime) return "N/A";
    const options = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    };
    return new Date(dateTime).toLocaleString("en-US", options);
}

// Get action type color class
function getActionTypeColor(actionType) {
    switch (actionType) {
        case 'Inventory Addition':
        case 'Stock In': return 'text-green-600 dark:text-green-400';
        case 'Sale':
        case 'Stock Out': return 'text-red-600 dark:text-red-400';
        case 'Resolve': return 'text-emerald-600 dark:text-emerald-400';
        case 'Damage': return 'text-orange-600 dark:text-orange-400';
        case 'Damage Report': return 'text-orange-600 dark:text-orange-400'; // Backward compatibility
        case 'Rental Charge': return 'text-purple-600 dark:text-purple-400';
        case 'Room Assigned': return 'text-blue-600 dark:text-blue-400';
        case 'Adjustment': return 'text-yellow-600 dark:text-yellow-400';
        default: return 'text-gray-600 dark:text-gray-400';
    }
}
</script>

<template>
    <div class="card">
        <!-- Header -->
        <div class="flex justify-between items-center mb-4">
            <div>
                <div class="flex items-center gap-2">
                    <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-100">
                        Stock Movement History
                    </h3>
                    <div class="flex items-center gap-1">
                        <div 
                            class="w-2 h-2 rounded-full" 
                            :class="isAutoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'"
                        ></div>
                        <span class="text-xs text-gray-500 dark:text-gray-400">
                            {{ isAutoRefresh ? 'Live' : 'Paused' }}
                        </span>
                    </div>
                </div>
            
            </div>
            <div class="flex gap-2">
                <Button
                    :icon="isAutoRefresh ? 'pi pi-pause' : 'pi pi-play'"
                    :label="isAutoRefresh ? 'Pause' : 'Auto'"
                    class="p-button-sm"
                    :class="isAutoRefresh ? 'p-button-warning' : 'p-button-success'"
                    @click="toggleAutoRefresh"
                />
                <Button
                    icon="pi pi-refresh"
                    label="Refresh"
                    class="p-button-sm p-button-secondary"
                    @click="refreshData"
                    :loading="isLoading"
                />
                <Button
                    icon="pi pi-sync"
                    label="Force"
                    class="p-button-sm p-button-help"
                    @click="forceRefresh"
                    :loading="isLoading"
                    title="Force refresh - clears cache and reloads all data"
                />
                <Button
                    icon="pi pi-download"
                    label="Export CSV"
                    class="p-button-sm p-button-primary"
                    @click="exportStockMovements"
                    :loading="isExporting"
                    :disabled="stockMovements.length === 0"
                />
            </div>
        </div>
        
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-8">
            <div class="inline-flex items-center">
                <i class="pi pi-spinner pi-spin mr-2"></i>
                <span class="text-gray-600 dark:text-gray-400">Loading stock movements...</span>
            </div>
        </div>
        
        <!-- Error State -->
        <div v-if="errorMessage && !isLoading" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div class="flex items-center">
                <i class="pi pi-exclamation-triangle text-red-600 dark:text-red-400 mr-2"></i>
                <span class="text-red-700 dark:text-red-300">{{ errorMessage }}</span>
            </div>
        </div>
        
        <!-- Stats Cards -->
        <div v-if="!isLoading && stockMovements.length > 0" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-lg p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Movements</p>
                        <p class="text-2xl font-bold text-blue-800 dark:text-blue-200">{{ stockMovements.length }}</p>
                    </div>
                    <i class="pi pi-chart-line text-blue-500 text-2xl"></i>
                </div>
            </div>
            
            <div class="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 rounded-lg p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-green-600 dark:text-green-400 text-sm font-medium">Stock In</p>
                        <p class="text-2xl font-bold text-green-800 dark:text-green-200">{{ stockMovements.filter(m => ['Inventory Addition', 'Stock In'].includes(m.actionType)).length }}</p>
                    </div>
                    <i class="pi pi-arrow-up text-green-500 text-2xl"></i>
                </div>
            </div>
            
            <div class="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 rounded-lg p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-red-600 dark:text-red-400 text-sm font-medium">Stock Out</p>
                        <p class="text-2xl font-bold text-red-800 dark:text-red-200">{{ stockMovements.filter(m => ['Sale', 'Stock Out'].includes(m.actionType)).length }}</p>
                    </div>
                    <i class="pi pi-arrow-down text-red-500 text-2xl"></i>
                </div>
            </div>
            
            <div class="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 rounded-lg p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-orange-600 dark:text-orange-400 text-sm font-medium">Damage Reports</p>
                        <p class="text-2xl font-bold text-orange-800 dark:text-orange-200">{{ stockMovements.filter(m => ['Damage', 'Resolve'].includes(m.actionType)).length }}</p>
                    </div>
                    <i class="pi pi-exclamation-triangle text-orange-500 text-2xl"></i>
                </div>
            </div>
        </div>
        
        <!-- Today's Activities Alert -->
        <div v-if="!isLoading" class="mb-4">
            <div 
                v-if="stockMovements.filter(m => {
                    const today = new Date().toDateString();
                    const moveDate = new Date(m.dateTime).toDateString();
                    return today === moveDate;
                }).length > 0" 
                class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
            >
                <div class="flex items-center gap-2">
                    <i class="pi pi-check-circle text-green-600 dark:text-green-400"></i>
                    <span class="text-green-700 dark:text-green-300 font-medium">
                        {{ stockMovements.filter(m => {
                            const today = new Date().toDateString();
                            const moveDate = new Date(m.dateTime).toDateString();
                            return today === moveDate;
                        }).length }} stock movement(s) detected today
                    </span>
                    <span class="text-green-600 dark:text-green-400 text-sm ml-auto">
                        ✨ Including your recent additions!
                    </span>
                </div>
            </div>
            
            <div 
                v-else 
                class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
            >
                <div class="flex items-center gap-2">
                    <i class="pi pi-info-circle text-blue-600 dark:text-blue-400"></i>
                    <span class="text-blue-700 dark:text-blue-300">
                        No stock activities today. This shows only when you actually add items, create batches, or assign serial numbers.
                    </span>
                </div>
            </div>
        </div>
        <!-- Search and Filters -->
        <div v-if="!isLoading" class="flex flex-wrap items-center gap-4 mb-4">
            <!-- Clear Button -->
            <Button
                type="button"
                icon="pi pi-filter-slash"
                label="Clear"
                outlined
                class="p-button-sm"
                @click="clearFilters"
                :disabled="!searchQuery"
            />

            <!-- Keyword Search -->
            <IconField class="flex-1 max-w-md">
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText
                    id="search"
                    v-model="searchQuery"
                    placeholder="Search by item name, action, reference..."
                    class="w-full"
                />
            </IconField>
            
            <!-- Results count -->
            <span class="text-sm text-gray-600 dark:text-gray-400">
                Showing {{ filteredData.length }} of {{ stockMovements.length }} movements
            </span>
        </div>

        <!-- Data Table -->
        <DataTable
            v-if="!isLoading"
            :value="filteredData"
            :rows="15"
            :paginator="true"
            :responsiveLayout="'scroll'"
            class="p-datatable-lg"
            :globalFilterFields="['itemName', 'actionType', 'reference', 'notes']"
            :emptyMessage="filteredData.length === 0 ? (searchQuery ? 'No movements match your search criteria.' : 'No stock movements found.') : ''"
            :loading="isLoading"
            :scrollable="true"
            scrollHeight="500px"
        >
            <!-- Date/Time Column -->
            <Column field="dateTime" header="Date/Time" sortable>
                <template #body="slotProps">
                    <span class="text-gray-600 dark:text-gray-400 py-2 block">
                        {{ formatDateTime(slotProps.data.dateTime) }}
                    </span>
                </template>
            </Column>

            <!-- Item Name Column -->
            <Column field="itemName" header="Item Name" sortable>
                <template #body="slotProps">
                    <span class="text-gray-700 dark:text-gray-200 py-2 block">
                        {{ slotProps.data.itemName }}
                    </span>
                </template>
            </Column>

            <!-- Action Type Column -->
            <Column field="actionType" header="Action Type" sortable>
                <template #body="slotProps">
                    <span
                        class="py-2 block font-semibold"
                        :class="getActionTypeColor(slotProps.data.actionType)"
                    >
                        {{ slotProps.data.actionType }}
                    </span>
                </template>
            </Column>

            <!-- Qty Changed Column -->
            <Column
                field="qtyChanged"
                header="Qty Changed"
                sortable
                style="text-align: center"
            >
                <template #body="slotProps">
                    <span
                        class="py-2 block"
                        :class="{
                            'text-green-500': slotProps.data.qtyChanged > 0,
                            'text-red-500': slotProps.data.qtyChanged < 0,
                        }"
                    >
                        {{
                            slotProps.data.qtyChanged > 0
                                ? "+" + slotProps.data.qtyChanged
                                : slotProps.data.qtyChanged
                        }}
                    </span>
                </template>
            </Column>

            <!-- Quantity Total Column -->
            <Column
                field="balance"
                header="Quantity Total"
                sortable
                style="text-align: center"
            >
                <template #body="slotProps">
                    <span
                        class="text-gray-800 dark:text-gray-200 font-medium py-2 block"
                    >
                        {{ slotProps.data.balance }}
                    </span>
                </template>
            </Column>
            
            <!-- Reference Column -->
            <Column field="reference" header="Source" sortable>
                <template #body="slotProps">
                    <div class="py-2">
                        <span class="text-gray-600 dark:text-gray-400 text-sm">
                            {{ slotProps.data.reference || 'N/A' }}
                        </span>
                        <div class="text-xs mt-1">
                            <span 
                                class="px-2 py-1 rounded-full text-xs font-medium"
                                :class="{
                                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300': slotProps.data.reference === 'Inventory',
                                    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300': slotProps.data.reference === 'POS',
                                    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300': slotProps.data.reference === 'Damage Report' || slotProps.data.reference === 'Damage',
                                    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300': slotProps.data.reference === 'Assigned',
                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300': slotProps.data.reference === 'Rental',
                                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300': slotProps.data.reference === 'Manual',
                                    'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300': !['Inventory', 'POS', 'Damage Report', 'Damage', 'Assigned', 'Rental', 'Manual'].includes(slotProps.data.reference)
                                }"
                            >
                                {{ slotProps.data.reference || 'Other' }}
                            </span>
                        </div>
                    </div>
                </template>
            </Column>
            
            <!-- Notes Column -->
            <Column field="notes" header="Notes" sortable>
                <template #body="slotProps">
                    <span class="text-gray-600 dark:text-gray-400 py-2 block text-sm" :title="slotProps.data.notes">
                        {{ (slotProps.data.notes || 'N/A').length > 50 ? (slotProps.data.notes || 'N/A').substring(0, 50) + '...' : (slotProps.data.notes || 'N/A') }}
                    </span>
                </template>
            </Column>
        </DataTable>
        
        <!-- Empty State -->
        <div v-if="!isLoading && stockMovements.length === 0 && !errorMessage" class="text-center py-12">
            <i class="pi pi-inbox text-6xl text-gray-300 dark:text-gray-600 mb-4 block"></i>
            <h3 class="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No Stock Movements Yet</h3>
            <p class="text-gray-500 dark:text-gray-500 mb-4">
                This page shows your real stock activities:<br>
                • When you add items to inventory<br>
                • When you create batches<br>
                • When serial numbers are assigned or sold<br><br>
                Start adding inventory to see movements here!
            </p>
            <Button
                icon="pi pi-refresh"
                label="Check Again"
                class="p-button-primary"
                @click="refreshData"
            />
        </div>
        
        <!-- Toast for notifications -->
        <Toast position="top-right" />
    </div>
</template>
