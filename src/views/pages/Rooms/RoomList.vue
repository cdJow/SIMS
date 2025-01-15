<script setup>
import { useToast } from "primevue/usetoast";
import { computed, ref } from "vue";

const rooms = ref([
    {
        id: 1,
        roomNumber: "101",
        floor: "1st Floor",
        image: "https://via.placeholder.com/300",
        name: "Room 101",
        type: "Double Size Bed",
        description: "Perfect for two guests with additional space.",
        status: "Available",
        rate: {
            "6 Hours": 50,
            "12 Hours": 80,
            "24 Hours": 120,
        },
        cleaningStatus: "Clean",
        guestDetails: {
            guestName: null,
            cellphone: null,
            selectedHours: null,
            checkIn: null,
            checkOut: null,
        },
    },
    {
        id: 2,
        roomNumber: "102",
        floor: "1st Floor",
        image: "https://via.placeholder.com/300",
        name: "Room 102",
        type: "Single Size Bed",
        description: "A cozy room for a single guest.",
        status: "Occupied",
        rate: {
            "6 Hours": 30,
            "12 Hours": 50,
            "24 Hours": 90,
        },
        cleaningStatus: "Clean",
        guestDetails: {
            guestName: "John Doe",
            cellphone: "123-456-7890",
            selectedHours: 24,
            checkIn: "2025-01-06 14:00",
            checkOut: "2025-01-07 14:00",
        },
    },
    {
        id: 3,
        roomNumber: "103",
        floor: "2nd Floor",
        image: "https://via.placeholder.com/300",
        name: "Room 103",
        type: "King Size Bed",
        description: "A luxurious suite for families or groups.",
        status: "Available",
        rate: {
            "6 Hours": 100,
            "12 Hours": 150,
            "24 Hours": 250,
        },
        cleaningStatus: "Needs Cleaning",
        guestDetails: {
            guestName: null,
            cellphone: null,
            selectedHours: null,
            checkIn: null,
            checkOut: null,
        },
    },
    {
        id: 4,
        roomNumber: "104",
        floor: "2nd Floor",
        image: "https://via.placeholder.com/300",
        name: "Room 104",
        type: "King Size Bed",
        description: "A luxurious suite for families or groups.",
        status: "Cleaning",
        rate: {
            "6 Hours": 100,
            "12 Hours": 150,
            "24 Hours": 250,
        },
        cleaningStatus: "Needs Cleaning",
        guestDetails: {
            guestName: null,
            cellphone: null,
            selectedHours: null,
            checkIn: null,
            checkOut: null,
        },
    },
    {
        id: 5,
        roomNumber: "105",
        floor: "2nd Floor",
        image: "https://via.placeholder.com/300",
        name: "Room 105",
        type: "Double Size Bed",
        description: "Spacious room perfect for couples.",
        status: "Booked",
        rate: {
            "6 Hours": 60,
            "12 Hours": 100,
            "24 Hours": 140,
        },
        cleaningStatus: "In Progress",
        guestDetails: {
            guestName: "Jane Smith",
            cellphone: "987-654-3210",
            selectedHours: 12,
            checkIn: "2025-01-06 10:00",
            checkOut: "2025-01-06 22:00",
        },
    },
]);

// Filters and Sorting
const selectedFilter = ref({
    roomType: null,
    status: null,
    cleaningStatus: null,
});

const selectedRoom = ref({
    id: 1,
    roomNumber: "",
    status: "Available", // "Available", "Booked", or other states
    guestName: null, // Null until a guest is assigned
    cellphone: null, // Null until a phone number is provided
    selectedHours: null, // Selected duration (e.g., "6 Hours")
    selectedrate: null, // Rate corresponding to selected hours
});

const sortBy = ref(null);

// Dropdown Options
const roomTypes = ref(["Single", "Double", "Suite"]);
const sortOptions = ref(["Room Number", "Type", "Status"]);
const cancelDialogVisible = ref(false); // Tracks visibility of the dialog

function selectHours(hours) {
    BookingDetails.value.selectedHours = hours; // Update selected hours
    const rate = selectedRoom.value?.rate[hours]; // Get the corresponding rate
    BookingDetails.value.selectedrate = rate ? rate : null; // Set rate if valid, otherwise null
}

// Filtered Rooms
function getFilteredRooms() {
    return computed(() => {
        if (!rooms.value || rooms.value.length === 0) {
            return [];
        }
        // Return the full room object
        return rooms.value;
    });
}
const filteredRooms = getFilteredRooms();
const toast = useToast();

const checkInDialogVisible = ref(false); // Controls the visibility of the dialog

// Derived data: Check-In and Check-Out dates

const checkInDate = computed(() => new Date()); // Check-in is always the current date/time
const checkOutDate = computed(() => {
    if (
        selectedRoom.value?.BookingDetails?.selectedHours &&
        checkInDate.value
    ) {
        const hours = Number(selectedRoom.value.BookingDetails.selectedHours);
        if (!isNaN(hours)) {
            const checkOut = new Date(checkInDate.value);
            checkOut.setHours(checkOut.getHours() + hours); // Add hours to check-in date
            return checkOut;
        }
    }
    return null;
});

// Function to open the dialog
function openCheckInDialog(room) {
    if (!room || !room.BookingDetails?.bookingCode) {
        console.error("Invalid room or booking details.");
        return;
    }
    selectedRoom.value = room; // Set the selected room
    checkInDialogVisible.value = true; // Show the dialog
}

// Function to confirm check-in
function confirmCheckIn(bookingCode) {
    const room = rooms.value.find(
        (r) => r.BookingDetails?.bookingCode === bookingCode,
    );

    if (room && room.status === "Booked") {
        // Check if checkOutDate.value is set
        if (!checkOutDate.value) {
            toast.add({
                severity: "error",
                summary: "Check-In Error",
                detail: "Please select a valid check-out date.",
                life: 3000,
            });
            return; // Exit the function if checkOutDate is not valid
        }

        // Update the room status to Checked-In
        room.status = "Occupied"; // Change status to Occupied
        room.BookingDetails.checkInDate = new Date().toISOString(); // Set check-in date
        room.BookingDetails.checkOutDate = checkOutDate.value.toISOString(); // Set check-out date

        // Update selectedRoom if it matches
        if (selectedRoom.value?.id === room.id) {
            selectedRoom.value = { ...room };
        }

        // Simulate API call to update room status
        updateRoomStatus(room.id, "Occupied", room.BookingDetails)
            .then(() => {
                // Close the dialog after successful API call
                checkInDialogVisible.value = false;

                // Show a success toast
                toast.add({
                    severity: "success",
                    summary: "Check-In Successful",
                    detail: `Guest for Room ${room.roomNumber} has been checked in.`,
                    life: 3000,
                });

                // Reset the dialog state if needed
                resetBookingDialog();
            })
            .catch((error) => {
                console.error("Error updating room status:", error);
                toast.add({
                    severity: "error",
                    summary: "Check-In Error",
                    detail: "Failed to update room status. Please try again.",
                    life: 3000,
                });
            });
    } else {
        // Close the dialog and show a failure toast
        checkInDialogVisible.value = false;
        toast.add({
            severity: "warn",
            summary: "Check-In Failed",
            detail: `No active booking found with the code ${bookingCode}.`,
            life: 3000,
        });

        // Reset the dialog state
        resetBookingDialog();
    }
}

// Helper function to reset booking dialog state
function resetBookingDialog() {
    // Reset any form fields or related data
    checkOutDate.value = null; // Reset check-out date
    selectedRoom.value = null; // Clear selected room
}

// State for dialog visibility and selected room

const DialogVisible = ref(false); // Controls visibility of the dialog

// Function to open the dialog
function openDialog(room) {
    selectedRoom.value = room; // Set the selected room
    DialogVisible.value = true; // Show the dialog
}

function closeBookingDialog() {
    BookingDialogVisible.value = false; // Hide the dialog
}

// Function to open the dialog
function openCancelDialog(room) {
    if (!room || !room.BookingDetails?.bookingCode) {
        console.error("No valid room or booking selected.");
        return;
    }
    selectedRoom.value = room; // Set the selected room for cancellation
    cancelDialogVisible.value = true; // Open the dialog
}

// Array to store canceled bookings (temporary storage for demonstration)
const canceledBookings = [];

// Function to cancel a booking
// Function to confirm and cancel the booking
function confirmAndCancelBooking(bookingCode) {
    const room = rooms.value.find(
        (r) => r.BookingDetails?.bookingCode === bookingCode,
    );

    if (room && room.status === "Booked") {
        // Get the cancellation timestamp
        const cancellationTimestamp = new Date().toISOString();

        // Add the canceled booking details to a canceledBookings array (or database)
        canceledBookings.push({
            roomId: room.id,
            roomNumber: room.roomNumber,
            guestName: room.BookingDetails.guestName,
            cellphone: room.BookingDetails.cellphone,
            bookingCode: room.BookingDetails.bookingCode,
            canceledAt: cancellationTimestamp,
        });

        // Reset the room details
        room.status = "Available";
        room.BookingDetails = null;

        // Update the selected room if it matches
        if (selectedRoom.value?.id === room.id) {
            selectedRoom.value = { ...room };
        }

        // Simulate an API call to update room status
        updateRoomStatus(room.id, "Available");

        // Close the dialog
        cancelDialogVisible.value = false;

        // Show a success toast
        toast.add({
            severity: "info",
            summary: "Booking Cancelled",
            detail: `The booking for Room ${room.roomNumber} has been successfully cancelled.`,
            life: 3000,
        });
    } else {
        // Close the dialog and show a failure toast
        cancelDialogVisible.value = false;
        toast.add({
            severity: "warn",
            summary: "Cancellation Failed",
            detail: `No active booking found with the code ${bookingCode}.`,
            life: 3000,
        });
    }
}

// Reactive state for dialog visibility
const BookingDialogVisible = ref(false); // Tracks visibility of the booking dialog

// Reactive booking details
const BookingDetails = ref({
    guestName: null,
    cellphone: null,
    selectedHours: null,
    selectedrate: null,
});

// Function to open the booking dialog
function openBookingDialog() {
    BookingDetails.value = {
        guestName: "",
        cellphone: "",
        selectedHours: null,
        selectedrate: null,
    };
    BookingDialogVisible.value = true;
}

// Function to update room status in the main rooms list
function updateRoomStatus(roomId, status, BookingDetails = null) {
    const room = rooms.value.find((r) => r.id === roomId);
    if (room) {
        room.status = status;

        // If bookingDetails are provided, update the room's booking information
        if (BookingDetails) {
            room.bookingDetails = {
                guestName: BookingDetails.guestName || "",
                cellphone: BookingDetails.cellphone || "",
                selectedHours: BookingDetails.selectedHours || 0,
                selectedrate: BookingDetails.selectedrate || 0,
                bookingTime: new Date().toLocaleString(), // Add a timestamp for reference
            };
        }
    }
}

// Function to handle booking submission
function submitBooking(BookingDetails) {
    const room = rooms.value.find((r) => r.id === selectedRoom.value.id);

    if (room) {
        // Generate timestamp and unique booking code
        const timestamp = new Date().toISOString();
        const uniqueBookingCode = `BK-${room.id}-${Date.now().toString(36).toUpperCase()}`;

        // Update room details
        room.status = "Booked";
        room.BookingDetails = {
            guestName: BookingDetails.guestName,
            cellphone: BookingDetails.cellphone,
            selectedHours: BookingDetails.selectedHours,
            selectedrate: BookingDetails.selectedrate,
            bookingCode: uniqueBookingCode,
            timestamp: timestamp,
        };

        // Update selectedRoom to reflect the updated room data
        selectedRoom.value = { ...room };

        // Simulate API call to update room status
        updateRoomStatus(selectedRoom.value.id, "Booked");

        // Show success toast notification
        toast.add({
            severity: "success",
            summary: "Booking Confirmed",
            detail: `Room ${room.roomNumber} booked successfully for ${room.BookingDetails.guestName}! Booking Code: ${uniqueBookingCode}`,
            life: 3000,
        });
    }

    // Close dialog and reset
    BookingDialogVisible.value = false;
}

// Computed property for form validation
const isFormValid = computed(() => {
    const { guestName, cellphone, selectedHours, selectedrate } =
        BookingDetails.value;
    return !!(guestName && cellphone && selectedHours && selectedrate);
});
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
        <div>
            <!-- Room Grid -->
            <div
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 justify-center"
            >
                <div
                    v-for="room in filteredRooms"
                    :key="room.id"
                    class="relative w-full p-6 rounded-lg shadow-md border cursor-pointer hover:shadow-lg transition-shadow text-white"
                    :class="{
                        'bg-green-500': room.status === 'Available',
                        'bg-blue-500': room.status === 'Booked',
                        'bg-orange-500': room.status === 'Cleaning',
                        'bg-red-500': room.status === 'Occupied',
                        'bg-gray-400':
                            room.status !== 'Available' &&
                            room.status !== 'Booked' &&
                            room.status !== 'Cleaning' &&
                            room.status !== 'Occupied',
                    }"
                    @click="openDialog(room)"
                >
                    <!-- Room Details -->
                    <div class="text-center text-2xl font-bold mb-2">
                        Room {{ room.roomNumber }}
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Dialog -->
    <Dialog
        v-model:visible="DialogVisible"
        header="Room Details"
        :modal="true"
        :dismissable-mask="true"
        style="width: 70vh"
    >
        <template #header>
            <div class="font-bold text-xl">
                Room {{ selectedRoom?.roomNumber }} | {{ selectedRoom?.type }}
            </div>
            <div>
                <p
                    class="font-medium text-white py-2 px-4 rounded-md"
                    :class="{
                        'bg-green-500': selectedRoom?.status === 'Available',
                        'bg-blue-500': selectedRoom?.status === 'Booked',
                        'bg-yellow-500': selectedRoom?.status === 'Cleaning',
                        'bg-red-500': selectedRoom?.status === 'Occupied',
                        'bg-gray-500': ![
                            'Available',
                            'Booked',
                            'Cleaning',
                            'Occupied',
                        ].includes(selectedRoom?.status),
                    }"
                >
                    {{ selectedRoom?.status }}
                </p>
            </div>
        </template>

        <div v-if="selectedRoom">
            <div>
                <div class="text-xl font-bold mb-2">Room Details</div>
            </div>
            <div>
                <p class="font-medium py-2 px-2 rounded-md">
                    Floor: {{ selectedRoom?.floor }}
                </p>
            </div>
            <div>
                <p class="font-medium py-2 px-2 rounded-md">
                    Room Type: {{ selectedRoom?.type }}
                </p>
            </div>
            <!-- Available Room Actions -->
            <div
                v-if="selectedRoom.status === 'Available'"
                class="flex flex-col gap-2"
            >
                <div class="flex gap-2 mt-4 justify-center">
                    <Button
                        class="p-button-primary w-full p-2 rounded-lg"
                        @click="openBookingDialog"
                    >
                        Book
                    </Button>
                    <Button
                        class="p-button-primary w-full p-2 rounded-lg"
                        @click="handleRoomAction('checkIn', selectedRoom)"
                    >
                        Check In
                    </Button>
                </div>
            </div>

            <!-- Booked Room Actions -->
            <div
                v-if="selectedRoom.status === 'Booked'"
                class="flex flex-col gap-2"
            >
                <div v-if="selectedRoom.BookingDetails">
                    <h4 class="text-xl mb-4 font-bold">Booking Details</h4>
                    <p class="font-medium m-2">
                        Guest Name:
                        {{ selectedRoom.BookingDetails.guestName || "N/A" }}
                    </p>
                    <p class="font-medium m-2">
                        Cellphone:
                        {{ selectedRoom.BookingDetails.cellphone || "N/A" }}
                    </p>
                    <p class="font-medium m-2">
                        Hours:
                        {{ selectedRoom.BookingDetails.selectedHours || "N/A" }}
                    </p>
                    <p class="font-medium m-2">
                        Rate:
                        {{
                            selectedRoom.BookingDetails.selectedrate !== null &&
                            selectedRoom.BookingDetails.selectedrate !==
                                undefined
                                ? `₱${selectedRoom.BookingDetails.selectedrate.toFixed(2)}`
                                : "N/A"
                        }}
                    </p>
                    <p class="font-medium m-2">
                        Booking Code:
                        {{ selectedRoom.BookingDetails.bookingCode || "N/A" }}
                    </p>
                    <p class="font-medium m-2">
                        Date/Time:
                        {{
                            selectedRoom.BookingDetails.timestamp
                                ? new Date(
                                      selectedRoom.BookingDetails.timestamp,
                                  ).toLocaleString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                      hour: "numeric",
                                      minute: "2-digit",
                                      hour12: true,
                                  })
                                : "N/A"
                        }}
                    </p>
                </div>

                <div class="flex gap-2 mt-4 justify-center">
                    <Button
                        class="p-button-primary w-full p-2 rounded-lg"
                        @click="openCheckInDialog(selectedRoom)"
                    >
                        Check In
                    </Button>
                    <Button
                        class="p-button-primary w-full p-2 rounded-lg"
                        @click="openCancelDialog(selectedRoom)"
                    >
                        Cancel Booking
                    </Button>
                </div>
            </div>

            <!-- Occupied Room Actions -->
            <div
                v-if="selectedRoom.status === 'Occupied'"
                class="flex flex-col gap-2"
            >
                <p>Status: {{ selectedRoom.status }}</p>
                <p>
                    <strong>Guest Name:</strong>
                    {{ selectedRoom.guest?.name || "N/A" }}
                </p>
                <p>
                    <strong>Check-In:</strong>
                    {{ selectedRoom.guest?.checkIn || "N/A" }}
                </p>
                <p>
                    <strong>Check-Out:</strong>
                    {{ selectedRoom.guest?.checkOut || "N/A" }}
                </p>
                <div class="flex gap-2 mt-4 justify-center">
                    <Button
                        class="p-button-primary w-full rounded-lg"
                        @click="handleRoomAction('checkOut', selectedRoom)"
                    >
                        Check Out
                    </Button>
                    <Button
                        class="p-button-primary w-full rounded-lg"
                        @click="handleRoomAction('extend', selectedRoom)"
                    >
                        Extend Stay
                    </Button>
                </div>
            </div>
        </div>
    </Dialog>

    <!-- Booking Dialog -->
    <Dialog
        v-model:visible="BookingDialogVisible"
        :modal="true"
        :dismissable-mask="true"
        style="width: 70vh"
    >
        <template #header>
            <div class="font-bold text-xl">
                Room {{ selectedRoom?.roomNumber }} | {{ selectedRoom?.type }}
            </div>
        </template>

        <div class="p-4">
            <!-- Customer Information -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1"> Name</label>
                <InputText
                    v-model="BookingDetails.guestName"
                    placeholder="Enter your name"
                    class="w-full"
                    required
                />
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1"
                    >Cellphone Number</label
                >
                <InputText
                    v-model="BookingDetails.cellphone"
                    placeholder="Enter your cellphone number"
                    class="w-full"
                    required
                />
            </div>

            <div class="mb-4">
                <h3 class="text-sm font-medium mb-2">Hours of Stay</h3>
                <div class="grid grid-cols-3 gap-4">
                    <div
                        v-for="(rate, hours) in selectedRoom?.rate"
                        :key="hours"
                        class="border cursor-pointer p-4 text-center rounded-lg shadow-sm transition-all duration-200"
                        :class="{
                            'bg-green-500 text-white':
                                BookingDetails.selectedHours === hours,
                            'bg-gray-100':
                                BookingDetails.selectedHours !== hours,
                        }"
                        @click="selectHours(hours)"
                    >
                        <h4 class="text-lg font-bold">{{ hours }}</h4>
                        <!-- Ensure rate is valid before calling .toFixed() -->
                        <p class="text-sm">₱{{ rate ? rate : "N/A" }}</p>
                    </div>
                </div>
                <!-- Display Selected Hours and Rate -->
                <div class="mt-4">
                    <p class="font-medium">
                        Selected Hours:
                        {{ BookingDetails.selectedHours || "None" }}
                    </p>
                    <p class="font-medium">
                        Selected Rate:
                        {{
                            BookingDetails.selectedRate !== null
                                ? `₱${BookingDetails.selectedrate}`
                                : "None"
                        }}
                    </p>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-4 mt-6 justify-end">
                <Button
                    label="Cancel"
                    class="p-button-primary"
                    @click="closeBookingDialog"
                />
                <Button
                    label="Submit Booking"
                    class="p-button-primary"
                    :disabled="!isFormValid"
                    @click="submitBooking(BookingDetails)"
                />
            </div>
        </div>
    </Dialog>

    <!-- Cancel Booking Dialog -->
    <Dialog
        v-model:visible="cancelDialogVisible"
        header="Confirm Cancellation"
        :modal="true"
        :closable="false"
        :draggable="false"
        :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
        style="width: 30vw"
    >
        <div>
            <p>
                Are you sure you want to cancel the booking for Room
                {{ selectedRoom?.roomNumber || "N/A" }} |
                {{ selectedRoom?.roomType || "N/A" }} |
                {{ selectedRoom?.floor || "N/A" }}?
            </p>
        </div>
        <div class="flex justify-end mt-4">
            <Button
                label="No"
                class="p-button-secondary mr-2"
                @click="cancelDialogVisible = false"
            />
            <Button
                label="Yes"
                class="p-button-danger"
                @click="
                    confirmAndCancelBooking(
                        selectedRoom.BookingDetails.bookingCode,
                    )
                "
            />
        </div>
    </Dialog>

    <!-- Check-In Dialog -->
    <Dialog
        v-model:visible="checkInDialogVisible"
        header="Confirm Check-In"
        :modal="true"
        :dismissable-mask="true"
        :draggable="false"
        :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
        style="width: 30vw"
    >
        <div>
            <p class="mb-4 text-xl font-bold">
                {{ selectedRoom?.roomNumber || "N/A" }} |
                {{ selectedRoom?.type || "N/A" }} |
                {{ selectedRoom?.floor || "N/A" }}
            </p>
        </div>
        <div class="flex flex-col mt-4">
            <!-- Booking Details -->
            <p class="font-medium mb-2">
                Guest Name:
                {{ selectedRoom?.BookingDetails?.guestName || "N/A" }}
            </p>
            <p class="font-medium mb-2">
                Cellphone:
                {{ selectedRoom?.BookingDetails?.cellphone || "N/A" }}
            </p>
            <p class="font-medium mb-2">
                Booking Code:
                {{ selectedRoom?.BookingDetails?.bookingCode || "N/A" }}
            </p>
            <p class="font-medium mb-2">
                Selected Hours:
                {{ selectedRoom?.BookingDetails?.selectedHours || "N/A" }}
            </p>
            <p class="font-medium">
                Selected Rate:
                {{
                    BookingDetails.selectedRate !== null
                        ? `₱${BookingDetails.selectedrate}`
                        : "None"
                }}
            </p>

            <p class="font-medium mb-2">
                Check-In Date:
                {{
                    checkInDate
                        ? new Date(checkInDate).toLocaleString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                          })
                        : "N/A"
                }}
            </p>
            <p class="font-medium mb-2">
                Check-Out Date:
                {{
                    checkOutDate
                        ? new Date(checkOutDate).toLocaleString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                          })
                        : "N/A"
                }}
            </p>
            <p class="font-medium mb-2">
                Additional Notes:
                {{ selectedRoom?.BookingDetails?.notes || "N/A" }}
            </p>
        </div>
        <div class="flex justify-end mt-4">
            <Button
                label="No"
                class="p-button-primary w-full mr-2"
                @click="checkInDialogVisible = false"
            />
            <Button
                label="Yes"
                class="p-button-primary w-full"
                @click="confirmCheckIn(selectedRoom.BookingDetails.bookingCode)"
            />
        </div>
    </Dialog>
    <Toast />
</template>
