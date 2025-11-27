<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
import { getCategoryBreakdown } from "@/api/auth";
import Chart from 'primevue/chart';

const defaultChartData = {
    current: {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'],
            borderWidth: 0
        }],
        percentages: []
    },
    trend: {
        labels: [],
        datasets: []
    },
    total: 0
};

const chartData = ref({ ...defaultChartData });

async function loadCategoryData() {
    try {
        const response = await getCategoryBreakdown('year');  // Always use yearly view
        if (response?.data) {
            chartData.value = {
                current: {
                    labels: response.data.current?.labels || [],
                    datasets: [{
                        data: response.data.current?.datasets?.[0]?.data || [],
                        backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'],
                        borderWidth: 0
                    }],
                    percentages: response.data.current?.percentages || []
                },
                trend: {
                    labels: response.data.trend?.labels || [],
                    datasets: response.data.trend?.datasets || []
                },
                total: response.data.total || 0
            };
        } else {
            chartData.value = { ...defaultChartData };
        }
        console.log("✅ Category breakdown data loaded:", chartData.value);
    } catch (error) {
        console.error("❌ Failed to load category breakdown:", error);
        chartData.value = { ...defaultChartData };
    }
}

// Remove period watch as we only show yearly data

let refreshTimer = null;

onMounted(() => {
    loadCategoryData();
    refreshTimer = setInterval(loadCategoryData, 60000);
});

onUnmounted(() => {
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }
});

const totalRevenue = computed(() => chartData.value.total || 0);
const formattedTotal = computed(() => 
    totalRevenue.value.toLocaleString('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2
    })
);

const pieChartData = computed(() => ({
    labels: chartData.value.current.labels || [],
    datasets: chartData.value.current.datasets || [{
        data: [],
        backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'],
        borderWidth: 0
    }]
}));

const trendChartData = computed(() => ({
    labels: chartData.value.trend.labels || [],
    datasets: chartData.value.trend.datasets || []
}));

const chartConfig = {
    pie: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    usePointStyle: true,
                    padding: 20
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const value = context.raw || 0;
                        const percentage = chartData.value.current.percentages[context.dataIndex] || 0;
                        return `${context.label}: ₱${value.toLocaleString()} (${percentage}%)`;
                    }
                }
            }
        }
    },
    trend: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => '₱' + value.toLocaleString()
                }
            }
        },
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20
                }
            }
        }
    }
};
</script>

<template>
    <div>
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">Revenue Breakdown by Category</h3>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="card p-4 flex flex-col">
                <h4 class="text-base font-medium mb-4">Current Period</h4>
                <Chart
                    type="doughnut"
                    :data="pieChartData"
                    :options="chartConfig.pie"
                    class="min-h-[415px]"
                />
               
            </div>

            <div class="card p-4 flex flex-col">
                <h4 class="text-base font-medium mb-4">Revenue Trend</h4>
                <Chart
                    type="line"
                    :data="trendChartData"
                    :options="chartConfig.trend"
                    class="min-h-[415px]"
                />
            </div>
        </div>

        <div v-if="chartData.value?.current?.labels?.length > 0" class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div v-for="(label, index) in chartData.value.current.labels" 
                 :key="label" 
                 class="card p-4 text-center">
                <div class="text-sm font-medium mb-2">{{ label }}</div>
                <div class="text-lg font-semibold" 
                     :style="{ color: chartData.value.current.datasets[0]?.backgroundColor?.[index] || '#000000' }">
                    ₱{{ (chartData.value.current.datasets[0]?.data?.[index] || 0).toLocaleString() }}
                </div>
                <div class="text-sm text-gray-500">
                    ({{ chartData.value.current.percentages?.[index] || 0 }}%)
                </div>
            </div>
        </div>
       
        <!-- Centered Total Revenue at the bottom -->
        <div class="mt-8 text-center">
            <div class="text-md font-bold mt-2">Total Revenue: {{ formattedTotal }}</div>
        </div>
    </div>
</template>