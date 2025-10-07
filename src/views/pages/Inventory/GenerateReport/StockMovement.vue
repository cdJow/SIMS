<script setup>
import { ref, onMounted, computed } from "vue";
import { getStockMovements } from "@/api/auth";
import { useToast } from "primevue/usetoast";

const toast = useToast();
const loading = ref(false);
const stockMovements = ref([]);
const searchItemName = ref("");
const searchDate = ref("");

const loadStockMovements = async () => {
    try {
        loading.value = true;
        
        // Get stock movements data from StockTable.py
        const response = await getStockMovements();
        stockMovements.value = response.data;
        
    } catch (error) {
        console.error('Error loading stock movements:', error);
        toast.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to load stock movements data",
            life: 3000,
        });
    } finally {
        loading.value = false;
    }
};

const formatDateTime = (dateString) => {
    try {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateString;
    }
};

const getActionTypeColor = (actionType) => {
    switch(actionType?.toLowerCase()) {
        case 'stock in':
            return 'text-green-600 bg-green-100';
        case 'sale':
            return 'text-red-600 bg-red-100';
        case 'assigned':
            return 'text-blue-600 bg-blue-100';
        case 'damage':
            return 'text-orange-600 bg-orange-100';
        case 'rental charge':
            return 'text-purple-600 bg-purple-100';
        default:
            return 'text-gray-600 bg-gray-100';
    }
};

// Filtered stock movements based on search criteria
const filteredStockMovements = computed(() => {
    let filtered = stockMovements.value;
    
    // Filter by item name
    if (searchItemName.value.trim()) {
        const searchTerm = searchItemName.value.toLowerCase().trim();
        filtered = filtered.filter(item => 
            item.itemName && item.itemName.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by date
    if (searchDate.value) {
        const searchDateStr = new Date(searchDate.value).toDateString();
        filtered = filtered.filter(item => {
            if (item.dateTime) {
                const itemDateStr = new Date(item.dateTime).toDateString();
                return itemDateStr === searchDateStr;
            }
            return false;
        });
    }
    
    return filtered;
});

// Clear search filters
const clearFilters = () => {
    searchItemName.value = "";
    searchDate.value = "";
};

onMounted(() => {
    loadStockMovements();
});
</script>

<template>
        <div class="card">
            <!-- Header with Icon -->
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                    <i class="pi pi-list text-xl text-blue-600"></i>
                    <h2 class="text-xl font-semibold text-gray-900">Stock Movements</h2>
                </div>
                <Button 
                    icon="pi pi-refresh" 
                    @click="loadStockMovements" 
                    :loading="loading"
                    class="p-button-outlined p-button-sm"
                />
            </div>
            
            <!-- Search Bars -->
            <div class="bg-gray-50 dark:bg-gray-900 rounded p-3 mb-4">
                <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <!-- Item Name Search -->
                    <div class="flex-1">
                        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Search Item Name</label>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search text-gray-500 dark:text-gray-400" />
                            </InputIcon>
                            <InputText
                                v-model="searchItemName"
                                placeholder="Search by item name..."
                                size="small"
                                class="w-full"
                            />
                        </IconField>
                    </div>
                    
                    <!-- Date Search -->
                    <div class="flex-1">
                        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Filter by Date</label>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-calendar text-gray-500 dark:text-gray-400" />
                            </InputIcon>
                            <Calendar
                                v-model="searchDate"
                                placeholder="Select date..."
                                size="small"
                                dateFormat="yy-mm-dd"
                                class="w-full"
                            />
                        </IconField>
                    </div>
                    
                    <!-- Clear Filters Button -->
                    <div class="flex items-end">
                        <Button
                            v-if="searchItemName || searchDate"
                            icon="pi pi-times"
                            label="Clear"
                            severity="secondary"
                            outlined
                            @click="clearFilters"
                            size="small"
                            class="mt-5 sm:mt-0"
                        />
                    </div>
                </div>
                
                <!-- Results Counter -->
                <div v-if="searchItemName || searchDate" class="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <span class="bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                        Showing {{ filteredStockMovements.length }} of {{ stockMovements.length }} movements
                    </span>
                </div>
            </div>
            
        <DataTable
            :value="filteredStockMovements"
            :rows="5"
            :paginator="true"
            :loading="loading"
            responsiveLayout="scroll"
            class="p-datatable-gridlines"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
            sortField="dateTime"
            :sortOrder="-1"
        >
            <!-- Date/Time Column -->
            <Column
                field="dateTime"
                header="Date/Time"
                :sortable="true"
                style="width: 18%"
            >
                <template #body="slotProps">
                    <div class="text-sm text-gray-700">
                        {{ formatDateTime(slotProps.data.dateTime) }}
                    </div>
                </template>
            </Column>

            <!-- Item Name Column -->
            <Column
                field="itemName"
                header="Item Name"
                :sortable="true"
                style="width: 20%"
            >
                <template #body="slotProps">
                    <div class="font-medium text-gray-900">
                        {{ slotProps.data.itemName }}
                    </div>
                </template>
            </Column>

            <!-- Action Type Column -->
            <Column
                field="actionType"
                header="Action Type"
                :sortable="true"
                style="width: 15%"
            >
                <template #body="slotProps">
                    <span
                        :class="getActionTypeColor(slotProps.data.actionType)"
                        class="px-2 py-1 rounded-full text-xs font-medium"
                    >
                        {{ slotProps.data.actionType }}
                    </span>
                </template>
            </Column>

            <!-- Qty Changed Column -->
            <Column
                field="qtyChanged"
                header="Qty Changed"
                :sortable="true"
                style="width: 12%"
            >
                <template #body="slotProps">
                    <div class="text-center font-semibold" :class="{
                        'text-green-600': slotProps.data.qtyChanged > 0,
                        'text-red-600': slotProps.data.qtyChanged < 0,
                        'text-gray-600': slotProps.data.qtyChanged === 0
                    }">
                        {{ slotProps.data.qtyChanged > 0 ? '+' : '' }}{{ slotProps.data.qtyChanged }}
                    </div>
                </template>
            </Column>

            <!-- Quantity Total Column -->
            <Column
                field="balance"
                header="Quantity Total"
                :sortable="true"
                style="width: 12%"
            >
                <template #body="slotProps">
                    <div class="text-center font-medium text-gray-700">
                        {{ slotProps.data.balance }}
                    </div>
                </template>
            </Column>

            <!-- Source Column -->
            <Column
                field="reference"
                header="Source"
                :sortable="true"
                style="width: 10%"
            >
                <template #body="slotProps">
                    <div class="text-sm text-blue-600 font-medium">
                        {{ slotProps.data.reference }}
                    </div>
                </template>
            </Column>

            <!-- Notes Column -->
            <Column
                field="notes"
                header="Notes"
                :sortable="false"
                style="width: 13%"
            >
                <template #body="slotProps">
                    <div class="text-sm text-gray-500 truncate" :title="slotProps.data.notes">
                        {{ slotProps.data.notes }}
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>

    <Toast />
</template>
