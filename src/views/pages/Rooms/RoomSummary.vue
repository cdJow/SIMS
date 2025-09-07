<script>
export default {
    props: {
        operationalRooms: { type: Number, default: 0 }, // Available
        occupiedRooms: { type: Number, default: 0 },
        underMaintinance: { type: Number, default: 0 }, // Cleaning
        totalRooms: { type: Number, default: 0 }, // Booked
    },
    computed: {
        // Keep the template unchanged by exposing a 'stats' object
        stats() {
            return {
                operationalRooms: this.operationalRooms,
                occupiedRooms: this.occupiedRooms,
                underMaintinance: this.underMaintinance,
                totalRooms: this.totalRooms,
            };
        },
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
    </div>
</template>
