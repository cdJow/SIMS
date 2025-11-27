<script setup>
import { useToast } from "primevue/usetoast";
import { computed, ref, onMounted } from "vue";
import { fetchBills } from "@/api/auth";

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

// Utility functions - Create singleton formatters for performance
const currencyFormatter = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
});

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

const formatCurrency = (value) => {
    return currencyFormatter.format(value);
};

const formatDate = (dateString) => {
    return dateFormatter.format(new Date(dateString));
};

// Filter state
const filters = ref({
    searchQuery: "",
    searchDate: null,
});

// Add sorting state and handler
const sortField = ref(null);
const sortOrder = ref(null);

const onSort = (event) => {
    sortField.value = event.sortField;
    sortOrder.value = event.sortOrder;
};

// Toast instance
const toast = useToast();

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
                        .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
                        .label { font-weight: bold; color: #495057; }
                        .value { color: #212529; font-weight: 600; }
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
                    h1 { color: #2c3e50; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .total { font-weight: bold; margin-top: 20px; }
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
                            <div style="font-size: 12px; color: #495057;">${invoice.userRole}</div>
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

        // Date filter
        const matchesDate = !filters.value.searchDate || 
            new Date(invoice.date).toDateString() === new Date(filters.value.searchDate).toDateString();

        return matchesSearch && matchesDate;
    });
});

// Clear filters function
const clearFilters = () => {
    filters.value = {
        searchQuery: "",
        searchDate: null,
    };
};
</script>
<template>
    <div class="card flex flex-col max-h-[calc(100vh-8rem)]">
        <h2 class="text-xl font-bold mb-4 flex-shrink-0">POS Invoices</h2>
        
        <div class="gap-4 mb-6 flex-shrink-0">
            <!-- Advanced Filters -->
            <div class="flex flex-row gap-4 items-center">
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
                        class="w-80"
                        v-model="filters.searchQuery"
                    />
                </IconField>
                
                <!-- Single Date Filter -->
                <DatePicker
                    v-model="filters.searchDate"
                    :manualInput="false"
                    dateFormat="mm/dd/yy"
                    placeholder="Search by Date"
                    :showIcon="true"
                    iconDisplay="input"
                    class="w-64"
                />
            </div>
        </div>
        
        <!-- Scrollable Content Area -->
        <div class="overflow-y-auto flex-1 pr-2">
            <!-- Empty State -->
            <div v-if="!isLoading && filteredInvoices.length === 0" class="text-center py-16">
                <div class="flex flex-col items-center justify-center space-y-4">
                    <i class="pi pi-receipt text-6xl text-gray-400 dark:text-gray-500"></i>
                    <div class="space-y-2">
                        <h3 class="text-xl font-semibold text-gray-600 dark:text-gray-400">No Invoices Found</h3>
                        <p class="text-gray-500 dark:text-gray-400 max-w-md">
                            <span v-if="filters.searchQuery || filters.searchDate">
                                No invoices match your current filters. Try adjusting your search criteria.
                            </span>
                            <span v-else>
                                There are no invoices available yet. Sales transactions will appear here once created.
                            </span>
                        </p>
                    </div>
                    <div v-if="filters.searchQuery || filters.searchDate" class="mt-4">
                        <Button 
                            label="Clear Filters" 
                            icon="pi pi-filter-slash" 
                            class="p-button-outlined"
                            @click="clearFilters"
                        />
                    </div>
                </div>
            </div>

            <!-- Data Table -->
            <DataTable
                v-else
                :value="filteredInvoices"
                :paginator="true"
                :rows="10"
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
    </div>
</template>
