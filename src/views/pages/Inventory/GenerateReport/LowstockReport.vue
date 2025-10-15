<script setup>
import { InventoryService } from "@/service/InventoryService"; // Inventory service
import { computed, onMounted, ref } from "vue";
import { useToast } from "primevue/usetoast";

const toast = useToast();
const lowStockItems = ref([]); // Reactive variable for low stock report
const isLoading = ref(true); // Loading state
const errorMessage = ref(""); // Error state for API call
const searchQuery = ref(""); // Search input
const reportSummary = ref(null); // Report summary stats
const isExporting = ref(false); // Export loading state

// Fetch low stock items
onMounted(() => {
    fetchLowStockItems();
});

// Fetch function to get real low stock data
// Check if user is authenticated
function checkAuthentication() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.log('❌ No auth token found');
        return false;
    }
    console.log('✅ Auth token found');
    return true;
}

async function fetchLowStockItems() {
    isLoading.value = true;
    errorMessage.value = "";
    
    console.log('🔍 Fetching low stock data (test mode)...');
    
    try {
        const response = await InventoryService.getLowStockItems();
        console.log('📋 Low Stock Data:', response);
        
        // Handle the response structure
        if (Array.isArray(response)) {
            lowStockItems.value = response;
        } else if (response.data && Array.isArray(response.data)) {
            lowStockItems.value = response.data;
            reportSummary.value = response.summary;
        } else {
            lowStockItems.value = [];
        }
        
        if (lowStockItems.value.length === 0) {
            toast.add({
                severity: 'success',
                summary: 'Great News!',
                detail: 'All items are properly stocked.',
                life: 3000
            });
        } else {
            toast.add({
                severity: 'warn',
                summary: 'Stock Alert',
                detail: `${lowStockItems.value.length} items need attention.`,
                life: 3000
            });
        }
        
    } catch (error) {
        console.error("❌ Error fetching low stock items:", error);
        
        errorMessage.value = "Failed to load low stock report. Please try again.";
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to load low stock report.',
            life: 5000
        });
    } finally {
        isLoading.value = false;
    }
}

// Export low stock report
function exportReport() {
    isExporting.value = true;
    
    try {
        // Check if we have data to export
        if (!filteredItems.value || filteredItems.value.length === 0) {
            toast.add({
                severity: 'warn',
                summary: 'No Data',
                detail: 'No low stock items to export.',
                life: 3000
            });
            return;
        }
        
        // Prepare data for CSV export
        const exportData = filteredItems.value.map(item => ({
            'Item Name': item.itemName || '',
            'Brand': item.brand || '',
            'Category': item.category || '',
            'Type': item.type || '',
            'Current Stock': item.currentStock || 0,
            'Minimum Stock': item.reorderLevel || 0,
            'Stock Status': item.stockStatus || '',
            'Shortage': item.shortage || 0,
            'Supplier': item.supplier || '',
            'Unit': item.unit || '',
            'Batch Count': item.batchCount || 0,
            'Last Restocked': item.lastRestocked ? new Date(item.lastRestocked).toLocaleDateString() : ''
        }));
        
        // Convert to CSV format
        const csvContent = convertToCSV(exportData);
        
        // Generate filename with current date
        const currentDate = new Date().toISOString().split('T')[0];
        const filename = `low_stock_report_${currentDate}.csv`;
        
        // Download the file
        downloadCSV(csvContent, filename);
        
        // Show success message
        toast.add({
            severity: 'success',
            summary: 'Export Successful',
            detail: `${exportData.length} records exported successfully.`,
            life: 3000
        });
        
    } catch (error) {
        console.error('❌ Export error:', error);
        toast.add({
            severity: 'error',
            summary: 'Export Failed',
            detail: 'Failed to export report. Please try again.',
            life: 5000
        });
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
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
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

// Computed property to filter items based on search query
const filteredItems = computed(() => {
    if (!searchQuery.value.trim()) {
        return lowStockItems.value;
    }
    const query = searchQuery.value.toLowerCase();
    return lowStockItems.value.filter(
        (item) =>
            (item.itemName && item.itemName.toLowerCase().includes(query)) ||
            (item.supplier && item.supplier.toLowerCase().includes(query)) ||
            (item.brand && item.brand.toLowerCase().includes(query)) ||
            (item.category && item.category.toLowerCase().includes(query)) ||
            (item.stockStatus && item.stockStatus.toLowerCase().includes(query))
    );
});

// Get status severity class
const getStatusSeverity = (status) => {
    switch (status) {
        case 'Out of Stock': return 'danger';
        case 'Low Stock': return 'warn';
        case 'Warning': return 'info';
        default: return 'success';
    }
};

// Get status color class
const getStatusColor = (status) => {
    switch (status) {
        case 'Out of Stock': return 'text-red-600 font-bold';
        case 'Low Stock': return 'text-orange-600 font-semibold';
        case 'Warning': return 'text-yellow-600 font-medium';
        default: return 'text-green-600';
    }
};

// Clear search input
const clearFilters = () => {
    searchQuery.value = "";
};
</script>
<template>
    <div class="card">
        <!-- Header -->
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div class="flex-1">
                <div class="flex items-center gap-3 mb-3">
                    <i class="pi pi-chart-line text-2xl text-blue-600 dark:text-blue-400"></i>
                    <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Low Stock Report
                    </h2>
                </div>
                <p class="text-gray-600 dark:text-gray-400 mb-4">Monitor and track inventory items that need restocking</p>
                
                <!-- Summary Stats -->
                <div v-if="reportSummary" class="flex flex-wrap gap-3">
                    <div class="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg shadow-md">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-times-circle"></i>
                            <div>
                                <p class="text-xs opacity-90">Out of Stock</p>
                                <p class="text-lg font-bold">{{ reportSummary.out_of_stock }}</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg shadow-md">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-exclamation-triangle"></i>
                            <div>
                                <p class="text-xs opacity-90">Low Stock</p>
                                <p class="text-lg font-bold">{{ reportSummary.low_stock }}</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 rounded-lg shadow-md">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-info-circle"></i>
                            <div>
                                <p class="text-xs opacity-90">Warning</p>
                                <p class="text-lg font-bold">{{ reportSummary.warning }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex gap-3 mt-4 lg:mt-0">
                
                <Button
                    icon="pi pi-download"
                    label="Export"
                    @click="exportReport"
                    :loading="isExporting"
                    class="p-button-sm p-button-primary"
                />
            </div>
        </div>

        <!-- Search and Filters -->
        <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
            <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <!-- Search Controls -->
                <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
                    <div class="flex items-center gap-3">
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search text-gray-500 dark:text-gray-400" />
                            </InputIcon>
                            <InputText
                                id="search"
                                v-model="searchQuery"
                                placeholder="Search items, brands, categories, suppliers..."
                                class="w-full sm:w-80 lg:w-96"
                            />
                        </IconField>
                        
                        <Button
                            v-if="searchQuery"
                            icon="pi pi-times"
                            severity="secondary"
                            outlined
                            @click="clearFilters"
                            class="p-2"
                            v-tooltip="'Clear search'"
                        />
                    </div>
                </div>
                
                <!-- Results Counter -->
                <div class="flex items-center gap-4 text-sm">
                    <div class="bg-white dark:bg-gray-800 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700">
                        <span class="text-gray-600 dark:text-gray-400">Showing</span>
                        <span class="font-semibold text-gray-900 dark:text-gray-100 mx-1">{{ filteredItems.length }}</span>
                        <span class="text-gray-600 dark:text-gray-400">of</span>
                        <span class="font-semibold text-gray-900 dark:text-gray-100 mx-1">{{ lowStockItems.length }}</span>
                        <span class="text-gray-600 dark:text-gray-400">items</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-16">
            <div class="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                <div class="flex flex-col items-center">
                    <ProgressSpinner strokeWidth="3" class="mb-4" animationDuration="1s" />
                    <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Loading Report</h4>
                    <p class="text-gray-600 dark:text-gray-400 text-center">Analyzing inventory levels and generating low stock report...</p>
                </div>
            </div>
        </div>
        
        <!-- Error State -->
        <div v-else-if="errorMessage" class="flex justify-center py-16">
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 max-w-md w-full text-center shadow-lg">
                <div class="bg-red-100 dark:bg-red-900/40 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="pi pi-exclamation-triangle text-red-600 dark:text-red-400 text-2xl"></i>
                </div>
                <h4 class="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Error Loading Report</h4>
                <p class="text-red-700 dark:text-red-300 mb-6">{{ errorMessage }}</p>
                <div class="flex gap-3 justify-center">
                    <Button
                        icon="pi pi-refresh"
                        label="Try Again"
                        @click="fetchLowStockItems"
                        severity="danger"
                        outlined
                    />
                </div>
            </div>
        </div>
        
        <!-- Empty State -->
        <div v-else-if="filteredItems.length === 0 && !isLoading" class="flex justify-center py-16">
            <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8 max-w-lg w-full text-center shadow-lg">
                <div class="bg-green-100 dark:bg-green-900/40 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="pi pi-check-circle text-green-600 dark:text-green-400 text-3xl"></i>
                </div>
                <h4 class="text-xl font-bold text-green-800 dark:text-green-300 mb-3">Excellent Stock Levels!</h4>
                <p class="text-green-600 dark:text-green-400 mb-4">All items are properly stocked. No low stock alerts at the moment.</p>
                <div class="text-sm text-green-500 dark:text-green-400">
                    <i class="pi pi-info-circle mr-1"></i>
                    Your inventory management is on track
                </div>
            </div>
        </div>

        <!-- Data Table -->
        <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <DataTable
                :value="filteredItems"
                :rows="15"
                :rowsPerPageOptions="[10, 15, 25, 50, 100]"
                paginator
                responsiveLayout="scroll"
                :globalFilterFields="['itemName', 'brand', 'category', 'supplier', 'stockStatus']"
                sortMode="multiple"
                stripedRows
                class="border-0"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} items"
            >
            <!-- Item Details -->
            <Column field="itemName" header="Item Details" sortable style="min-width: 250px">
                <template #body="slotProps">
                    <div class="py-2">
                        <div class="font-bold text-gray-900 dark:text-gray-100 text-base mb-2">
                            {{ slotProps.data.itemName }}
                        </div>
                        <div class="flex flex-wrap gap-1">
                            <span v-if="slotProps.data.brand" class="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md">
                                <i class="pi pi-tag mr-1 text-[10px]"></i>
                                {{ slotProps.data.brand }}
                            </span>
                            <span v-if="slotProps.data.category" class="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-md">
                                <i class="pi pi-bookmark mr-1 text-[10px]"></i>
                                {{ slotProps.data.category }}
                            </span>
                            <span v-if="slotProps.data.type" class="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-md">
                                {{ slotProps.data.type }}
                            </span>
                        </div>
                    </div>
                </template>
            </Column>

            <!-- Stock Status -->
            <Column field="stockStatus" header="Status" sortable style="min-width: 140px">
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <div class="flex items-center">
                            <div :class="{
                                'w-2 h-2 rounded-full mr-2': true,
                                'bg-red-500 animate-pulse': slotProps.data.stockStatus === 'Out of Stock',
                                'bg-orange-500': slotProps.data.stockStatus === 'Low Stock',
                                'bg-yellow-500': slotProps.data.stockStatus === 'Warning',
                                'bg-green-500': slotProps.data.stockStatus === 'Normal'
                            }"></div>
                            <Tag 
                                :value="slotProps.data.stockStatus" 
                                :severity="getStatusSeverity(slotProps.data.stockStatus)"
                                class="font-semibold px-3 py-1"
                            />
                        </div>
                    </div>
                </template>
            </Column>

            <!-- Stock Levels -->
            <Column header="Stock Levels" style="min-width: 200px">
                <template #body="slotProps">
                    <div class="py-2">
                        <!-- Current Stock -->
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Current:</span>
                            <div class="flex items-center gap-2">
                                <span :class="getStatusColor(slotProps.data.stockStatus)" class="font-bold text-lg">
                                    {{ slotProps.data.currentStock || 0 }}
                                </span>
                                <span v-if="slotProps.data.unit" class="text-xs text-gray-500 dark:text-gray-400">
                                    {{ slotProps.data.unit }}
                                </span>
                            </div>
                        </div>
                        
                        <!-- Progress Bar -->
                        <div class="mb-2">
                            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                    class="h-2 rounded-full transition-all duration-300"
                                    :class="{
                                        'bg-red-500': slotProps.data.stockStatus === 'Out of Stock',
                                        'bg-orange-500': slotProps.data.stockStatus === 'Low Stock',
                                        'bg-yellow-500': slotProps.data.stockStatus === 'Warning',
                                        'bg-green-500': slotProps.data.stockStatus === 'Normal'
                                    }"
                                    :style="{ 
                                        width: Math.min(100, Math.max(5, (slotProps.data.currentStock / Math.max(slotProps.data.reorderLevel, 1)) * 100)) + '%' 
                                    }"
                                ></div>
                            </div>
                        </div>
                        
                        <!-- Minimum Stock -->
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-gray-600 dark:text-gray-400">Minimum:</span>
                            <span class="font-medium text-gray-700 dark:text-gray-300">
                                {{ slotProps.data.reorderLevel || 0 }}
                            </span>
                        </div>
                        
                        <!-- Shortage Alert -->
                        <div v-if="slotProps.data.shortage > 0" class="mt-2 p-2 bg-red-50 dark:bg-red-900/30 rounded-md border border-red-200 dark:border-red-800">
                            <div class="flex items-center gap-1 text-red-600 dark:text-red-400">
                                <i class="pi pi-exclamation-triangle text-xs"></i>
                                <span class="text-xs font-medium">
                                    Need {{ slotProps.data.shortage }} more
                                </span>
                            </div>
                        </div>
                    </div>
                </template>
            </Column>

            <!-- Supplier -->
            <Column field="supplier" header="Supplier" sortable style="min-width: 180px">
                <template #body="slotProps">
                    <div class="py-2">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="pi pi-building text-blue-500 text-sm"></i>
                            <span class="text-gray-800 dark:text-gray-200 font-medium">
                                {{ slotProps.data.supplier || 'Not specified' }}
                            </span>
                        </div>
                        <div v-if="slotProps.data.lastRestocked" class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <i class="pi pi-calendar text-[10px]"></i>
                            <span>Last restocked: {{ new Date(slotProps.data.lastRestocked).toLocaleDateString() }}</span>
                        </div>
                        <div v-else class="text-xs text-gray-400 dark:text-gray-500 italic">
                            <i class="pi pi-info-circle text-[10px] mr-1"></i>
                            No restock history
                        </div>
                    </div>
                </template>
            </Column>

            <!-- Additional Info -->
            <Column header="Additional Info" style="min-width: 140px">
                <template #body="slotProps">
                    <div class="py-2 space-y-1">
                        <div v-if="slotProps.data.batchCount" class="flex items-center gap-1 text-xs">
                            <i class="pi pi-box text-gray-500 text-[10px]"></i>
                            <span class="text-gray-600 dark:text-gray-400">
                                {{ slotProps.data.batchCount }} batch{{ slotProps.data.batchCount > 1 ? 'es' : '' }}
                            </span>
                        </div>
                        <div v-if="slotProps.data.maxStock" class="flex items-center gap-1 text-xs">
                            <i class="pi pi-chart-bar text-blue-500 text-[10px]"></i>
                            <span class="text-gray-600 dark:text-gray-400">
                                Max: {{ slotProps.data.maxStock }}
                            </span>
                        </div>
                        <div v-if="!slotProps.data.batchCount && !slotProps.data.maxStock" class="text-xs text-gray-400 dark:text-gray-500 italic">
                            No additional data
                        </div>
                    </div>
                </template>
            </Column>
            </DataTable>
        </div>
        
        <!-- Toast for notifications -->
        <Toast position="top-right" />
    </div>
</template>
