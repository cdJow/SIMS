<script setup>
import Card from "primevue/card";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import Tag from "primevue/tag";
import Timeline from "primevue/timeline";
import { ref } from "vue";

// User Data
const user = ref({
    name: "Sarah Johnson",
    tier: "Gold Member",
});

// Menu Items
const menuItems = ref([
    { label: "Dashboard", icon: "pi pi-home" },
    { label: "Bookings", icon: "pi pi-calendar" },
    { label: "Transactions", icon: "pi pi-dollar" },
    { label: "Profile", icon: "pi pi-user" },
    { label: "Support", icon: "pi pi-question-circle" },
]);

// Transaction Data
const transactions = ref([
    {
        date: "2024-03-15",
        description: "Deluxe Room Booking",
        amount: "15500",
        status: "completed",
    },
    {
        date: "2024-03-18",
        description: "Spa Package",
        amount: "3200",
        status: "pending",
    },
    {
        date: "2024-03-20",
        description: "Restaurant Charges",
        amount: "2450",
        status: "completed",
    },
]);

// Booking Data
const bookings = ref([
    {
        roomType: "Executive Suite",
        dates: "Apr 12 - Apr 15, 2024",
        guests: "2 Adults",
        status: "Confirmed",
    },

    {
        roomType: "Executive Suite",
        dates: "Apr 12 - Apr 15, 2024",
        guests: "2 Adults",
        status: "Confirmed",
    },

    {
        roomType: "Deluxe Room",
        dates: "Apr 20 - Apr 22, 2024",
        guests: "2 Adults",
        status: "Pending",
    },
    {
        roomType: "Standard Room",
        dates: "May 5 - May 7, 2024",
        guests: "1 Adult",
        status: "Cancelled",
    },
    {
        roomType: "Family Suite",
        dates: "May 10 - May 12, 2024",
        guests: "4 Adults",
        status: "Confirmed",
    },
]);

// Loyalty Data
const loyaltyProgress = ref((4500 / 5000) * 100);
const rewards = ref([
    {
        title: "Free Room Upgrade",
        description: "Available after 5,000 points",
    },
]);

// Helper Functions
const statusSeverity = (status) => {
    return status === "completed" ? "success" : "warning";
};
</script>
<template>
    <div class="card">
        <!-- Dashboard Layout -->
        <div class="flex">
            <!-- Main Content -->
            <div class="flex-1 p-8">
                <!-- Header -->
                <div class="flex justify-between items-center mb-8">
                    <div>
                        <h1 class="text-2xl font-bold">
                            Welcome back, {{ user.name }}!
                        </h1>
                        <p class="">Your recent activities and bookings</p>
                    </div>
                </div>

                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card class="border-round-lg shadow-sm">
                        <template #title>Upcoming Stays</template>
                        <template #content>
                            <div class="flex items-center justify-between">
                                <span class="text-3xl font-bold text-primary"
                                    >2</span
                                >
                                <i
                                    class="pi pi-calendar-plus text-2xl text-blue-500"
                                ></i>
                            </div>
                        </template>
                    </Card>

                    <Card class="border-round-lg shadow-sm">
                        <template #title>Total Spent</template>
                        <template #content>
                            <div class="flex items-center justify-between">
                                <span class="text-3xl font-bold text-purple-500"
                                    >₱45,800</span
                                >
                                <i
                                    class="pi pi-wallet text-2xl text-purple-500"
                                ></i>
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- Transaction History -->
                <Card class="mb-8 border-round-lg shadow-sm">
                    <template #title>Recent Transactions</template>
                    <template #content>
                        <DataTable
                            :value="transactions"
                            class="p-datatable-sm"
                            responsiveLayout="scroll"
                        >
                            <Column
                                field="date"
                                header="Date"
                                class="font-medium"
                            ></Column>
                            <Column
                                field="description"
                                header="Description"
                            ></Column>
                            <Column field="amount" header="Amount">
                                <template #body="{ data }">
                                    <span class="font-semibold"
                                        >₱{{ data.amount }}</span
                                    >
                                </template>
                            </Column>
                            <Column field="status" header="Status">
                                <template #body="{ data }">
                                    <Tag
                                        :value="data.status"
                                        :severity="statusSeverity(data.status)"
                                        class="capitalize"
                                    />
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </Card>

                <!-- Booking Overview -->
                <div class="">
                    <Card class="border-round-lg shadow-sm">
                        <template #title>Upcoming Bookings</template>
                        <template #content>
                            <Timeline
                                :value="bookings"
                                align="alternate"
                                class="p-timeline-vertical"
                            >
                                <template #marker="{ item }">
                                    <div
                                        class="p-2 bg-blue-500 rounded-full text-white"
                                    >
                                        <i class="pi pi-calendar"></i>
                                    </div>
                                </template>
                                <template #content="{ item }">
                                    <Card class="mb-4">
                                        <template #title>{{
                                            item.roomType
                                        }}</template>
                                        <template #subtitle>{{
                                            item.dates
                                        }}</template>
                                        <template #content>
                                            <div
                                                class="flex items-center justify-between"
                                            >
                                                <div>
                                                    <p class="">
                                                        {{ item.guests }} guests
                                                    </p>
                                                    <p class="text-sm">
                                                        {{ item.status }}
                                                    </p>
                                                </div>
                                                <Button
                                                    label="Manage"
                                                    icon="pi pi-cog"
                                                    class="p-button-text"
                                                />
                                            </div>
                                        </template>
                                    </Card>
                                </template>
                            </Timeline>
                        </template>
                    </Card>
                </div>
            </div>
        </div>
    </div>
</template>
