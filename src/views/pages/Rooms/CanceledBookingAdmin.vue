<script setup>
import { useToast } from "primevue/usetoast";
import { computed, onBeforeMount, ref } from "vue";

const mockCanceledBookings = [
    {
        BookingCode: "RES-1003",
        guestName: "Alice Johnson",
        roomNumber: "102",
        roomType: "Single Size Bed",
        selectedHours: 6,
        selectedRate: 199.99,
        checkInDate: "2023-12-20T12:00:00",
        checkOutDate: "2023-12-22T10:00:00",
        cancellationDate: "2023-12-19T14:30:00", // Added cancellation date
        cancellationReason: "Change of plans", // Added cancellation reason
        paymentStatus: {
            ratePaid: false,
            depositAmount: 50.0,
            depositStatus: "Refunded",
            balanceDue: 0.0,
        },
        ExtraAmenities: ["Towels"],
        contactInfo: "099294293",
        loyaltyStatus: "Bronze Member",
        notes: "Guest requested a refund.",
    },
    {
        BookingCode: "RES-1004",
        guestName: "Bob Brown",
        roomNumber: "204",
        roomType: "Double Size Bed",
        selectedHours: 12,
        selectedRate: 299.99,
        checkInDate: "2023-12-18T15:00:00",
        checkOutDate: "2023-12-20T11:00:00",
        cancellationDate: "2023-12-17T09:45:00", // Added cancellation date
        cancellationReason: "Flight cancellation", // Added cancellation reason
        paymentStatus: {
            ratePaid: true,
            depositAmount: 100.0,
            depositStatus: "Pending Refund",
            balanceDue: 0.0,
        },
        ExtraAmenities: ["Pillows", "Blankets"],
        contactInfo: "099294293",
        loyaltyStatus: "Silver Member",
        notes: "Guest will rebook later.",
    },
];

// Add these filter-related variables
const filters = ref({
    searchQuery: "",
    dateRange: [null, null],
    roomType: null,
});

// Add computed filtered bookings
const filteredBookings = computed(() => {
    return canceledBookings.value.filter((booking) => {
        // Search filter
        const searchMatches =
            booking.BookingCode.toLowerCase().includes(
                filters.value.searchQuery.toLowerCase()
            ) ||
            booking.guestName
                .toLowerCase()
                .includes(filters.value.searchQuery.toLowerCase());

        // Date range filter
        const dateMatches =
            !filters.value.dateRange[0] ||
            (booking.cancellationDate >= new Date(filters.value.dateRange[0]) &&
                booking.cancellationDate <=
                    new Date(filters.value.dateRange[1]));

        // Room type filter
        const roomTypeMatches =
            !filters.value.roomType ||
            booking.roomType === filters.value.roomType;

        return searchMatches && dateMatches && roomTypeMatches;
    });
});

// Add clear filters function
const clearFilters = () => {
    filters.value = {
        searchQuery: "",
        dateRange: [null, null],
        roomType: null,
    };
};

onBeforeMount(() => {
    canceledBookings.value = mockCanceledBookings.map((booking) => ({
        ...booking,
        checkInDate: new Date(booking.checkInDate),
        checkOutDate: new Date(booking.checkOutDate),
        cancellationDate: new Date(booking.cancellationDate),
    }));
    console.log("Canceled Bookings Loaded:", canceledBookings.value);
});

const canceledBookings = ref([]); // Initialize as empty array instead of null
const toast = useToast();
const deleteDialogVisible = ref(false);

const selectedBookingToDelete = ref(null);

// Add delete confirmation functions
const confirmDelete = (booking) => {
    selectedBookingToDelete.value = booking;
    deleteDialogVisible.value = true;
};

const executeDelete = () => {
    if (selectedBookingToDelete.value) {
        canceledBookings.value = canceledBookings.value.filter(
            (b) => b.BookingCode !== selectedBookingToDelete.value.BookingCode
        );
        deleteDialogVisible.value = false;
        selectedBookingToDelete.value = null;
    }

    // Show success toast
    toast.add({
        severity: "error",
        summary: "Deleted",
        detail: "Deleted successfully",
        life: 3000,
    });
};

const cancelDelete = () => {
    deleteDialogVisible.value = false;
    selectedBookingToDelete.value = null;
};
const op = ref();
const selectedBooking = ref(null);

const handleClick = (event, bookingData) => {
    selectedBooking.value = bookingData;
    op.value.toggle(event);
};
</script>

<template>
    <div class="card p-4 rounded-lg shadow-sm">
        <div class="text-xl font-semibold mb-4">Canceled Bookings</div>

        <!-- Enhanced Filter Section -->
        <div>
            <div class="mb-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <!-- Search -->
                    <div>
                        <div class="flex gap-2">
                            <Button
                                type="button"
                                icon="pi pi-filter-slash"
                                label="Clear"
                                outlined
                                class="whitespace-nowrap"
                                @click="clearFilters"
                            />
                            <InputText
                                placeholder="Enter Booking Code"
                                class="flex-1 p-3 border rounded-lg"
                                v-model="filters.searchQuery"
                            />
                        </div>
                    </div>
                    <!-- Date Range -->
                </div>
            </div>

            <!-- DataTable and other content -->
        </div>
        <!-- DataTable -->
        <DataTable
            :value="filteredBookings"
            scrollable
            scrollHeight="600px"
            class="mt-6"
        >
            <!-- Booking Code -->
            <Column
                field="BookingCode"
                header="Booking Code"
                :style="{ minWidth: '150px' }"
            ></Column>

            <!-- Room Number -->
            <Column
                field="roomNumber"
                header="Room Number"
                :style="{ minWidth: '120px' }"
            ></Column>

            <!-- Cancellation Date/Time -->
            <Column
                field="cancellationDate"
                header="Cancellation Date/Time"
                :style="{ minWidth: '200px' }"
            >
                <template #body="{ data }">
                    <span class="text-red-500">
                        {{ data.cancellationDate.toLocaleString() }}
                    </span>
                </template>
            </Column>

            <!-- Action Column with Popover -->
            <Column header="Action" :style="{ minWidth: '100px' }">
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <Button
                            icon="pi pi-info-circle"
                            class="p-button-info"
                            outlined
                            rounded
                            @click="handleClick($event, data)"
                            v-tooltip="'View Guest Info'"
                        />
                        <Button
                            icon="pi pi-trash"
                            class="p-button-danger"
                            outlined
                            rounded
                            @click="confirmDelete(data)"
                            v-tooltip="'Delete Booking'"
                        />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Popover Overlay -->
        <Popover ref="op">
            <div class="p-4" v-if="selectedBooking">
                <div class="flex flex-col gap-3">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-user"></i>
                        <span class="font-semibold">Guest Name:</span>
                        {{ selectedBooking.guestName }}
                    </div>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-phone"></i>
                        <span class="font-semibold">Contact Number:</span>
                        {{ selectedBooking.contactInfo }}
                    </div>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-home"></i>
                        <span class="font-semibold">Room Type:</span>
                        {{ selectedBooking.roomType }}
                    </div>
                </div>
            </div>
        </Popover>
    </div>

    <Dialog
        v-model:visible="deleteDialogVisible"
        :style="{ width: '450px' }"
        header="Confirm Deletion"
        :modal="true"
    >
        <div class="confirmation-content">
            <i
                class="pi pi-exclamation-triangle mr-3"
                style="font-size: 2rem"
            />
            <span v-if="selectedBookingToDelete">
                Are you sure you want to delete booking
                <strong class="text-red-500">{{
                    selectedBookingToDelete.BookingCode
                }}</strong
                >?
            </span>
        </div>
        <template #footer>
            <Button
                label="No"
                icon="pi pi-times"
                class="p-button-primary"
                @click="cancelDelete"
            />
            <Button
                label="Yes"
                icon="pi pi-check"
                class="p-button-danger"
                @click="executeDelete"
            />
        </template>
    </Dialog>
    <toast />
</template>
