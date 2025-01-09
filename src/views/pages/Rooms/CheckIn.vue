<script>
export default {
    data() {
        return {
            rooms: [
                {
                    id: 1,
                    name: "101",
                    type: "Single",
                    price: 100,
                    status: "Available",
                },
                {
                    id: 2,
                    name: "102",
                    type: "Double",
                    price: 150,
                    status: "Occupied",
                },
            ],
            walkInGuest: {
                name: "",
                id: "",
                contact: "",
            },
            bookingSearch: "",
            booking: null,
            searchError: null,
        };
    },
    methods: {
        selectRoom(room) {
            if (room.status === "Occupied") {
                alert("Room is already occupied.");
                return;
            }
            alert(`Room ${room.name} selected for check-in.`);
        },
        submitWalkInCheckIn() {
            if (
                !this.walkInGuest.name ||
                !this.walkInGuest.id ||
                !this.walkInGuest.contact
            ) {
                alert("Please fill in all guest details.");
                return;
            }
            alert("Walk-in check-in completed!");
            this.resetWalkInForm();
        },
        resetWalkInForm() {
            this.walkInGuest = { name: "", id: "", contact: "" };
        },
        searchBooking() {
            if (this.bookingSearch === "John Doe") {
                this.booking = {
                    guestName: "John Doe",
                    roomName: "103",
                    paymentStatus: "Paid",
                };
                this.searchError = null;
            } else {
                this.searchError = "Booking not found.";
                this.booking = null;
            }
        },
        confirmPreBookedCheckIn() {
            alert(`Pre-booked guest ${this.booking.guestName} checked in!`);
            this.booking = null;
            this.bookingSearch = "";
        },
    },
};
</script>

<template>
    <div class="p-6 bg-gray-100 min-h-screen">
        <h1 class="text-2xl font-bold mb-4">Guest Check-In</h1>

        <!-- Tabs for Walk-In and Pre-Booked -->
        <TabView>
            <TabPanel header="Walk-In Guest">
                <div class="p-4 bg-white shadow-md rounded-lg">
                    <!-- Room Availability -->
                    <h2 class="text-lg font-semibold mb-2">
                        Room Availability
                    </h2>
                    <div v-if="rooms.length">
                        <ul class="space-y-2">
                            <li
                                v-for="room in rooms"
                                :key="room.id"
                                class="p-3 border rounded hover:bg-gray-50 cursor-pointer"
                                @click="selectRoom(room)"
                            >
                                <p>
                                    <strong>Room:</strong> {{ room.name }} ({{
                                        room.type
                                    }})
                                </p>
                                <p>
                                    <strong>Price:</strong> ${{
                                        room.price
                                    }}/night
                                </p>
                                <p>
                                    <strong>Status:</strong>
                                    <span
                                        :class="
                                            room.status === 'Available'
                                                ? 'text-green-500'
                                                : 'text-red-500'
                                        "
                                        >{{ room.status }}</span
                                    >
                                </p>
                            </li>
                        </ul>
                    </div>
                    <div v-else>
                        <p class="text-red-500">No rooms available</p>
                    </div>

                    <!-- Guest Details Form -->
                    <h2 class="text-lg font-semibold mt-4">
                        Guest Information
                    </h2>
                    <form @submit.prevent="submitWalkInCheckIn">
                        <div class="space-y-4">
                            <div>
                                <label
                                    for="walkInGuestName"
                                    class="block font-medium"
                                    >Name</label
                                >
                                <input
                                    type="text"
                                    id="walkInGuestName"
                                    v-model="walkInGuest.name"
                                    class="input"
                                    required
                                />
                            </div>
                            <div>
                                <label
                                    for="walkInGuestID"
                                    class="block font-medium"
                                    >ID</label
                                >
                                <input
                                    type="text"
                                    id="walkInGuestID"
                                    v-model="walkInGuest.id"
                                    class="input"
                                    required
                                />
                            </div>
                            <div>
                                <label
                                    for="walkInContact"
                                    class="block font-medium"
                                    >Contact</label
                                >
                                <input
                                    type="text"
                                    id="walkInContact"
                                    v-model="walkInGuest.contact"
                                    class="input"
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary mt-4">
                            Check-In
                        </button>
                    </form>
                </div>
            </TabPanel>
            <TabPanel header="Pre-Booked Guest">
                <div class="p-4 bg-white shadow-md rounded-lg">
                    <!-- Search Booking -->
                    <h2 class="text-lg font-semibold mb-2">Find Reservation</h2>
                    <form @submit.prevent="searchBooking">
                        <div class="flex items-center space-x-4">
                            <input
                                type="text"
                                v-model="bookingSearch"
                                placeholder="Enter booking code or name"
                                class="input w-full"
                                required
                            />
                            <button type="submit" class="btn btn-secondary">
                                Search
                            </button>
                        </div>
                    </form>

                    <!-- Booking Details -->
                    <div v-if="booking" class="mt-4">
                        <h3 class="text-lg font-bold">Reservation Details</h3>
                        <p><strong>Name:</strong> {{ booking.guestName }}</p>
                        <p><strong>Room:</strong> {{ booking.roomName }}</p>
                        <p>
                            <strong>Status:</strong> {{ booking.paymentStatus }}
                        </p>

                        <button
                            @click="confirmPreBookedCheckIn"
                            class="btn btn-primary mt-4"
                        >
                            Check-In
                        </button>
                    </div>
                    <div v-else-if="searchError" class="mt-4 text-red-500">
                        {{ searchError }}
                    </div>
                </div>
            </TabPanel>
        </TabView>
    </div>
</template>

<style scoped>
.input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
}

.btn {
    padding: 0.5rem 1rem;
    font-weight: 600;
    border-radius: 0.25rem;
}

.btn-primary {
    background-color: #2563eb;
    color: #fff;
}

.btn-secondary {
    background-color: #9ca3af;
    color: #fff;
}
</style>
