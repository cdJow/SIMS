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
    <div class="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
            <div>
                <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Clean Bath & Bed Linens
                </h2>
                <p class="text-gray-600 dark:text-gray-400 mt-1">
                    Click items to mark them as cleaned
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
                        <i class="pi pi-search dark:text-gray-400"></i>
                        <InputText 
                            v-model="searchTerm"
                            placeholder="Search by product name..."
                            class="w-64 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
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
                stripedRows
                :pt="{ bodyRow: { style: 'height: 3.5rem;' } }"
                :rowHover="false"
            >
                <Column field="product_name" header="Product Name" sortable headerClass="text-center" bodyClass="text-center">
                    <template #body="slotProps">
                        <span class="font-medium text-gray-900 dark:text-gray-100">{{ slotProps.data.product_name }}</span>
                    </template>
                </Column>
                
                <Column field="product_type" header="Type" sortable headerClass="text-center" bodyClass="text-center">
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
                
                <Column field="status" header="Current Status" sortable headerClass="text-center" bodyClass="text-center">
                    <template #body="slotProps">
                        <span class="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                            {{ slotProps.data.status }}
                        </span>
                    </template>
                </Column>

                <Column header="Action" headerClass="text-center" bodyClass="text-center" style="width: 120px">
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
                        <i class="pi pi-search dark:text-gray-400"></i>
                        <InputText 
                            v-model="searchTerm"
                            placeholder="Search by product name or serial number..."
                            class="w-80 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
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
                stripedRows
                :pt="{ bodyRow: { style: 'height: 3.5rem;' } }"
                :rowHover="false"
            >
                <Column field="product_name" header="Product Name" sortable headerClass="text-center" bodyClass="text-center">
                    <template #body="slotProps">
                        <span class="font-medium text-gray-900 dark:text-gray-100">{{ slotProps.data.product_name }}</span>
                    </template>
                </Column>
                
                <Column field="serial_number" header="Serial Number" sortable headerClass="text-center" bodyClass="text-center">
                    <template #body="slotProps">
                        <span class="font-mono text-sm text-gray-700 dark:text-gray-300">{{ slotProps.data.serial_number }}</span>
                    </template>
                </Column>
                
                <Column field="product_type" header="Type" sortable headerClass="text-center" bodyClass="text-center">
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
                
                <Column field="status" header="Current Status" sortable headerClass="text-center" bodyClass="text-center">
                    <template #body="slotProps">
                        <span class="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                            {{ slotProps.data.status }}
                        </span>
                    </template>
                </Column>

                <Column header="Action" headerClass="text-center" bodyClass="text-center" style="width: 120px">
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
            <i class="pi pi-check-circle text-6xl text-green-500 dark:text-green-400 mb-4 block"></i>
            <h3 class="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">All Clean!</h3>
            <p class="text-gray-500 dark:text-gray-400">
                No Bath & Bed linens need cleaning right now.
            </p>
        </div>

        <!-- No Search Results Message -->
        <div v-if="!isLoading && (cleaningItems.length > 0 || cleaningSerials.length > 0) && filteredCleaningItems.length === 0 && filteredCleaningSerials.length === 0" class="text-center py-12">
            <i class="pi pi-search text-6xl text-gray-400 dark:text-gray-500 mb-4 block"></i>
            <h3 class="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">No Results Found</h3>
            <p class="text-gray-500 dark:text-gray-400">
                No items match your search criteria. Try adjusting your search terms.
            </p>
        </div>

        <!-- Toast for notifications --></div>
</template>

<style scoped>
.card {
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.p-button-lg {
    padding: 1rem 2rem;
    font-size: 1.125rem;
}

/* Add spacing between table rows */
.spaced-rows :deep(.p-datatable-tbody > tr > td) {
    padding: 1.25rem 1.5rem;
    border-bottom: 8px solid transparent;
}

.spaced-rows :deep(.p-datatable-tbody > tr) {
    margin-bottom: 8px;
}

/* Center align table headers */
.spaced-rows :deep(.p-datatable-thead > tr > th) {
    padding: 1rem 1.5rem;
    font-weight: 600;
}

/* Dark mode striped rows */
.dark .spaced-rows :deep(.p-datatable-tbody > tr.p-row-odd > td) {
    background-color: #1f2937 !important;
}

.dark .spaced-rows :deep(.p-datatable-tbody > tr.p-row-even > td) {
    background-color: #111827 !important;
}

/* Ensure rows have consistent padding and separation */
.spaced-rows :deep(.p-datatable-tbody > tr > td) {
    padding-top: 1rem;
    padding-bottom: 1rem;
}

/* Override PrimeVue striped rows in dark mode */
.dark :deep(.p-datatable.p-datatable-striped .p-datatable-tbody > tr.p-row-odd) {
    background-color: #1f2937 !important;
}

.dark :deep(.p-datatable.p-datatable-striped .p-datatable-tbody > tr.p-row-even) {
    background-color: #111827 !important;
}
</style>
