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
    
    // Apply time filter
    if (filters.value?.checkInTime?.value) {
        const filterTime = new Date(filters.value.checkInTime.value);
        const filterHour = filterTime.getHours();
        const filterMinute = filterTime.getMinutes();
        
        filtered = filtered.filter(reservation => {
            const checkInDate = new Date(reservation.checkInDate);
            const checkInHour = checkInDate.getHours();
            const checkInMinute = checkInDate.getMinutes();
            
            // Match exact hour and minute
            return checkInHour === filterHour && checkInMinute === filterMinute;
        });
    }
    
    return filtered;
});

async function loadCheckIns() {
    try {
        loading.value = true;
        console.log('Fetching check-in list...');
        const response = await fetchCheckInList();
        console.log('Raw response:', response);
        
        if (!response.data || response.data.error) {
            console.error('Server error:', response.data?.error);
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
                roomRate: parseFloat(booking.room_rate) || parseFloat(booking.selected_rate) || 0,
                extrasTotal: parseFloat(booking.extras_total) || 0,
                amenitiesTotal: parseFloat(booking.amenities_total) || 0,
                damageCharges: parseFloat(booking.damage_charges) || 0,
                extendHours: parseInt(booking.extend_hours) || 0,
                extendAmount: parseFloat(booking.extend_amount) || 0,
                depositAmount: parseFloat(booking.deposit_amount) || 0,
                totalDue: parseFloat(booking.total_due) || 0,
                balanceDue: parseFloat(booking.total_due) || 0 // Check-in list shows pending payments
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
            rentalAmenities: booking.rental_amenities ? booking.rental_amenities.split(',').map(item => item.trim()) : [],
            consumableProducts: booking.consumable_products ? 
                booking.consumable_products.split('||').map(item => {
                    const parts = item.trim().split(' - ');
                    return {
                        name: parts[0] || '',
                        quantity: parts[1] || '',
                        price: parts[2] || '0'
                    };
                }) : [],
            discount: {
                name: booking.discount_name,
                percent: booking.discount_percent
            }
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

const op = ref();
const selectedReservation = ref(null);

const handleClick = (event, reservation) => {
    selectedReservation.value = reservation;
    op.value.toggle(event);
};

function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        BookingCode: {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
        },
        checkInDate: { value: null, matchMode: FilterMatchMode.DATE_IS },
        checkInTime: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
}

function formatCurrency(value) {
    return value.toLocaleString("en-US", {
        style: "currency",
        currency: "PHP",
    });
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
            <DatePicker  
                v-model="filters['checkInTime'].value"
                placeholder="Select Time"
                timeOnly
                showIcon
                hourFormat="12"
                style="width: 150px"
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

            <!-- Action Column with Popover -->
            <Column header="Actions" style="min-width: 100px">
                <template #body="{ data }">
                    <Button
                        icon="pi pi-info-circle"
                        class="p-button-info"
                        outlined
                        rounded
                        @click="handleClick($event, data)"
                    />
                </template>
            </Column>
        </DataTable>

        <!-- Popover Overlay -->
        <Popover ref="op">
            <div class="p-4 bg-white dark:bg-gray-800" v-if="selectedReservation">
                <!-- Main Horizontal Container -->
                <div class="flex flex-row gap-4">
                    <!-- Left Column -->
                    <div class="flex-1 flex flex-col gap-3 min-w-[200px]">
                        <!-- Guest Name -->
                        <div class="font-bold text-lg border-b border-gray-200 dark:border-gray-600 pb-2 text-gray-900 dark:text-gray-100">
                            {{ selectedReservation.guestName }}
                        </div>

                        <!-- Room Details -->
                        <div class="flex flex-col gap-2">
                            <div>
                                <label class="font-medium text-gray-700 dark:text-gray-300">Room Type:</label>
                                <div class="mt-1 text-gray-900 dark:text-gray-100">
                                    {{ selectedReservation.roomType }}
                                </div>
                            </div>
                            <div>
                                <label class="font-medium text-gray-700 dark:text-gray-300"
                                    >Selected Hours:</label
                                >
                                <Tag
                                    :value="`${selectedReservation.selectedHours}hrs`"
                                    severity="info"
                                    class="mt-1"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Middle Column -->
                    <div class="flex-1 flex flex-col gap-3 min-w-[250px]">
                        <div>
                            <label class="text-gray-700 dark:text-gray-300"> Rate</label>
                            <div class="flex items-center gap-1">
                                <i class="pi pi-money-bill text-blue-500"></i>
                                <span class="text-gray-900 dark:text-gray-100">{{
                                    formatCurrency(
                                        selectedReservation.selectedRate,
                                    )
                                }}</span>
                            </div>
                        </div>

                        <!-- Discount Information -->
                        <div v-if="selectedReservation.discount.name" class="bg-green-50 dark:bg-green-900/30 p-3 rounded">
                            <div class="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                                <i class="pi pi-percentage"></i>
                                <span class="text-sm font-medium">Discount Applied</span>
                            </div>
                            <div class="text-sm">
                                <div class="text-gray-800 dark:text-gray-200">{{ selectedReservation.discount.name }}</div>
                                <div class="text-green-600 dark:text-green-400 font-medium">{{ selectedReservation.discount.percent }}% off</div>
                            </div>
                        </div>

                        <!-- Payment Summary -->
                        <div class="bg-blue-50 dark:bg-blue-900/30 p-3 rounded">
                            <div class="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                                <i class="pi pi-credit-card"></i>
                                <span class="text-sm font-medium">Payment Summary</span>
                            </div>
                            <div class="space-y-1 text-sm text-gray-800 dark:text-gray-200">
                                <div class="flex justify-between">
                                    <span>Room Rate:</span>
                                    <span>{{ formatCurrency(selectedReservation.paymentData.roomRate) }}</span>
                                </div>
                                <div v-if="selectedReservation.paymentData.extendAmount > 0" class="flex justify-between">
                                    <span>Extend Charges <span v-if="selectedReservation.paymentData.extendHours > 0" class="bg-orange-200 text-orange-800 px-2 py-1 rounded-full text-xs font-medium ml-2">{{ selectedReservation.paymentData.extendHours }}h</span>:</span>
                                    <span>{{ formatCurrency(selectedReservation.paymentData.extendAmount) }}</span>
                                </div>
                                <div v-if="selectedReservation.paymentData.extrasTotal > 0" class="flex justify-between">
                                    <span>Consumables:</span>
                                    <span>{{ formatCurrency(selectedReservation.paymentData.extrasTotal) }}</span>
                                </div>
                                <div v-if="selectedReservation.paymentData.amenitiesTotal > 0" class="flex justify-between">
                                    <span>Amenities:</span>
                                    <span>{{ formatCurrency(selectedReservation.paymentData.amenitiesTotal) }}</span>
                                </div>
                                <div v-if="selectedReservation.paymentData.damageCharges > 0" class="flex justify-between text-red-600">
                                    <span>Damage Charges:</span>
                                    <span>{{ formatCurrency(selectedReservation.paymentData.damageCharges) }}</span>
                                </div>
                                <div v-if="selectedReservation.paymentData.depositAmount > 0" class="flex justify-between text-blue-600">
                                    <span>Deposit Paid:</span>
                                    <span>{{ formatCurrency(selectedReservation.paymentData.depositAmount) }}</span>
                                </div>
                                <div class="border-t pt-1 font-medium flex justify-between">
                                    <span>Total Due:</span>
                                    <span>{{ formatCurrency(selectedReservation.paymentData.totalDue) }}</span>
                                </div>
                                <div class="flex justify-between text-green-600 font-medium">
                                    <span>Payment Status:</span>
                                    <span>✓ Paid</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column -->
                    <div class="flex-1 flex flex-col gap-3 min-w-[200px]">
                        <!-- Contact & Amenities -->
                        <div class="flex flex-col gap-2">
                            <div>
                                <label class="font-medium text-gray-700 dark:text-gray-300">Contact Info:</label>
                                <div class="mt-1 flex flex-col gap-1">
                                    <div class="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                                        <i class="pi pi-phone text-blue-500"></i>
                                        {{ selectedReservation.contactInfo.cellphone }}
                                    </div>
                                    <div class="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                                        <i class="pi pi-envelope text-blue-500"></i>
                                        {{ selectedReservation.contactInfo.email }}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <i class="pi pi-box text-blue-500 mr-2"></i>
                                <label class="font-medium text-gray-700 dark:text-gray-300">Rented Amenities:</label>
                                <div class="mt-1">
                                    <div v-if="selectedReservation.rentalAmenities.length > 0" 
                                         class="overflow-y-auto" 
                                         style="max-height: 50px;">
                                        <div
                                            v-for="(amenity, index) in selectedReservation.rentalAmenities"
                                            :key="index"
                                            class="flex items-center justify-between gap-2 py-1 border-b last:border-b-0 border-gray-100 dark:border-gray-600"
                                        >
                                            <div class="flex items-center gap-2">
                                                <span class="text-gray-800 dark:text-gray-200">{{ amenity.split(' - ')[0] }}</span>
                                            </div>
                                            <span class="text-green-600 dark:text-green-400 font-medium">₱{{ parseFloat(amenity.split(' - ')[1]).toFixed(2) }}</span>
                                        </div>
                                    </div>
                                    <div v-else class="text-gray-500 dark:text-gray-400 italic">
                                        No rented amenities
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Consumables (Extras Bill) -->
                            <div>
                                <i class="pi pi-shopping-cart text-blue-500 mr-2"></i>
                                <label class="font-medium text-gray-700 dark:text-gray-300">Consumables:</label>
                                <div class="mt-1">
                                    <div v-if="selectedReservation.consumableProducts.length > 0"
                                         class="overflow-y-auto"
                                         style="max-height: 100px;">
                                        <div
                                            v-for="(product, index) in selectedReservation.consumableProducts"
                                            :key="index"
                                            class="flex items-center justify-between gap-2 py-1 border-b last:border-b-0 border-gray-100 dark:border-gray-600"
                                        >
                                            <div class="flex items-center gap-2">
                                                <span class="text-gray-800 dark:text-gray-200">{{ product.name }}</span>
                                                <span class="text-gray-500 dark:text-gray-400">{{ product.quantity }}</span>
                                            </div>
                                           
                                        </div>
                                    </div>
                                    <div v-else class="text-gray-500 dark:text-gray-400 italic">
                                        No consumables
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Notes (Full Width) -->
                <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <label class="font-medium text-gray-700 dark:text-gray-300">Notes:</label>
                    <div class="p-2 bg-gray-100 dark:bg-gray-700 rounded mt-1 text-gray-800 dark:text-gray-200">
                        {{ selectedReservation.notes || "No special notes" }}
                    </div>
                </div>
            </div>
        </Popover>
    </div>
</template>
