<script setup>
import { useToast } from "primevue/usetoast";
import { computed, ref } from "vue";

const toast = useToast();

// Menu Data
const menuCategories = ref([
    {
        name: "Food",
        items: [
            {
                id: 1,
                name: "Club Sandwich",
                description: "Toasted bread with chicken",
                price: 350,
            },
            {
                id: 2,
                name: "Caesar Salad",
                description: "Fresh garden salad",
                price: 280,
            },
            // Add more items...
        ],
    },
    {
        name: "Beverages",
        items: [
            {
                id: 3,
                name: "Iced Coffee",
                description: "Cold brew coffee",
                price: 150,
            },
            {
                id: 4,
                name: "Fresh Juice",
                description: "Seasonal fruits",
                price: 120,
            },
            // Add more items...
        ],
    },
]);

// Order Management
const currentOrder = ref({
    roomNumber: "",
    items: [],
});

const activeOrders = ref([
    // Sample existing orders
    {
        orderNumber: "ORD-1001",
        roomNumber: "201",
        items: [{ id: 1, name: "Club Sandwich", quantity: 2, price: 350 }],
        total: 700,
        status: "Preparing",
        timestamp: new Date(),
    },
]);

// Computed Properties
const currentOrderTotal = computed(() => {
    return currentOrder.value.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
    );
});

// Methods
const addToOrder = (item) => {
    const existing = currentOrder.value.items.find((i) => i.id === item.id);
    if (existing) {
        existing.quantity++;
    } else {
        currentOrder.value.items.push({ ...item, quantity: 1 });
    }
};

const removeItem = (item) => {
    currentOrder.value.items = currentOrder.value.items.filter(
        (i) => i.id !== item.id,
    );
};

const clearOrder = () => {
    currentOrder.value = { roomNumber: "", items: [] };
};

const submitOrder = () => {
    const newOrder = {
        orderNumber: `ORD-${Date.now()}`,
        ...currentOrder.value,
        total: currentOrderTotal.value,
        status: "Pending",
        timestamp: new Date(),
    };

    activeOrders.value.unshift(newOrder);
    clearOrder();

    toast.add({
        severity: "success",
        summary: "Order Submitted",
        detail: "Order has been placed successfully",
        life: 3000,
    });
};

const cancelOrder = (order) => {
    activeOrders.value = activeOrders.value.filter(
        (o) => o.orderNumber !== order.orderNumber,
    );
    toast.add({
        severity: "warn",
        summary: "Order Cancelled",
        detail: `Order ${order.orderNumber} has been cancelled`,
        life: 3000,
    });
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(value);
};

const getStatusSeverity = (status) => {
    switch (status) {
        case "Pending":
            return "warning";
        case "Preparing":
            return "info";
        case "Ready":
            return "success";
        case "Delivered":
            return "secondary";
        default:
            return "info";
    }
};
</script>

<template>
    <div class="p-4 space-y-8">
        <!-- Order Creation Section -->
        <div class="card p-6 rounded-lg">
            <h2 class="text-2xl font-bold mb-6">New Order</h2>

            <!-- Room Selection -->
            <div class="mb-6">
                <label class="block text-sm font-medium mb-2"
                    >Room Number</label
                >
                <InputText
                    v-model="currentOrder.roomNumber"
                    placeholder="Enter Room Number"
                    class="w-full"
                />
            </div>

            <!-- Menu Categories -->
            <TabView>
                <TabPanel
                    v-for="category in menuCategories"
                    :key="category.name"
                    :header="category.name"
                >
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div
                            v-for="item in category.items"
                            :key="item.id"
                            class="border p-4 rounded-lg hover:shadow-md transition-shadow"
                        >
                            <div class="flex justify-between items-start">
                                <div>
                                    <h3 class="font-semibold">
                                        {{ item.name }}
                                    </h3>
                                    <p class="text-sm">
                                        {{ item.description }}
                                    </p>
                                    <p class="text-primary font-medium mt-2">
                                        {{ formatCurrency(item.price) }}
                                    </p>
                                </div>
                                <Button
                                    icon="pi pi-plus"
                                    class="p-button-sm p-button-rounded"
                                    @click="addToOrder(item)"
                                />
                            </div>
                        </div>
                    </div>
                </TabPanel>
            </TabView>

            <!-- Current Order Summary -->
            <div class="mt-8">
                <h3 class="text-lg font-semibold mb-4">Current Order</h3>
                <DataTable :value="currentOrder.items" class="p-datatable-sm">
                    <Column field="name" header="Item"></Column>
                    <Column header="Quantity" style="width: 120px">
                        <template #body="{ data }">
                            <InputNumber
                                v-model="data.quantity"
                                :min="1"
                                showButtons
                                class="w-full"
                            />
                        </template>
                    </Column>
                    <Column header="Price" style="width: 150px">
                        <template #body="{ data }">
                            {{ formatCurrency(data.price * data.quantity) }}
                        </template>
                    </Column>
                    <Column header="Actions" style="width: 100px">
                        <template #body="{ data }">
                            <Button
                                icon="pi pi-trash"
                                class="p-button-danger p-button-sm"
                                @click="removeItem(data)"
                            />
                        </template>
                    </Column>
                    <Column header="Total" footer="">
                        <template #footer>
                            <div class="font-semibold">
                                {{ formatCurrency(currentOrderTotal) }}
                            </div>
                        </template>
                    </Column>
                </DataTable>

                <div class="mt-4 flex justify-end gap-4">
                    <Button
                        label="Clear Order"
                        icon="pi pi-times"
                        class="p-button-secondary"
                        @click="clearOrder"
                    />
                    <Button
                        label="Submit Order"
                        icon="pi pi-check"
                        class="p-button-success"
                        @click="submitOrder"
                        :disabled="
                            !currentOrder.roomNumber ||
                            currentOrder.items.length === 0
                        "
                    />
                </div>
            </div>
        </div>

        <!-- Active Orders Section -->
        <div class="card p-6 rounded-lg shadow-md">
            <h2 class="text-2xl font-bold mb-6">Active Orders</h2>
            <DataTable :value="activeOrders" class="p-datatable-sm">
                <Column field="orderNumber" header="Order #" sortable></Column>
                <Column field="roomNumber" header="Room" sortable></Column>
                <Column header="Items">
                    <template #body="{ data }">
                        <div
                            v-for="item in data.items"
                            :key="item.id"
                            class="text-sm"
                        >
                            {{ item.quantity }}x {{ item.name }}
                        </div>
                    </template>
                </Column>
                <Column field="total" header="Total">
                    <template #body="{ data }">
                        {{ formatCurrency(data.total) }}
                    </template>
                </Column>
                <Column field="status" header="Status" sortable>
                    <template #body="{ data }">
                        <Tag
                            :value="data.status"
                            :severity="getStatusSeverity(data.status)"
                        />
                    </template>
                </Column>
                <Column header="Actions">
                    <template #body="{ data }">
                        <div class="flex gap-2">
                            <Button
                                label="Cancel Order"
                                class="p-button-danger p-button-sm"
                                @click="cancelOrder(data)"
                            />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>

<style scoped>
.p-tabview-nav {
    @apply mb-4;
}

.p-order-item-card:hover {
    @apply shadow-lg transition-shadow duration-200;
}
</style>
