<script setup>
import { InventoryService } from "@/service/InventoryService"; // Inventory service
import { onMounted, ref } from "vue";

const expiredItems = ref([]); // Reactive variable for expired items
const isLoading = ref(true); // Loading state
const errorMessage = ref(""); // Error state for API call

// Fetch expired items
onMounted(() => {
    fetchExpiredItems();
});

// Fetch function with filter logic for expired items
function fetchExpiredItems() {
    isLoading.value = true;
    InventoryService.getExpiredItems()
        .then((data) => {
            // Filter items with expiration dates before today
            const today = new Date();
            expiredItems.value = data.filter(
                (item) => new Date(item.expirationDate) < today,
            );
        })
        .catch((error) => {
            console.error("Error fetching expired items:", error);
            errorMessage.value = "Failed to load expired items report.";
        })
        .finally(() => {
            isLoading.value = false;
        });
}

// Calculate days expired
function calculateDaysExpired(expirationDate) {
    if (!expirationDate) return "N/A";
    const today = new Date();
    const expiryDate = new Date(expirationDate);
    const diffTime = Math.abs(today - expiryDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
            <!-- Clear Button -->
            <div class="flex items-center">
                <Button
                    type="button"
                    icon="pi pi-filter-slash"
                    label="Clear"
                    outlined
                    class="mr-2"
                />
            </div>

            <!-- Keyword Search -->
            <div class="flex items-center">
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText
                        id="search"
                        placeholder="Keyword Search"
                        class="w-60"
                    />
                </IconField>
            </div>
        </div>

        <!-- Loading & Error State -->
        <div v-if="isLoading" class="text-center p-4">
            <ProgressSpinner />
        </div>
        <div v-else-if="errorMessage" class="text-center text-red-500 p-4">
            {{ errorMessage }}
        </div>

        <!-- Data Table -->
        <DataTable
            v-else
            :value="expiredItems"
            :rows="10"
            paginator
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

            <!-- Expiration Date -->
            <Column field="expirationDate" header="Expiration Date" sortable>
                <template #body="slotProps">
                    <span class="font-medium text-red-500">
                        {{
                            new Date(
                                slotProps.data.expirationDate,
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
    </div>
</template>
