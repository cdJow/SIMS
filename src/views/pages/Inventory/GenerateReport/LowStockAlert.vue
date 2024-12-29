<script setup>
import { InventoryService } from "@/service/InventoryService"; // Placeholder for inventory API service
import { onMounted, ref } from "vue";

const lowStockItems = ref(null);

// Function to fetch low-stock items
onMounted(() => {
    InventoryService.getLowStockItems().then((data) => {
        lowStockItems.value = data;
    });
});
</script>

<template>
    <div class="card">
        <!-- Title -->
        <div class="font-semibold text-xl mb-4">Low Stock Alerts</div>

        <!-- Data Table -->
        <DataTable
            :value="lowStockItems"
            :rows="5"
            :paginator="true"
            responsiveLayout="scroll"
        >
            <!-- Item Name Column -->
            <Column
                field="itemName"
                header="Item Name"
                :sortable="true"
                style="width: 35%"
            ></Column>

            <!-- Category Column -->
            <Column
                field="category"
                header="Category"
                :sortable="true"
                style="width: 20%"
            ></Column>

            <!-- Current Stock Column -->
            <Column
                field="currentStock"
                header="Current Stock"
                :sortable="true"
                style="width: 15%"
            ></Column>

            <!-- Reorder Level Column -->
            <Column
                field="reorderLevel"
                header="Reorder Level"
                :sortable="true"
                style="width: 15%"
            ></Column>

            <!-- Supplier Column -->
            <Column
                field="supplier"
                header="Supplier"
                :sortable="true"
                style="width: 15%"
            ></Column>
        </DataTable>
    </div>
</template>
