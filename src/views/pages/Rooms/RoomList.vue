<script setup>
import { rooms } from "@/service/RoomListService.js";
import { useToast } from "primevue/usetoast";
import { computed, ref, watch } from "vue";
import RoomSummary from "./RoomSummary.vue";

function selectHours(hours) {
    guestDetails.value.selectedHours = hours;
    const rate = selectedRoom.value?.rate[hours]; // Use the selected room's rate object
    guestDetails.value.selectedrate = rate ? rate : null; // Set the rate if valid
}

function BookingselectRateAndHours(hours, rate) {
    guestDetails.value.selectedHours = hours; // Update booking state
    guestDetails.value.selectedrate = rate;
}

const isWalkIn = ref(false);

// Watch for changes in customer type
watch(isWalkIn, (newVal) => {
    if (newVal) {
        // For walk-ins, set check-in time to current datetime
        guestDetails.value.checkInDateTime = new Date();
        // You might want to add other walk-in specific logic here
    } else {
        // For bookings, reset to null or keep previous value
        guestDetails.value.checkInDateTime = null;
    }
});

const guestDetails = ref({
    guestName: "",
    cellphone: "",
    guestEmail: "",
    checkInDateTime: null,
    selectedHours: null,
    selectedrate: null,
    bookingType: computed(() => (isWalkIn.value ? "WALK-IN" : "BOOKING")),
    payment: {
        amountReceived: 0,
        deposit: 0,
        isPaid: false,
    },
});

const selectedRoom = ref({
    id: 1,
    roomNumber: "",
    guestDetails: {
        guestName: null,
        cellphone: null,
        guestEmail: null,
        selectedHours: null,
        selectedrate: null,
        notes: null,
        roomCode: null,
        timestamp: null,
        checkInDateTime: null,
        checkOutDateTime: null,
        extendedHours: 0,
        bookingType: computed(() => (isWalkIn.value ? "WALK-IN" : "BOOKING")),
        payment: {
            amountReceived: 0,
            deposit: 0,
            isPaid: false,
        },
    },
});

const billData = ref({
    roomNumber: "N/A",
    guestName: "N/A",
    cellphone: "N/A",
    selectedRate: 0,
    selectedHours: 0,
    stayDuration: 0,
    totalAmount: 0,
    amountReceived: 0,
    deposit: 0,
});

const cancelDialogVisible = ref(false); // Tracks visibility of the dialog
const cleaningConfirmationVisible = ref(false);
const toast = useToast();
const searchQuery = ref("");

function openCleaningConfirmation(room) {
    selectedRoom.value = room;
    cleaningConfirmationVisible.value = true;
}

function confirmCleaningCompletion() {
    try {
        if (!selectedRoom.value?.id) {
            throw new Error("No room selected");
        }

        const roomIndex = rooms.value.findIndex(
            (r) => r.id === selectedRoom.value.id
        );

        if (roomIndex === -1) {
            throw new Error("Room not found in local state");
        }

        // Update local state
        rooms.value[roomIndex].status = "Available";
        rooms.value[roomIndex].guestDetails = null;

        // Update localStorage
        localStorage.setItem("rooms", JSON.stringify(rooms.value));

        toast.add({
            severity: "success",
            summary: "Cleaning Confirmed",
            detail: `Room ${selectedRoom.value.roomNumber} is now available`,
            life: 3000,
        });
    } catch (error) {
        console.error("Cleaning error:", error);
        toast.add({
            severity: "error",
            summary: "Cleaning Failed",
            detail: error.message,
            life: 3000,
        });
    } finally {
        cleaningConfirmationVisible.value = false;
    }
}

// Add these filter-related state variables
const selectedFilter = ref({
    searchQuery: "",
    roomType: null,
    status: {
        Available: false,
        Occupied: false,
        Cleaning: false,
        Booked: false,
    },
});

const clearFilters = () => {
    searchQuery.value = "";
    selectedFilter.value = {
        searchQuery: "",
        roomType: null,
        status: {
            Available: false,
            Occupied: false,
            Cleaning: false,
            Booked: false,
        },
    };
};

// Add computed properties for filtering
const filteredRooms = computed(() => {
    return rooms.value.filter((room) => {
        // Search filter
        const matchesSearch = room.roomNumber
            .toLowerCase()
            .includes(selectedFilter.value.searchQuery.toLowerCase());

        // Room type filter
        const matchesType =
            !selectedFilter.value.roomType ||
            room.type === selectedFilter.value.roomType;

        // Status filter
        const statusFilters = Object.entries(selectedFilter.value.status)
            .filter(([, checked]) => checked)
            .map(([status]) => status);

        const matchesStatus =
            statusFilters.length === 0 || statusFilters.includes(room.status);

        return matchesSearch && matchesType && matchesStatus;
    });
});

// Payment Dialog Visibility
const paymentDialogVisible = ref(false);

// Payment Details
const paymentDetails = ref({
    amountReceived: "",
    deposit: "",
});

function handleWalkInPayment() {
    // Generate walk-in code with WI prefix
    const walkInCode = generateroomCode("WI");

    // Assign form data WITHOUT booking timestamp
    selectedRoom.value.guestDetails = {
        ...guestDetails.value,
        roomCode: walkInCode,
        selectedrate: guestDetails.value.selectedrate,
        selectedHours: guestDetails.value.selectedHours,
        bookingType: "WALK-IN", // Explicitly set type
        checkInDateTime: new Date().toISOString(), // Use current time for check-in
        payment: {
            amountReceived: paymentDetails.value.amountReceived,
            deposit: paymentDetails.value.deposit,

            isPaid: !isAmountInsufficient.value,
        },
    };

    paymentDialogVisible.value = true;
    BookingDialogVisible.value = false;
}

// Modified generator function with prefix support
function generateroomCode(prefix = "BK") {
    const randomString = Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase();
    return `${prefix}-${randomString}`;
}
// Rename 'change' to 'calculateChange'
const calculateChange = computed(() => {
    const amountReceived = parseFloat(paymentDetails.value.amountReceived) || 0;
    const deposit = parseFloat(paymentDetails.value.deposit) || 0;
    const rate = selectedRoom.value?.guestDetails?.selectedrate || 0;
    return amountReceived - (rate + deposit);
});

const totalAmountDue = computed(() => {
    const rate = selectedRoom.value?.guestDetails?.selectedrate || 0;
    const deposit = parseFloat(paymentDetails.value.deposit) || 0;
    return rate + deposit;
});

// Validation for Insufficient Amount
const isAmountInsufficient = computed(() => {
    const amountReceived = parseFloat(paymentDetails.value.amountReceived) || 0;
    const deposit = parseFloat(paymentDetails.value.deposit) || 0;
    const rate = selectedRoom.value?.guestDetails?.selectedrate || 0;

    // Total amount due (rate + deposit)
    const totalAmountDue = rate + deposit;

    // Check if amountReceived is less than totalAmountDue
    return amountReceived < totalAmountDue;
});
// Reset Payment Form
function resetPaymentForm() {
    paymentDetails.value = {
        amountReceived: "",
        deposit: "",
    };
}

// Open Payment Dialog
function openPaymentDialog(room) {
    paymentDialogVisible.value = true;
}

// Confirm Payment and Check-In
function confirmPaymentAndCheckIn() {
    if (isAmountInsufficient.value) {
        toast.add({
            severity: "error",
            summary: "Payment Failed",
            detail: "Insufficient payment. Please provide more funds.",
            life: 3000,
        });
        return;
    }

    // Update room status to "Occupied"
    const roomIndex = rooms.value.findIndex(
        (r) => r.id === selectedRoom.value.id
    );
    if (roomIndex !== -1) {
        rooms.value[roomIndex].status = "Occupied";
        rooms.value[roomIndex].guestDetails.checkInDateTime =
            new Date().toISOString();
        rooms.value[roomIndex].guestDetails.payment = {
            amountReceived:
                parseFloat(paymentDetails.value.amountReceived) || 0,
            deposit: parseFloat(paymentDetails.value.deposit) || 0,

            isPaid: !isAmountInsufficient.value,
        };

        // Add this calculation:
        const hours = rooms.value[roomIndex].guestDetails.selectedHours;
        const checkOutDate = new Date(
            new Date().getTime() + hours * 60 * 60 * 1000
        );
        rooms.value[roomIndex].guestDetails.checkOutDateTime =
            checkOutDate.toISOString();
    }

    // Show success message
    toast.add({
        severity: "success",
        summary: "Check-In Successful",
        detail: `Room ${selectedRoom.value.roomNumber} has been checked in.`,
        life: 3000,
    });

    // Close dialog and reset form
    paymentDialogVisible.value = false;
    DialogVisible.value = false;
    resetPaymentForm();
}

// Add computed property for room types
const roomTypes = computed(() => {
    return [...new Set(rooms.value.map((room) => room.type))];
});

const checkInDialogVisible = ref(false); // Controls the visibility of the dialog

// Derived data: Check-In and Check-Out dates

const checkInDate = computed(() => new Date()); // Check-in is always the current date/time
const cleaningConfirmationDialogVisible = ref(false);

const minDate = ref(new Date(new Date().setHours(0, 0, 0, 0)));
// Function to format currency
function formatCurrency(value) {
    if (!value) return "0.00";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "PHP",
    }).format(value);
}

// Function to open the checkout dialog
function openCheckoutDialog(room) {
    selectedRoom.value = {
        ...room,
        guestDetails: { ...room.guestDetails }, // Copy nested object
        selectedrate: room.rate || 0,
    };
    checkoutDialogVisible.value = true;
}

// Function to select rate and hours
function selectRateAndHours(hours, rate) {
    directCheckInDetails.value.selectedHours = hours;
    directCheckInDetails.value.selectedRate = rate;
}
const isCellphoneValid = ref(true); // Initially assume valid

function validatePhilippineCellphone(event) {
    const input = event.target.value;

    // Remove non-numeric characters
    const cleanedInput = input.replace(/\D/g, "");

    // Check if input starts with "09" or "63" (for +63)
    const isValid =
        (cleanedInput.startsWith("09") || cleanedInput.startsWith("63")) &&
        cleanedInput.length === 11;

    if (isValid) {
        guestDetails.value.cellphone = cleanedInput; // Update the model with cleaned input
        isCellphoneValid.value = true; // Mark as valid
    } else {
        guestDetails.value.cellphone = ""; // Clear invalid input
        isCellphoneValid.value = false; // Mark as invalid
    }
}

// Validation state
const isEmailValid = ref(true);

// Gmail validation function
function validateGmail(email) {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return gmailRegex.test(email);
}

// Email validation method
function validateEmail(event) {
    const email = event.target.value;

    // Check if the email is a valid Gmail address
    if (validateGmail(email)) {
        isEmailValid.value = true; // Mark as valid
    } else {
        isEmailValid.value = false; // Mark as invalid
    }
}

function formatCheckInTime() {
    if (!selectedRoom.value?.guestDetails?.checkInDateTime) return "";
    const date = new Date(selectedRoom.value.guestDetails.checkInDateTime);
    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

// Reactive state for checkout dialog
const checkoutDialogVisible = ref(false);

// Function to confirm checkout
function confirmCheckout() {
    console.log("Checkout confirmed:", selectedRoom.value);

    // Find the room in the rooms array
    const roomIndex = rooms.value.findIndex(
        (r) => r.id === selectedRoom.value.id
    );

    if (roomIndex === -1) {
        console.error("Room not found in the rooms array.");
        toast.add({
            severity: "error",
            summary: "Checkout Failed",
            detail: "Room not found. Please try again.",
            life: 3000,
        });
        return;
    }

    // Update local state FIRST
    rooms.value[roomIndex].status = "Cleaning";
    rooms.value[roomIndex].guestDetails = null;

    // Sync with localStorage IMMEDIATELY
    localStorage.setItem("rooms", JSON.stringify(rooms.value));

    // THEN call the API
    updateRoomStatus(selectedRoom.value.id, "Cleaning")
        .then(() => {
            toast.add({
                severity: "success",
                summary: "Checkout Successful",
                detail: `Room ${selectedRoom.value.roomNumber} has been checked out.`,
                life: 3000,
            });
        })
        .catch((error) => {
            console.error("API Error:", error);
            // Rollback local state if needed
            rooms.value[roomIndex].status = "Occupied";
            localStorage.setItem("rooms", JSON.stringify(rooms.value));

            toast.add({
                severity: "error",
                summary: "Checkout Failed",
                detail: "Failed to sync with server. Changes reverted.",
                life: 3000,
            });
        });

    checkoutDialogVisible.value = false;
    DialogVisible.value = false;
}

// Mock version: Update room status in local storage
async function updateRoomStatus(roomId, status) {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                const rooms = JSON.parse(localStorage.getItem("rooms") || "[]");
                const roomIndex = rooms.findIndex((r) => r.id === roomId);

                if (roomIndex === -1) {
                    reject(new Error("Room not found"));
                    return;
                }

                // Update status and clear guest details
                rooms[roomIndex].status = status;
                rooms[roomIndex].guestDetails = null;

                localStorage.setItem("rooms", JSON.stringify(rooms));
                resolve({ success: true });
            } catch (error) {
                reject(error);
            }
        }, 500);
    });
}

// Update reactive variables
const extendDialogVisible = ref(false);
const additionalHours = ref(null);
const additionalRate = ref(0);
const newTotal = computed(() => {
    const base = selectedRoom.value?.guestDetails?.selectedrate || 0;
    return base + additionalRate.value;
});

// Reset function
function resetExtensionForm() {
    additionalHours.value = null;
    additionalRate.value = 0;
}

function openExtendDialog(room) {
    selectedRoom.value = {
        ...room,
        guestDetails: { ...room.guestDetails },
    };
    resetExtensionForm();
    extendDialogVisible.value = true;
}

async function confirmExtension() {
    try {
        if (!additionalHours.value || additionalHours.value <= 0) {
            throw new Error("Please enter valid additional hours");
        }

        if (additionalRate.value <= 0) {
            throw new Error("Please enter a valid additional amount");
        }

        const roomIndex = rooms.value.findIndex(
            (r) => r.id === selectedRoom.value.id
        );

        if (roomIndex === -1) {
            throw new Error("Room not found");
        }

        // Update local state
        rooms.value[roomIndex].guestDetails.selectedHours +=
            additionalHours.value;
        rooms.value[roomIndex].guestDetails.extendedHours =
            (rooms.value[roomIndex].guestDetails.extendedHours || 0) +
            additionalHours.value;
        rooms.value[roomIndex].guestDetails.selectedrate = newTotal.value;
        // Update check-out time
        const checkInDate = new Date(
            rooms.value[roomIndex].guestDetails.checkInDateTime
        );
        const newCheckOut = new Date(
            checkInDate.getTime() +
                rooms.value[roomIndex].guestDetails.selectedHours *
                    60 *
                    60 *
                    1000
        );
        rooms.value[roomIndex].guestDetails.checkOutDateTime =
            newCheckOut.toISOString();

        // Persist changes
        localStorage.setItem("rooms", JSON.stringify(rooms.value));

        // Simulate API call
        await updateRoomStatus(selectedRoom.value.id, "Occupied");

        toast.add({
            severity: "success",
            summary: "Stay Extended",
            detail: `Room ${selectedRoom.value.roomNumber} extended successfully`,
            life: 3000,
        });
    } catch (error) {
        toast.add({
            severity: "error",
            summary: "Extension Failed",
            detail: error.message,
            life: 3000,
        });
    } finally {
        extendDialogVisible.value = false;
        resetExtensionForm();
    }
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
function confirmDirectCheckIn(roomCode) {
    const room = rooms.value.find((r) => r.guestDetails?.roomCode === roomCode);

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
            checkInDate.getTime() + selectHours * 60 * 60 * 1000
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
        room.guestDetails.checkInDate = checkInDate.toISOString(); // Set check-in date
        room.guestDetails.checkOutDate = checkOutDate.toISOString(); // Set check-out date

        // Update selectedRoom if it matches
        if (selectedRoom.value?.id === room.id) {
            selectedRoom.value = { ...room };
        }

        // Simulate API call to update room status
        updateRoomStatus(room.id, "Occupied", room.guestDetails)
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
            detail: `No active booking found with the code ${roomCode}.`,
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

const isCheckInAllowed = computed(() => {
    // Add null checks
    if (!selectedRoom.value?.guestDetails?.checkInDateTime) return false;

    const now = new Date();
    const checkInTime = new Date(
        selectedRoom.value.guestDetails.checkInDateTime
    );

    // Allow check-in 15 minutes before scheduled time
    const bufferTime = 15 * 60 * 1000;
    return now >= checkInTime - bufferTime;
});

// Function to open the dialog
function openDialog(room) {
    if (!room) {
        console.error("Room data is missing.");
        return;
    }
    // Ensure guestDetails exists for Booked or Occupied rooms
    if (room.status === "Booked" && !room.guestDetails) {
        console.error("guestDetails is missing for Booked room:", room);
    }
    selectedRoom.value = room;
    DialogVisible.value = true;
}

function closeBookingDialog() {
    BookingDialogVisible.value = false; // Hide the dialog
}

// Function to open the dialog
function openCancelDialog(room) {
    if (!room || !room.guestDetails?.roomCode) {
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
function confirmAndCancelBooking(roomCode) {
    const room = rooms.value.find((r) => r.guestDetails?.roomCode === roomCode);

    if (room && room.status === "Booked") {
        // Get the cancellation timestamp
        const cancellationTimestamp = new Date().toISOString();

        // Add the canceled booking details to a canceledBookings array (or database)
        canceledBookings.push({
            roomId: room.id,
            roomNumber: room.roomNumber,
            guestName: room.guestDetails.guestName,
            cellphone: room.guestDetails.cellphone,
            guestEmail: room.guestDetails.guestEmail,
            selectedHours: room.guestDetails.selectedHours,
            selectedrate: room.guestDetails.selectedrate,
            notes: room.guestDetails.notes,
            roomCode: room.guestDetails.roomCode,
            canceledAt: cancellationTimestamp,
        });

        // Reset the room details
        room.status = "Available";
        room.guestDetails = null;

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
            detail: `No active booking found with the code ${roomCode}.`,
            life: 3000,
        });
    }
}

// Reactive state for dialog visibility
const BookingDialogVisible = ref(false); // Tracks visibility of the booking dialog

// Function to open the booking dialog
function openBookingDialog() {
    guestDetails.value = {
        guestName: "",
        cellphone: "",
        email: "",
        selectedHours: null,
        selectedrate: null,
        notes: "",
    };
    BookingDialogVisible.value = true;
}

function submitBooking(guestDetails) {
    console.log("Submitted Booking Details:", guestDetails); // Log submitted details

    const room = rooms.value.find((r) => r.id === selectedRoom.value.id);

    if (room) {
        // Generate unique Room Code
        const uniqueroomCode = generateroomCode(room.id);

        // Update room details
        const uniqueBookCode = generateroomCode("BK");
        const timestamp = new Date().toISOString();
        room.status = "Booked";
        room.guestDetails = {
            bookingType: "BOOKING",
            guestName: guestDetails.guestName,
            cellphone: guestDetails.cellphone,
            guestEmail: guestDetails.guestEmail,
            checkInDateTime: guestDetails.checkInDateTime,
            selectedHours: guestDetails.selectedHours,
            selectedrate: guestDetails.selectedrate,
            roomCode: uniqueroomCode,
            Bookcode: uniqueBookCode,
            timestamp: timestamp,
            payment: {
                amountReceived: paymentDetails.value.amountReceived,
                deposit: paymentDetails.value.deposit,

                isPaid: !isAmountInsufficient.value,
            },
        };

        // Update selectedRoom to reflect the updated room data
        selectedRoom.value = { ...room };

        timestamp: new Date().toISOString(), // Add this line
            // Simulate API call to update room status
            updateRoomStatus(selectedRoom.value.id, "Booked");
    }

    // Close dialog and reset
    BookingDialogVisible.value = false;
}

// Computed property for form validation
const isFormValid = computed(() => {
    const { guestName, cellphone, guestEmail, selectedHours, selectedrate } =
        guestDetails.value;
    return !!(
        guestName &&
        cellphone &&
        guestEmail &&
        selectedHours &&
        selectedrate
    );
});
</script>

<template>
    <div class="col-span-12 mb-2">
        <RoomSummary />
    </div>
    <div class="flex flex-row gap-4">
        <!-- Filter Section -->

        <!-- Room Grid Section -->
        <div class="flex-1 card p-4">
            <h2 class="text-xl font-bold mb-5">Room List</h2>
            <div class="h-[70vh] overflow-y-auto">
                <!-- Scrollable container -->
                <div
                    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 justify-center pb-4"
                >
                    <div
                        v-for="room in filteredRooms"
                        :key="room.id"
                        :value="filteredRooms"
                        class="relative w-full p-6 rounded-lg shadow-md border cursor-pointer hover:shadow-lg transition-shadow text-white min-h-[120px]"
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
                        <!-- Extension Badge -->
                        <div
                            v-if="room.guestDetails?.extendedHours > 0"
                            class="absolute top-2 right-2 bg-yellow-400 text-white text-xs font-semibold px-2 py-1 rounded-full"
                        >
                            +{{ room.guestDetails.extendedHours }} hrs
                        </div>
                        <!-- Room Details -->
                        <div class="text-center text-2xl font-bold mb-2">
                            Room {{ room.roomNumber }}
                        </div>
                        <!-- Additional room info -->
                        <div class="text-center text-sm">
                            <p>{{ room.type }}</p>
                            <p>{{ room.status }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div
            class="w-full md:w-1/3 lg:w-1/4 xl:w-1/5 p-2 md:p-4 card rounded-lg order-first md:order-last"
        >
            <h3 class="text-base md:text-lg font-bold mb-2 md:mb-4">Filters</h3>

            <!-- Clear and Search -->
            <div class="mb-2 md:mb-4 space-y-2">
                <Button
                    type="button"
                    icon="pi pi-filter-slash"
                    label="Clear"
                    outlined
                    class="w-full text-sm md:text-base"
                    @click="clearFilters"
                />
                <IconField class="w-full">
                    <InputIcon class="mt-1">
                        <i class="pi pi-search text-sm md:text-base" />
                    </InputIcon>
                    <InputText
                        placeholder="Search Room Number"
                        class="w-full text-sm md:text-base"
                        v-model="selectedFilter.searchQuery"
                    />
                </IconField>
            </div>

            <!-- Room Type Filter -->
            <div class="mb-2 md:mb-4">
                <Select
                    v-model="selectedFilter.roomType"
                    :options="roomTypes"
                    placeholder="Room Type"
                    class="w-full text-sm md:text-base"
                />
            </div>

            <!-- Status Filters -->
            <div class="mb-2 md:mb-4">
                <h4 class="font-bold text-sm md:text-base mb-1 md:mb-2">
                    Status
                </h4>
                <div class="flex flex-col gap-1 md:gap-2">
                    <div class="flex items-center">
                        <Checkbox
                            v-model="selectedFilter.status.Available"
                            :binary="true"
                            class="h-4 w-4 md:h-5 md:w-5"
                        />
                        <label class="text-sm md:text-base ml-2"
                            >Available</label
                        >
                    </div>
                    <div class="flex items-center">
                        <Checkbox
                            v-model="selectedFilter.status.Occupied"
                            :binary="true"
                            class="h-4 w-4 md:h-5 md:w-5"
                        />
                        <label class="text-sm md:text-base ml-2"
                            >Occupied</label
                        >
                    </div>
                    <div class="flex items-center">
                        <Checkbox
                            v-model="selectedFilter.status.Cleaning"
                            :binary="true"
                            class="h-4 w-4 md:h-5 md:w-5"
                        />
                        <label class="text-sm md:text-base ml-2"
                            >Cleaning</label
                        >
                    </div>
                    <div class="flex items-center">
                        <Checkbox
                            v-model="selectedFilter.status.Booked"
                            :binary="true"
                            class="h-4 w-4 md:h-5 md:w-5"
                        />
                        <label class="text-sm md:text-base ml-2">Booked</label>
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
    >
        <template #header>
            <div
                class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4 py-3"
            >
                <!-- Left Section: Room Information -->
                <div class="space-y-1">
                    <div class="flex items-baseline gap-2">
                        <h2 class="text-2xl font-bold">
                            Room {{ selectedRoom?.roomNumber }}
                        </h2>
                        <span class="text-lg">|</span>
                        <span class="text-lg font-semibold">
                            {{ selectedRoom?.type }}
                        </span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-medium"> Floor: </span>
                        <span class="text-sm">
                            {{ selectedRoom?.floor || "N/A" }}
                        </span>
                    </div>
                </div>

                <!-- Right Section: Status Indicator -->
                <div class="flex items-center gap-3">
                    <div
                        class="h-full w-1 rounded-l-md"
                        :class="{
                            'bg-green-500':
                                selectedRoom?.status === 'Available',
                            'bg-blue-500': selectedRoom?.status === 'Booked',
                            'bg-yellow-500':
                                selectedRoom?.status === 'Cleaning',
                            'bg-red-500': selectedRoom?.status === 'Occupied',
                            'bg-gray-500': ![
                                'Available',
                                'Booked',
                                'Cleaning',
                                'Occupied',
                            ].includes(selectedRoom?.status),
                        }"
                    ></div>
                    <div class="space-y-1">
                        <span
                            class="text-xs font-medium uppercase tracking-wide"
                        >
                            Status
                        </span>
                        <p
                            class="text-sm font-semibold"
                            :class="{
                                'text-green-600':
                                    selectedRoom?.status === 'Available',
                                'text-blue-600':
                                    selectedRoom?.status === 'Booked',
                                'text-yellow-600':
                                    selectedRoom?.status === 'Cleaning',
                                'text-red-600':
                                    selectedRoom?.status === 'Occupied',
                                'text-gray-600': ![
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
                </div>
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
                        label=" Book / Check-In"
                        icon="pi pi-sign-in"
                        class="p-button-primary w-full"
                        @click="openBookingDialog"
                    />
                </div>
            </div>

            <div v-if="selectedRoom.status === 'Cleaning'">
                <div class="mb-4">
                    <p class="font-semibold">
                        Last Guest:
                        {{ selectedRoom.guestDetails?.guestName || "N/A" }}
                    </p>
                    <p>Cleaning Started: {{ formatDate(new Date()) }}</p>
                </div>

                <Button
                    label="Confirm Cleaning Completion"
                    icon="pi pi-check"
                    class="p-button-success w-full"
                    @click="openCleaningConfirmation(selectedRoom)"
                />
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
                    <h4 class="text-xl mb-2 font-bold">Guest Details</h4>
                    <p>
                        Booked At:
                        {{
                            formatDate(selectedRoom.guestDetails?.timestamp) ||
                            "N/A"
                        }}
                    </p>
                    <p>
                        Room Code:
                        {{ selectedRoom.guestDetails?.roomCode || "N/A" }}
                    </p>
                    <p>
                        Book Code:
                        {{ selectedRoom.guestDetails?.Bookcode || "N/A" }}
                    </p>
                    <p>
                        Guest Name:
                        {{ selectedRoom?.guestDetails?.guestName || "N/A" }}
                    </p>
                    <p>
                        Cellphone:
                        {{ selectedRoom?.guestDetails?.cellphone || "N/A" }}
                    </p>
                    <p>
                        Email:
                        {{ selectedRoom?.guestDetails?.guestEmail || "N/A" }}
                    </p>

                    <p>
                        Selected Hours:
                        {{ selectedRoom.guestDetails?.selectedHours || "N/A" }}
                        Hours
                    </p>
                    <p>
                        Selected Rate:
                        {{
                            selectedRoom.guestDetails?.selectedrate
                                ? `₱${selectedRoom.guestDetails.selectedrate}`
                                : "N/A"
                        }}
                    </p>

                    <p>
                        Arrival Date & Time :
                        {{
                            formatDate(
                                selectedRoom.guestDetails?.checkInDateTime
                            ) || "N/A"
                        }}
                    </p>
                </div>

                <!-- Actions for Booked Rooms -->
                <div class="flex gap-2 mt-4 justify-center">
                    <Button
                        label="Check In"
                        :disabled="!isCheckInAllowed"
                        v-tooltip="
                            !isCheckInAllowed
                                ? 'Check-in available from ' +
                                  formatCheckInTime()
                                : ''
                        "
                        class="p-button-primary w-full rounded-lg"
                        @click="openPaymentDialog(selectedRoom)"
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
                <!-- Enhanced Occupied Details -->
                <h4 class="text-xl mb-2 font-bold">Guest Details</h4>
                <p>
                    <strong>Guest Name:</strong>
                    {{ selectedRoom.guestDetails?.guestName || "N/A" }}
                </p>
                <p>
                    <strong>Cellphone:</strong>
                    {{ selectedRoom.guestDetails?.cellphone || "N/A" }}
                </p>
                <p>
                    <strong>Email:</strong>
                    {{ selectedRoom.guestDetails?.guestEmail || "N/A" }}
                </p>
                <p>
                    <strong>Room Code:</strong>
                    {{ selectedRoom.guestDetails?.roomCode || "N/A" }}
                </p>
                <p>
                    <strong>Booking Code:</strong>
                    {{ selectedRoom.guestDetails?.Bookcode || "N/A" }}
                </p>
                <p>
                    <strong>Selected Hours:</strong>
                    {{ selectedRoom.guestDetails?.selectedHours || "N/A" }}
                    Hours
                </p>
                <p>
                    <strong>Rate:</strong>
                    {{
                        selectedRoom.guestDetails?.selectedrate
                            ? `₱${selectedRoom.guestDetails.selectedrate}`
                            : "N/A"
                    }}
                </p>
                <p>
                    <strong>Booked At:</strong>
                    {{
                        selectedRoom.guestDetails?.bookingType === "BOOKING"
                            ? formatDate(selectedRoom.guestDetails?.timestamp)
                            : "N/A"
                    }}
                </p>
                <p>
                    <strong>Arrival Date&Time</strong>
                    {{
                        formatDate(
                            selectedRoom.guestDetails?.checkInDateTime
                        ) || "N/A"
                    }}
                </p>
                <p>
                    <strong>Check-Out:</strong>
                    {{
                        formatDate(
                            selectedRoom?.guestDetails?.checkOutDateTime
                        ) || "N/A"
                    }}
                    <span
                        v-if="selectedRoom.guestDetails?.extendedHours > 0"
                        class="ml-2 text-green-500"
                    >
                        (+{{ selectedRoom.guestDetails?.extendedHours }} hrs)
                    </span>
                </p>


                <div class="mt-4 pt-4 border-t">
                    <h4 class="text-xl mb-2 font-bold">Payment Details</h4>
                    <p>
                        <strong>Total Amount:</strong>
                        {{
                            selectedRoom.guestDetails?.selectedrate
                                ? formatCurrency(
                                      selectedRoom.guestDetails.selectedrate
                                  )
                                : "N/A"
                        }}
                    </p>
                    <p>
                        <strong>Amount Received:</strong>
                        {{
                            selectedRoom.guestDetails?.payment?.amountReceived
                                ? formatCurrency(
                                      selectedRoom.guestDetails.payment
                                          .amountReceived
                                  )
                                : "N/A"
                        }}
                    </p>
                    <p>
                        <strong>Deposit:</strong>
                        {{
                            selectedRoom.guestDetails?.payment?.deposit
                                ? formatCurrency(
                                      selectedRoom.guestDetails.payment.deposit
                                  )
                                : "N/A"
                        }}
                    </p>

                    <p>
                        <strong>Payment Status:</strong>
                        <span
                            :class="{
                                'text-white rounded-full px-2 py-1 text-sm ml-2 ': true,
                                'bg-green-500':
                                    selectedRoom.guestDetails?.payment?.isPaid,
                                'bg-red-500':
                                    !selectedRoom.guestDetails?.payment?.isPaid,
                            }"
                        >
                            {{
                                selectedRoom.guestDetails?.payment?.isPaid
                                    ? "Paid"
                                    : "Pending"
                            }}
                        </span>
                    </p>
                </div>

                <!-- Action Buttons -->
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

    <!-- Booking/Checkin Dialog -->
    <Dialog
        v-model:visible="BookingDialogVisible"
        :modal="true"
        :dismissable-mask="true"
        style="width: 70vh"
    >
        <template #header>
            <div class="font-bold text-xl">
                Room {{ selectedRoom?.roomNumber }} |
                {{ selectedRoom?.type }}
            </div>
        </template>

        <div class="p-4">
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1"
                    >Customer Type</label
                >
                <div class="flex gap-4">
                    <div class="flex items-center">
                        <RadioButton
                            v-model="isWalkIn"
                            inputId="bookingType1"
                            name="bookingType"
                            :value="false"
                        />
                        <label for="bookingType1" class="ml-2">Book</label>
                    </div>
                    <div class="flex items-center">
                        <RadioButton
                            v-model="isWalkIn"
                            inputId="bookingType2"
                            name="bookingType"
                            :value="true"
                        />
                        <label for="bookingType2" class="ml-2">Walk-In</label>
                    </div>
                </div>
            </div>
            <!-- Customer Information -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1"> Name</label>
                <InputText
                    v-model="guestDetails.guestName"
                    placeholder="Enter your name"
                    class="w-full"
                    required
                />
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1"
                    >Cellphone Number</label
                >
                <div class="relative w-full">
                    <InputText
                        v-model="guestDetails.cellphone"
                        placeholder="Enter your cellphone number"
                        class="w-full pr-10"
                        :class="{ 'p-invalid': !isCellphoneValid }"
                        required
                        @input="validatePhilippineCellphone"
                    />
                    <i
                        v-if="!isCellphoneValid"
                        class="pi pi-exclamation-circle text-red-500 absolute right-3 top-1/2 transform -translate-y-1/2"
                    ></i>
                </div>
            </div>

            <div class="mb-4">
                <label class="block text-sm font-medium mb-1"> Email</label>
                <div class="relative">
                    <InputText
                        v-model="guestDetails.guestEmail"
                        placeholder="Enter your Email"
                        class="w-full"
                        :class="{ 'p-invalid': !isEmailValid }"
                        required
                        @input="validateEmail"
                    />
                    <i
                        v-if="!isEmailValid"
                        class="pi pi-exclamation-circle text-red-500 absolute right-3 top-1/2 transform -translate-y-1/2"
                    ></i>
                </div>
                <p v-if="!isEmailValid" class="text-sm text-red-500 mt-1">
                    Please enter a valid Gmail address (e.g.,
                    example@gmail.com).
                </p>
            </div>

            <div class="mb-4">
                <label class="block text-sm font-medium mb-1">
                    Check In Time:
                    <span v-if="isWalkIn" class="text-sm text-gray-500">
                        (Auto-filled with current time)
                    </span>
                </label>
                <DatePicker
                    v-model="guestDetails.checkInDateTime"
                    placeholder="Select date & time"
                    dateFormat="yy-mm-dd"
                    showTime
                    hourFormat="12"
                    class="w-full"
                    :minDate="minDate"
                    :showButtonBar="true"
                    :disabled="isWalkIn"
                />
            </div>

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
                                    guestDetails.selectedHours ===
                                    parseInt(hours),
                            },
                        ]"
                        @click="
                            BookingselectRateAndHours(parseInt(hours), rate)
                        "
                    >
                        <div class="font-semibold text-lg">
                            {{ hours }} Hours
                        </div>
                        <div class="text-gray-500">
                            {{ formatCurrency(rate) }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-4 mt-6 justify-end">
                <Button
                    label="Cancel"
                    class="p-button-primary w-full"
                    @click="closeBookingDialog"
                />
                <Button
                    v-if="!isWalkIn"
                    label="Save"
                    class="p-button-primary w-full"
                    :disabled="!isFormValid"
                    @click="submitBooking(guestDetails)"
                />
                <!-- In Booking/Checkin Dialog template -->
                <Button
                    v-else
                    label="Proceed to Payment"
                    class="p-button-primary w-full"
                    :disabled="!isFormValid"
                    @click="handleWalkInPayment"
                />
            </div>
        </div>
    </Dialog>

    <!-- Cancel Booking Dialog -->
    <Dialog
        v-model:visible="cancelDialogVisible"
        header="Confirm Cancellation"
        :dismissable-mask="true"
        :modal="true"
        :draggable="false"
        :style="{ width: '450px' }"
    >
        <div>
            <p>
                Are you sure you want to cancel the booking for Room
                <span class="font-bold text-red-500">
                    {{ selectedRoom?.roomNumber || "N/A" }} |
                    {{ selectedRoom?.type || "N/A" }} |
                    {{ selectedRoom?.floor || "N/A" }}?
                </span>
            </p>
        </div>
        <div class="flex justify-end mt-4 gap-2">
            <Button
                label="No"
                class="p-button-secondary w-32"
                @click="cancelDialogVisible = false"
            />
            <Button
                label="Yes"
                class="p-button-danger w-32"
                @click="
                    confirmAndCancelBooking(selectedRoom.guestDetails.roomCode)
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
                {{ selectedRoom?.guestDetails?.guestName || "N/A" }}
            </p>
            <p class="font-medium mb-2">
                Cellphone:
                {{ selectedRoom?.guestDetails?.cellphone || "N/A" }}
            </p>
            <p>
                Email:
                {{ selectedRoom?.guestDetails?.guestEmail || "N/A" }}
            </p>
            <p class="font-medium mb-2">
                Room Code:
                {{ selectedRoom?.guestDetails?.roomCode || "N/A" }}
            </p>
            <p class="font-medium mb-2">
                Booked at:
                {{ selectedRoom?.guestDetails.timestamp }}
            </p>
            <p class="font-medium mb-2">
                Selected Hours:
                {{ selectedRoom?.guestDetails?.selectedHours || "N/A" }}
            </p>
            <p class="font-medium">
                Selected Rate:
                {{
                    guestDetails.selectedrate !== null
                        ? `₱${guestDetails.selectedrate}`
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
                {{ selectedRoom?.guestDetails?.notes || "N/A" }}
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
                @click="
                    openPaymentDialog(
                        selectedRoom?.guestDetails?.selectedrate || 0
                    )
                "
            />
        </div>
    </Dialog>

    <!-- Payment Dialog -->
    <Dialog
        v-model:visible="paymentDialogVisible"
        header="Payment for Check-In"
        :modal="true"
        :dismissable-mask="true"
        style="width: 70vh"
    >
        <template #header>
            <div class="font-bold text-xl">
                Payment for Room {{ selectedRoom?.roomNumber }}
            </div>
        </template>

        <div class="p-4 space-y-4">
            <!-- Booking Details -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <div class="space-y-2">
                    <h4 class="text-lg font-semibold">Booking Details</h4>
                    <p>
                        Guest Name:
                        {{ selectedRoom?.guestDetails?.guestName || "N/A" }}
                    </p>
                    <p>
                        Selected Hours:
                        {{ selectedRoom?.guestDetails?.selectedHours || "N/A" }}
                        Hours
                    </p>
                    <p>
                        Selected Rate:
                        {{
                            formatCurrency(
                                selectedRoom?.guestDetails?.selectedrate || 0
                            )
                        }}
                    </p>
                    <p>
                        Total Amount:
                        {{
                            formatCurrency(
                                selectedRoom?.guestDetails?.selectedrate || 0
                            )
                        }}
                    </p>
                </div>
            </div>

            <!-- Payment Details -->
            <div class="space-y-4">
                <!-- Total Amount Due -->
                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="flex justify-between items-center">
                        <span class="font-medium">Total Amount Due:</span>
                        <span class="font-semibold text-lg">
                            {{ formatCurrency(totalAmountDue) }}
                        </span>
                    </div>
                </div>

                <!-- Amount Received -->
                <div class="space-y-2">
                    <InputText
                        v-model="paymentDetails.amountReceived"
                        placeholder="Enter amount received"
                        class="w-full"
                        type="number"
                    />
                </div>

                <!-- Deposit -->
                <div class="space-y-2">
                    <InputText
                        v-model="paymentDetails.deposit"
                        placeholder="Enter deposit amount"
                        class="w-full"
                        type="number"
                    />
                </div>

                <!-- Change -->
                <div v-if="calculateChange !== null" class="space-y-2">
                    <label class="block text-sm font-medium text-gray-600">
                        Change
                    </label>
                    <InputText
                        :modelValue="formatCurrency(calculateChange)"
                        readonly
                        class="w-full bg-gray-100"
                    />
                </div>

                <!-- Validation Message -->
                <div v-if="isAmountInsufficient" class="text-red-500 text-sm">
                    The amount received is insufficient. Please provide more
                    funds.
                </div>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4 mt-6">
            <Button
                label="Cancel"
                severity="primary"
                class="flex-1"
                @click="
                    paymentDialogVisible = false;
                    resetPaymentForm();
                "
            />
            <Button
                label="Confirm Payment & Check-In"
                icon="pi pi-check"
                class="flex-1 p-button-success"
                :disabled="isAmountInsufficient"
                @click="confirmPaymentAndCheckIn"
            />
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
                    :modelValue="selectedRoom.guestDetails?.guestName || 'N/A'"
                    class="w-full"
                    readonly
                />
            </div>

            <!-- Contact Number -->
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-600">
                    Room Code:
                </label>
                <InputText
                    :modelValue="selectedRoom.guestDetails?.roomCode || 'N/A'"
                    class="w-full"
                    readonly
                />
            </div>

            <!-- Duration and Rate Summary -->
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <span class="font-medium">Duration:</span>
                    <span class="font-semibold">
                        {{ selectedRoom.guestDetails?.selectedHours || "N/A" }}
                        Hours
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="font-medium">Rate:</span>
                    <span class="font-semibold">
                        {{
                            formatCurrency(
                                selectedRoom.guestDetails?.selectedrate || 0
                            )
                        }}
                    </span>
                </div>
            </div>

            <!-- Payment Section -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <div class="flex justify-between items-center">
                    <span class="font-medium">Total Amount:</span>
                    <span class="font-semibold text-lg">
                        {{
                            formatCurrency(
                                selectedRoom.guestDetails?.selectedrate || 0
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
                @click="checkoutDialogVisible = false"
            />
            <Button
                label="Confirm Checkout"
                icon="pi pi-check"
                class="flex-1 p-button-primary"
                :disabled="selectedRoom.selectedrate == null"
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
                    Current Hours:
                    {{ selectedRoom.guestDetails?.selectedHours || 0 }}h
                </label>
                <label class="block text-sm font-medium text-gray-600">
                    Current Rate:
                    {{
                        formatCurrency(
                            selectedRoom.guestDetails?.selectedrate || 0
                        )
                    }}
                </label>
            </div>

            <!-- Extend Stay Inputs -->
            <div class="space-y-4">
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-600">
                        Additional Hours
                    </label>
                    <InputNumber
                        v-model="additionalHours"
                        placeholder="Enter hours"
                        class="w-full"
                        :min="1"
                    />
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-600">
                        Additional Amount
                    </label>
                    <InputNumber
                        v-model="additionalRate"
                        placeholder="Enter amount"
                        class="w-full"
                        :min="0"
                        mode="currency"
                        currency="PHP"
                    />
                </div>
            </div>

            <!-- Payment Summary -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <div class="flex justify-between items-center mb-2">
                    <span class="font-medium">Current Total:</span>
                    <span class="font-semibold">
                        {{
                            formatCurrency(
                                selectedRoom.guestDetails?.selectedrate || 0
                            )
                        }}
                    </span>
                </div>
                <div class="flex justify-between items-center mb-2">
                    <span class="font-medium">Additional Amount:</span>
                    <span class="font-semibold">
                        {{ formatCurrency(additionalRate) }}
                    </span>
                </div>
                <hr class="my-2" />
                <div class="flex justify-between items-center">
                    <span class="font-medium text-lg">New Total:</span>
                    <span class="font-semibold text-lg">
                        {{ formatCurrency(newTotal) }}
                    </span>
                </div>
            </div>
        </div>

        <template #footer>
            <Button
                label="Cancel"
                class="p-button-secondary"
                @click="extendDialogVisible = false"
            />
            <Button
                label="Confirm Extension"
                icon="pi pi-check"
                class="p-button-primary"
                :disabled="
                    !additionalHours ||
                    additionalHours <= 0 ||
                    additionalRate <= 0
                "
                @click="confirmExtension"
            />
        </template>
    </Dialog>
    <!-- Cleaning Confirmation Dialog -->
    <Dialog
        v-model:visible="cleaningConfirmationVisible"
        header="Confirm Cleaning Completion"
        :modal="true"
        style="width: 500px"
    >
        <div class="p-4">
            <p>
                Are you sure you want to mark Room
                {{ selectedRoom?.roomNumber }} as available?
            </p>
            <p class="text-sm text-gray-600 mt-2">
                This action cannot be undone.
            </p>
        </div>

        <template #footer>
            <Button
                label="Cancel"
                icon="pi pi-times"
                class="p-button-text"
                @click="cleaningConfirmationVisible = false"
            />
            <Button
                label="Confirm"
                icon="pi pi-check"
                class="p-button-success"
                @click="confirmCleaningCompletion"
            />
        </template>
    </Dialog>

    <Toast />
</template>
<style scoped>
/* Add to your style section */
.extended-badge {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
    100% {
        transform: scale(1);
    }
}
</style>
