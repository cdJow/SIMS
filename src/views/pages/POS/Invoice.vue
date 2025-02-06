<script setup>
import { ref } from "vue";

// Sample POS invoice data
const invoiceData = ref([
    {
        invoiceId: "INV-1001",
        items: [
            { name: "Bottled Water", quantity: 2, price: 20 },
            { name: "Snacks", quantity: 3, price: 50 },
        ],
        total: 190,
        date: "2024-03-02T16:45:00",
    },
    {
        invoiceId: "INV-1002",
        items: [{ name: "Toiletries Kit", quantity: 1, price: 150 }],
        total: 150,
        date: "2024-03-03T09:30:00",
    },
]);

// Utility functions
const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(value);
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};
</script>
<template>
    <div class="card">
        <div class="gap-4 mb-6">
            <!-- Advanced Filters -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- Global Search -->
                <div class="flex flex-row gap-4">
                    <Button
                        type="button"
                        icon="pi pi-filter-slash"
                        label="Clear"
                        outlined
                    />
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText
                            placeholder="Keyword Search"
                            class="w-full"
                        />
                    </IconField>
                </div>

                <!-- Date Range Filter -->
                <Calendar
                    v-model="dateRange"
                    selectionMode="range"
                    dateFormat="yy-mm-dd"
                    placeholder="Select Date Range"
                    showIcon
                    iconDisplay="input"
                    :icon="'pi pi-calendar'"
                />
            </div>
        </div>

        <h2 class="text-xl font-bold mb-4">POS Invoices</h2>
        <DataTable
            :value="invoiceData"
            class="p-datatable-striped"
            :sortField="sortField"
            :sortOrder="sortOrder"
            @sort="onSort"
        >
            <!-- Invoice ID with proper sorting -->
            <Column
                field="invoiceId"
                header="Invoice ID"
                sortable
                :sortField="invoiceId"
            >
            </Column>

            <!-- Separated Item Name and Quantity -->
            <Column header="Item Name">
                <template #body="{ data }">
                    <div v-for="(item, index) in data.items" :key="index">
                        {{ item.name }}
                    </div>
                </template>
            </Column>

            <Column header="Quantity" sortable="">
                <template #body="{ data }">
                    <div
                        v-for="(item, index) in data.items"
                        :key="index"
                        class="text-center"
                    >
                        x{{ item.quantity }}
                    </div>
                </template>
            </Column>

            <!-- Price per Item -->
            <Column header="Unit Price">
                <template #body="{ data }">
                    <div
                        v-for="(item, index) in data.items"
                        :key="index"
                        class="text-center"
                    >
                        {{ formatCurrency(item.price) }}
                    </div>
                </template>
            </Column>

            <!-- Total Column with sorting -->
            <Column field="total" header="Total" sortable :sortField="total">
                <template #body="{ data }">
                    {{ formatCurrency(data.total) }}
                </template>
            </Column>

            <!-- Date Column with sorting -->
            <Column field="date" header="Date" sortable :sortField="date">
                <template #body="{ data }">
                    {{ formatDate(data.date) }}
                </template>
            </Column>

            <Column header="Actions">
                <template #body>
                    <Button
                        icon="pi pi-print"
                        outlined
                        rounded
                        class="p-button-info"
                    />
                </template>
            </Column>
        </DataTable>
    </div>
</template>
