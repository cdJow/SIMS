<script setup>
import { CustomerService } from "@/service/CustomerService";
import { ProductService } from "@/service/ProductService";
import { RoomService } from "@/service/RoomService";
import { FilterMatchMode, FilterOperator } from "@primevue/core/api";
import { InputNumber } from "primevue";

import { onBeforeMount, ref } from "vue";

const customers1 = ref(null);
const customers2 = ref(null);
const customers3 = ref(null);
const loading1 = ref(null);
const expandedRows = ref([]);
const batchExpandedRows = ref([]);
const toast = ref(null);
const NonConsumablebatchDialog = ref(false);

const deleteProductDialog = ref(false); // State for delete dialog
const deleteBatchDialog = ref(false);
const selectedBatchForDeletion = ref(null);

const product = ref({}); // Initialize product as a reactive reference
const batchDialog = ref(false);

const productDialog = ref(false);

const submitted = ref(false);

const selectedBatch = ref({});

// State variables
const assignItemDialogVisible = ref(false); // Dialog visibility

const products = ref([]); // Products for the DataTable
const selectedProduct = ref(null); // Selected product from the DataTable
const selectedItem = ref(null); // Selected item details
const popoverRef = ref(null); // Reference to the Popover

const availableRooms = ref([]);
const selectedRoom = ref(null);
const serialNumbers = ref([]);
// For damaged item reporting
const damageDialogVisible = ref(false);
const selectedDamageItem = ref(null);
const damageDetails = ref({
    type: "",
    reason: "",
});
const damageTypes = ref([
    { label: "Physical Damage", value: "physical" },
    { label: "Malfunction", value: "malfunction" },
    { label: "Wear and Tear", value: "wear_and_tear" },
    { label: "Other", value: "other" },
]);

// Function to open the damage report dialog
function reportDamage(item) {
    selectedDamageItem.value = item; // Set the selected item for damage reporting
    damageDetails.value = { type: "", reason: "" }; // Reset the form data
    damageDialogVisible.value = true; // Show the damage dialog
}

// Function to submit the damage report
function submitDamageReport() {
    if (!damageDetails.value.type || !damageDetails.value.reason) {
        toast.value.add({
            severity: "warn",
            summary: "Validation Error",
            detail: "Please fill in all fields.",
            life: 3000,
        });
        return;
    }

    // Process damage report (You can make an API call to save this or just update locally)
    console.log(
        "Damage report for item:",
        selectedDamageItem.value,
        damageDetails.value,
    );

    // Update the item's status to "Damaged"
    selectedDamageItem.value.status = "Damaged";

    // Set rental column to "No" and rental price to "-"
    selectedDamageItem.value.rental = "No"; // Set rental to "No"
    selectedDamageItem.value.rentalPrice = "-"; // Set rental price to "-"
    selectedDamageItem.value.assignedRoom = null; // Remove assigned room

    // Update the data in serialNumbers array (or your data source)
    const itemIndex = serialNumbers.value.findIndex(
        (item) => item.serialNumber === selectedDamageItem.value.serialNumber,
    );
    if (itemIndex !== -1) {
        serialNumbers.value[itemIndex] = { ...selectedDamageItem.value }; // Update the item data
    }

    // Close the dialog
    damageDialogVisible.value = false;

    // Optional: Toast notification for success
    toast.value.add({
        severity: "success",
        summary: "Damage Reported",
        detail: `Damage reported for item ${selectedDamageItem.value.serialNumber}. Rental details have been updated.`,
        life: 3000,
    });
}

// Function to cancel damage report
function cancelDamageReport() {
    damageDialogVisible.value = false;
}

// Reassign the selected item
function reassignItem() {
    if (!selectedItem.value) {
        console.error("No item selected for reassignment.");
        return;
    }

    if (!selectedRoom.value) {
        console.error("No room selected for reassignment.");
        return;
    }

    // Update the selected item's room number and status
    selectedItem.value.roomNumber = selectedRoom.value.roomNumber;
    selectedItem.value.status = "Assigned";

    console.log("Item after reassignment:", selectedItem.value);

    // Update the data in serialNumbers array
    const itemIndex = serialNumbers.value.findIndex(
        (item) => item.serialNumber === selectedItem.value.serialNumber,
    );
    if (itemIndex !== -1) {
        serialNumbers.value.splice(itemIndex, 1, { ...selectedItem.value });
    }

    // Close the dialog
    assignItemDialogVisible.value = false;

    // Reset the selected room
    selectedRoom.value = null;

    // Optional: Toast notification
    toast.value.add({
        severity: "success",
        summary: "Success",
        detail: `Item ${selectedItem.value.serialNumber} reassigned to Room ${selectedItem.value.roomNumber}.`,
        life: 3000,
    });
}

function moveToStockroom() {
    if (!selectedItem.value) {
        console.error("No item selected for stockroom move.");
        return;
    }

    // Set the selected item's status to 'Available'
    selectedItem.value.status = "Available";

    // Remove the assigned room number
    selectedItem.value.roomNumber = null;

    console.log("Item after moving to stockroom:", selectedItem.value);

    // Update the data in serialNumbers array
    const itemIndex = serialNumbers.value.findIndex(
        (item) => item.serialNumber === selectedItem.value.serialNumber,
    );
    if (itemIndex !== -1) {
        serialNumbers.value.splice(itemIndex, 1, { ...selectedItem.value });
    }

    // Close the dialog
    assignItemDialogVisible.value = false;

    // Reset the selected room
    selectedRoom.value = null;

    // Optional: Toast notification
    toast.value.add({
        severity: "success",
        summary: "Success",
        detail: `Item ${selectedItem.value.serialNumber} moved to stockroom and status set to Available.`,
        life: 3000,
    });
}

// Function to open the dialog for reassignment
function reassign(item) {
    console.log("Reassigning item:", item); // Debugging
    selectedItem.value = { ...item }; // Clone the item to avoid direct mutations
    assignItemDialogVisible.value = true; // Open the dialog
}

// Function to toggle the popover visibility
function toggleDataTable3(event) {
    if (popoverRef.value) {
        popoverRef.value.toggle(event); // Toggle the popover
    }
}

// Function to handle room selection
function selectRoom(room) {
    console.log("Room selected:", room);
    selectedRoom.value = room; // Update the selected room
    if (popoverRef.value) {
        popoverRef.value.hide(); // Close the popover after selection
    }
}

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

function editProduct(prod) {
    product.value = { ...prod }; // Clone the product data to avoid direct mutations
    productDialog.value = true; // Open the dialog
}

function formatPrice(price) {
    if (price == null || isNaN(price)) return "₱0.00"; // Handle null or invalid price
    return `₱${price.toFixed(2)}`; // Format with two decimal places
}

function hideDialog() {
    productDialog.value = false;
    batchDialog.value = false;
    submitted.value = false;
    NonConsumablebatchDialog.value = false;
    NonConsumablSerialDialog.value = false;

    selectedSerial.value = {};
}

const selectedSerialForDeletion = ref(null); // Serial selected for deletion
const deleteserialDialog = ref(false); // Dialog state

// Function to confirm serial deletion
function confirmDeleteSerial(serial, productId, batchId) {
    if (!serial || !serial.serialNumber) {
        console.error("Invalid serial data provided.");
        return;
    }

    // Store the selected serial with its associated product and batch for deletion
    selectedSerialForDeletion.value = {
        serialNumber: serial.serialNumber,
        productId,
        batchId,
    };

    // Open the confirmation dialog
    deleteserialDialog.value = true;

    console.log("Serial set for deletion:", selectedSerialForDeletion.value);
}

function saveEditedSerial(serialData) {
    if (!serialData || !serialData.serialNumber) {
        console.error("Invalid serial data provided:", serialData);
        return;
    }

    console.log("Serial data to save:", serialData);

    // Ensure products is iterable
    if (!Array.isArray(products.value) || products.value.length === 0) {
        console.error("Products list is empty or not loaded.");
        return;
    }

    let matchedProduct = null;
    let matchedBatch = null;
    let matchedSerial = null;

    // Search for the serial number in all products and their batches
    for (const product of products.value) {
        console.log("Checking Product:", product);

        for (const batch of product.batches || []) {
            console.log("Checking Batch:", batch);

            matchedSerial = batch.serialNumbers?.find(
                (sn) => sn.serialNumber === serialData.serialNumber,
            );

            if (matchedSerial) {
                matchedProduct = product;
                matchedBatch = batch;
                break;
            }
        }
        if (matchedSerial) break;
    }

    if (!matchedProduct || !matchedBatch || !matchedSerial) {
        console.error("Product, batch, or serial number not found.");
        return;
    }

    console.log("Matched Product:", matchedProduct);
    console.log("Matched Batch:", matchedBatch);
    console.log("Matched Serial:", matchedSerial);

    // Reset assignedRoom if status is set to "Available"
    if (serialData.status.toLowerCase().trim() === "available") {
        serialData.roomNumber = "-";
    }

    // Remove rentalPrice if rental is set to "No"
    if (serialData.rental === "No") {
        serialData.rentalPrice = "-"; // Or use "-" based on your requirements
    }

    // Update the rentalPrice field explicitly
    if (serialData.rentalPrice !== undefined) {
        matchedSerial.rentalPrice = serialData.rentalPrice;
    }

    // Update the rest of the serial data
    Object.assign(matchedSerial, serialData);
    console.log("Serial updated successfully:", matchedSerial);

    // Show success message
    toast.value.add({
        severity: "success",
        summary: "Success",
        detail: `Serial number ${matchedSerial.serialNumber} updated successfully`,
        life: 3000,
    });

    hideSerialDialog();
}

// State management
const isDialog2Visible = ref(false); // Controls the dialog visibility
const isDialogVisible = ref(false); // Controls the dialog visibility

function assignItem() {
    if (!selectedItem.value) {
        console.error("No item selected for assignment.");
        return;
    }

    if (!selectedRoom.value) {
        console.error("No room selected for assignment.");
        return;
    }

    // Assign the selected room number and update status
    selectedItem.value.roomNumber = selectedRoom.value.roomNumber;
    selectedItem.value.status = "Assigned";

    console.log("Item after assignment:", selectedItem.value);

    // Close the dialog
    assignItemDialogVisible.value = false;

    // Reset the selectedRoom
    selectedRoom.value = null;

    // Optional: Show success message
    toast.value.add({
        severity: "success",
        summary: "Success",
        detail: `Item ${selectedItem.value.serialNumber} assigned to Room ${selectedItem.value.roomNumber}.`,
        life: 3000,
    });
}

function openAssignItemDialog(item) {
    selectedItem.value = item;
    assignItemDialogVisible.value = true;
}
// Function to delete a serial number
function deleteSerial() {
    const { productId, batchId, serialNumber } =
        selectedSerialForDeletion.value;

    if (!productId || !batchId || !serialNumber) {
        console.error("Invalid data for serial deletion.");
        return;
    }

    // Locate the product
    const productIndex = products.value.findIndex(
        (product) => product.id === productId,
    );
    if (productIndex === -1) {
        console.error("Product not found for deletion.");
        return;
    }

    // Locate the batch within the product
    const batchIndex = products.value[productIndex].batches.findIndex(
        (batch) => batch.batchId === batchId,
    );
    if (batchIndex === -1) {
        console.error("Batch not found for deletion.");
        return;
    }

    // Locate the serial within the batch
    const serialIndex = products.value[productIndex].batches[
        batchIndex
    ].serialNumbers.findIndex((serial) => serial.serialNumber === serialNumber);
    if (serialIndex === -1) {
        console.error("Serial number not found for deletion.");
        return;
    }

    // Delete the serial from the batch
    products.value[productIndex].batches[batchIndex].serialNumbers.splice(
        serialIndex,
        1,
    );

    console.log("Serial deleted successfully:", serialNumber);

    // Close the dialog and reset the state
    deleteserialDialog.value = false;
    selectedSerialForDeletion.value = null;
}

// Options for rental dropdown
const rentalOptions = [
    { label: "Yes", value: "Yes" },
    { label: "No", value: "No" },
];

function saveProduct() {
    submitted.value = true;

    if (product?.value.name?.trim()) {
        if (product.value.id) {
            // Update existing product
            const index = products.value.findIndex(
                (p) => p.id === product.value.id,
            );
            if (index !== -1) {
                products.value[index] = product.value;
            }
        } else {
            // Create new product
            product.value.id = createId();
            products.value.push(product.value);
        }
        productDialog.value = false;
        product.value = {};
    }
}

const warrantyUnitOptions = ref([
    { name: "Day(s)", value: "day" },
    { name: "Month(s)", value: "month" },
    { name: "Year(s)", value: "year" },
]);

const unitOptions = ref([
    // Weight
    { label: "Kilograms", value: "kilograms" },
    { label: "Grams", value: "grams" },
    { label: "Pounds", value: "pounds" },
    { label: "Ounces", value: "ounces" },

    // Volume
    { label: "Liters", value: "liters" },
    { label: "Milliliters", value: "milliliters" },
    { label: "Cubic Meters", value: "cubic_meters" },
    { label: "Gallons", value: "gallons" },
    { label: "Pints", value: "pints" },
    { label: "Fluid Ounces", value: "fluid_ounces" },

    // Count
    { label: "Pieces", value: "pieces" },
    { label: "Units", value: "units" },
    { label: "Items", value: "items" },
    { label: "Packages", value: "packages" },
    { label: "Boxes", value: "boxes" },
]);

function saveNonConsumableBatchDetails() {
    if (
        !selectedBatch.value.batchNumber ||
        !selectedBatch.value.warrantyValue
    ) {
        console.error("Batch data is incomplete.");
        return;
    }

    // Ensure the `unit` field stores only the value, not the full object
    if (
        selectedBatch.value.unit &&
        typeof selectedBatch.value.unit === "object"
    ) {
        selectedBatch.value.unit = selectedBatch.value.unit.value;
    }

    // Find the product containing the batch
    const productIndex = products.value.findIndex((product) =>
        product.batches?.some(
            (batch) => batch.batchId === selectedBatch.value.batchId,
        ),
    );

    if (productIndex !== -1) {
        const batchIndex = products.value[productIndex].batches.findIndex(
            (batch) => batch.batchId === selectedBatch.value.batchId,
        );

        if (batchIndex !== -1) {
            // Update the batch data
            products.value[productIndex].batches[batchIndex] = {
                ...selectedBatch.value,
            };
            console.log("Batch updated successfully:", selectedBatch.value);
        } else {
            console.warn("Batch not found in the product's list.");
        }
    } else {
        console.warn("Product not found containing this batch.");
    }

    showSuccess();
    NonConsumablebatchDialog.value = false;
}

function showSuccess() {
    toast.value.add({
        severity: "success",
        summary: "Success",
        detail: "Edit Successful",
        life: 3000,
    });
}

const NonConsumablSerialDialog = ref(false);

const selectedSerial = ref({
    serialNumber: "",
    status: "Available",
    rental: "No", // Default rental status
    rentalPrice: "",
});

// Options for rental dropdown

// Edit serial function
function editSerial(serial) {
    selectedSerial.value = {
        rental: "No", // Default value
        rentalPrice: null, // Default price
        ...serial, // Clone the rest of the data
    };
    NonConsumablSerialDialog.value = true;
    console.log("Selected serial:", selectedSerial.value);
}

// Close dialog and reset the form
function hideSerialDialog() {
    NonConsumablSerialDialog.value = false;

    // Reset selectedSerial
    selectedSerial.value = {
        serialNumber: "",
        status: "",
        roomNumber: "",
    };
    console.log("Dialog closed and form reset.");
}

function saveBatchDetails() {
    // Mark form as submitted to trigger validation messages
    submitted.value = true;

    // Validate required fields
    if (
        !selectedBatch.value.batchNumber ||
        !selectedBatch.value.quantity ||
        !selectedBatch.value.purchaseDate ||
        !selectedBatch.value.purchasePrice ||
        !selectedBatch.value.unit ||
        !selectedBatch.value.supplier ||
        !selectedBatch.value.expDate
    ) {
        console.error("Validation failed: All required fields must be filled.");
        return;
    }

    // Find the product containing the batch
    const productIndex = products.value.findIndex((product) =>
        product.batches?.some(
            (batch) => batch.batchId === selectedBatch.value.batchId,
        ),
    );

    if (productIndex !== -1) {
        // Find the batch within the product's batches
        const batchIndex = products.value[productIndex].batches.findIndex(
            (batch) => batch.batchId === selectedBatch.value.batchId,
        );

        if (batchIndex !== -1) {
            // Update the existing batch
            products.value[productIndex].batches[batchIndex] = {
                ...selectedBatch.value,
            };
            console.log(
                "Batch updated successfully:",
                products.value[productIndex].batches[batchIndex],
            );
        } else {
            // Add a new batch to the product's batches
            selectedBatch.value.batchId = createId(); // Generate a new ID for the batch
            products.value[productIndex].batches.push({
                ...selectedBatch.value,
            });
            console.log(
                "New batch added to product:",
                products.value[productIndex],
            );
        }
    } else {
        console.warn("Product containing this batch was not found.");
    }

    showSuccess();
    // Close the dialog after successful save
    batchDialog.value = false;

    // Reset form state
    submitted.value = false;
    Object.keys(selectedBatch.value).forEach((key) => {
        selectedBatch.value[key] = null;
    });

    console.log("Form closed and reset.");
}

function createId() {
    return Math.random().toString(36).substr(2, 9);
}

function confirmDeleteProduct(prod) {
    product.value = prod; // Set the product to be deleted
    deleteProductDialog.value = true; // Show the confirmation dialog
}

function deleteProduct() {
    if (product.value) {
        const index = products.value.findIndex(
            (p) => p.id === product.value.id,
        );
        if (index !== -1) {
            products.value.splice(index, 1); // Remove the product from the list
        }
        deleteProductDialog.value = false; // Close the dialog
        product.value = null; // Reset the product reference
        showError();
    }
}

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

function editbatch(batchData) {
    if (!batchData) {
        console.error("Batch data is not defined");
        return;
    }
    selectedBatch.value = { ...batchData }; // Clone the batch data
    batchDialog.value = true; // Open the dialog
}

function openNonConsumableBatchDialog(batchData) {
    if (!batchData) {
        console.error("Batch data is undefined");
        return;
    }

    // Clone the batch data into selectedBatch
    selectedBatch.value = { ...batchData };

    // Ensure warrantyValue and warrantyUnit are defined
    if (!selectedBatch.value.warrantyValue) {
        selectedBatch.value.warrantyValue = 1; // Default warranty value
    }
    if (!selectedBatch.value.warrantyUnit) {
        selectedBatch.value.warrantyUnit = "year"; // Default warranty unit
    }

    NonConsumablebatchDialog.value = true;

    console.log("Opening dialog with data:", selectedBatch.value);
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

function confirmDeleteBatch(batch) {
    if (!batch || !batch.batchId) {
        console.error("Invalid batch data passed to confirmDeleteBatch.");
        return;
    }

    // Attach the productId to the batch for easier lookup
    const productContainingBatch = products.value.find((product) =>
        product.batches?.some((b) => b.batchId === batch.batchId),
    );

    if (!productContainingBatch) {
        console.error("Product containing the batch not found.");
        return;
    }

    selectedBatchForDeletion.value = {
        ...batch,
        productId: productContainingBatch.id,
    };

    deleteBatchDialog.value = true;

    console.log("Batch set for deletion:", selectedBatchForDeletion.value);
}

function deleteBatch() {
    if (
        !selectedBatchForDeletion.value ||
        !selectedBatchForDeletion.value.batchId ||
        !selectedBatchForDeletion.value.productId
    ) {
        console.error("Invalid batch or product ID for deletion.");
        return;
    }

    // Find the product containing the batch
    const productIndex = products.value.findIndex(
        (product) => product.id === selectedBatchForDeletion.value.productId,
    );

    if (productIndex === -1) {
        console.error("Product containing this batch not found.");
        return;
    }

    // Find the batch within the product's batch list
    const batchIndex = products.value[productIndex].batches.findIndex(
        (batch) => batch.batchId === selectedBatchForDeletion.value.batchId,
    );

    if (batchIndex === -1) {
        console.error("Batch not found within the product's batches.");
        return;
    }

    // Remove the batch from the product's batch list
    products.value[productIndex].batches.splice(batchIndex, 1);

    // Close the dialog
    deleteBatchDialog.value = false;

    // Reset the selectedBatchForDeletion
    selectedBatchForDeletion.value = null;

    console.log("Batch deleted successfully.");
    showError();
}

function showError() {
    toast.value.add({
        severity: "error",
        summary: "Deleted",
        detail: "Deleted Successfuly",
        life: 3000,
    });
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
            <Column
                field="Actions"
                header="Actions"
                :exportable="false"
                style="min-width: 12rem"
            >
                <template #body="slotProps">
                    <Button
                        icon="pi pi-pencil"
                        outlined
                        rounded
                        class="mr-2"
                        @click="editProduct(slotProps.data)"
                    />
                    <Button
                        icon="pi pi-trash"
                        outlined
                        rounded
                        severity="danger"
                        @click="confirmDeleteProduct(slotProps.data)"
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
                            <template #body="slotProps">
                                <div class="flex">
                                    <Button
                                        icon="pi pi-pencil"
                                        outlined
                                        rounded
                                        class="mb-1 mr-2"
                                        @click="editbatch(slotProps.data)"
                                    />
                                    <Button
                                        icon="pi pi-trash"
                                        outlined
                                        rounded
                                        severity="danger"
                                        @click="
                                            confirmDeleteBatch(slotProps.data)
                                        "
                                    />
                                </div>
                            </template>
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
                                                header="Suggested Retail Price(SRP)"
                                                sortable
                                            />
                                            <Column
                                                :exportable="false"
                                                style="min-width: 12rem"
                                            >
                                                <template #body="slotProps">
                                                    <Button
                                                        icon="pi pi-pencil"
                                                        outlined
                                                        rounded
                                                        class="mr-2"
                                                        @click="
                                                            editProduct(
                                                                slotProps.data,
                                                            )
                                                        "
                                                    />
                                                    <Button
                                                        icon="pi pi-trash"
                                                        outlined
                                                        rounded
                                                        severity="danger"
                                                        @click="
                                                            confirmDeleteProduct(
                                                                slotProps.data,
                                                            )
                                                        "
                                                    />
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
                        <Column
                            field="Actions"
                            header="Actions"
                            :exportable="false"
                            style="min-width: 3rem"
                        >
                            <template #body="slotProps">
                                <div class="flex">
                                    <Button
                                        icon="pi pi-pencil"
                                        outlined
                                        rounded
                                        class="mr-2"
                                        @click="
                                            openNonConsumableBatchDialog(
                                                slotProps.data,
                                            )
                                        "
                                    />
                                    <Button
                                        icon="pi pi-trash"
                                        outlined
                                        rounded
                                        severity="danger"
                                        @click="
                                            confirmDeleteBatch(slotProps.data)
                                        "
                                    />
                                </div>
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
                                                ></Column>
                                                <Column
                                                    field="rental"
                                                    header="Rental"
                                                    sortable
                                                ></Column>
                                                <Column
                                                    field="rentalPrice"
                                                    header="Rental Price"
                                                    sortable
                                                ></Column>
                                                <Column
                                                    field="roomNumber"
                                                    header="Assigned Room"
                                                    sortable
                                                ></Column>
                                                <Column :exportable="false">
                                                    <template #body="slotProps">
                                                        <div class="flex gap-2">
                                                            <!-- Edit Button -->
                                                            <Button
                                                                v-if="
                                                                    slotProps.data.status.toLowerCase() ===
                                                                        'available' ||
                                                                    slotProps.data.status.toLowerCase() ===
                                                                        'assigned'
                                                                "
                                                                icon="pi pi-pencil"
                                                                outlined
                                                                rounded
                                                                @click="
                                                                    editSerial(
                                                                        slotProps.data,
                                                                    )
                                                                "
                                                                v-tooltip="
                                                                    'Edit Serial Details'
                                                                "
                                                            />

                                                            <!-- Delete Button -->
                                                            <Button
                                                                icon="pi pi-trash"
                                                                outlined
                                                                rounded
                                                                severity="danger"
                                                                @click="
                                                                    confirmDeleteSerial(
                                                                        slotProps.data,
                                                                    )
                                                                "
                                                                v-tooltip="
                                                                    'Delete Item'
                                                                "
                                                            />

                                                            <!-- Conditional Assign Button -->
                                                            <Button
                                                                v-if="
                                                                    slotProps.data.status.toLowerCase() ===
                                                                    'available'
                                                                "
                                                                icon="pi pi-arrow-up-right"
                                                                outlined
                                                                rounded
                                                                severity="success"
                                                                @click="
                                                                    openAssignItemDialog(
                                                                        slotProps.data,
                                                                    )
                                                                "
                                                                v-tooltip="
                                                                    'Assign Item to Room'
                                                                "
                                                            />

                                                            <!-- Button Visible for 'Assigned' Status -->
                                                            <Button
                                                                v-if="
                                                                    slotProps.data.status.toLowerCase() ===
                                                                    'assigned'
                                                                "
                                                                icon="pi pi-arrows-h"
                                                                outlined
                                                                rounded
                                                                severity="info"
                                                                @click="
                                                                    reassign(
                                                                        slotProps.data,
                                                                    )
                                                                "
                                                                v-tooltip="
                                                                    'Re-Assign Item'
                                                                "
                                                            ></Button>
                                                            <!-- Damaged Button -->
                                                            <Button
                                                                v-if="
                                                                    slotProps.data.status.toLowerCase() ===
                                                                        'available' ||
                                                                    slotProps.data.status.toLowerCase() ===
                                                                        'assigned'
                                                                "
                                                                icon="pi pi-exclamation-triangle"
                                                                outlined
                                                                rounded
                                                                severity="danger"
                                                                @click="
                                                                    reportDamage(
                                                                        slotProps.data,
                                                                    )
                                                                "
                                                                v-tooltip="
                                                                    'Report Damage'
                                                                "
                                                            />
                                                        </div>
                                                    </template>
                                                </Column>
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

    <!-- Delete Product Dialog -->
    <Dialog
        v-model:visible="deleteProductDialog"
        :style="{ width: '450px' }"
        header="Confirm"
        :modal="true"
    >
        <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle !text-3xl" />
            <span v-if="product"
                >Are you sure you want to delete <b>{{ product.name }}</b
                >?</span
            >
        </div>
        <template #footer>
            <Button
                label="No"
                icon="pi pi-times"
                text
                @click="deleteProductDialog = false"
            />
            <Button label="Yes" icon="pi pi-check" @click="deleteProduct" />
        </template>
    </Dialog>

    <!-- Edit Product Dialog -->
    <Dialog
        :dismissableMask="true"
        v-model:visible="productDialog"
        :style="{ width: '450px' }"
        header="Product Details"
        :modal="true"
    >
        <div class="flex flex-col gap-6">
            <div>
                <label for="name" class="block font-bold mb-3">Name</label>
                <InputText
                    id="name"
                    v-model.trim="product.name"
                    required="true"
                    :invalid="submitted && !product.name"
                    fluid
                />
                <small v-if="submitted && !product.name" class="text-red-500"
                    >Name is required.</small
                >
            </div>
            <div>
                <label for="brand" class="block font-bold mb-3">Brand</label>
                <InputText
                    id="brand"
                    v-model.trim="product.brand"
                    required="true"
                    :invalid="submitted && !product.brand"
                    fluid
                />
                <small v-if="submitted && !product.brand" class="text-red-500"
                    >brand is required.</small
                >
            </div>
            <div>
                <label for="description" class="block font-bold mb-3"
                    >Description</label
                >
                <Textarea
                    id="description"
                    v-model="product.description"
                    required="true"
                    rows="3"
                    cols="20"
                    fluid
                />
            </div>
        </div>

        <template #footer>
            <Button
                label="Cancel"
                icon="pi pi-times"
                text
                @click="hideDialog"
            />
            <Button label="Save" icon="pi pi-check" @click="saveProduct" />
        </template>
    </Dialog>

    <!-- Delete Bactch Dialog-->
    <Dialog
        v-model:visible="deleteBatchDialog"
        :style="{ width: '450px' }"
        header="Confirm"
        :modal="true"
    >
        <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle !text-3xl" />
            <span v-if="selectedBatchForDeletion">
                Are you sure you want to delete
                <b>{{ selectedBatchForDeletion.batchNumber }}</b
                >?
            </span>
        </div>
        <template #footer>
            <Button
                label="No"
                icon="pi pi-times"
                text
                @click="deleteBatchDialog = false"
            />
            <Button label="Yes" icon="pi pi-check" @click="deleteBatch" />
        </template>
    </Dialog>

    <!-- Edit  Consumable Batch  Details Dialog -->
    <Dialog
        :dismissableMask="true"
        v-model:visible="batchDialog"
        :style="{ width: '450px' }"
        header="Batch Details"
        :modal="true"
    >
        <div class="flex flex-col gap-6">
            <!-- Batch Number -->
            <div>
                <label for="batchNumber" class="block font-bold mb-3"
                    >Batch Number</label
                >
                <InputText
                    id="batchNumber"
                    v-model.trim="selectedBatch.batchNumber"
                    required="true"
                    :invalid="submitted && !selectedBatch.batchNumber"
                    fluid
                />
                <small
                    v-if="submitted && !selectedBatch.batchNumber"
                    class="text-red-500"
                    >Batch Number is required.</small
                >
            </div>

            <!-- Quantity -->
            <div>
                <label for="quantity" class="block font-bold mb-3"
                    >Quantity</label
                >
                <InputText
                    id="quantity"
                    v-model.trim="selectedBatch.quantity"
                    required="true"
                    type="number"
                    :invalid="submitted && !selectedBatch.quantity"
                    fluid
                />
                <small
                    v-if="submitted && !selectedBatch.quantity"
                    class="text-red-500"
                    >Quantity is required.</small
                >
            </div>

            <!-- Purchase Date -->
            <div>
                <label for="purchaseDate" class="block font-bold mb-3"
                    >Purchase Date</label
                >
                <DatePicker
                    id="purchaseDate"
                    v-model="selectedBatch.purchaseDate"
                    required="true"
                    fluid
                />
                <small
                    v-if="submitted && !selectedBatch.purchaseDate"
                    class="text-red-500"
                    >Purchase Date is required.</small
                >
            </div>

            <!-- Purchase Price -->
            <div>
                <label for="purchasePrice" class="block font-bold mb-3"
                    >Purchase Price</label
                >
                <InputNumber
                    id="purchasePrice"
                    v-model="selectedBatch.purchasePrice"
                    mode="currency"
                    currency="PHP"
                    required="true"
                    :invalid="submitted && !selectedBatch.purchasePrice"
                    fluid
                />
            </div>

            <div>
                <label for="srp" class="block font-bold mb-3">SRP</label>
                <InputNumber
                    id="srp"
                    v-model="selectedBatch.srp"
                    mode="currency"
                    currency="PHP"
                    fluid
                />
            </div>

            <!-- Unit -->
            <div>
                <label for="unit" class="block font-bold mb-3">Unit</label>
                <Select
                    id="unit"
                    v-model="selectedBatch.unit"
                    :options="unitOptions"
                    optionLabel="label"
                    optionValue="value"
                    fluid
                />

                <small
                    v-if="submitted && !selectedBatch.unit"
                    class="text-red-500"
                    >Unit is required.</small
                >
            </div>

            <!-- Supplier -->
            <div>
                <label for="supplier" class="block font-bold mb-3"
                    >Supplier</label
                >
                <InputText
                    id="supplier"
                    v-model="selectedBatch.supplier"
                    required="true"
                    fluid
                />
                <small
                    v-if="submitted && !selectedBatch.supplier"
                    class="text-red-500"
                    >Supplier is required.</small
                >
            </div>

            <!-- Expiration Date -->
            <div>
                <label for="expDate" class="block font-bold mb-3"
                    >Expiration Date</label
                >
                <DatePicker
                    id="expDate"
                    v-model="selectedBatch.expDate"
                    showIcon
                    required="true"
                    fluid
                />
                <small
                    v-if="submitted && !selectedBatch.expDate"
                    class="text-red-500"
                    >Expiration Date is required.</small
                >
            </div>
        </div>

        <!-- Footer -->
        <template #footer>
            <Button
                label="Cancel"
                icon="pi pi-times"
                text
                @click="hideDialog"
            />
            <Button label="Save" icon="pi pi-check" @click="saveBatchDetails" />
        </template>
    </Dialog>

    <!-- Edit  Non-Consumable Batch  Details Dialog -->
    <Dialog
        :dismissableMask="true"
        v-model:visible="NonConsumablebatchDialog"
        :style="{ width: '450px' }"
        header="Batch Details"
        :modal="true"
    >
        <div class="flex flex-col gap-6">
            <!-- Batch Number -->
            <div>
                <label for="batchNumber" class="block font-bold mb-3"
                    >Batch Number</label
                >
                <InputText
                    id="batchNumber"
                    v-model.trim="selectedBatch.batchNumber"
                    fluid
                />
            </div>

            <!-- Quantity -->
            <div>
                <label for="quantity" class="block font-bold mb-3"
                    >Quantity</label
                >
                <InputText
                    id="quantity"
                    v-model.trim="selectedBatch.quantity"
                    type="number"
                    fluid
                />
            </div>

            <!-- Purchase Date -->
            <div>
                <label for="purchaseDate" class="block font-bold mb-3"
                    >Purchase Date</label
                >
                <DatePicker
                    id="purchaseDate"
                    v-model="selectedBatch.purchaseDate"
                    fluid
                />
            </div>

            <!-- Purchase Price -->
            <div>
                <label for="purchasePrice" class="block font-bold mb-3"
                    >Purchase Price</label
                >
                <InputNumber
                    id="purchasePrice"
                    v-model="selectedBatch.purchasePrice"
                    mode="currency"
                    currency="PHP"
                    fluid
                />
            </div>

            <!-- Unit -->
            <!-- Unit -->
            <div>
                <label for="unit" class="block font-bold mb-3">Unit</label>
                <Select
                    id="unit"
                    v-model="selectedBatch.unit"
                    :options="unitOptions"
                    optionLabel="label"
                    optionValue="value"
                    fluid
                />

                <small
                    v-if="submitted && !selectedBatch.unit"
                    class="text-red-500"
                    >Unit is required.</small
                >
            </div>

            <!-- Supplier -->
            <div>
                <label for="supplier" class="block font-bold mb-3"
                    >Supplier</label
                >
                <InputText
                    id="supplier"
                    v-model="selectedBatch.supplier"
                    fluid
                />
            </div>
            <div>
                <label for="rental" class="block font-bold mb-3">Rental</label>
                <InputText id="rental" v-model="selectedBatch.rental" fluid />
            </div>
            <div>
                <label for="rentalprice" class="block font-bold mb-3"
                    >Rental Price</label
                >
                <InputText
                    id="rentalprice"
                    v-model="selectedBatch.rentalprice"
                    fluid
                />
            </div>

            <!-- Warranty and Day/Month/Year Section -->
            <div class="grid grid-cols-2 items-start gap-4">
                <!-- Warranty Input and Slider -->
                <div class="flex flex-col gap-2">
                    <label for="batchNumber" class="font-medium"
                        >Warranty</label
                    >
                    <InputText
                        v-model.number="selectedBatch.warrantyValue"
                        placeholder="Enter warranty value"
                        class="w-full"
                    />

                    <Slider
                        v-model.number="selectedBatch.warrantyValue"
                        :min="0"
                        :max="100"
                        class="mt-2 w-full"
                    />
                </div>

                <!-- Warranty Unit Dropdown -->
                <div class="flex flex-col gap-2">
                    <label for="warrantyUnit" class="font-medium"
                        >Select Duration</label
                    >
                    <Select
                        v-model="selectedBatch.warrantyUnit"
                        :options="warrantyUnitOptions"
                        optionLabel="name"
                        optionValue="value"
                        placeholder="Select Day / Month / Year"
                        class="w-full"
                    />
                </div>
            </div>
        </div>

        <!-- Footer -->
        <template #footer>
            <Button
                label="Cancel"
                icon="pi pi-times"
                text
                @click="hideDialog"
            />
            <Button
                label="Save"
                icon="pi pi-check"
                @click="saveNonConsumableBatchDetails"
            />
        </template>
    </Dialog>

    <!--Non COnsumbale Serial Details Dialog-->
    <Dialog
        :dismissableMask="true"
        v-model:visible="NonConsumablSerialDialog"
        :style="{ width: '450px' }"
        header="Edit Serial Details"
        :modal="true"
    >
        <div class="flex flex-col gap-6">
            <!-- Serial Number -->
            <div>
                <label for="serialNumber" class="block font-bold mb-3"
                    >Serial Number</label
                >
                <InputText
                    id="serialNumber"
                    v-model.trim="selectedSerial.serialNumber"
                    fluid
                    disabled
                />
            </div>

            <!-- Rental Dropdown -->
            <div>
                <label for="rental" class="block font-bold mb-3">Rental</label>
                <Select
                    id="rental"
                    v-model="selectedSerial.rental"
                    :options="rentalOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Rental"
                    class="w-full"
                />
            </div>

            <!-- Rental Price -->
            <div>
                <label for="rentalPrice" class="block font-bold mb-3"
                    >Rental Price</label
                >
                <InputText
                    id="rentalPrice"
                    v-model.number="selectedSerial.rentalPrice"
                    placeholder="Enter rental price"
                    class="w-full"
                    :disabled="selectedSerial.rental !== 'Yes'"
                />
            </div>
        </div>

        <!-- Footer -->
        <template #footer>
            <Button
                label="Cancel"
                icon="pi pi-times"
                text
                @click="hideSerialDialog"
            />
            <Button
                label="Save"
                icon="pi pi-check"
                @click="saveEditedSerial(selectedSerial)"
            />
        </template>
    </Dialog>

    <!-- Delete serial Dialog -->
    <Dialog
        v-model:visible="deleteserialDialog"
        :style="{ width: '450px' }"
        header="Confirm"
        :modal="true"
    >
        <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle !text-3xl" />
            <span v-if="selectedSerialForDeletion">
                Are you sure you want to delete
                <b>{{ selectedSerialForDeletion.serialNumber }}</b
                >?
            </span>
        </div>
        <template #footer>
            <Button
                label="No"
                icon="pi pi-times"
                text
                @click="deleteserialDialog = false"
            />
            <Button label="Yes" icon="pi pi-check" @click="deleteSerial" />
        </template>
    </Dialog>

    <!--Assign Room Serial Dialog-->
    <Dialog
        v-model:visible="assignItemDialogVisible"
        :style="{ width: '450px' }"
        :header="`Assign Item - ${selectedItem?.serialNumber || 'N/A'}`"
        :modal="true"
    >
        <div class="flex flex-col gap-4">
            <!-- Display item details -->
            <p><strong>Item:</strong> {{ selectedItem?.serialNumber }}</p>
            <p><strong>Status:</strong> {{ selectedItem?.status }}</p>

            <!-- Room Selection Dropdown -->
            <div class="flex flex-wrap gap-2">
                <Button
                    type="button"
                    icon="pi pi-fw pi-list"
                    label="Select A Room"
                    @click="toggleDataTable3"
                />
                <Popover
                    ref="popoverRef"
                    id="overlay_panel"
                    style="width: 750px"
                >
                    <DataTable
                        v-model:selection="selectedRoom"
                        :value="availableRooms"
                        selectionMode="single"
                        :paginator="true"
                        :rows="5"
                    >
                        <Column
                            field="roomNumber"
                            header="Room Number"
                            sortable
                        ></Column>
                        <Column field="type" header="Type" sortable></Column>
                        <Column
                            field="status"
                            header="Status"
                            sortable
                        ></Column>
                        <Column field="price" header="Price" sortable>
                            <template #body="slotProps">
                                {{ formatPrice(slotProps.data.price) }}
                            </template>
                        </Column>
                        <Column header="Action">
                            <template #body="slotProps">
                                <Button
                                    label="Select"
                                    class="p-button-sm p-button-primary"
                                    @click="selectRoom(slotProps.data)"
                                />
                            </template>
                        </Column>
                    </DataTable>
                </Popover>
            </div>

            <!-- Room Preview -->
            <div v-if="selectedRoom" class="mt-4 p-3">
                <h3 class="font-bold mb-2">Selected Room</h3>
                <p>
                    <strong>Room Number:</strong> {{ selectedRoom.roomNumber }}
                </p>
                <p><strong>Type:</strong> {{ selectedRoom.type }}</p>
            </div>
        </div>

        <!-- Dialog Footer -->
        <template #footer>
            <Button
                label="Cancel"
                icon="pi pi-times"
                text
                @click="assignItemDialogVisible = false"
            />
            <Button label="Assign" icon="pi pi-check" @click="assignItem" />
        </template>
    </Dialog>

    <!-- Re-Assign Room Dialog -->
    <Dialog
        v-model:visible="assignItemDialogVisible"
        :dismissableMask="true"
        :style="{ width: '450px' }"
        :header="`Re-Assign Item - ${selectedItem?.serialNumber || 'N/A'}`"
        :modal="true"
    >
        <div class="flex flex-col gap-4">
            <p><strong>Item:</strong> {{ selectedItem?.serialNumber }}</p>
            <p><strong>Status:</strong> {{ selectedItem?.status }}</p>
            <p>
                <strong>Current Room:</strong>
                {{ selectedItem?.roomNumber || "None" }}
            </p>

            <div class="flex flex-wrap gap-2">
                <!-- Button to Select a Room -->
                <Button
                    label="Select A Room"
                    icon="pi pi-fw pi-list"
                    @click="toggleDataTable3"
                />

                <!-- Button to Move to Stockroom -->
                <Button
                    label="Move to Stockroom"
                    icon="pi pi-fw pi-arrow-left"
                    class="p-button-sm p-button-warning"
                    @click="moveToStockroom"
                />

                <!-- Popover for Room Selection -->
                <Popover
                    ref="popoverRef"
                    id="overlay_panel"
                    style="width: 750px"
                >
                    <DataTable
                        v-model:selection="selectedRoom"
                        :value="availableRooms"
                        selectionMode="single"
                        :rows="5"
                        paginator
                    >
                        <Column
                            field="roomNumber"
                            header="Room Number"
                            sortable
                        ></Column>
                        <Column field="type" header="Type" sortable></Column>
                        <Column
                            field="status"
                            header="Status"
                            sortable
                        ></Column>
                        <Column field="price" header="Price" sortable>
                            <template #body="slotProps">
                                {{ formatPrice(slotProps.data.price) }}
                            </template>
                        </Column>
                        <Column header="Action">
                            <template #body="slotProps">
                                <Button
                                    label="Select"
                                    class="p-button-sm p-button-primary"
                                    @click="selectRoom(slotProps.data)"
                                />
                            </template>
                        </Column>
                    </DataTable>
                </Popover>
            </div>

            <!-- Selected Room Preview -->
            <div v-if="selectedRoom" class="mt-4 p-3">
                <h3>Selected Room</h3>
                <p>
                    <strong>Room Number:</strong> {{ selectedRoom.roomNumber }}
                </p>
                <p><strong>Type:</strong> {{ selectedRoom.type }}</p>
            </div>
        </div>

        <template #footer>
            <Button
                label="Cancel"
                icon="pi pi-times"
                text
                @click="assignItemDialogVisible = false"
            />
            <Button
                label="Re-Assign"
                icon="pi pi-check"
                @click="reassignItem"
            />
        </template>
    </Dialog>

    <!-- Damage Report Dialog -->
    <Dialog
        v-model:visible="damageDialogVisible"
        :dismissableMask="true"
        :header="`Report Damaged Item - ${selectedDamageItem?.serialNumber || 'N/A'}`"
        :modal="true"
        :style="{ width: '400px' }"
    >
        <div class="p-fluid p-3">
            <!-- Assigned Room -->
            <div class="grid grid-cols-1 gap-2">
                <label for="roomNumber">Assigned Room</label>
                <InputText
                    id="roomNumber"
                    :value="selectedDamageItem?.roomNumber || '–'"
                    readonly
                    placeholder="Assigned Room"
                    class="p-inputtext-sm"
                />
            </div>

            <!-- Damage Type -->
            <div class="grid grid-cols-1 gap-2 mt-3">
                <label for="damageType">Damage Type</label>
                <Dropdown
                    id="damageType"
                    v-model="damageDetails.type"
                    :options="damageTypes"
                    optionLabel="label"
                    placeholder="Select Damage Type"
                    class="p-dropdown-sm"
                />
            </div>

            <!-- Damage Reason -->
            <div class="grid grid-cols-1 gap-2 mt-3">
                <label for="damageReason">Reason</label>
                <Textarea
                    id="damageReason"
                    v-model="damageDetails.reason"
                    rows="3"
                    placeholder="Provide details..."
                    class="p-inputtext-sm"
                />
            </div>
        </div>

        <template #footer>
            <Button
                label="Cancel"
                icon="pi pi-times"
                class="p-button-text p-button-sm"
                @click="cancelDamageReport"
            />
            <Button
                label="Submit"
                icon="pi pi-check"
                class="p-button-sm"
                @click="submitDamageReport"
            />
        </template>
    </Dialog>

    <template>
        <Toast ref="toast" />
    </template>
</template>
