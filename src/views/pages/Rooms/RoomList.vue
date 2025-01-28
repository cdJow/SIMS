<script setup>
import { rooms } from "@/service/RoomListService.js";
import { useToast } from "primevue/usetoast";
import { computed, ref } from "vue";

function selectHours(hours) {
    BookingDetails.value.selectedHours = hours;
    const rate = selectedRoom.value?.rate[hours]; // Use the selected room's rate object
    BookingDetails.value.selectedrate = rate ? rate : null; // Set the rate if valid
}

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

// Dropdown Options
const roomTypes = ref(["Single", "Double", "Suite"]);

const cancelDialogVisible = ref(false); // Tracks visibility of the dialog

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

// Function to open the dialog
function openCheckInDialog(room) {
    if (!room || !room.BookingDetails?.bookingCode) {
        console.error("Invalid room or booking details.");
        return;
    }
    selectedRoom.value = room; // Set the selected room
    checkInDialogVisible.value = true; // Show the dialog
}

const directCheckInDialogVisible = ref(false);
const directCheckInDetails = ref({
    guestName: null,
    cellphone: null,
    selectedHours: null,
    selectedRate: null,
});

// Add to your script setup
function openDirectCheckInDialog() {
    directCheckInDetails.value = {
        guestName: "",
        cellphone: "",
        selectedHours: null,
        selectedRate: null,
    };
    directCheckInDialogVisible.value = true;
}

// Function to format currency
function formatCurrency(value) {
    if (!value) return "0.00";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "PHP",
    }).format(value);
}

function confirmDirectCheckIn() {
    if (!selectedRoom.value || !directCheckInDetails.value.selectedHours) {
        toast.add({
            severity: "error",
            summary: "Missing Information",
            detail: "Please fill all required fields",
            life: 3000,
        });
        return;
    }

    const checkInDate = new Date();
    const checkOutDate = new Date(
        checkInDate.getTime() +
            directCheckInDetails.value.selectedHours * 60 * 60 * 1000,
    );

    // Update room status
    selectedRoom.value.status = "Occupied";
    selectedRoom.value.BookingDetails = {
        ...directCheckInDetails.value,
        bookingCode: generateBookingCode(),
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate.toISOString(),
        timestamp: new Date().toISOString(),
    };

    updateRoomStatus(
        selectedRoom.value.id,
        "Occupied",
        directCheckInDetails.value,
    );

    toast.add({
        severity: "success",
        summary: "Direct Check-In Successful",
        detail: `${directCheckInDetails.value.guestName} checked into Room ${selectedRoom.value.roomNumber}`,
        life: 3000,
    });

    directCheckInDialogVisible.value = false;
}

// Function to open the checkout dialog
function openCheckoutDialog() {
    checkoutDialogVisible.value = true;
}

function openExtendDialog() {
    extendDialogVisible.value = true;
}

// Function to select rate and hours
function selectRateAndHours(hours, rate) {
    directCheckInDetails.value.selectedHours = hours;
    directCheckInDetails.value.selectedRate = rate;
}

// Reactive state for checkout dialog
const checkoutDialogVisible = ref(false);

// Function to confirm checkout
function confirmCheckout() {
    console.log("Checkout confirmed:", selectedRoom.value);
    // Logic for processing checkout goes here
    checkoutDialogVisible.value = false;
}

// Reactive state for extend dialog
const extendDialogVisible = ref(false);

// Reactive variables for extension details
const additionalHours = ref(null);
const additionalRate = ref(0);
const newTotal = ref(0);

function confirmExtension() {
    console.log("Extension confirmed with details:", {
        room: selectedRoom.value,
        additionalHours: additionalHours.value,
        additionalRate: additionalRate.value,
        newTotal: newTotal.value,
    });

    // Update the selected room's stay duration and rate
    selectedRoom.value.selectedHours += additionalHours.value;
    selectedRoom.value.selectedrate = newTotal.value;

    // Close the dialog
    extendDialogVisible.value = false;

    // Reset state for next use
    additionalHours.value = null;
    additionalRate.value = 0;
    newTotal.value = 0;
}

// Functions
function formatDate(date) {
    if (!date) return "N/A";
    return new Date(date).toLocaleString(); // Formats the date and time
}

function handleRoomAction(action, room) {
    console.log(`Action: ${action}`, room);
    // Add logic for API calls or modal displays
}

// Function to confirm check-in
function confirmCheckIn(bookingCode) {
    const room = rooms.value.find(
        (r) => r.BookingDetails?.bookingCode === bookingCode,
    );

    if (room && room.status === "Booked") {
        // Validate selectedHours
        if (!selectHours || selectHours <= 0) {
            toast.add({
                severity: "error",
                summary: "Check-In Error",
                detail: "Please select the duration of stay (hours).",
                life: 3000,
            });
            return; // Exit the function if selectedHours is not valid
        }

        // Automatically calculate the checkout date based on selected hours
        const checkInDate = new Date(); // Assume the current date/time is the check-in date
        const checkOutDate = new Date(
            checkInDate.getTime() + selectHours * 60 * 60 * 1000,
        );

        // Ensure calculated date is valid
        if (isNaN(checkOutDate.getTime())) {
            console.error("Error: Invalid checkout date calculation.");
            toast.add({
                severity: "error",
                summary: "Check-In Error",
                detail: "Failed to calculate the checkout date. Please try again.",
                life: 3000,
            });
            return;
        }

        // Update the room status to Checked-In
        room.status = "Occupied"; // Change status to Occupied
        room.BookingDetails.checkInDate = checkInDate.toISOString(); // Set check-in date
        room.BookingDetails.checkOutDate = checkOutDate.toISOString(); // Set check-out date

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

    selectedRoom.value = null; // Clear selected room
}

// State for dialog visibility and selected room

const DialogVisible = ref(false); // Controls visibility of the dialog

// Function to open the dialog
function openDialog(room) {
    if (!room) {
        console.error("Room data is missing.");
        return;
    }
    // Ensure BookingDetails exists for Booked or Occupied rooms
    if (room.status === "Booked" && !room.BookingDetails) {
        console.error("BookingDetails is missing for Booked room:", room);
    }
    selectedRoom.value = room;
    DialogVisible.value = true;
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
function generateBookingCode() {
    // Generate a random alphanumeric string of at least 4 characters
    const randomString = Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase(); // Ensure exactly 4 characters
    return `BK-${randomString}`;
}

function submitBooking(BookingDetails) {
    console.log("Submitted Booking Details:", BookingDetails); // Log submitted details

    const room = rooms.value.find((r) => r.id === selectedRoom.value.id);

    if (room) {
        // Generate unique booking code
        const uniqueBookingCode = generateBookingCode(room.id);

        // Update room details
        const timestamp = new Date().toISOString();
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
    const { guestName, cellphone } = BookingDetails.value;
    return !!(guestName && cellphone);
});
</script>

<template>
    <div class="flex flex-row gap-4">
        <!-- Filter Section -->
        <div class="w-1/5 p-4 card rounded-lg">
            <h3 class="text-lg font-bold mb-4">Filters</h3>

            <!-- Clear and Search -->
            <div class="mb-4">
                <Button
                    type="button"
                    icon="pi pi-filter-slash"
                    label="Clear"
                    outlined
                    class="mb-4 w-full"
                />
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText placeholder="Keyword Search" class="w-full" />
                </IconField>
            </div>

            <!-- Room Type Filter -->
            <div class="mb-4">
                <Select
                    v-model="selectedFilter.roomType"
                    :options="roomTypes"
                    placeholder="Filter by Room Type"
                    class="w-full"
                />
            </div>

            <!-- Status Filters -->
            <div class="mb-4">
                <h4 class="font-bold text-lg mb-2">Filter by Status</h4>
                <div class="flex flex-col gap-2">
                    <div>
                        <Checkbox
                            v-model="selectedFilter.available"
                            label="Available"
                            class="mr-2"
                        />
                        <label for="available">Available</label>
                    </div>
                    <div>
                        <Checkbox
                            v-model="selectedFilter.occupied"
                            label="Occupied"
                            class="mr-2"
                        />
                        <label for="occupied">Occupied</label>
                    </div>
                    <div>
                        <Checkbox
                            v-model="selectedFilter.cleaning"
                            label="Cleaning"
                            class="mr-2"
                        />
                        <label for="cleaning">Cleaning</label>
                    </div>
                </div>
            </div>
        </div>

        <!-- Room Grid Section -->
        <div class="flex-1 card p-4">
            <h2 class="text-xl font-bold mb-5">Room List</h2>
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
            <div class="space-y-2">
                <!-- Room Number and Type -->
                <div class="font-bold text-xl uppercase">
                    Room {{ selectedRoom?.roomNumber }} |
                    {{ selectedRoom?.type }}
                </div>
                <!-- Floor Information -->
                <div>
                    <p class="text-md uppercase">
                        {{ selectedRoom?.floor }}
                    </p>
                </div>
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
                        label=" Check-In"
                        icon="pi pi-sign-in"
                        class="p-button-primary w-full"
                        @click="openDirectCheckInDialog"
                    />
                </div>
            </div>

            <div v-if="selectedRoom.status === 'Cleaning'">
                <Button
                    class="p-button-primary w-full p-2 rounded-lg"
                    @click="handleRoomAction('clean', selectedRoom)"
                >
                    Done Cleaning</Button
                >
            </div>

            <!-- Booked Room Actions -->
            <div v-if="selectedRoom && selectedRoom.status === 'Booked'">
                <!-- Booked Room Details -->
                <div
                    v-if="
                        selectedRoom.status === 'Booked' &&
                        selectedRoom.guestDetails
                    "
                    class="flex flex-col gap-4 p-4"
                >
                    <h4 class="text-xl mb-2 font-bold">Booking Details</h4>
                    <p>
                        Guest Name:
                        {{ selectedRoom?.guestDetails?.guestName || "N/A" }}
                    </p>
                    <p>
                        Cellphone:
                        {{ selectedRoom?.guestDetails?.cellphone || "N/A" }}
                    </p>

                    <p>
                        Booking Code:
                        {{ selectedRoom.guestDetails?.bookingCode || "N/A" }}
                    </p>
                </div>

                <!-- Actions for Booked Rooms -->
                <div class="flex gap-2 mt-4 justify-center">
                    <Button
                        label="Check In"
                        class="p-button-primary w-full rounded-lg"
                        @click="openCheckInDialog(selectedRoom)"
                    />
                    <Button
                        label="Cancel Booking"
                        class="p-button-primary w-full rounded-lg"
                        @click="openCancelDialog(selectedRoom)"
                    />
                </div>
            </div>

            <!-- Occupied Room Actions -->
            <div
                v-if="selectedRoom.status === 'Occupied'"
                class="flex flex-col gap-4"
            >
                <p class="">
                    <strong>Guest Name:</strong>
                    {{ selectedRoom.guestDetails?.guestName || "N/A" }}
                </p>
                <p class="">
                    <strong>Check-In:</strong>
                    {{
                        formatDate(selectedRoom.guestDetails?.checkIn) || "N/A"
                    }}
                </p>
                <p class="">
                    <strong>Check-Out:</strong>
                    {{
                        formatDate(selectedRoom.guestDetails?.checkOut) || "N/A"
                    }}
                </p>
                <p class="">
                    <strong>Booking Code:</strong>
                    {{ selectedRoom.guestDetails?.bookingCode || "N/A" }}
                </p>
                <p class="">
                    <strong>Rate:</strong> ${{
                        selectedRoom.guestDetails?.rate || "N/A"
                    }}
                </p>
                <div class="flex gap-2 mt-4 justify-center">
                    <Button
                        class="p-button-primary w-full"
                        @click="openCheckoutDialog(selectedRoom)"
                    >
                        Check Out
                    </Button>
                    <Button
                        class="p-button-primary w-full"
                        @click="openExtendDialog(selectedRoom)"
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
                Book Room {{ selectedRoom?.roomNumber }} |
                {{ selectedRoom?.type }}
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

            <!-- Action Buttons -->
            <div class="flex gap-4 mt-6 justify-end">
                <Button
                    label="Cancel"
                    class="p-button-primary w-full"
                    @click="closeBookingDialog"
                />
                <Button
                    label="Save "
                    class="p-button-primary w-full"
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
                    BookingDetails.selectedrate !== null
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

    <!-- Direct Check-In Dialog -->
    <Dialog
        v-model:visible="directCheckInDialogVisible"
        header="Direct Check-In"
        :modal="true"
        :dismissable-mask="true"
        style="width: 70vh"
    >
        <template #header>
            <div class="font-bold text-xl">
                Direct Check-In: Room {{ selectedRoom?.roomNumber }}
            </div>
        </template>

        <div class="p-4 space-y-4">
            <!-- Guest Information -->
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-600">
                    Guest Name
                </label>
                <InputText
                    v-model="directCheckInDetails.guestName"
                    placeholder="Enter guest name"
                    class="w-full"
                    required
                />
            </div>

            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-600">
                    Contact Number
                </label>
                <InputText
                    v-model="directCheckInDetails.cellphone"
                    placeholder="Enter contact number"
                    class="w-full"
                    required
                />
            </div>

            <!-- Duration and Rate Selection -->
            <div>
                <label class="block text-sm font-medium text-gray-600 mb-2">
                    Select Stay Duration:
                </label>
                <div class="grid grid-cols-3 gap-4">
                    <div
                        v-for="(rate, hours) in selectedRoom?.rate"
                        :key="hours"
                        :class="[
                            'p-4 border rounded-lg cursor-pointer',
                            {
                                'border-blue-500 bg-blue-50':
                                    directCheckInDetails.selectedHours ===
                                    parseInt(hours),
                            },
                        ]"
                        @click="selectRateAndHours(parseInt(hours), rate)"
                    >
                        <div class="font-semibold text-lg">
                            {{ hours }} hours
                        </div>
                        <div class="text-gray-500">
                            {{ formatCurrency(rate) }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Payment Summary -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <div class="flex justify-between items-center">
                    <span class="font-medium">Total :</span>
                    <span class="font-semibold text-lg">
                        {{
                            formatCurrency(
                                directCheckInDetails.selectedRate || 0,
                            )
                        }}
                    </span>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-4 mt-6">
                <Button
                    label="Cancel"
                    severity="primary"
                    class="flex-1"
                    @click="directCheckInDialogVisible = false"
                />
                <Button
                    label="Confirm Check-In"
                    icon="pi pi-check"
                    class="flex-1 p-button-primary"
                    :disabled="
                        !directCheckInDetails.guestName ||
                        !directCheckInDetails.cellphone ||
                        !directCheckInDetails.selectedHours
                    "
                    @click="confirmDirectCheckIn"
                />
            </div>
        </div>
    </Dialog>

    <!-- Checkout Dialog -->

    <Dialog
        v-model:visible="checkoutDialogVisible"
        header="Room Checkout"
        :modal="true"
        :dismissable-mask="true"
        style="width: 70vh"
    >
        <template #header>
            <div class="font-bold text-xl">
                Checkout: Room {{ selectedRoom.roomNumber }}
            </div>
        </template>

        <div class="p-4 space-y-4">
            <!-- Guest Information -->
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-600">
                    Guest Name
                </label>
                <InputText
                    v-model="selectedRoom.guestName"
                    class="w-full"
                    readonly
                />
            </div>

            <!-- Contact Number -->
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-600">
                    Contact Number
                </label>
                <InputText
                    v-model="selectedRoom.cellphone"
                    class="w-full"
                    readonly
                />
            </div>

            <!-- Duration and Rate Summary -->
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <span class="font-medium">Duration:</span>
                    <span class="font-semibold">
                        {{ selectedRoom.selectedHours || "N/A" }} Hours
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="font-medium">Rate:</span>
                    <span class="font-semibold">
                        {{ formatCurrency(selectedRoom.selectedrate || 0) }}
                    </span>
                </div>
            </div>

            <!-- Payment Section -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <div class="flex justify-between items-center">
                    <span class="font-medium">Total Amount:</span>
                    <span class="font-semibold text-lg">
                        {{ formatCurrency(selectedRoom.selectedrate || 0) }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4 mt-6">
            <Button
                label="Cancel"
                severity="primary"
                class="flex-1"
                @click="checkoutDialogVisible = false"
            />
            <Button
                label="Confirm Checkout"
                icon="pi pi-check"
                class="flex-1 p-button-primary"
                :disabled="!selectedRoom.selectedrate"
                @click="confirmCheckout"
            />
        </div>
    </Dialog>

    <!-- Extend Stay Dialog -->
    <Dialog
        v-model:visible="extendDialogVisible"
        header="Extend Stay"
        :modal="true"
        :dismissable-mask="true"
        style="width: 70vh"
    >
        <template #header>
            <div class="font-bold text-xl">
                Extend Stay for Room {{ selectedRoom.roomNumber }}
            </div>
        </template>

        <div class="p-4 space-y-4">
            <!-- Guest Information -->
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-600">
                    Guest Name
                </label>
                <InputText
                    v-model="selectedRoom.guestName"
                    class="w-full"
                    readonly
                />
            </div>

            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-600">
                    Contact Number
                </label>
                <InputText
                    v-model="selectedRoom.cellphone"
                    class="w-full"
                    readonly
                />
            </div>

            <!-- Extend Stay Input -->
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-600">
                    Enter Additional Hours
                </label>
                <InputText
                    v-model.number="additionalHours"
                    placeholder="Enter number of hours"
                    class="w-full"
                    type="number"
                />
            </div>

            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-600">
                    Enter Additional Amount
                </label>
                <InputText
                    v-model.number="additionalRate"
                    placeholder="Enter additional amount"
                    class="w-full"
                    type="number"
                />
            </div>

            <!-- Payment Summary -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <div class="flex justify-between items-center">
                    <span class="font-medium">Current Total:</span>
                    <span class="font-semibold">
                        {{ formatCurrency(selectedRoom.selectedrate || 0) }}
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="font-medium">Additional Amount:</span>
                    <span class="font-semibold">
                        {{ formatCurrency(additionalRate || 0) }}
                    </span>
                </div>
                <hr class="my-2" />
                <div class="flex justify-between items-center">
                    <span class="font-medium text-lg">New Total:</span>
                    <span class="font-semibold text-lg">
                        {{
                            formatCurrency(
                                (selectedRoom.selectedrate || 0) +
                                    (additionalRate || 0),
                            )
                        }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4 mt-6">
            <Button
                label="Cancel"
                severity="primary"
                class="flex-1"
                @click="extendDialogVisible = false"
            />
            <Button
                label="Confirm Extension"
                icon="pi pi-check"
                class="flex-1 p-button-primary"
                :disabled="!additionalHours || !additionalRate"
                @click="confirmExtension"
            />
        </div>
    </Dialog>
    <Toast />
</template>
