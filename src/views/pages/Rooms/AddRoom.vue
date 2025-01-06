<script setup>
import { ref } from "vue";

import { ProductService } from "@/service/ProductService";
import { useToast } from "primevue/usetoast";
import { computed, onMounted } from "vue";

onMounted(() => {
    try {
        const data = ProductService.getProductsWithOrdersData(); // No promise, direct call
        console.log("Products Loaded:", data);
        products.value = data; // Assign the data to your `products` reactive variable
    } catch (error) {
        console.error("Error loading products:", error);
    }
});

const newRoom = ref({
    roomName: "",
    floorNumber: "",
    imageUrl: "", // Stores the uploaded image URL
    typeId: null,
    categoryId: null,
    description: "",
    occupancy: 0,
    rates: { "6hrs": 0, "12hrs": 0, "24hrs": 0 },
    amenities: [],
});

// Stepper State
const currentStep = ref(1);
const showDialog = ref(false);
const closeDialog = ref(false);

// State to track selected items
const selectedItems = ref([]);

// Room Categories & Types Data
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
        discountedRates: {
            "6hrs": 30 - 30 * 0.05,
            "12hrs": 50 - 50 * 0.05,
            "24hrs": 80 - 80 * 0.05,
        },
        discountPercentage: 5, // Added discount percentage
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

const showConfirmDialog = ref(false); // State for confirmation dialog

function openConfirmDialog() {
    showConfirmDialog.value = true;
}

function closeConfirmDialog() {
    showConfirmDialog.value = false;
}

// Filter the data to only include "Available" status
const filteredData = computed(() =>
    flatData.value.filter(
        (item) =>
            item.category === "Non-Consumable" && item.status === "Available",
    ),
);

function removeItem(item) {
    selectedItems.value = selectedItems.value.filter(
        (selected) => selected.serialNumber !== item.serialNumber,
    );
    toast.add({
        severity: "info",
        summary: "Item Removed",
        detail: `${item.productName} (${item.serialNumber}) removed.`,
        life: 3000,
    });
}

function openDialog() {
    console.log("Opening dialog");
    showDialog.value = true;
}

function selectCard(type) {
    if (selectedRoomType.value) {
        // Deselect the current card
        filteredRoomTypes.value.push(selectedRoomType.value); // Add back the previously selected card
        filteredRoomTypes.value.sort((a, b) => a.id - b.id); // Sort the list (optional for consistency)
    }

    // Select the new card
    selectedRoomType.value = type;

    // Remove the selected card from the list
    filteredRoomTypes.value = filteredRoomTypes.value.filter(
        (room) => room.id !== type.id,
    );

    // Add a toast notification
    toast.add({
        severity: "success",
        summary: "Room Selected",
        detail: `${type.name} has been selected.`,
        life: 3000,
    });

    console.log("Selected Room Type:", selectedRoomType.value);
}

function removeSelectedRoom() {
    if (selectedRoomType.value) {
        // Add the selected room back to the list
        filteredRoomTypes.value.push(selectedRoomType.value);

        // Reset the selected room
        console.log(
            "Removed Room:",
            selectedRoomType.value.name,
            "and added back to the list",
        );
        selectedRoomType.value = null;

        // Ensure the room list is sorted if necessary
        filteredRoomTypes.value.sort((a, b) => a.id - b.id);

        // Show a toast notification
        toast.add({
            severity: "info",
            summary: "Room Removed",
            detail: "The selected room has been removed.",
            life: 3000,
        });
    }
}

// Selected Room Type for Preview
const selectedRoomType = ref(null);
const flatData = ref([]);

onMounted(async () => {
    try {
        const rawProducts = await ProductService.getProductsWithOrdersData();
        console.log("Products Loaded:", rawProducts);

        // Assign raw products to products
        products.value = rawProducts;

        // Process and flatten for other usage
        flatData.value = Array.isArray(rawProducts)
            ? rawProducts.flatMap((product) =>
                  product.batches.flatMap((batch) =>
                      batch.serialNumbers.map((serial) => ({
                          productName: product.name,
                          brand: product.brand,
                          serialNumber: serial.serialNumber,
                          category: product.category,
                          status: serial.status || "N/A",
                      })),
                  ),
              )
            : [];
    } catch (error) {
        console.error("Error loading products:", error);
    }
});

// Track completed steps
const completedSteps = ref([]);

// Functions to navigate steps and mark them as completed
function nextStep() {
    if (currentStep.value < 4) {
        if (!completedSteps.value.includes(currentStep.value)) {
            completedSteps.value.push(currentStep.value);
        }
        currentStep.value++;
    }
}

// Handle bulk selection

const filteredRoomTypes = ref(
    roomTypes.value.map((type) => ({
        ...type,
        category: roomCategories.value.find(
            (category) => category.id === type.categoryId,
        )?.category,
    })),
);

// Floor options
const floorOptions = ref([
    { label: "1st Floor", value: 1 },
    { label: "2nd Floor", value: 2 },
    { label: "3rd Floor", value: 3 },
    { label: "4th Floor", value: 4 },
    { label: "5th Floor", value: 5 },
]);

// Toast Notifications
const toast = useToast();

// Original Products Data
const products = ref([]);

// Function to Navigate to the Previous Step
function prevStep() {
    if (currentStep.value > 1) {
        currentStep.value--;
    } else {
        console.warn("You are already at the first step.");
    }
}

function handleImageUpload(event) {
    const file = event.target.files[0]; // Get the uploaded file
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            newRoom.value.imageUrl = reader.result; // Save the image as a base64 URL
            toast.add({
                severity: "success",
                summary: "Image Uploaded",
                detail: "Room image has been uploaded successfully.",
                life: 3000,
            });
        };
        reader.readAsDataURL(file); // Convert file to base64 URL
    } else {
        toast.add({
            severity: "warn",
            summary: "No Image Selected",
            detail: "Please select an image to upload.",
            life: 3000,
        });
    }
}

function removeImage() {
    newRoom.value.imageUrl = ""; // Clear the uploaded image
    toast.add({
        severity: "info",
        summary: "Image Removed",
        detail: "Room image has been removed.",
        life: 3000,
    });
}

// Fetch Products Data
onMounted(() => {
    ProductService.getProductsWithOrdersData((data) => {
        products.value = data;
    });
});

// Save Room Function
function saveRoom() {
    // Ensure the selected data is saved into `newRoom`
    if (selectedRoomType.value) {
        newRoom.value.typeId = selectedRoomType.value.id;
        newRoom.value.categoryId = selectedRoomType.value.categoryId;
        newRoom.value.description = selectedRoomType.value.description;
        newRoom.value.occupancy = selectedRoomType.value.occupancy;
        newRoom.value.rates = selectedRoomType.value.rates;
    }

    // Validation
    if (
        !newRoom.value.roomName.trim() ||
        !newRoom.value.typeId ||
        !newRoom.value.floorNumber
    ) {
        toast.add({
            severity: "warn",
            summary: "Validation Error",
            detail: "Please complete all fields before submitting.",
            life: 3000,
        });
        return;
    }

    // Log the final payload for debugging
    console.log("Final Room Data for Submission:", newRoom.value);

    // Simulate successful submission
    toast.add({
        severity: "success",
        summary: "Room Added",
        detail: `Room "${newRoom.value.roomName}" added successfully.`,
        life: 3000,
    });

    // Reset the form after submission
    currentStep.value = 1;
    newRoom.value = {
        roomName: "",
        floorNumber: "",
        imageUrl: "",
        typeId: null,
        categoryId: null,
        description: "",
        occupancy: 0,
        rates: { "6hrs": 0, "12hrs": 0, "24hrs": 0 },
        amenities: [],
    };

    // Reset the selected room type and restore the filtered room types
    if (selectedRoomType.value) {
        filteredRoomTypes.value.push(selectedRoomType.value); // Add the selected room back
        filteredRoomTypes.value.sort((a, b) => a.id - b.id); // Sort for consistency
        selectedRoomType.value = null; // Clear the selection
    }

    completedSteps.value = []; // Reset completed steps
    showConfirmDialog.value = false; // Close the dialog
}

function goToStep(step) {
    currentStep.value = step; // Directly set the current step
}
</script>
<template>
    <div class="card">
        <h1 class="text-2xl font-bold mb-4">Add New Room</h1>

        <!-- Stepper -->
        <div class="mb-4">
            <Stepper :value="currentStep">
                <StepList>
                    <Step
                        v-for="step in [1, 2, 3, 4]"
                        :key="step"
                        :value="step"
                        :class="{
                            'text-green-500': completedSteps.includes(step),
                            'text-blue-500 font-bold': currentStep === step,
                            'cursor-pointer': true,
                        }"
                        @click="goToStep(step)"
                    >
                        <template v-if="step === 1"
                            >General Information</template
                        >
                        <template v-else-if="step === 2">Rates</template>
                        <template v-else-if="step === 3"
                            >Assign Amenities</template
                        >
                        <template v-else>Review & Submit</template>
                    </Step>
                </StepList>
            </Stepper>
        </div>

        <!-- Step 1: General Information -->
        <!-- Step 1: General Information -->
        <div v-if="currentStep === 1" class="space-y-4">
            <!-- Image Upload -->
            <div class="card border-b border-gray-300">
                <label for="roomImage" class="block mb-1 font-medium"
                    >Upload Room Image</label
                >
                <input
                    type="file"
                    id="roomImage"
                    accept="image/*"
                    @change="handleImageUpload"
                    class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                <!-- Image Preview -->
                <div
                    v-if="newRoom.imageUrl"
                    class="mt-4 flex items-center gap-4"
                >
                    <img
                        :src="newRoom.imageUrl"
                        alt="Room Preview"
                        class="w-24 h-24 object-cover rounded-md border border-gray-300"
                    />
                    <div>
                        <p class="text-sm font-medium text-gray-700">
                            Preview:
                        </p>
                        <p class="text-sm text-gray-500">Room Image Selected</p>
                    </div>
                    <Button
                        label="Remove"
                        icon="pi pi-times"
                        class="p-button-danger p-button-sm"
                        @click="removeImage"
                    />
                </div>
            </div>

            <!-- Room Number -->
            <div>
                <label for="roomName" class="block mb-1 font-medium"
                    >Room Number</label
                >
                <InputText
                    v-model="newRoom.roomName"
                    id="roomName"
                    placeholder="Enter room number"
                    class="w-full"
                />
            </div>

            <!-- Floor Number -->
            <div>
                <label for="floorNumber" class="block mb-1 font-medium"
                    >Floor Number</label
                >
                <Select
                    v-model="newRoom.floorNumber"
                    id="floorNumber"
                    :options="floorOptions"
                    optionLabel="label"
                    placeholder="Select Floor Number"
                    class="w-full"
                />
            </div>

            <!-- Next Button -->
            <div class="flex justify-end">
                <Button
                    label="Next"
                    icon="pi pi-arrow-right"
                    @click="
                        () => {
                            console.log('Step 1 Data Saved:', newRoom.value);
                            nextStep();
                        }
                    "
                />
            </div>
        </div>

        <div v-if="currentStep === 2" class="space-y-6">
            <!-- Selected Room Preview -->
            <div
                v-if="selectedRoomType"
                class="mt-6 card shadow-md p-4 flex flex-col relative"
            >
                <div>
                    <span>
                        <span class="text-lg font-bold text-green-500">
                            Selected Room Rate
                        </span>
                    </span>
                </div>

                <!-- Discount Badge -->
                <span
                    v-if="selectedRoomType.discountPercentage"
                    class="absolute top-2 right-2 bg-red-500 text-white text-sm font-bold px-4 py-1 rounded-full shadow-lg"
                >
                    -{{ selectedRoomType.discountPercentage }}%
                </span>

                <h3 class="text-xl font-bold">{{ selectedRoomType.name }}</h3>
                <p class="text-sm mb-2">
                    {{
                        roomCategories.find(
                            (category) =>
                                category.id === selectedRoomType.categoryId,
                        )?.category || "Unknown Category"
                    }}
                </p>
                <p class="text-sm mb-4">{{ selectedRoomType.description }}</p>
                <p class="text-sm mb-4">
                    <i class="pi pi-users"></i>
                    Occupancy: {{ selectedRoomType.occupancy }} person(s)
                </p>
                <div
                    class="grid grid-cols-3 gap-4 bg-gray-100 dark:bg-black p-4 rounded-lg mb-4"
                >
                    <div>
                        <p class="text-sm font-bold">6hrs:</p>
                        <p>
                            <span
                                v-if="
                                    selectedRoomType.rates &&
                                    selectedRoomType.rates['6hrs']
                                "
                            >
                                <span
                                    v-if="
                                        selectedRoomType.discountedRates?.[
                                            '6hrs'
                                        ]
                                    "
                                >
                                    <span class="line-through text-red-400">
                                        ₱{{
                                            selectedRoomType.rates[
                                                "6hrs"
                                            ].toLocaleString("en-PH")
                                        }}
                                    </span>
                                    <span class="text-gray-500 font-bold">
                                        ₱{{
                                            selectedRoomType.discountedRates[
                                                "6hrs"
                                            ].toLocaleString("en-PH")
                                        }}
                                    </span>
                                </span>
                                <span v-else>
                                    ₱{{
                                        selectedRoomType.rates[
                                            "6hrs"
                                        ].toLocaleString("en-PH")
                                    }}
                                </span>
                            </span>
                            <span v-else class="text-sm text-red-500">
                                Rate not available
                            </span>
                        </p>
                    </div>
                    <div>
                        <p class="text-sm font-bold">12hrs:</p>
                        <p>
                            <span
                                v-if="
                                    selectedRoomType.rates &&
                                    selectedRoomType.rates['12hrs']
                                "
                            >
                                <span
                                    v-if="
                                        selectedRoomType.discountedRates?.[
                                            '12hrs'
                                        ]
                                    "
                                >
                                    <span class="line-through text-red-400">
                                        ₱{{
                                            selectedRoomType.rates[
                                                "12hrs"
                                            ].toLocaleString("en-PH")
                                        }}
                                    </span>
                                    <span class="text-gray-500 font-bold">
                                        ₱{{
                                            selectedRoomType.discountedRates[
                                                "12hrs"
                                            ].toLocaleString("en-PH")
                                        }}
                                    </span>
                                </span>
                                <span v-else>
                                    ₱{{
                                        selectedRoomType.rates[
                                            "12hrs"
                                        ].toLocaleString("en-PH")
                                    }}
                                </span>
                            </span>
                            <span v-else class="text-sm text-red-500">
                                Rate not available
                            </span>
                        </p>
                    </div>
                    <div>
                        <p class="text-sm font-bold">24hrs:</p>
                        <p>
                            <span
                                v-if="
                                    selectedRoomType.rates &&
                                    selectedRoomType.rates['24hrs']
                                "
                            >
                                <span
                                    v-if="
                                        selectedRoomType.discountedRates?.[
                                            '24hrs'
                                        ]
                                    "
                                >
                                    <span class="line-through text-red-400">
                                        ₱{{
                                            selectedRoomType.rates[
                                                "24hrs"
                                            ].toLocaleString("en-PH")
                                        }}
                                    </span>
                                    <span class="text-gray-500 font-bold">
                                        ₱{{
                                            selectedRoomType.discountedRates[
                                                "24hrs"
                                            ].toLocaleString("en-PH")
                                        }}
                                    </span>
                                </span>
                                <span v-else>
                                    ₱{{
                                        selectedRoomType.rates[
                                            "24hrs"
                                        ].toLocaleString("en-PH")
                                    }}
                                </span>
                            </span>
                            <span v-else class="text-sm text-red-500">
                                Rate not available
                            </span>
                        </p>
                    </div>
                </div>
                <!-- Remove Button -->
                <Button
                    label="Remove"
                    icon="pi pi-times"
                    class="p-button-primary mt-4"
                    @click="removeSelectedRoom"
                    style="width: 150px"
                />
            </div>

            <div>
                <span class="text-lg font-bold text-green-500"
                    >Select Room Rates</span
                >
            </div>
            <!-- Room Types Card Layout -->
            <div class="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
                <div
                    v-for="type in filteredRoomTypes"
                    :key="type.id"
                    @click="!selectedRoomType.value && selectCard(type)"
                >
                    <div
                        class="card shadow-md p-4 flex flex-col h-[290px] relative cursor-pointer"
                        @click="selectCard(type)"
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
                        <div class="grid grid-cols-3 gap-4 p-4 rounded-lg mb-4">
                            <div>
                                <p class="text-sm font-bold">6hrs:</p>
                                <p>
                                    <span
                                        v-if="type.rates && type.rates['6hrs']"
                                    >
                                        <span
                                            v-if="
                                                type.discountedRates?.['6hrs']
                                            "
                                        >
                                            <span
                                                class="line-through text-red-400"
                                            >
                                                ₱{{
                                                    type.rates[
                                                        "6hrs"
                                                    ].toLocaleString("en-PH")
                                                }}
                                            </span>
                                            <span class="font-bold">
                                                ₱{{
                                                    type.discountedRates[
                                                        "6hrs"
                                                    ].toLocaleString("en-PH")
                                                }}
                                            </span>
                                        </span>
                                        <span v-else>
                                            ₱{{
                                                type.rates[
                                                    "6hrs"
                                                ].toLocaleString("en-PH")
                                            }}
                                        </span>
                                    </span>
                                    <span v-else class="text-sm text-red-500">
                                        Rate not available
                                    </span>
                                </p>
                            </div>
                            <div>
                                <p class="text-sm font-bold">12hrs:</p>
                                <p>
                                    <span
                                        v-if="type.rates && type.rates['12hrs']"
                                    >
                                        <span
                                            v-if="
                                                type.discountedRates?.['12hrs']
                                            "
                                        >
                                            <span
                                                class="line-through text-red-400"
                                            >
                                                ₱{{
                                                    type.rates[
                                                        "12hrs"
                                                    ].toLocaleString("en-PH")
                                                }}
                                            </span>
                                            <span class="font-bold">
                                                ₱{{
                                                    type.discountedRates[
                                                        "12hrs"
                                                    ].toLocaleString("en-PH")
                                                }}
                                            </span>
                                        </span>
                                        <span v-else>
                                            ₱{{
                                                type.rates[
                                                    "12hrs"
                                                ].toLocaleString("en-PH")
                                            }}
                                        </span>
                                    </span>
                                    <span v-else class="text-sm text-red-500">
                                        Rate not available
                                    </span>
                                </p>
                            </div>
                            <div>
                                <p class="text-sm font-bold">24hrs:</p>
                                <p>
                                    <span
                                        v-if="type.rates && type.rates['24hrs']"
                                    >
                                        <span
                                            v-if="
                                                type.discountedRates?.['24hrs']
                                            "
                                        >
                                            <span
                                                class="line-through text-red-400"
                                            >
                                                ₱{{
                                                    type.rates[
                                                        "24hrs"
                                                    ].toLocaleString("en-PH")
                                                }}
                                            </span>
                                            <span class="font-bold">
                                                ₱{{
                                                    type.discountedRates[
                                                        "24hrs"
                                                    ].toLocaleString("en-PH")
                                                }}
                                            </span>
                                        </span>
                                        <span v-else>
                                            ₱{{
                                                type.rates[
                                                    "24hrs"
                                                ].toLocaleString("en-PH")
                                            }}
                                        </span>
                                    </span>
                                    <span v-else class="text-sm text-red-500">
                                        Rate not available
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div>
                            <Button
                                label="Select"
                                icon="pi pi-check"
                                class="p-button-primary w-full"
                                @click.stop="selectCard(type)"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div class="flex justify-between">
                <Button
                    label="Back"
                    icon="pi pi-arrow-left"
                    @click="prevStep"
                />
                <Button
                    label="Next"
                    icon="pi pi-arrow-right"
                    @click="nextStep"
                />
            </div>
        </div>

        <!-- Step 3: Assign Amenities -->
        <div v-if="currentStep === 3" class="space-y-4">
            <div class="card">
                <h2 class="text-lg font-bold mb-4">Assigned Amenities</h2>
                <!-- Button to Open Dialog -->
                <div class="mt-4">
                    <Button
                        label="Open Inventory"
                        icon="pi pi-plus"
                        class="p-button-sm p-button-primary mb-4"
                        @click="openDialog"
                    />
                </div>

                <!-- Check if there are selected items -->
                <div v-if="selectedItems.length > 0">
                    <DataTable
                        :value="selectedItems"
                        class="p-datatable-sm"
                        dataKey="serialNumber"
                    >
                        <Column field="productName" header="Product Name" />
                        <Column field="serialNumber" header="Serial Number" />
                        <Column field="category" header="Category" />
                        <Column field="brand" header="Brand" />
                        <Column field="status" header="Status" />
                        <Column header="Actions">
                            <template #body="slotProps">
                                <Button
                                    icon="pi pi-trash"
                                    class="p-button-sm p-button-danger"
                                    @click="removeItem(slotProps.data)"
                                    outlined
                                    rounded
                                />
                            </template>
                        </Column>
                    </DataTable>
                </div>
                <div v-else class="text-red-500 font-semibold">
                    No amenities assigned.
                </div>

                <!-- Dialog for DataTable -->
                <Dialog
                    header="Select Amenities"
                    v-model:visible="showDialog"
                    style="width: 90vw; max-width: 800px"
                    :modal="true"
                    :dismissableMask="true"
                >
                    <DataTable
                        :value="filteredData"
                        class="p-datatable-sm"
                        dataKey="serialNumber"
                        selectionMode="multiple"
                        :selection="selectedItems"
                        @update:selection="selectedItems = $event"
                        style="max-height: 300px; overflow-y: auto"
                    >
                        <!-- Header with Select Button -->
                        <template #header>
                            <div
                                class="sticky top-0 flex justify-between items-center z-10"
                            >
                                <h3 class="text-lg font-bold">
                                    Available Products
                                </h3>
                            </div>
                        </template>

                        <!-- Table Columns -->
                        <Column selectionMode="multiple" />
                        <Column field="productName" header="Product Name" />
                        <Column field="brand" header="Brand" />
                        <Column field="serialNumber" header="Serial Number" />
                        <Column field="category" header="Category" />
                        <Column field="status" header="Status" />
                    </DataTable>

                    <!-- Close Dialog Buttons -->
                    <div class="mt-4 flex gap-4 justify-end">
                        <Button
                            label="Done"
                            icon="pi pi-check"
                            class="p-button-sm p-button-primary"
                            @click="showDialog = false"
                        />
                        <Button
                            label="Close"
                            icon="pi pi-times"
                            class="p-button-sm p-button-primary"
                            @click="closeDialog"
                        />
                    </div>
                </Dialog>

                <!-- Navigation Buttons -->
                <div class="flex justify-between mt-5">
                    <Button
                        label="Back"
                        icon="pi pi-arrow-left"
                        @click="prevStep"
                    />
                    <Button
                        label="Next"
                        icon="pi pi-arrow-right"
                        @click="nextStep"
                    />
                </div>
            </div>
        </div>

        <div v-if="currentStep === 4" class="space-y-6">
            <h2 class="text-lg font-semibold">Review Details</h2>

            <!-- General Information -->
            <div class="card shadow-md p-4">
                <h3 class="text-xl font-bold mb-2">General Information</h3>
                <p>
                    <strong>Room Number:</strong>
                    {{ newRoom.roomName || "Not specified" }}
                </p>
                <p>
                    <strong>Floor Number:</strong>
                    {{ newRoom.floorNumber?.label || "Not specified" }}
                </p>

                <!-- Room Image -->
                <div v-if="newRoom.imageUrl" class="mt-4">
                    <h4 class="text-lg font-bold mb-2">Room Image</h4>
                    <img
                        :src="newRoom.imageUrl"
                        alt="Room Preview"
                        class="w-full max-h-64 object-cover rounded-md"
                    />
                </div>
            </div>

            <!-- Selected Room Preview -->
            <div v-if="selectedRoomType" class="card shadow-md p-4">
                <h3 class="text-xl font-bold mb-2">Selected Room</h3>
                <p><strong>Room Type:</strong> {{ selectedRoomType.name }}</p>
                <p>
                    <strong>Category:</strong>
                    {{
                        roomCategories.find(
                            (category) =>
                                category.id === selectedRoomType.categoryId,
                        )?.category || "Unknown Category"
                    }}
                </p>
                <p>
                    <strong>Description:</strong>
                    {{ selectedRoomType.description }}
                </p>
                <p>
                    <strong>Occupancy:</strong>
                    {{ selectedRoomType.occupancy }} person(s)
                </p>

                <!-- Room Rates -->
                <h4 class="text-lg font-bold mt-4">Rates</h4>
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <p class="font-semibold">6 Hours:</p>
                        <p>
                            <span
                                v-if="
                                    selectedRoomType.rates &&
                                    selectedRoomType.rates['6hrs']
                                "
                            >
                                <span
                                    v-if="
                                        selectedRoomType.discountedRates?.[
                                            '6hrs'
                                        ]
                                    "
                                >
                                    <span class="line-through text-red-400">
                                        ₱{{
                                            selectedRoomType.rates[
                                                "6hrs"
                                            ].toLocaleString("en-PH")
                                        }}
                                    </span>
                                    <span class="text-gray-500 font-bold">
                                        ₱{{
                                            selectedRoomType.discountedRates[
                                                "6hrs"
                                            ].toLocaleString("en-PH")
                                        }}
                                    </span>
                                </span>
                                <span v-else>
                                    ₱{{
                                        selectedRoomType.rates[
                                            "6hrs"
                                        ].toLocaleString("en-PH")
                                    }}
                                </span>
                            </span>
                            <span v-else class="text-sm text-red-500">
                                Rate not available
                            </span>
                        </p>
                    </div>
                    <div>
                        <p class="font-semibold">12 Hours:</p>
                        <p>
                            <span
                                v-if="
                                    selectedRoomType.rates &&
                                    selectedRoomType.rates['12hrs']
                                "
                            >
                                <span
                                    v-if="
                                        selectedRoomType.discountedRates?.[
                                            '12hrs'
                                        ]
                                    "
                                >
                                    <span class="line-through text-red-400">
                                        ₱{{
                                            selectedRoomType.rates[
                                                "12hrs"
                                            ].toLocaleString("en-PH")
                                        }}
                                    </span>
                                    <span class="text-gray-500 font-bold">
                                        ₱{{
                                            selectedRoomType.discountedRates[
                                                "12hrs"
                                            ].toLocaleString("en-PH")
                                        }}
                                    </span>
                                </span>
                                <span v-else>
                                    ₱{{
                                        selectedRoomType.rates[
                                            "12hrs"
                                        ].toLocaleString("en-PH")
                                    }}
                                </span>
                            </span>
                            <span v-else class="text-sm text-red-500">
                                Rate not available
                            </span>
                        </p>
                    </div>
                    <div>
                        <p class="font-semibold">24 Hours:</p>
                        <p>
                            <span
                                v-if="
                                    selectedRoomType.rates &&
                                    selectedRoomType.rates['24hrs']
                                "
                            >
                                <span
                                    v-if="
                                        selectedRoomType.discountedRates?.[
                                            '24hrs'
                                        ]
                                    "
                                >
                                    <span class="line-through text-red-400">
                                        ₱{{
                                            selectedRoomType.rates[
                                                "24hrs"
                                            ].toLocaleString("en-PH")
                                        }}
                                    </span>
                                    <span class="text-gray-500 font-bold">
                                        ₱{{
                                            selectedRoomType.discountedRates[
                                                "24hrs"
                                            ].toLocaleString("en-PH")
                                        }}
                                    </span>
                                </span>
                                <span v-else>
                                    ₱{{
                                        selectedRoomType.rates[
                                            "24hrs"
                                        ].toLocaleString("en-PH")
                                    }}
                                </span>
                            </span>
                            <span v-else class="text-sm text-red-500">
                                Rate not available
                            </span>
                        </p>
                    </div>
                </div>

                <!-- Remove Button -->
                <Button
                    label="Remove Room"
                    icon="pi pi-times"
                    class="p-button-danger mt-4"
                    @click="removeSelectedRoom"
                />
            </div>

            <!-- Assigned Amenities Preview -->
            <div class="card shadow-md p-4">
                <h3 class="text-xl font-bold mb-2">Assigned Amenities</h3>
                <div v-if="selectedItems.length > 0">
                    <DataTable
                        :value="selectedItems"
                        class="p-datatable-sm"
                        dataKey="serialNumber"
                    >
                        <Column field="productName" header="Product Name" />
                        <Column field="serialNumber" header="Serial Number" />
                        <Column field="category" header="Category" />
                        <Column field="brand" header="Brand" />
                        <Column field="status" header="Status" />
                    </DataTable>
                </div>
                <div v-else class="text-red-500">No amenities assigned.</div>
            </div>

            <!-- Navigation Buttons -->
            <div class="flex justify-between mt-4">
                <Button
                    label="Back"
                    icon="pi pi-arrow-left"
                    @click="prevStep"
                />
                <Button
                    label="Submit"
                    icon="pi pi-check"
                    class="p-button-primary"
                    @click="openConfirmDialog"
                />
            </div>
        </div>

        <!-- Confirmation Dialog -->
        <Dialog
            header="Confirm Submission"
            v-model:visible="showConfirmDialog"
            style="width: 400px"
            :modal="true"
            :dismissableMask="true"
        >
            <p class="text-sm">Are you sure you want to submit this room?</p>
            <div class="flex justify-end mt-4 gap-2">
                <Button
                    label="Cancel"
                    class="p-button-secondary p-button-sm"
                    @click="closeConfirmDialog"
                />
                <Button
                    label="Submit"
                    class="p-button-success p-button-sm"
                    @click="saveRoom"
                />
            </div>
        </Dialog>
        <Toast />
    </div>
</template>
