<script setup>
import { BookingService } from "@/service/BookingService";
import { onMounted, ref } from "vue";

const pendingBookings = ref(null);

function formatDate(value) {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(value).toLocaleDateString("en-US", options);
}

onMounted(() => {
    // Fetch pending bookings
    BookingService.getPendingBookings().then((data) => {
        pendingBookings.value = data;
    });
});
</script>

<template>
    <div class="card">
        <!-- Title -->
        <div class="font-semibold text-xl mb-2">Canceled Bookings</div>
        <!-- Data Table -->
        <DataTable
            :value="pendingBookings"
            :rows="5"
            :paginator="true"
            responsiveLayout="scroll"
        >
            <!-- Guest Name Column -->
            <Column
                field="guestName"
                header="Guest Name"
                :sortable="true"
                style="width: 35%"
                class="mb-9"
            ></Column>

            <!-- Room Number Column -->
            <Column
                field="roomNumber"
                header="Room Number"
                :sortable="true"
                style="width: 20%"
            ></Column>

            <!-- Booking Date Column -->
            <Column
                field="bookingDate"
                header="Booking Date"
                :sortable="true"
                style="width: 30%"
            >
                <template #body="slotProps">
                    {{ formatDate(slotProps.data.bookingDate) }}
                </template>
            </Column>
        </DataTable>
    </div>
</template>
