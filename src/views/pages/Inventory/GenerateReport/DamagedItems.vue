<script setup>
import { InventoryService } from "@/service/InventoryService"; // Inventory service
import { onMounted, ref } from "vue";

// Reactive variables
const damagedItems = ref([]); // Stores the list of damaged items
const isLoading = ref(true); // Loading state
const errorMessage = ref(""); // Error message for API errors

// Fetch damaged items on mount
onMounted(() => {
    fetchDamagedItems();
});

// Fetch function for damaged items
function fetchDamagedItems() {
    isLoading.value = true;
    InventoryService.getDamagedItems()
        .then((data) => {
            damagedItems.value = data; // Assign fetched data
        })
        .catch((error) => {
            console.error("Error fetching damaged items:", error);
            errorMessage.value = "Failed to load damaged items report.";
        })
        .finally(() => {
            isLoading.value = false;
        });
}

const op2 = ref(null);

function toggleDataTable(event) {
    op2.value.toggle(event);
}
</script>

<template>
    <div class="card">
        <!-- Header -->
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Damaged Items Report
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

            <!-- Date Picker -->
            <div class="flex items-center">
                <span for="datePicker" class="font-bold pr-2">
                    Select Date:
                </span>
                <DatePicker
                    id="datePicker"
                    :showIcon="true"
                    :showButtonBar="true"
                    v-model="calendarValue"
                    class="w-60"
                ></DatePicker>
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
            :value="damagedItems"
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

            <Column field="quantityDamaged" header="Quantity Damaged" sortable>
                <template #body="slotProps">
                    <div class="flex justify-between items-center">
                        <!-- Quantity on the left -->
                        <span class="text-gray-700 font-medium">
                            {{ slotProps.data.quantityDamaged }}
                        </span>
                        <!-- Button on the right -->
                        <Button
                            type="button"
                            icon="pi pi-list"
                            outlined
                            class="ml-2"
                            @click="toggleDataTable"
                        />
                    </div>
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

        <Popover ref="op2" id="overlay_panel" style="width: 650px">
            <DataTable
                v-model:selection="selectedProduct"
                :value="products"
                selectionMode="single"
                :paginator="true"
                :rows="5"
                @row-select="onProductSelect"
            >
                <Column
                    field="serialNumbers"
                    header="Serial Number"
                    sortable
                    style="min-width: 12rem"
                ></Column>

                <Column field="reportedDate" header="Reported Date" sortable>
                    <template #body="slotProps">
                        <span class="text-gray-600">
                            {{
                                new Date(
                                    slotProps.data.reportedDate,
                                ).toLocaleDateString()
                            }}
                        </span>
                    </template>
                </Column>
                <!-- Damage Type -->
                <Column field="damageType" header="Damage Type" sortable>
                    <template #body="slotProps">
                        <span class="font-medium text-red-500">
                            {{ slotProps.data.damageType }}
                        </span>
                    </template>
                </Column>

                <!-- Reason -->
                <Column field="reason" header="Reason" sortable>
                    <template #body="slotProps">
                        <span class="text-gray-600">{{
                            slotProps.data.reason
                        }}</span>
                    </template>
                </Column>
            </DataTable>
        </Popover>
    </div>
</template>
