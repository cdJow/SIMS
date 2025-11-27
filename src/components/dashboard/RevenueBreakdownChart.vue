<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
import { getRevenueBreakdown } from "@/api/auth";

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
        case "month": {
            // Calculate target month/year with offset
            const targetDate = new Date(currentDate.value);
            targetDate.setMonth(targetDate.getMonth() + revenueOffset.value);
            return (
                now.getFullYear() === targetDate.getFullYear() &&
                now.getMonth() === targetDate.getMonth()
            );
        }
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

const chartData = ref({
    labels: [],
    datasets: []
});

const totalRevenue = ref(0);

async function loadRevenueData() {
    try {
        const params = {
            period: selectedRevenuePeriod.value.value,
            offset: revenueOffset.value,
        };
        
        // Add debug info for date calculation
        const debugDate = new Date(currentDate.value);
        debugDate.setMonth(debugDate.getMonth() + revenueOffset.value);
        console.log("📊 Loading revenue data with:", params);
        console.log("📅 Target date:", debugDate.toLocaleDateString(), `(${debugDate.toLocaleString("default", { month: "long", year: "numeric" })})`);
        
        const response = await getRevenueBreakdown(params.period, params.offset);
        chartData.value = response.data;
        
        // Calculate total revenue from all datasets
        if (response.data && response.data.datasets) {
            let total = 0;
            response.data.datasets.forEach(dataset => {
                if (dataset.data && Array.isArray(dataset.data)) {
                    total += dataset.data.reduce((sum, value) => sum + (value || 0), 0);
                }
            });
            totalRevenue.value = total;
        }
        
        console.log("✅ Revenue data loaded:", response.data);
        console.log("💰 Total Revenue:", totalRevenue.value.toLocaleString());
    } catch (error) {
        console.error("❌ Failed to load revenue data:", error);
        totalRevenue.value = 0;
    }
}

const filteredRevenueData = computed(() => chartData.value);

// Set up auto-refresh every minute
let refreshTimer = null;

onMounted(() => {
    loadRevenueData();
    refreshTimer = setInterval(loadRevenueData, 60000); // Refresh every minute
});

// Clean up timer on component unmount
onUnmounted(() => {
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }
});

const revenueChartOptions = ref({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        tooltip: {
            callbacks: {
                afterBody: function(tooltipItems) {
                    // Calculate total for this data point across all datasets
                    let total = 0;
                    tooltipItems.forEach(item => {
                        total += item.parsed.y;
                    });
                    return `Total: ₱${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                }
            }
        }
    },
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
                <div>
                    <h3 class="text-lg font-semibold">Revenue Breakdown</h3>
                    <p class="text-sm text-gray-600 mt-1">
                        Total Revenue: <span class="font-semibold text-green-600">₱{{ totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
                    </p>
                </div>
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

            <!-- Revenue Summary -->
            <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4" v-if="chartData.datasets && chartData.datasets.length > 0">
                <div 
                    v-for="(dataset, index) in chartData.datasets" 
                    :key="index" 
                    class="text-center p-3 border rounded-lg"
                >
                    <div class="flex items-center justify-center mb-2">
                        <div 
                            class="w-4 h-4 rounded mr-2" 
                            :style="{ backgroundColor: dataset.backgroundColor }"
                        ></div>
                        <span class="text-sm font-medium">{{ dataset.label }}</span>
                    </div>
                    <div class="text-lg font-semibold text-gray-800">
                        ₱{{ (dataset.data?.reduce((sum, value) => sum + (value || 0), 0) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                    </div>
                    <div class="text-xs text-gray-500">
                        {{ totalRevenue > 0 ? ((dataset.data?.reduce((sum, value) => sum + (value || 0), 0) || 0) / totalRevenue * 100).toFixed(1) : 0 }}%
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
