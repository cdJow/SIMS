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
const showBookingForm = ref(false);
const showPendingModal = ref(false); // Modal to display pending status
const selectedRoom = ref(null);

const form = ref({
    customerName: "",
    cellphone: "",
    email: "",
    hoursOfStay: "",
    confirmation: false,
});

// Filter rooms to show only available rooms that match the search query
const filteredRooms = computed(() => {
    const query = searchQuery.value.toLowerCase();
    return rooms.value.filter(
        (room) =>
            room.status === "AVAILABLE" &&
            (room.name.toLowerCase().includes(query) ||
                room.type.toLowerCase().includes(query))
    );
});

// Select hours of stay
function selectHours(hours) {
    form.value.hoursOfStay = hours;
}

// Handle booking
function handleBooking() {
    if (!form.value.hoursOfStay) {
        alert("Please select hours of stay.");
        return;
    }
    if (!form.value.confirmation) {
        alert("Please confirm your details.");
        return;
    }

    // Update the selected room status to "Pending"
    const roomIndex = rooms.value.findIndex(
        (r) => r.id === selectedRoom.value.id
    );
    if (roomIndex !== -1) {
        rooms.value[roomIndex].status = "PENDING";
    }

    // Close the booking form and show the pending modal
    showBookingForm.value = false;
    showPendingModal.value = true;

    // Reset form values
    form.value.confirmation = false;
    form.value.customerName = "";
    form.value.cellphone = "";
    form.value.email = "";
    form.value.hoursOfStay = "";
}

// Get room tag color based on status
function getRoomTagColor(status) {
    switch (status) {
        case "AVAILABLE":
            return "success";
        case "PENDING":
            return "warning";
        case "BOOKED":
            return "danger";
        default:
            return null;
    }
}

// Open booking form
function bookRoom(room) {
    selectedRoom.value = room;
    showBookingForm.value = true;
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

                <!-- Book Button -->
                <button
                    class="bg-[#2DCE89] text-white px-4 py-2 rounded-lg w-full hover:bg-[#138A4E] font-medium"
                    @click="bookRoom(room)"
                >
                    Book
                </button>
            </div>
        </div>
    </div>

    <!-- Booking Form Modal -->
    <Dialog
        v-model:visible="showBookingForm"
        header="Check In"
        :modal="true"
        style="width: 95vw; max-width: 600px; overflow: hidden"
        class="relative"
    >
        <!-- Room Details -->
        <div class="mb-4 border rounded p-5 bg-gray-50">
            <h3 class="font-bold text-lg">{{ selectedRoom?.name }}</h3>
            <p class="text-sm text-gray-600">{{ selectedRoom?.type }}</p>
            <p class="text-gray-700 mt-2">{{ selectedRoom?.description }}</p>
            <div class="flex items-center mt-2 text-gray-600">
                <i class="pi pi-user mr-2"></i>
                <span>Occupancy: {{ selectedRoom?.occupancy }}</span>
            </div>
        </div>

        <!-- Booking Form -->
        <form @submit.prevent="handleBooking">
            <!-- Customer Name -->
            <div class="mb-4">
                <label class="block mb-2 font-medium">Customer Name</label>
                <input
                    type="text"
                    v-model="form.customerName"
                    class="w-full px-4 py-2 border rounded focus:outline-none"
                    placeholder="Enter your name"
                    required
                />
            </div>

            <!-- Cellphone Number -->
            <div class="mb-4">
                <label class="block mb-2 font-medium">Cellphone Number</label>
                <input
                    type="tel"
                    v-model="form.cellphone"
                    class="w-full px-4 py-2 border rounded focus:outline-none"
                    placeholder="Enter your cellphone number"
                    required
                    @input="
                        form.cellphone = form.cellphone
                            .replace(/[^0-9]/g, '')
                            .slice(0, 11)
                    "
                />
            </div>

            <!-- Email Address -->
            <div class="mb-4">
                <label class="block mb-2 font-medium">Email Address</label>
                <input
                    type="email"
                    v-model="form.email"
                    class="w-full px-4 py-2 border rounded focus:outline-none"
                    placeholder="Enter your email address"
                    required
                />
            </div>

            <!-- Hours of Stay -->
            <div class="mb-4">
                <label class="block mb-2 font-medium">Hours of Stay</label>
                <div class="grid grid-cols-3 gap-4">
                    <div
                        v-for="option in [
                            {
                                value: '6',
                                label: '6hrs',
                                price: selectedRoom?.price6 || 0,
                            },
                            {
                                value: '12',
                                label: '12hrs',
                                price: selectedRoom?.price12 || 0,
                            },
                            {
                                value: '24',
                                label: '24hrs',
                                price: selectedRoom?.price24 || 0,
                            },
                        ]"
                        :key="option.value"
                        class="p-4 border rounded-lg shadow-md text-center cursor-pointer hover:bg-green-50 transition"
                        :class="
                            form.hoursOfStay === option.value
                                ? 'bg-green-100 border-green-500'
                                : ''
                        "
                        @click="selectHours(option.value)"
                    >
                        <p class="text-lg font-bold text-green-600">
                            {{ option.label }}
                        </p>
                        <p class="text-md font-medium text-green-600">
                            ₱{{ option.price.toFixed(2) }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Confirmation Checkbox -->
            <div class="mb-4">
                <label>
                    <input
                        type="checkbox"
                        v-model="form.confirmation"
                        class="mr-2"
                    />
                    I confirm that the provided details are correct.
                </label>
            </div>

            <!-- Submit and Cancel Buttons -->
            <div class="flex justify-between gap-4 mt-4">
                <button
                    type="submit"
                    class="flex-1 bg-[#2DCE89] text-white px-4 py-2 rounded hover:bg-[#138A4E]"
                    :disabled="!form.confirmation || !form.hoursOfStay"
                >
                    Confirm
                </button>
                <button
                    type="button"
                    class="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    @click="showBookingForm = false"
                >
                    Cancel
                </button>
            </div>
        </form>
    </Dialog>
</template>
