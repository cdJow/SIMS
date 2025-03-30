<script setup>
import { useToast } from "primevue/usetoast";
import { computed, ref } from "vue";

const toast = useToast();

// Transaction Data
const transactions = ref([
    {
        id: "TX-2354",
        date: "2024-03-15",
        type: "booking",
        description: "Deluxe Room Booking",
        amount: 15500,
        paymentMethod: "credit_card",
        status: "completed",
        items: [
            { name: "Room Charge", amount: 12000 },
            { name: "Taxes", amount: 3500 },
        ],
    },
    // Add more transactions...
]);

// Filter/Sort State
const selectedType = ref(null);
const selectedStatus = ref(null);
const dateRange = ref();
const searchText = ref("");
const sortField = ref("date");
const sortOrder = ref(-1);
const loading = ref(false);

// Options
const transactionTypes = ref([
    { name: "Booking", value: "booking" },
    { name: "Amenity", value: "amenity" },
    { name: "Dining", value: "dining" },
]);

const statusOptions = ref([
    { name: "Completed", value: "completed" },
    { name: "Pending", value: "pending" },
    { name: "Refunded", value: "refunded" },
]);

// Computed
const filteredTransactions = computed(() => {
    return transactions.value.filter((tx) => {
        const matchesType =
            !selectedType.value?.value || tx.type === selectedType.value.value;
        const matchesStatus =
            !selectedStatus.value?.value ||
            tx.status === selectedStatus.value.value;
        const matchesSearch = tx.description
            .toLowerCase()
            .includes(searchText.value.toLowerCase());

        // Date filtering
        let matchesDate = true;
        if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
            const txDate = new Date(tx.date);
            matchesDate =
                txDate >= dateRange.value[0] && txDate <= dateRange.value[1];
        }

        return matchesType && matchesStatus && matchesSearch && matchesDate;
    });
});

// Methods
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const formatCurrency = (amount) => {
    return amount.toLocaleString("en-PH");
};

const statusSeverity = (status) => {
    const statusMap = {
        completed: "success",
        pending: "warning",
        refunded: "info",
    };
    return statusMap[status] || "info";
};

const getTransactionIcon = (type) => {
    const icons = {
        booking: "pi pi-home",
        amenity: "pi pi-spa",
        dining: "pi pi-utensils",
    };
    return icons[type] || "pi pi-dollar";
};

const getPaymentMethodIcon = (method) => {
    const icons = {
        credit_card: "pi pi-credit-card",
        paypal: "pi pi-paypal",
        cash: "pi pi-money-bill",
    };
    return icons[method] || "pi pi-wallet";
};

const amountColor = (amount) => {
    return amount > 0 ? "text-green-600" : "text-red-600";
};

const exportCSV = () => {
    // Implement CSV export logic
    toast.add({
        severity: "success",
        summary: "Export Started",
        detail: "CSV export will download shortly",
        life: 3000,
    });
};
</script>

<template>
    <Card class="shadow-sm border-round-lg mb-6">
        <template #title>
            <div class="flex justify-between items-center">
                <div>
                    <h2 class="text-xl font-bold">Transaction History</h2>
                    <span class="text-sm text-gray-500"
                        >All financial activities</span
                    >
                </div>
                <div class="flex gap-2">
                    <Button
                        label="Export CSV"
                        icon="pi pi-file"
                        class="p-button-outlined p-button-sm"
                        @click="exportCSV"
                    />
                    <Button
                        label="PDF"
                        icon="pi pi-file-pdf"
                        severity="danger"
                        class="p-button-outlined p-button-sm"
                    />
                </div>
            </div>
        </template>

        <template #subtitle>
            <div class="flex flex-wrap gap-4 items-center mt-4">
                <div class="flex items-center gap-2">
                    <span class="text-sm">Filter by:</span>
                    <Dropdown
                        v-model="selectedType"
                        :options="transactionTypes"
                        optionLabel="name"
                        placeholder="Type"
                        class="w-32"
                    />
                    <Dropdown
                        v-model="selectedStatus"
                        :options="statusOptions"
                        optionLabel="name"
                        placeholder="Status"
                        class="w-32"
                    />
                    <Calendar
                        v-model="dateRange"
                        selectionMode="range"
                        dateFormat="yy-mm-dd"
                        placeholder="Date Range"
                        class="w-48"
                    />
                </div>
                <div class="flex-1 max-w-xs">
                    <span class="p-input-icon-left">
                        <i class="pi pi-search" />
                        <InputText
                            v-model="searchText"
                            placeholder="Search transactions..."
                            class="w-full"
                        />
                    </span>
                </div>
            </div>
        </template>

        <template #content>
            <DataTable
                :value="filteredTransactions"
                paginator
                :rows="10"
                :rowsPerPageOptions="[10, 20, 50]"
                removableSort
                class="p-datatable-sm"
                stripedRows
                v-model:sortField="sortField"
                v-model:sortOrder="sortOrder"
                :loading="loading"
                expandable
                rowKey="id"
            >
                <!-- Expand Row -->
                <template #expansion="slotProps">
                    <div class="p-4 bg-gray-50 border-t">
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <h4 class="font-medium mb-2">
                                    Transaction Details
                                </h4>
                                <dl class="space-y-1">
                                    <dt class="text-sm text-gray-500">
                                        Transaction ID
                                    </dt>
                                    <dd class="text-sm">
                                        {{ slotProps.data.id }}
                                    </dd>
                                    <dt class="text-sm text-gray-500">
                                        Payment Method
                                    </dt>
                                    <dd class="text-sm capitalize">
                                        {{ slotProps.data.paymentMethod }}
                                    </dd>
                                </dl>
                            </div>
                            <div>
                                <h4 class="font-medium mb-2">Breakdown</h4>
                                <div class="space-y-1">
                                    <div
                                        v-for="(item, index) in slotProps.data
                                            .items"
                                        :key="index"
                                        class="flex justify-between text-sm"
                                    >
                                        <span>{{ item.name }}</span>
                                        <span>₱{{ item.amount }}</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 class="font-medium mb-2">Documents</h4>
                                <Button
                                    label="Download Invoice"
                                    icon="pi pi-download"
                                    class="p-button-text p-button-sm"
                                />
                            </div>
                        </div>
                    </div>
                </template>

                <!-- Columns -->
                <Column
                    field="date"
                    header="Date"
                    sortable
                    class="min-w-[120px]"
                >
                    <template #body="{ data }">
                        {{ formatDate(data.date) }}
                    </template>
                </Column>

                <Column
                    field="description"
                    header="Description"
                    sortable
                    class="min-w-[200px]"
                >
                    <template #body="{ data }">
                        <div class="flex items-center gap-2">
                            <i
                                :class="getTransactionIcon(data.type)"
                                class="text-lg"
                            ></i>
                            {{ data.description }}
                        </div>
                    </template>
                </Column>

                <Column
                    field="amount"
                    header="Amount"
                    sortable
                    class="min-w-[120px]"
                >
                    <template #body="{ data }">
                        <span :class="amountColor(data.amount)">
                            ₱{{ formatCurrency(data.amount) }}
                        </span>
                    </template>
                </Column>

                <Column
                    field="paymentMethod"
                    header="Payment Method"
                    class="min-w-[150px]"
                >
                    <template #body="{ data }">
                        <div class="flex items-center gap-2">
                            <i
                                :class="
                                    getPaymentMethodIcon(data.paymentMethod)
                                "
                            ></i>
                            <span class="capitalize">{{
                                data.paymentMethod
                            }}</span>
                        </div>
                    </template>
                </Column>

                <Column
                    field="status"
                    header="Status"
                    sortable
                    class="min-w-[120px]"
                >
                    <template #body="{ data }">
                        <Tag
                            :value="data.status"
                            :severity="statusSeverity(data.status)"
                            class="capitalize"
                        />
                    </template>
                </Column>

                <Column headerStyle="width: 3rem">
                    <template #body="slotProps">
                        <Button
                            icon="pi pi-ellipsis-h"
                            class="p-button-text"
                            @click="toggleRow(slotProps)"
                        />
                    </template>
                </Column>
            </DataTable>
        </template>
    </Card>
</template>
