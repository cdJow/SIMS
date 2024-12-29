<script setup>
import { ProductService } from "@/service/ProductService";
import { computed, onMounted, ref, watch } from "vue";

// Reactive state for serial numbers
const newSerialNumber = ref(""); // Holds the input for the new serial number
const serialNumbers = ref([]); // Array of existing serial numbers
const arrivalDate = ref(null); // For tracking the arrival date
const isBatchRental = ref(false); // Tracks if the batch is set as rental
const batchRentalPrice = ref(null); // Batch rental price
const sliderValue = ref(50);
const showInfoDialog = ref(false);
// Reactive state for input fields in Step 1
const productName = ref(""); // Product Name
const brand = ref(""); // Brand
const category = ref(""); // Category

// Reference for the Popover
const op2 = ref(null);

// Reactive state for products and selected product
const products = ref([]); // Holds the list of products
const selectedProduct = ref(null); // For storing the selected product

// Computed property to filter consumable items
const NonconsumableProducts = computed(() =>
    products.value.filter((product) => product.category === "Non-Consumable"),
);

// Function to fetch products from ProductService
const fetchProducts = () => {
    try {
        const response = ProductService.getProductsWithOrdersData(); // Fetch the local product data
        products.value = response; // Assign the fetched products to the products ref
    } catch (error) {
        console.error("Error fetching products:", error);
    }
};

const onProductSelect = (selected) => {
    if (selected) {
        // Populate the fields with the selected product data
        productName.value = selected.name || ""; // Populate Product Name
        brand.value = selected.brand || ""; // Populate Brand
        category.value = selected.category || ""; // Populate Category

        // Close the Popover
        if (op2.value) {
            op2.value.hide();
        }
    }
};

// Call fetchProducts when the component is mounted
onMounted(() => {
    fetchProducts(); // Load products on component mount
});

watch([isBatchRental, batchRentalPrice], ([batchRental, price]) => {
    if (batchRental) {
        // Apply batch rental price to all serial numbers
        serialNumbers.value = serialNumbers.value.map((item) => ({
            ...item,
            isRental: true,
            price,
        }));
    } else {
        // Reset rental settings if batch rental is disabled
        serialNumbers.value = serialNumbers.value.map((item) => ({
            ...item,
            isRental: false,
            price: null,
        }));
    }
});
const addSerialNumber = () => {
    if (newSerialNumber.value.trim()) {
        serialNumbers.value.push({
            serial: newSerialNumber.value.trim(),
            isRental: isBatchRental.value, // Apply batch rental status
            price: isBatchRental.value ? batchRentalPrice.value : null, // Apply batch rental price
        });
        newSerialNumber.value = ""; // Clear the input field
    }
};

const removeSerialNumber = (index) => {
    serialNumbers.value.splice(index, 1);
};

const dropdownItems = ref([
    { name: "Day", code: "Day" },
    { name: "Month", code: "Month" },
    { name: "Years", code: "Years" },
]);

// Function to toggle the DataTable Popover
const toggleDataTable = (event) => {
    if (op2.value) {
        op2.value.toggle(event); // Toggle the visibility of the Popover
    }
};
</script>

<template>
    <Fluid>
        <div class="">
            <div class="card flex flex-col gap-4">
                <div class="font-semibold text-xl">Add Items</div>

                <!-- Section 1: Item Details -->
                <div class="flex flex-wrap gap-4">
                    <!-- Product Name -->
                    <div class="flex flex-col grow basis-0 gap-2">
                        <label for="productName">Product Name</label>
                        <InputText
                            id="productName"
                            type="text"
                            placeholder="Product Name"
                            v-model="productName"
                        />
                        <div class="flex flex-wrap gap-2">
                            <!-- Existing Items Button -->
                            <Button
                                type="button"
                                icon="pi pi-list"
                                label="Existing Items"
                                @click="toggleDataTable"
                            />
                            <!-- Popover for Existing Items -->
                            <Popover
                                ref="op2"
                                id="overlay_panel"
                                style="width: 38rem"
                            >
                                <DataTable
                                    v-model:selection="selectedProduct"
                                    :value="NonconsumableProducts"
                                    selectionMode="single"
                                    paginator
                                    :rows="5"
                                    @row-select="onProductSelect"
                                >
                                    <Column
                                        field="name"
                                        header="Name"
                                        sortable
                                        style="min-width: 12rem"
                                    ></Column>
                                    <Column
                                        field="brand"
                                        header="Brand"
                                        sortable
                                        style="min-width: 8rem"
                                    ></Column>
                                    <Column
                                        field="category"
                                        header="Category"
                                        sortable
                                        style="min-width: 8rem"
                                    ></Column>
                                    <Column
                                        header="Actions"
                                        style="min-width: 8rem"
                                    >
                                        <template #body="slotProps">
                                            <Button
                                                label="Select"
                                                icon="pi pi-check"
                                                class="w-full"
                                                @click="
                                                    onProductSelect(
                                                        slotProps.data,
                                                    )
                                                "
                                            ></Button>
                                        </template>
                                    </Column>
                                </DataTable>
                            </Popover>
                        </div>
                    </div>
                    <!-- Brand -->
                    <div class="flex flex-col grow basis-0 gap-2">
                        <label for="brand">Brand</label>
                        <InputText
                            id="brand"
                            type="text"
                            placeholder="Brand"
                            v-model="brand"
                        />
                    </div>
                    <!-- Category -->
                    <div class="flex flex-col grow basis-0 gap-2">
                        <label for="category">Category</label>
                        <InputText
                            id="category"
                            type="text"
                            placeholder="Non-Consumable"
                            v-model="category"
                            readonly
                        />
                    </div>
                </div>

                <!-- Section 2: Batch Details -->
                <div class="grid grid-cols-3 gap-4">
                    <div class="flex flex-col grow basis-0 gap-2">
                        <label for="batchNumber">Batch Number</label>
                        <InputText
                            id="batchNumber"
                            type="text"
                            placeholder="Batch Number"
                        />
                    </div>
                    <div class="flex flex-col grow basis-0 gap-2">
                        <label for="quantity">Quantity</label>
                        <InputText
                            id="quantity"
                            type="number"
                            placeholder="Quantity"
                        />
                    </div>
                    <div class="flex flex-col grow basis-0 gap-2">
                        <label for="purchasePrice">Purchase Price</label>
                        <InputText
                            id="purchasePrice"
                            type="number"
                            placeholder="Purchase Price"
                        />
                    </div>
                </div>

                <!-- Section 3: Stocks Details -->
                <div class="grid grid-cols-3 gap-6 items-start">
                    <!-- Batch Rental Section -->
                    <div>
                        <!-- Label, Question Mark, and Checkbox -->
                        <div class="flex items-center gap-2">
                            <label class="font-medium">Set Rental Price</label>
                            <i
                                class="pi pi-question-circle text-blue-500 cursor-pointer"
                                @click="showInfoDialog = true"
                            ></i>
                            <Checkbox v-model="isBatchRental" binary>
                                Apply Batch Rental
                            </Checkbox>
                        </div>

                        <!-- Rental Price Input -->
                        <div>
                            <InputText
                                id="batchRentalPrice"
                                type="number"
                                placeholder="Enter rental price for batch"
                                v-model="batchRentalPrice"
                                class="w-full"
                                :disabled="!isBatchRental"
                            />
                        </div>
                    </div>

                    <!-- Minimum Stock Section -->
                    <div>
                        <label for="minimumStock" class="font-medium"
                            >Minimum Stock</label
                        >
                        <InputText
                            id="minimumStock"
                            type="number"
                            placeholder="Enter Minimum Stock"
                            class="w-full"
                        />
                    </div>

                    <!-- Stock Limit Section -->
                    <div>
                        <label for="stockLimit" class="font-medium"
                            >Stock Limit</label
                        >
                        <InputText
                            id="stockLimit"
                            type="number"
                            placeholder="Enter Stock Limit"
                            class="w-full"
                        />
                    </div>

                    <!-- Dialog Component -->

                    <Dialog
                        v-model:visible="showInfoDialog"
                        header="Batch Rental Information"
                        :modal="true"
                        :closable="true"
                        :dismissable-mask="true"
                        class="w-1/3"
                        :breakpoints="{ '960px': '75vw' }"
                        :style="{ width: '30vw' }"
                    >
                        <p>
                            The batch rental feature allows you to set a rental
                            price for the entire batch. If enabled, individual
                            item rental settings will be disabled.

                            <lable>
                                <label class="text-red-500">Note:</label>
                                You can Set the rental price for each Item
                            </lable>
                        </p>
                    </Dialog>
                </div>

                <div class="grid grid-cols-2 gap-6">
                    <div class="flex flex-col grow basis-0 gap-2">
                        <label for="unit">Unit</label>
                        <InputText id="unit" type="text" placeholder="Unit" />
                    </div>
                    <div class="flex flex-col grow basis-0 gap-2">
                        <label for="supplier">Supplier</label>
                        <InputText
                            id="supplier"
                            type="text"
                            placeholder="Supplier"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-6">
                    <!-- Warranty and Day/Month/Year Section -->
                    <div class="grid grid-cols-2 items-start gap-4">
                        <!-- Warranty Input and Slider -->
                        <div class="flex flex-col gap-2">
                            <label for="batchNumber" class="font-medium"
                                >Warranty</label
                            >
                            <InputText
                                v-model.number="sliderValue"
                                class="w-full"
                            />
                            <Slider v-model="sliderValue" class="mt-2 w-full" />
                        </div>

                        <!-- Day / Month / Year Select -->
                        <div class="flex flex-col gap-2">
                            <label for="dropdown" class="font-medium"
                                >Select Duration</label
                            >
                            <Select
                                v-model="dropdownItem"
                                :options="dropdownItems"
                                optionLabel="name"
                                placeholder="Select Day / Month / Year"
                                class="w-full"
                            ></Select>
                        </div>
                    </div>

                    <!-- Arrival Date Section -->
                    <div class="flex flex-col gap-2">
                        <label for="arrivalDate" class="font-medium"
                            >Purchase Date</label
                        >
                        <DatePicker
                            id="PurchaseDate"
                            placeholder="Purchase Date"
                            :showIcon="true"
                            :showButtonBar="true"
                            v-model="arrivalDate"
                            class="w-full"
                        ></DatePicker>
                    </div>
                </div>

                <!-- Section: Add Serial Number -->
                <div class="flex flex-col gap-4 mt-4">
                    <label class="font-medium">Per Item Serial Numbers</label>
                    <!-- Add Serial Number Input -->
                    <div class="flex items-center gap-4">
                        <InputText
                            id="serialNumber"
                            type="text"
                            placeholder="Enter Serial Number"
                            v-model="newSerialNumber"
                        />
                        <Button
                            label="Add"
                            class="p-button-primary"
                            @click="addSerialNumber"
                        ></Button>
                    </div>

                    <!-- Serial Numbers List -->
                    <ul class="list-disc pl-5 divide-y divide-gray-200">
                        <li
                            v-for="(item, index) in serialNumbers"
                            :key="index"
                            class="py-2 flex justify-between items-center"
                        >
                            <!-- Serial Details -->
                            <div class="flex flex-col">
                                <span
                                    ><strong>Serial:</strong>
                                    {{ item.serial }}</span
                                >
                                <span
                                    ><strong>Rental:</strong>
                                    {{ item.isRental ? "Yes" : "No" }}</span
                                >
                                <span v-if="item.isRental"
                                    ><strong>Price:</strong>
                                    {{ item.price || "N/A" }}</span
                                >
                            </div>

                            <!-- Actions -->
                            <div class="flex items-center gap-2">
                                <!-- Rental Checkbox -->
                                <Checkbox
                                    v-model="item.isRental"
                                    binary
                                    :disabled="isBatchRental"
                                >
                                    Rental
                                </Checkbox>

                                <!-- Rental Price Input (disabled if batch rental is enabled) -->
                                <InputText
                                    v-if="item.isRental && !isBatchRental"
                                    type="number"
                                    placeholder="Enter rental price"
                                    v-model="item.price"
                                    class="ml-2"
                                />

                                <!-- Remove Button -->
                                <Button
                                    icon="pi pi-trash"
                                    class="p-button-danger p-button-rounded"
                                    @click="removeSerialNumber(index)"
                                ></Button>
                            </div>
                        </li>
                    </ul>
                </div>

                <div class="flex gap-4">
                    <Button label="Submit" :fluid="false" class="w-1/2">
                    </Button>
                    <Button label="Clear" :fluid="false" class="w-1/2"></Button>
                </div>
            </div>
        </div>
    </Fluid>
</template>
