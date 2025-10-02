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
        
        <!-- Empty State -->
        <div v-if="!loading && (!filteredBookings || filteredBookings.length === 0)" 
             class="text-center py-12 mt-6">
            <div class="flex flex-col items-center gap-4">
                <i class="pi pi-times-circle text-6xl text-gray-300 dark:text-gray-600"></i>
                <div class="space-y-2">
                    <h3 class="text-xl font-semibold text-gray-600 dark:text-gray-400">No Canceled Bookings</h3>
                    <p class="text-gray-500 dark:text-gray-500 max-w-md">
                        There are currently no canceled bookings to display. 
                        <br>This is great news - it means fewer cancellations!
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
            
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Popover Overlay -->
        <Popover ref="op">
            <div class="p-4" v-if="selectedBooking">
                <!-- Main Horizontal Container -->
                <div class="flex flex-row gap-4">
                    <!-- Left Column - Guest & Booking Info -->
                    <div class="flex-1 flex flex-col gap-3 min-w-[200px]">
                        <!-- Guest Name -->
                        <div class="font-bold text-lg border-b pb-2">
                            {{ selectedBooking.guestName }}
                        </div>

                        <!-- Booking Details -->
                        <div class="flex flex-col gap-2">
                            <div>
                                <label class="font-medium">Booking Code:</label>
                                <div class="mt-1">
                                    {{ selectedBooking.BookingCode }}
                                </div>
                            </div>
                            <div>
                                <label class="font-medium">Room Number:</label>
                                <div class="mt-1">
                                    {{ selectedBooking.roomNumber }}
                                </div>
                            </div>
                            <div>
                                <label class="font-medium">Room Type:</label>
                                <div class="mt-1">
                                    {{ selectedBooking.roomType }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Middle Column - Booking Details -->
                    <div class="flex-1 flex flex-col gap-3 min-w-[200px]">
                        <!-- Selected Hours & Rate -->
                        <div class="flex flex-col gap-2">
                            <div>
                                <label class="font-medium">Selected Hours:</label>
                                <Tag
                                    :value="`${selectedBooking.selectedHours}hrs`"
                                    severity="info"
                                    class="mt-1"
                                />
                            </div>
                            <div>
                                <label class="font-medium">Selected Rate:</label>
                                <div class="flex items-center gap-1 mt-1">
                                    <i class="pi pi-money-bill text-blue-500"></i>
                                    <span>₱{{ parseFloat(selectedBooking.selectedRate || 0).toLocaleString() }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Scheduled Times -->
                        <div class="flex flex-col gap-2" v-if="selectedBooking.check_in_datetime">
                            <div>
                                <label class="font-medium">Scheduled Check-In:</label>
                                <div class="mt-1 text-sm text-gray-600">
                                    {{ new Date(selectedBooking.check_in_datetime).toLocaleString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: 'numeric',
                                        hour12: true
                                    }) }}
                                </div>
                            </div>
                            <div v-if="selectedBooking.check_out_datetime">
                                <label class="font-medium">Scheduled Check-Out:</label>
                                <div class="mt-1 text-sm text-gray-600">
                                    {{ new Date(selectedBooking.check_out_datetime).toLocaleString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: 'numeric',
                                        hour12: true
                                    }) }}
                                </div>
                            </div>
                        </div>

                        <!-- Cancellation Status -->
                        <div class="bg-red-50  rounded">
                            <div class="flex items-center gap-2 text-red-700">
                                <i class="pi pi-times-circle"></i>
                                <span class="text-sm font-medium">Booking Cancelled</span>
                            </div>
                            <div class="text-xs text-red-600 mt-1">
                                {{ formatCancellation(selectedBooking.cancellationDate) }}
                            </div>
                        </div>
                    </div>

                    <!-- Right Column - Contact Info -->
                    <div class="flex-1 flex flex-col gap-3 min-w-[200px]">
                        <!-- Contact Information -->
                        <div class="flex flex-col gap-2">
                            <div>
                                <label class="font-medium">Contact Info:</label>
                                <div class="mt-1 flex flex-col gap-1">
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-phone text-blue-500"></i>
                                        {{ selectedBooking.cellphone || 'N/A' }}
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-envelope text-blue-500"></i>
                                        {{ selectedBooking.guest_email || 'N/A' }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Booking Dates -->
                        <div class="bg-gray-50 rounded">
                            <div class="flex items-center gap-2 text-gray-700 mb-2">
                                <i class="pi pi-calendar"></i>
                                <span class="text-sm font-medium">Booking Created</span>
                            </div>
                            <div class="text-xs text-gray-600">
                                {{ selectedBooking.created_at ? new Date(selectedBooking.created_at).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: 'numeric',
                                    hour12: true
                                }) : 'N/A' }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Popover>
    </div>

     <toast />
</template>
