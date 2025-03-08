<script setup>
import BookingChart from "@/components/dashboard/BookingChart.vue";
import CategoryBreakdownChart from "@/components/dashboard/CategoryBreakdownChart.vue";
import OccupancyChart from "@/components/dashboard/OccupancyChart.vue";
import RevenueBreakdownChart from "@/components/dashboard/RevenueBreakdownChart.vue";
import RoomRevenueChart from "@/components/dashboard/RoomRevenueChart.vue";
</script>

<template>
    <div class="col-span-12 mb-2">
        <StatsWidget />
    </div>
    <div class="col-span-12 md:col-span-6 lg:col-span-6 mb-5">
        <div class="p-4 card rounded-lg shadow-sm">
            <RevenueBreakdownChart />
        </div>
    </div>

    <!--Revenue Breakdown by Category-->
    <div class="grid grid-cols-12 gap-6 pt-2">
        <div class="col-span-12 md:col-span-6 lg:col-span-6 mb-5">
            <div class="p-4 card rounded-lg shadow-sm">
                <CategoryBreakdownChart />
            </div>
        </div>

        <div class="col-span-12 md:col-span-6 lg:col-span-6 mb-5">
            <div class="p-4 card rounded-lg shadow-sm">
                <RoomRevenueChart />
            </div>
        </div>

        <!-- Booking Trends -->
        <div class="col-span-12 md:col-span-6 lg:col-span-6">
            <div class="card p-4 rounded-lg shadow-sm">
                <BookingChart />
            </div>
        </div>

        <div class="col-span-12 md:col-span-6 lg:col-span-6">
            <div class="p-4 card rounded-lg shadow-sm">
                <OccupancyChart />
            </div>
        </div>

        <!-- Repeat similar structure for other charts -->
    </div>
</template>
