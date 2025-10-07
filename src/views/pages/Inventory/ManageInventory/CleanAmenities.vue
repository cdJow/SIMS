<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import axios from 'axios';

const toast = useToast();

// Reactive data
const isLoading = ref(false);
const cleaningItems = ref([]);
const cleaningSerials = ref([]);
const searchTerm = ref('');

// Computed filtered data
const filteredCleaningItems = computed(() => {
    if (!searchTerm.value) return cleaningItems.value;
    return cleaningItems.value.filter(item =>
        item.product_name.toLowerCase().includes(searchTerm.value.toLowerCase())
    );
});

const filteredCleaningSerials = computed(() => {
    if (!searchTerm.value) return cleaningSerials.value;
    return cleaningSerials.value.filter(serial => {
        const matchesProduct = serial.product_name.toLowerCase().includes(searchTerm.value.toLowerCase());
        const matchesSerial = serial.serial_number.toLowerCase().includes(searchTerm.value.toLowerCase());
        return matchesProduct || matchesSerial;
    });
});

// Fetch all Bath & Bed linens that need cleaning
async function fetchCleaningItems() {
    isLoading.value = true;
    try {
        // No need for manual auth headers - axios interceptor handles it
        const response = await axios.get('/amenities/cleaning-list');
        
        if (response.data && response.data.success) {
            cleaningItems.value = response.data.items || [];
            cleaningSerials.value = response.data.serials || [];
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch cleaning items',
            life: 3000
        });
    } finally {
        isLoading.value = false;
    }
}

// Clean specific item
async function cleanItem(itemId, type) {
    try {
        // No need for manual auth headers - axios interceptor handles it
        const response = await axios.post('/amenities/clean-item', {
            item_id: itemId,
            type: type // 'item' or 'serial'
        });
        
        if (response.data && response.data.success) {
            toast.add({
                severity: 'success',
                summary: 'Item Cleaned!',
                detail: 'Item status updated to in_stock',
                life: 3000
            });
            
            // Remove from list
            if (type === 'item') {
                cleaningItems.value = cleaningItems.value.filter(item => item.id !== itemId);
            } else {
                cleaningSerials.value = cleaningSerials.value.filter(serial => serial.id !== itemId);
            }
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Cleaning Failed',
            detail: error.response?.data?.error || 'Failed to clean item',
            life: 3000
        });
    }
}

// Initialize
onMounted(() => {
    fetchCleaningItems();
});
</script>

<template>
    <div class="card">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
            <div>
                <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Clean Bath & Bed Linens
                </h2>
                <p class="text-gray-600 dark:text-gray-400 mt-1">
                    Click items to mark them as cleaned (in_stock)
                </p>
            </div>
            <Button
                icon="pi pi-refresh"
                label="Refresh"
                class="p-button-secondary p-button-sm"
                @click="fetchCleaningItems"
                :loading="isLoading"
            />
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-8">
            <div class="inline-flex items-center">
                <i class="pi pi-spinner pi-spin mr-2"></i>
                <span class="text-gray-600 dark:text-gray-400">Loading items needing cleaning...</span>
            </div>
        </div>

        <!-- Items Table -->
        <div v-if="!isLoading && cleaningItems.length > 0" class="mb-8">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    <i class="pi pi-box mr-2"></i>
                    Items Needing Cleaning ({{ filteredCleaningItems.length }}/{{ cleaningItems.length }})
                </h3>
                <div class="flex gap-3">
                    <div class="p-input-icon-left">
                        <i class="pi pi-search"></i>
                        <InputText 
                            v-model="searchTerm"
                            placeholder="Search by product name..."
                            class="w-64"
                        />
                    </div>
                </div>
            </div>
            <DataTable
                :value="filteredCleaningItems"
                :rows="10"
                :paginator="true"
                :responsiveLayout="'scroll'"
                class="p-datatable-sm spaced-rows"
                :rowHover="true"
            >
                <Column field="product_name" header="Product Name" sortable>
                    <template #body="slotProps">
                        <span class="font-medium">{{ slotProps.data.product_name }}</span>
                    </template>
                </Column>
                
                <Column field="product_type" header="Type" sortable>
                    <template #body="slotProps">
                        <span 
                            class="px-2 py-1 rounded-full text-xs font-medium"
                            :class="{
                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300': slotProps.data.product_type.includes('Bath'),
                                'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300': slotProps.data.product_type.includes('Bed')
                            }"
                        >
                            {{ slotProps.data.product_type }}
                        </span>
                    </template>
                </Column>
                
                <Column field="status" header="Current Status" sortable>
                    <template #body="slotProps">
                        <span class="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                            {{ slotProps.data.status }}
                        </span>
                    </template>
                </Column>

                <Column header="Action" style="width: 120px">
                    <template #body="slotProps">
                        <Button
                            icon="pi pi-check"
                            label="Clean"
                            class="p-button-sm p-button-success"
                            @click="cleanItem(slotProps.data.id, 'item')"
                        />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Serial Numbers Table -->
        <div v-if="!isLoading && cleaningSerials.length > 0" class="mb-8">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    <i class="pi pi-qrcode mr-2"></i>
                     ({{ filteredCleaningSerials.length }}/{{ cleaningSerials.length }})
                </h3>
                <div class="flex gap-3">
                    <div class="p-input-icon-left">
                        <i class="pi pi-search"></i>
                        <InputText 
                            v-model="searchTerm"
                            placeholder="Search by product name or serial number..."
                            class="w-80"
                        />
                    </div>
                </div>
            </div>
            <DataTable
                :value="filteredCleaningSerials"
                :rows="10"
                :paginator="true"
                :responsiveLayout="'scroll'"
                class="p-datatable-sm spaced-rows"
                :rowHover="true"
            >
                <Column field="product_name" header="Product Name" sortable>
                    <template #body="slotProps">
                        <span class="font-medium">{{ slotProps.data.product_name }}</span>
                    </template>
                </Column>
                
                <Column field="serial_number" header="Serial Number" sortable>
                    <template #body="slotProps">
                        <span class="font-mono text-sm">{{ slotProps.data.serial_number }}</span>
                    </template>
                </Column>
                
                <Column field="product_type" header="Type" sortable>
                    <template #body="slotProps">
                        <span 
                            class="px-2 py-1 rounded-full text-xs font-medium"
                            :class="{
                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300': slotProps.data.product_type.includes('Bath'),
                                'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300': slotProps.data.product_type.includes('Bed')
                            }"
                        >   
                            {{ slotProps.data.product_type }}
                        </span>
                    </template>
                </Column>
                
                <Column field="status" header="Current Status" sortable>
                    <template #body="slotProps">
                        <span class="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                            {{ slotProps.data.status }}
                        </span>
                    </template>
                </Column>

                <Column header="Action" style="width: 120px">
                    <template #body="slotProps">
                        <Button
                            icon="pi pi-check"
                            label="Clean"
                            class="p-button-sm p-button-success"
                            @click="cleanItem(slotProps.data.id, 'serial')"
                        />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- No Items Message -->
        <div v-if="!isLoading && cleaningItems.length === 0 && cleaningSerials.length === 0" class="text-center py-12">
            <i class="pi pi-check-circle text-6xl text-green-500 mb-4 block"></i>
            <h3 class="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">All Clean!</h3>
            <p class="text-gray-500 dark:text-gray-500">
                No Bath & Bed linens need cleaning right now.
            </p>
        </div>

        <!-- No Search Results Message -->
        <div v-if="!isLoading && (cleaningItems.length > 0 || cleaningSerials.length > 0) && filteredCleaningItems.length === 0 && filteredCleaningSerials.length === 0" class="text-center py-12">
            <i class="pi pi-search text-6xl text-gray-400 mb-4 block"></i>
            <h3 class="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No Results Found</h3>
            <p class="text-gray-500 dark:text-gray-500">
                No items match your search criteria. Try adjusting your search terms.
            </p>
        </div>

        <!-- Toast for notifications -->
        <Toast position="top-right" />
    </div>
</template>

<style scoped>
.card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.dark .card {
    background: #1f2937;
    color: #f9fafb;
}

.p-button-lg {
    padding: 1rem 2rem;
    font-size: 1.125rem;
}

/* Add spacing between table rows */
.spaced-rows :deep(.p-datatable-tbody > tr > td) {
    padding: 1rem 0.75rem;
    border-bottom: 8px solid transparent;
}

.spaced-rows :deep(.p-datatable-tbody > tr) {
    margin-bottom: 8px;
}

.spaced-rows :deep(.p-datatable-tbody > tr:hover > td) {
    background-color: #f8fafc !important;
}

.dark .spaced-rows :deep(.p-datatable-tbody > tr:hover > td) {
    background-color: #374151 !important;
}
</style>
