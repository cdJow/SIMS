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
        chartWeekOffsets.value.occupancy
    ),
}));

// Update week offset for individual charts
const updateWeekOffset = (chartType, delta) => {
    chartWeekOffsets.value[chartType] = Math.max(
        0,
        chartWeekOffsets.value[chartType] + delta
    );
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
</script>

<template>
    <div class="col-span-12 md:col-span-6 lg:col-span-6">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">Occupancy Rate</h3>
            <div class="flex gap-2 items-center">
                <span class="text-sm">
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
        <div class="rounded-lg">
            <Chart type="line" :data="occupancyRate" :options="chartOptions" />
        </div>
    </div>
</template>
