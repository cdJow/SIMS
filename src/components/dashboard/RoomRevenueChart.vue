<script setup>
import { computed, ref, watch, onMounted } from "vue";

const selectedPeriod = ref("month");
const periods = ref([
    { label: "Last Week", value: "week" },
    { label: "Last Month", value: "month" },
    { label: "This Year", value: "year" },
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
        const response = await fetch(`http://127.0.0.1:5000/api/room-revenue/${period}`);
        const data = await response.json();
        if (response.ok) {
            revenueData.value[period] = data;
            console.log(`✅ Room revenue data loaded for ${period}:`, data);
        } else {
            console.error('Error fetching revenue data:', data.error);
            // Set empty data on error
            revenueData.value[period] = { labels: [], data: [], total: 0 };
        }
    } catch (error) {
        console.error('Error fetching revenue data:', error);
        // Set empty data on error
        revenueData.value[period] = { labels: [], data: [], total: 0 };
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
            year: "numeric"
        });

    switch (period) {
        case "week": {
            // Last complete week (Monday to Sunday)
            const today = new Date(now);
            const daysSinceMonday = today.getDay() === 0 ? 6 : today.getDay() - 1; // Convert Sunday=0 to 6
            const currentWeekStart = new Date(today);
            currentWeekStart.setDate(today.getDate() - daysSinceMonday);
            
            const lastWeekStart = new Date(currentWeekStart);
            lastWeekStart.setDate(currentWeekStart.getDate() - 7);
            
            const lastWeekEnd = new Date(currentWeekStart);
            lastWeekEnd.setDate(currentWeekStart.getDate() - 1);
            
            return `Last Week (${format(lastWeekStart)} - ${format(lastWeekEnd)})`;
        }
        case "month": {
            // Last complete month
            const lastMonth = new Date(now);
            if (now.getMonth() === 0) {
                // If current month is January, last month is December of previous year
                lastMonth.setFullYear(now.getFullYear() - 1);
                lastMonth.setMonth(11); // December
            } else {
                lastMonth.setMonth(now.getMonth() - 1);
            }
            
            const monthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
            const monthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0); // Last day of month
            
            return `Last Month - ${lastMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })} (${format(monthStart)} - ${format(monthEnd)})`;
        }
        case "year": {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const endOfYear = new Date(now.getFullYear(), 11, 31);
            return `Year ${now.getFullYear()} (${format(startOfYear)} - ${format(endOfYear)})`;
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

        <!-- Category Breakdown Carousel -->
        <div class="relative">
            <Carousel 
                :value="roomSizeData.labels.map((label, index) => ({
                    label,
                    value: roomSizeData.datasets[0].data[index],
                    color: roomSizeData.datasets[0].backgroundColor[index],
                    percentage: ((roomSizeData.datasets[0].data[index] / totalRevenue) * 100).toFixed(1)
                }))"
                :numVisible="3"
                :numScroll="1"
                :showIndicators="false"
                :showNavigators="true"
                class="category-carousel"
            >
                <template #item="{ data }">
                    <div class="p-4 text-center bg-surface-50 dark:bg-surface-800 rounded-lg mx-2">
                        <div class="text-sm font-medium mb-2 text-surface-600 dark:text-surface-300">
                            {{ data.label }}
                        </div>
                        <div
                            class="text-xl font-bold mb-1"
                            :style="{ color: data.color }"
                        >
                            ₱{{ data.value.toLocaleString() }}
                        </div>
                        <div class="text-sm text-surface-500 dark:text-surface-400">
                            ({{ data.percentage }}%)
                        </div>
                    </div>
                </template>
            </Carousel>
        </div>

        <!-- Total Summary -->
        <div class="text-center font-semibold mt-4 p-3 bg-surface-100 dark:bg-surface-700 rounded-lg">
            Total Revenue: ₱{{ totalRevenue.toLocaleString() }}
        </div>
    </div>
</template>

<style scoped>
.category-carousel :deep(.p-carousel-content) {
    padding: 0.5rem 0;
}

.category-carousel :deep(.p-carousel-prev),
.category-carousel :deep(.p-carousel-next) {
    background: rgba(59, 130, 246, 0.1);
    color: #3B82F6;
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 50%;
    width: 2.5rem;
    height: 2.5rem;
    margin: 0 0.5rem;
    transition: all 0.3s ease;
}

.category-carousel :deep(.p-carousel-prev):hover,
.category-carousel :deep(.p-carousel-next):hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: #3B82F6;
    transform: scale(1.05);
}

.category-carousel :deep(.p-carousel-prev:disabled),
.category-carousel :deep(.p-carousel-next:disabled) {
    background: rgba(156, 163, 175, 0.1);
    color: #9CA3AF;
    border-color: rgba(156, 163, 175, 0.2);
    cursor: not-allowed;
    transform: none;
}

.category-carousel :deep(.p-carousel-item) {
    padding: 0.25rem;
}

/* Dark mode adjustments */
.dark .category-carousel :deep(.p-carousel-prev),
.dark .category-carousel :deep(.p-carousel-next) {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.3);
}

.dark .category-carousel :deep(.p-carousel-prev):hover,
.dark .category-carousel :deep(.p-carousel-next):hover {
    background: rgba(59, 130, 246, 0.3);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .category-carousel :deep(.p-carousel-prev),
    .category-carousel :deep(.p-carousel-next) {
        width: 2rem;
        height: 2rem;
        margin: 0 0.25rem;
    }
}
</style>
