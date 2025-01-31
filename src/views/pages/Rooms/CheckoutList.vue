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
        selectedHours: 24, // Added selected hours
        selectedRate: 299.99,
        checkInDate: "2023-12-25T15:00:00",
        checkOutDate: "2023-12-30T11:00:00",
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
        selectedHours: 12, // Added selected hours
        selectedRate: 399.99,
        checkInDate: "2023-12-24T14:00:00",
        checkOutDate: "2023-12-28T10:00:00",
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

function getDepositSeverity(status) {
    switch (status.toLowerCase()) {
        case "pending":
            return "warning";
        case "refunded":
            return "success";
        case "claimed":
            return "info";
        default:
            return "info";
    }
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
            <Column
                field="guestName"
                header="Guest Name"
                style="min-width: 200px"
                frozen
                class="font-bold"
            ></Column>

            <Column
                field="roomNumber"
                header="Room Number"
                style="min-width: 120px"
            ></Column>
            <Column
                field="roomType"
                header="Room Type"
                style="min-width: 150px"
            ></Column>
            <Column
                field="selectedHours"
                header="Selected Hours"
                style="min-width: 150px"
            >
                <template #body="{ data }">
                    <Tag
                        :value="`${data.selectedHours}hrs`"
                        severity="info"
                        class="font-bold"
                    />
                </template>
            </Column>

            <Column
                field="checkOutDate"
                header="Check-Out Date/Time"
                style="min-width: 200px"
                class="text-red-500"
            >
                <template #body="{ data }">
                    {{ data.checkOutDate.toLocaleString() }}
                </template>
            </Column>

            <Column header="Payment Status" style="min-width: 400px">
                <template #body="{ data }">
                    <div
                        class="flex flex-row items-center justify-between gap-4"
                    >
                        <!-- Rate Status -->
                        <div class="flex-1 text-center min-w-[120px]">
                            <div class="text-xs font-medium text-gray-500 mb-1">
                                Rate Status
                            </div>
                            <Tag
                                :severity="
                                    data.paymentStatus.ratePaid
                                        ? 'success'
                                        : 'danger'
                                "
                                :icon="
                                    data.paymentStatus.ratePaid
                                        ? 'pi pi-check'
                                        : 'pi pi-times'
                                "
                                :value="
                                    data.paymentStatus.ratePaid
                                        ? 'Paid'
                                        : 'Pending'
                                "
                                class="p-tag-sm px-2 py-1"
                            />
                        </div>

                        <!-- Deposit -->
                        <div class="flex-1 text-center min-w-[140px]">
                            <div class="text-xs font-medium text-gray-500 mb-1">
                                Deposit
                            </div>
                            <div class="flex items-center justify-center gap-1">
                                <span class="font-mono text-sm">
                                    {{
                                        formatCurrency(
                                            data.paymentStatus.depositAmount,
                                        )
                                    }}
                                </span>
                                <i class="pi pi-wallet ml-1 text-blue-500"></i>
                            </div>
                        </div>

                        <!-- Deposit Status -->
                        <div class="flex-1 text-center min-w-[120px]">
                            <div class="text-xs font-medium text-gray-500 mb-1">
                                Deposit Status
                            </div>
                            <Tag
                                :severity="
                                    getDepositSeverity(
                                        data.paymentStatus.depositStatus,
                                    )
                                "
                                :value="data.paymentStatus.depositStatus"
                                class="p-tag-sm px-2 py-1"
                            />
                        </div>
                    </div>
                </template>
            </Column>

            <Column
                field="ExtraAmenities"
                header="Extra Amenities"
                style="min-width: 250px"
            >
                <template #body="{ data }">
                    <div v-if="data.ExtraAmenities" class="flex flex-column">
                        <span
                            v-for="(request, index) in data.ExtraAmenities"
                            :key="index"
                        >
                            • {{ request }}
                        </span>
                    </div>
                </template>
            </Column>

            <Column
                field="contactInfo"
                header="Contact Info"
                style="min-width: 200px"
            ></Column>

            <Column header="Notes" style="min-width: 300px">
                <template #body="{ data }">
                    <div class="notes-container">
                        {{ data.notes || "No special notes" }}
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<style scoped lang="scss">
:deep(.p-datatable-frozen-tbody) {
    font-weight: bold;
    background-color: #f8f9fa;
}

:deep(.p-datatable-scrollable .p-frozen-column) {
    background-color: #f8f9fa;
}

.notes-container {
    max-width: 300px;
    white-space: normal;
    word-wrap: break-word;
}

.font-bold {
    font-weight: 700;
}

.text-red-600 {
    color: #dc2626;
}
</style>
