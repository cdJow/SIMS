<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { getOccupancyChart } from '@/api/auth';

// Week offset for chart navigation
const weekOffset = ref(0);

// Chart data
const chartData = ref({
    labels: [],
    datasets: []
});

// Date range for display
const dateRange = ref('');

// Occupancy stats
const totalBookingsWithCheckin = ref(0);
const totalOccupied = ref(0);

const chartOptions = ref({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: true,
            position: 'top',
        },
        tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            callbacks: {
                label: function(context) {
                    return context.dataset.label + ': ' + context.raw + ' rooms';
                }
            }
        }
    },
    scales: {
        x: {
            display: true,
            title: {
                display: true,
                text: 'Day'
            }
        },
        y: {
            display: true,
            beginAtZero: true,
            ticks: {
                stepSize: 1,
                precision: 0
            },
            title: {
                display: true,
                text: 'Number of Occupied Rooms'
            }
        }
    },
    interaction: {
        intersect: false,
        mode: 'index'
    }
});

// Function to load occupancy data
async function loadOccupancyData() {
    try {
        const response = await getOccupancyChart(weekOffset.value);
        if (response?.data) {
            chartData.value = {
                labels: response.data.labels,
                datasets: response.data.datasets
            };
            
            // Format date range
            const start = new Date(response.data.dateRange.start);
            const end = new Date(response.data.dateRange.end);
            dateRange.value = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
            
            // Set total bookings with check-in and calculate total occupied
            totalBookingsWithCheckin.value = response.data.totalBookingsWithCheckin;
            const counts = response.data.occupancyData.counts;
            totalOccupied.value = counts.reduce((a, b) => a + b, 0);
        }
    } catch (error) {
    }
}

// Update week offset and reload data
const updateWeekOffset = (delta) => {
    weekOffset.value = Math.max(0, weekOffset.value + delta);
    loadOccupancyData();
};

// Auto-refresh timer
let refreshTimer = null;

onMounted(() => {
    loadOccupancyData();
    refreshTimer = setInterval(loadOccupancyData, 60000); // Refresh every minute
});

onUnmounted(() => {
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }
});
</script>

<template>
    <div class="col-span-12 md:col-span-6 lg:col-span-6">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">Daily Occupied Rooms</h3>
            <div class="flex gap-2 items-center">
                <span class="text-sm">{{ dateRange }}</span>
                <button
                    @click="updateWeekOffset(1)"
                    class="p-1 hover:bg-gray-100 rounded"
                    title="Previous Week"
                >
                    ←
                </button>
                <button
                    @click="updateWeekOffset(-1)"
                    :disabled="weekOffset === 0"
                    class="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Next Week"
                >
                    →
                </button>
            </div>
        </div>
        <Chart type="line" :data="chartData" :options="chartOptions" class="h-80" />
        <div class="mt-4 text-center text-sm text-gray-600">
            Total of occupied rooms this week: {{ totalOccupied }} (Total of Occupied: {{ totalBookingsWithCheckin }})
        </div>
    </div>
</template>
