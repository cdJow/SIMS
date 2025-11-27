<script>
import { fetchRooms, getRevenueStats } from "@/api/auth";

export default {
    data() {
        return {
            stats: {
                operationalRooms: 0, // Available
                occupiedRooms: 0,
                underMaintinance: 0, // Cleaning / Maintenance
                totalRooms: 0, // Booked
                // Real-time revenue data from checkin_payments
                revenue: 0,
                revenueBreakdown: [
                    { name: "Room Revenue", amount: 0, percentage: 0 },
                    { name: "Consumables", amount: 0, percentage: 0 },
                    { name: "Amenities", amount: 0, percentage: 0 },
                    { name: "Additional Person", amount: 0, percentage: 0 },
                    { name: "Damage Charges", amount: 0, percentage: 0 },
                ],
            },
            _timer: null,
            _loading: false,
            _refreshRequested: false,
        };
    },
    methods: {
        _computeCounts(rooms) {
            const statusOf = (r) => String(r?.status || "").trim();
            const available = rooms.filter((r) => statusOf(r) === "Available").length;
            const occupied = rooms.filter((r) => statusOf(r) === "Occupied").length;
            const cleaning = rooms.filter((r) => ["Cleaning", "Maintenance", "Under Maintenance"].includes(statusOf(r))).length;
            const booked = rooms.filter((r) => statusOf(r) === "Booked").length;

            this.stats.operationalRooms = available;
            this.stats.occupiedRooms = occupied;
            this.stats.underMaintinance = cleaning;
            this.stats.totalRooms = booked;
        },
        async _loadRevenue() {
            try {
                const response = await getRevenueStats();
                const revenueData = response.data;
                
                // Update revenue data
                this.stats.revenue = revenueData.revenue;
                this.stats.revenueBreakdown = revenueData.revenueBreakdown;
                
                console.log("✅ Revenue data updated:", revenueData);
            } catch (e) {
                console.error("StatsWidget: failed to fetch revenue data", e);
            }
        },
        async _load() {
            if (this._loading) return;
            this._loading = true;
            try {
                // Load both room and revenue data
                const [roomsRes] = await Promise.all([
                    fetchRooms(),
                    this._loadRevenue()
                ]);
                
                const rooms = Array.isArray(roomsRes?.data) ? roomsRes.data : [];
                this._computeCounts(rooms);
            } catch (e) {
                console.error("StatsWidget: failed to fetch data", e);
            } finally {
                this._loading = false;
            }
        },
    },
    mounted() {
        this._load();
        // Live refresh every 10s
        this._timer = setInterval(() => this._load(), 10000);

        // Instant refresh hook: listen for global events when room changes happen
        window.addEventListener("rooms:changed", this._load);
        window.addEventListener("bookings:changed", this._load);
    },
    beforeUnmount() {
        if (this._timer) clearInterval(this._timer);
        window.removeEventListener("rooms:changed", this._load);
        window.removeEventListener("bookings:changed", this._load);
    },
};
</script>

<template>
    <div class="grid grid-cols-12 gap-4 mb-2">
        <!-- Total Available Rooms -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4"
                            >Available Rooms</span
                        >
                        <div
                            class="text-green-500 dark:text-surface-0 text-4xl font-semi-bold"
                        >
                            {{ stats.operationalRooms }}
                        </div>
                    </div>
                    <div
                        class="flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-border"
                        style="width: 2.5rem; height: 2.5rem"
                    >
                        <i class="pi pi-table text-green-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4"
                            >Occupied Rooms</span
                        >
                        <div
                            class="text-red-500 dark:text-surface-0 text-4xl font-semi-bold"
                        >
                            {{ stats.occupiedRooms }}
                        </div>
                    </div>
                    <div
                        class="flex items-center justify-center bg-red-100 dark:bg-blue-400/10 rounded-border"
                        style="width: 2.5rem; height: 2.5rem"
                    >
                        <i class="pi pi-table text-red-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4"
                            >Under Cleaning</span
                        >
                        <div
                            class="text-orange-500 dark:text-surface-0 text-4xl font-semi-bold"
                        >
                            {{ stats.underMaintinance }}
                        </div>
                    </div>
                    <div
                        class="flex items-center justify-center bg-red-100 dark:bg-red-400/10 rounded-border"
                        style="width: 2.5rem; height: 2.5rem"
                    >
                        <i class="pi pi-table text-orange-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Number of Bookings -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block font-medium mb-4">Booked Rooms</span>
                        <div
                            class="text-blue-900 dark:text-surface-0 text-4xl font-semi-bold"
                        >
                            {{ stats.totalRooms }}
                        </div>
                    </div>
                    <div
                        class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border"
                        style="width: 2.5rem; height: 2.5rem"
                    >
                        <i class="pi pi-calendar text-blue-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Revenue -->
       

    </div>

     <div class="col-span-12 lg:col-span-6 xl:col-span-6">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block font-medium mb-1"
                            >Total Revenue</span
                        >
                        <div
                            class="text-blue-500 dark:text-surface-0 font-semi-bold text-xl"
                        >
                            ₱{{ stats.revenue.toLocaleString() }}
                        </div>
                    </div>
                    <div
                        class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border"
                        style="width: 2.5rem; height: 2.5rem"
                    >
                        <i class="pi" style="color: #f59e0b; font-size: 1.25rem"
                            >₱</i
                        >
                    </div>
                </div>

                <!-- Detailed Breakdown -->
                <div class="space-y-3 border-t pt-4">
                    <div
                        v-for="(category, index) in stats.revenueBreakdown"
                        :key="index"
                    >
                        <div class="flex justify-between text-sm mb-1">
                            <span class="">{{ category.name }}</span>
                            <span class="font-medium">
                                ₱{{ category.amount.toLocaleString() }}
                                <span class=""
                                    >({{ category.percentage }}%)</span
                                >
                            </span>
                        </div>
                        <div class="w-full bg-gray-100 rounded-full h-2">
                            <div
                                class="h-2 rounded-full transition-all duration-500"
                                :class="{
                                    'bg-blue-500': index === 0,
                                    'bg-green-500': index === 1,
                                    'bg-purple-500': index === 2,
                                    'bg-red-500': index === 3,
                                }"
                                :style="{ width: category.percentage + '%' }"
                            ></div>
                        </div>
                    </div>
                </div>


            </div>
        </div>
</template>
