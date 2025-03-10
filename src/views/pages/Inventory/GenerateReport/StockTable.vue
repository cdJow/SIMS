<script setup>
import { InventoryService } from "@/service/InventoryService"; // Inventory service
import { computed, onMounted, ref } from "vue";

const stockMovements = ref([]); // Full stock movement data
const filteredStockMovements = ref([]); // Filtered stock movement data
const isLoading = ref(true);
const errorMessage = ref("");
const searchQuery = ref(""); // Reactive search query

// Fetch stock movements data
onMounted(() => {
    fetchStockMovements();
});

// Fetch function with error handling
function fetchStockMovements() {
    isLoading.value = true;
    InventoryService.getStockMovements()
        .then((data) => {
            stockMovements.value = data;
            filteredStockMovements.value = data; // Initialize filtered data
        })
        .catch((error) => {
            console.error("Error fetching stock movements:", error);
            errorMessage.value = "Failed to load stock movements data.";
        })
        .finally(() => {
            isLoading.value = false;
        });
}

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
</script>

<template>
    <div class="card">
        <!-- Header -->
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Stock Movements Summary
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
                    @click="clearFilters"
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
                        v-model="searchQuery"
                        placeholder="Keyword Search"
                        class="w-60"
                    />
                </IconField>
            </div>
        </div>

        <DataTable
            :value="filteredData"
            :rows="10"
            :paginator="true"
            :responsiveLayout="'scroll'"
            class="p-datatable-lg"
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
                        class="py-2 block"
                        :class="{
                            'text-green-500 font-semibold':
                                slotProps.data.actionType === 'Stock In',
                            'text-red-500 font-semibold':
                                slotProps.data.actionType === 'Stock Out',
                            'text-yellow-500 font-semibold':
                                slotProps.data.actionType === 'Adjustment',
                        }"
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

            <!-- Balance Column -->
            <Column
                field="balance"
                header="Balance"
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
        </DataTable>
    </div>
</template>
