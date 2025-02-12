<script setup>
import { ref } from "vue";

const showPosInvoices = ref(false);

// Sample billing data (Check-In/Check-Out transactions)
const billingData = ref([
    {
        guestName: "John Doe",
        roomNumber: "201",
        checkIn: "2024-03-01T14:00:00",
        checkOut: "2024-03-03T11:00:00",
        totalAmount: 299.99,
        status: "Paid",
    },
    {
        guestName: "Jane Smith",
        roomNumber: "305",
        checkIn: "2024-03-02T15:30:00",
        checkOut: "2024-03-05T10:00:00",
        totalAmount: 599.97,
        status: "Pending",
    },
]);

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
            <!-- Advanced Filters -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- Global Search -->
                <div class="flex flex-row gap-4">
                    <Button
                        type="button"
                        icon="pi pi-filter-slash"
                        label="Clear"
                        outlined
                    />
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText
                            placeholder="Keyword Search"
                            class="w-full"
                        />
                    </IconField>
                </div>

                <!-- Date Range Filter -->
                <Calendar
                    v-model="dateRange"
                    selectionMode="range"
                    dateFormat="yy-mm-dd"
                    placeholder="Select Date Range"
                    showIcon
                    iconDisplay="input"
                    :icon="'pi pi-calendar'"
                />
            </div>
        </div>
        <!-- Default Billing Table -->
        <div>
            <h2 class="text-xl font-bold mb-4">Room Invoice</h2>
            <!-- Billing Table (Check-In/Check-Out) -->
            <DataTable
                :value="billingData"
                v-if="!showPosInvoices"
                class="p-datatable-striped"
            >
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
                    <div>
                        <Button
                            icon="pi pi-info-circle"
                            class="p-button-info"
                            @click="showDetails($event, data)"
                            outlined
                            rounded
                        />
                        <Button
                            icon="pi pi-trash"
                            class="p-button-danger"
                            outlined
                            rounded
                        />
                    </div>
                    <template #body="{ data }">
                        <div class="flex gap-2">
                            <Button
                                icon="pi pi-info-circle"
                                class="p-button-info"
                                @click="showDetails($event, data)"
                                outlined
                                rounded
                            />
                            <Button
                                icon="pi pi-trash"
                                class="p-button-danger"
                                outlined
                                rounded
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
</template>
