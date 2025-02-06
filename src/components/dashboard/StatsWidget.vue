<script>
export default {
    data() {
        return {
            stats: {
                operationalRooms: 80,

                underMaintinance: 4,

                totalRooms: 84,

                revenue: 5500,
                revenueIncrease: 12,
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
                            >Occupied Rooms</span
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

        <!-- Total Occupied Rooms -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4"
                            >Under Cleaning</span
                        >
                        <div
                            class="text-red-500 dark:text-surface-0 text-4xl font-semi-bold"
                        >
                            {{ stats.underMaintinance }}
                        </div>
                    </div>
                    <div
                        class="flex items-center justify-center bg-red-100 dark:bg-red-400/10 rounded-border"
                        style="width: 2.5rem; height: 2.5rem"
                    >
                        <i class="pi pi-table text-red-500 !text-xl"></i>
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
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-1"
                            >Revenue</span
                        >
                        <div
                            class="text-blue-500 dark:text-surface-0 font-semi-bold text-xl"
                        >
                            ₱ {{ stats.revenue }}
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
                <span class="text-primary font-medium"
                    >{{ stats.revenueIncrease }}%+
                </span>
                <span class="text-muted-color text-sm">increase this week</span>
            </div>
        </div>
    </div>
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
