<script setup>
import { computed, ref } from "vue";

const selectedPeriod = ref("month");
const periods = ref([
    { label: "Last Week", value: "week" },
    { label: "Last Month", value: "month" },
    { label: "Last Year", value: "year" },
]);

// Sample data for different time periods
const revenueData = ref({
    week: {
        labels: ["Single Size Bed", "Double Size Bed", "Queen Size Bed"],
        data: [45, 80, 65],
        total: 190,
    },
    month: {
        labels: ["Single Size Bed", "Double Size Bed", "Queen Size Bed"],
        data: [120, 250, 180],
        total: 550,
    },
    year: {
        labels: ["Single Size Bed", "Double Size Bed", "Queen Size Bed"],
        data: [1500, 3200, 2400],
        total: 7100,
    },
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
                    return `${context.label}: ${value} (${percentage}%)`;
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
            backgroundColor: ["#3B82F6", "#10B981", "#F59E0B"],
            hoverBackgroundColor: ["#2563EB", "#059669", "#D97706"],
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
                    {{ roomSizeData.datasets[0].data[index].toLocaleString() }}
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
            Total : {{ totalRevenue.toLocaleString() }}
        </div>
    </div>
</template>
