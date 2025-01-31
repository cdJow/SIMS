<script setup>
import { FilterMatchMode, FilterOperator } from "@primevue/core/api";
import { onBeforeMount, ref } from "vue";

const canceledBookings = ref(null);

const filters = ref(null);

const mockCanceledBookings = [
    {
        BookingCode: "RES-1003",
        guestName: "Alice Johnson",
        roomNumber: "102",
        roomType: "Single Size Bed",
        selectedHours: 6,
        selectedRate: 199.99,
        checkInDate: "2023-12-20T12:00:00",
        checkOutDate: "2023-12-22T10:00:00",
        cancellationDate: "2023-12-19T14:30:00", // Added cancellation date
        cancellationReason: "Change of plans", // Added cancellation reason
        paymentStatus: {
            ratePaid: false,
            depositAmount: 50.0,
            depositStatus: "Refunded",
            balanceDue: 0.0,
        },
        ExtraAmenities: ["Towels"],
        contactInfo: "099294293",
        loyaltyStatus: "Bronze Member",
        notes: "Guest requested a refund.",
    },
    {
        BookingCode: "RES-1004",
        guestName: "Bob Brown",
        roomNumber: "204",
        roomType: "Double Size Bed",
        selectedHours: 12,
        selectedRate: 299.99,
        checkInDate: "2023-12-18T15:00:00",
        checkOutDate: "2023-12-20T11:00:00",
        cancellationDate: "2023-12-17T09:45:00", // Added cancellation date
        cancellationReason: "Flight cancellation", // Added cancellation reason
        paymentStatus: {
            ratePaid: true,
            depositAmount: 100.0,
            depositStatus: "Pending Refund",
            balanceDue: 0.0,
        },
        ExtraAmenities: ["Pillows", "Blankets"],
        contactInfo: "099294293",
        loyaltyStatus: "Silver Member",
        notes: "Guest will rebook later.",
    },
];

onBeforeMount(() => {
    canceledBookings.value = mockCanceledBookings.map((booking) => ({
        ...booking,
        checkInDate: new Date(booking.checkInDate),
        checkOutDate: new Date(booking.checkOutDate),
        cancellationDate: new Date(booking.cancellationDate), // Parse cancellation date
    }));
    initFilters();
});

function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        guestName: {
            operator: FilterOperator.AND,
            constraints: [
                { value: null, matchMode: FilterMatchMode.STARTS_WITH },
            ],
        },
        roomNumber: {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
        },
    };
}
</script>

<template>
    <div class="p-4 bg-white rounded-lg shadow-sm">
        <div class="text-xl font-semibold mb-4">Canceled Bookings</div>

        <!-- Clear and Search -->
        <div class="flex gap-4 mb-4">
            <Button
                type="button"
                icon="pi pi-filter-slash"
                label="Clear"
                outlined
                class="mb-4"
            />
            <div class="flex-1">
                <InputText
                    placeholder="Keyword Search"
                    class="p-2 border rounded-lg"
                />
            </div>
        </div>

        <!-- DataTable -->
        <DataTable
            :value="canceledBookings"
            scrollable
            scrollHeight="600px"
            class="mt-6"
            :filters="filters"
        >
            <!-- Guest Name -->
            <Column
                field="guestName"
                header="Guest Name"
                class="font-bold"
                :style="{ minWidth: '200px' }"
                frozen
            ></Column>

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

            <!-- Room Type -->
            <Column
                field="roomType"
                header="Room Type"
                :style="{ minWidth: '150px' }"
            ></Column>

            <!-- Cancellation Date/Time -->
            <Column
                field="cancellationDate"
                header="Cancellation Date/Time"
                :style="{ minWidth: '200px' }"
            >
                <template #body="{ data }">
                    <span class="text-red-500">
                        {{ data.cancellationDate.toLocaleString() }}
                    </span>
                </template>
            </Column>

            <!-- Contact Info -->
            <Column
                field="contactInfo"
                header="Contact Info"
                :style="{ minWidth: '200px' }"
            ></Column>
        </DataTable>
    </div>
</template>
