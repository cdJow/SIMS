
<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4 text-gray-900 dark:text-gray-100">Accommodation</div>

        <!-- Search -->
        <div class="flex gap-2 mb-3 items-center">
            <Button
                type="button"
                icon="pi pi-filter-slash"
                label="Clear"
                outlined
                @click="clearFilters"
            />
            <IconField class="p-input-icon-left">
                <InputText 
                    v-model="searchQuery" 
                    placeholder="Search room code" 
                    style="width: 200px"
                    @input="filterTransactions"
                />
            </IconField>
            <Dropdown
                v-model="statusFilter"
                :options="statusOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="All Status"
                style="width: 200px"
                @change="filterTransactions"
            />
        </div>
        
        <!-- Empty State -->
        <div v-if="!loading && (!filteredTransactions || filteredTransactions.length === 0)" 
             class="text-center py-12 mt-6">
            <div class="flex flex-col items-center gap-4">
                <i class="pi pi-sign-out text-6xl text-gray-300 dark:text-gray-600"></i>
                <div class="space-y-2">
                    <h3 class="text-xl font-semibold text-gray-600 dark:text-gray-400">No Transaction History Today</h3>
                    <p class="text-gray-500 dark:text-gray-500 max-w-md">
                        There are currently no transaction history. 
                        <br>Check back later or adjust your date filter to view other periods.
                    </p>
                </div>
                <Button
                    icon="pi pi-refresh"
                    label="Refresh"
                    class="p-button-outlined"
                    @click="loadTransactionHistory"
                    :loading="loading"
                />
            </div>
        </div>

        <!-- Data Table (only show when there's data) -->
        <DataTable
            v-if="!loading && filteredTransactions && filteredTransactions.length > 0"
            :value="filteredTransactions"
            scrollable
            scrollHeight="600px"
            class="mt-6"
            :loading="loading"
        >
            <!-- Visible Columns -->
            <Column
                field="room_number"
                header="Room Number"
                style="min-width: 120px"
            ></Column>

            <Column
                field="room_code"
                header="Booking Code"
                style="min-width: 150px"
            ></Column>

            <Column
                field="booking_created_at"
                header="Check-In Date/Time"
                style="min-width: 200px"
                class="text-red-500"
            >
                <template #body="{ data }">
                    {{ data.check_in_datetime ? formatDateTime(data.check_in_datetime) : formatDateTime(data.booking_created_at) }}
                </template>
            </Column>

            <Column
                field="status"
                header="Status"
                style="min-width: 120px"
            >
                <template #body="{ data }">
                    <Tag 
                        :value="getStatusLabel(data.status)" 
                        :severity="getStatusSeverity(data.status)"
                    />
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
            <div class="p-4 bg-white dark:bg-gray-800" v-if="selectedTransaction">
                <!-- Main Horizontal Container -->
                <div class="flex flex-row gap-4">
                    <!-- Left Column -->
                    <div class="flex-1 flex flex-col gap-3 min-w-[200px]">
                        <!-- Guest Name -->
                        <div class="font-bold text-lg border-b border-gray-200 dark:border-gray-600 pb-2 text-gray-900 dark:text-gray-100">
                            {{ selectedTransaction.guest_name }}
                        </div>

                        <!-- Room Details -->
                        <div class="flex flex-col gap-2">
                            <div>
                                <label class="font-medium text-gray-700 dark:text-gray-300">Room Type:</label>
                                <div class="mt-1 text-gray-900 dark:text-gray-100">
                                    {{ selectedTransaction.room_type_name }}
                                </div>
                            </div>
                            <div>
                                <label class="font-medium text-gray-700 dark:text-gray-300"
                                    >Selected Hours:</label
                                >
                                <Tag
                                    :value="`${selectedTransaction.selected_hours}hrs`"
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
                                        selectedTransaction.selected_rate,
                                    )
                                }}</span>
                            </div>
                        </div>

                        <!-- Check-in/Check-out Times -->
                        <div v-if="selectedTransaction.check_in_datetime || selectedTransaction.check_out_datetime" class="bg-blue-50 dark:bg-blue-900/30 p-3 rounded">
                            <div class="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                                <i class="pi pi-clock"></i>
                                <span class="text-sm font-medium">Check-in/Check-out</span>
                            </div>
                            <div class="space-y-1 text-sm text-gray-800 dark:text-gray-200">
                                <div v-if="selectedTransaction.check_in_datetime" class="flex justify-between">
                                    <span>Check-in:</span>
                                    <span>{{ formatDateTime(selectedTransaction.check_in_datetime) }}</span>
                                </div>
                                <div v-if="selectedTransaction.check_out_datetime" class="flex justify-between">
                                    <span>Check-out:</span>
                                    <span>{{ formatDateTime(selectedTransaction.check_out_datetime) }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Discount Information -->
                        <div v-if="selectedTransaction.payments && selectedTransaction.payments.length > 0 && selectedTransaction.payments[0].discount_name" class="bg-green-50 dark:bg-green-900/30 p-3 rounded">
                            <div class="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                                <i class="pi pi-percentage"></i>
                                <span class="text-sm font-medium">Discount Applied</span>
                            </div>
                            <div class="text-sm">
                                <div class="text-gray-800 dark:text-gray-200">{{ selectedTransaction.payments[0].discount_name }}</div>
                                <div class="text-green-600 dark:text-green-400 font-medium">{{ selectedTransaction.payments[0].discount_percent }}% off</div>
                            </div>
                        </div>

                        <!-- Payment Summary -->
                        <div v-if="selectedTransaction.payments && selectedTransaction.payments.length > 0" class="bg-blue-50 dark:bg-blue-900/30 p-3 rounded">
                            <div class="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                                <i class="pi pi-credit-card"></i>
                                <span class="text-sm font-medium">Payment Summary</span>
                            </div>
                            <div class="space-y-1 text-sm text-gray-800 dark:text-gray-200" v-for="payment in selectedTransaction.payments" :key="payment.payment_id">
                                <div class="flex justify-between">
                                    <span>Room Rate:</span>
                                    <span>{{ formatCurrency(payment.room_rate) }}</span>
                                </div>
                                <div v-if="payment.extend_amount > 0" class="flex justify-between">
                                    <span>Extend Charges <span v-if="payment.extend_hours > 0" class="bg-orange-200 text-orange-800 px-2 py-1 rounded-full text-xs font-medium ml-2">{{ payment.extend_hours }}h</span>:</span>
                                    <span>{{ formatCurrency(payment.extend_amount) }}</span>
                                </div>
                                <div v-if="payment.extras_total > 0" class="flex justify-between">
                                    <span>Consumables:</span>
                                    <span>{{ formatCurrency(payment.extras_total) }}</span>
                                </div>
                                <div v-if="payment.amenities_total > 0" class="flex justify-between">
                                    <span>Amenities:</span>
                                    <span>{{ formatCurrency(payment.amenities_total) }}</span>
                                </div>
                                <div v-if="payment.damage_charges > 0" class="flex justify-between text-red-600">
                                    <span>Damage Charges:</span>
                                    <span>{{ formatCurrency(payment.damage_charges) }}</span>
                                </div>
                                <div class="border-t pt-1 font-medium flex justify-between">
                                    <span>Total Due:</span>
                                    <span>{{ formatCurrency(payment.total_due) }}</span>
                                </div>
                                <div class="flex justify-between text-green-600 font-medium">
                                    <span>Payment Status:</span>
                                    <span>✓ Fully Paid</span>
                                </div>
                            </div>
                        </div>
                        <div v-else class="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded">
                            <div class="flex items-center gap-2 text-yellow-700 dark:text-yellow-300 text-sm">
                                <i class="pi pi-info-circle"></i>
                                <span>No check-in payment recorded yet</span>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column -->
                    <div class="flex-1 flex flex-col gap-3 min-w-[200px]">
                        <!-- Contact Info -->
                        <div class="flex flex-col gap-2">
                            <div>
                                <label class="font-medium text-gray-700 dark:text-gray-300">Contact Info:</label>
                                <div class="mt-1 flex flex-col gap-1">
                                    <div class="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                                        <i class="pi pi-phone text-blue-500"></i>
                                        {{ selectedTransaction.cellphone || 'N/A' }}
                                    </div>
                                    <div v-if="selectedTransaction.guest_email" class="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                                        <i class="pi pi-envelope text-blue-500"></i>
                                        {{ selectedTransaction.guest_email }}
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <i class="pi pi-box text-blue-500 mr-2"></i>
                                <label class="font-medium text-gray-700 dark:text-gray-300">Rented Amenities:</label>
                                <div class="mt-1">
                                    <div v-if="selectedTransaction.rented_amenities && selectedTransaction.rented_amenities.length > 0" 
                                         class="overflow-y-auto" 
                                         style="max-height: 120px;">
                                        <div v-for="amenity in selectedTransaction.rented_amenities" 
                                             :key="amenity.rental_id"
                                             class="flex items-center justify-between gap-2 py-1 border-b last:border-b-0 border-gray-100 dark:border-gray-600">
                                            <div class="flex flex-col gap-1">
                                                <span class="text-gray-800 dark:text-gray-200 text-sm font-medium">
                                                    {{ amenity.amenity_name || amenity.product_name }}
                                                </span>
                                                <span v-if="amenity.brand" class="text-xs text-gray-500 dark:text-gray-400">
                                                    {{ amenity.brand }}
                                                </span>
                                            </div>
                                            <span class="text-green-600 dark:text-green-400 font-medium text-sm">
                                                ₱{{ formatPrice(amenity.unit_rental_price) }}
                                            </span>
                                        </div>
                                        <div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between font-medium">
                                            <span class="text-gray-700 dark:text-gray-300">Total Amenities:</span>
                                            <span class="text-green-600 dark:text-green-400">
                                                ₱{{ formatPrice(selectedTransaction.rented_amenities.reduce((sum, item) => sum + item.unit_rental_price, 0)) }}
                                            </span>
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
                                    <div v-if="selectedTransaction.consumables && selectedTransaction.consumables.length > 0"
                                         class="overflow-y-auto"
                                         style="max-height: 120px;">
                                        <div v-for="consumable in selectedTransaction.consumables" 
                                             :key="consumable.item_id"
                                             class="flex items-center justify-between gap-2 py-1 border-b last:border-b-0 border-gray-100 dark:border-gray-600">
                                            <div class="flex flex-col gap-1">
                                                <span class="text-gray-800 dark:text-gray-200 text-sm font-medium">
                                                    {{ consumable.product_name }}
                                                </span>
                                                <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                    <span v-if="consumable.brand">{{ consumable.brand }}</span>
                                                    <span>Qty: {{ consumable.quantity }}</span>
                                                </div>
                                            </div>
                                            <div class="text-right">
                                                <div class="text-sm font-medium text-green-600 dark:text-green-400">
                                                    ₱{{ formatPrice(consumable.total_item_cost) }}
                                                </div>
                                            
                                            </div>
                                        </div>
                                        <div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between font-medium">
                                            <span class="text-gray-700 dark:text-gray-300">Total Consumables:</span>
                                            <span class="text-green-600 dark:text-green-400">
                                                ₱{{ formatPrice(selectedTransaction.consumables.reduce((sum, item) => sum + item.total_item_cost, 0)) }}
                                            </span>
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

                <!-- Payment Notes (Full Width) -->
                <div v-if="selectedTransaction.payments && selectedTransaction.payments.length > 0" class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div v-for="payment in selectedTransaction.payments" :key="payment.payment_id">
                        <div v-if="payment.payment_note">
                            <label class="font-medium text-gray-700 dark:text-gray-300">Payment Notes:</label>
                            <div class="p-2 bg-gray-100 dark:bg-gray-700 rounded mt-1 text-gray-800 dark:text-gray-200">
                                {{ payment.payment_note }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Popover>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { fetchTransactionHistory, fetchTransactionSummary } from '@/api/transactionHistory'

const router = useRouter()
const toast = useToast()

// Reactive data
const loading = ref(true)
const error = ref(null)
const transactions = ref([])
const summary = ref(null)

// Filters
const statusFilter = ref(null)
const searchQuery = ref('')
const filteredTransactions = ref([])
const selectedTransaction = ref(null)
const op = ref()

const statusOptions = [
    { label: 'All Status', value: null },
    { label: 'Pending Check-In', value: 'Booked' },
    { label: 'Checked In', value: 'Occupied' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' }
]

// Load transaction history
const loadTransactionHistory = async () => {
    try {
        loading.value = true
        error.value = null
        
        // Load transaction history
        const transactionData = await fetchTransactionHistory()
        transactions.value = transactionData || []
        
        // Initialize filtered transactions
        filterTransactions()
        
    } catch (err) {
        console.error('Error loading transaction history:', err)
        error.value = err.message || 'Failed to load transaction history'
        toast.add({
            severity: 'error',
            summary: 'Loading Failed',
            detail: error.value,
            life: 5000
        })
    } finally {
        loading.value = false
    }
}

// Filter transactions
const filterTransactions = () => {
    let filtered = [...transactions.value]
    
    // Filter by status
    if (statusFilter.value) {
        filtered = filtered.filter(t => t.status === statusFilter.value)
    }
    
    // Filter by search query
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        filtered = filtered.filter(t => 
            t.guest_name?.toLowerCase().includes(query) ||
            t.room_number?.toString().includes(query) ||
            t.room_code?.toLowerCase().includes(query) ||
            t.book_code?.toLowerCase().includes(query) ||
            t.room_type_name?.toLowerCase().includes(query)
        )
    }
    
    filteredTransactions.value = filtered
}

// Clear filters
const clearFilters = () => {
    statusFilter.value = null
    searchQuery.value = ''
    filterTransactions()
}

// Handle popover click
const handleClick = (event, data) => {
    selectedTransaction.value = data
    op.value.toggle(event)
}

// Utility functions
const formatPrice = (price) => {
    if (!price) return '0.00'
    return parseFloat(price).toFixed(2)
}

const formatCurrency = (amount) => {
    if (!amount) return '₱0.00'
    return `₱${parseFloat(amount).toFixed(2)}`
}

const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    })
}

const getStatusLabel = (status) => {
    const labels = {
        'Booked': 'Pending Check-In',
        'Occupied': 'Checked In',
        'Completed': 'Completed',
        'Cancelled': 'Cancelled'
    }
    return labels[status] || status
}

const getStatusSeverity = (status) => {
    const severities = {
        'Booked': 'info',
        'Occupied': 'success',
        'Completed': 'secondary',
        'Cancelled': 'danger'
    }
    return severities[status] || 'secondary'
}

// Lifecycle
onMounted(async () => {
    await loadTransactionHistory()
})
</script>

<style scoped>



</style>