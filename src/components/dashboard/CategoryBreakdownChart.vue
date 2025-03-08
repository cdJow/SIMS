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
        labels: ["Room Revenue", "Food & Beverage", "Amenities"],
        data: [185000, 55000, 22000],
        total: 262000,
    },
    month: {
        labels: ["Room Revenue", "Food & Beverage", "Amenities"],
        data: [854000, 235000, 98000],
        total: 1254000,
    },
    year: {
        labels: ["Room Revenue", "Food & Beverage", "Amenities"],
        data: [9854000, 2235000, 1498000],
        total: 13587000,
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
                    return `${context.label}: ₱${value.toLocaleString()} (${percentage}%)`;
                },
            },
        },
    },
});

const revenueCategoriesData = computed(() => ({
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
        date.toLocaleDateString("en-PH", {
            year: "numeric",
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
            return `${format(lastYear)} - ${format(now)}`;
        }
        default:
            return format(now);
    }
};
</script>

<template>
    <div>
        <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">Revenue Breakdown by Category</h3>
            <div class="flex items-center gap-2">
                <Select
                    v-model="selectedPeriod"
                    :options="periods"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                />
            </div>
        </div>

        <div class="mb-4 text-sm text-gray-600">
            {{ getDateRange(selectedPeriod) }}
        </div>

        <Chart
            type="doughnut"
            :data="revenueCategoriesData"
            :options="pieChartOptions"
            class="min-h-[400px]"
        />

        <div class="mt-4 grid grid-cols-3 gap-4 text-center">
            <div
                v-for="(label, index) in revenueCategoriesData.labels"
                :key="label"
            >
                <div class="text-sm font-medium">
                    {{ label }}
                </div>
                <div
                    class="text-lg font-semibold"
                    :style="{
                        color: revenueCategoriesData.datasets[0]
                            .backgroundColor[index],
                    }"
                >
                    ₱{{
                        revenueCategoriesData.datasets[0].data[
                            index
                        ].toLocaleString()
                    }}
                </div>
                <div class="text-sm text-gray-500">
                    ({{
                        (
                            (revenueCategoriesData.datasets[0].data[index] /
                                totalRevenue) *
                            100
                        ).toFixed(1)
                    }}%)
                </div>
            </div>
        </div>

        <div class="mt-4 text-center font-semibold">
            Total Revenue: ₱{{ totalRevenue.toLocaleString() }}
        </div>
    </div>
</template>
