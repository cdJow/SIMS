<script setup>
import { computed, ref, watch, onMounted } from "vue";

const selectedPeriod = ref("month");
const periods = ref([
    { label: "Last Week", value: "week" },
    { label: "Last Month", value: "month" },
    { label: "Last Year", value: "year" },
]);

// Initialize revenue data structure
const revenueData = ref({
    week: { labels: [], data: [], total: 0 },
    month: { labels: [], data: [], total: 0 },
    year: { labels: [], data: [], total: 0 },
});

// Fetch revenue data from backend
const fetchRevenueData = async (period) => {
    try {
        const response = await fetch(`http://localhost:5000/api/room-revenue/${period}`);
        const data = await response.json();
        if (response.ok) {
            revenueData.value[period] = data;
        } else {
            console.error('Error fetching revenue data:', data.error);
        }
    } catch (error) {
        console.error('Error fetching revenue data:', error);
    }
};

// Watch for period changes and fetch new data
watch(selectedPeriod, (newPeriod) => {
    fetchRevenueData(newPeriod);
});

// Initial data fetch
onMounted(() => {
    fetchRevenueData(selectedPeriod.value);
});

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
                    return `${context.label}: ₱${value.toLocaleString()} (${percentage}%)`;
                },
            },
        },
    },
});

const roomSizeData = computed(() => ({
    labels: revenueData.value[selectedPeriod.value].labels,
    datasets: [
        {
            data: revenueData.value[selectedPeriod.value].data,
            backgroundColor: [
                "#3B82F6", // Blue
                "#10B981", // Green
                "#F59E0B", // Orange
                "#EC4899", // Pink
                "#8B5CF6", // Purple
                "#14B8A6", // Teal
                "#EF4444", // Red
                "#6366F1", // Indigo
                "#F97316", // Dark Orange
                "#84CC16", // Lime
            ],
            hoverBackgroundColor: [
                "#2563EB", // Darker Blue
                "#059669", // Darker Green
                "#D97706", // Darker Orange
                "#DB2777", // Darker Pink
                "#7C3AED", // Darker Purple
                "#0D9488", // Darker Teal
                "#DC2626", // Darker Red
                "#4F46E5", // Darker Indigo
                "#EA580C", // Darker Dark Orange
                "#65A30D", // Darker Lime
            ],
        },
    ],
}));

const totalRevenue = computed(
    () => revenueData.value[selectedPeriod.value].total,
);

const getDateRange = (period) => {
    const now = new Date();
    const format = (date) =>
        date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });

    switch (period) {
        case "week": {
            const lastWeek = new Date(now);
            lastWeek.setDate(now.getDate() - 7);
            return `${format(lastWeek)} - ${format(now)}`;
        }
        case "month": {
            const lastMonth = new Date(now);
            lastMonth.setMonth(now.getMonth() - 1);
            return `${format(lastMonth)} - ${format(now)}`;
        }
        case "year": {
            const lastYear = new Date(now);
            lastYear.setFullYear(now.getFullYear() - 1);
            return `${lastYear.toLocaleDateString("en-US", { year: "numeric" })} - ${now.toLocaleDateString("en-US", { year: "numeric" })}`;
        }
        default:
            return "Last 30 Days";
    }
};
</script>

<template>
    <div>
        <!-- Header Section -->
        <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">Room Revenue Breakdown</h3>
            <div class="flex items-center gap-2">
                <Select
                    v-model="selectedPeriod"
                    :options="periods"
                    optionLabel="label"
                    optionValue="value"
                    class="w-32"
                />
            </div>
        </div>

        <!-- Date Range -->
        <div class="text-sm text-gray-600">
            {{ getDateRange(selectedPeriod) }}
        </div>

        <!-- Chart -->
        <Chart
            type="doughnut"
            :data="roomSizeData"
            :options="pieChartOptions"
            class="min-h-[415px] mb-4"
        />

        <!-- Category Breakdown -->
        <div class="grid grid-cols-3 gap-4 text-center">
            <div
                v-for="(label, index) in roomSizeData.labels"
                :key="label"
                class="p-2"
            >
                <div class="text-sm font-medium mb-1">
                    {{ label }}
                </div>
                <div
                    class="text-lg font-semibold"
                    :style="{
                        color: roomSizeData.datasets[0].backgroundColor[index],
                    }"
                >
                    ₱{{ roomSizeData.datasets[0].data[index].toLocaleString() }}
                </div>
                <div class="text-sm text-gray-500">
                    ({{
                        (
                            (roomSizeData.datasets[0].data[index] /
                                totalRevenue) *
                            100
                        ).toFixed(1)
                    }}%)
                </div>
            </div>
        </div>

        <!-- Total Summary -->
        <div class="text-center font-semibold">
            Total: ₱{{ totalRevenue.toLocaleString() }}
        </div>
    </div>
</template>
