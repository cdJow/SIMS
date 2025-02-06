<script setup>
import { ProductService } from "@/service/ProductService";
import { useToast } from "primevue/usetoast";
import { onMounted, ref } from "vue";

// State Variables
const layout = ref("grid");
const rooms = ref([
    {
        id: 1,
        roomNumber: "101",
        floor: "1st Floor",
        image: "https://via.placeholder.com/300",
        name: "Room 101",
        type: "Double Size Bed",
        category: "Standard",
        description: "Perfect for two guests with additional space.",
        occupancy: 2, // Changed from "2 person(s)" to 2
        price: {
            "6 Hours": 50,
            "12 Hours": 80,
            "24 Hours": 120,
        },
        status: "Available",
        amenities: [
            {
                name: "Product A",
                serialNumber: "SN11",
                category: "Non-Consumable",
                brand: "Brand A",
                status: "Available",
            },
        ],
    },
    {
        id: 2,
        roomNumber: "102",
        floor: "1st Floor",
        image: "https://via.placeholder.com/300",
        name: "Room 102",
        type: "Single Size Bed",
        category: "Standard",
        description: "Cozy room for a single guest.",
        occupancy: 1, // Changed from "1 person(s)" to 1
        price: {
            "6 Hours": 30,
            "12 Hours": 50,
            "24 Hours": 90,
        },
        status: "Occupied",
        amenities: [
            {
                name: "Product B",
                serialNumber: "SN12",
                category: "Non-Consumable",
                brand: "Brand B",
                status: "In Use",
            },
        ],
    },
    {
        id: 3,
        roomNumber: "103",
        floor: "2nd Floor",
        image: "https://via.placeholder.com/300",
        name: "Room 103",
        type: "Double Size Bed",
        category: "Deluxe",
        description: "Spacious room ideal for couples or small families.",
        occupancy: 2, // Changed from "2 person(s)" to 2
        price: {
            "6 Hours": 70,
            "12 Hours": 100,
            "24 Hours": 150,
        },
        status: "Cleaning",
        amenities: [
            {
                name: "Product C",
                serialNumber: "SN13",
                category: "Non-Consumable",
                brand: "Brand C",
                status: "Being Cleaned",
            },
        ],
    },
]);

// State Variables
const stats = ref({
    operationalRooms: 80,
    underMaintinance: 4,
    totalRooms: 84,
    revenue: 5500,
    revenueIncrease: 12,
});

// State for available amenities and selected amenities
const availableAmenities = ref([]);
const selectedAmenities = ref([]);

const openEditDialog = (room) => {
    console.log("Room Data:", room);
    roomToEdit.value = {
        ...room,
        assignedAmenities: room.amenities || [],
    };
    console.log("roomToEdit Data:", roomToEdit.value);
    isEditDialogVisible.value = true;
};

// Fetch data from ProductService
const fetchAvailableAmenities = async () => {
    try {
        const data = await ProductService.getProductsWithOrders();
        availableAmenities.value = [];

        // Iterate over the products and map batches with serial numbers
        data.forEach((product) => {
            product.batches.forEach((batch) => {
                batch.serialNumbers.forEach((serial) => {
                    availableAmenities.value.push({
                        name: product.name,
                        brand: product.brand,
                        serialNumber: serial.serialNumber || "N/A",
                        category: product.category,
                        status: serial.status || "Unknown", // Use serial number status
                    });
                });
            });
        });
    } catch (error) {
        console.error("Error fetching available amenities:", error);
    }
};

// Fetch amenities data on component mount
onMounted(() => {
    fetchAvailableAmenities();
});

const products = ref([]);

onMounted(async () => {
    try {
        products.value = await ProductService.getProductsWithOrders();
    } catch (error) {
        console.error("Error fetching products:", error);
    }
});

// Example categories
const category = [
    { label: "Standard", value: "Standard" },
    { label: "Deluxe", value: "Deluxe" },
    { label: "King", value: "King" },
];

const isDetailsDialogVisible = ref(false); // State to control dialog visibility
const isAmenitiesDialogVisible = ref(false); // State to control amenities dialog visibility
const selectedRoom = ref(null); // Store selected room details

// Helper Functions
const getSeverity = (room) => {
    switch (room.status) {
        case "Available":
            return "success";
        case "Occupied":
            return "info";
        case "Maintenance":
            return "warning";
        default:
            return "danger";
    }
};

function formatPrice(value) {
    if (value == null || isNaN(value)) return "₱0.00";
    return `₱${parseFloat(value).toFixed(2).toLocaleString()}`;
}

const openDetailsDialog = (room) => {
    selectedRoom.value = room; // Set selected room
    isDetailsDialogVisible.value = true; // Open dialog
};

// State for delete confirmation dialog visibility
const isDeleteDialogVisible = ref(false);

// State for the selected room to delete
const roomToDelete = ref(null);

// Function to open the Delete Confirmation Dialog
const openDeleteDialog = (room) => {
    roomToDelete.value = room; // Set the selected room
    isDeleteDialogVisible.value = true; // Open the dialog
};

// Function to confirm deletion
const confirmDeleteRoom = () => {
    if (!roomToDelete.value) return;

    // Remove the room from the rooms array
    const roomIndex = rooms.value.findIndex(
        (r) => r.id === roomToDelete.value.id,
    );
    if (roomIndex !== -1) {
        rooms.value.splice(roomIndex, 1); // Delete the room
    }

    isDeleteDialogVisible.value = false; // Close the dialog
    roomToDelete.value = null; // Reset the selected room
};

const closeAmenitiesDialog = () => {
    isAmenitiesDialogVisible.value = false; // Set the dialog visibility to false
    console.log("Amenities dialog closed"); // Optional: Log the action
};

// Function to cancel deletion
const cancelDelete = () => {
    roomToDelete.value = null; // Reset the selected room
    isDeleteDialogVisible.value = false; // Close the dialog
};

// State for edit dialog visibility
const isEditDialogVisible = ref(false);

// State for the room being edited
const roomToEdit = ref(null);

// Function to save changes
const toast = useToast();

const openAmenitiesDialog = () => {
    selectedAmenities.value = [...roomToEdit.value.assignedAmenities];
    isAmenitiesDialogVisible.value = true;
};

const confirmAmenitiesSelection = () => {
    // Update assigned amenities
    roomToEdit.value.assignedAmenities = [...selectedAmenities.value];
    closeAmenitiesDialog();

    // Show toast notification
    toast.add({
        severity: "success",
        summary: "Amenities Updated",
        detail: "The assigned amenities have been successfully updated.",
        life: 3000, // Toast duration in milliseconds
    });
};
const cancelEdit = () => {
    isEditDialogVisible.value = false;
};
const saveRoomDetails = () => {
    console.log("Room details saved:", roomToEdit.value);

    // Log updated amenities
    console.log("Updated Amenities:", roomToEdit.value.assignedAmenities);

    isEditDialogVisible.value = false;

    // Show toast notification
    toast.add({
        severity: "success",
        summary: "Room Saved",
        detail: `The room details have been successfully saved with ${roomToEdit.value.assignedAmenities.length} amenities updated.`,
        life: 3000, // Toast duration in milliseconds
    });
};
</script>

<template>
    <div class="grid grid-cols-12 gap-4 mb-3">
        <!-- Total Available Rooms -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-4">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4"
                            >Operational Rooms</span
                        >
                        <div
                            class="text-green-500 dark:text-surface-0 text-4xl font-semi-bold"
                        >
                            {{ stats.operationalRooms }}
                        </div>
                    </div>
                    <div
                        class="flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-border"
                        style="width: 2.5rem; height: 2.5rem"
                    >
                        <i class="pi pi-table text-green-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Total Occupied Rooms -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-4">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4"
                            >Under Maintinance</span
                        >
                        <div
                            class="text-red-500 dark:text-surface-0 text-4xl font-semi-bold"
                        >
                            {{ stats.underMaintinance }}
                        </div>
                    </div>
                    <div
                        class="flex items-center justify-center bg-red-100 dark:bg-red-400/10 rounded-border"
                        style="width: 2.5rem; height: 2.5rem"
                    >
                        <i class="pi pi-table text-red-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Number of Bookings -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-4">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4"
                            >Total Rooms</span
                        >
                        <div
                            class="text-blue-900 dark:text-surface-0 text-4xl font-semi-bold"
                        >
                            {{ stats.totalRooms }}
                        </div>
                    </div>
                    <div
                        class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border"
                        style="width: 2.5rem; height: 2.5rem"
                    >
                        <i class="pi pi-calendar text-blue-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Rooms</div>
        <DataView :value="rooms" :layout="layout">
            <!-- Grid Layout -->
            <template #grid="slotProps">
                <div class="grid grid-cols-2 gap-4">
                    <div
                        v-for="(room, index) in slotProps.items"
                        :key="index"
                        class="border rounded-lg shadow-md p-4 card"
                    >
                        <!-- Room Image and Status -->
                        <div class="relative flex justify-center mb-4">
                            <img
                                class="rounded-md w-full h-48 object-cover"
                                :src="room.image"
                                :alt="room.name"
                            />
                            <Tag
                                :value="room.status"
                                :severity="getSeverity(room)"
                                class="absolute top-2 left-2"
                            />
                        </div>

                        <!-- Room Info -->
                        <div class="mb-4">
                            <div class="text-lg font-bold">{{ room.type }}</div>
                            <div class="text-sm">
                                {{ room.category }}
                            </div>
                            <div class="text-sm mt-2">
                                {{ room.description }}
                            </div>
                            <div class="text-sm mt-2 gap-2">
                                <i class="pi pi-user"></i> Occupancy:
                                {{ room.occupancy }} person(s)
                            </div>
                        </div>

                        <!-- Rates -->
                        <div
                            class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 p-4"
                        >
                            <div
                                class="p-4 bg-white dark:bg-slate-900 rounded-md shadow-md flex flex-col items-center"
                            >
                                <div
                                    class="text-sm font-semibold text-gray-700 dark:text-gray-200"
                                >
                                    6hrs:
                                </div>
                                <div
                                    class="text-sm text-green-600 font-semibold"
                                >
                                    {{ formatPrice(room.price["6 Hours"]) }}
                                </div>
                            </div>
                            <div
                                class="p-4 bg-white dark:bg-slate-900 rounded-md shadow-md flex flex-col items-center"
                            >
                                <div
                                    class="text-sm font-semibold text-gray-700 dark:text-gray-200"
                                >
                                    12hrs:
                                </div>
                                <div
                                    class="text-sm text-green-600 font-semibold"
                                >
                                    {{ formatPrice(room.price["12 Hours"]) }}
                                </div>
                            </div>
                            <div
                                class="p-4 bg-white dark:bg-slate-900 rounded-md shadow-md flex flex-col items-center"
                            >
                                <div
                                    class="text-sm font-semibold text-gray-700 dark:text-gray-200"
                                >
                                    24hrs:
                                </div>
                                <div
                                    class="text-sm text-green-600 font-semibold"
                                >
                                    {{ formatPrice(room.price["24 Hours"]) }}
                                </div>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="flex gap-2">
                            <!-- Edit Button -->
                            <Button
                                icon="pi pi-pencil"
                                label="Edit"
                                :disabled="room.status === 'Occupied'"
                                @click="openEditDialog(room)"
                                class="flex-auto"
                            ></Button>

                            <!-- Delete Button -->
                            <Button
                                icon="pi pi-trash"
                                label="Delete"
                                :disabled="room.status === 'Occupied'"
                                @click="openDeleteDialog(room)"
                                severity="primary"
                                class="flex-auto"
                            ></Button>

                            <!-- Details Button -->
                            <Button
                                icon="pi pi-info-circle"
                                label="Details"
                                @click="openDetailsDialog(room)"
                                class="flex-auto"
                            ></Button>
                        </div>
                    </div>
                </div>
            </template>
        </DataView>
    </div>

    <!-- Details Dialog -->
    <Dialog
        v-model:visible="isDetailsDialogVisible"
        :dismissableMask="true"
        :header="selectedRoom?.name || 'Room Details'"
        :modal="true"
        :closable="true"
        :style="{ width: '50vw' }"
    >
        <div v-if="selectedRoom">
            <!-- Room Info -->
            <div class="mb-4">
                <h3 class="text-lg font-semibold">{{ selectedRoom.type }}</h3>
                <p class="text-sm text-gray-500">{{ selectedRoom.category }}</p>
                <p class="mt-2 text-sm">{{ selectedRoom.description }}</p>
                <p class="mt-2 text-sm">
                    <i class="pi pi-user"></i> Occupancy:
                    {{ selectedRoom.occupancy }}
                </p>
            </div>

            <!-- Rates -->
            <div class="p-4 bg-gray-100 rounded-md mb-4">
                <h4 class="font-semibold mb-2">Rates</h4>
                <div class="grid grid-cols-3 gap-2 text-center">
                    <div>
                        <span class="font-semibold">6hrs:</span>
                        <span>{{
                            formatPrice(selectedRoom.price["6 Hours"])
                        }}</span>
                    </div>
                    <div>
                        <span class="font-semibold">12hrs:</span>
                        <span>{{
                            formatPrice(selectedRoom.price["12 Hours"])
                        }}</span>
                    </div>
                    <div>
                        <span class="font-semibold">24hrs:</span>
                        <span>{{
                            formatPrice(selectedRoom.price["24 Hours"])
                        }}</span>
                    </div>
                </div>
            </div>

            <!-- Assigned Amenities -->
            <!-- Assigned Amenities -->
            <div>
                <h4 class="font-semibold mb-4">Assigned Amenities</h4>
                <div class="grid grid-cols-4 gap-4 text-sm font-medium">
                    <!-- Table Headers -->
                    <div class="font-semibold">Name</div>
                    <div class="font-semibold">Category</div>
                    <div class="font-semibold">Brand</div>
                    <div class="font-semibold">Serial Number</div>

                    <!-- Amenities Data -->
                    <div
                        v-for="(amenity, index) in selectedRoom.amenities"
                        :key="index"
                        class="contents"
                    >
                        <div>{{ amenity.name }}</div>
                        <div>{{ amenity.category }}</div>
                        <div>{{ amenity.brand }}</div>
                        <div>{{ amenity.serialNumber }}</div>
                    </div>
                </div>
            </div>
        </div>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog
        v-model:visible="isDeleteDialogVisible"
        :header="'Confirm Deletion'"
        :modal="true"
        :closable="true"
        :style="{ width: '30vw' }"
    >
        <div class="flex flex-col items-center">
            <p class="text-sm text-center mb-4">
                Are you sure you want to delete
                <strong class="text-red-500">{{ roomToDelete?.name }}</strong
                >? This action cannot be undone.
            </p>
            <div class="flex justify-end gap-2 w-full">
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    class="p-button-primary"
                    @click="cancelDelete"
                ></Button>
                <Button
                    label="Delete"
                    icon="pi pi-trash"
                    class="p-button-primary"
                    @click="confirmDeleteRoom"
                ></Button>
            </div>
        </div>
    </Dialog>

    <!-- Edit Room Dialog -->
    <Dialog
        :dismissable-mask="true"
        v-model:visible="isEditDialogVisible"
        :header="'Edit Room - ' + (roomToEdit?.name || '')"
        :modal="true"
        :closable="true"
        :style="{ width: '30vw' }"
    >
        <div v-if="roomToEdit">
            <!-- Room Type -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Room Type</label>
                <InputText
                    v-model="roomToEdit.type"
                    placeholder="Enter room type"
                    class="w-full"
                />
            </div>

            <!-- Category -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Category</label>
                <Select
                    v-model="roomToEdit.category"
                    :options="category"
                    optionLabel="label"
                    placeholder="Select Category"
                    class="w-full"
                />
            </div>

            <!-- Description -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2"
                    >Description</label
                >
                <Textarea
                    v-model="roomToEdit.description"
                    placeholder="Enter room description"
                    class="w-full"
                />
            </div>

            <!-- Occupancy -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Occupancy</label>
                <InputText
                    type="number"
                    v-model="roomToEdit.occupancy"
                    placeholder="Enter occupancy"
                    class="w-full"
                />
            </div>

            <!-- Rates -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Rates</label>
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium">6 Hours</label>
                        <InputText
                            v-model="roomToEdit.price['6 Hours']"
                            type="number"
                            placeholder="Enter price"
                            class="w-full"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium"
                            >12 Hours</label
                        >
                        <InputText
                            v-model="roomToEdit.price['12 Hours']"
                            type="number"
                            placeholder="Enter price"
                            class="w-full"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium"
                            >24 Hours</label
                        >
                        <InputText
                            v-model="roomToEdit.price['24 Hours']"
                            type="number"
                            placeholder="Enter price"
                            class="w-full"
                        />
                    </div>
                </div>
            </div>

            <!-- Assigned Amenities -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2"
                    >Assigned Amenities</label
                >
                <Button
                    label="Manage Assigned Amenities"
                    icon="pi pi-pencil"
                    class="p-button-primary mb-2"
                    @click="openAmenitiesDialog"
                ></Button>
                <ul class="list-disc pl-5">
                    <li
                        v-for="(
                            amenity, index
                        ) in roomToEdit.assignedAmenities || []"
                        :key="index"
                        class="mb-2"
                    >
                        <span class="font-medium">{{
                            amenity.name || "Unnamed Amenity"
                        }}</span>
                        - {{ amenity.brand || "No Brand" }} (Serial:
                        {{ amenity.serialNumber || "N/A" }})
                    </li>
                </ul>
            </div>

            <!-- Dialog Actions -->
            <div class="flex justify-end gap-2">
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    class="p-button-primary"
                    @click="cancelEdit"
                ></Button>
                <Button
                    label="Save"
                    icon="pi pi-save"
                    @click="saveRoomDetails"
                ></Button>
            </div>
        </div>
    </Dialog>

    <!-- Edit Amenities Dialog -->
    <Dialog
        v-model:visible="isAmenitiesDialogVisible"
        header="Select Amenities"
        :modal="true"
        :dismissable-mask="true"
        :closable="true"
        :style="{ width: '50vw' }"
    >
        <div>
            <h3 class="text-lg font-medium mb-4">Available Products</h3>

            <div class="flex items-center mb-4 gap-2">
                <Button
                    type="button"
                    icon="pi pi-filter-slash"
                    label="Clear"
                    outlined
                />
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText placeholder="Keyword Search" />
                </IconField>
            </div>
            <!-- DataTable for Available Amenities -->
            <DataTable
                :value="availableAmenities"
                selection-mode="multiple"
                v-model:selection="selectedAmenities"
                dataKey="serialNumber"
                class="w-full"
                :paginator="true"
                :rows="5"
            >
                <Column
                    selectionMode="multiple"
                    headerStyle="width: 3rem"
                ></Column>
                <Column field="name" header="Product Name" sortable></Column>
                <Column field="brand" header="Brand" sortable></Column>
                <Column
                    field="serialNumber"
                    header="Serial Number"
                    sortable
                ></Column>
                <Column field="category" header="Category" sortable></Column>
                <Column field="status" header="Status" sortable></Column>
            </DataTable>

            <!-- Action Buttons -->
            <div class="flex justify-end mt-4 gap-4">
                <Button
                    label="Done"
                    icon="pi pi-check"
                    class="p-button-success"
                    @click="confirmAmenitiesSelection"
                ></Button>
                <Button
                    label="Close"
                    icon="pi pi-times"
                    class="p-button-secondary"
                    @click="closeAmenitiesDialog"
                ></Button>
            </div>
        </div>
    </Dialog>
    <Toast />
</template>
