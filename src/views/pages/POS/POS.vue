<script>
export default {
    data() {
        return {
            productSearchQuery: "", // Search query for products
            historySearchDate: null, // Selected date for filtering history
            products: [
                { id: 1, name: "Bottled Water", price: 20.0, stock: 50 },
                { id: 2, name: "Chips", price: 50.0, stock: 30 },
                { id: 3, name: "Chocolate", price: 70.0, stock: 20 },
            ],
            cart: [], // Stores cart items
            confirmationDialogVisible: false,
            billDialogVisible: false, // For displaying the bill
            history: [
                {
                    timestamp: "2025-01-10 14:00",
                    items: [
                        {
                            id: 1,
                            name: "Bottled Water",
                            price: 20.0,
                            quantity: 2,
                        },
                    ],
                    total: 40,
                },
                {
                    timestamp: "2025-01-11 15:30",
                    items: [{ id: 2, name: "Chips", price: 50.0, quantity: 3 }],
                    total: 150,
                },
            ], // Transaction history
            historyDialogVisible: false, // For viewing checkout details
            selectedHistory: null, // Selected history details
        };
    },
    computed: {
        // Filter products based on the product search query
        filteredProducts() {
            const query = this.productSearchQuery.toLowerCase();
            return this.products.filter((product) =>
                product.name.toLowerCase().includes(query)
            );
        },
        // Filter transaction history based on the selected date
        filteredHistory() {
            if (!this.historySearchDate) return this.history; // If no date is selected, show all history
            const selectedDate = new Date(this.historySearchDate);
            return this.history.filter((entry) => {
                const entryDate = new Date(entry.timestamp);
                return (
                    selectedDate.getFullYear() === entryDate.getFullYear() &&
                    selectedDate.getMonth() === entryDate.getMonth() &&
                    selectedDate.getDate() === entryDate.getDate()
                );
            });
        },
        // Calculate the total cart amount
        cartTotal() {
            return this.cart.reduce(
                (total, item) => total + item.price * item.quantity,
                0
            );
        },
    },
    methods: {
        addToCart(product) {
            const existingItem = this.cart.find(
                (item) => item.id === product.id
            );
            if (existingItem) {
                if (existingItem.quantity < product.stock) {
                    existingItem.quantity += 1;
                } else {
                    alert("Stock limit reached.");
                }
            } else {
                this.cart.push({ ...product, quantity: 1 });
            }
        },
        increaseQuantity(item) {
            const product = this.products.find((p) => p.id === item.id);
            if (product && item.quantity < product.stock) {
                item.quantity += 1;
            } else {
                alert("Stock limit reached.");
            }
        },
        decreaseQuantity(item) {
            if (item.quantity > 1) {
                item.quantity -= 1;
            } else {
                this.removeFromCart(item.id);
            }
        },
        removeFromCart(productId) {
            this.cart = this.cart.filter((item) => item.id !== productId);
        },
        checkout() {
            this.confirmationDialogVisible = true;
        },
        confirmCheckout() {
            const timestamp = new Date().toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                hour12: true,
            });
            const checkoutItems = [...this.cart];
            const total = this.cartTotal;

            // Add the checkout details to history
            this.history.push({
                timestamp,
                items: checkoutItems,
                total,
            });

            // Clear the cart and reset dialogs
            this.cart = [];
            this.confirmationDialogVisible = false;
            this.billDialogVisible = true;
        },
        viewHistoryDetails(history) {
            this.selectedHistory = history;
            this.historyDialogVisible = true;
        },
    },
};
</script>

<template>
    <div class="p-4 card">
        <h1 class="text-2xl font-bold mb-4">Mini-Store POS</h1>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Mini-Store Column -->
            <div class="border rounded-lg shadow-md p-4">
                <!-- Search Bar -->
                <div class="flex items-center mb-4">
                    <InputText
                        v-model="productSearchQuery"
                        placeholder="Search for products..."
                        class="w-full mr-2"
                    />
                    <Button
                        label="Search"
                        icon="pi pi-search"
                        class="p-button-primary"
                        @click="searchProducts"
                    />
                </div>

                <!-- Product List -->
                <div
                    class="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto"
                    style="max-height: 400px"
                >
                    <div
                        v-for="product in filteredProducts"
                        :key="product.id"
                        class="p-4 border rounded-lg shadow-md"
                    >
                        <h3 class="text-lg font-medium">{{ product.name }}</h3>
                        <p class="text-sm text-gray-600">
                            Price: ₱{{ product.price.toFixed(2) }}
                        </p>
                        <p class="text-sm text-gray-600">
                            Stock: {{ product.stock }}
                        </p>
                        <Button
                            label="Add to Cart"
                            icon="pi pi-plus"
                            class="p-button-primary mt-2 w-full"
                            :disabled="product.stock <= 0"
                            @click="addToCart(product)"
                        />
                    </div>
                </div>
            </div>

            <!-- Cart Column -->
            <div class="border rounded-lg shadow-md p-4">
                <h2 class="text-xl font-bold mb-4">Cart</h2>

                <div class="overflow-y-auto" style="max-height: 400px">
                    <DataTable
                        :value="cart"
                        class="p-datatable-sm shadow-md"
                        responsiveLayout="scroll"
                    >
                        <!-- Column for Product Name -->
                        <Column field="name" header="Product" />

                        <!-- Column for Quantity with Increase/Decrease -->
                        <Column header="Quantity">
                            <template #body="slotProps">
                                <div class="flex items-center gap-2">
                                    <Button
                                        icon="pi pi-minus"
                                        class="p-button-text"
                                        @click="
                                            decreaseQuantity(slotProps.data)
                                        "
                                    />
                                    <span>{{ slotProps.data.quantity }}</span>
                                    <Button
                                        icon="pi pi-plus"
                                        class="p-button-text"
                                        @click="
                                            increaseQuantity(slotProps.data)
                                        "
                                    />
                                </div>
                            </template>
                        </Column>

                        <!-- Column for Price -->
                        <Column header="Price (₱)">
                            <template #body="slotProps">
                                ₱{{ slotProps.data.price.toFixed(2) }}
                            </template>
                        </Column>

                        <!-- Column for Subtotal -->
                        <Column header="Subtotal (₱)">
                            <template #body="slotProps">
                                ₱{{
                                    (
                                        slotProps.data.price *
                                        slotProps.data.quantity
                                    ).toFixed(2)
                                }}
                            </template>
                        </Column>

                        <!-- Column for Actions -->
                        <Column header="Actions">
                            <template #body="slotProps">
                                <Button
                                    icon="pi pi-trash"
                                    class="p-button-danger"
                                    @click="removeFromCart(slotProps.data.id)"
                                />
                            </template>
                        </Column>
                    </DataTable>
                </div>

                <div class="text-right font-bold text-lg mt-4">
                    Total: ₱{{ cartTotal.toFixed(2) }}
                </div>
                <Button
                    label="Checkout"
                    icon="pi pi-check"
                    class="p-button-primary mt-4 w-full"
                    :disabled="cart.length === 0"
                    @click="checkout"
                />
            </div>
        </div>

        <!-- Confirmation Dialog -->
        <Dialog
            v-model:visible="confirmationDialogVisible"
            header="Confirm Checkout"
            :modal="true"
            class="w-1/3"
        >
            <p>Are you sure you want to proceed with checkout?</p>
            <div class="flex justify-end mt-4">
                <Button
                    label="Confirm"
                    class="p-button-primary mr-2"
                    @click="confirmCheckout"
                />
                <Button
                    label="Cancel"
                    class="p-button-secondary"
                    @click="confirmationDialogVisible = false"
                />
            </div>
        </Dialog>

        <!-- Bill Dialog -->
        <Dialog
            v-model:visible="billDialogVisible"
            header="Bill Summary"
            :modal="true"
            class="w-1/2"
        >
            <div v-if="history.length > 0">
                <h3 class="text-lg font-bold mb-2">Bill Details</h3>
                <ul>
                    <li
                        v-for="item in history[history.length - 1].items"
                        :key="item.id"
                        class="flex justify-between"
                    >
                        <span>{{ item.quantity }} x {{ item.name }}</span>
                        <span>
                            ₱{{ (item.quantity * item.price).toFixed(2) }}
                        </span>
                    </li>
                </ul>
                <hr class="my-4" />
                <div class="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span
                        >₱{{
                            history[history.length - 1].total.toFixed(2)
                        }}</span
                    >
                </div>
            </div>
            <div v-else>
                <p>No checkout data available.</p>
            </div>
            <div class="flex justify-end mt-4">
                <Button
                    label="Close"
                    class="p-button-primary"
                    @click="billDialogVisible = false"
                />
            </div>
        </Dialog>
        <!-- Transaction History Section -->
        <div class="mt-8">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold">Transaction History</h2>
                <div class="flex items-center gap-2">
                    <!-- Calendar Input for Date Search -->
                    <Calendar
                        v-model="historySearchDate"
                        placeholder="Select date..."
                        class="w-full max-w-md"
                        dateFormat="mm/dd/yy"
                        showIcon
                        @input="filterHistory"
                    />
                </div>
            </div>
            <div
                class="overflow-y-auto max-h-96"
                style="max-height: 24rem; padding-right: 0.5rem"
            >
                <div
                    v-for="entry in filteredHistory"
                    :key="entry.timestamp"
                    class="p-2 border rounded-lg shadow-md mb-4"
                    style="
                        max-height: 5rem;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    "
                >
                    <div class="font-bold text-lg">
                        Date: {{ entry.timestamp }}
                    </div>
                    <div class="text-right mt-2">
                        <Button
                            label="View Details"
                            class="p-button-primary"
                            @click="viewHistoryDetails(entry)"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- History Details Dialog -->
        <Dialog
            v-model:visible="historyDialogVisible"
            header="Transaction Details"
            :modal="true"
            class="w-1/2"
        >
            <div
                v-if="selectedHistory"
                class="max-h-96 overflow-y-auto"
                style="max-height: 24rem; overflow-y: auto; padding: 1rem"
            >
                <h3 class="text-lg font-bold mb-4">Details</h3>
                <ul>
                    <li
                        v-for="item in selectedHistory.items"
                        :key="item.id"
                        class="flex justify-between mb-2"
                    >
                        <span>{{ item.quantity }} x {{ item.name }}</span>
                        <span
                            >₱{{
                                (item.quantity * item.price).toFixed(2)
                            }}</span
                        >
                    </li>
                </ul>
                <hr class="my-4" />
                <div class="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₱{{ selectedHistory.total.toFixed(2) }}</span>
                </div>
            </div>
            <div class="flex justify-end mt-4">
                <Button
                    label="Close"
                    class="p-button-primary"
                    @click="historyDialogVisible = false"
                />
            </div>
        </Dialog>
    </div>
</template>

<style scoped></style>
