<script setup>
import { CustomerService } from "@/service/CustomerService";
import { ProductService } from "@/service/ProductService";
import { RoomService } from "@/service/RoomService";
import { FilterMatchMode, FilterOperator } from "@primevue/core/api";

import { onBeforeMount, ref } from "vue";

const customers1 = ref(null);
const customers2 = ref(null);
const customers3 = ref(null);
const loading1 = ref(null);
const expandedRows = ref([]);
const batchExpandedRows = ref([]);
const toast = ref(null);

// State variables

const products = ref([]); // Products for the DataTable
const selectedProduct = ref(null); // Selected product from the DataTable
const selectedItem = ref(null); // Selected item details
const popoverRef = ref(null); // Reference to the Popover

const availableRooms = ref([]);
const serialNumbers = ref([]);
// For damaged item reporting

// Fetch available rooms from RoomService
onBeforeMount(() => {
    availableRooms.value = RoomService.getAvailableRooms();
});

// Function to handle product selection
function onProductSelect(event) {
    console.log("Selected Product:", event.data);
    selectedProduct.value = event.data; // Update the selected product
    if (popoverRef.value) {
        popoverRef.value.hide(); // Close the popover
    }
}

// Function to confirm serial deletion

// State management
const isDialog2Visible = ref(false); // Controls the dialog visibility
const isDialogVisible = ref(false); // Controls the dialog visibility

function getOrderSeverity(order) {
    switch (order.status) {
        case "DELIVERED":
            return "success";

        case "CANCELLED":
            return "danger";

        case "PENDING":
            return "warn";

        case "RETURNED":
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
    selectedItem.value = item; // Set the selected item
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

onBeforeMount(() => {
    ProductService.getProductsWithOrdersSmall().then((data) => {
        console.log(data); // Check the data being loaded
        products.value = data;
    });
    // Other service calls...
});

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    brand: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    category: { value: null, matchMode: FilterMatchMode.EQUALS },
    inventoryStatus: { value: null, matchMode: FilterMatchMode.EQUALS },
});

onBeforeMount(() => {
    ProductService.getProductsWithOrdersSmall().then(
        (data) => (products.value = data),
    );
    CustomerService.getCustomersLarge().then((data) => {
        customers1.value = data;
        loading1.value = false;
        customers1.value.forEach(
            (customer) => (customer.date = new Date(customer.date)),
        );
    });
    CustomerService.getCustomersLarge().then(
        (data) => (customers2.value = data),
    );
    CustomerService.getCustomersMedium().then(
        (data) => (customers3.value = data),
    );
    initFilters();
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
        inventoryStatus: {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
        },
    };
}

function expandAll() {
    expandedRows.value = products.value.reduce(
        (acc, p) => (acc[p.id] = true) && acc,
        {},
    );
}

function collapseAll() {
    expandedRows.value = null;
}

function formatCurrency(value) {
    if (value == null || isNaN(value)) return "₱0.00"; // Default if invalid or null
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(value);
}

function getStatusTextColor(status) {
    switch (status.toLowerCase()) {
        case "rented":
            return "text-yellow-600"; // Yellow for rented
        case "available":
            return "text-green-600"; // Green for available
        case "damaged":
            return "text-red-600"; // Red for damaged
        case "assigned":
            return "text-blue-600"; // Blue for assigned
        default:
            return "text-gray-600"; // Default gray
    }
}

function formatPrice(value) {
    if (value == null || isNaN(value)) return "₱0.00"; // Handle null or invalid value
    return `₱${parseFloat(value).toFixed(2).toLocaleString()}`; // Format to 2 decimal places with commas
}
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Item Control</div>
        <DataTable
            v-model:expandedRows="expandedRows"
            :value="products"
            dataKey="id"
            v-model:filters="filters"
            filterDisplay="menu"
            :globalFilterFields="[
                'name',
                'brand',
                'category',
                'inventoryStatus',
            ]"
            tableStyle="min-width: 60rem"
            paginator
            :rows="10"
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
                        <Button
                            text
                            icon="pi pi-plus"
                            label="Expand All"
                            @click="expandAll"
                        />
                        <Button
                            text
                            icon="pi pi-minus"
                            label="Collapse All"
                            @click="collapseAll"
                        />
                    </div>
                </div>
            </template>

            <Column expander style="width: 2rem" />
            <Column field="name" header="Item Name" style="min-width:"></Column>
            <Column field="brand" sortable header="Brand"></Column>
            <Column field="quantity" sortable header="Quantity"></Column>
            <Column field="description" sortable header="Description"></Column>
            <Column
                field="category"
                sortable
                header="Category"
                style="width: 10rem"
            ></Column>
            <Column field="inventoryStatus" sortable header="Status">
                <template #body="slotProps">
                    <Tag
                        :value="slotProps.data.inventoryStatus"
                        :severity="getStockSeverity(slotProps.data)"
                    />
                </template>
            </Column>

            <template #expansion="slotProps">
                <div class="p-4">
                    <div class="flex items-center gap-2 mb-4">
                        <h5>Batch List for {{ slotProps.data.name }}</h5>
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

                    <!--Consumable Batch Table-->
                    <DataTable
                        class="p-datatable-sm"
                        v-model:expandedRows="batchExpandedRows"
                        :value="slotProps.data.batches"
                        dataKey="batchId"
                        v-if="slotProps.data.category === 'Consumable'"
                    >
                        <Column
                            field="batchNumber"
                            header="Batch Number"
                            sortable
                        ></Column>
                        <Column
                            field="quantity"
                            header="Quantity"
                            sortable
                        ></Column>
                        <Column
                            field="purchaseDate"
                            header="Purchase Date"
                            sortable
                        ></Column>
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
                                <span
                                    >₱{{ slotProps.data.srp.toFixed(2) }}</span
                                >
                            </template>
                        </Column>
                        <Column field="unit" header="Unit" sortable></Column>
                        <Column
                            field="supplier"
                            header="Supplier"
                            sortable
                        ></Column>

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
                        <Column
                            field="Actions"
                            header="Actions"
                            :exportable="false"
                            style="min-width: 3rem"
                            class="gap-2"
                        >
                        </Column>

                        <column header="Items">
                            <template #body="slotProps">
                                <div class="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        icon="pi pi-list"
                                        @click="toggleDataTable(slotProps.data)"
                                        rounded
                                        class="mr-2"
                                    />
                                    <Dialog
                                        header="Items"
                                        v-model:visible="isDialogVisible"
                                        :breakpoints="{ '960px': '75vw' }"
                                        :style="{ width: '40vw' }"
                                        :modal="true"
                                        :dismissable-mask="true"
                                    >
                                        <!-- Header Section -->
                                        <template #header>
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <h6>
                                                    Items for
                                                    {{
                                                        slotProps?.data
                                                            ?.batchNumber
                                                    }}
                                                </h6>
                                                <Button
                                                    type="button"
                                                    icon="pi pi-filter-slash"
                                                    label="Clear"
                                                    outlined
                                                    @click="clearFilter()"
                                                />
                                                <IconField>
                                                    <InputIcon>
                                                        <i
                                                            class="pi pi-search"
                                                        />
                                                    </InputIcon>
                                                    <InputText
                                                        v-model="
                                                            filters['global']
                                                                .value
                                                        "
                                                        placeholder="Keyword Search"
                                                    />
                                                </IconField>
                                            </div>
                                        </template>

                                        <!-- Nested Data Table -->
                                        <DataTable
                                            class="p-datatable-sm"
                                            :value="
                                                slotProps?.data?.serialNumbers
                                            "
                                        >
                                            <Column
                                                field="serialNumber"
                                                header="Serial Number"
                                                sortable
                                            />
                                            <Column
                                                field="srp"
                                                header="Suggested Retail Price (SRP)"
                                                sortable
                                            >
                                                <template #body="slotProps">
                                                    {{
                                                        formatCurrency(
                                                            slotProps.data.srp,
                                                        )
                                                    }}
                                                </template>
                                            </Column>

                                            <!-- Status Column -->
                                            <Column
                                                field="status"
                                                header="Status"
                                                sortable
                                                style="min-width: 8rem"
                                            >
                                                <template #body="slotProps">
                                                    <span
                                                        :class="{
                                                            'text-green-500':
                                                                slotProps.data
                                                                    .status ===
                                                                'Available',
                                                            'text-red-500':
                                                                slotProps.data
                                                                    .status ===
                                                                'Sold',
                                                        }"
                                                    >
                                                        {{
                                                            slotProps.data
                                                                .status
                                                        }}
                                                    </span>
                                                </template>
                                            </Column>
                                        </DataTable>

                                        <!-- Main Data Table -->
                                        <DataTable
                                            v-model:selection="selectedProduct"
                                            :value="products"
                                            selectionMode="single"
                                            paginator
                                            :rows="5"
                                            :totalRecords="products.length"
                                            @row-select="onProductSelect"
                                        >
                                        </DataTable>

                                        <!-- Footer Section -->
                                        <template #footer>
                                            <Button
                                                label="Close"
                                                @click="isDialogVisible = false"
                                            />
                                        </template>
                                    </Dialog>
                                </div>
                            </template>
                        </column>
                    </DataTable>

                    <!--Non-Consumable Batch Table-->
                    <DataTable
                        class="p-datatable-sm"
                        v-model:expandedRows="batchExpandedRows"
                        :value="slotProps.data.batches"
                        dataKey="batchId"
                        v-if="slotProps.data.category === 'Non-Consumable'"
                    >
                        <Column
                            field="batchNumber"
                            header="Batch Number"
                            sortable
                        ></Column>

                        <Column
                            field="purchaseDate"
                            header="Purchase Date"
                            sortable
                        ></Column>
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
                        <Column field="unit" header="Unit" sortable></Column>

                        <Column
                            field="supplier"
                            header="Supplier"
                            sortable
                        ></Column>

                        <Column
                            field="rental"
                            header="Rental"
                            sortable
                        ></Column>

                        <Column
                            field="rentalprice"
                            header="Rental Price"
                            sortable
                        ></Column>

                        <Column field="warranty" header="Warranty" sortable>
                            <template #body="slotProps">
                                <span
                                    >{{ slotProps.data.warrantyValue }}
                                    {{ slotProps.data.warrantyUnit }}</span
                                >
                            </template>
                        </Column>
                        <Column
                            field="quantity"
                            header="Quantity"
                            sortable
                        ></Column>

                        <Column
                            field="minimumstocks"
                            header="Minimum Stocks"
                            sortable
                        ></Column>
                        <Column
                            field="stocklimit"
                            header="Stock Limit"
                            sortable
                        ></Column>
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
                                        @click="
                                            toggleDataTable2(slotProps.data)
                                        "
                                        rounded
                                        class="mr-2"
                                    />
                                    <Dialog
                                        v-model:visible="isDialog2Visible"
                                        :header="`Items for Batch | ${slotProps.data?.batchNumber || 'N/A'}`"
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
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <Button
                                                    type="button"
                                                    icon="pi pi-filter-slash"
                                                    label="Clear"
                                                    outlined
                                                    @click="clearFilter()"
                                                />
                                                <IconField>
                                                    <InputIcon>
                                                        <i
                                                            class="pi pi-search"
                                                        />
                                                    </InputIcon>
                                                    <InputText
                                                        v-model="
                                                            filters['global']
                                                                .value
                                                        "
                                                        placeholder="Keyword Search"
                                                    />
                                                </IconField>
                                            </div>

                                            <DataTable
                                                class="p-datatable-xl"
                                                :value="
                                                    slotProps.data.serialNumbers
                                                "
                                                :totalRecords="
                                                    slotProps.data.serialNumbers
                                                        .length
                                                "
                                                :rows="5"
                                                paginator
                                                @row-select="onProductSelect"
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
                                                                    slotProps
                                                                        .data
                                                                        .status,
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
                                                    field="rental"
                                                    header="Rental"
                                                    sortable
                                                ></Column>
                                                <Column
                                                    field="rentalPrice"
                                                    header="Rental Price"
                                                    sortable
                                                >
                                                    <template #body="slotProps">
                                                        {{
                                                            formatPrice(
                                                                slotProps.data
                                                                    .rentalPrice,
                                                            )
                                                        }}
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
            </template>
        </DataTable>
    </div>

    <template>
        <Toast ref="toast" />
    </template>
</template>
