<script setup>
import { computed, ref } from "vue";

// Room details with prices for 6, 12, and 24 hours
const rooms = ref([
    {
        id: 1,
        name: "101",
        type: "Single Size",
        status: "AVAILABLE",
        price6: 100,
        price12: 180,
        price24: 300,
        image: "https://via.placeholder.com/300x200.png?text=Single+Room",
        description: "Perfect for solo travelers with a comfortable bed.",
        occupancy: "1 person",
        floor: "1st Floor",
    },
    {
        id: 2,
        name: "102",
        type: "Double Size",
        status: "AVAILABLE",
        price6: 150,
        price12: 280,
        price24: 400,
        image: "https://via.placeholder.com/300x200.png?text=Double+Room",
        description: "Spacious room for two guests with elegant decor.",
        occupancy: "2 persons",
        floor: "2nd Floor",
    },
    {
        id: 3,
        name: "103",
        type: "Queen Size",
        status: "AVAILABLE",
        price6: 200,
        price12: 350,
        price24: 500,
        image: "https://via.placeholder.com/300x200.png?text=Queen+Room",
        description: "Ideal for couples with a large queen-size bed.",
        occupancy: "2 persons",
        floor: "3rd Floor",
    },
    {
        id: 4,
        name: "205",
        type: "Double Size",
        status: "AVAILABLE",
        price6: 160,
        price12: 300,
        price24: 450,
        image: "https://via.placeholder.com/300x200.png?text=Double+Room",
        description:
            "A stylish room for two guests, offering comfort and luxury.",
        occupancy: "2 persons",
        floor: "2nd Floor",
    },
    {
        id: 5,
        name: "204",
        type: "Queen Size",
        status: "AVAILABLE",
        price6: 220,
        price12: 400,
        price24: 600,
        image: "https://via.placeholder.com/300x200.png?text=Premium+Queen+Room",
        description:
            "Luxurious space with a queen-size bed and modern amenities.",
        occupancy: "2 persons",
        floor: "3rd Floor",
    },
]);

const searchQuery = ref("");

// Filter rooms and bookings based on the search query
const filteredRooms = computed(() => {
    const query = searchQuery.value.toLowerCase();
    return rooms.value.filter(
        (room) =>
            room.status === "AVAILABLE" &&
            (room.name.toLowerCase().includes(query) ||
                room.type.toLowerCase().includes(query) ||
                room.price6.toString().includes(query) ||
                room.price12.toString().includes(query) ||
                room.price24.toString().includes(query))
    );
});

function getRoomTagColor(status) {
    switch (status) {
        case "AVAILABLE":
            return "success";
        case "BOOKED":
            return "warning";
        case "MAINTENANCE":
            return "danger";
        default:
            return null;
    }
}
</script>
<template>
    <div class="p-4">
        <!-- Search and Layout Options -->
        <div
            class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 w-full max-w-3xl center mx-auto"
        >
            <input
                v-model="searchQuery"
                type="text"
                placeholder="Search"
                class="border border-gray-300 rounded px-4 py-2 w-full sm:max-w-md"
            />
        </div>

        <!-- Rooms List -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
                v-for="room in filteredRooms"
                :key="room.id"
                class="border rounded-lg shadow-md p-4"
            >
                <!-- Room Image and Status -->
                <div class="relative mb-4">
                    <img
                        :src="room.image"
                        alt="Room Image"
                        class="rounded-md w-full h-48 object-cover"
                    />
                    <Tag
                        :value="room.status"
                        :severity="getRoomTagColor(room.status)"
                        class="absolute top-2 left-2"
                    ></Tag>
                </div>

                <!-- Room Details -->
                <div class="mb-4">
                    <div class="text-lg font-bold">{{ room.name }}</div>
                    <div class="text-sm text-gray-600">{{ room.type }}</div>
                    <p class="text-sm text-gray-500">{{ room.description }}</p>
                    <div class="text-sm text-gray-600 mt-2">
                        <i class="pi pi-user"></i> Occupancy:
                        {{ room.occupancy }}
                    </div>
                    <div class="text-sm text-gray-600">
                        Floor: {{ room.floor }}
                    </div>
                </div>

                <!-- Pricing -->
                <div class="grid grid-cols-3 gap-4 text-center mb-4">
                    <div class="p-2 border rounded-md">
                        <p class="text-sm font-semibold">6hrs:</p>
                        <p class="text-green-600 font-bold">
                            ₱{{ room.price6 }}
                        </p>
                    </div>
                    <div class="p-2 border rounded-md">
                        <p class="text-sm font-semibold">12hrs:</p>
                        <p class="text-green-600 font-bold">
                            ₱{{ room.price12 }}
                        </p>
                    </div>
                    <div class="p-2 border rounded-md">
                        <p class="text-sm font-semibold">24hrs:</p>
                        <p class="text-green-600 font-bold">
                            ₱{{ room.price24 }}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
