<script setup>
import { useToast } from "primevue/usetoast";
import { computed, ref } from "vue";

// Room Categories & Types Setup
const roomCategories = ref([
    {
        id: 1,
        category: "Standard",
        description: "Basic amenities for budget stays",
    },
    { id: 2, category: "Deluxe", description: "Enhanced features for comfort" },
    {
        id: 3,
        category: "Suite",
        description: "Luxury rooms with premium services",
    },
]);

const roomTypes = ref([
    {
        id: 1,
        categoryId: 1,
        name: "Single",
        occupancy: 1,
        rates: { "6hrs": 30, "12hrs": 50, "24hrs": 80 },
        description: "Ideal for solo travelers with basic needs.",
    },
    {
        id: 2,
        categoryId: 1,
        name: "Double",
        occupancy: 2,
        rates: { "6hrs": 50, "12hrs": 80, "24hrs": 120 },
        description: "Perfect for two guests with additional space.",
    },
    {
        id: 3,
        categoryId: 2,
        name: "King",
        occupancy: 2,
        rates: { "6hrs": 100, "12hrs": 150, "24hrs": 200 },
        description: "Luxurious king-size bed for ultimate comfort.",
    },
    {
        id: 4,
        categoryId: 3,
        name: "Family",
        occupancy: 4,
        rates: { "6hrs": 200, "12hrs": 250, "24hrs": 300 },
        description: "Spacious room to accommodate the whole family.",
    },
]);

// Dialog and Input States
const showAddTypeDialog = ref(false);
const selectedCategory = ref(null);
const newType = ref({
    name: "",
    rates: { "6hrs": 0, "12hrs": 0, "24hrs": 0 },
});

// Filter States
const selectedCategoryId = ref(null);
function clearFilters() {
    selectedCategoryId.value = null; // Reset category filter
    typeFilter.value = ""; // Reset type filter
}

// Functions
function openAddTypeDialog() {
    showAddTypeDialog.value = true;
    resetForm();
}

function closeAddTypeDialog() {
    showAddTypeDialog.value = false;
    resetForm();
}

function resetForm() {
    selectedCategory.value = null;
    newType.value = { name: "", rates: { "6hrs": 0, "12hrs": 0, "24hrs": 0 } };
}

const toast = useToast();

function saveType() {
    if (!selectedCategory.value) {
        toast.add({
            severity: "warn",
            summary: "Validation Error",
            detail: "Please select a category.",
            life: 3000,
        });
        return;
    }
    if (!newType.value.name.trim()) {
        toast.add({
            severity: "warn",
            summary: "Validation Error",
            detail: "Please enter a type name.",
            life: 3000,
        });
        return;
    }
    if (newType.value.occupancy <= 0) {
        toast.add({
            severity: "warn",
            summary: "Validation Error",
            detail: "Please enter a valid occupancy limit.",
            life: 3000,
        });
        return;
    }

    roomTypes.value.push({
        id: roomTypes.value.length + 1,
        categoryId: selectedCategory.value.id,
        name: newType.value.name,
        occupancy: newType.value.occupancy,
        rates: { ...newType.value.rates },
        description: newType.value.description,
    });

    toast.add({
        severity: "success",
        summary: "Type Added",
        detail: `Room type "${newType.value.name}" added successfully!`,
        life: 3000,
    });

    closeAddTypeDialog();
}

const showDeleteDialog = ref(false); // State for delete dialog visibility
const deleteType = ref(null); // Holds the room type to be deleted
const typeFilter = ref(""); // For filtering by type name

const filteredRoomTypes = computed(() => {
    let filtered = roomTypes.value;

    // Filter by category
    if (selectedCategoryId.value !== null) {
        filtered = filtered.filter(
            (type) => type.categoryId === selectedCategoryId.value,
        );
    }

    // Filter by type name
    if (typeFilter.value.trim()) {
        const keyword = typeFilter.value.trim().toLowerCase();
        filtered = filtered.filter((type) =>
            type.name.toLowerCase().includes(keyword),
        );
    }

    return filtered;
});

function openDeleteDialog(type) {
    deleteType.value = type; // Assign the type to be deleted
    showDeleteDialog.value = true;
}

function closeDeleteDialog() {
    deleteType.value = null; // Clear the selected type
    showDeleteDialog.value = false;
}

function confirmDelete() {
    if (deleteType.value) {
        const index = roomTypes.value.findIndex(
            (type) => type.id === deleteType.value.id,
        );
        if (index !== -1) {
            roomTypes.value.splice(index, 1); // Remove the selected type
        }

        // Toast notification
        toast.add({
            severity: "success",
            summary: "Delete Successful",
            detail: `Room type "${deleteType.value.name}" has been successfully deleted.`,
            life: 3000,
        });
    }
    closeDeleteDialog();
}

const showEditDialog = ref(false);
const editType = ref(null);

function openEditDialog(type) {
    editType.value = JSON.parse(JSON.stringify(type)); // Clone the type to avoid directly mutating
    showEditDialog.value = true;
}

function closeEditDialog() {
    editType.value = null;
    showEditDialog.value = false;
}

function saveEdit() {
    if (editType.value) {
        const index = roomTypes.value.findIndex(
            (type) => type.id === editType.value.id,
        );
        if (index !== -1) {
            roomTypes.value.splice(index, 1, editType.value); // Replace with updated type
        }

        // Toast notification
        toast.add({
            severity: "success",
            summary: "Edit Successful",
            detail: `Room type "${editType.value.name}" has been successfully updated.`,
            life: 3000,
        });
    }
    closeEditDialog();
}

const showRemoveDiscountDialog = ref(false); // Controls the visibility of the dialog
const discountType = ref(null); // Holds the room type for which the discount is to be removed

function openRemoveDiscountDialog(type) {
    discountType.value = type; // Assign the selected room type
    showRemoveDiscountDialog.value = true; // Open the dialog
}

function closeRemoveDiscountDialog() {
    discountType.value = null; // Clear the selected room type
    showRemoveDiscountDialog.value = false; // Close the dialog
}

function confirmRemoveDiscount() {
    if (discountType.value) {
        const index = roomTypes.value.findIndex(
            (type) => type.id === discountType.value.id,
        );
        if (index !== -1) {
            const updatedType = { ...roomTypes.value[index] };
            delete updatedType.discountedRates;
            delete updatedType.discountPercentage;
            roomTypes.value.splice(index, 1, updatedType); // Update the roomTypes array
        }

        // Show a success toast
        toast.add({
            severity: "success",
            summary: "Discount Removed",
            detail: `Discount for "${discountType.value.name}" has been successfully removed.`,
            life: 3000,
        });
    }
    closeRemoveDiscountDialog(); // Close the dialog after removal
}

// Discount Dialog State
const showDiscountDialog = ref(false);
const discountInput = ref(0);
const selectedRoomType = ref(null);
const selectedType = ref(null);
// Methods for Discount Functionality
function openDiscountDialog(type) {
    if (!type) {
        alert("Room type not found. Please try again.");
        return;
    }
    selectedType.value = type; // Assign the selected room type
    discountInput.value = 0; // Reset discount input
    showDiscountDialog.value = true;
}
function closeDiscountDialog() {
    showDiscountDialog.value = false; // Hide the dialog
    selectedRoomType.value = null; // Clear the selected room type
}

function applyDiscount() {
    if (!selectedType.value) {
        alert("No room type selected. Please try again.");
        return;
    }

    if (discountInput.value <= 0 || discountInput.value >= 100) {
        alert("Please enter a valid discount percentage (1-99).");
        return;
    }

    const discountFactor = 1 - discountInput.value / 100;

    // Find and update the specific type in the roomTypes array
    const index = roomTypes.value.findIndex(
        (type) => type.id === selectedType.value.id,
    );

    if (index !== -1) {
        const updatedType = { ...roomTypes.value[index] }; // Clone the selected type
        updatedType.discountedRates = {
            "6hrs": Math.round(updatedType.rates["6hrs"] * discountFactor),
            "12hrs": Math.round(updatedType.rates["12hrs"] * discountFactor),
            "24hrs": Math.round(updatedType.rates["24hrs"] * discountFactor),
        };
        updatedType.discountPercentage = discountInput.value; // Save the discount percentage
        roomTypes.value.splice(index, 1, updatedType); // Replace the original type with the updated one
    } else {
        alert("Room type not found. Please try again.");
    }

    toast.add({
        severity: "success",
        summary: "Discount Applied",
        detail: `A ${discountInput.value}% discount has been applied to ${selectedType.value.name}.`,
        life: 3000,
    });

    closeDiscountDialog();
}
</script>

<template>
    <div class="card">
        <h1 class="text-2xl font-bold mb-4">Room Rate Configuration</h1>

        <div class="flex gap-4 mb-6">
            <!-- Clear Filters Button -->
            <Button
                type="button"
                icon="pi pi-filter-slash"
                label="Clear"
                outlined
                @click="clearFilters"
            />

            <!-- Category Filter Dropdown -->
            <Select
                v-model="selectedCategoryId"
                :options="[
                    { id: null, category: 'All Categories' },
                    ...roomCategories,
                ]"
                optionLabel="category"
                placeholder="Filter by Category"
            />

            <!-- Type Filter -->
            <InputText v-model="typeFilter" placeholder="Search by Type Name" />

            <!-- Add Type Button -->
            <Button
                label="Add Type"
                primary
                icon="pi pi-plus"
                @click="openAddTypeDialog"
            />
        </div>

        <Dialog
            :dismissable-mask="true"
            v-model:visible="showAddTypeDialog"
            header="Add New Type"
            :modal="true"
            style="width: 40vw"
        >
            <!-- Category Selection -->
            <div class="mb-4">
                <label for="category" class="block mb-1">Category</label>
                <Select
                    v-model="selectedCategory"
                    :options="roomCategories"
                    optionLabel="category"
                    placeholder="Select a category"
                    class="w-full"
                />
            </div>

            <!-- Type Name -->
            <div class="mb-4">
                <label for="type" class="block mb-1">Type Name</label>
                <InputText
                    v-model="newType.name"
                    id="type"
                    class="w-full px-4 py-2 border rounded-lg"
                    placeholder="Enter Type "
                />
            </div>

            <!-- Occupancy Limit -->
            <div class="mb-4">
                <label for="occupancy" class="block mb-1"
                    >Occupancy Limit</label
                >
                <InputText
                    v-model.number="newType.occupancy"
                    id="occupancy"
                    type="number"
                    class="w-full px-4 py-2 border rounded-lg"
                    placeholder="Enter occupancy limit"
                />
            </div>

            <!-- Rates Section -->
            <div class="mb-4">
                <label class="block mb-1">Rates</label>
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label for="rate6hrs" class="block text-sm">6hrs</label>
                        <InputText
                            v-model.number="newType.rates['6hrs']"
                            id="rate6hrs"
                            type="number"
                            class="w-full"
                        />
                    </div>
                    <div>
                        <label for="rate12hrs" class="block text-sm"
                            >12hrs</label
                        >
                        <InputText
                            v-model.number="newType.rates['12hrs']"
                            id="rate12hrs"
                            type="number"
                            class="w-full"
                        />
                    </div>
                    <div>
                        <label for="rate24hrs" class="block text-sm"
                            >24hrs</label
                        >
                        <InputText
                            v-model.number="newType.rates['24hrs']"
                            id="rate24hrs"
                            type="number"
                            class="w-full"
                        />
                    </div>
                </div>
            </div>

            <!-- Description Section -->
            <div class="mb-4">
                <label for="description" class="block mb-1">Description</label>
                <Textarea
                    v-model="newType.description"
                    id="description"
                    placeholder="Enter a brief description for the room type"
                    class="w-full px-4 py-2 border rounded-lg"
                    rows="3"
                ></Textarea>
            </div>

            <!-- Dialog Actions -->
            <div class="flex justify-end gap-2">
                <Button
                    @click="closeAddTypeDialog"
                    label="Cancel"
                    class="p-button-secondary"
                />
                <Button
                    @click="saveType"
                    label="Save"
                    class="p-button-primary"
                />
            </div>
        </Dialog>

        <div>
            <!-- Room Types Card Layout -->
            <div class="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
                <div v-for="type in filteredRoomTypes" :key="type.id">
                    <div
                        class="card shadow-md p-4 flex flex-col h-[290px] border border-white rounded-xl relative"
                    >
                        <!-- Discount Badge -->
                        <span
                            v-if="type.discountPercentage"
                            class="absolute top-2 right-2 bg-red-500 text-white text-sm font-bold px-4 py-1 rounded-full shadow-lg"
                        >
                            -{{ type.discountPercentage }}%
                        </span>

                        <h3 class="text-xl font-bold">{{ type.name }}</h3>
                        <p class="text-sm mb-2">
                            {{
                                roomCategories.find(
                                    (category) =>
                                        category.id === type.categoryId,
                                )?.category || "Unknown Category"
                            }}
                        </p>
                        <p class="text-sm mb-4">{{ type.description }}</p>
                        <p class="text-sm mb-4">
                            <i class="pi pi-users"></i>
                            Occupancy: {{ type.occupancy }} person(s)
                        </p>
                        <div
                            class="grid grid-cols-3 gap-4 bg-gray-100 dark:bg-black p-4 rounded-lg mb-4"
                        >
                            <div>
                                <p class="text-sm font-bold">6hrs:</p>
                                <p>
                                    <span v-if="type.discountedRates?.['6hrs']">
                                        <span class="line-through text-red-400">
                                            ₱{{
                                                type.rates[
                                                    "6hrs"
                                                ].toLocaleString("en-PH")
                                            }}
                                        </span>
                                        <span class="text-gray-500 font-bold">
                                            ₱{{
                                                type.discountedRates[
                                                    "6hrs"
                                                ].toLocaleString("en-PH")
                                            }}
                                        </span>
                                    </span>
                                    <span v-else>
                                        ₱{{
                                            type.rates["6hrs"].toLocaleString(
                                                "en-PH",
                                            )
                                        }}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <p class="text-sm font-bold">12hrs:</p>
                                <p>
                                    <span
                                        v-if="type.discountedRates?.['12hrs']"
                                    >
                                        <span class="line-through text-red-400">
                                            ₱{{
                                                type.rates[
                                                    "12hrs"
                                                ].toLocaleString("en-PH")
                                            }}
                                        </span>
                                        <span class="text-gray-500 font-bold">
                                            ₱{{
                                                type.discountedRates[
                                                    "12hrs"
                                                ].toLocaleString("en-PH")
                                            }}
                                        </span>
                                    </span>
                                    <span v-else>
                                        ₱{{
                                            type.rates["12hrs"].toLocaleString(
                                                "en-PH",
                                            )
                                        }}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <p class="text-sm font-bold">24hrs:</p>
                                <p>
                                    <span
                                        v-if="type.discountedRates?.['24hrs']"
                                    >
                                        <span class="line-through text-red-400">
                                            ₱{{
                                                type.rates[
                                                    "24hrs"
                                                ].toLocaleString("en-PH")
                                            }}
                                        </span>
                                        <span class="text-gray-500 font-bold">
                                            ₱{{
                                                type.discountedRates[
                                                    "24hrs"
                                                ].toLocaleString("en-PH")
                                            }}
                                        </span>
                                    </span>
                                    <span v-else>
                                        ₱{{
                                            type.rates["24hrs"].toLocaleString(
                                                "en-PH",
                                            )
                                        }}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div class="mt-auto flex items-center gap-2">
                            <Button
                                primary
                                label="Add Discount"
                                icon="pi pi-percentage"
                                v-if="!type.discountPercentage"
                                @click="openDiscountDialog(type)"
                                class="text-center h-10"
                            />
                            <Button
                                label="Remove Discount"
                                class="p-button-primary text-center h-10"
                                icon="pi pi-times"
                                v-if="type.discountPercentage"
                                @click="openRemoveDiscountDialog(type)"
                            />
                            <Button
                                label="Edit"
                                class="p-button-primary flex-1 text-center h-10"
                                icon="pi pi-pencil"
                                @click="openEditDialog(type)"
                            />
                            <Button
                                label="Delete"
                                class="p-button-primary flex-1 text-center h-10"
                                icon="pi pi-trash"
                                @click="openDeleteDialog(type)"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Add Discount Dialog -->
            <Dialog
                v-model:visible="showDiscountDialog"
                header="Add Discount"
                :modal="true"
                style="width: 30vw"
            >
                <div class="mb-4">
                    <label for="discount" class="block mb-1"
                        >Discount Percentage</label
                    >
                    <InputText
                        v-model.number="discountInput"
                        id="discount"
                        type="number"
                        class="w-full px-4 py-2 border rounded-lg"
                        placeholder="Enter discount percentage"
                    />
                </div>
                <div class="flex justify-end gap-2">
                    <Button
                        label="Cancel"
                        class="p-button-secondary"
                        @click="closeDiscountDialog"
                    />
                    <Button
                        label="Apply"
                        class="p-button-primary"
                        @click="applyDiscount"
                    />
                </div>
            </Dialog>

            <!-- Edit Room Type Dialog -->
            <Dialog
                v-model:visible="showEditDialog"
                header="Edit Room Type"
                :modal="true"
                style="width: 40vw"
            >
                <!-- Room Type Name -->
                <div class="mb-4">
                    <label for="name" class="block mb-1">Type Name</label>
                    <InputText
                        v-model="editType.name"
                        id="name"
                        type="text"
                        class="w-full px-4 py-2 border rounded-lg"
                        placeholder="Enter room type name"
                    />
                </div>

                <!-- Category Selection -->
                <div class="mb-4">
                    <label for="category" class="block mb-1">Category</label>
                    <Select
                        v-model="editType.categoryId"
                        :options="roomCategories"
                        optionLabel="category"
                        optionValue="id"
                        class="w-full"
                        placeholder="Select a category"
                    />
                </div>

                <!-- Rates -->
                <div class="mb-4">
                    <label class="block mb-1">Rates</label>
                    <div class="grid grid-cols-3 gap-4">
                        <div>
                            <label for="rate6hrs" class="block text-sm"
                                >6hrs</label
                            >
                            <InputText
                                v-model.number="editType.rates['6hrs']"
                                id="rate6hrs"
                                type="number"
                                class="w-full"
                            />
                        </div>
                        <div>
                            <label for="rate12hrs" class="block text-sm"
                                >12hrs</label
                            >
                            <InputText
                                v-model.number="editType.rates['12hrs']"
                                id="rate12hrs"
                                type="number"
                                class="w-full"
                            />
                        </div>
                        <div>
                            <label for="rate24hrs" class="block text-sm"
                                >24hrs</label
                            >
                            <InputText
                                v-model.number="editType.rates['24hrs']"
                                id="rate24hrs"
                                type="number"
                                class="w-full"
                            />
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex justify-end gap-2">
                    <Button
                        label="Cancel"
                        class="p-button-secondary"
                        @click="closeEditDialog"
                    />
                    <Button
                        label="Save"
                        class="p-button-primary"
                        @click="saveEdit"
                    />
                </div>
            </Dialog>
        </div>
        <!-- Delete Dialog -->
        <Dialog
            v-model:visible="showDeleteDialog"
            header="Confirm Delete"
            :modal="true"
            style="width: 30vw"
        >
            <div class="text-center">
                <p>Are you sure you want to delete the room type:</p>
                <p class="font-bold text-lg">{{ deleteType?.name }}</p>
            </div>
            <div class="flex justify-end gap-2 mt-4">
                <Button
                    label="Cancel"
                    class="p-button-secondary"
                    @click="closeDeleteDialog"
                />
                <Button
                    label="Delete"
                    class="p-button-danger"
                    @click="confirmDelete"
                />
            </div>
        </Dialog>

        <Dialog
            v-model:visible="showRemoveDiscountDialog"
            header="Confirm Removal"
            :modal="true"
            style="width: 30vw"
        >
            <div class="text-center">
                <p>Are you sure you want to remove the discount for:</p>
                <p class="font-bold text-lg">{{ discountType?.name }}</p>
            </div>
            <div class="flex justify-end gap-2 mt-4">
                <Button
                    label="Cancel"
                    class="p-button-secondary"
                    @click="closeRemoveDiscountDialog"
                />
                <Button
                    label="Remove"
                    class="p-button-danger"
                    @click="confirmRemoveDiscount"
                />
            </div>
        </Dialog>
    </div>
    <div>
        <Toast />
    </div>
</template>
