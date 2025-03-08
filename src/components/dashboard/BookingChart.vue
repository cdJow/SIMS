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
            })
        );
    }
    return labels;
};

const chartOptions = ref({
    responsive: true,
    maintainAspectRatio: false, // allows the chart to fill its container
    plugins: {
        legend: {
            display: true,
            position: "top",
        },
        tooltip: {
            enabled: true,
        },
    },
    scales: {
        x: {
            display: true,
            title: {
                display: true,
                text: "Day",
            },
        },
        y: {
            display: true,
            beginAtZero: true,
            title: {
                display: true,
                text: "Bookings",
            },
        },
    },
});

// Add specific options for pie chart

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
            Math.round(v * (1 - offset * 0.1 + Math.random() * 0.1))
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
                borderColor: "#3182CE",
                tension: 0.4,
                fill: false,
            },
        ],
        chartWeekOffsets.value.booking
    ),
}));

// Update week offset for individual charts
const updateWeekOffset = (chartType, delta) => {
    chartWeekOffsets.value[chartType] = Math.max(
        0,
        chartWeekOffsets.value[chartType] + delta
    );
};
</script>

<template>
    <div class="col-span-12 md:col-span-6 lg:col-span-6">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">Booking Trends</h3>
            <div class="flex gap-2 items-center">
                <span class="text-sm">
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
        <Chart type="line" :data="bookingTrends" :options="chartOptions" />
    </div>
</template>
