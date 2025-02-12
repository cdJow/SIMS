<script>
import { ref } from "vue";

export default {
    data() {
        return {
            stats: {
                operationalRooms: 80,

                underMaintinance: 4,

                totalRooms: 84,
                occupiedRooms: 60,
                revenue: 1254000,
                revenueIncrease: 12.4,
                revenueBreakdown: [
                    {
                        name: "Room Revenue",
                        amount: 854000,
                        percentage: 68,
                    },
                    {
                        name: "Food & Beverage",
                        amount: 235000,
                        percentage: 19,
                    },
                    {
                        name: "Amenities",
                        amount: 98000,
                        percentage: 8,
                    },
                ],
            },
        };
    },
};

// Add these to your existing script
const showRevenueReport = ref(false);

const reportTimeRange = ref("week");
const revenueHistory = ref({
    week: [120000, 145000, 132000, 158000],
    month: [450000, 480000, 510000, 490000],
    quarter: [1250000, 1300000, 1420000],
});

const reportChartData = ref({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
        {
            label: "Daily Revenue",
            data: [45000, 52000, 48000, 61000, 58000, 73000, 68000],
            borderColor: "#3B82F6",
            backgroundColor: "rgba(59, 130, 246, 0.2)",
            tension: 0.4,
        },
    ],
});

const updateReportTimeRange = (range) => {
    reportTimeRange.value = range;
    // Update chart data based on selected range
    reportChartData.value.datasets[0].data = revenueHistory.value[range];
};

// Add more sample data
revenueHistory.value = {
    week: [120000, 145000, 132000, 158000, 143000, 167000, 182000],
    month: [450000, 480000, 510000, 490000, 530000, 570000, 610000],
    quarter: [1250000, 1300000, 1420000, 1550000, 1480000, 1630000],
};
</script>

<template>
    <div class="grid grid-cols-12 gap-4">
        <!-- Total Available Rooms -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4"
                            >Available Rooms</span
                        >
                        <div
                            class="text-green-500 dark:text-surface-0 text-4xl font-semi-bold"
                        >
                            {{ stats.operationalRooms }}
                        </div>
                    </div>
                    <div
                        class="flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-border"
                        style="width: 2.5rem; height: 2.5rem"
                    >
                        <i class="pi pi-table text-green-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4"
                            >Occupied Rooms</span
                        >
                        <div
                            class="text-red-500 dark:text-surface-0 text-4xl font-semi-bold"
                        >
                            {{ stats.occupiedRooms }}
                        </div>
                    </div>
                    <div
                        class="flex items-center justify-center bg-red-100 dark:bg-blue-400/10 rounded-border"
                        style="width: 2.5rem; height: 2.5rem"
                    >
                        <i class="pi pi-table text-red-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4"
                            >Under Cleaning</span
                        >
                        <div
                            class="text-orange-500 dark:text-surface-0 text-4xl font-semi-bold"
                        >
                            {{ stats.underMaintinance }}
                        </div>
                    </div>
                    <div
                        class="flex items-center justify-center bg-red-100 dark:bg-red-400/10 rounded-border"
                        style="width: 2.5rem; height: 2.5rem"
                    >
                        <i class="pi pi-table text-orange-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Number of Bookings -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4"
                            >Booked Rooms</span
                        >
                        <div
                            class="text-blue-900 dark:text-surface-0 text-4xl font-semi-bold"
                        >
                            {{ stats.totalRooms }}
                        </div>
                    </div>
                    <div
                        class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border"
                        style="width: 2.5rem; height: 2.5rem"
                    >
                        <i class="pi pi-calendar text-blue-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Revenue -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-6">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-1"
                            >Total Revenue</span
                        >
                        <div
                            class="text-blue-500 dark:text-surface-0 font-semi-bold text-xl"
                        >
                            ₱{{ stats.revenue.toLocaleString() }}
                        </div>
                    </div>
                    <div
                        class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border"
                        style="width: 2.5rem; height: 2.5rem"
                    >
                        <i class="pi" style="color: #f59e0b; font-size: 1.25rem"
                            >₱</i
                        >
                    </div>
                </div>

                <!-- Detailed Breakdown -->
                <div class="space-y-3 border-t pt-4">
                    <div
                        v-for="(category, index) in stats.revenueBreakdown"
                        :key="index"
                    >
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-muted-color">{{
                                category.name
                            }}</span>
                            <span class="font-medium">
                                ₱{{ category.amount.toLocaleString() }}
                                <span class="text-muted-color"
                                    >({{ category.percentage }}%)</span
                                >
                            </span>
                        </div>
                        <div class="w-full bg-gray-100 rounded-full h-2">
                            <div
                                class="h-2 rounded-full transition-all duration-500"
                                :class="{
                                    'bg-blue-500': index === 0,
                                    'bg-green-500': index === 1,
                                    'bg-purple-500': index === 2,
                                    'bg-pink-500': index === 3,
                                }"
                                :style="{ width: category.percentage + '%' }"
                            ></div>
                        </div>
                    </div>
                </div>

                <div class="mt-4 flex justify-between items-center">
                    <div>
                        <span class="text-primary font-medium"
                            >{{ stats.revenueIncrease }}%+
                        </span>
                        <span class="text-muted-color text-sm"
                            >weekly increase</span
                        >
                    </div>
                    <Button
                        label="View Report"
                        class="p-button-text p-button-sm"
                        icon="pi pi-chart-line"
                    />
                </div>
            </div>
        </div>
    </div>

    <Dialog
        v-model:visible="showRevenueReport"
        header="Revenue Analysis Report"
        :style="{ width: '90vw', maxWidth: '1200px' }"
        :modal="true"
    >
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Time Range Selector -->
            <div class="col-span-full flex gap-2 mb-6">
                <Button
                    label="Weekly"
                    :class="{ 'p-button-outlined': reportTimeRange !== 'week' }"
                    @click="updateReportTimeRange('week')"
                />
                <Button
                    label="Monthly"
                    :class="{
                        'p-button-outlined': reportTimeRange !== 'month',
                    }"
                    @click="updateReportTimeRange('month')"
                />
                <Button
                    label="Quarterly"
                    :class="{
                        'p-button-outlined': reportTimeRange !== 'quarter',
                    }"
                    @click="updateReportTimeRange('quarter')"
                />
            </div>

            <!-- Main Chart -->
            <div class="col-span-full">
                <Chart
                    type="line"
                    :data="reportChartData"
                    :options="chartOptions"
                    class="h-80"
                />
            </div>

            <!-- Breakdown Details -->
            <div class="bg-gray-50 p-6 rounded-lg">
                <h3 class="text-lg font-semibold mb-4">Category Breakdown</h3>
                <div class="space-y-4">
                    <div
                        v-for="(category, index) in stats.revenueBreakdown"
                        :key="index"
                        class="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                    >
                        <div class="flex items-center gap-3">
                            <div
                                class="w-3 h-3 rounded-full"
                                :class="{
                                    'bg-blue-500': index === 0,
                                    'bg-green-500': index === 1,
                                    'bg-purple-500': index === 2,
                                    'bg-pink-500': index === 3,
                                }"
                            ></div>
                            <span class="font-medium">{{ category.name }}</span>
                        </div>
                        <div class="text-right">
                            <div class="font-semibold">
                                ₱{{ category.amount.toLocaleString() }}
                            </div>
                            <div class="text-sm text-gray-500">
                                {{ category.percentage }}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Summary Stats -->
            <div class="grid grid-cols-2 gap-4">
                <div class="p-4 bg-white rounded-lg shadow-sm">
                    <div class="text-gray-500 mb-1">Average Daily</div>
                    <div class="text-xl font-semibold text-blue-500">
                        ₱{{
                            (stats.revenue / 7).toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                            })
                        }}
                    </div>
                </div>
                <div class="p-4 bg-white rounded-lg shadow-sm">
                    <div class="text-gray-500 mb-1">Highest Day</div>
                    <div class="text-xl font-semibold text-green-500">
                        ₱73,000
                    </div>
                </div>
                <div class="p-4 bg-white rounded-lg shadow-sm">
                    <div class="text-gray-500 mb-1">YoY Growth</div>
                    <div class="text-xl font-semibold text-purple-500">
                        +18.4%
                    </div>
                </div>
                <div class="p-4 bg-white rounded-lg shadow-sm">
                    <div class="text-gray-500 mb-1">Repeat Guests</div>
                    <div class="text-xl font-semibold text-pink-500">42%</div>
                </div>
            </div>
        </div>

        <template #footer>
            <Button
                label="Export PDF"
                icon="pi pi-file-pdf"
                class="p-button-danger"
                @click="exportToPDF"
            />
            <Button
                label="Close"
                class="p-button-text"
                @click="showRevenueReport = false"
            />
        </template>
    </Dialog>
</template>

<style scoped>
.rounded-border {
    border-radius: 0.5rem;
}
.text-primary {
    color: #2563eb;
}
.text-muted-color {
    color: #6b7280;
}
</style>
