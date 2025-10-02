<script setup>
import { InventoryService } from "@/service/InventoryService"; // Inventory service
import { computed, onMounted, ref } from "vue";

const expiredItems = ref([]); // Reactive variable for expired items
const nearExpireItems = ref([]); // Reactive variable for near expire items (within 1 month)
const isLoading = ref(true); // Loading state
const errorMessage = ref(""); // Error state for API call
const nearExpireSearchQuery = ref(""); // Search input for near expire items
const expiredSearchQuery = ref(""); // Search input for expired items

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

// Computed property to filter expired items based on search query
const filteredExpiredItems = computed(() => {
    if (!expiredSearchQuery.value) {
        return expiredItems.value;
    }
    const query = expiredSearchQuery.value.toLowerCase();
    return expiredItems.value.filter(
        (item) =>
            item.itemName.toLowerCase().includes(query) ||
            item.batchNumber.toLowerCase().includes(query) ||
            item.supplier.toLowerCase().includes(query) ||
            (item.retailPrice && item.retailPrice.toString().includes(query))
    );
});

// Computed property to filter near expire items based on search query
const filteredNearExpireItems = computed(() => {
    if (!nearExpireSearchQuery.value) {
        return nearExpireItems.value;
    }
    const query = nearExpireSearchQuery.value.toLowerCase();
    return nearExpireItems.value.filter(
        (item) =>
            item.itemName.toLowerCase().includes(query) ||
            item.batchNumber.toLowerCase().includes(query) ||
            item.supplier.toLowerCase().includes(query) ||
            (item.retailPrice && item.retailPrice.toString().includes(query))
    );
});

// Function to clear both search inputs
function clearAllSearch() {
    nearExpireSearchQuery.value = "";
    expiredSearchQuery.value = "";
}

// Function to clear near expire search
function clearNearExpireSearch() {
    nearExpireSearchQuery.value = "";
}

// Function to clear expired search
function clearExpiredSearch() {
    expiredSearchQuery.value = "";
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
            />
        </div>

        <div class="flex flex-wrap items-center gap-4 mb-3">
            <!-- Clear All Button -->
            <div class="flex items-center">
                <Button
                    type="button"
                    icon="pi pi-filter-slash"
                    label="Clear All Searches"
                    outlined
                    @click="clearAllSearch"
                    class="mr-2"
                />
            </div>

            <!-- Global Search Info -->
            <div class="flex items-center">
                <span class="text-sm text-gray-600 dark:text-gray-400">
                    Use separate search boxes in each section below
                </span>
            </div>
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
            <div class="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-400 p-4 mb-4 rounded-r-lg">
                <div class="flex items-center">
                    <i class="pi pi-exclamation-triangle text-orange-500 mr-2"></i>
                    <h4 class="text-lg font-semibold text-orange-800 dark:text-orange-200">
                        Near Expire Items (Expiring within 1 month)
                    </h4>
                    <span class="ml-auto bg-orange-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                        {{ filteredNearExpireItems.length }} / {{ nearExpireItems.length }}
                    </span>
                </div>
            </div>

            <!-- Near Expire Items Search - Always Show -->
            <div class="flex flex-wrap items-center gap-4 mb-4">
                <!-- Clear Button for Near Expire -->
                <div class="flex items-center">
                    <Button
                        type="button"
                        icon="pi pi-filter-slash"
                        label="Clear"
                        outlined
                        @click="clearNearExpireSearch"
                        class="mr-2"
                        size="small"
                    />
                </div>

                <!-- Near Expire Search -->
                <div class="flex items-center">
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText
                            id="nearExpireSearch"
                            placeholder="Search Near Expire Items..."
                            class="w-60"
                            v-model="nearExpireSearchQuery"
                        />
                    </IconField>
                </div>
            </div>

            <!-- Near Expire Items Data Table -->
            <DataTable
                v-if="filteredNearExpireItems.length > 0"
                :value="filteredNearExpireItems"
                :paginator="true"
                :rows="5"
                responsiveLayout="scroll"
                class="p-datatable-lg mb-6"
            >
                <!-- Item Name -->
                <Column field="itemName" header="Item Name" sortable>
                    <template #body="slotProps">
                        <span class="font-semibold text-orange-700 dark:text-orange-300">
                            {{ slotProps.data.itemName }}
                        </span>
                    </template>
                </Column>

                <Column field="batchNumber" header="Batch Number" sortable>
                    <template #body="slotProps">
                        <span class="font-semibold">
                            {{ slotProps.data.batchNumber }}
                        </span>
                    </template>
                </Column>

                <!-- Current Stock -->
                <Column field="quantity" header="Quantity" sortable>
                    <template #body="slotProps">
                        <span class="text-gray-700 dark:text-gray-300 font-medium">
                            {{ slotProps.data.quantity }}
                        </span>
                    </template>
                </Column>

                <!-- Retail Price -->
                <Column field="retailPrice" header="Retail Price" sortable>
                    <template #body="slotProps">
                        <span class="text-green-600 dark:text-green-400 font-semibold">
                            ₱{{ slotProps.data.retailPrice ? slotProps.data.retailPrice.toFixed(2) : 'N/A' }}
                        </span>
                    </template>
                </Column>

                <!-- Expiration Date -->
                <Column field="expirationDate" header="Expiration Date" sortable>
                    <template #body="slotProps">
                        <span class="font-medium text-orange-600 dark:text-orange-400">
                            {{ new Date(slotProps.data.expirationDate).toLocaleDateString() }}
                        </span>
                    </template>
                </Column>

                <!-- Days Until Expiry -->
                <Column field="daysUntilExpiry" header="Days Until Expiry" sortable>
                    <template #body="slotProps">
                        <span class="text-orange-700 dark:text-orange-300 font-bold">
                            {{ calculateDaysUntilExpiration(slotProps.data.expirationDate) }} days
                        </span>
                    </template>
                </Column>

                <!-- Supplier -->
                <Column field="supplier" header="Supplier" sortable>
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
            <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg">
                <div class="flex items-center">
                    <i class="pi pi-times-circle text-red-500 mr-2"></i>
                    <h4 class="text-lg font-semibold text-red-800 dark:text-red-200">
                        Expired Items
                    </h4>
                    <span class="ml-auto bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                        {{ filteredExpiredItems.length }} / {{ expiredItems.length }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Expired Items Search - Always Show -->
        <div v-if="!isLoading && !errorMessage" class="flex flex-wrap items-center gap-4 mb-4">
            <!-- Clear Button for Expired -->
            <div class="flex items-center">
                <Button
                    type="button"
                    icon="pi pi-filter-slash"
                    label="Clear"
                    outlined
                    @click="clearExpiredSearch"
                    class="mr-2"
                    size="small"
                />
            </div>

            <!-- Expired Items Search -->
            <div class="flex items-center">
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText
                        id="expiredSearch"
                        placeholder="Search Expired Items..."
                        class="w-60"
                        v-model="expiredSearchQuery"
                    />
                </IconField>
            </div>
        </div>

        <!-- Expired Items Data Table -->
        <DataTable
            v-if="!isLoading && !errorMessage && filteredExpiredItems.length > 0"
            :value="filteredExpiredItems"
            :paginator="true"
            :rows="10"
            responsiveLayout="scroll"
            class="p-datatable-lg"
        >
            <!-- Item Name -->
            <Column field="itemName" header="Item Name" sortable>
                <template #body="slotProps">
                    <span class="font-semibold">{{
                        slotProps.data.itemName
                    }}</span>
                </template>
            </Column>

            <Column field="batchNumber" header="Batch Number" sortable>
                <template #body="slotProps">
                    <span class="font-semibold">{{
                        slotProps.data.batchNumber
                    }}</span>
                </template>
            </Column>

            <!-- Current Stock -->
            <Column field="quantity" header="Quantity" sortable>
                <template #body="slotProps">
                    <span class="text-gray-700 font-medium">
                        {{ slotProps.data.quantity }}
                    </span>
                </template>
            </Column>

            <!-- Retail Price -->
            <Column field="retailPrice" header="Retail Price" sortable>
                <template #body="slotProps">
                    <span class="text-green-600 dark:text-green-400 font-semibold">
                        ₱{{ slotProps.data.retailPrice ? slotProps.data.retailPrice.toFixed(2) : 'N/A' }}
                    </span>
                </template>
            </Column>

            <!-- Expiration Date -->
            <Column field="expirationDate" header="Expiration Date" sortable>
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
            <Column field="daysExpired" header="Days Expired" sortable>
                <template #body="slotProps">
                    <span class="text-gray-700">
                        {{
                            calculateDaysExpired(slotProps.data.expirationDate)
                        }}
                    </span>
                </template>
            </Column>

            <!-- Supplier -->
            <Column field="supplier" header="Supplier" sortable>
                <template #body="slotProps">
                    <span class="text-gray-600">{{
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
