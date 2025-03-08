<template>
    <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 mb-4"
    >
        <!-- Card 1: Total Items -->
        <div class="card h-full p-6 transition-all hover:shadow-lg">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <span class="block text-gray-600 text-sm font-medium mb-1"
                        >Total Items</span
                    >
                    <div
                        class="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                        1,500
                    </div>
                </div>
                <div
                    class="w-12 h-12 bg-blue-100 dark:bg-blue-500/10 rounded-lg flex items-center justify-center"
                >
                    <i class="pi pi-box text-blue-500 text-xl"></i>
                </div>
            </div>
            <div class="text-sm">
                <span class="text-blue-600 font-semibold">120</span>
                <span class="text-gray-500 ml-1">low stock alerts</span>
            </div>
        </div>

        <!-- Card 2: Consumable Items -->
        <div class="card h-full p-6 transition-all hover:shadow-lg">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <span class="block text-gray-600 text-sm font-medium mb-1"
                        >Consumable Items</span
                    >
                    <div
                        class="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                        500
                    </div>
                </div>
                <div
                    class="w-12 h-12 bg-green-100 dark:bg-green-500/10 rounded-lg flex items-center justify-center"
                >
                    <i class="pi pi-check-circle text-green-500 text-xl"></i>
                </div>
            </div>
            <div class="text-sm">
                <span class="text-green-600 font-semibold">80%</span>
                <span class="text-gray-500 ml-1">in stock</span>
            </div>
        </div>

        <!-- Card 3: Non-Consumable Items -->
        <div class="card h-full p-6 transition-all hover:shadow-lg">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <span class="block text-gray-600 text-sm font-medium mb-1"
                        >Non-Consumable</span
                    >
                    <div
                        class="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                        350
                    </div>
                </div>
                <div
                    class="w-12 h-12 bg-yellow-100 dark:bg-yellow-500/10 rounded-lg flex items-center justify-center"
                >
                    <i class="pi pi-tag text-yellow-500 text-xl"></i>
                </div>
            </div>
            <div class="text-sm">
                <span class="text-yellow-600 font-semibold">50 assigned</span>
                <span class="text-gray-500 mx-2">|</span>
                <span class="text-gray-500">20 damaged</span>
            </div>
        </div>

        <!-- Card 4: Rental Items -->
        <div class="card h-full p-6 transition-all hover:shadow-lg">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <span class="block text-gray-600 text-sm font-medium mb-1"
                        >Rental Items</span
                    >
                    <div
                        class="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                        150
                    </div>
                </div>
                <div
                    class="w-12 h-12 bg-purple-100 dark:bg-purple-500/10 rounded-lg flex items-center justify-center"
                >
                    <i class="pi pi-calendar text-purple-500 text-xl"></i>
                </div>
            </div>
            <div class="text-sm">
                <span class="text-purple-600 font-semibold">120 available</span>
                <span class="text-gray-500 mx-2">|</span>
                <span class="text-gray-500">30 in use</span>
            </div>
        </div>

        <!-- Card 5: Total Inventory Value -->
        <div class="card h-full p-6 transition-all hover:shadow-lg">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <span class="block text-gray-600 text-sm font-medium mb-1"
                        >Total Value</span
                    >
                    <div
                        class="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                        ₱25,000
                    </div>
                </div>
                <div
                    class="w-12 h-12 bg-orange-100 dark:bg-orange-500/10 rounded-lg flex items-center justify-center"
                >
                    <i class="pi" style="color: #f59e0b; font-size: 1.25rem"
                        >₱</i
                    >
                </div>
            </div>
            <div class="text-sm">
                <span class="text-orange-600 font-semibold">5% increase</span>
                <span class="text-gray-500 ml-1">this month</span>
            </div>
        </div>
    </div>
</template>
