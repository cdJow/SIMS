<script setup>
import { useToast } from "primevue/usetoast";
import { computed, ref } from "vue";

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

// Filter state
const filters = ref({
    searchQuery: "",
    dateRange: null,
});

// Add sorting state and handler
const sortField = ref(null);
const sortOrder = ref(null);

const onSort = (event) => {
    sortField.value = event.sortField;
    sortOrder.value = event.sortOrder;
};

// Delete confirmation state
const deleteDialogVisible = ref(false);
const selectedInvoice = ref(null);
// Toast instance
const toast = useToast();

// Delete functions
// Delete functions
const confirmDelete = (invoice) => {
    selectedInvoice.value = invoice;
    deleteDialogVisible.value = true;
};

const deleteInvoice = (invoiceId) => {
    // Close the dialog first
    deleteDialogVisible.value = false;
    selectedInvoice.value = null;

    // Remove the invoice from the list
    invoiceData.value = invoiceData.value.filter(
        (invoice) => invoice.invoiceId !== invoiceId
    );

    // Show success toast
    toast.add({
        severity: "error",
        summary: "Deleted",
        detail: "Invoice deleted successfully",
        life: 3000,
    });
};

const handlePrint = (invoice) => {
    const printContent = `
        <html>
            <head>
                <title>Invoice ${invoice.invoiceId}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #2c3e50; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .total { font-weight: bold; margin-top: 20px; }
                </style>
            </head>
            <body>
                <h1>Invoice ${invoice.invoiceId}</h1>
                <p><strong>Date:</strong> ${formatDate(invoice.date)}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items
                            .map(
                                (item) => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>${formatCurrency(item.price)}</td>
                                <td>${formatCurrency(
                                    item.price * item.quantity
                                )}</td>
                            </tr>
                        `
                            )
                            .join("")}
                    </tbody>
                </table>
                <div class="total">
                    Total Amount: ${formatCurrency(invoice.total)}
                </div>
            </body>
        </html>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
};

const downloadInvoice = (invoice) => {
    // Create invoice content
    const content = `
        Invoice ID: ${invoice.invoiceId}
        Date: ${formatDate(invoice.date)}

        ITEMS:
        ${invoice.items
            .map(
                (item) => `
        - ${item.name}
          Quantity: ${item.quantity}
          Price: ${formatCurrency(item.price)}
          Subtotal: ${formatCurrency(item.price * item.quantity)}
        `
            )
            .join("")}

        TOTAL: ${formatCurrency(invoice.total)}
    `;

    // Create blob and download
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice_${invoice.invoiceId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const cancelDelete = () => {
    deleteDialogVisible.value = false;
    selectedInvoice.value = null;
};

// Computed filtered invoices
const filteredInvoices = computed(() => {
    return invoiceData.value.filter((invoice) => {
        // Search filter
        const matchesSearch =
            invoice.invoiceId
                .toLowerCase()
                .includes(filters.value.searchQuery.toLowerCase()) ||
            invoice.items.some((item) =>
                item.name
                    .toLowerCase()
                    .includes(filters.value.searchQuery.toLowerCase())
            );

        // Date range filter
        const matchesDate =
            !filters.value.dateRange ||
            (new Date(invoice.date) >= new Date(filters.value.dateRange[0]) &&
                new Date(invoice.date) <= new Date(filters.value.dateRange[1]));

        return matchesSearch && matchesDate;
    });
});

// Clear filters function
const clearFilters = () => {
    filters.value = {
        searchQuery: "",
        dateRange: null,
    };
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
                        @click="clearFilters"
                    />
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText
                            placeholder="Keyword Search"
                            class="w-full"
                            v-model="filters.searchQuery"
                        />
                    </IconField>
                </div>
            </div>
        </div>

        <h2 class="text-xl font-bold mb-4">POS Invoices</h2>
        <DataTable
            :value="filteredInvoices"
            class="p-datatable-striped"
            :sortField="sortField"
            :sortOrder="sortOrder"
            @sort="onSort"
        >
            <!-- Invoice ID -->
            <Column field="invoiceId" header="Invoice ID" sortable>
                <template #body="{ data }">
                    <div class="font-medium">
                        {{ data.invoiceId }}
                    </div>
                </template>
            </Column>

            <!-- Item Name -->
            <Column header="Item Name">
                <template #body="{ data }">
                    <div class="flex flex-col">
                        <div v-for="(item, index) in data.items" :key="index">
                            {{ item.name }}
                        </div>
                    </div>
                </template>
            </Column>

            <!-- Quantity -->
            <Column header="Quantity">
                <template #body="{ data }">
                    <div class="flex flex-col items-center">
                        <div v-for="(item, index) in data.items" :key="index">
                            x{{ item.quantity }}
                        </div>
                    </div>
                </template>
            </Column>

            <!-- Unit Price -->
            <Column header="Unit Price">
                <template #body="{ data }">
                    <div class="flex flex-col items-end">
                        <div v-for="(item, index) in data.items" :key="index">
                            {{ formatCurrency(item.price) }}
                        </div>
                    </div>
                </template>
            </Column>

            <!-- Total -->
            <Column field="total" header="Total" sortable>
                <template #body="{ data }">
                    <div class="font-semibold">
                        {{ formatCurrency(data.total) }}
                    </div>
                </template>
            </Column>

            <!-- Date -->
            <Column field="date" header="Date" sortable>
                <template #body="{ data }">
                    <div class="whitespace-nowrap">
                        {{ formatDate(data.date) }}
                    </div>
                </template>
            </Column>

            <!-- Actions -->
            <Column header="Actions">
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <Button
                            icon="pi pi-print"
                            outlined
                            rounded
                            @click="handlePrint(data)"
                            v-tooltip.top="'Print Invoice'"
                        />
                        <Button
                            icon="pi pi-download"
                            class="p-button-help"
                            outlined
                            rounded
                            @click="downloadInvoice(data)"
                            v-tooltip.top="'Download Invoice'"
                        />
                        <Button
                            icon="pi pi-trash"
                            class="p-button-danger"
                            outlined
                            rounded
                            @click="confirmDelete(data)"
                            v-tooltip.top="'Delete Invoice'"
                        />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>

    <Dialog
        v-model:visible="deleteDialogVisible"
        header="Confirm Deletion"
        :style="{ width: '450px' }"
        :modal="true"
    >
        <div class="flex align-items-center gap-3 mb-3">
            <i
                class="pi pi-exclamation-triangle text-red-500"
                style="font-size: 2rem"
            />
            <span v-if="selectedInvoice">
                Are you sure you want to delete invoice
                <strong>{{ selectedInvoice.invoiceId }}</strong
                >?
            </span>
        </div>

        <template #footer>
            <Button
                label="No"
                icon="pi pi-times"
                class="p-button-text"
                @click="cancelDelete"
            />
            <Button
                label="Yes"
                icon="pi pi-check"
                class="p-button-danger"
                @click="deleteInvoice(selectedInvoice.invoiceId)"
            />
        </template>
    </Dialog>
    <Toast />
</template>
