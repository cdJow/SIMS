<script setup>
import { useToast } from "primevue/usetoast";
import { computed, onBeforeMount, ref } from "vue";
import { fetchCancelledBookings, deleteCancelledBooking } from "@/api/auth";

// Filters
const filters = ref({
    searchQuery: "",
    dateRange: [null, null],
    roomType: null,
});

// State
const canceledBookings = ref([]);
const loading = ref(false);
const error = ref(null);

async function loadCancelled() {
    loading.value = true;
    error.value = null;
    try {
        const res = await fetchCancelledBookings();
        const items = res.data || [];
        // Normalize date objects for table rendering
        canceledBookings.value = items.map((b) => ({
            ...b,
            checkInDate: b.check_in_datetime ? new Date(b.check_in_datetime) : null,
            checkOutDate: b.check_out_datetime ? new Date(b.check_out_datetime) : null,
            cancellationDate: b.cancellationDate ? new Date(b.cancellationDate) : null,
        }));
    } catch (e) {
        error.value = e?.message || "Failed to load cancelled bookings";
    } finally {
        loading.value = false;
    }
}

onBeforeMount(loadCancelled);

// Filtering

// Format date/time in 12-hour with am/pm (Asia/Manila)
function formatCancellation(dt) {
    if (!dt) return "N/A";
    const d = dt instanceof Date ? dt : new Date(dt);
    if (isNaN(d.getTime())) return "N/A";
    let s = d.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Manila",
    });
    // Lowercase meridiem only
    s = s.replace(/\bAM\b/, "am").replace(/\bPM\b/, "pm");
    return s;
}

const filteredBookings = computed(() => {
    return canceledBookings.value.filter((booking) => {
        const q = (filters.value.searchQuery || "").toLowerCase();
        const searchMatches =
            String(booking.BookingCode || "").toLowerCase().includes(q) ||
            String(booking.guestName || "").toLowerCase().includes(q);

        const [start, end] = filters.value.dateRange || [];
        const startDate = start ? new Date(start) : null;
        const endDate = end ? new Date(end) : null;
        const cDate = booking.cancellationDate instanceof Date ? booking.cancellationDate : (booking.cancellationDate ? new Date(booking.cancellationDate) : null);
        const dateMatches = !startDate || (!cDate ? false : (cDate >= startDate && (!endDate || cDate <= endDate)));

        const roomTypeMatches = !filters.value.roomType || booking.roomType === filters.value.roomType;

        return searchMatches && dateMatches && roomTypeMatches;
    });
});

// Clear filters
const clearFilters = () => {
    filters.value = { searchQuery: "", dateRange: [null, null], roomType: null };
};

const toast = useToast();
const deleteDialogVisible = ref(false);
const selectedBookingToDelete = ref(null);

const confirmDelete = (booking) => {
    selectedBookingToDelete.value = booking;
    deleteDialogVisible.value = true;
};

const executeDelete = async () => {
    if (!selectedBookingToDelete.value) return;
    try {
        await deleteCancelledBooking(selectedBookingToDelete.value.id);
        canceledBookings.value = canceledBookings.value.filter(
            (b) => b.id !== selectedBookingToDelete.value.id
        );
        toast.add({ severity: "success", summary: "Deleted", detail: "Cancelled booking deleted", life: 2500 });
    } catch (e) {
        toast.add({ severity: "error", summary: "Error", detail: e?.message || "Failed to delete", life: 3000 });
    } finally {
        deleteDialogVisible.value = false;
        selectedBookingToDelete.value = null;
    }
};

const cancelDelete = () => {
    deleteDialogVisible.value = false;
    selectedBookingToDelete.value = null;
};

const op = ref();
const selectedBooking = ref(null);
const handleClick = (event, bookingData) => {
    selectedBooking.value = bookingData;
    op.value?.toggle(event);
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
        
        <!-- Empty State -->
        <div v-if="!loading && (!filteredBookings || filteredBookings.length === 0)" 
             class="text-center py-12 mt-6">
            <div class="flex flex-col items-center gap-4">
                <i class="pi pi-times-circle text-6xl text-gray-300 dark:text-gray-600"></i>
                <div class="space-y-2">
                    <h3 class="text-xl font-semibold text-gray-600 dark:text-gray-400">No Canceled Bookings</h3>
                    <p class="text-gray-500 dark:text-gray-500 max-w-md">
                        There are currently no canceled bookings to manage. 
                        <br>This could mean fewer cancellations or all records have been handled!
                    </p>
                </div>
                <Button
                    icon="pi pi-refresh"
                    label="Refresh"
                    class="p-button-outlined"
                    @click="loadCancelled"
                    :loading="loading"
                />
            </div>
        </div>

        <!-- Data Table (only show when there's data) -->
        <DataTable
            v-if="!loading && filteredBookings && filteredBookings.length > 0"
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
                        {{ formatCancellation(data.cancellationDate) }}
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
                        {{ selectedBooking.contactInfo || "N/A" }}
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
