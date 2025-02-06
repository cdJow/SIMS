<script setup>
import StatsWidget from "@/components/dashboard/StatsWidget.vue";
import Chart from "primevue/chart";
import { ref } from "vue";

// Booking Trends Data
const bookingTrends = ref({
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
        {
            label: "Bookings",
            data: [65, 59, 80, 81, 56, 55],
            fill: false,
            borderColor: "#3B82F6",
            tension: 0.4,
        },
    ],
});

// Revenue Breakdown per Week
const revenueBreakdown = ref({
    labels: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ],
    datasets: [
        {
            label: "Room Sales",
            data: [300, 450, 500, 600, 700, 800, 900],
            backgroundColor: [
                "#3B82F6",
                "#10B981",
                "#F59E0B",
                "#EF4444",
                "#8B5CF6",
                "#EC4899",
                "#FACC15",
            ],
        },
    ],
});

// Most Availed Room Size (Pie Chart)
const mostAvailedRoomSize = ref({
    labels: ["Single Size Bed", "Double Size Bed", "Queen Size Bed"],
    datasets: [
        {
            data: [450, 600, 350],
            backgroundColor: ["#3B82F6", "#10B981", "#F59E0B"],
        },
    ],
});

// Occupancy Rate Data
const occupancyRate = ref({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
        {
            label: "Occupancy Room",
            data: [85, 78, 92, 89, 96, 88, 95],
            fill: true,
            borderColor: "#3B82F6",
            backgroundColor: "rgba(59, 130, 246, 0.2)",
        },
    ],
});

// Top Selling Products (Pie Chart)
const topSellingProducts = ref({
    labels: ["Snacks", "Beverages", "Extra Amenities"],
    datasets: [
        {
            data: [500, 700, 800],
            backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
        },
    ],
});

const menuItemPopularity = ref({
    labels: ["Steak", "Pasta", "Burger", "Cocktail", "Wine"],
    datasets: [
        {
            data: [300, 250, 400, 300, 300],
            backgroundColor: [
                "#3B82F6",
                "#10B981",
                "#F59E0B",
                "#EF4444",
                "#8B5CF6",
            ],
        },
    ],
});

// Chart Options
const chartOptions = ref({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: true,
            position: "top",
            labels: {
                font: {
                    size: 12,
                },
                padding: 10,
            },
        },
        tooltip: {
            enabled: true,
            mode: "index",
            intersect: false,
        },
    },
    scales: {
        x: {
            grid: {
                display: false,
            },
            ticks: {
                font: {
                    size: 12,
                },
            },
        },
        y: {
            grid: {
                color: "#E5E7EB",
            },
            ticks: {
                font: {
                    size: 12,
                },
            },
        },
    },
});
</script>

<template>
    <div class="col-span-12">
        <StatsWidget />
    </div>
    <div class="grid grid-cols-12 gap-6 pt-2">
        <!-- Stats Widget -->

        <!-- Booking Trends -->
        <div class="col-span-12 md:col-span-6 lg:col-span-6">
            <div class="p-4 bg-white rounded-lg shadow-sm">
                <h3 class="text-lg font-semibold mb-4">Booking Trends</h3>
                <Chart
                    type="line"
                    :data="bookingTrends"
                    :options="chartOptions"
                    class="h-72"
                />
            </div>
        </div>

        <!-- Revenue Breakdown -->
        <div class="col-span-12 md:col-span-6 lg:col-span-6">
            <div class="p-4 bg-white rounded-lg shadow-sm">
                <h3 class="text-lg font-semibold mb-4">Revenue Breakdown</h3>
                <Chart
                    type="bar"
                    :data="revenueBreakdown"
                    :options="chartOptions"
                    class="h-72"
                />
            </div>
        </div>

        <!-- Occupancy Rate -->
        <div class="col-span-12 md:col-span-6 lg:col-span-6">
            <div class="p-4 bg-white rounded-lg shadow-sm">
                <h3 class="text-lg font-semibold mb-4">Occupancy Rate</h3>
                <Chart
                    type="line"
                    :data="occupancyRate"
                    :options="chartOptions"
                    class="h-72"
                />
            </div>
        </div>

        <!-- Top Selling Products -->
        <div class="col-span-12 md:col-span-6 lg:col-span-6">
            <div class="p-4 bg-white rounded-lg shadow-sm">
                <h3 class="text-lg font-semibold mb-4">Top Selling Products</h3>
                <Chart
                    type="bar"
                    :data="topSellingProducts"
                    :options="chartOptions"
                    class="h-72"
                />
            </div>
        </div>

        <!-- Menu Item Popularity -->
        <div class="col-span-12 md:col-span-6 lg:col-span-6">
            <div class="p-4 bg-white rounded-lg shadow-sm">
                <h3 class="text-lg font-semibold mb-4">Menu Item Popularity</h3>
                <Chart
                    type="bar"
                    :data="menuItemPopularity"
                    :options="chartOptions"
                    class="h-72"
                />
            </div>
        </div>

        <div class="col-span-12 md:col-span-6 lg:col-span-6">
            <div class="p-4 bg-white rounded-lg shadow-sm">
                <h3 class="text-lg font-semibold mb-4">
                    Most Availed Room Size
                </h3>
                <Chart
                    type="pie"
                    :data="mostAvailedRoomSize"
                    :options="chartOptions"
                    class="h-72"
                />
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Additional custom styles */
.bg-white {
    background-color: #fff;
}
.rounded-lg {
    border-radius: 0.5rem;
}
.shadow-sm {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
