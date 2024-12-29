<script setup>
import { InventoryService } from "@/service/InventoryService";
import { onMounted, ref } from "vue";

const stockMovementsSummary = ref([]); // Reactive variable for fetched data

// Fetch stock movements data
onMounted(() => {
    InventoryService.getStockMovementsSummary().then((data) => {
        stockMovementsSummary.value = data;
        console.log("Fetched stock movements summary:", data);
    });
});
</script>

<template>
    <div class="card">
        <!-- Title -->
        <div class="font-semibold text-xl mb-4">Stock Movements Summary</div>

        <!-- Data Table -->
        <DataTable
            :value="stockMovementsSummary"
            :rows="5"
            :paginator="true"
            responsiveLayout="scroll"
        >
            <!-- Item Name Column -->
            <Column
                field="itemName"
                header="Item Name"
                :sortable="true"
                style="width: 25%"
            ></Column>

            <!-- Movement Type Column -->
            <Column
                field="movementType"
                header="Movement Type"
                :sortable="true"
                style="width: 20%"
            >
                <template #body="slotProps">
                    <span
                        :class="{
                            'text-green-500':
                                slotProps.data.movementType === 'Addition',
                            'text-red-500':
                                slotProps.data.movementType === 'Reduction',
                        }"
                    >
                        {{ slotProps.data.movementType }}
                    </span>
                </template>
            </Column>

            <!-- Quantity Column -->
            <Column
                field="quantity"
                header="Quantity"
                :sortable="true"
                style="width: 15%"
            ></Column>

            <!-- Date Column -->
            <Column
                field="date"
                header="Date"
                :sortable="true"
                style="width: 20%"
            >
                <template #body="slotProps">
                    {{ new Date(slotProps.data.date).toLocaleDateString() }}
                </template>
            </Column>

            <!-- Remarks Column -->
            <Column
                field="remarks"
                header="Remarks"
                :sortable="false"
                style="width: 20%"
            ></Column>
        </DataTable>
    </div>
</template>
