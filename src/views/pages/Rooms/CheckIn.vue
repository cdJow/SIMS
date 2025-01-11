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
        status: "Available",
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
        status: "Available",
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
        status: "Available", // New cleaning status
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
    filtered = filtered.filter((room) => room.status === "Available");

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

// Helper Functions
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
        <div class="p-6 min-h-screen">
            <!-- Room Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div
                    v-for="room in filteredRooms"
                    :key="room.id"
                    :class="[
                        'flex items-center justify-center p-6 rounded-lg shadow-lg text-white font-bold text-2xl',
                        room.status === 'Available'
                            ? 'bg-green-500'
                            : 'bg-gray-400',
                    ]"
                >
                    Room {{ room.roomNumber }}
                </div>
            </div>
        </div>
    </div>
</template>
