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
        console.log('Fetching room invoice admin data...');
        const response = await fetchRoomInvoiceAdmin();
        console.log('Raw response:', response);
        
        if (!response.data || response.data.error) {
            console.error('Server error:', response.data?.error);
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
                roomRate: parseFloat(booking.room_rate) || parseFloat(booking.selected_rate) || 0,
                extrasTotal: parseFloat(booking.extras_total) || 0,
                amenitiesTotal: parseFloat(booking.amenities_total) || 0,
                damageCharges: parseFloat(booking.damage_charges) || 0,
                extendHours: parseInt(booking.extend_hours) || 0,
                extendAmount: parseFloat(booking.extend_amount) || 0,
                depositAmount: parseFloat(booking.deposit_amount) || 0,
                totalDue: parseFloat(booking.total_due) || 0,
                balanceDue: Math.max(0, (parseFloat(booking.total_due) || 0) - (parseFloat(booking.deposit_amount) || 0))
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
            },
            
            // Extended stay detection
            extendedStay: booking.extend_hours > 0,
            amenities: booking.rental_amenities ? 
                booking.rental_amenities.split(',').map(item => item.trim().split(' - ')[0]) : []
        }));
    } catch (error) {
        console.error("Error loading room invoices:", error);
        if (error.response) {
            console.error("Server response:", error.response.data);
            console.error("Status:", error.response.status);
        }
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
const dateRange = ref(null);
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

    // Date range filtering
    if (dateRange.value) {
        filtered = filtered.filter(
            (invoice) =>
                new Date(invoice.checkIn) >= new Date(dateRange.value[0]) &&
                new Date(invoice.checkOut) <= new Date(dateRange.value[1])
        );
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

                <!-- Charges Table -->
                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Rate</th>
                            <th>Hours</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Room Accommodation</td>
                            <td>${formatCurrency(invoice.hourlyRate || invoice.selectedRate)}/hr</td>
                            <td>${
                                invoice.checkOut 
                                    ? calculateHours(invoice.checkIn, invoice.checkOut)
                                    : invoice.selectedHours
                            }</td>
                            <td>${formatCurrency(invoice.paymentData?.totalDue || invoice.totalAmount)}</td>
                        </tr>
                    </tbody>
                </table>

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
const downloadInvoice = (invoice) => {
    // Format dates and currency
    const checkInDate = formatDate(invoice.checkIn);
    const checkOutDate = formatDate(invoice.checkOut);
    const totalAmount = formatCurrency(invoice.totalAmount);

    // Create text content
    const textContent = `
WOODLAND SUITE INVOICE
=============================

Guest Name: ${invoice.guestName}
Room Number: ${invoice.roomNumber}
Status: ${invoice.status}

Check-In Date: ${checkInDate}
Check-Out Date: ${checkOutDate}

-----------------------------
          CHARGES
-----------------------------
Room Booking:
  - Duration: ${calculateHours(invoice.checkIn, invoice.checkOut)} hours
  - Rate: ${formatCurrency(invoice.hourlyRate)}/hr
  - Total: ${totalAmount}

-----------------------------
TOTAL AMOUNT: ${totalAmount}
=============================
`;

    // Create and trigger download
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
        "download",
        `Invoice_${invoice.roomNumber}_${invoice.guestName}.txt`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
        console.error("Error deleting invoice:", error);
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

const detailsPanel = ref();
const selectedRoom = ref(null);

const showDetails = (event, room) => {
    selectedRoom.value = room;
    detailsPanel.value.toggle(event);
};
</script>

<template>
    <div class="card">
        <!-- Filter Section -->
        <div class="gap-4 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="flex flex-row gap-4">
                    <Button
                        type="button"
                        icon="pi pi-filter-slash"
                        label="Clear"
                        outlined
                        @click="
                            searchQuery = '';
                            dateRange = null;
                        "
                    />
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText
                            v-model="searchQuery"
                            placeholder="Search guest, room, amount..."
                            class="w-full"
                        />
                    </IconField>
                </div>
            </div>
        </div>
        <!-- Default Billing Table -->
        <div>
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
            <DataTable v-else :value="filteredBillingData" class="p-datatable-striped" :loading="loading">
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
                                @click="showDetails($event, data)"
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

                            <Button
                                icon="pi pi-download"
                                class="p-button-success"
                                @click="downloadInvoice(data)"
                                outlined
                                rounded
                                v-tooltip.top="'Download invoice'"
                            />
                            <Button
                                icon="pi pi-trash"
                                class="p-button-danger"
                                @click="confirmDelete(data)"
                                outlined
                                rounded
                                v-tooltip.top="'Delete invoice'"
                            />
                        </div>
                    </template>
                </Column>
            </DataTable>

            <Popover
                ref="detailsPanel"
                appendTo="body"
                :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
                class="p-4"
            >
                <div v-if="selectedRoom" class="p-4 bg-white dark:bg-gray-800">
                    <!-- Main Horizontal Container -->
                    <div class="flex flex-row gap-4">
                        <!-- Left Column -->
                        <div class="flex-1 flex flex-col gap-3 min-w-[200px]">
                            <!-- Guest Name -->
                            <div class="font-bold text-lg border-b border-gray-200 dark:border-gray-600 pb-2 text-gray-900 dark:text-gray-100">
                                {{ selectedRoom.guestName }}
                            </div>

                            <!-- Room Details -->
                            <div class="flex flex-col gap-2">
                                <div>
                                    <label class="font-medium text-gray-700 dark:text-gray-300">Room Type:</label>
                                    <div class="mt-1 text-gray-900 dark:text-gray-100">
                                        {{ selectedRoom.roomType }}
                                    </div>
                                </div>
                                <div>
                                    <label class="font-medium text-gray-700 dark:text-gray-300">Status:</label>
                                    <Tag
                                        :value="selectedRoom.status"
                                        :severity="selectedRoom.status === 'Checked-In' ? 'success' : selectedRoom.status === 'Checked-Out' ? 'info' : 'secondary'"
                                        class="mt-1"
                                    />
                                </div>
                                <div>
                                    <label class="font-medium text-gray-700 dark:text-gray-300">Selected Hours:</label>
                                    <Tag
                                        :value="`${selectedRoom.selectedHours}hrs`"
                                        severity="info"
                                        class="mt-1"
                                    />
                                </div>
                            </div>
                        </div>

                        <!-- Middle Column -->
                        <div class="flex-1 flex flex-col gap-3 min-w-[250px]">
                            <div>
                                <label class="text-gray-700 dark:text-gray-300">Rate</label>
                                <div class="flex items-center gap-1">
                                    <i class="pi pi-money-bill text-blue-500"></i>
                                    <span class="text-gray-900 dark:text-gray-100">{{ formatCurrency(selectedRoom.selectedRate) }}</span>
                                </div>
                            </div>

                            <!-- Discount Information -->
                            <div v-if="selectedRoom.discount.name" class="bg-green-50 dark:bg-green-900/30 p-3 rounded">
                                <div class="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                                    <i class="pi pi-percentage"></i>
                                    <span class="text-sm font-medium">Discount Applied</span>
                                </div>
                                <div class="text-sm">
                                    <div class="text-gray-800 dark:text-gray-200">{{ selectedRoom.discount.name }}</div>
                                    <div class="text-green-600 dark:text-green-400 font-medium">{{ selectedRoom.discount.percent }}% off</div>
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
                                        <span>{{ formatCurrency(selectedRoom.paymentData.roomRate) }}</span>
                                    </div>
                                    <div v-if="selectedRoom.paymentData.extendAmount > 0" class="flex justify-between">
                                        <span>Extend Charges <span v-if="selectedRoom.paymentData.extendHours > 0" class="bg-orange-200 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-2 py-1 rounded-full text-xs font-medium ml-2">{{ selectedRoom.paymentData.extendHours }}h</span>:</span>
                                        <span>{{ formatCurrency(selectedRoom.paymentData.extendAmount) }}</span>
                                    </div>
                                    <div v-if="selectedRoom.paymentData.extrasTotal > 0" class="flex justify-between">
                                        <span>Consumables:</span>
                                        <span>{{ formatCurrency(selectedRoom.paymentData.extrasTotal) }}</span>
                                    </div>
                                    <div v-if="selectedRoom.paymentData.amenitiesTotal > 0" class="flex justify-between">
                                        <span>Amenities:</span>
                                        <span>{{ formatCurrency(selectedRoom.paymentData.amenitiesTotal) }}</span>
                                    </div>
                                    <div v-if="selectedRoom.paymentData.damageCharges > 0" class="flex justify-between text-red-600">
                                        <span>Damage Charges:</span>
                                        <span>{{ formatCurrency(selectedRoom.paymentData.damageCharges) }}</span>
                                    </div>
                                    <div class="border-t pt-1 font-medium flex justify-between">
                                        <span>Total Due:</span>
                                        <span>{{ formatCurrency(selectedRoom.paymentData.totalDue) }}</span>
                                    </div>
                                    <div class="flex justify-between text-green-600 font-medium">
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
                                    <label class="font-medium text-gray-700 dark:text-gray-300">Contact Info:</label>
                                    <div class="mt-1 flex flex-col gap-1">
                                        <div class="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                                            <i class="pi pi-phone text-blue-500"></i>
                                            {{ selectedRoom.contactInfo.cellphone }}
                                        </div>
                                        <div class="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                                            <i class="pi pi-envelope text-blue-500"></i>
                                            {{ selectedRoom.contactInfo.email }}
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <i class="pi pi-box text-blue-500 mr-2"></i>
                                    <label class="font-medium text-gray-700 dark:text-gray-300">Rented Amenities:</label>
                                    <div class="mt-1">
                                        <div v-if="selectedRoom.rentalAmenities.length > 0" 
                                             class="overflow-y-auto" 
                                             style="max-height: 50px;">
                                            <div
                                                v-for="(amenity, index) in selectedRoom.rentalAmenities"
                                                :key="index"
                                                class="flex items-center justify-between gap-2 py-1 border-b last:border-b-0 border-gray-100 dark:border-gray-600"
                                            >
                                                <div class="flex items-center gap-2">
                                                    <span class="text-gray-800 dark:text-gray-200">{{ amenity.split(' - ')[0] }}</span>
                                                </div>
                                                <span class="text-green-600 dark:text-green-400 font-medium">₱{{ parseFloat(amenity.split(' - ')[1] || '0').toFixed(2) }}</span>
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
                                        <div v-if="selectedRoom.consumableProducts.length > 0"
                                             class="overflow-y-auto"
                                             style="max-height: 100px;">
                                            <div
                                                v-for="(product, index) in selectedRoom.consumableProducts"
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
                            {{ selectedRoom.notes || "No special notes" }}
                        </div>
                    </div>
                </div>
            </Popover>
        </div>
    </div>

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

    <Toast />
</template>
