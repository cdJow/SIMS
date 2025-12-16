<script setup>
import { useToast } from "primevue/usetoast";
import { computed, ref, onBeforeMount } from "vue";
import { fetchRoomInvoiceAdmin, deleteRoomInvoice } from "@/api/auth";

const billingData = ref([]);
const loading = ref(false);
const toast = useToast();

async function loadRoomInvoices() {
    try {
        loading.value = true;
        const response = await fetchRoomInvoiceAdmin();
        
        if (!response.data || response.data.error) {
            throw new Error(response.data?.error || 'Failed to load room invoices');
        }
        
        billingData.value = response.data.map(booking => ({
            id: booking.id,
            BookingCode: booking.room_code,
            guestName: booking.guest_name,
            roomNumber: booking.room_number,
            roomType: booking.room_type_name,
            selectedHours: booking.selected_hours,
            selectedRate: booking.selected_rate,
            checkIn: booking.check_in_datetime,
            checkOut: booking.check_out_datetime,
            totalAmount: parseFloat(booking.total_due) || parseFloat(booking.selected_rate) || 0,
            hourlyRate: parseFloat(booking.selected_rate) || 0,
            status: booking.status,
            
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
                balanceDue: Math.max(0, (parseFloat(booking.total_due) || 0) - (parseFloat(booking.deposit_amount) || 0)),
                additionalPersonCount: parseInt(booking.additional_person_count) || 0,
                additionalPersonTotal: parseFloat(booking.additional_person_total) || 0
            },
            
            contactInfo: {
                cellphone: booking.cellphone || 'N/A',
                email: booking.guest_email || 'N/A'
            },
            
            notes: booking.note,
            rentalAmenities: booking.rental_amenities ? 
                booking.rental_amenities.split(',').map(item => item.trim()) : [],
            consumableProducts: booking.consumable_products ? 
                booking.consumable_products.split('||').map(item => {
                    const trimmed = item.trim();
                    
                    // Parse format: "Product Name - Quantity x Price = Total"
                    // Split by " - " first to get product name and rest
                    const mainParts = trimmed.split(' - ');
                    if (mainParts.length < 2) {
                        return { name: trimmed, quantity: '', price: '0' };
                    }
                    
                    const productName = mainParts[0];
                    const rest = mainParts[1]; // "Quantity x Price = Total"
                    
                    // Parse the "Quantity x Price = Total" part
                    const match = rest.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)$/);
                    if (match) {
                        return {
                            name: productName,
                            quantity: match[1],
                            price: match[2], // Unit price
                            total: match[3]  // Total amount
                        };
                    } else {
                        // Fallback if format doesn't match
                        return { name: productName, quantity: '', price: '0' };
                    }
                }) : [],
            
            discount: {
                name: booking.discount_name,
                percent: booking.discount_percent,
                amount: parseFloat(booking.discount_amount) || 0
            },
            
            // Extended stay detection
            extendedStay: booking.extend_hours > 0,
            amenities: booking.rental_amenities ? 
                booking.rental_amenities.split(',').map(item => item.trim().split(' - ')[0]) : []
        }));
    } catch (error) {
        billingData.value = [];
        toast.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to load room invoices",
            life: 3000,
        });
    } finally {
        loading.value = false;
    }
}

onBeforeMount(() => {
    loadRoomInvoices();
});

const deleteDialogVisible = ref(false);
const selectedInvoice = ref(null);
const searchQuery = ref("");
const searchDate = ref(null);
const sortField = ref("checkIn");
const sortOrder = ref(-1); // Changed to -1 for descending order (latest first)

// Create computed property for filtered data
const filteredBillingData = computed(() => {
    let filtered = [...billingData.value];

    // Filtering logic
    if (searchQuery.value) {
        filtered = filtered.filter((invoice) =>
            Object.values(invoice).some((value) =>
                String(value)
                    .toLowerCase()
                    .includes(searchQuery.value.toLowerCase())
            )
        );
    }

    // Date filtering - match check-in or check-out date
    if (searchDate.value) {
        filtered = filtered.filter((invoice) => {
            const searchDateStr = new Date(searchDate.value).toDateString();
            const checkInDateStr = invoice.checkIn ? new Date(invoice.checkIn).toDateString() : null;
            const checkOutDateStr = invoice.checkOut ? new Date(invoice.checkOut).toDateString() : null;
            return checkInDateStr === searchDateStr || checkOutDateStr === searchDateStr;
        });
    }

    // Sorting logic - show latest entries first
    return filtered.sort((a, b) => {
        // Prioritize check-out date if available, otherwise use check-in date
        const dateA = new Date(a.checkOut || a.checkIn);
        const dateB = new Date(b.checkOut || b.checkIn);
        return dateB - dateA; // Descending order (latest first)
    });
});

// Delete functionality
const confirmDelete = (invoice) => {
    selectedInvoice.value = invoice;
    deleteDialogVisible.value = true;
};

const handlePrint = (invoice) => {
    const printContent = `
        <html>
            <head>
                <title>Invoice - ${invoice.guestName}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .hotel-name { font-size: 24px; color: #2c3e50; font-weight: bold; }
                    .invoice-title { margin-top: 10px; font-size: 20px; }
                    .details-section { margin: 20px 0; }
                    .detail-item { margin: 8px 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    th { background-color: #f8f9fa; }
                    .total-row { font-weight: bold; background-color: #f8f9fa; }
                    .footer { margin-top: 30px; text-align: center; color: #666; }
                    .section-title { font-weight: bold; margin: 15px 0 10px; color: #2c3e50; }
                    .charges-section { margin: 20px 0; }
                    .charge-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                    .charge-desc { flex: 1; }
                    .charge-amount { text-align: right; min-width: 100px; font-weight: 500; }
                    .total-due { border-bottom: 2px solid #000; border-top: 2px solid #000; font-weight: bold; font-size: 16px; padding: 12px 0; margin-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="hotel-name">WOODLAND SUITE</div>
                    <div class="invoice-title">INVOICE</div>
                </div>

                <div class="details-section">
                    <div class="detail-item"><strong>Guest Name:</strong> ${
                        invoice.guestName
                    }</div>
                    <div class="detail-item"><strong>Room Number:</strong> ${
                        invoice.roomNumber
                    }</div>
                    <div class="detail-item"><strong>Invoice Date:</strong> ${formatDate(
                        new Date()
                    )}</div>
                </div>

                <!-- Additional Details Section -->
                <div class="section-title">Stay Details</div>
                <div class="details-section">
                    <div class="detail-item"><strong>Check-In:</strong> ${formatDate(
                        invoice.checkIn
                    )}</div>
                    <div class="detail-item"><strong>Check-Out:</strong> ${
                        invoice.checkOut ? formatDate(invoice.checkOut) : 'Still Checked In'
                    }</div>
                    ${
                        invoice.extendedStay
                            ? `<div class="detail-item"><strong>Extended Until:</strong> ${formatDate(
                                  invoice.newCheckOut
                              )}</div>`
                            : ""
                    }
                    <div class="detail-item"><strong>Duration:</strong> ${
                        invoice.checkOut 
                            ? calculateHours(invoice.checkIn, invoice.checkOut) + ' hours'
                            : invoice.selectedHours + ' hours (Booked)'
                    }</div>
                </div>

                <!-- Amenities Section -->
                ${
                    invoice.amenities?.length
                        ? `
                        <div class="section-title">Amenities</div>
                        <div class="details-section">
                            ${invoice.amenities.join(", ")}
                        </div>`
                        : ""
                }

                <!-- Charges Breakdown -->
                <div class="section-title">Charges Breakdown</div>
                <div class="charges-section">
                    <div class="charge-item">
                        <span class="charge-desc">Room Rate - ${invoice.selectedHours} hrs</span>
                        <span class="charge-amount">${formatCurrency(invoice.paymentData?.roomRate || 0)}</span>
                    </div>
                    ${invoice.paymentData?.extendHours > 0 ? `
                    <div class="charge-item">
                        <span class="charge-desc">Extend Charges - ${invoice.paymentData?.extendHours} hrs</span>
                        <span class="charge-amount">${formatCurrency(invoice.paymentData?.extendAmount || 0)}</span>
                    </div>
                    ` : ''}
                    ${invoice.paymentData?.additionalPersonTotal > 0 ? `
                    <div class="charge-item">
                        <span class="charge-desc">Additional Person(s) (${invoice.paymentData?.additionalPersonCount} person(s))</span>
                        <span class="charge-amount">${formatCurrency(invoice.paymentData?.additionalPersonTotal || 0)}</span>
                    </div>
                    ` : ''}
                    ${invoice.paymentData?.amenitiesTotal > 0 ? `
                    <div class="charge-item">
                        <span class="charge-desc">Amenities Rental</span>
                        <span class="charge-amount">${formatCurrency(invoice.paymentData?.amenitiesTotal || 0)}</span>
                    </div>
                    ` : ''}
                    ${invoice.paymentData?.extrasTotal > 0 ? `
                    <div class="charge-item">
                        <span class="charge-desc">Consumables</span>
                        <span class="charge-amount">${formatCurrency(invoice.paymentData?.extrasTotal || 0)}</span>
                    </div>
                    ` : ''}
                    ${invoice.paymentData?.damageCharges > 0 ? `
                    <div class="charge-item" style="color: red;">
                        <span class="charge-desc">Damage Charges</span>
                        <span class="charge-amount">${formatCurrency(invoice.paymentData?.damageCharges || 0)}</span>
                    </div>
                    ` : ''}
                    ${invoice.discount?.amount > 0 ? `
                    <div class="charge-item" style="color: green;">
                        <span class="charge-desc">Discount (${invoice.discount?.name})</span>
                        <span class="charge-amount">-${formatCurrency(invoice.discount?.amount || 0)}</span>
                    </div>
                    ` : ''}
                    <div class="charge-item total-due">
                        <span class="charge-desc">TOTAL DUE</span>
                        <span class="charge-amount">${formatCurrency(invoice.paymentData?.totalDue || invoice.totalAmount)}</span>
                    </div>
                </div>

                <div class="footer">
                    <p>Thank you for choosing Woodland Suite!</p>
                </div>
            </body>
        </html>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(printContent);
    printWindow.document.close();

    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 100);
};

// Add this helper function
const calculateHours = (checkIn, checkOut) => {
    const diff = new Date(checkOut) - new Date(checkIn);
    return Math.round(diff / (1000 * 60 * 60)); // Convert ms to hours
};

const deleteInvoice = async () => {
    try {
        await deleteRoomInvoice(selectedInvoice.value.id);
        
        // Remove from local data
        billingData.value = billingData.value.filter(
            (item) => item.id !== selectedInvoice.value.id
        );
        
        deleteDialogVisible.value = false;
        selectedInvoice.value = null;

        // Show success toast
        toast.add({
            severity: "success",
            summary: "Deleted",
            detail: "Invoice deleted successfully",
            life: 3000,
        });
    } catch (error) {
        toast.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to delete invoice",
            life: 3000,
        });
    }
};

const cancelDelete = () => {
    deleteDialogVisible.value = false;
    selectedInvoice.value = null;
};

// Utility functions
const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(value);
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const calculateDiscountedRate = (originalRate, roomData) => {
    if (!originalRate) return 0
    
    // Manual discount takes precedence
    if (roomData.discount?.amount > 0) {
        return Math.max(0, originalRate - roomData.discount.amount)
    }
    
    // Percentage discount
    if (roomData.discount?.percent > 0) {
        const discountAmount = (originalRate * roomData.discount.percent) / 100
        return Math.max(0, originalRate - discountAmount)
    }
    
    return originalRate
}

const detailsDialogVisible = ref(false);
const selectedRoom = ref(null);

const showDetails = (room) => {
    selectedRoom.value = room;
    detailsDialogVisible.value = true;
};

const closeDetails = () => {
    detailsDialogVisible.value = false;
    selectedRoom.value = null;
};
</script>


<template>
    <div class="card flex flex-col max-h-[calc(100vh-8rem)]">
        <!-- Filter Section -->
        <div class="gap-4 mb-6 flex-shrink-0">
            <div class="flex flex-row gap-4 items-center">
                <Button
                    type="button"
                    icon="pi pi-filter-slash"
                    label="Clear"
                    outlined
                    @click="
                        searchQuery = '';
                        searchDate = null;
                    "
                />
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText
                        v-model="searchQuery"
                        placeholder="Keyword Search"
                        class="w-80"
                    />
                </IconField>
                
                <!-- Single Date Filter -->
                <DatePicker
                    v-model="searchDate"
                    :manualInput="false"
                    dateFormat="mm/dd/yy"
                    placeholder="Search by Date"
                    :showIcon="true"
                    iconDisplay="input"
                    class="w-64"
                />
            </div>
        </div>
        <!-- Default Billing Table -->
        <div class="overflow-y-auto flex-1 pr-2">
            <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Room Invoice</h2>
            
            <!-- Empty State -->
            <div v-if="!loading && filteredBillingData.length === 0" class="text-center py-16">
                <div class="flex flex-col items-center">
                    <i class="pi pi-file-o text-6xl text-gray-400 dark:text-gray-500 mb-4"></i>
                    <h3 class="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No Invoice Records Found</h3>
                    <p class="text-gray-500 dark:text-gray-400 mb-4">There are currently no invoice records available to display.</p>
                    <Button 
                        icon="pi pi-refresh" 
                        label="Refresh" 
                        @click="loadRoomInvoices"
                        outlined
                    />
                </div>
            </div>

            <!-- Billing Table (Check-In/Check-Out) -->
            <DataTable 
                v-else 
                :value="filteredBillingData" 
                class="p-datatable-striped" 
                :loading="loading"
                :paginator="true"
                :rows="10"
            >
                <Column field="guestName" header="Guest Name"></Column>
                <Column field="roomNumber" header="Room"></Column>
                <Column field="checkIn" header="Check-In Date">
                    <template #body="{ data }">
                        {{ data.checkIn ? formatDate(data.checkIn) : 'N/A' }}
                    </template>
                </Column>
                <Column field="checkOut" header="Check-Out Date">
                    <template #body="{ data }">
                        {{ data.checkOut ? formatDate(data.checkOut) : 'N/A' }}
                    </template>
                </Column>
                <Column field="totalAmount" header="Total Amount">
                    <template #body="{ data }">
                        {{ formatCurrency(data.paymentData.totalDue || data.totalAmount) }}
                    </template>
                </Column>

                <Column header="Actions">
                    <template #body="{ data }">
                        <div class="flex gap-2">
                            <Button
                                icon="pi pi-info-circle"
                                class="p-button-info"
                                @click="showDetails(data)"
                                outlined
                                rounded
                                v-tooltip.top="'View details'"
                            />

                            <Button
                                icon="pi pi-print"
                                outlined
                                rounded
                                @click="handlePrint(data)"
                                v-tooltip.top="'Print Invoice'"
                            />

                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>

    <!-- Room Details Dialog -->
    <Dialog
        v-model:visible="detailsDialogVisible"
        :header="`Room Invoice Details - ${selectedRoom?.guestName}`"
        :style="{ width: '90vw', maxWidth: '1200px' }"
        :modal="true"
        :closable="true"
        maximizable
        class="p-fluid"
        :dismissable-mask="true"
    >
    
        <div v-if="selectedRoom" class="p-6">
            <!-- Guest Header Section -->
            <div class="mb-6 pb-4 border-b border-gray-200 dark:border-gray-600">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {{ selectedRoom.guestName }}
                </h2>
                <div class="flex flex-wrap gap-4 items-center">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-home text-blue-500"></i>
                        <span class="text-gray-700 dark:text-gray-300">Room {{ selectedRoom.roomNumber }} - {{ selectedRoom.roomType }}</span>
                    </div>
                    <Tag
                        :value="`${selectedRoom.selectedHours}hrs`"
                        severity="info"
                    />
                    <Tag
                        :value="selectedRoom.status"
                        :severity="selectedRoom.status === 'Checked-In' ? 'success' : selectedRoom.status === 'Checked-Out' ? 'info' : 'secondary'"
                    />
                    <div class="flex items-center gap-2">
                        <i class="pi pi-money-bill text-green-500"></i>
                        <span class="font-semibold text-gray-900 dark:text-gray-100">
                            {{ formatCurrency(selectedRoom.selectedRate) }}
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
                                <span class="text-gray-700 dark:text-gray-300">{{ selectedRoom.contactInfo.cellphone }}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <i class="pi pi-envelope text-gray-500"></i>
                                <span class="text-gray-700 dark:text-gray-300">{{ selectedRoom.contactInfo.email }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Check-in/Check-out Times -->
                    <div class="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                        <h3 class="font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                            <i class="pi pi-clock"></i>
                            Check-in/Check-out Times
                        </h3>
                        <div class="space-y-2">
                            <div class="flex justify-between items-center">
                                <span class="text-gray-700 dark:text-gray-300">Check-in:</span>
                                <span class="font-medium text-gray-900 dark:text-gray-100">{{ formatDate(selectedRoom.checkIn) }}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-700 dark:text-gray-300">Check-out:</span>
                                <span class="font-medium text-gray-900 dark:text-gray-100">
                                    {{ selectedRoom.checkOut ? formatDate(selectedRoom.checkOut) : 'Still Checked In' }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Summary -->
                    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                        <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                            <i class="pi pi-credit-card text-green-500"></i>
                            Payment Summary
                        </h3>
                        <div class="space-y-2">
                            <!-- Discount Information -->
                            <div v-if="selectedRoom.discount.name || selectedRoom.discount.amount > 0" class="bg-green-50 dark:bg-green-900/30 p-3 rounded mb-3">
                                <!-- Percentage Discount -->
                                <div v-if="selectedRoom.discount.name && selectedRoom.discount.percent > 0" class="flex items-center justify-between mb-2">
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-percentage text-green-600"></i>
                                        <span class="font-medium text-green-700 dark:text-green-300">{{ selectedRoom.discount.name }}</span>
                                    </div>
                                    <span class="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                        {{ selectedRoom.discount.percent }}% off
                                    </span>
                                </div>
                                <!-- Manual Discount -->
                                <div v-if="selectedRoom.discount.amount > 0" class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-money-bill text-green-600"></i>
                                        <span class="font-medium text-green-700 dark:text-green-300">Manual Discount</span>
                                    </div>
                                    <span class="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                        {{ formatCurrency(selectedRoom.discount.amount) }}
                                    </span>
                                </div>
                            </div>
                            
                            <!-- Payment Breakdown -->
                            <div class="space-y-2">
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600 dark:text-gray-400">Room Rate:</span>
                                    <div class="text-right">
                                        <!-- Show discount calculation if there's a discount -->
                                        <div v-if="selectedRoom.discount.amount > 0 || (selectedRoom.discount.name && selectedRoom.discount.percent > 0)" class="flex flex-col items-end">
                                            <!-- Original price with red strikethrough -->
                                            <span class="text-sm text-red-500 dark:text-red-400 line-through">
                                                {{ formatCurrency(selectedRoom.paymentData.roomRate) }}
                                            </span>
                                            <!-- Discounted price -->
                                            <span class="font-medium text-gray-900 dark:text-gray-100">
                                                {{ formatCurrency(calculateDiscountedRate(selectedRoom.paymentData.roomRate, selectedRoom)) }}
                                            </span>
                                            <!-- Discount amount/percentage -->
                                            <span class="text-xs text-green-600 dark:text-green-400">
                                                <span v-if="selectedRoom.discount.amount > 0">-{{ formatCurrency(selectedRoom.discount.amount) }}</span>
                                                <span v-else-if="selectedRoom.discount.percent > 0">-{{ selectedRoom.discount.percent }}%</span>
                                            </span>
                                        </div>
                                        <!-- No discount - show regular price -->
                                        <span v-else class="font-medium text-gray-900 dark:text-gray-100">
                                            {{ formatCurrency(selectedRoom.paymentData.roomRate) }}
                                        </span>
                                    </div>
                                </div>
                                <div v-if="selectedRoom.paymentData.extendAmount > 0" class="flex justify-between items-center">
                                    <div class="flex items-center gap-2">
                                        <span class="text-gray-600 dark:text-gray-400">Extend Charges:</span>
                                        <span v-if="selectedRoom.paymentData.extendHours > 0" class="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                                            {{ selectedRoom.paymentData.extendHours }}h
                                        </span>
                                    </div>
                                    <span class="font-medium text-gray-900 dark:text-gray-100">{{ formatCurrency(selectedRoom.paymentData.extendAmount) }}</span>
                                </div>
                                <div v-if="selectedRoom.paymentData.extrasTotal > 0" class="flex justify-between items-center">
                                    <span class="text-gray-600 dark:text-gray-400">Consumables:</span>
                                    <span class="font-medium text-gray-900 dark:text-gray-100">{{ formatCurrency(selectedRoom.paymentData.extrasTotal) }}</span>
                                </div>
                                <div v-if="selectedRoom.paymentData.amenitiesTotal > 0" class="flex justify-between items-center">
                                    <span class="text-gray-600 dark:text-gray-400">Amenities:</span>
                                    <span class="font-medium text-gray-900 dark:text-gray-100">{{ formatCurrency(selectedRoom.paymentData.amenitiesTotal) }}</span>
                                </div>
                                <div v-if="selectedRoom.paymentData.additionalPersonCount > 0" class="flex justify-between items-center">
                                    <div class="flex items-center gap-2">
                                        <span class="text-gray-600 dark:text-gray-400">Additional Person:</span>
                                        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                            {{ selectedRoom.paymentData.additionalPersonCount }} person{{ selectedRoom.paymentData.additionalPersonCount > 1 ? 's' : '' }}
                                        </span>
                                    </div>
                                    <span class="font-medium text-gray-900 dark:text-gray-100">{{ formatCurrency(selectedRoom.paymentData.additionalPersonTotal) }}</span>
                                </div>
                                <div v-if="selectedRoom.paymentData.damageCharges > 0" class="flex justify-between items-center">
                                    <span class="text-red-600 dark:text-red-400">Damage Charges:</span>
                                    <span class="font-medium text-red-600 dark:text-red-400">{{ formatCurrency(selectedRoom.paymentData.damageCharges) }}</span>
                                </div>
                                
                                <div class="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between items-center">
                                    <span class="font-semibold text-gray-900 dark:text-gray-100">Total Due:</span>
                                    <span class="font-bold text-lg text-gray-900 dark:text-gray-100">{{ formatCurrency(selectedRoom.paymentData.totalDue) }}</span>
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
                </div>

                <!-- Right Column - Items & Services -->
                <div class="space-y-4">
                     <!-- Consumables -->
                    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                        <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                            <i class="pi pi-shopping-cart text-orange-500"></i>
                            Consumables
                        </h3>
                        <div v-if="selectedRoom.consumableProducts && selectedRoom.consumableProducts.length > 0"
                             class="space-y-2 max-h-40 overflow-y-auto">
                            <div v-for="(product, index) in selectedRoom.consumableProducts" 
                                 :key="index"
                                 class="flex items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <div class="flex-1">
                                    <div class="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                        {{ product.name }}
                                    </div>
                                    <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        <span class="bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">
                                            Qty: {{ product.quantity }}
                                        </span>
                                        <span>{{ formatCurrency(parseFloat(product.price) || 0) }} each</span>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="font-semibold text-orange-600 dark:text-orange-400">
                                        {{ formatCurrency(parseFloat(product.total || product.price) || 0) }}
                                    </div>
                                </div>
                            </div>
                            <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                                <span class="font-medium text-gray-700 dark:text-gray-300">Total Consumables:</span>
                                <span class="font-bold text-orange-600 dark:text-orange-400">
                                    {{ formatCurrency(selectedRoom.paymentData.extrasTotal) }}
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
                        <div v-if="selectedRoom.rentalAmenities && selectedRoom.rentalAmenities.length > 0" 
                             class="space-y-2 max-h-40 overflow-y-auto">
                            <div v-for="(amenity, index) in selectedRoom.rentalAmenities" 
                                 :key="index"
                                 class="flex items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <div class="flex-1">
                                    <div class="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                        {{ amenity.split(' - ')[0] }}
                                    </div>
                                </div>
                                <div class="font-semibold text-purple-600 dark:text-purple-400">
                                    ₱{{ parseFloat(amenity.split(' - ')[1] || '0').toFixed(2) }}
                                </div>
                            </div>
                            <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                                <span class="font-medium text-gray-700 dark:text-gray-300">Total Amenities:</span>
                                <span class="font-bold text-purple-600 dark:text-purple-400">
                                    {{ formatCurrency(selectedRoom.paymentData.amenitiesTotal) }}
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

            <!-- Notes Section -->
            <div v-if="selectedRoom.notes" class="mt-6 pt-3 border-t border-gray-200 dark:border-gray-600">
                <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <i class="pi pi-file-edit text-blue-500"></i>
                    Special Notes
                </h3>
                <div class="p-3 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200">
                    {{ selectedRoom.notes }}
                </div>
            </div>
        </div>
        
        <template #footer>
            <div class="flex justify-end gap-2">
                
                <Button label="Close" icon="pi pi-times" @click="closeDetails" />
            </div>
        </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog
        v-model:visible="deleteDialogVisible"
        header="Confirm Deletion"
        :style="{ width: '450px' }"
        :modal="true"
    >
        <div class="flex align-items-center gap-3 mb-3">
            <i
                class="pi pi-exclamation-triangle text-red-500"
                style="font-size: 2rem"
            />
            <span v-if="selectedInvoice" class="text-gray-800 dark:text-gray-200">
                Are you sure you want to delete the invoice for
                <strong>{{ selectedInvoice.guestName }}</strong> in Room
                <strong>{{ selectedInvoice.roomNumber }}</strong
                >?
            </span>
        </div>

        <template #footer>
            <Button
                label="Cancel"
                icon="pi pi-times"
                class="p-button-text"
                @click="cancelDelete"
            />
            <Button
                label="Delete"
                icon="pi pi-trash"
                class="p-button-danger"
                @click="deleteInvoice"
            />
        </template>
    </Dialog>
</template>
