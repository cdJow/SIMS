<script setup>
import { computed, ref } from "vue";

// Mock data initialization
const mockActiveOrders = ref([
    {
        orderNumber: "ORD-1001",
        roomNumber: "201",
        items: [
            { id: 1, name: "Club Sandwich", quantity: 2, price: 350 },
            { id: 3, name: "Iced Coffee", quantity: 1, price: 150 },
        ],
        total: 850,
        status: "Pending",
        timestamp: new Date(2024, 2, 15, 14, 30),
        statusUpdated: new Date(2024, 2, 15, 14, 30),
    },
    {
        orderNumber: "ORD-1002",
        roomNumber: "305",
        items: [
            { id: 2, name: "Caesar Salad", quantity: 1, price: 280 },
            { id: 4, name: "Fresh Juice", quantity: 2, price: 120 },
        ],
        total: 520,
        status: "Preparing",
        timestamp: new Date(2024, 2, 15, 14, 15),
        statusUpdated: new Date(2024, 2, 15, 14, 20),
    },
    {
        orderNumber: "ORD-1003",
        roomNumber: "412",
        items: [
            { id: 1, name: "Club Sandwich", quantity: 3, price: 350 },
            { id: 4, name: "Fresh Juice", quantity: 3, price: 120 },
        ],
        total: 1410,
        status: "Ready",
        timestamp: new Date(2024, 2, 15, 14, 0),
        statusUpdated: new Date(2024, 2, 15, 14, 25),
    },
]);

// Computed properties using mock data
const kitchenOrders = computed(() => {
    return mockActiveOrders.value.filter((order) =>
        ["Pending", "Preparing"].includes(order.status),
    );
});

const groupedOrders = computed(() => ({
    Pending: kitchenOrders.value.filter((o) => o.status === "Pending"),
    Preparing: kitchenOrders.value.filter((o) => o.status === "Preparing"),
}));

// Methods
const updateOrderStatus = (order, newStatus) => {
    const originalIndex = mockActiveOrders.value.findIndex(
        (o) => o.orderNumber === order.orderNumber,
    );
    if (originalIndex > -1) {
        mockActiveOrders.value[originalIndex].status = newStatus;
        mockActiveOrders.value[originalIndex].statusUpdated = new Date();
    }
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(value);
};

const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
};

const timeInStatus = (order) => {
    const diff = new Date() - new Date(order.statusUpdated || order.timestamp);
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m`;
};
</script>

<template>
    <div class="p-4 space-y-8">
        <!-- Preparation Timer -->
        <div class="bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-xl font-bold mb-4">Kitchen Statistics</h2>
            <div class="grid grid-cols-3 gap-4 text-center">
                <div class="p-4 bg-blue-50 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">
                        {{ kitchenOrders.length }}
                    </div>
                    <div class="text-sm">Active Orders</div>
                </div>
                <div class="p-4 bg-orange-50 rounded-lg">
                    <div class="text-2xl font-bold text-orange-600">
                        {{ groupedOrders.Pending.length }}
                    </div>
                    <div class="text-sm">Pending Preparation</div>
                </div>
                <div class="p-4 bg-green-50 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">
                        {{ groupedOrders.Preparing.length }}
                    </div>
                    <div class="text-sm">In Progress</div>
                </div>
            </div>
        </div>
        <!-- Kitchen Orders Dashboard -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Pending Orders -->
            <div class="bg-white p-6 rounded-lg shadow-md">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-orange-600">
                        <i class="pi pi-clock mr-2"></i>
                        Pending Orders ({{ groupedOrders.Pending.length }})
                    </h2>
                </div>

                <div class="space-y-4">
                    <div
                        v-for="order in groupedOrders.Pending"
                        :key="order.orderNumber"
                        class="border p-4 rounded-lg hover:shadow-md transition-all"
                    >
                        <div class="flex justify-between items-start">
                            <div>
                                <div class="font-bold text-lg mb-2">
                                    #{{ order.orderNumber }}
                                    <Tag
                                        :value="order.roomNumber"
                                        severity="info"
                                        class="ml-2"
                                    />
                                </div>
                                <div class="space-y-1 text-sm">
                                    <div
                                        v-for="item in order.items"
                                        :key="item.id"
                                        class="flex justify-between items-center"
                                    >
                                        <span
                                            >{{ item.quantity }}x
                                            {{ item.name }}</span
                                        >
                                        <span class="text-gray-500 ml-2">
                                            {{
                                                formatCurrency(
                                                    item.price * item.quantity,
                                                )
                                            }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                label="Start Preparing"
                                severity="warning"
                                @click="updateOrderStatus(order, 'Preparing')"
                            />
                        </div>
                        <div class="mt-2 text-xs text-gray-500">
                            Received: {{ formatTime(order.timestamp) }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Preparing Orders -->
            <div class="bg-white p-6 rounded-lg shadow-md">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-blue-600">
                        <i class="pi pi-spinner mr-2"></i>
                        In Progress ({{ groupedOrders.Preparing.length }})
                    </h2>
                </div>

                <div class="space-y-4">
                    <div
                        v-for="order in groupedOrders.Preparing"
                        :key="order.orderNumber"
                        class="border p-4 rounded-lg hover:shadow-md transition-all"
                    >
                        <div class="flex justify-between items-start">
                            <div>
                                <div class="font-bold text-lg mb-2">
                                    #{{ order.orderNumber }}
                                    <Tag
                                        :value="order.roomNumber"
                                        severity="info"
                                        class="ml-2"
                                    />
                                </div>
                                <div class="space-y-1 text-sm">
                                    <div
                                        v-for="item in order.items"
                                        :key="item.id"
                                        class="flex justify-between items-center"
                                    >
                                        <span
                                            >{{ item.quantity }}x
                                            {{ item.name }}</span
                                        >
                                        <span class="text-gray-500 ml-2">
                                            {{
                                                formatCurrency(
                                                    item.price * item.quantity,
                                                )
                                            }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                label="Mark as Ready"
                                severity="success"
                                @click="updateOrderStatus(order, 'Ready')"
                            />
                        </div>
                        <div
                            class="mt-2 text-xs text-gray-500 flex justify-between"
                        >
                            <span
                                >Started:
                                {{ formatTime(order.statusUpdated) }}</span
                            >
                            <span>Time elapsed: {{ timeInStatus(order) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.order-card {
    transition: all 0.2s ease;
}

.order-card:hover {
    transform: translateY(-2px);
}
</style>
