<script setup>
import { FilterMatchMode, FilterOperator } from "@primevue/core/api";
import { onBeforeMount, ref, computed } from "vue";
import { fetchCheckOutList } from "@/api/auth";

const reservations = ref(null);
const filters = ref(null);
const loading = ref(false);

async function loadCheckOuts() {
    try {
        loading.value = true;
        console.log('Fetching check-out list...');
        console.log('Token from localStorage:', localStorage.getItem('token'));
        const response = await fetchCheckOutList();
        console.log('Raw response:', response);
        console.log('Response data:', response.data);
        
        if (!response.data || response.data.error) {
            console.error('Server error:', response.data?.error);
            throw new Error(response.data?.error || 'Failed to load check-out list');
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
                balanceDue: 0 // Checkout list shows completed payments, so balance is typically 0
            },
            paymentStatus: {
                ratePaid: true, // Checkout list shows completed bookings, typically paid
                depositAmount: booking.deposit_amount,
                depositStatus: booking.deposit_amount > 0 ? "Paid" : "Pending",
                balanceDue: 0, // Checkout list shows completed payments
            },
            contactInfo: {
                cellphone: booking.cellphone || 'N/A',
                email: booking.guest_email || 'N/A'
            },
            checkOutStatus: booking.status,
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
        console.error("Error loading check-out list:", error);
        if (error.response) {
            console.error("Server response:", error.response.data);
            console.error("Status:", error.response.status);
        }
        // Set reservations to empty array on error to prevent template errors
        reservations.value = [];
    } finally {
        loading.value = false;
    }
}

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
    if (filters.value?.checkOutDate?.value) {
        const filterDate = new Date(filters.value.checkOutDate.value);
        filtered = filtered.filter(reservation => {
            const checkOutDate = new Date(reservation.checkOutDate);
            return checkOutDate.toDateString() === filterDate.toDateString();
        });
    }
    
    // Apply time filter
    if (filters.value?.checkOutTime?.value) {
        const filterTime = new Date(filters.value.checkOutTime.value);
        const filterHour = filterTime.getHours();
        const filterMinute = filterTime.getMinutes();
        
        filtered = filtered.filter(reservation => {
            const checkOutDate = new Date(reservation.checkOutDate);
            const checkOutHour = checkOutDate.getHours();
            const checkOutMinute = checkOutDate.getMinutes();
            
            // Match exact hour and minute
            return checkOutHour === filterHour && checkOutMinute === filterMinute;
        });
    }
    
    return filtered;
});

onBeforeMount(() => {
    loadCheckOuts();
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
        checkOutDate: { value: null, matchMode: FilterMatchMode.DATE_IS },
        checkOutTime: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
}

function formatCurrency(value) {
    return value.toLocaleString("en-US", {
        style: "currency",
        currency: "PHP",
    });
}
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Check-Out List</div>

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
                v-model="filters['checkOutDate'].value"
                placeholder="Select Date"
                showIcon
                dateFormat="mm/dd/yy"
                style="width: 200px"
            />
            <DatePicker  
                v-model="filters['checkOutTime'].value"
                placeholder="Select Time"
                timeOnly
                showIcon
                hourFormat="12"
                style="width: 150px"
            />
        </div>
        
        <DataTable
            :value="filteredReservations"
            scrollable
            scrollHeight="600px"
            class="mt-6"
            :loading="loading"
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
                field="checkOutDate"
                header="Check-Out Date/Time"
                style="min-width: 200px"
                class="text-red-500"
            >
                <template #body="{ data }">
                    {{ data.checkOutDate.toLocaleString('en-US', {
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
            <div class="p-4" v-if="selectedReservation">
                <!-- Main Horizontal Container -->
                <div class="flex flex-row gap-4">
                    <!-- Left Column -->
                    <div class="flex-1 flex flex-col gap-3 min-w-[200px]">
                        <!-- Guest Name -->
                        <div class="font-bold text-lg border-b pb-2">
                            {{ selectedReservation.guestName }}
                        </div>

                        <!-- Room Details -->
                        <div class="flex flex-col gap-2">
                            <div>
                                <label class="font-medium">Room Type:</label>
                                <div class="mt-1">
                                    {{ selectedReservation.roomType }}
                                </div>
                            </div>
                            <div>
                                <label class="font-medium"
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
                            <label> Rate</label>
                            <div class="flex items-center gap-1">
                                <i class="pi pi-money-bill text-blue-500"></i>
                                <span>{{
                                    formatCurrency(
                                        selectedReservation.selectedRate,
                                    )
                                }}</span>
                            </div>
                        </div>



                        <!-- Discount Information -->
                        <div v-if="selectedReservation.discount.name" class="bg-green-50 p-3 rounded">
                            <div class="flex items-center gap-2 text-green-700 mb-2">
                                <i class="pi pi-percentage"></i>
                                <span class="text-sm font-medium">Discount Applied</span>
                            </div>
                            <div class="text-sm">
                                <div>{{ selectedReservation.discount.name }}</div>
                                <div class="text-green-600 font-medium">{{ selectedReservation.discount.percent }}% off</div>
                            </div>
                        </div>

                        <!-- Payment Summary -->
                        <div class="bg-blue-50 p-3 rounded">
                            <div class="flex items-center gap-2 text-blue-700 mb-2">
                                <i class="pi pi-credit-card"></i>
                                <span class="text-sm font-medium">Payment Summary</span>
                            </div>
                            <div class="space-y-1 text-sm">
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
                                <div class="border-t pt-1 font-medium flex justify-between">
                                    <span>Total Due:</span>
                                    <span>{{ formatCurrency(selectedReservation.paymentData.totalDue) }}</span>
                                </div>
                                <div v-if="selectedReservation.paymentData.balanceDue > 0" class="flex justify-between text-red-600 font-medium">
                                    <span>Balance Due:</span>
                                    <span>{{ formatCurrency(selectedReservation.paymentData.balanceDue) }}</span>
                                </div>
                                <div v-else class="flex justify-between text-green-600 font-medium">
                                    <span>Payment Status:</span>
                                    <span>✓ Fully Paid</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column -->
                    <div class="flex-1 flex flex-col gap-3 min-w-[200px]">
                        <!-- Contact & Amenities -->
                        <div class="flex flex-col gap-2">
                            <div>
                                <label class="font-medium">Contact Info:</label>
                                <div class="mt-1 flex flex-col gap-1">
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-phone text-blue-500"></i>
                                        {{ selectedReservation.contactInfo.cellphone }}
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-envelope text-blue-500"></i>
                                        {{ selectedReservation.contactInfo.email }}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <i class="pi pi-box text-blue-500 mr-2"></i>
                                <label class="font-medium">Rented Amenities:</label>
                                <div class="mt-1">
                                    <div v-if="selectedReservation.rentalAmenities.length > 0" 
                                         class="overflow-y-auto" 
                                         style="max-height: 50px;">
                                        <div
                                            v-for="(amenity, index) in selectedReservation.rentalAmenities"
                                            :key="index"
                                            class="flex items-center justify-between gap-2 py-1 border-b last:border-b-0 border-gray-100"
                                        >
                                            <div class="flex items-center gap-2">
                                                <span>{{ amenity.split(' - ')[0] }}</span>
                                            </div>
                                            <span class="text-green-600 font-medium">₱{{ parseFloat(amenity.split(' - ')[1]).toFixed(2) }}</span>
                                        </div>
                                    </div>
                                    <div v-else class="text-gray-500 italic">
                                        No rented amenities
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Consumables (Extras Bill) -->
                            <div>
                                <i class="pi pi-shopping-cart text-blue-500 mr-2"></i>
                                <label class="font-medium">Consumables:</label>
                                <div class="mt-1">
                                    <div v-if="selectedReservation.consumableProducts.length > 0"
                                         class="overflow-y-auto"
                                         style="max-height: 100px;">
                                        <div
                                            v-for="(product, index) in selectedReservation.consumableProducts"
                                            :key="index"
                                            class="flex items-center justify-between gap-2 py-1 border-b last:border-b-0 border-gray-100"
                                        >
                                            <div class="flex items-center gap-2">
                                                <span>{{ product.name }}</span>
                                                <span class="text-gray-500">{{ product.quantity }}</span>
                                            </div>
                                           
                                        </div>
                                    </div>
                                    <div v-else class="text-gray-500 italic">
                                        No consumables
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Notes (Full Width) -->
                <div class="mt-4 pt-3 border-t">
                    <label class="font-medium">Notes:</label>
                    <div class="p-2 bg-gray-100 rounded mt-1">
                        {{ selectedReservation.notes || "No special notes" }}
                    </div>
                </div>
            </div>
        </Popover>
    </div>
</template>
