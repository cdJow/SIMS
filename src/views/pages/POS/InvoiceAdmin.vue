<script setup>
import { useToast } from "primevue/usetoast";
import { computed, ref, onMounted } from "vue";
import { fetchBills, deleteBill } from "@/api/auth";

// Invoices from backend
const invoiceData = ref([]);
const isLoading = ref(false);

async function loadInvoices() {
    isLoading.value = true;
    try {
        const res = await fetchBills();
        const bills = res.data || [];
        invoiceData.value = bills.map((b) => ({
            id: b.id,
            invoiceId: b.invoice_no || `INV-${b.id}`,
            userId: b.user_id,
            userName: b.user_name || "Unknown User",
            userRole: b.user_role || "Unknown Role",
            items: (b.items || []).map((it) => ({
                name: it.name,
                brand: it.brand || "",
                quantity: Number(it.quantity || 0),
                price: Number(it.price || 0),
            })),
            total: Number(b.total || 0),
            date: b.timestamp,
        }));
    } catch (e) {
        toast.add({
            severity: "error",
            summary: "Load Invoices",
            detail: "Failed to fetch invoices",
            life: 3000,
        });
    } finally {
        isLoading.value = false;
    }
}

onMounted(() => {
    loadInvoices();
});

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

const deleteInvoice = async (billId) => {
    deleteDialogVisible.value = false;
    try {
        await deleteBill(billId);
        invoiceData.value = invoiceData.value.filter((inv) => inv.id !== billId);
        toast.add({
            severity: "success",
            summary: "Deleted",
            detail: "Invoice deleted successfully",
            life: 3000,
        });
    } catch (e) {
        toast.add({
            severity: "error",
            summary: "Delete failed",
            detail: e?.response?.data?.message || "Failed to delete invoice",
            life: 3000,
        });
    } finally {
        selectedInvoice.value = null;
    }
};

const handlePrint = (invoice) => {
    const printContent = `
        <html>
            <head>
                <title>Invoice ${invoice.invoiceId}</title>
                <style>
                    @media print {
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { color: #2c3e50; margin-bottom: 10px; font-size: 24px; }
                        .invoice-header { 
                            margin-bottom: 20px; 
                            border-bottom: 3px solid #2c3e50; 
                            padding-bottom: 15px;
                            background-color: #f8f9fa;
                            padding: 15px;
                            border-radius: 8px;
                        }
                        .transaction-info { 
                            background-color: #f8f9fa; 
                            padding: 15px; 
                            border-radius: 5px; 
                            margin-bottom: 20px;
                            border: 2px solid #e9ecef;
                        }
                        .transaction-info h3 { margin-top: 0; color: #495057; }
                        .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
                        .label { font-weight: bold; color: #495057; }
                        .value { color: #212529; font-weight: 600; }
                        .role-badge { 
                            background-color: #007bff; 
                            color: white; 
                            padding: 4px 10px; 
                            border-radius: 12px; 
                            font-size: 13px; 
                            font-weight: bold; 
                        }
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin-top: 20px;
                            box-shadow: 0 0 10px rgba(0,0,0,0.1);
                        }
                        th, td { 
                            border: 1px solid #ddd; 
                            padding: 12px; 
                            text-align: left;
                        }
                        th { 
                            background-color: #f2f2f2; 
                            font-weight: bold;
                            color: #2c3e50;
                            font-size: 14px;
                        }
                        td {
                            font-size: 13px;
                        }
                        tr:nth-child(even) {
                            background-color: #f8f9fa;
                        }
                        .total { 
                            font-weight: bold; 
                            margin-top: 20px; 
                            text-align: right; 
                            font-size: 20px;
                            color: #2c3e50;
                            padding: 10px 15px;
                            background-color: #e9ecef;
                            border-radius: 8px;
                            display: inline-block;
                        }
                    }
                    /* Non-print styles */
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #2c3e50; margin-bottom: 10px; }
                    .invoice-header { margin-bottom: 20px; border-bottom: 2px solid #2c3e50; padding-bottom: 10px; }
                    .transaction-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                    .transaction-info h3 { margin-top: 0; color: #495057; }
                    .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
                    .label { font-weight: bold; color: #495057; }
                    .value { color: #212529; }
                    .role-badge { background-color: #007bff; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .total { font-weight: bold; margin-top: 20px; text-align: right; font-size: 18px; }
                </style>
            </head>
            <body>
                <div class="invoice-header">
                    <h1>Invoice ${invoice.invoiceId}</h1>
                    <p><strong>Date:</strong> ${formatDate(invoice.date)}</p>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Brand</th>
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
                                <td>${item.brand || ""}</td>
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
                
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px;">
                    <div class="transaction-info" style="margin-bottom: 0;">
                        <h4 style="margin: 0 0 10px 0; color: #495057; font-size: 14px;">Transaction Processed By:</h4>
                        <div style="padding: 8px 0;">
                            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px; color: #212529;">${invoice.userName}</div>
                            <div style="font-size: 12px; color: #495057;"> ${invoice.userRole}</div>
                        </div>
                    </div>
                    <div class="total">
                        Total Amount: ${formatCurrency(invoice.total)}
                    </div>
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
        INVOICE: ${invoice.invoiceId}
        Date: ${formatDate(invoice.date)}
        
        TRANSACTION DETAILS:
        Processed by: ${invoice.userName}
        User ID: ${invoice.userId}
        Role: ${invoice.userRole}
        
        ITEMS:
        ${invoice.items
            .map(
                (item) => `
        - ${item.name}
          Brand: ${item.brand || ""}
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
            invoice.items.some((item) => {
                const q = filters.value.searchQuery.toLowerCase();
                return (
                    (item.name || "").toLowerCase().includes(q) ||
                    (item.brand || "").toLowerCase().includes(q)
                );
            });

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

// Get role tag severity for styling
const getRoleSeverity = (role) => {
    switch(role?.toLowerCase()) {
        case 'system admin':
            return 'danger';
        case 'manager':
            return 'warning';
        case 'front desk':
            return 'success';
        case 'inventory':
            return 'info';
        case 'guest':
        default:
            return 'secondary';
    }
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
            :loading="isLoading"
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

            <!-- Brand -->
            <Column header="Brand">
                <template #body="{ data }">
                    <div class="flex flex-col">
                        <div v-for="(item, index) in data.items" :key="index">
                            {{ item.brand || "" }}
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
                @click="deleteInvoice(selectedInvoice.id)"
            />
        </template>
    </Dialog>
    <Toast />
</template>
