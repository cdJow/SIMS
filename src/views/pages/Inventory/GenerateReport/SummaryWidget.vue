<template>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
        <!-- Card 1: Total Items -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg transition">
            <div class="flex justify-between mb-4">
                <div>
                    <span
                        class="block text-gray-500 dark:text-gray-400 font-medium mb-1"
                    >
                        Total Items
                    </span>
                    <div
                        class="text-gray-900 dark:text-white font-bold text-2xl"
                    >
                        1,500
                    </div>
                </div>
                <div
                    class="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-500/10 rounded-lg"
                >
                    <i class="pi pi-box text-blue-500 text-2xl"></i>
                </div>
            </div>
            <span class="text-blue-600 font-semibold">120 low stock </span>
            <span class="text-gray-500 text-sm">alerts</span>
        </div>

        <!-- Card 2: Consumable Items -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg transition">
            <div class="flex justify-between mb-4">
                <div>
                    <span
                        class="block text-gray-500 dark:text-gray-400 font-medium mb-1"
                    >
                        Consumable Items
                    </span>
                    <div
                        class="text-gray-900 dark:text-white font-bold text-2xl"
                    >
                        500
                    </div>
                </div>
                <div
                    class="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-500/10 rounded-lg"
                >
                    <i class="pi pi-check-circle text-green-500 text-2xl"></i>
                </div>
            </div>
            <span class="text-green-600 font-semibold">80% </span>
            <span class="text-gray-500 text-sm">in stock</span>
        </div>

        <!-- Card 3: Non-Consumable Items -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg transition">
            <div class="flex justify-between mb-4">
                <div>
                    <span
                        class="block text-gray-500 dark:text-gray-400 font-medium mb-1"
                    >
                        Non-Consumable Items
                    </span>
                    <div
                        class="text-gray-900 dark:text-white font-bold text-2xl"
                    >
                        350
                    </div>
                </div>
                <div
                    class="flex items-center justify-center w-12 h-12 bg-yellow-100 dark:bg-yellow-500/10 rounded-lg"
                >
                    <i class="pi pi-tag text-yellow-500 text-2xl"></i>
                </div>
            </div>
            <span class="text-yellow-600 font-semibold">50 assigned </span>
            <span class="text-gray-500 text-sm">| 20 damaged</span>
        </div>

        <!-- Card 4:  -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg transition">
            <div class="flex justify-between mb-4">
                <div>
                    <span
                        class="block text-gray-500 dark:text-gray-400 font-medium mb-1"
                    >
                        Rental Items
                    </span>
                    <div
                        class="text-gray-900 dark:text-white font-bold text-2xl"
                    >
                        150
                    </div>
                </div>
                <div
                    class="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-500/10 rounded-lg"
                >
                    <i class="pi pi-calendar text-purple-500 text-2xl"></i>
                </div>
            </div>
            <span class="text-purple-600 font-semibold">120 available </span>
            <span class="text-gray-500 text-sm">| 30 in use</span>
        </div>

        <!-- Card 5: -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg transition">
            <div class="flex justify-between mb-4">
                <div>
                    <span
                        class="block text-gray-500 dark:text-gray-400 font-medium mb-1"
                    >
                        Total Inventory Value
                    </span>
                    <div
                        class="text-gray-900 dark:text-white font-bold text-2xl"
                    >
                        $25,000
                    </div>
                </div>
                <div
                    class="flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-500/10 rounded-lg"
                >
                    <i class="pi pi-dollar text-orange-500 text-2xl"></i>
                </div>
            </div>
            <span class="text-orange-600 font-semibold">5% increase </span>
            <span class="text-gray-500 text-sm">this month</span>
        </div>
    </div>
</template>
