<script setup>
import { FilterMatchMode, FilterOperator } from "@primevue/core/api";
import { onBeforeMount, ref, computed } from "vue";
import { fetchCheckInList } from "@/api/auth";

const reservations = ref(null);
const filters = ref(null);
const loading = ref(false);

// Computed property for filtered reservations
const filteredReservations = computed(() => {
    if (!reservations.value) return [];
    
    let filtered = reservations.value;
    
    // Apply global search filter
    if (filters.value?.global?.value) {
        const globalSearch = filters.value.global.value.toLowerCase();
        filtered = filtered.filter(reservation => 
            reservation.BookingCode.toLowerCase().includes(globalSearch) ||
            reservation.guestName.toLowerCase().includes(globalSearch) ||
            reservation.roomNumber.toString().includes(globalSearch)
        );
    }
    
    // Apply date filter
    if (filters.value?.checkInDate?.value) {
        const filterDate = new Date(filters.value.checkInDate.value);
        filtered = filtered.filter(reservation => {
            const checkInDate = new Date(reservation.checkInDate);
            return checkInDate.toDateString() === filterDate.toDateString();
        });
    }
    
    return filtered;
});

async function loadCheckIns() {
    try {
        loading.value = true;
        const response = await fetchCheckInList();
        
        if (!response.data || response.data.error) {
            throw new Error(response.data?.error || 'Failed to load check-in list');
        }
        
        reservations.value = response.data.map(booking => ({
            BookingCode: booking.room_code,
            guestName: booking.guest_name,
            roomNumber: booking.room_number,
            roomType: booking.room_type_name,
            selectedHours: booking.selected_hours,
            selectedRate: booking.selected_rate,
            checkInDate: new Date(booking.check_in_datetime),
            checkOutDate: new Date(booking.check_out_datetime),
            // Payment data from checkin_payments table
            paymentData: {
                roomRate: parseFloat(booking.selected_rate) || 0, // Use selected_rate as the base room rate
                extrasTotal: parseFloat(booking.extras_total) || 0,
                amenitiesTotal: parseFloat(booking.amenities_total) || 0,
                damageCharges: parseFloat(booking.damage_charges) || 0,
                extendHours: parseInt(booking.extend_hours) || 0,
                extendAmount: parseFloat(booking.extend_amount) || 0,
                depositAmount: parseFloat(booking.deposit_amount) || 0,
                totalDue: parseFloat(booking.total_due) || 0,
                balanceDue: parseFloat(booking.total_due) || 0, // Check-in list shows pending payments
                discountName: booking.discount_name || null,
                discountPercent: parseFloat(booking.discount_percent) || 0,
                discountAmount: parseFloat(booking.discount_amount) || 0, // Add manual discount amount
                additionalPersonCount: parseInt(booking.additional_person_count) || 0,
                additionalPersonTotal: parseFloat(booking.additional_person_total) || 0
            },
            paymentStatus: {
                ratePaid: false, // Amount received not tracked in list view since it's in localStorage
                depositAmount: booking.deposit_amount,
                depositStatus: booking.deposit_amount > 0 ? "Paid" : "Pending",
                balanceDue: booking.total_due, // Show full total due since amount received is tracked per-room
            },
            contactInfo: {
                cellphone: booking.cellphone || 'N/A',
                email: booking.guest_email || 'N/A'
            },
            checkInStatus: booking.status,
            notes: booking.note,
            extras_total: parseFloat(booking.extras_total) || 0,
            amenities_total: parseFloat(booking.amenities_total) || 0,
            // Parse rental amenities from "Amenity Name - Price" format
            rentalAmenities: booking.rental_amenities ? 
                booking.rental_amenities.split(',').map(item => {
                    const trimmed = item.trim();
                    const parts = trimmed.split(' - ');
                    if (parts.length >= 2) {
                        return {
                            amenity_name: parts[0].trim(),
                            unit_rental_price: parseFloat(parts[1].trim()) || 0
                        };
                    }
                    return { amenity_name: trimmed, unit_rental_price: 0 };
                }).filter(a => a.amenity_name) : [],
            // Parse consumables from "Product Name - Quantity x Price = Total" format
            consumables: booking.consumable_products ? 
                booking.consumable_products.split('||').map(item => {
                    const trimmed = item.trim();
                    
                    // Parse format: "Product Name - Quantity x Price = Total"
                    const mainParts = trimmed.split(' - ');
                    if (mainParts.length < 2) {
                        return null;
                    }
                    
                    const productName = mainParts[0];
                    const rest = mainParts[1]; // "Quantity x Price = Total"
                    
                    // Parse the "Quantity x Price = Total" part
                    const match = rest.match(/^(\d+(?:,\d+)?(?:\.\d+)?)\s*x\s*(\d+(?:,\d+)?(?:\.\d+)?)\s*=\s*(\d+(?:,\d+)?(?:\.\d+)?)$/);
                    if (match) {
                        return {
                            product_name: productName,
                            quantity: parseFloat(match[1].replace(/,/g, '')),
                            price: parseFloat(match[2].replace(/,/g, '')),
                            total_item_cost: parseFloat(match[3].replace(/,/g, ''))
                        };
                    }
                    return null;
                }).filter(c => c !== null) : [],
            checkInStatus: booking.status
        }));
    } catch (error) {
        console.error("Error loading check-in list:", error);
        if (error.response) {
            console.error("Server response:", error.response.data);
        }
    } finally {
        loading.value = false;
    }
}

onBeforeMount(() => {
    loadCheckIns();
    initFilters();
});

const showDetailsDialog = ref(false);
const selectedReservation = ref(null);

const handleClick = (reservation) => {
    selectedReservation.value = reservation;
    showDetailsDialog.value = true;
};

function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        BookingCode: {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
        },
        checkInDate: { value: null, matchMode: FilterMatchMode.DATE_IS }
    };
}

function formatCurrency(value) {
    return value.toLocaleString("en-US", {
        style: "currency",
        currency: "PHP",
    });
}

const calculateDiscountedRate = (originalRate, paymentData) => {
    if (!originalRate) return 0
    
    // Manual discount takes precedence
    if (paymentData.discountAmount > 0) {
        return Math.max(0, originalRate - paymentData.discountAmount)
    }
    
    // Percentage discount
    if (paymentData.discountPercent > 0) {
        const discountAmount = (originalRate * paymentData.discountPercent) / 100
        return Math.max(0, originalRate - discountAmount)
    }
    
    return originalRate
}
</script>

<!-- Keep the rest of the template and style sections exactly the same -->

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Check-In List</div>

        <!-- Search -->
        <div class="flex gap-2 mb-3 items-center">
            <Button
                type="button"
                icon="pi pi-filter-slash"
                label="Clear"
                outlined
                @click="initFilters"
            />
            <IconField class="p-input-icon-left">
                <InputText 
                    v-model="filters['global'].value" 
                    placeholder="Search room code" 
                    style="width: 200px" 
                />
            </IconField>
            <DatePicker  
                v-model="filters['checkInDate'].value"
                placeholder="Select Date"
                showIcon
                dateFormat="mm/dd/yy"
                style="width: 200px"
            />
        </div>
        
        <!-- Empty State -->
        <div v-if="!loading && (!filteredReservations || filteredReservations.length === 0)" 
             class="text-center py-12 mt-6">
            <div class="flex flex-col items-center gap-4">
                <i class="pi pi-calendar-times text-6xl text-gray-300 dark:text-gray-600"></i>
                <div class="space-y-2">
                    <h3 class="text-xl font-semibold text-gray-600 dark:text-gray-400">No Check-ins Today</h3>
                    <p class="text-gray-500 dark:text-gray-500 max-w-md">
                        There are currently no guests scheduled to check in. 
                        <br>Check back later or adjust your date filter to view other periods.
                    </p>
                </div>
                <Button
                    icon="pi pi-refresh"
                    label="Refresh"
                    class="p-button-outlined"
                    @click="loadCheckIns"
                    :loading="loading"
                />
            </div>
        </div>

        <!-- Data Table (only show when there's data) -->
        <DataTable
            v-if="!loading && filteredReservations && filteredReservations.length > 0"
            :value="filteredReservations"
            scrollable
            scrollHeight="600px"
            class="mt-6"
        >
            <!-- Visible Columns -->
            <Column
                field="roomNumber"
                header="Room Number"
                style="min-width: 120px"
            ></Column>

            <Column
                field="BookingCode"
                header="Room Code"
                style="min-width: 150px"
            ></Column>

            <Column
                field="checkInDate"
                header="Check-In Date/Time"
                style="min-width: 200px"
                class="text-green-500"
            >
                <template #body="{ data }">
                    {{ data.checkInDate.toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                    }) }}
                </template>
            </Column>

            <!-- Action Column with Dialog -->
            <Column header="Actions" style="min-width: 100px">
                <template #body="{ data }">
                    <Button
                        icon="pi pi-info-circle"
                        class="p-button-info"
                        outlined
                        rounded
                        @click="handleClick(data)"
                    />
                </template>
            </Column>
        </DataTable>

        <!-- Details Dialog -->
        <Dialog
            v-model:visible="showDetailsDialog"
            modal
            header="Check-In Details"
            :style="{ width: '90vw', maxWidth: '1200px' }"
            class="p-fluid"
            :dismissableMask="true"
        >
            <div class="p-6" v-if="selectedReservation">
                <!-- Guest Header Section -->
                <div class="mb-6 pb-4 border-b border-gray-200 dark:border-gray-600">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        {{ selectedReservation.guestName }}
                    </h2>
                    <div class="flex flex-wrap gap-4 items-center">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-home text-blue-500"></i>
                            <span class="text-gray-700 dark:text-gray-300">{{ selectedReservation.roomType }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-door-open text-purple-500"></i>
                            <span class="text-gray-700 dark:text-gray-300">Room {{ selectedReservation.roomNumber }}</span>
                        </div>
                        <Tag
                            :value="`${selectedReservation.selectedHours}hrs`"
                            severity="info"
                        />
                        <div class="flex items-center gap-2">
                            <i class="pi pi-money-bill text-green-500"></i>
                            <span class="font-semibold text-gray-900 dark:text-gray-100">
                                {{ formatCurrency(selectedReservation.selectedRate) }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Main Content Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Left Column - Booking & Payment Info -->
                    <div class="space-y-4">
                        <!-- Contact Information Card -->
                        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                <i class="pi pi-user text-blue-500"></i>
                                Contact Information
                            </h3>
                            <div class="space-y-2">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-phone text-gray-500"></i>
                                    <span class="text-gray-700 dark:text-gray-300">{{ selectedReservation.contactInfo.cellphone || 'N/A' }}</span>
                                </div>
                                <div v-if="selectedReservation.contactInfo.email" class="flex items-center gap-2">
                                    <i class="pi pi-envelope text-gray-500"></i>
                                    <span class="text-gray-700 dark:text-gray-300">{{ selectedReservation.contactInfo.email }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Check-in/Check-out Times -->
                        <div v-if="selectedReservation.checkInDate || selectedReservation.checkOutDate" class="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                            <h3 class="font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                                <i class="pi pi-clock"></i>
                                Check-in/Expected Checkout
                            </h3>
                            <div class="space-y-2">
                                <div v-if="selectedReservation.checkInDate" class="flex justify-between items-center">
                                    <span class="text-gray-700 dark:text-gray-300">Check-in:</span>
                                    <span class="font-medium text-gray-900 dark:text-gray-100">{{ selectedReservation.checkInDate.toLocaleString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                    }) }}</span>
                                </div>
                                <div v-if="selectedReservation.checkOutDate" class="flex justify-between items-center">
                                    <span class="text-gray-700 dark:text-gray-300">Expected Checkout:</span>
                                    <span class="font-medium text-gray-900 dark:text-gray-100">{{ selectedReservation.checkOutDate.toLocaleString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                    }) }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Payment Summary -->
                        <div v-if="selectedReservation.paymentData" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                <i class="pi pi-credit-card text-green-500"></i>
                                Payment Summary
                            </h3>
                            <div class="space-y-2">
                                <!-- Discount Information -->
                                <div v-if="selectedReservation.paymentData.discountName || selectedReservation.paymentData.discountAmount > 0" class="bg-green-50 dark:bg-green-900/30 p-3 rounded mb-3">
                                    <!-- Percentage Discount -->
                                    <div v-if="selectedReservation.paymentData.discountName && selectedReservation.paymentData.discountPercent > 0" class="flex items-center justify-between mb-2">
                                        <div class="flex items-center gap-2">
                                            <i class="pi pi-percentage text-green-600"></i>
                                            <span class="font-medium text-green-700 dark:text-green-300">{{ selectedReservation.paymentData.discountName }}</span>
                                        </div>
                                        <span class="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                            {{ selectedReservation.paymentData.discountPercent }}% off
                                        </span>
                                    </div>
                                    <!-- Manual Discount -->
                                    <div v-if="selectedReservation.paymentData.discountAmount > 0" class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <i class="pi pi-money-bill text-green-600"></i>
                                            <span class="font-medium text-green-700 dark:text-green-300">Manual Discount</span>
                                        </div>
                                        <span class="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                            {{ formatCurrency(selectedReservation.paymentData.discountAmount) }}
                                        </span>
                                    </div>
                                </div>
                                
                                <!-- Payment Breakdown -->
                                <div class="space-y-2">
                                    <div class="flex justify-between items-center">
                                        <span class="text-gray-600 dark:text-gray-400">Room Rate:</span>
                                        <div class="text-right">
                                            <!-- Show discount calculation if there's a discount -->
                                            <div v-if="selectedReservation.paymentData.discountAmount > 0 || (selectedReservation.paymentData.discountName && selectedReservation.paymentData.discountPercent > 0)" class="flex flex-col items-end">
                                                <!-- Original price with red strikethrough -->
                                                <span class="text-sm text-red-500 dark:text-red-400 line-through">
                                                    {{ formatCurrency(selectedReservation.paymentData.roomRate) }}
                                                </span>
                                                <!-- Discounted price -->
                                                <span class="font-medium text-gray-900 dark:text-gray-100">
                                                    {{ formatCurrency(calculateDiscountedRate(selectedReservation.paymentData.roomRate, selectedReservation.paymentData)) }}
                                                </span>
                                                <!-- Discount amount/percentage -->
                                                <span class="text-xs text-green-600 dark:text-green-400">
                                                    <span v-if="selectedReservation.paymentData.discountAmount > 0">-{{ formatCurrency(selectedReservation.paymentData.discountAmount) }}</span>
                                                    <span v-else-if="selectedReservation.paymentData.discountPercent > 0">-{{ selectedReservation.paymentData.discountPercent }}%</span>
                                                </span>
                                            </div>
                                            <!-- No discount - show regular price -->
                                            <span v-else class="font-medium text-gray-900 dark:text-gray-100">
                                                {{ formatCurrency(selectedReservation.paymentData.roomRate) }}
                                            </span>
                                        </div>
                                    </div>
                                    <div v-if="selectedReservation.paymentData.extendAmount > 0" class="flex justify-between items-center">
                                        <div class="flex items-center gap-2">
                                            <span class="text-gray-600 dark:text-gray-400">Extend Charges:</span>
                                            <span v-if="selectedReservation.paymentData.extendHours > 0" class="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                                                {{ selectedReservation.paymentData.extendHours }}h
                                            </span>
                                        </div>
                                        <span class="font-medium text-gray-900 dark:text-gray-100">{{ formatCurrency(selectedReservation.paymentData.extendAmount) }}</span>
                                    </div>
                                    <div v-if="selectedReservation.paymentData.extrasTotal > 0" class="flex justify-between items-center">
                                        <span class="text-gray-600 dark:text-gray-400">Consumables:</span>
                                        <span class="font-medium text-gray-900 dark:text-gray-100">{{ formatCurrency(selectedReservation.paymentData.extrasTotal) }}</span>
                                    </div>
                                    <div v-if="selectedReservation.paymentData.amenitiesTotal > 0" class="flex justify-between items-center">
                                        <span class="text-gray-600 dark:text-gray-400">Amenities:</span>
                                        <span class="font-medium text-gray-900 dark:text-gray-100">{{ formatCurrency(selectedReservation.paymentData.amenitiesTotal) }}</span>
                                    </div>
                                    <div v-if="selectedReservation.paymentData.additionalPersonCount > 0" class="flex justify-between items-center">
                                        <div class="flex items-center gap-2">
                                            <span class="text-gray-600 dark:text-gray-400">Additional Person:</span>
                                            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                                {{ selectedReservation.paymentData.additionalPersonCount }} person{{ selectedReservation.paymentData.additionalPersonCount > 1 ? 's' : '' }}
                                            </span>
                                        </div>
                                        <span class="font-medium text-gray-900 dark:text-gray-100">{{ formatCurrency(selectedReservation.paymentData.additionalPersonTotal) }}</span>
                                    </div>
                                    <div v-if="selectedReservation.paymentData.damageCharges > 0" class="flex justify-between items-center">
                                        <span class="text-red-600 dark:text-red-400">Damage Charges:</span>
                                        <span class="font-medium text-red-600 dark:text-red-400">{{ formatCurrency(selectedReservation.paymentData.damageCharges) }}</span>
                                    </div>
                                
                                    <div v-if="selectedReservation.paymentData.depositAmount > 0" class="flex justify-between items-center">
                                        <span class="text-blue-600 dark:text-blue-400">Deposit Paid:</span>
                                        <span class="font-medium text-blue-600 dark:text-blue-400">{{ formatCurrency(selectedReservation.paymentData.depositAmount) }}</span>
                                    </div>
                                    <div class="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between items-center">
                                        <span class="font-semibold text-gray-900 dark:text-gray-100">Total Due:</span>
                                        <span class="font-bold text-lg text-gray-900 dark:text-gray-100">{{ formatCurrency(selectedReservation.paymentData.totalDue) }}</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-gray-600 dark:text-gray-400">Payment Status:</span>
                                        <span class="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                            <i class="pi pi-check-circle"></i>
                                            Fully Paid
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
                            <div class="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                                <i class="pi pi-info-circle"></i>
                                <span class="font-medium">No check-in payment recorded yet</span>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column - Items & Services -->
                    <div class="space-y-4">
                        <!-- Consumables -->
                        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                <i class="pi pi-shopping-cart text-orange-500"></i>
                                Consumables
                            </h3>
                            <div v-if="selectedReservation.consumables && selectedReservation.consumables.length > 0"
                                 class="space-y-2 max-h-40 overflow-y-auto">
                                <div v-for="(consumable, idx) in selectedReservation.consumables" 
                                     :key="idx"
                                     class="flex items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div class="flex-1">
                                        <div class="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                            {{ consumable.product_name }}
                                        </div>
                                        <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span class="bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">
                                                Qty: {{ consumable.quantity }}
                                            </span>
                                            <span>@ {{ formatCurrency(consumable.price) }}</span>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="font-semibold text-orange-600 dark:text-orange-400">
                                            {{ formatCurrency(consumable.total_item_cost) }}
                                        </div>
                                    </div>
                                </div>
                                <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                                    <span class="font-medium text-gray-700 dark:text-gray-300">Total Consumables:</span>
                                    <span class="font-bold text-orange-600 dark:text-orange-400">
                                        {{ formatCurrency(selectedReservation.paymentData.extrasTotal) }}
                                    </span>
                                </div>
                            </div>
                            <div v-else class="text-center py-4">
                                <i class="pi pi-shopping-cart text-4xl text-gray-300 dark:text-gray-600 mb-2"></i>
                                <p class="text-gray-500 dark:text-gray-400 text-sm">No consumables ordered</p>
                            </div>
                        </div>

                        <!-- Rented Amenities -->
                        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                <i class="pi pi-box text-purple-500"></i>
                                Rented Amenities
                            </h3>
                            <div v-if="selectedReservation.rentalAmenities && selectedReservation.rentalAmenities.length > 0" 
                                 class="space-y-2 max-h-40 overflow-y-auto">
                                <div v-for="(amenity, index) in selectedReservation.rentalAmenities" 
                                     :key="index"
                                     class="flex items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div class="flex-1">
                                        <div class="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                            {{ amenity.amenity_name }}
                                        </div>
                                    </div>
                                    <div class="font-semibold text-purple-600 dark:text-purple-400">
                                        {{ formatCurrency(amenity.unit_rental_price) }}
                                    </div>
                                </div>
                                <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                                    <span class="font-medium text-gray-700 dark:text-gray-300">Total Amenities:</span>
                                    <span class="font-bold text-purple-600 dark:text-purple-400">
                                        {{ formatCurrency(selectedReservation.paymentData.amenitiesTotal) }}
                                    </span>
                                </div>
                            </div>
                            <div v-else class="text-center py-4">
                                <i class="pi pi-box text-4xl text-gray-300 dark:text-gray-600 mb-2"></i>
                                <p class="text-gray-500 dark:text-gray-400 text-sm">No amenities rented</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Notes (Full Width) -->
                <div v-if="selectedReservation.notes" class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <label class="font-medium text-gray-700 dark:text-gray-300">Notes:</label>
                    <div class="p-2 bg-gray-100 dark:bg-gray-700 rounded mt-1 text-gray-800 dark:text-gray-200">
                        {{ selectedReservation.notes || "No special notes" }}
                    </div>
                </div>
            </div>
        </Dialog>
    </div>
</template>

<style scoped>
</style>
