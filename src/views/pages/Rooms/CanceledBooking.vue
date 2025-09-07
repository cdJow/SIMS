<script setup>
import { useToast } from "primevue/usetoast";
import { computed, onBeforeMount, ref } from "vue";
import { fetchCancelledBookings } from "@/api/auth";

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

     <toast />
</template>
