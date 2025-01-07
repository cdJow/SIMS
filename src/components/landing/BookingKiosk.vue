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
    },
]);

const searchQuery = ref("");
const layout = ref("list");
const options = ref(["list", "grid"]);
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

function handleBooking() {
    if (selectedRoom.value) {
        // Update room status to BOOKED
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

    // Reset form values except selected room
    form.value.confirmation = false;
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
    <div class="p-4 flex flex-col items-center">
        <!-- Search and Layout Options -->
        <div
            class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 w-full max-w-3xl"
        >
            <input
                v-model="searchQuery"
                type="text"
                placeholder="Search"
                class="border border-gray-300 rounded px-4 py-2 w-full sm:max-w-md"
            />
            <SelectButton
                v-model="layout"
                :options="options"
                :allowEmpty="false"
            >
                <template #option="{ option }">
                    <i
                        :class="[
                            option === 'list' ? 'pi pi-bars' : 'pi pi-table',
                        ]"
                    />
                </template>
            </SelectButton>
        </div>

        <!-- Rooms List/Grid -->
        <div class="card w-full max-w-5xl">
            <DataView :value="filteredRooms" :layout="layout">
                <!-- List View -->
                <template #list="slotProps">
                    <div
                        v-for="room in slotProps.items"
                        :key="room.id"
                        class="p-4 border rounded mb-4 shadow"
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
                <!-- Grid View -->
                <template #grid="slotProps">
                    <div
                        v-for="room in slotProps.items"
                        :key="room.id"
                        class="p-4 border rounded shadow flex flex-col items-center text-center"
                    >
                        <img
                            :src="room.image"
                            alt="Room Image"
                            class="rounded w-full h-32 object-cover mb-4"
                        />
                        <div class="text-xl font-bold">{{ room.name }}</div>
                        <div class="text-sm text-gray-600 mb-2">
                            {{ room.type }}
                        </div>
                        <Tag
                            :value="room.status"
                            :severity="getRoomTagColor(room.status)"
                            class="mb-2"
                        ></Tag>
                        <div class="text-2xl font-bold mb-4">
                            ₱{{ room.price6 }} / 6 Hours
                        </div>
                        <Button
                            label="Book Now"
                            class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                            @click="bookRoom(room)"
                        ></Button>
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
        >
            <!-- Room Details -->
            <div class="mb-4 border rounded p-4 bg-gray-50">
                <h3 class="font-bold text-lg">{{ selectedRoom?.name }}</h3>
                <p class="text-sm text-gray-600">{{ selectedRoom?.type }}</p>
            </div>
            <form @submit.prevent="handleBooking">
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
                    />
                </div>
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

                <div class="mb-4">
                    <label class="block mb-2 font-medium">Hours of Stay</label>
                    <div class="grid grid-cols-3 gap-4">
                        <div
                            v-for="option in [
                                {
                                    value: '6',
                                    label: '6 Hours',
                                    price: selectedRoom?.price6 || 0,
                                },
                                {
                                    value: '12',
                                    label: '12 Hours',
                                    price: selectedRoom?.price12 || 0,
                                },
                                {
                                    value: '24',
                                    label: '24 Hours',
                                    price: selectedRoom?.price24 || 0,
                                },
                            ]"
                            :key="option.value"
                            @click="form.hoursOfStay = option.value"
                            :class="[
                                'border rounded-lg text-center cursor-pointer flex flex-col items-center justify-center gap-2 transition-all',
                                form.hoursOfStay === option.value
                                    ? 'bg-[#E74C48] text-white border-[#E74C48]'
                                    : 'bg-[#FDECEC] text-[#E74C48] hover:bg-[#F7A1A0] hover:border-[#E74C48]',
                            ]"
                            style="width: 100px; height: 100px"
                        >
                            <p class="text-xl font-bold">{{ option.label }}</p>
                            <p class="text-md font-medium">
                                ₱{{ option.price }}
                            </p>
                        </div>
                    </div>
                </div>

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
                <div class="flex justify-between gap-4 mt-4">
                    <Button
                        type="submit"
                        label="Book"
                        class="flex-1 bg-blue-600 text-white"
                        :disabled="!form.confirmation"
                    />
                    <Button
                        type="button"
                        label="Cancel"
                        class="flex-1 bg-gray-400 text-white"
                        @click="showBookingForm = false"
                    />
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
