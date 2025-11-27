<script setup>
import { ProductService } from "@/service/ProductService";
import { FilterMatchMode, FilterOperator } from "@primevue/core/api";

import { onMounted, onBeforeMount, ref, computed } from "vue";

const expandedRows = ref([]);
const batchExpandedRows = ref([]);
const toast = ref(null);

const selectedBatch = ref({});
const selectedItem = ref(null);
const isDialogVisible = ref(false);
const showProductDialog = ref(false);
const selectedProductData = ref(null);

const products = ref([]); // Products for the DataTable
const selectedProduct = ref(null); // Selected product from the DataTable
const serialNumbers = ref([]);

// Computed property to ensure products is always a valid array with proper structure
const safeProducts = computed(() => {
    try {
        if (!Array.isArray(products.value)) {
            console.warn("products is not an array, returning empty array");
            return [];
        }
        return products.value.filter(product => product && typeof product.id !== 'undefined');
    } catch (error) {
        console.error("Error accessing products:", error);
        return [];
    }
});

// Add filter function with proper error handling
const ConsumableBatchSearch = ref("");
const NonConsumableBatchSearch = ref("");
const roomSearchQuery = ref(""); // Search for rooms by room number

// Separate filter functions
const filterConsumableBatches = (batches) => {
    try {
        if (!Array.isArray(batches)) {
            console.warn("filterConsumableBatches: batches is not an array", batches);
            return [];
        }
        const query = ConsumableBatchSearch.value.toLowerCase().trim();
        return query
            ? batches.filter((batch) => {
                  if (!batch || typeof batch !== 'object') return false;
                  return Object.values(batch).some((value) =>
                      String(value || '').toLowerCase().includes(query)
                  );
              })
            : batches;
    } catch (error) {
        console.error("Consumable batch filter error:", error);
        return Array.isArray(batches) ? batches : [];
    }
};

onMounted(async () => {
    try {
        console.log("Loading products with batches...");
        const data = await ProductService.getProductsWithOrders();
        console.log("Raw API response:", data);
        
        // Ensure data is array and properly structured
        if (Array.isArray(data)) {
            // Add defensive data structure validation
            const validatedData = data.map(product => ({
                ...product,
                batches: Array.isArray(product.batches) ? product.batches.map(batch => ({
                    ...batch,
                    batchId: batch.item_id || batch.batchId || batch.id,
                    batchNumber: batch.batchNumber || batch.batch_number || '-',
                    serialNumbers: Array.isArray(batch.serialNumbers) ? batch.serialNumbers : []
                })) : []
            }));
            
            products.value = validatedData;
            console.log("Validated products data:", validatedData);
            console.log("Total products loaded:", validatedData.length);
        } else {
            console.warn("API returned non-array data:", data);
            products.value = [];
        }
        
        initFilters();
    } catch (error) {
        console.error("Data loading failed:", error);
        showErrorToast("Failed to load product data");
        products.value = []; // Ensure empty array state
    }
});

const showErrorToast = (message) => {
    if (toast.value) {
        toast.value.add({
            severity: "error",
            summary: "Error",
            detail: message,
            life: 3000,
        });
    }
};

const filterNonConsumableBatches = (batches) => {
    try {
        if (!Array.isArray(batches)) {
            console.warn("filterNonConsumableBatches: batches is not an array", batches);
            return [];
        }
        const query = NonConsumableBatchSearch.value.toLowerCase().trim();
        return query
            ? batches.filter((batch) => {
                  if (!batch || typeof batch !== 'object') return false;
                  return Object.values(batch).some((value) =>
                      String(value || '').toLowerCase().includes(query)
                  );
              })
            : batches;
    } catch (error) {
        console.error("Non-consumable batch filter error:", error);
        return Array.isArray(batches) ? batches : [];
    }
};
// Separate clear functions
const clearConsumableFilter = () => {
    ConsumableBatchSearch.value = "";
};

const clearNonConsumableBatchFilter = () => {
    NonConsumableBatchSearch.value = "";
};

// State management
const isDialog2Visible = ref(false); // Controls the dialog visibility

function getOrderSeverity(order) {
    const status = order.status?.toLowerCase();
    switch (status) {
        case "delivered":
        case "in_stock":
            return "success";

        case "cancelled":
        case "out_of_stock":
        case "expired":
        case "damaged":
        case "lost":
        case "retired":
            return "danger";

        case "pending":
        case "assigned":
            return "warn";

        case "returned":
            return "info";

        default:
            return null;
    }
}

function clearFilter() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        brand: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        category: { value: null, matchMode: FilterMatchMode.EQUALS },
        type: { value: null, matchMode: FilterMatchMode.EQUALS },
        unit: { value: null, matchMode: FilterMatchMode.EQUALS },
        minimum_stock: { value: null, matchMode: FilterMatchMode.EQUALS },
        stock_limit: { value: null, matchMode: FilterMatchMode.EQUALS },
        inventoryStatus: { value: null, matchMode: FilterMatchMode.EQUALS },
    };
}

// Function to open the first dialog
function toggleDataTable(item) {
    selectedItem.value = item; // Set the selected item
    isDialogVisible.value = true; // Open the dialog
}

// Function to open the second dialog
function toggleDataTable2(item) {
    selectedBatch.value = item; // Store the selected batch data
    selectedItem.value = item; // Set the selected item
    // Store the serial numbers for this specific batch
    serialNumbers.value = Array.isArray(item.serialNumbers) ? item.serialNumbers : [];
    isDialog2Visible.value = true; // Open the dialog
}

function getStockSeverity(product) {
    switch (product.inventoryStatus) {
        case "INSTOCK":
            return "success";

        case "LOWSTOCK":
            return "warn";

        case "OUTOFSTOCK":
            return "danger";

        default:
            return null;
    }
}

function formatDate(value) {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date(value));
}

function formatDateTime(value) {
    if (!value) return '-';
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    }).format(new Date(value));
}

onBeforeMount(async () => {
    try {
        const data = await ProductService.getProductsWithOrders();
        
        if (Array.isArray(data)) {
            // Ensure each product has required fields and proper structure
            products.value = data.map(product => ({
                ...product,
                id: product.id || Math.random(),
                batches: Array.isArray(product.batches) ? product.batches.map(batch => ({
                    ...batch,
                    batchId: batch.item_id || batch.batchId || batch.id,
                    serialNumbers: Array.isArray(batch.serialNumbers) ? batch.serialNumbers : []
                })) : []
            }));
        } else {
            products.value = [];
        }
    } catch (error) {
        console.error("Error loading products:", error);
        products.value = [];
    }
    // Other service calls...
});

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    brand: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    category: { value: null, matchMode: FilterMatchMode.EQUALS },
    inventoryStatus: { value: null, matchMode: FilterMatchMode.EQUALS },
});

function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: {
            operator: FilterOperator.AND,
            constraints: [
                { value: null, matchMode: FilterMatchMode.STARTS_WITH },
            ],
        },
        brand: {
            operator: FilterOperator.AND,
            constraints: [
                { value: null, matchMode: FilterMatchMode.STARTS_WITH },
            ],
        },
        category: {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
        },
        type: {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
        },
        unit: {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
        },
        minimum_stock: {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
        },
        stock_limit: {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
        },
        inventoryStatus: {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
        },
    };
}

function expandAll() {
    try {
        const validProducts = safeProducts.value;
        if (!Array.isArray(validProducts) || validProducts.length === 0) {
            console.warn("No products available for expansion");
            expandedRows.value = {};
            return;
        }
        
        expandedRows.value = validProducts.reduce((acc, p) => {
            if (p && typeof p.id !== 'undefined') {
                acc[p.id] = true;
            }
            return acc;
        }, {});
        
        console.log("Expanded all rows:", expandedRows.value);
    } catch (error) {
        console.error("Error expanding all rows:", error);
        expandedRows.value = {};
    }
}

function collapseAll() {
    try {
        expandedRows.value = {};
        batchExpandedRows.value = {};
        console.log("Collapsed all rows");
    } catch (error) {
        console.error("Error collapsing rows:", error);
        expandedRows.value = {};
        batchExpandedRows.value = {};
    }
}

function toggleRowExpansion(event) {
    try {
        // Check if the click is on a button or within a button element
        const target = event.originalEvent?.target;
        if (target && (target.closest('.p-button') || target.closest('button') || target.tagName === 'BUTTON')) {
            console.log("Click on button detected, skipping row expansion");
            return;
        }

        const rowData = event.data;
        if (!rowData || typeof rowData.id === 'undefined') {
            console.warn("Invalid row data for expansion:", rowData);
            return;
        }
        
        // Open dialog instead of expanding row
        selectedProductData.value = rowData;
        showProductDialog.value = true;
        
        console.log("Opening dialog for product:", rowData.name);
        
    } catch (error) {
        console.error("Error opening product dialog:", error);
    }
}

function toggleBatchRowExpansion(event) {
    try {
        // Check if the click is on a button or within a button element
        const target = event.originalEvent?.target;
        if (target && (target.closest('.p-button') || target.closest('button') || target.tagName === 'BUTTON')) {
            console.log("Click on button detected, skipping batch expansion");
            return;
        }

        const batchData = event.data;
        if (!batchData || typeof batchData.batchId === 'undefined') {
            console.warn("Invalid batch data for expansion:", batchData);
            return;
        }
        
        // Toggle batch expansion state
        if (batchExpandedRows.value[batchData.batchId]) {
            delete batchExpandedRows.value[batchData.batchId];
        } else {
            batchExpandedRows.value[batchData.batchId] = true;
        }
        
        console.log("Toggled batch expansion for:", batchData.batchId, batchExpandedRows.value[batchData.batchId] ? 'expanded' : 'collapsed');
    } catch (error) {
        console.error("Error toggling batch expansion:", error);
    }
}

function formatCurrency(value) {
    if (value == null || value === '' || isNaN(parseFloat(value))) return "₱0.00"; // Default if invalid or null
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(parseFloat(value));
}

function getStatusTextColor(status) {
    switch (status.toLowerCase()) {
        case "rented":
            return "text-yellow-600"; // Yellow for rented
        case "available":
        case "in_stock":
            return "text-green-600"; // Green for available/in_stock
        case "assigned":
            return "text-blue-600"; // Blue for assigned
        case "damaged":
        case "lost":
        case "out_of_stock":
            return "text-red-600"; // Red for damaged/lost/out_of_stock
        case "retired":
            return "text-gray-500"; // Gray for retired
        case "pending":
            return "text-yellow-500"; // Yellow for pending
        case "returned":
            return "text-purple-600"; // Purple for returned
        case "expired":
            return "text-red-700"; // Dark red for expired
        default:
            return "text-gray-600"; // Default gray
    }
}

function formatPrice(value) {
    if (value == null || isNaN(value)) return "₱0.00"; // Handle null or invalid value
    return `₱${parseFloat(value).toFixed(2).toLocaleString()}`; // Format to 2 decimal places with commas
}

</script>

<style scoped>
/* Make rows visually clickable */
:deep(.cursor-pointer) {
    cursor: pointer;
}

:deep(.cursor-pointer:hover) {
    background-color: #f8f9fa !important;
}

/* Ensure action buttons don't trigger row click */
:deep(.cursor-pointer .p-button) {
    position: relative;
    z-index: 10;
}

/* Add indent to product table cells for better readability */
:deep(.p-datatable-tbody > tr > td) {
    padding-left: 1.5rem !important;
}

/* Keep header cells normal */
:deep(.p-datatable-thead > tr > th) {
    padding-left: 1rem !important;
}
</style>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">View Inventory</div>
        <DataTable
            :value="safeProducts"
            dataKey="id"
             stripedRows
            v-model:filters="filters"
            filterDisplay="menu"
            :globalFilterFields="[
                'name',
                'brand',
                'category',
                'type',
                'unit',
                'minimum_stock',
                'stock_limit',
                'inventoryStatus',
            ]"
            tableStyle="min-width: 60rem"
            paginator
            :rows="5"
            @row-click="toggleRowExpansion"
            :rowClass="() => 'cursor-pointer'"
            :pt="{
                bodyCell: { style: 'padding: 0.75rem 1rem;' },
                headerCell: { style: 'padding: 0.75rem 1rem;' }
            }"
        >
            <template #header>
                <div class="flex justify-between items-center">
                    <!-- Filter Controls -->
                    <div class="flex items-center gap-2">
                        <Button
                            type="button"
                            icon="pi pi-filter-slash"
                            label="Clear"
                            outlined
                            @click="clearFilter()"
                        />
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText
                                v-model="filters['global'].value"
                                placeholder="Keyword Search"
                            />
                        </IconField>
                    </div>

                    <!-- Expand/Collapse Buttons -->
                    <div class="flex flex-wrap justify-end gap-2">
                        <!-- Removed expand/collapse buttons since we're using dialogs now -->
                    </div>
                </div>
            </template>

            <Column
                field="name"
                header="Item Name"
                style="min-width: "
            ></Column>
            <Column field="brand" sortable header="Brand"></Column>
            <Column
                field="category"
                sortable
                header="Category"
                style="width: 10rem"
            ></Column>
            <Column
                field="type"
                sortable
                header="Type"
                style="width: 10rem"
            ></Column>
            <Column
                field="unit"
                sortable
                header="Unit"
                style="width: 8rem"
            ></Column>
            <Column
                field="created_at"
                sortable
                header="Date Added"
                style="width: 12rem"
            >
                <template #body="slotProps">
                    <span>{{ formatDateTime(slotProps.data.created_at) }}</span>
                </template>
            </Column>
            <Column
                field="minimum_stock"
                sortable
                header="Minimum Stock"
                style="width: 9rem"
            >
                <template #body="slotProps">
                    <span>{{ slotProps.data.minimum_stock || 0 }}</span>
                </template>
            </Column>
            <Column
                field="stock_limit"
                sortable
                header="Stock Limit"
                style="width: 10rem"
            >
                <template #body="slotProps">
                    <span>{{ slotProps.data.stock_limit || 0 }}</span>
                </template>
            </Column>
            <Column field="inventoryStatus" sortable header="Status">
                <template #body="slotProps">
                    <Tag
                        :value="slotProps.data.inventoryStatus"
                        :severity="getStockSeverity(slotProps.data)"
                    />
                </template>
            </Column>

            <!-- Remove the expansion template, we'll use dialog instead -->
        </DataTable>

        <!-- Product Details Dialog -->
        <Dialog
            v-model:visible="showProductDialog"
            :header="`${selectedProductForDialog?.category === 'Non-Consumable' ? 'Serial Numbers' : 'Batch Numbers'} - ${selectedProductForDialog?.name || 'Product'}`"
            :style="{ width: '95vw', maxWidth: '1400px' }"
            :modal="true"
            :dismissableMask="true"
        >
            <div v-if="selectedProductData">
                <!--Consumable Batch Table-->
                <DataTable
                    class="p-datatable-sm mb-5 mt-5 ml-5"
                    :paginator="true"
                    :rows="5"
                    v-model:expandedRows="batchExpandedRows"
                    :value="
                        filterConsumableBatches(selectedProductData?.batches || [])
                    "
                    dataKey="batchId"
                    v-if="selectedProductData?.category === 'Consumable'"
                    @row-click="toggleBatchRowExpansion"
                    :rowClass="() => 'cursor-pointer'"
                    stripedRows
                    :pt="{
                        bodyRow: { style: 'height: 3.5rem;' }
                    }"
                >
                    <template #header>
                        <div class="flex items-center gap-2 mb-5">
                            <h5>Batch List for {{ selectedProductData.name }}</h5>
                            <Button
                                type="button"
                                icon="pi pi-filter-slash"
                                label="Clear"
                                outlined
                                @click="clearConsumableFilter"
                            />
                            <IconField>
                                <InputIcon>
                                    <i class="pi pi-search" />
                                </InputIcon>
                                <InputText
                                    v-model="ConsumableBatchSearch"
                                    placeholder="Search consumable batches..."
                                    class="w-full"
                                />
                            </IconField>
                        </div>
                    </template>
                    <Column
                        field="batchNumber"
                        header="Batch Number"
                        sortable
                    >
                        <template #body="slotProps">
                            <span>{{ slotProps.data.batchNumber }}</span>
                        </template>
                    </Column>
                    <Column
                        field="quantity"
                        header="Quantity"
                        sortable
                    >
                        <template #body="slotProps">
                            <span>{{ slotProps.data.quantity }}</span>
                        </template>
                    </Column>
                    <Column
                        field="purchaseDate"
                        header="Arrival Date"
                        sortable
                    >
                        <template #body="slotProps">
                            <span>{{
                                formatDateTime(slotProps.data.purchaseDate)
                            }}</span>
                        </template>
                    </Column>
                    <Column
                        field="purchasePrice"
                        header="Purchase Price"
                        sortable
                    >
                        <template #body="slotProps">
                            <span>{{
                                formatPrice(slotProps.data.purchasePrice)
                            }}</span>
                        </template>
                    </Column>

                    <Column field="srp" header="SRP" sortable>
                        <template #body="slotProps">
                            <span>{{ 
                                (slotProps.data.srp && !isNaN(parseFloat(slotProps.data.srp)))
                                ? `₱${parseFloat(slotProps.data.srp).toFixed(2)}` 
                                : '-' 
                            }}</span>
                        </template>
                    </Column>
                    <Column field="unit" header="Unit" sortable>
                        <template #body="slotProps">
                            <span>{{ slotProps.data.unit }}</span>
                        </template>
                    </Column>
                    <Column
                        field="supplier"
                        header="Supplier"
                        sortable
                    >
                        <template #body="slotProps">
                            <span>{{ slotProps.data.supplier }}</span>
                        </template>
                    </Column>

                    <Column field="expDate" header="Exp Date" sortable>
                        <template #body="slotProps">
                            <span style="color: red">{{
                                formatDate(slotProps.data.expDate)
                            }}</span>
                        </template>
                    </Column>
                    <Column field="status" header="Status" sortable>
                        <template #body="slotProps">
                            <Tag
                                :value="slotProps.data.status"
                                :severity="getOrderSeverity(slotProps.data)"
                            />
                        </template>
                    </Column>

                </DataTable>

                <!--Non-Consumable Batch Table-->
                <DataTable
                    class="p-datatable-sm mb-5 mt-5 ml-5"
                    :paginator="true"
                    :rows="5"
                    v-model:expandedRows="batchExpandedRows"
                    :value="
                        filterNonConsumableBatches(
                            selectedProductData?.batches || []
                        )
                    "
                    dataKey="batchId"
                    v-if="selectedProductData?.category === 'Non-Consumable'"
                    @row-click="toggleBatchRowExpansion"
                    :rowClass="() => 'cursor-pointer'"
                    stripedRows
                    :pt="{
                        bodyRow: { style: 'height: 3.5rem;' }
                    }"
                >
                    <template #header>
                        <div class="flex items-center gap-2 mb-5">
                            <h5>Serial Number List for {{ selectedProductData.name }}</h5>
                            <Button
                                type="button"
                                icon="pi pi-filter-slash"
                                label="Clear"
                                outlined
                                @click="clearNonConsumableBatchFilter"
                            />
                            <IconField>
                                <InputIcon>
                                    <i class="pi pi-search" />
                                </InputIcon>
                                <InputText
                                    v-model="NonConsumableBatchSearch"
                                    placeholder="Search non-consumable items..."
                                    class="w-full"
                                />
                            </IconField>
                        </div>
                    </template>

                    <Column
                        field="batchNumber"
                        header="Serial Number"
                        sortable
                    >
                        <template #body="slotProps">
                            <span>{{ slotProps.data.batchNumber }}</span>
                        </template>
                    </Column>
                    <Column
                        field="purchaseDate"
                        header="Arrival Date"
                        sortable
                    >
                        <template #body="slotProps">
                            <span>{{
                                slotProps.data.purchaseDate ? formatDateTime(slotProps.data.purchaseDate) : '-'
                            }}</span>
                        </template>
                    </Column>
                    <Column
                        field="purchasePrice"
                        header="Purchase Price"
                        sortable
                    >
                        <template #body="slotProps">
                            <span>{{
                                formatPrice(slotProps.data.purchasePrice)
                            }}</span>
                        </template>
                    </Column>

                    <Column
                        field="supplier"
                        header="Supplier"
                        sortable
                    >
                        <template #body="slotProps">
                            <span>{{ slotProps.data.supplier }}</span>
                        </template>
                    </Column>

                    <Column
                        field="rentalprice"
                        header="Rental Price"
                        sortable
                    >
                        <template #body="slotProps">
                            <span>{{ slotProps.data.rentalprice }}</span>
                        </template>
                    </Column>

                    <Column field="warranty" header="Warranty" sortable>
                        <template #body="slotProps">
                            <span>{{ slotProps.data.warrantyValue }}
                                {{ slotProps.data.warrantyUnit }}</span>
                        </template>
                    </Column>
                    <Column
                        field="quantity"
                        header="Quantity"
                        sortable
                    >
                        <template #body="slotProps">
                            <span>{{ slotProps.data.quantity }}</span>
                        </template>
                    </Column>

                    <Column field="status" header="Status" sortable>
                        <template #body="slotProps">
                            <Tag
                                :value="slotProps.data.status"
                                :severity="getOrderSeverity(slotProps.data)"
                            />
                        </template>
                    </Column>

                    <column header="Items">
                        <template #body="slotProps">
                            <div class="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    icon="pi pi-list"
                                    @click="toggleDataTable2(slotProps.data)"
                                    rounded
                                    class="mr-2"
                                    
                                />
                                <Dialog
                                    v-model:visible="isDialog2Visible"
                                    :header="`Items per Batch | ${
                                        selectedBatch?.batchNumber || 'N/A'
                                    }`"
                                    :breakpoints="{ '960px': '75vw' }"
                                    :style="{ width: '60vw' }"
                                    :modal="true"
                                    :dismissable-mask="true"
                                >
                                    <DataTable
                                        v-model:selection="selectedProduct"
                                        :value="serialNumbers"
                                        selectionMode="single"
                                    >
                                        <DataTable
                                            class="p-datatable-xl"
                                            :value="serialNumbers"
                                            :totalRecords="serialNumbers.length"
                                            :rows="5"
                                            paginator
                                        >
                                            <Column
                                                field="serialNumber"
                                                header="Serial Number"
                                                sortable
                                            ></Column>
                                            <Column
                                                field="status"
                                                header="Status"
                                                sortable
                                            >
                                                <!-- Custom Template for Status -->
                                                <template #body="slotProps">
                                                    <span
                                                        :class="
                                                            getStatusTextColor(
                                                                slotProps.data
                                                                    .status
                                                            )
                                                        "
                                                        class="font-bold"
                                                    >
                                                        {{
                                                            slotProps.data
                                                                .status
                                                        }}
                                                    </span>
                                                </template>
                                            </Column>

                                            <Column
                                                field="roomNumber"
                                                header="Assigned Room"
                                                sortable
                                            ></Column>
                                        </DataTable>
                                    </DataTable>
                                </Dialog>
                            </div>
                        </template>
                    </column>
                </DataTable>
            </div>
        </Dialog>
    </div>

    <template></template>
</template>
