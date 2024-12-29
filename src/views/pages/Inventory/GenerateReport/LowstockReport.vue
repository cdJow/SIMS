<script setup>
import { InventoryService } from "@/service/InventoryService"; // Inventory service
import { onMounted, ref } from "vue";

const lowStockItems = ref([]); // Reactive variable for low stock report
const isLoading = ref(true); // Loading state
const errorMessage = ref(""); // Error state for API call

// Fetch low stock items
onMounted(() => {
    fetchLowStockItems();
});

// Fetch function with filter logic for low stock
function fetchLowStockItems() {
    isLoading.value = true;
    InventoryService.getLowStockItems()
        .then((data) => {
            // Filter items where currentStock is below reorderLevel
            lowStockItems.value = data.filter(
                (item) => item.currentStock < item.reorderLevel,
            );
        })
        .catch((error) => {
            console.error("Error fetching low stock items:", error);
            errorMessage.value = "Failed to load low stock report.";
        })
        .finally(() => {
            isLoading.value = false;
        });
}
</script>
<template>
    <div class="card">
        <!-- Header -->
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Low Stock Report
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
            :value="lowStockItems"
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

            <!-- Current Stock -->
            <Column field="currentStock" header="Current Stock" sortable>
                <template #body="slotProps">
                    <span
                        :class="{
                            'text-red-500 font-bold':
                                slotProps.data.currentStock <
                                slotProps.data.reorderLevel,
                        }"
                    >
                        {{ slotProps.data.currentStock }}
                    </span>
                </template>
            </Column>

            <!-- Reorder Level -->
            <Column field="reorderLevel" header="Reorder Level" sortable>
                <template #body="slotProps">
                    <span class="text-gray-700 font-medium">
                        {{ slotProps.data.reorderLevel }}
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
