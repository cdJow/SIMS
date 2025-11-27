
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
            <DatePicker
                v-model="searchDate"
                :manualInput="false"
                dateFormat="mm/dd/yy"
                placeholder="Search by Date"
                :showIcon="true"
                iconDisplay="input"
                class="w-64"
                @update:modelValue="filterTransactions"
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
            class="p-datatable-striped mt-6"
            :sortField="sortField"
            :sortOrder="sortOrder"
            :loading="loading"
            @sort="onSort"
            :paginator="true"
            :rows="10"
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

        <!-- View Dialog -->
        <Dialog 
            v-model:visible="showViewDialog" 
            modal 
            header="Transaction Details" 
            :style="{ width: '90vw', maxWidth: '1200px' }"
            class="p-fluid"
            :dismissableMask="true"
        >
            <div class="p-6" v-if="selectedTransaction">
                <!-- Guest Header Section -->
                <div class="mb-6 pb-4 border-b border-gray-200 dark:border-gray-600">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        {{ selectedTransaction.guest_name }}
                    </h2>
                    <div class="flex flex-wrap gap-4 items-center">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-home text-blue-500"></i>
                            <span class="text-gray-700 dark:text-gray-300">{{ selectedTransaction.room_type_name }}</span>
                        </div>
                        <Tag
                            :value="`${selectedTransaction.selected_hours}hrs`"
                            severity="info"
                        />
                        <div class="flex items-center gap-2">
                            <i class="pi pi-money-bill text-green-500"></i>
                            <span class="font-semibold text-gray-900 dark:text-gray-100">
                                {{ formatCurrency(selectedTransaction.selected_rate) }}
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
                                    <span class="text-gray-700 dark:text-gray-300">{{ selectedTransaction.cellphone || 'N/A' }}</span>
                                </div>
                                <div v-if="selectedTransaction.guest_email" class="flex items-center gap-2">
                                    <i class="pi pi-envelope text-gray-500"></i>
                                    <span class="text-gray-700 dark:text-gray-300">{{ selectedTransaction.guest_email }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Check-in/Check-out Times -->
                        <div v-if="selectedTransaction.check_in_datetime || selectedTransaction.check_out_datetime" class="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                            <h3 class="font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                                <i class="pi pi-clock"></i>
                                Check-in/Check-out Times
                            </h3>
                            <div class="space-y-2">
                                <div v-if="selectedTransaction.check_in_datetime" class="flex justify-between items-center">
                                    <span class="text-gray-700 dark:text-gray-300">Check-in:</span>
                                    <span class="font-medium text-gray-900 dark:text-gray-100">{{ formatDateTime(selectedTransaction.check_in_datetime) }}</span>
                                </div>
                                <div v-if="selectedTransaction.check_out_datetime" class="flex justify-between items-center">
                                    <span class="text-gray-700 dark:text-gray-300">Check-out:</span>
                                    <span class="font-medium text-gray-900 dark:text-gray-100">{{ formatDateTime(selectedTransaction.check_out_datetime) }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Payment Summary -->
                        <div v-if="selectedTransaction.payments && selectedTransaction.payments.length > 0" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                <i class="pi pi-credit-card text-green-500"></i>
                                Payment Summary
                            </h3>
                            <div v-for="payment in selectedTransaction.payments" :key="payment.payment_id" class="space-y-2">
                                <!-- Discount Information -->
                                <div v-if="payment.discount_name || payment.discount_amount > 0" class="bg-green-50 dark:bg-green-900/30 p-3 rounded mb-3">
                                    <!-- Percentage Discount -->
                                    <div v-if="payment.discount_name && payment.discount_percent > 0" class="flex items-center justify-between mb-2">
                                        <div class="flex items-center gap-2">
                                            <i class="pi pi-percentage text-green-600"></i>
                                            <span class="font-medium text-green-700 dark:text-green-300">{{ payment.discount_name }}</span>
                                        </div>
                                        <span class="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                            {{ payment.discount_percent }}% off
                                        </span>
                                    </div>
                                    <!-- Manual Discount -->
                                    <div v-if="payment.discount_amount > 0" class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <i class="pi pi-money-bill text-green-600"></i>
                                            <span class="font-medium text-green-700 dark:text-green-300">Manual Discount</span>
                                        </div>
                                        <span class="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                            {{ formatCurrency(payment.discount_amount) }}
                                        </span>
                                    </div>
                                </div>
                                
                                <!-- Payment Breakdown -->
                                <div class="space-y-2">
                                    <div class="flex justify-between items-center">
                                        <span class="text-gray-600 dark:text-gray-400">Room Rate:</span>
                                        <div class="text-right">
                                            <!-- Show discount calculation if there's a discount -->
                                            <div v-if="payment.discount_amount > 0 || (payment.discount_name && payment.discount_percent > 0)" class="flex flex-col items-end">
                                                <!-- Original price with red strikethrough -->
                                                <span class="text-sm text-red-500 dark:text-red-400 line-through">
                                                    {{ formatCurrency(selectedTransaction.selected_rate) }}
                                                </span>
                                                <!-- Discounted price -->
                                                <span class="font-medium text-gray-900 dark:text-gray-100">
                                                    {{ formatCurrency(calculateDiscountedRate(selectedTransaction.selected_rate, payment)) }}
                                                </span>
                                                <!-- Discount amount/percentage -->
                                                <span class="text-xs text-green-600 dark:text-green-400">
                                                    <span v-if="payment.discount_amount > 0">-{{ formatCurrency(payment.discount_amount) }}</span>
                                                    <span v-else-if="payment.discount_percent > 0">-{{ payment.discount_percent }}%</span>
                                                </span>
                                            </div>
                                            <!-- No discount - show regular price -->
                                            <span v-else class="font-medium text-gray-900 dark:text-gray-100">
                                                {{ formatCurrency(selectedTransaction.selected_rate) }}
                                            </span>
                                        </div>
                                    </div>
                                    <div v-if="payment.extend_amount > 0" class="flex justify-between items-center">
                                        <div class="flex items-center gap-2">
                                            <span class="text-gray-600 dark:text-gray-400">Extend Charges:</span>
                                            <span v-if="payment.extend_hours > 0" class="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                                                {{ payment.extend_hours }}h
                                            </span>
                                        </div>
                                        <span class="font-medium text-gray-900 dark:text-gray-100">{{ formatCurrency(payment.extend_amount) }}</span>
                                    </div>
                                    <div v-if="payment.extras_total > 0" class="flex justify-between items-center">
                                        <span class="text-gray-600 dark:text-gray-400">Consumables:</span>
                                        <span class="font-medium text-gray-900 dark:text-gray-100">{{ formatCurrency(payment.extras_total) }}</span>
                                    </div>
                                    <div v-if="payment.amenities_total > 0" class="flex justify-between items-center">
                                        <span class="text-gray-600 dark:text-gray-400">Amenities:</span>
                                        <span class="font-medium text-gray-900 dark:text-gray-100">{{ formatCurrency(payment.amenities_total) }}</span>
                                    </div>
                                    <div v-if="payment.damage_charges > 0" class="flex justify-between items-center">
                                        <span class="text-red-600 dark:text-red-400">Damage Charges:</span>
                                        <span class="font-medium text-red-600 dark:text-red-400">{{ formatCurrency(payment.damage_charges) }}</span>
                                    </div>
                                    <div v-if="payment.discount_amount > 0" class="flex justify-between items-center">
                                        <span class="text-green-600 dark:text-green-400">Manual Discount:</span>
                                        <span class="font-medium text-green-600 dark:text-green-400">-{{ formatCurrency(payment.discount_amount) }}</span>
                                    </div>
                                    <div v-if="payment.deposit_amount > 0" class="flex justify-between items-center">
                                        <span class="text-blue-600 dark:text-blue-400">Deposit Paid:</span>
                                        <span class="font-medium text-blue-600 dark:text-blue-400">{{ formatCurrency(payment.deposit_amount) }}</span>
                                    </div>
                                    <div class="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between items-center">
                                        <span class="font-semibold text-gray-900 dark:text-gray-100">Total Due:</span>
                                        <span class="font-bold text-lg text-gray-900 dark:text-gray-100">{{ formatCurrency(payment.total_due) }}</span>
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

                        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                <i class="pi pi-shopping-cart text-orange-500"></i>
                                Consumables
                            </h3>
                            <div v-if="selectedTransaction.consumables && selectedTransaction.consumables.length > 0"
                                 class="space-y-2 max-h-40 overflow-y-auto">
                                <div v-for="consumable in selectedTransaction.consumables" 
                                     :key="consumable.item_id"
                                     class="flex items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div class="flex-1">
                                        <div class="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                            {{ consumable.product_name }}
                                        </div>
                                        <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span v-if="consumable.brand">{{ consumable.brand }}</span>
                                            <span class="bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">
                                                Qty: {{ consumable.quantity }}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="font-semibold text-orange-600 dark:text-orange-400">
                                            ₱{{ formatPrice(consumable.total_item_cost) }}
                                        </div>
                                    </div>
                                </div>
                                <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                                    <span class="font-medium text-gray-700 dark:text-gray-300">Total Consumables:</span>
                                    <span class="font-bold text-orange-600 dark:text-orange-400">
                                        ₱{{ formatPrice(selectedTransaction.consumables.reduce((sum, item) => sum + item.total_item_cost, 0)) }}
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
                            <div v-if="selectedTransaction.rented_amenities && selectedTransaction.rented_amenities.length > 0" 
                                 class="space-y-2 max-h-40 overflow-y-auto">
                                <div v-for="amenity in selectedTransaction.rented_amenities" 
                                     :key="amenity.rental_id"
                                     class="flex items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div class="flex-1">
                                        <div class="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                            {{ amenity.amenity_name || amenity.product_name }}
                                        </div>
                                        <div v-if="amenity.brand" class="text-xs text-gray-500 dark:text-gray-400">
                                            {{ amenity.brand }}
                                        </div>
                                    </div>
                                    <div class="font-semibold text-purple-600 dark:text-purple-400">
                                        ₱{{ formatPrice(amenity.unit_rental_price) }}
                                    </div>
                                </div>
                                <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                                    <span class="font-medium text-gray-700 dark:text-gray-300">Total Amenities:</span>
                                    <span class="font-bold text-purple-600 dark:text-purple-400">
                                        ₱{{ formatPrice(selectedTransaction.rented_amenities.reduce((sum, item) => sum + item.unit_rental_price, 0)) }}
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
        </Dialog>
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
const searchQuery = ref('')
const searchDate = ref(null)
const filteredTransactions = ref([])
const selectedTransaction = ref(null)
const showViewDialog = ref(false)

// Sorting
const sortField = ref(null)
const sortOrder = ref(1)

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
    
    // Filter by date
    if (searchDate.value) {
        const searchDateStr = new Date(searchDate.value).toDateString()
        filtered = filtered.filter(t => {
            const checkInDate = t.check_in_datetime ? new Date(t.check_in_datetime) : new Date(t.booking_created_at)
            return checkInDate.toDateString() === searchDateStr
        })
    }
    
    filteredTransactions.value = filtered
}

// Clear filters
const clearFilters = () => {
    searchQuery.value = ''
    searchDate.value = null
    filterTransactions()
}

// Handle sort
const onSort = (event) => {
    sortField.value = event.sortField
    sortOrder.value = event.sortOrder
}

// Handle view dialog click
const handleClick = (event, data) => {
    selectedTransaction.value = data
    showViewDialog.value = true
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

const calculateDiscountedRate = (originalRate, payment) => {
    if (!originalRate) return 0
    
    // Manual discount takes precedence
    if (payment.discount_amount > 0) {
        return Math.max(0, originalRate - payment.discount_amount)
    }
    
    // Percentage discount
    if (payment.discount_percent > 0) {
        const discountAmount = (originalRate * payment.discount_percent) / 100
        return Math.max(0, originalRate - discountAmount)
    }
    
    return originalRate
}

// Lifecycle
onMounted(async () => {
    await loadTransactionHistory()
})
</script>

<style scoped>



</style>