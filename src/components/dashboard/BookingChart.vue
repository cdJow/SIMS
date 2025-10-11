<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { getBookingChart } from '@/api/auth';

// Week offset for chart navigation
const weekOffset = ref(0);

// Chart data
const chartData = ref({
    labels: [],
    datasets: []
});

// Date range for display
const dateRange = ref('');

// Booking totals
const totalBookings = ref(0);
const walkInBookings = ref(0);
const onlineBookings = ref(0);
const totalCheckinCount = ref(0);

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
                    return context.dataset.label + ': ' + context.raw;
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
                text: 'Number of Bookings'
            }
        }
    },
    interaction: {
        intersect: false,
        mode: 'index'
    }
});

// Function to load booking data
async function loadBookingData() {
    try {
        const response = await getBookingChart(weekOffset.value);
        if (response?.data) {
            chartData.value = {
                labels: response.data.labels,
                datasets: [
                    response.data.datasets[1], // Walk-in Bookings
                    response.data.datasets[2]  // Online Bookings
                ]
            };
            
            // Format date range
            const start = new Date(response.data.dateRange.start);
            const end = new Date(response.data.dateRange.end);
            dateRange.value = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
            
            // Calculate totals from the datasets
            walkInBookings.value = response.data.datasets[1].data.reduce((a, b) => a + b, 0);
            onlineBookings.value = response.data.datasets[2].data.reduce((a, b) => a + b, 0);
            totalBookings.value = walkInBookings.value + onlineBookings.value;
            // Use the total from backend instead of calculated sum
            totalBookings.value = response.data.totalBookingsCount || 0;
        }
    } catch (error) {
    }
}

// Update week offset and reload data
const updateWeekOffset = (delta) => {
    weekOffset.value = Math.max(0, weekOffset.value + delta);
    loadBookingData();
};

// Auto-refresh timer
let refreshTimer = null;

onMounted(() => {
    loadBookingData();
    refreshTimer = setInterval(loadBookingData, 60000); // Refresh every minute
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
            <h3 class="text-lg font-semibold">Booking Trends</h3>
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
            Week Total: {{ walkInBookings + onlineBookings }} (Walk-in: {{ walkInBookings }}, Bookings: {{ onlineBookings }}) 
        </div>
    </div>
</template>
