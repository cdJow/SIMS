<script setup>
import { computed, ref } from "vue";

// Individual week offsets for each chart
const chartWeekOffsets = ref({
    booking: 0,
    revenue: 0,
    occupancy: 0,
    products: 0,
    menu: 0,
    roomSize: 0,
});

// Date formatting utilities
const generateWeeklyLabels = (offset) => {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay() - offset * 7);
    const labels = [];

    for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        labels.push(
            date.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
            }),
        );
    }
    return labels;
};

const roomSizeData = ref({
    labels: ["Single Size Bed", "Double Size Bed", "Queen Size Bed"],
    datasets: [
        {
            data: [120, 250, 180],
            backgroundColor: ["#3B82F6", "#10B981", "#F59E0B"],
            hoverBackgroundColor: ["#2563EB", "#059669", "#D97706"],
        },
    ],
});

// Add specific options for pie chart
const pieChartOptions = ref({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: "bottom",
            labels: {
                usePointStyle: true,
                padding: 20,
            },
        },
        tooltip: {
            callbacks: {
                label: (context) => {
                    const total = context.dataset.data.reduce((a, b) => a + b);
                    const value = context.raw || 0;
                    const percentage = ((value / total) * 100).toFixed(1);
                    return `${context.label}: ${value} (${percentage}%)`;
                },
            },
        },
    },
});

const formattedDateRange = (offset) => {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay() - offset * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
};

// Dynamic data generator with individual offsets
const generateChartData = (baseData, offset) => {
    return baseData.map((values) => ({
        ...values,
        data: values.data.map((v) =>
            Math.round(v * (1 - offset * 0.1 + Math.random() * 0.1)),
        ),
    }));
};

// Chart data with individual computed properties
const bookingTrends = computed(() => ({
    labels: generateWeeklyLabels(chartWeekOffsets.value.booking),
    datasets: generateChartData(
        [
            {
                label: "Bookings",
                data: [65, 59, 80, 81, 56, 55, 70],
                borderColor: "#3B82F6",
                tension: 0.4,
                fill: false,
            },
        ],
        chartWeekOffsets.value.booking,
    ),
}));

const revenueBreakdown = computed(() => ({
    labels: generateWeeklyLabels(chartWeekOffsets.value.revenue),
    datasets: generateChartData(
        [
            {
                label: "Revenue",
                data: [300, 450, 500, 600, 700, 800, 900],
                backgroundColor: "#3B82F6",
            },
        ],
        chartWeekOffsets.value.revenue,
    ),
}));

const occupancyRate = computed(() => ({
    labels: generateWeeklyLabels(chartWeekOffsets.value.occupancy),
    datasets: generateChartData(
        [
            {
                label: "Occupancy",
                data: [85, 78, 92, 89, 96, 88, 95],
                borderColor: "#3B82F6",
                fill: true,
                backgroundColor: "rgba(59, 130, 246, 0.2)",
            },
        ],
        chartWeekOffsets.value.occupancy,
    ),
}));

// Update week offset for individual charts
const updateWeekOffset = (chartType, delta) => {
    chartWeekOffsets.value[chartType] = Math.max(
        0,
        chartWeekOffsets.value[chartType] + delta,
    );
};
</script>

<template>
    <div class="col-span-12 mb-2">
        <StatsWidget />
    </div>
    <div class="grid grid-cols-12 gap-6 pt-2">
        <!-- Booking Trends -->
        <div class="col-span-12 md:col-span-6 lg:col-span-6">
            <div class="p-4 bg-white rounded-lg shadow-sm">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Booking Trends</h3>
                    <div class="flex gap-2 items-center">
                        <span class="text-sm text-gray-500">
                            {{ formattedDateRange(chartWeekOffsets.booking) }}
                        </span>
                        <button
                            @click="updateWeekOffset('booking', 1)"
                            class="p-1 hover:bg-gray-100 rounded"
                        >
                            ←
                        </button>
                        <button
                            @click="updateWeekOffset('booking', -1)"
                            :disabled="chartWeekOffsets.booking === 0"
                            class="p-1 hover:bg-gray-100 rounded"
                        >
                            →
                        </button>
                    </div>
                </div>
                <Chart
                    type="line"
                    :data="bookingTrends"
                    :options="chartOptions"
                />
            </div>
        </div>

        <!-- Revenue Breakdown -->
        <div class="col-span-12 md:col-span-6 lg:col-span-6">
            <div class="p-4 bg-white rounded-lg shadow-sm">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Revenue Breakdown</h3>
                    <div class="flex gap-2 items-center">
                        <span class="text-sm text-gray-500">
                            {{ formattedDateRange(chartWeekOffsets.revenue) }}
                        </span>
                        <button
                            @click="updateWeekOffset('revenue', 1)"
                            class="p-1 hover:bg-gray-100 rounded"
                        >
                            ←
                        </button>
                        <button
                            @click="updateWeekOffset('revenue', -1)"
                            :disabled="chartWeekOffsets.revenue === 0"
                            class="p-1 hover:bg-gray-100 rounded"
                        >
                            →
                        </button>
                    </div>
                </div>
                <Chart
                    type="bar"
                    :data="revenueBreakdown"
                    :options="chartOptions"
                />
            </div>
        </div>

        <!-- Revenue Breakdown -->
        <div class="col-span-12 md:col-span-6 lg:col-span-6">
            <div class="p-4 bg-white rounded-lg shadow-sm">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold mb-4">Occupancy Rate</h3>
                    <div class="flex gap-2 items-center">
                        <span class="text-sm text-gray-500">
                            {{ formattedDateRange(chartWeekOffsets.occupancy) }}
                        </span>
                        <button
                            @click="updateWeekOffset('occupancy', 1)"
                            class="p-1 hover:bg-gray-100 rounded"
                        >
                            ←
                        </button>
                        <button
                            @click="updateWeekOffset('occupancy', -1)"
                            :disabled="chartWeekOffsets.occupancy === 0"
                            class="p-1 hover:bg-gray-100 rounded"
                        >
                            →
                        </button>
                    </div>
                </div>
                <div class="p-4 bg-white rounded-lg shadow-sm">
                    <Chart
                        type="line"
                        :data="occupancyRate"
                        :options="chartOptions"
                    />
                </div>
            </div>
        </div>

        <div class="col-span-12 md:col-span-6 lg:col-span-6">
            <div class="p-4 bg-white rounded-lg shadow-sm">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">
                        Most Availed Room Size
                    </h3>
                    <div class="text-sm text-gray-500">Last 30 Days</div>
                </div>

                <Chart
                    type="doughnut"
                    :data="roomSizeData"
                    :options="pieChartOptions"
                />

                <div class="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div
                        v-for="(label, index) in roomSizeData.labels"
                        :key="label"
                    >
                        <div class="text-sm font-medium text-gray-600">
                            {{ label }}
                        </div>
                        <div
                            class="text-lg font-semibold"
                            :style="{
                                color: roomSizeData.datasets[0].backgroundColor[
                                    index
                                ],
                            }"
                        >
                            {{ roomSizeData.datasets[0].data[index] }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Repeat similar structure for other charts -->
    </div>
</template>
