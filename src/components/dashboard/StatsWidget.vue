<script>
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
                        <span class="block font-medium mb-4">Booked Rooms</span>
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
                        <span class="block font-medium mb-1"
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
                            <span class="">{{ category.name }}</span>
                            <span class="font-medium">
                                ₱{{ category.amount.toLocaleString() }}
                                <span class=""
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
                        <span class="text-sm">weekly increase</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
