<script setup>
import { useToast } from "primevue/usetoast";
import { computed, ref } from "vue";

// Sample billing data (Check-In/Check-Out transactions)
const billingData = ref([
    // Extended stay with extra amenities
    {
        guestName: "John Doe",
        roomNumber: "201",
        checkIn: "2024-03-01T14:00:00",
        checkOut: "2024-03-03T11:00:00",
        totalAmount: 299.99,
        hourlyRate: 6.25,
        amenities: ["WiFi", "TV", "Mini Bar", "Extra Pillow"],
        extendedStay: true,
        newCheckOut: "2024-03-04T11:00:00",
    },

    // Regular stay with basic amenities
    {
        guestName: "Alice Johnson",
        roomNumber: "305",
        checkIn: "2024-03-05T12:00:00",
        checkOut: "2024-03-06T10:00:00",
        totalAmount: 154.0,
        hourlyRate: 7.0,
        amenities: ["WiFi", "TV"],
        extendedStay: false,
    },

    // Extended stay with no amenities
    {
        guestName: "Bob Smith",
        roomNumber: "402",
        checkIn: "2024-03-10T15:00:00",
        checkOut: "2024-03-12T12:00:00",
        totalAmount: 379.5,
        hourlyRate: 5.5,
        amenities: [],
        extendedStay: true,
        newCheckOut: "2024-03-13T12:00:00",
    },

    // Premium stay with luxury amenities
    {
        guestName: "Carol Davis",
        roomNumber: "105",
        checkIn: "2024-03-15T14:00:00",
        checkOut: "2024-03-16T11:00:00",
        totalAmount: 183.75,
        hourlyRate: 8.75,
        amenities: ["WiFi", "TV", "Spa Access", "Mini Bar", "Daily Newspaper"],
        extendedStay: false,
    },

    // Extended stay with comfort items
    {
        guestName: "David Wilson",
        roomNumber: "204",
        checkIn: "2024-03-20T10:00:00",
        checkOut: "2024-03-21T09:00:00",
        totalAmount: 282.0,
        hourlyRate: 6.0,
        amenities: ["Extra Pillow", "Extra Blanket", "Breakfast"],
        extendedStay: true,
        newCheckOut: "2024-03-22T09:00:00",
    },

    // Long stay with minimal amenities
    {
        guestName: "Eva Brown",
        roomNumber: "303",
        checkIn: "2024-03-25T13:00:00",
        checkOut: "2024-03-28T10:00:00",
        totalAmount: 345.0,
        hourlyRate: 5.0,
        amenities: ["WiFi"],
        extendedStay: false,
    },

    // Short stay with special requests
    {
        guestName: "Frank Miller",
        roomNumber: "106",
        checkIn: "2024-04-01T18:00:00",
        checkOut: "2024-04-02T12:00:00",
        totalAmount: 108.0,
        hourlyRate: 6.0,
        amenities: ["Extra Towels", "Baby Cot", "Late Checkout"],
        extendedStay: false,
    },
]);
const toast = useToast();

const deleteDialogVisible = ref(false);
const selectedInvoice = ref(null);
const searchQuery = ref("");
const dateRange = ref(null);
const sortField = ref("checkIn");
const sortOrder = ref(1);

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

    // Sorting logic
    return filtered.sort((a, b) => {
        const fieldA = new Date(a[sortField.value]);
        const fieldB = new Date(b[sortField.value]);
        return sortOrder.value * (fieldA - fieldB);
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
                    <div class="detail-item"><strong>Check-Out:</strong> ${formatDate(
                        invoice.checkOut
                    )}</div>
                    ${
                        invoice.extendedStay
                            ? `<div class="detail-item"><strong>Extended Until:</strong> ${formatDate(
                                  invoice.newCheckOut
                              )}</div>`
                            : ""
                    }
                    <div class="detail-item"><strong>Duration:</strong> ${calculateHours(
                        invoice.checkIn,
                        invoice.checkOut
                    )} hours</div>
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
                            <td>${formatCurrency(
                                invoice.hourlyRate ||
                                    invoice.totalAmount /
                                        calculateHours(
                                            invoice.checkIn,
                                            invoice.checkOut
                                        )
                            )}/hr</td>
                            <td>${calculateHours(
                                invoice.checkIn,
                                invoice.checkOut
                            )}</td>
                            <td>${formatCurrency(invoice.totalAmount)}</td>
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

const deleteInvoice = () => {
    billingData.value = billingData.value.filter(
        (item) => item !== selectedInvoice.value
    );
    deleteDialogVisible.value = false;
    selectedInvoice.value = null;

    // Show success toast
    toast.add({
        severity: "error",
        summary: "Deleted",
        detail: "Invoice deleted successfully",
        life: 3000,
    });
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
            <h2 class="text-xl font-bold mb-4">Room Invoice</h2>
            <!-- Billing Table (Check-In/Check-Out) -->
            <DataTable :value="filteredBillingData" class="p-datatable-striped">
                <Column field="guestName" header="Guest Name"></Column>
                <Column field="roomNumber" header="Room"></Column>
                <Column field="checkIn" header="Check-In Date">
                    <template #body="{ data }">
                        {{ formatDate(data.checkIn) }}
                    </template>
                </Column>
                <Column field="checkOut" header="Check-Out Date">
                    <template #body="{ data }">
                        {{ formatDate(data.checkOut) }}
                    </template>
                </Column>
                <Column field="totalAmount" header="Total Amount">
                    <template #body="{ data }">
                        {{ formatCurrency(data.totalAmount) }}
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
                                v-tooltip.top="'View detailes '"
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
                <div v-if="selectedRoom" class="space-y-3 min-w-[300px]">
                    <h3 class="text-lg font-bold mb-2 border-b pb-2">
                        Room {{ selectedRoom.roomNumber }} Details
                    </h3>

                    <div class="flex justify-between">
                        <span class="font-medium">Guest:</span>
                        <span>{{ selectedRoom.guestName }}</span>
                    </div>

                    <div class="flex justify-between">
                        <span class="font-medium">Stay Extended:</span>
                        <span>{{
                            selectedRoom.extendedStay ? "Yes" : "N/A"
                        }}</span>
                    </div>

                    <div
                        class="flex justify-between"
                        v-if="selectedRoom.extendedStay"
                    >
                        <span class="font-medium">Extended Until:</span>
                        <span>{{ formatDate(selectedRoom.newCheckOut) }}</span>
                    </div>

                    <div class="flex justify-between">
                        <span class="font-medium">Amenities:</span>
                        <span class="text-right">
                            {{
                                selectedRoom.amenities?.length
                                    ? selectedRoom.amenities.join(", ")
                                    : "N/A"
                            }}
                        </span>
                    </div>

                    <div class="flex justify-between">
                        <span class="font-medium">Hours Booked:</span>
                        <span>{{ selectedRoom.selectedHours }} hrs</span>
                    </div>

                    <div class="flex justify-between">
                        <span class="font-medium">Rate:</span>
                        <span
                            >{{
                                formatCurrency(selectedRoom.hourlyRate)
                            }}/hr</span
                        >
                    </div>

                    <div class="flex justify-between font-bold border-t pt-2">
                        <span>Total:</span>
                        <span>{{
                            formatCurrency(selectedRoom.totalAmount)
                        }}</span>
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
            <span v-if="selectedInvoice">
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
