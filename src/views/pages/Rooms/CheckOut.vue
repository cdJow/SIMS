<script setup>
import { computed, ref } from "vue";

// Mock data for rooms
const rooms = ref([
    {
        id: 1,
        roomNumber: "101",
        floor: "1st Floor",
        image: "https://via.placeholder.com/300",
        name: "Room 101",
        type: "Double",
        description: "Perfect for two guests with additional space.",
        status: "Available",
        price: {
            "6 Hours": 50,
            "12 Hours": 80,
            "24 Hours": 120,
        },
        cleaningStatus: "Clean",
        guest: null, // No guest if the room is available
    },
    {
        id: 2,
        roomNumber: "102",
        floor: "1st Floor",
        image: "https://via.placeholder.com/300",
        name: "Room 102",
        type: "Single",
        description: "A cozy room for a single guest.",
        status: "Occupied",
        price: {
            "6 Hours": 30,
            "12 Hours": 50,
            "24 Hours": 90,
        },
        cleaningStatus: "Clean",
        guest: {
            name: "John Doe",
            checkIn: "2025-01-06 14:00",
            checkOut: "2025-01-07 11:00",
        },
    },
    {
        id: 3,
        roomNumber: "103",
        floor: "2nd Floor",
        image: "https://via.placeholder.com/300",
        name: "Room 103",
        type: "Suite",
        description: "A luxurious suite for families or groups.",
        status: "Cleaning",
        price: {
            "6 Hours": 100,
            "12 Hours": 150,
            "24 Hours": 250,
        },
        cleaningStatus: "Needs Cleaning",
        guest: null,
    },
    {
        id: 3,
        roomNumber: "103",
        floor: "2nd Floor",
        image: "https://via.placeholder.com/300",
        name: "Room 103",
        type: "Suite",
        description: "A luxurious suite for families or groups.",
        status: "Cleaning",
        price: {
            "6 Hours": 100,
            "12 Hours": 150,
            "24 Hours": 250,
        },
        cleaningStatus: "Needs Cleaning",
        guest: null,
    },
    {
        id: 4,
        roomNumber: "104",
        floor: "2nd Floor",
        image: "https://via.placeholder.com/300",
        name: "Room 104",
        type: "Double",
        description: "Spacious room perfect for couples.",
        status: "Cleaning", // New cleaning status
        price: {
            "6 Hours": 60,
            "12 Hours": 100,
            "24 Hours": 140,
        },
        cleaningStatus: "In Progress",
        guest: null,
    },
]);

// Search and Filter State
const searchQuery = ref("");
const selectedFilter = ref({
    roomType: null,
    status: null,
    cleaningStatus: null,
});
const sortBy = ref(null);

// Dropdown Options
const roomTypes = ref(["Single", "Double", "Suite"]);

const sortOptions = ref(["Room Number", "Type", "Status"]);

// Computed Filtered Rooms
const filteredRooms = computed(() => {
    let filtered = rooms.value;

    // Show only available rooms
    filtered = filtered.filter((room) => room.status === "Occupied");

    // Filter by search query
    if (searchQuery.value) {
        filtered = filtered.filter(
            (room) =>
                room.roomNumber.includes(searchQuery.value) ||
                room.type
                    .toLowerCase()
                    .includes(searchQuery.value.toLowerCase()),
        );
    }

    // Filter by room type
    if (selectedFilter.value.roomType) {
        filtered = filtered.filter(
            (room) => room.type === selectedFilter.value.roomType,
        );
    }

    // Filter by cleaning status (example, if added to room data)
    if (selectedFilter.value.cleaningStatus) {
        filtered = filtered.filter(
            (room) =>
                room.cleaningStatus === selectedFilter.value.cleaningStatus,
        );
    }

    // Sort
    if (sortBy.value) {
        switch (sortBy.value) {
            case "Room Number":
                filtered.sort((a, b) =>
                    a.roomNumber.localeCompare(b.roomNumber),
                );
                break;
            case "Type":
                filtered.sort((a, b) => a.type.localeCompare(b.type));
                break;
            case "Status":
                filtered.sort((a, b) => a.status.localeCompare(b.status));
                break;
        }
    }

    return filtered;
});

// Dialog State
const isDetailsDialogVisible = ref(false);
const selectedRoom = ref(null);

// Helper Functions
const formatPrice = (value) => {
    return value ? `₱${parseFloat(value).toFixed(2)}` : "₱0.00";
};

const getSeverity = (room) => {
    switch (room.status) {
        case "Available":
            return "success";
        case "Occupied":
            return "danger";
        case "Out of Service":
            return "danger";
        case "Cleaning":
            return "danger";
        default:
            return "secondary";
    }
};

const openDetailsDialog = (room) => {
    selectedRoom.value = room;
    isDetailsDialogVisible.value = true;
};
</script>

<template>
    <div class="card">
        <!-- Room Count Cards -->

        <h2 class="text-xl font-bold mb-5">Room List</h2>
        <div class="flex justify-between items-center mb-4">
            <div class="card flex items-center gap-4 p-4">
                <div class="flex items-center gap-2">
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
                <Select
                    v-model="selectedFilter.roomType"
                    :options="roomTypes"
                    placeholder="Filter by Room Type"
                    class="w-full"
                />

                <Select
                    v-model="sortBy"
                    :options="sortOptions"
                    placeholder="Sort By"
                    class="w-full"
                />
            </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            <div
                v-for="room in filteredRooms"
                :key="room.id"
                :class="[
                    'card border rounded-lg p-6 shadow-md flex flex-col gap-4',
                ]"
            >
                <!-- Room Image and Status -->
                <div>
                    <div class="relative">
                        <img
                            :src="room.image"
                            alt="Room Image"
                            class="rounded-md w-full h-48 object-cover"
                        />
                        <Tag
                            :value="room.status"
                            :severity="getSeverity(room)"
                            class="absolute top-2 left-2"
                        />
                    </div>
                    <h3 class="text-lg font-semibold mt-4">
                        {{ room.roomNumber }} - {{ room.type }}
                    </h3>
                    <p class="text-sm">{{ room.description }}</p>
                    <div class="text-sm mt-2">
                        <strong>Occupancy:</strong> 2 person(s)
                    </div>
                </div>

                <!-- Pricing Section -->
                <div class="grid grid-cols-3 gap-4">
                    <div
                        class="bg-white dark:bg-slate-600 border border-gray-200 shadow-sm p-4 rounded-lg flex flex-col items-center"
                    >
                        <p class="font-bold text-sm">6hrs:</p>
                        <p class="text-green-600 font-semibold">
                            ₱{{ room.price["6 Hours"] }}
                        </p>
                    </div>
                    <div
                        class="bg-white border dark:bg-slate-600 border-gray-200 shadow-sm p-4 rounded-lg flex flex-col items-center"
                    >
                        <p class="font-bold text-sm">12hrs:</p>
                        <p class="text-green-600 font-semibold">
                            ₱{{ room.price["12 Hours"] }}
                        </p>
                    </div>
                    <div
                        class="bg-white border dark:bg-slate-600 border-gray-200 shadow-sm p-4 rounded-lg flex flex-col items-center"
                    >
                        <p class="font-bold text-sm">24hrs:</p>
                        <p class="text-green-600 font-semibold">
                            ₱{{ room.price["24 Hours"] }}
                        </p>
                    </div>
                </div>

                <!-- Button Actions -->
                <div class="flex gap-4 mt-4">
                    <!-- Details Button -->
                    <Button
                        label="Details"
                        icon="pi pi-info-circle"
                        class="p-button-primary w-full"
                        @click="openDetailsDialog(room)"
                    />

                    <Button
                        v-if="room.status === 'Available'"
                        label="Check In"
                        icon="pi pi-check"
                        class="p-button-primary w-full"
                        @click="processCheckIn(room)"
                    />
                </div>
            </div>
        </div>

        <!-- Room Details Dialog -->
        <Dialog
            v-model:visible="isDetailsDialogVisible"
            :modal="true"
            :dismissable-mask="true"
            :header="selectedRoom?.name || 'Room Details'"
            :style="{ width: '30vw' }"
        >
            <div v-if="selectedRoom">
                <h3 class="text-lg font-bold">{{ selectedRoom.name }}</h3>
                <p class="text-sm">{{ selectedRoom.description }}</p>
                <div class="mt-4">
                    <h4 class="font-semibold">Room Details</h4>
                    <p>Type: {{ selectedRoom.type }}</p>
                    <p>Floor: {{ selectedRoom.floor }}</p>
                </div>
                <div class="mt-4">
                    <h4 class="font-semibold">Rates</h4>
                    <p>
                        6 Hours:
                        {{ formatPrice(selectedRoom.price["6 Hours"]) }}
                    </p>
                    <p>
                        12 Hours:
                        {{ formatPrice(selectedRoom.price["12 Hours"]) }}
                    </p>
                    <p>
                        24 Hours:
                        {{ formatPrice(selectedRoom.price["24 Hours"]) }}
                    </p>
                </div>
                <div v-if="selectedRoom.status === 'Occupied'" class="mt-4">
                    <h4 class="font-semibold">Current Booking</h4>
                    <p>Guest Name: {{ selectedRoom.guest?.name || "N/A" }}</p>
                    <p>Check-In: {{ selectedRoom.guest?.checkIn || "N/A" }}</p>
                    <p>
                        Check-Out: {{ selectedRoom.guest?.checkOut || "N/A" }}
                    </p>
                </div>
            </div>
        </Dialog>
    </div>
</template>
