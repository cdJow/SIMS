<script setup>
import { computed, ref } from "vue";

// Room details with prices for 6, 12, and 24 hours
const rooms = ref([
    {
        id: 1,
        name: "Cozy Single Room",
        type: "Single Size",
        status: "AVAILABLE",
        price6: 100,
        price12: 180,
        price24: 300,
        image: "https://via.placeholder.com/300x200.png?text=Single+Room",
        description: "Perfect for solo travelers with a comfortable bed.",
        occupancy: "1 person",
    },
    {
        id: 2,
        name: "Luxury Double Room",
        type: "Double Size",
        status: "AVAILABLE",
        price6: 150,
        price12: 280,
        price24: 400,
        image: "https://via.placeholder.com/300x200.png?text=Double+Room",
        description: "Spacious room for two guests with elegant decor.",
        occupancy: "2 persons",
    },
    {
        id: 3,
        name: "Queen Comfort Room",
        type: "Queen Size",
        status: "AVAILABLE",
        price6: 200,
        price12: 350,
        price24: 500,
        image: "https://via.placeholder.com/300x200.png?text=Queen+Room",
        description: "Ideal for couples with a large queen-size bed.",
        occupancy: "2 persons",
    },
    {
        id: 4,
        name: "Elegant Double Room",
        type: "Double Size",
        status: "AVAILABLE",
        price6: 160,
        price12: 300,
        price24: 450,
        image: "https://via.placeholder.com/300x200.png?text=Double+Room",
        description:
            "A stylish room for two guests, offering comfort and luxury.",
        occupancy: "2 persons",
    },
    {
        id: 5,
        name: "Premium Queen Room",
        type: "Queen Size",
        status: "AVAILABLE",
        price6: 220,
        price12: 400,
        price24: 600,
        image: "https://via.placeholder.com/300x200.png?text=Premium+Queen+Room",
        description:
            "Luxurious space with a queen-size bed and modern amenities.",
        occupancy: "2 persons",
    },
]);

const searchQuery = ref("");
const layout = ref("list");
const showBookingForm = ref(false);
const showBookingSummary = ref(false); // To show the booking summary
const selectedRoom = ref(null);

const form = ref({
    customerName: "",
    cellphone: "",
    email: "",
    hoursOfStay: "",
    confirmation: false,
    bookingCode: "", // Stores the generated booking code
});

// Generate a unique booking code
function generateBookingCode() {
    return `BOOK-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
}

// Filter rooms and bookings based on the search query
const filteredRooms = computed(() => {
    const query = searchQuery.value.toLowerCase();
    return rooms.value.filter(
        (room) =>
            room.status === "AVAILABLE" &&
            (room.name.toLowerCase().includes(query) ||
                room.type.toLowerCase().includes(query) ||
                room.price6.toString().includes(query))
    );
});

function selectHours(hours) {
    form.value.hoursOfStay = hours;
}

function handleBooking() {
    if (!form.value.hoursOfStay) {
        alert("Please select hours of stay.");
        return;
    }
    if (!form.value.confirmation) {
        alert("Please confirm your details.");
        return;
    }

    // Mark the selected room as BOOKED
    if (selectedRoom.value) {
        const roomIndex = rooms.value.findIndex(
            (r) => r.id === selectedRoom.value.id
        );
        if (roomIndex !== -1) {
            rooms.value[roomIndex].status = "BOOKED";
        }
    }

    // Show the booking summary
    showBookingForm.value = false;
    showBookingSummary.value = true;

    // Reset form values
    form.value.confirmation = false;
}

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

function bookRoom(room) {
    selectedRoom.value = room;
    form.value.bookingCode = generateBookingCode(); // Generate booking code
    showBookingForm.value = true;
}

function calculatePrice() {
    switch (form.value.hoursOfStay) {
        case "6":
            return selectedRoom.value.price6;
        case "12":
            return selectedRoom.value.price12;
        case "24":
            return selectedRoom.value.price24;
        default:
            return 0;
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

        <!-- Rooms List-->
        <div class="mb-4 mt-4">
            <DataView :value="filteredRooms" :layout="layout">
                <!-- List View -->
                <template #list="slotProps">
                    <div
                        v-for="room in slotProps.items"
                        :key="room.id"
                        class="p-4 border rounded mb-4 shadow mb-9"
                    >
                        <div class="flex flex-col md:flex-row gap-4">
                            <div class="md:w-40">
                                <img
                                    :src="room.image"
                                    alt="Room Image"
                                    class="rounded w-full h-32 object-cover"
                                />
                            </div>
                            <div class="flex-1">
                                <div class="text-xl font-bold">
                                    {{ room.name }}
                                </div>
                                <div class="text-sm text-gray-600">
                                    {{ room.type }}
                                </div>
                                <Tag
                                    :value="room.status"
                                    :severity="getRoomTagColor(room.status)"
                                    class="mt-2"
                                ></Tag>
                            </div>
                            <div
                                class="flex flex-col items-end justify-between"
                            >
                                <div class="text-2xl font-bold">
                                    ₱{{ room.price6 }} / 6 Hours
                                </div>
                                <Button
                                    label="Book Now"
                                    class="bg-red-500 text-white px-4 py-2 rounded mt-4 hover:bg-red-600"
                                    @click="bookRoom(room)"
                                ></Button>
                            </div>
                        </div>
                    </div>
                </template>
            </DataView>
        </div>

        <!-- Booking Form Modal -->
        <Dialog
            v-model:visible="showBookingForm"
            header="Book Your Stay"
            :modal="true"
            :closable="false"
            style="width: 95vw; max-width: 1200px"
        >
            <!-- Room Details -->
            <div class="mb-4 border rounded p-5 bg-gray-50">
                <h3 class="font-bold text-lg">{{ selectedRoom?.name }}</h3>
                <p class="text-sm text-gray-600">{{ selectedRoom?.type }}</p>
                <p class="text-gray-700 mt-2">
                    {{ selectedRoom?.description }}
                </p>
                <div class="flex items-center mt-2 text-gray-600">
                    <i class="pi pi-user mr-2"></i>
                    <span>Occupancy: {{ selectedRoom?.occupancy }}</span>
                </div>
            </div>

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
                    <label class="block mb-2 font-medium"
                        >Cellphone Number</label
                    >
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
                    <div class="border rounded-lg p-4 bg-gray-100">
                        <div class="grid grid-cols-3 gap-4 text-center">
                            <div
                                v-for="option in [
                                    {
                                        value: '6',
                                        label: '6hrs:',
                                        price: selectedRoom?.price6 || 0,
                                    },
                                    {
                                        value: '12',
                                        label: '12hrs:',
                                        price: selectedRoom?.price12 || 0,
                                    },
                                    {
                                        value: '24',
                                        label: '24hrs:',
                                        price: selectedRoom?.price24 || 0,
                                    },
                                ]"
                                :key="option.value"
                            >
                                <p class="text-lg font-bold">
                                    {{ option.label }}
                                </p>
                                <p class="text-md text-gray-600">
                                    ₱{{ option.price.toFixed(2) }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Select Buttons -->
                <div class="grid grid-cols-3 gap-4 mt-4 mb-4">
                    <button
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
                        type="button"
                        @click="selectHours(option.value)"
                        :class="[
                            'px-4 py-2 rounded-lg font-medium',
                            form.hoursOfStay === option.value
                                ? 'bg-[#1E905F] text-white'
                                : 'bg-[#2DCE89] text-white hover:bg-[#1E905F]',
                        ]"
                    >
                        Select
                    </button>
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
                        Book
                    </button>
                    <button
                        type="button"
                        class="flex-1 bg-[#2DCE89] text-white px-4 py-2 rounded hover:bg-[#138A4E]"
                        @click="showBookingForm = false"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </Dialog>

        <!-- Booking Summary Modal -->
        <Dialog
            v-model:visible="showBookingSummary"
            header="Booking Summary"
            :modal="true"
            :closable="false"
        >
            <div class="text-center p-4">
                <p class="text-red-600 font-bold text-lg mb-4">
                    Take a Screenshot and Show it to the Counter
                </p>
                <div
                    class="mt-4 p-4 border border-yellow-500 rounded bg-yellow-100 text-yellow-700 mb-4"
                >
                    <strong>Notice:</strong> You must check in within 30
                    minutes, or your booking will be automatically canceled.
                </div>

                <div class="border rounded p-4 bg-gray-100 mb-4">
                    <h3 class="font-bold text-xl">{{ selectedRoom?.name }}</h3>
                    <p>{{ selectedRoom?.type }}</p>
                    <p>Selected Duration: {{ form.hoursOfStay }} Hours</p>
                    <p>Total Price: ₱{{ calculatePrice() }}</p>
                </div>
                <div class="border rounded p-4 bg-gray-100 mb-4">
                    <h4 class="font-bold text-lg mb-2">Details</h4>
                    <p>Name: {{ form.customerName }}</p>
                    <p>Email: {{ form.email }}</p>
                    <p>Phone: {{ form.cellphone }}</p>
                </div>
                <div class="border rounded p-4 bg-gray-100 mb-4">
                    <h4 class="font-bold text-lg mb-2">Code</h4>
                    <p
                        class="text-3xl font-bold text-blue-600 bg-yellow-100 p-4 rounded shadow"
                    >
                        {{ form.bookingCode }}
                    </p>
                </div>
                <Button
                    label="Close"
                    class="mt-4 bg-blue-600 text-white"
                    @click="showBookingSummary = false"
                />
            </div>
        </Dialog>
    </div>
</template>
