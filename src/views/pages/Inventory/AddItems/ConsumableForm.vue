<script setup>
import { ProductService } from "@/service/ProductService";
import { computed, onMounted, ref } from "vue";

// Reactive state for serial numbers
const newSerialNumber = ref(""); // Holds the input for the new serial number
const serialNumbers = ref([]); // Array of existing serial numbers
const arrivalDate = ref(null); // For tracking the arrival date
const expiryDate = ref(null); // For tracking the expiry date

// Reference for the Popover
const op2 = ref(null);

// Reactive state for input fields in Step 1
const productName = ref(""); // Product Name
const brand = ref(""); // Brand
const category = ref(""); // Category

// Reactive state for products and selected product
const products = ref([]); // Holds the list of products
const selectedProduct = ref(null); // For storing the selected product

const isBatchSRP = ref(false); // Tracks whether the checkbox is checked
const showInfoDialog = ref(false); // Controls the visibility of the info dialog

// Function to fetch products from ProductService
const fetchProducts = () => {
    try {
        const response = ProductService.getProductsWithOrdersData(); // Fetch the local product data
        products.value = response; // Assign the fetched products to the products ref
    } catch (error) {
        console.error("Error fetching products:", error);
    }
};

// Computed property to filter consumable items
const consumableProducts = computed(() =>
    products.value.filter((product) => product.category === "Consumable"),
);

const onProductSelect = (selected) => {
    console.log(selected); // Debug the selected item
    if (selected) {
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

// Function to add a serial number
const addSerialNumber = () => {
    if (newSerialNumber.value.trim()) {
        serialNumbers.value.push(newSerialNumber.value.trim()); // Add new serial number
        newSerialNumber.value = ""; // Reset the input field
    }
};

// Function to toggle the DataTable Popover
const toggleDataTable = (event) => {
    if (op2.value) {
        op2.value.toggle(event); // Toggle the visibility of the Popover
    }
};

// Function to remove a serial number by index
const removeSerialNumber = (index) => {
    serialNumbers.value.splice(index, 1); // Remove the serial number
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
                                    :value="consumableProducts"
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
                            placeholder="Category"
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

                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <!-- Label, Question Mark, and Checkbox -->
                        <div class="flex items-center gap-2 mb-2">
                            <label class="font-medium"
                                >Set Suggested Retail Price</label
                            >
                            <i
                                class="pi pi-question-circle text-blue-500 cursor-pointer"
                                @click="showInfoDialog = true"
                            ></i>
                            <Checkbox v-model="isBatchSRP" binary />
                        </div>

                        <!-- Rental Price Input -->
                        <div>
                            <InputText
                                id="batchRentalPrice"
                                type="number"
                                placeholder="Enter SRP price for batch"
                                v-model="isBatchSRP"
                                class="w-full"
                                :disabled="!isBatchSRP"
                            />
                        </div>
                    </div>

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

                <!-- Section : stoccks Details -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col grow basis-0 gap-2">
                        <label for="batchNumber">Minimum Stock</label>
                        <InputText
                            id="batchNumber"
                            type="text"
                            placeholder="Batch Number"
                        />
                    </div>
                    <div class="flex flex-col grow basis-0 gap-2">
                        <label for="quantity">Stock Limit</label>
                        <InputText
                            id="quantity"
                            type="number"
                            placeholder="Quantity"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label>Purchase Date</label>
                        <DatePicker
                            placeholder="Purchase Date"
                            :showIcon="true"
                            :showButtonBar="true"
                            v-model="arrivalDate"
                        ></DatePicker>
                    </div>

                    <div>
                        <label>Expiry Date</label>
                        <DatePicker
                            placeholder="Expiry Date"
                            :showIcon="true"
                            :showButtonBar="true"
                            v-model="expiryDate"
                        ></DatePicker>
                    </div>
                </div>

                <!-- Section 3: Individual Items -->
                <div class="flex flex-col gap-4 mt-4">
                    <label for="serialNumber" class="col-span-2 font-medium">
                        Per Item Serial Number
                    </label>

                    <!-- Serial Number Section -->
                    <div class="items-center gap-4">
                        <!-- Label -->

                        <!-- Input and Button -->
                        <div class="col-span-10 flex items-center gap-4">
                            <InputText
                                id="serialNumber"
                                type="text"
                                placeholder="Enter Serial Number"
                                v-model="newSerialNumber"
                                class="flex-grow"
                            />
                            <Button
                                label="Add"
                                class="p-button-primary"
                                @click="addSerialNumber"
                            ></Button>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col grow basis-0 gap-2">
                    <label
                        >Serial Number List
                        <label class="float-right">
                            Total: {{ serialNumbers.length }}
                        </label>
                    </label>
                    <ul class="list-disc pl-5">
                        <li
                            class="grid grid-cols-2 items-center"
                            v-for="(serial, index) in serialNumbers"
                            :key="index"
                        >
                            <div
                                class="col-span-1 overflow-auto text-ellipsis whitespace-nowrap"
                            >
                                {{ serial }}
                            </div>

                            <Button
                                icon="pi pi-trash"
                                outlined
                                rounded
                                severity="danger"
                                class="p-button-text p-1 ml-2"
                                @click="removeSerialNumber(index)"
                            ></Button>
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

    <Dialog v-model:visible="showInfoDialog" header="Information" :modal="true">
        <p>
            Enable this option to set a suggested retail price or apply a batch
            retail price for all items.
        </p>
    </Dialog>
</template>
