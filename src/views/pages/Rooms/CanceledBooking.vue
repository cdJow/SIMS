<script setup>
import { useToast } from "primevue/usetoast";
import { computed, onBeforeMount, ref } from "vue";
import { fetchCancelledBookings } from "@/api/auth";

// Filters
const filters = ref({
    searchQuery: "",
    searchDate: null,
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

        const matchesDate = !filters.value.searchDate || 
            (booking.cancellationDate && 
             new Date(booking.cancellationDate).toDateString() === new Date(filters.value.searchDate).toDateString());

        const roomTypeMatches = !filters.value.roomType || booking.roomType === filters.value.roomType;

        return searchMatches && matchesDate && roomTypeMatches;
    });
});

// Clear filters
const clearFilters = () => {
    filters.value = { searchQuery: "", searchDate: null, roomType: null };
};

const toast = useToast();

const selectedBooking = ref(null);
const showViewDialog = ref(false);
const handleClick = (event, bookingData) => {
    selectedBooking.value = bookingData;
    showViewDialog.value = true;
};
</script>

<template>
    <div class="card p-4 rounded-lg shadow-sm flex flex-col max-h-[calc(100vh-8rem)]">
        <div class="text-xl font-semibold mb-4 flex-shrink-0">Canceled Bookings</div>

        <!-- Enhanced Filter Section -->
        <div class="flex-shrink-0">
            <div class="mb-6">
                <div class="flex flex-row gap-4 items-center">
                    <Button
                        type="button"
                        icon="pi pi-filter-slash"
                        label="Clear"
                        outlined
                        @click="clearFilters"
                    />
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText
                            placeholder="Keyword Search"
                            class="w-80"
                            v-model="filters.searchQuery"
                        />
                    </IconField>
                    
                    <!-- Single Date Filter -->
                    <DatePicker
                        v-model="filters.searchDate"
                        :manualInput="false"
                        dateFormat="mm/dd/yy"
                        placeholder="Search by Cancellation Date"
                        :showIcon="true"
                        iconDisplay="input"
                        class="w-64"
                    />
                </div>
            </div>

            <!-- DataTable and other content -->
        </div>
        
        <!-- Scrollable Content Area -->
        <div class="overflow-y-auto flex-1 pr-2">
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
                class="mt-6"
                :loading="loading"
                :paginator="true"
                :rows="10"
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

            <!-- Action Column -->
            <Column header="Action" :style="{ minWidth: '100px' }">
                <template #body="{ data }">
                    <Button
                        icon="pi pi-info-circle"
                        class="p-button-info"
                        outlined
                        rounded
                        @click="handleClick($event, data)"
                        v-tooltip="'View Guest Info'"
                    />
                </template>
            </Column>
        </DataTable>
        </div>

        <!-- View Dialog -->
        <Dialog 
            v-model:visible="showViewDialog" 
            modal 
            header="Cancelled Booking Details" 
            :style="{ width: '90vw', maxWidth: '1200px' }"
            class="p-fluid"
            :dismissableMask="true"
        >
            <div class="p-6" v-if="selectedBooking">
                <!-- Guest Header Section -->
                <div class="mb-6 pb-4 border-b border-gray-200 dark:border-gray-600">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        {{ selectedBooking.guestName }}
                    </h2>
                    <div class="flex flex-wrap gap-4 items-center">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-home text-blue-500"></i>
                            <span class="text-gray-700 dark:text-gray-300">{{ selectedBooking.roomType }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-building text-blue-500"></i>
                            <span class="text-gray-700 dark:text-gray-300">Room {{ selectedBooking.roomNumber }}</span>
                        </div>
                        <Tag
                            :value="`${selectedBooking.selectedHours}hrs`"
                            severity="info"
                        />
                        <div class="flex items-center gap-2">
                            <i class="pi pi-money-bill text-green-500"></i>
                            <span class="font-semibold text-gray-900 dark:text-gray-100">
                                ₱{{ parseFloat(selectedBooking.selectedRate || 0).toLocaleString() }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Main Content Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Left Column - Booking Info -->
                    <div class="space-y-4">
                        <!-- Booking Details Card -->
                        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                <i class="pi pi-bookmark text-blue-500"></i>
                                Booking Information
                            </h3>
                            <div class="space-y-2">
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600 dark:text-gray-400">Booking Code:</span>
                                    <span class="font-medium text-gray-900 dark:text-gray-100">{{ selectedBooking.BookingCode }}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600 dark:text-gray-400">Room Number:</span>
                                    <span class="font-medium text-gray-900 dark:text-gray-100">{{ selectedBooking.roomNumber }}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600 dark:text-gray-400">Room Type:</span>
                                    <span class="font-medium text-gray-900 dark:text-gray-100">{{ selectedBooking.roomType }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Contact Information Card -->
                        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                <i class="pi pi-user text-blue-500"></i>
                                Contact Information
                            </h3>
                            <div class="space-y-2">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-phone text-gray-500"></i>
                                    <span class="text-gray-700 dark:text-gray-300">{{ selectedBooking.cellphone || 'N/A' }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-envelope text-gray-500"></i>
                                    <span class="text-gray-700 dark:text-gray-300">{{ selectedBooking.guest_email || 'N/A' }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Booking Created -->
                        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                <i class="pi pi-calendar text-blue-500"></i>
                                Booking Created
                            </h3>
                            <div class="text-gray-700 dark:text-gray-300">
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

                    <!-- Right Column - Schedule & Cancellation -->
                    <div class="space-y-4">
                        <!-- Scheduled Times -->
                        <div v-if="selectedBooking.check_in_datetime" class="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                            <h3 class="font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                                <i class="pi pi-clock"></i>
                                Scheduled Times
                            </h3>
                            <div class="space-y-2">
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-700 dark:text-gray-300">Check-in:</span>
                                    <span class="font-medium text-gray-900 dark:text-gray-100">
                                        {{ new Date(selectedBooking.check_in_datetime).toLocaleString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric',
                                            hour12: true
                                        }) }}
                                    </span>
                                </div>
                                <div v-if="selectedBooking.check_out_datetime" class="flex justify-between items-center">
                                    <span class="text-gray-700 dark:text-gray-300">Check-out:</span>
                                    <span class="font-medium text-gray-900 dark:text-gray-100">
                                        {{ new Date(selectedBooking.check_out_datetime).toLocaleString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric',
                                            hour12: true
                                        }) }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Cancellation Status -->
                        <div class="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
                            <h3 class="font-semibold text-red-700 dark:text-red-300 mb-3 flex items-center gap-2">
                                <i class="pi pi-times-circle"></i>
                                Cancellation Status
                            </h3>
                            <div class="space-y-2">
                                <div class="flex items-center gap-2 text-red-700 dark:text-red-300">
                                    <span class="font-medium">Status: Cancelled</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-700 dark:text-gray-300">Cancelled on:</span>
                                    <span class="font-medium text-red-600 dark:text-red-400">
                                        {{ formatCancellation(selectedBooking.cancellationDate) }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Rate Information -->
                        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                <i class="pi pi-credit-card text-green-500"></i>
                                Rate Information
                            </h3>
                            <div class="space-y-2">
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600 dark:text-gray-400">Selected Hours:</span>
                                    <Tag
                                        :value="`${selectedBooking.selectedHours}hrs`"
                                        severity="info"
                                    />
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600 dark:text-gray-400">Rate:</span>
                                    <span class="font-semibold text-gray-900 dark:text-gray-100">
                                        ₱{{ parseFloat(selectedBooking.selectedRate || 0).toLocaleString() }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>
    </div>
</template>
