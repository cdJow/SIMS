<script setup>
import { computed, ref } from "vue";

const periodOptions = ref([
    { name: "Weekly", value: "week" },
    { name: "Monthly", value: "month" },
    { name: "Yearly", value: "year" },
]);

const selectedRevenuePeriod = ref(periodOptions.value[0]);
const revenueOffset = ref(0);
const currentDate = ref(new Date());

const formattedRevenueDateRange = computed(() => {
    const period = selectedRevenuePeriod.value.value;
    const offset = revenueOffset.value;

    const date = new Date(currentDate.value);
    switch (period) {
        case "week": {
            date.setDate(date.getDate() + offset * 7);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
        }

        case "month":
            date.setMonth(date.getMonth() + offset);
            return date.toLocaleString("default", {
                month: "long",
                year: "numeric",
            });

        case "year":
            date.setFullYear(date.getFullYear() + offset);
            return date.getFullYear().toString();

        default:
            return "";
    }
});

const isPrevRevenueDisabled = computed(() => false);
const isNextRevenueDisabled = computed(() => {
    const period = selectedRevenuePeriod.value.value;
    const now = new Date();

    switch (period) {
        case "week":
            return revenueOffset.value >= 0;
        case "month":
            return (
                now.getMonth() ===
                currentDate.value.getMonth() + revenueOffset.value
            );
        case "year":
            return (
                now.getFullYear() ===
                currentDate.value.getFullYear() + revenueOffset.value
            );
        default:
            return false;
    }
});

function formatDate(date) {
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

function adjustRevenueOffset(change) {
    revenueOffset.value += change;
    loadRevenueData();
}

function handleRevenuePeriodChange() {
    revenueOffset.value = 0;
    loadRevenueData();
}

async function loadRevenueData() {
    // Implement data loading based on period and offset
    const params = {
        period: selectedRevenuePeriod.value.value,
        offset: revenueOffset.value,
    };
    console.log("Loading revenue data with:", params);
    // await fetchRevenueData(params);
}

const filteredRevenueData = computed(() => {
    // Replace with actual data fetching logic
    return {
        labels: getChartLabels(),
        datasets: [
            {
                label: "Revenue",
                data: generateSampleData(),
                backgroundColor: "#4F46E5",
            },
        ],
    };
});

function getChartLabels() {
    switch (selectedRevenuePeriod.value.value) {
        case "week":
            return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        case "month":
            return ["Week 1", "Week 2", "Week 3", "Week 4"];
        case "year":
            return [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
            ];
    }
}

function generateSampleData() {
    // Replace with actual data
    const length = getChartLabels().length;
    return Array.from({ length }, () => Math.floor(Math.random() * 10000));
}

const revenueChartOptions = ref({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                callback: function (value) {
                    return "₱" + value.toLocaleString();
                },
            },
        },
    },
});

// Update week offset for individual charts
</script>

<template>
    <!-- Revenue Breakdown -->
    <div class="col-span-12 md:col-span-6 lg:col-span-12 mb-5 mt-5">
        <!-- Step 1 -->
        <div class="p-4 card rounded-lg shadow-sm flex flex-col">
            <!-- Step 2 -->
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold">Revenue Breakdown</h3>
                <div class="flex gap-2 items-center">
                    <Select
                        v-model="selectedRevenuePeriod"
                        :options="periodOptions"
                        optionLabel="name"
                        class="w-full mr-2"
                        @change="handleRevenuePeriodChange"
                    />
                    <div class="flex gap-1 items-center">
                        <button
                            @click="adjustRevenueOffset(-1)"
                            class="p-1 hover:bg-gray-100 rounded"
                            :disabled="isPrevRevenueDisabled"
                        >
                            ←
                        </button>
                        <span class="text-sm min-w-[120px] text-center">
                            {{ formattedRevenueDateRange }}
                        </span>
                        <button
                            @click="adjustRevenueOffset(1)"
                            class="p-1 hover:bg-gray-100 rounded"
                            :disabled="isNextRevenueDisabled"
                        >
                            →
                        </button>
                    </div>
                </div>
            </div>

            <div class="min-h-[400px]">
                <Chart
                    type="bar"
                    :data="filteredRevenueData"
                    :options="revenueChartOptions"
                    class="min-h-[400px]"
                />
            </div>
        </div>
    </div>
</template>
