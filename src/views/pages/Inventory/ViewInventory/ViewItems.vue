<script setup>
import { CustomerService } from "@/service/CustomerService";
import { ProductService } from "@/service/ProductService";
import { FilterMatchMode, FilterOperator } from "@primevue/core/api";
import { onBeforeMount, ref } from "vue";

const customers1 = ref(null);
const customers2 = ref(null);
const customers3 = ref(null);
const loading1 = ref(null);
const expandedRows = ref([]);
const batchExpandedRows = ref([]);

const op2 = ref();
const selectedProduct = ref(null);

const products = ref([]); // Use `ref` for reactivity

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

function toggleDataTable(event) {
    op2.value.toggle(event);
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

function onProductSelect(event) {
    console.log("Selected serial number:", event.data);
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

function formatPrice(value) {
    return parseFloat(value).toFixed(2);
}

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
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Manage Items</div>
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

                        <column header="Items">
                            <template #body="slotProps">
                                <div class="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        icon="pi pi-list"
                                        @click="toggleDataTable"
                                        rounded
                                        class="mr-2"
                                    />
                                    <Popover
                                        ref="op2"
                                        id="overlay_panel"
                                        style="width: 500px"
                                    >
                                        <DataTable
                                            v-model:selection="selectedProduct"
                                            :value="products"
                                            selectionMode="single"
                                            paginator
                                            :rows="5"
                                            :totalRecords="products.length"
                                            @row-select="onProductSelect"
                                        >
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <h6>
                                                    Items for
                                                    {{
                                                        slotProps.data
                                                            .batchNumber
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

                                            <DataTable
                                                class="p-datatable-sm"
                                                :value="
                                                    slotProps.data.serialNumbers
                                                "
                                            >
                                                <Column
                                                    field="serialNumber"
                                                    header="Serial Number"
                                                    sortable
                                                ></Column>
                                            </DataTable>
                                        </DataTable>
                                    </Popover>
                                </div>
                            </template>
                        </column>
                    </DataTable>

                    <Transition name="fade">
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
                                        formatPrice(
                                            slotProps.data.purchasePrice,
                                        )
                                    }}</span>
                                </template>
                            </Column>
                            <Column
                                field="unit"
                                header="Unit"
                                sortable
                            ></Column>
                            <Column
                                field="supplier"
                                header="Supplier"
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
                                field="rental"
                                header="Rental"
                                sortable
                            ></Column>
                            <Column
                                field="rentalprice"
                                header="Rental Price"
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
                                        :severity="
                                            getOrderSeverity(slotProps.data)
                                        "
                                    />
                                </template>
                            </Column>

                            <column header="Items">
                                <template #body="slotProps">
                                    <div class="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            icon="pi pi-list"
                                            @click="toggleDataTable"
                                            rounded
                                            class="mr-2"
                                        />
                                        <Popover
                                            ref="op2"
                                            id="overlay_panel"
                                            style="width: 450px"
                                        >
                                            <DataTable
                                                v-model:selection="
                                                    selectedProduct
                                                "
                                                :value="products"
                                                selectionMode="single"
                                                @row-select="onProductSelect"
                                            >
                                                <div
                                                    class="flex items-center gap-2"
                                                >
                                                    <h6>
                                                        Items for
                                                        {{
                                                            slotProps.data
                                                                .batchNumber
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
                                                                filters[
                                                                    'global'
                                                                ].value
                                                            "
                                                            placeholder="Keyword Search"
                                                        />
                                                    </IconField>
                                                </div>

                                                <DataTable
                                                    class="p-datatable-xl"
                                                    :value="
                                                        slotProps.data
                                                            .serialNumbers
                                                    "
                                                    paginator
                                                    :rows="8"
                                                    :totalRecords="
                                                        products.length
                                                    "
                                                    :currentPage="1"
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
                                                    ></Column>
                                                    <Column
                                                        field="assignedroom"
                                                        header="Assigned Room"
                                                        sortable
                                                    ></Column>
                                                </DataTable>
                                            </DataTable>
                                        </Popover>
                                    </div>
                                </template>
                            </column>
                        </DataTable>
                    </Transition>
                </div>
            </template>
        </DataTable>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
