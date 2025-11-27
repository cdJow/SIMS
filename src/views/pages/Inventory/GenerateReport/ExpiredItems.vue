<script setup>
import { InventoryService } from "@/service/InventoryService"; // Inventory service
import { computed, onMounted, ref } from "vue";
import { useToast } from "primevue/usetoast";

const toast = useToast();
const expiredItems = ref([]); // Reactive variable for expired items
const nearExpireItems = ref([]); // Reactive variable for near expire items (within 1 month)
const isLoading = ref(true); // Loading state
const isExporting = ref(false); // Export loading state
const errorMessage = ref(""); // Error state for API call
const nearExpireSearchQuery = ref(""); // Search input for near expire items
const expiredSearchQuery = ref(""); // Search input for expired items
const nearExpireDateSearch = ref(null); // Date search for near expire items
const expiredDateSearch = ref(null); // Date search for expired items

// Fetch expired items
onMounted(() => {
    fetchExpiredItems();
    fetchNearExpireItems();
});

// Fetch expired items from real API
async function fetchExpiredItems() {
    isLoading.value = true;
    try {
        console.log('🔍 Fetching expired items from API...');
        const data = await InventoryService.getExpiredItems();
        
        // Data is already filtered by backend for expired items
        expiredItems.value = data || [];
        
        console.log('✅ Successfully loaded expired items:', expiredItems.value.length);
        errorMessage.value = "";
        
    } catch (error) {
        console.error("❌ Error fetching expired items:", error);
        errorMessage.value = "Failed to load expired items report.";
    } finally {
        isLoading.value = false;
    }
}

// Fetch near expire items (items expiring within 1 month)
async function fetchNearExpireItems() {
    try {
        console.log('🔍 Fetching near expire items from API...');
        const data = await InventoryService.getNearExpireItems();
        
        // Data is already filtered by backend for near expire items
        nearExpireItems.value = data || [];
        
        console.log('✅ Successfully loaded near expire items:', nearExpireItems.value.length);
        
    } catch (error) {
        console.error("❌ Error fetching near expire items:", error);
    }
}

// Computed property to filter and sort expired items based on search query
const filteredExpiredItems = computed(() => {
    let items = expiredItems.value;
    
    // Apply search filter if query exists
    if (expiredSearchQuery.value) {
        const query = expiredSearchQuery.value.toLowerCase();
        items = items.filter(
            (item) =>
                item.itemName.toLowerCase().includes(query) ||
                item.batchNumber.toLowerCase().includes(query) ||
                item.supplier.toLowerCase().includes(query) ||
                (item.retailPrice && item.retailPrice.toString().includes(query))
        );
    }
    
    // Apply date filter if date exists
    if (expiredDateSearch.value) {
        const searchDateStr = new Date(expiredDateSearch.value).toDateString();
        items = items.filter((item) => {
            if (!item.expirationDate) return false;
            const itemDateStr = new Date(item.expirationDate).toDateString();
            return itemDateStr === searchDateStr;
        });
    }
    
    // Sort by expiration date (oldest first)
    return items.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
});

// Computed property to filter and sort near expire items based on search query
const filteredNearExpireItems = computed(() => {
    let items = nearExpireItems.value;
    
    // Apply search filter if query exists
    if (nearExpireSearchQuery.value) {
        const query = nearExpireSearchQuery.value.toLowerCase();
        items = items.filter(
            (item) =>
                item.itemName.toLowerCase().includes(query) ||
                item.batchNumber.toLowerCase().includes(query) ||
                item.supplier.toLowerCase().includes(query) ||
                (item.retailPrice && item.retailPrice.toString().includes(query))
        );
    }
    
    // Apply date filter if date exists
    if (nearExpireDateSearch.value) {
        const searchDateStr = new Date(nearExpireDateSearch.value).toDateString();
        items = items.filter((item) => {
            if (!item.expirationDate) return false;
            const itemDateStr = new Date(item.expirationDate).toDateString();
            return itemDateStr === searchDateStr;
        });
    }
    
    // Sort by expiration date (soonest first)
    return items.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
});

// Function to clear both search inputs

// Function to clear near expire search
function clearNearExpireSearch() {
    nearExpireSearchQuery.value = "";
    nearExpireDateSearch.value = null;
}

// Function to clear expired search
function clearExpiredSearch() {
    expiredSearchQuery.value = "";
    expiredDateSearch.value = null;
}

// Calculate days expired
function calculateDaysExpired(expirationDate) {
    if (!expirationDate) return "N/A";
    const today = new Date();
    const expiryDate = new Date(expirationDate);
    const diffTime = Math.abs(today - expiryDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Calculate days until expiration (for near expire items)
function calculateDaysUntilExpiration(expirationDate) {
    if (!expirationDate) return "N/A";
    const today = new Date();
    const expiryDate = new Date(expirationDate);
    const diffTime = expiryDate - today;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
}

// Export report function
function exportReport() {
    isExporting.value = true;
    
    try {
        // Get both expired and near expire items
        const allItems = [...filteredExpiredItems.value, ...filteredNearExpireItems.value];
        
        // Check if we have data to export
        if (!allItems || allItems.length === 0) {
            toast.add({
                severity: 'warn',
                summary: 'No Data',
                detail: 'No items to export.',
                life: 3000
            });
            return;
        }
        
        // Prepare data for CSV export
        const exportData = allItems.map(item => ({
            'Item Name': item.itemName || '',
            'Batch Number': item.batchNumber || '',
            'Quantity': item.quantity || 0,
            'Retail Price': item.retailPrice ? `₱${item.retailPrice.toFixed(2)}` : 'N/A',
            'Expiration Date': item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : 'N/A',
            'Status': new Date(item.expirationDate) > new Date() ? 'Near Expiry' : 'Expired',
            'Days Until/Past Expiry': new Date(item.expirationDate) > new Date() ? 
                `${calculateDaysUntilExpiration(item.expirationDate)} days until expiry` :
                `${calculateDaysExpired(item.expirationDate)} days expired`,
            'Supplier': item.supplier || ''
        }));
        
        // Convert to CSV format
        const csvContent = convertToCSV(exportData);
        
        // Generate filename with current date
        const currentDate = new Date().toISOString().split('T')[0];
        const filename = `expiry_report_${currentDate}.csv`;
        
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
        console.error('Export error:', error);
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
    if (!data || data.length === 0) return '';
    
    try {
        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');
        
        const csvRows = data.map(row => {
            return headers.map(header => {
                let value = row[header];
                if (value === null || value === undefined) value = '';
                value = String(value);
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    value = `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',');
        });
        
        return [csvHeaders, ...csvRows].join('\n');
    } catch (error) {
        console.error('Error converting to CSV:', error);
        throw new Error('Failed to convert data to CSV format');
    }
}

// Download CSV file
function downloadCSV(csvContent, filename) {
    try {
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
        console.error('Error downloading CSV:', error);
        throw new Error('Failed to download CSV file');
    }
}

// Function to format date for export
function formatDateForExport(date) {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
}


</script>
<template>
    <div class="card">
        <!-- Header -->
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Expired Items Report
            </h3>
            <Button
                icon="pi pi-download"
                label="Export"
                class="p-button-sm p-button-primary"
                @click="exportReport"
                :loading="isExporting"
                :disabled="isLoading || (filteredExpiredItems.length === 0 && filteredNearExpireItems.length === 0)"
            />
        </div>

        <div class="flex flex-wrap items-center gap-4 mb-3">
           

             
           
        </div>

        <!-- Loading & Error State -->
        <div v-if="isLoading" class="text-center p-4">
            <ProgressSpinner />
        </div>
        <div v-else-if="errorMessage" class="text-center text-red-500 p-4">
            {{ errorMessage }}
        </div>

        <!-- Near Expire Items Section (1 month before expiry) -->
        <div v-if="!isLoading && !errorMessage" class="mb-6">
            <div class="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-400 p-4 mb-4 rounded-lg">
                <div class="flex items-center">
                    <i class="pi pi-exclamation-triangle text-orange-500 mr-3 text-xl"></i>
                    <h4 class="text-xl font-bold text-orange-800 dark:text-orange-200">
                        Near Expire Items
                    </h4>
                    <span class="ml-auto bg-orange-500 text-white px-3 py-1.5 rounded-full text-sm font-bold">
                        {{ filteredNearExpireItems.length }} / {{ nearExpireItems.length }}
                    </span>
                </div>
                <p class="text-sm text-orange-700 dark:text-orange-300 mt-2 ml-8">
                    Items expiring within 1 month
                </p>
            </div>

            <!-- Near Expire Items Search - Always Show -->
            <div class="flex flex-wrap items-center gap-4 mb-4">
                <!-- Clear Button for Near Expire -->
                <Button
                    type="button"
                    icon="pi pi-filter-slash"
                    label="Clear"
                    outlined
                    @click="clearNearExpireSearch"
                    size="small"
                />

                <!-- Near Expire Search -->
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText
                        id="nearExpireSearch"
                        placeholder="Search Near Expire Items..."
                        class="w-64"
                        v-model="nearExpireSearchQuery"
                    />
                </IconField>
                
                <!-- Date Search for Near Expire -->
                <DatePicker
                    v-model="nearExpireDateSearch"
                    :manualInput="false"
                    dateFormat="mm/dd/yy"
                    placeholder="Search by Expiration Date"
                    :showIcon="true"
                    iconDisplay="input"
                    class="w-64"
                />
            </div>

            <!-- Near Expire Items Data Table -->
            <DataTable
                v-if="filteredNearExpireItems.length > 0"
                :value="filteredNearExpireItems"
                :paginator="true"
                :rows="5"
                responsiveLayout="scroll"
                class="p-datatable-lg mb-6"
                stripedRows 
            >
                <!-- Item Name -->
                <Column field="itemName" header="Item Name" sortable :bodyStyle="{ padding: '1.5rem 1rem', textAlign: 'left' }">
                    <template #body="slotProps">
                        <span class="text-gray-900 dark:text-gray-100">
                            {{ slotProps.data.itemName }}
                        </span>
                    </template>
                </Column>

                <Column field="batchNumber" header="Batch Number" sortable :bodyStyle="{ padding: '1.5rem 1rem', textAlign: 'left' }">
                    <template #body="slotProps">
                        <span class="text-gray-900 dark:text-gray-100">
                            {{ slotProps.data.batchNumber }}
                        </span>
                    </template>
                </Column>

                <!-- Current Stock -->
                <Column field="quantity" header="Quantity" sortable :bodyStyle="{ padding: '1.5rem 1rem', textAlign: 'center' }">
                    <template #body="slotProps">
                        <span class="text-gray-700 dark:text-gray-300 font-medium">
                            {{ slotProps.data.quantity }}
                        </span>
                    </template>
                </Column>

                <!-- Retail Price -->
                <Column field="retailPrice" header="Retail Price" sortable :bodyStyle="{ padding: '1.5rem 1rem', textAlign: 'right' }">
                    <template #body="slotProps">
                        <span class="text-green-600 dark:text-green-400 font-semibold">
                            ₱{{ slotProps.data.retailPrice ? slotProps.data.retailPrice.toFixed(2) : 'N/A' }}
                        </span>
                    </template>
                </Column>

                <!-- Expiration Date -->
                <Column field="expirationDate" header="Expiration Date" sortable :bodyStyle="{ padding: '1.5rem 1rem', textAlign: 'center' }">
                    <template #body="slotProps">
                        <span class="font-medium text-orange-600 dark:text-orange-400">
                            {{ new Date(slotProps.data.expirationDate).toLocaleDateString() }}
                        </span>
                    </template>
                </Column>

                <!-- Days Until Expiry -->
                <Column field="daysUntilExpiry" header="Days Until Expiry" sortable :bodyStyle="{ padding: '1.5rem 1rem', textAlign: 'center' }">
                    <template #body="slotProps">
                        <span class="text-orange-700 dark:text-orange-300 font-bold">
                            {{ calculateDaysUntilExpiration(slotProps.data.expirationDate) }} days
                        </span>
                    </template>
                </Column>

                <!-- Supplier -->
                <Column field="supplier" header="Supplier" sortable :bodyStyle="{ padding: '1.5rem 1rem', textAlign: 'left' }">
                    <template #body="slotProps">
                        <span class="text-gray-600 dark:text-gray-400">
                            {{ slotProps.data.supplier }}
                        </span>
                    </template>
                </Column>
            </DataTable>

            <!-- No Near Expire Items Message -->
            <div v-else class="text-center p-8 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800 mb-6">
                <i class="pi pi-clock text-orange-500 text-4xl mb-4"></i>
                <h3 class="text-lg font-semibold text-orange-700 dark:text-orange-300 mb-2">
                    <span v-if="nearExpireSearchQuery">No Items Found</span>
                    <span v-else>No Near Expire Items</span>
                </h3>
                <p class="text-orange-600 dark:text-orange-400 mb-4">
                    <span v-if="nearExpireSearchQuery">No near expire items match your search "{{ nearExpireSearchQuery }}"</span>
                    <span v-else>No items expiring within the next 30 days. Great job keeping inventory fresh!</span>
                </p>
                <div v-if="nearExpireSearchQuery" class="flex justify-center">
                    <Button 
                        icon="pi pi-filter-slash" 
                        label="Clear Search" 
                        class="p-button-sm p-button-outlined p-button-secondary"
                        @click="clearNearExpireSearch"
                    />
                </div>
            </div>
        </div>

        <!-- Expired Items Section Header -->
        <div class="mb-4">
            <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg">
                <div class="flex items-center">
                    <i class="pi pi-times-circle text-red-500 mr-3 text-xl"></i>
                    <h4 class="text-xl font-bold text-red-700 dark:text-red-200">
                        Expired Items
                    </h4>
                    <span class="ml-auto bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-bold">
                        {{ filteredExpiredItems.length }} / {{ expiredItems.length }}
                    </span>
                </div>
                <p class="text-sm text-red-700 dark:text-red-300 mt-2 ml-8">
                    Items that have already expired
                </p>
            </div>
        </div>

        <!-- Expired Items Search - Always Show -->
        <div v-if="!isLoading && !errorMessage" class="flex flex-wrap items-center gap-4 mb-4">
            <!-- Clear Button for Expired -->
            <Button
                type="button"
                icon="pi pi-filter-slash"
                label="Clear"
                outlined
                @click="clearExpiredSearch"
                size="small"
            />

            <!-- Expired Items Search -->
            <IconField>
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText
                    id="expiredSearch"
                    placeholder="Search Expired Items..."
                    class="w-64"
                    v-model="expiredSearchQuery"
                />
            </IconField>
            
            <!-- Date Search for Expired -->
            <DatePicker
                v-model="expiredDateSearch"
                :manualInput="false"
                dateFormat="mm/dd/yy"
                placeholder="Search by Expiration Date"
                :showIcon="true"
                iconDisplay="input"
                class="w-64"
            />
        </div>

        <!-- Expired Items Data Table -->
        <DataTable
            v-if="!isLoading && !errorMessage && filteredExpiredItems.length > 0"
            :value="filteredExpiredItems"
            :paginator="true"
            :rows="5"
            responsiveLayout="scroll"
            class="p-datatable-lg"
            stripedRows 
        >
            <!-- Item Name -->
            <Column field="itemName" header="Item Name" sortable :bodyStyle="{ padding: '1.5rem 1rem', textAlign: 'left' }">
                <template #body="slotProps">
                    <span class="text-gray-900 dark:text-gray-100">{{
                        slotProps.data.itemName
                    }}</span>
                </template>
            </Column>

            <Column field="batchNumber" header="Batch Number" sortable :bodyStyle="{ padding: '1.5rem 1rem', textAlign: 'left' }">
                <template #body="slotProps">
                    <span class="text-gray-900 dark:text-gray-100">{{
                        slotProps.data.batchNumber
                    }}</span>
                </template>
            </Column>

            <!-- Current Stock -->
            <Column field="quantity" header="Quantity" sortable :bodyStyle="{ padding: '1.5rem 1rem', textAlign: 'center' }">
                <template #body="slotProps">
                    <span class="text-gray-700 dark:text-gray-300 font-medium">
                        {{ slotProps.data.quantity }}
                    </span>
                </template>
            </Column>

            <!-- Retail Price -->
            <Column field="retailPrice" header="Retail Price" sortable :bodyStyle="{ padding: '1.5rem 1rem', textAlign: 'right' }">
                <template #body="slotProps">
                    <span class="text-green-600 dark:text-green-400 font-semibold">
                        ₱{{ slotProps.data.retailPrice ? slotProps.data.retailPrice.toFixed(2) : 'N/A' }}
                    </span>
                </template>
            </Column>

            <!-- Expiration Date -->
            <Column field="expirationDate" header="Expiration Date" sortable :bodyStyle="{ padding: '1.5rem 1rem', textAlign: 'center' }">
                <template #body="slotProps">
                    <span class="font-medium text-red-500">
                        {{
                            new Date(
                                slotProps.data.expirationDate
                            ).toLocaleDateString()
                        }}
                    </span>
                </template>
            </Column>

            <!-- Days Expired -->
            <Column field="daysExpired" header="Days Expired" sortable :bodyStyle="{ padding: '1.5rem 1rem', textAlign: 'center' }">
                <template #body="slotProps">
                    <span class="text-gray-700 dark:text-gray-300">
                        {{
                            calculateDaysExpired(slotProps.data.expirationDate)
                        }}
                    </span>
                </template>
            </Column>

            <!-- Supplier -->
            <Column field="supplier" header="Supplier" sortable :bodyStyle="{ padding: '1.5rem 1rem', textAlign: 'left' }">
                <template #body="slotProps">
                    <span class="text-gray-600 dark:text-gray-400">{{
                        slotProps.data.supplier
                    }}</span>
                </template>
            </Column>
        </DataTable>

        <!-- No Expired Items Message -->
        <div v-else-if="!isLoading && !errorMessage" class="text-center p-8 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
            <i class="pi pi-check-circle text-green-500 text-4xl mb-4"></i>
            <h3 class="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
                <span v-if="expiredSearchQuery">No Items Found</span>
                <span v-else>No Expired Items</span>
            </h3>
            <p class="text-red-600 dark:text-red-400 mb-4">
                <span v-if="expiredSearchQuery">No expired items match your search "{{ expiredSearchQuery }}"</span>
                <span v-else>No expired items found. Excellent inventory management!</span>
            </p>
            <div v-if="expiredSearchQuery" class="flex justify-center">
                <Button 
                    icon="pi pi-filter-slash" 
                    label="Clear Search" 
                    class="p-button-sm p-button-outlined p-button-secondary"
                    @click="clearExpiredSearch"
                />
            </div>
        </div>
    </div>
</template>
