<script setup>
import { FilterMatchMode, FilterOperator } from "@primevue/core/api";
import { onBeforeMount, ref } from "vue";

const reservations = ref(null);

const filters = ref(null);

const mockReservations = [
    {
        BookingCode: "RES-1001",
        guestName: "John Doe",
        roomNumber: "201",
        roomType: "Double Size Bed",
        selectedHours: 24,
        selectedRate: 299.99,
        checkInDate: "2023-12-25T15:00:00",
        checkOutDate: "2023-12-30T11:00:00",
        isCheckOutExtended: true,
        extendedCheckOutDate: "2023-12-30T15:00:00",
        paymentStatus: {
            ratePaid: true,
            depositAmount: 100.0,
            depositStatus: "Paid",
            balanceDue: 0.0,
        },
        ExtraAmenities: [" pillows"],
        contactInfo: " +1 (555) 123-4567",
        loyaltyStatus: "Gold Member",
        checkInStatus: "Completed",
        notes: "Lorem Ipsum",
    },
    {
        BookingCode: "RES-1002",
        guestName: "Jane Smith",
        roomNumber: "305",
        roomType: "Single Size Bed",
        selectedHours: 12,
        selectedRate: 399.99,
        checkInDate: "2023-12-24T14:00:00",
        checkOutDate: "2023-12-28T10:00:00",
        isCheckOutExtended: false,
        paymentStatus: {
            ratePaid: true,
            depositAmount: 150.0,
            depositStatus: "Paid",
            balanceDue: 399.99,
        },
        ExtraAmenities: ["Blankets", "Towels"],
        contactInfo: " +1 (555) 987-6543",
        loyaltyStatus: "Silver Member",
        checkInStatus: "Pending",
        notes: "Lorem Ipsum",
    },
];
onBeforeMount(() => {
    reservations.value = mockReservations.map((reservation) => ({
        ...reservation,
        checkInDate: new Date(reservation.checkInDate),
        checkOutDate: new Date(reservation.checkOutDate),
    }));
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

        <!-- Clear and Search -->
        <div class="flex gap-4 mb-4">
            <Button
                type="button"
                icon="pi pi-filter-slash"
                label="Clear"
                outlined
                class="mb-4"
            />
            <IconField>
                <InputText placeholder="Keyword Search" class="w-full" />
            </IconField>
        </div>
        <DataTable
            :value="reservations"
            scrollable
            scrollHeight="600px"
            class="mt-6"
            :filters="filters"
        >
            <!-- Visible Columns -->
            <Column
                field="roomNumber"
                header="Room Number"
                style="min-width: 120px"
            ></Column>

            <Column
                field="BookingCode"
                header="Booking Code"
                style="min-width: 150px"
            ></Column>

            <Column
                field="checkOutDate"
                header="Check-Out Date/Time"
                style="min-width: 200px"
                class="text-center text-red-500"
            >
                <template #body="{ data }">
                    <div class="flex flex-col items-center gap-1">
                        <div
                            v-if="data.isCheckOutExtended"
                            class="text-red-500"
                        >
                            {{
                                new Date(
                                    data.extendedCheckOutDate,
                                ).toLocaleString()
                            }}
                            <Tag
                                :value="`+${Math.round((new Date(data.extendedCheckOutDate) - new Date(data.checkOutDate)) / (1000 * 60 * 60))}hrs`"
                                severity="danger"
                                class="ml-2 text-xs"
                            />
                        </div>
                        <div
                            :class="{
                                'text-gray-400 line-through text-sm':
                                    data.isCheckOutExtended,
                            }"
                        >
                            {{ new Date(data.checkOutDate).toLocaleString() }}
                        </div>
                    </div>
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

                        <div
                            v-if="selectedReservation.isCheckOutExtended"
                            class="bg-orange-50 p-2 rounded"
                        >
                            <div
                                class="flex items-center gap-2 text-orange-700"
                            >
                                <i class="pi pi-clock"></i>
                                <div class="flex flex-col">
                                    <span class="text-sm font-medium"
                                        >Extended Check-Out</span
                                    >
                                    <span class="text-xs">
                                        New time:
                                        {{
                                            selectedReservation.extendedCheckOutDate.toLocaleString()
                                        }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Payment Status -->

                        <div class="flex flex-col gap-2">
                            <label class="font-medium">Deposit</label>
                            <div class="flex items-center gap-3">
                                <Tag
                                    :severity="
                                        selectedReservation.paymentStatus
                                            .ratePaid
                                            ? 'success'
                                            : 'danger'
                                    "
                                    :icon="
                                        selectedReservation.paymentStatus
                                            .ratePaid
                                            ? 'pi pi-check'
                                            : 'pi pi-times'
                                    "
                                    :value="
                                        selectedReservation.paymentStatus
                                            .ratePaid
                                            ? 'Paid'
                                            : 'Pending'
                                    "
                                />
                                <div class="flex items-center gap-1">
                                    <i class="pi pi-wallet text-blue-500"></i>
                                    <span>{{
                                        formatCurrency(
                                            selectedReservation.paymentStatus
                                                .depositAmount,
                                        )
                                    }}</span>
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
                                <div class="mt-1">
                                    {{ selectedReservation.contactInfo }}
                                </div>
                            </div>
                            <div>
                                <label class="font-medium">Amenities:</label>
                                <div
                                    v-if="selectedReservation.ExtraAmenities"
                                    class="mt-1"
                                >
                                    <div
                                        v-for="(
                                            amenity, index
                                        ) in selectedReservation.ExtraAmenities"
                                        :key="index"
                                    >
                                        • {{ amenity }}
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
