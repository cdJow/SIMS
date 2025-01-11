<script>
export default {
    data() {
        return {
            searchQuery: "",
            products: [
                { id: 1, name: "Bottled Water", price: 20.0, stock: 50 },
                { id: 2, name: "Chips", price: 50.0, stock: 30 },
                { id: 3, name: "Chocolate", price: 70.0, stock: 20 },
            ],
            cart: [],
            confirmationDialogVisible: false,
        };
    },
    computed: {
        filteredProducts() {
            return this.products.filter((product) =>
                product.name
                    .toLowerCase()
                    .includes(this.searchQuery.toLowerCase()),
            );
        },
        cartTotal() {
            return this.cart.reduce(
                (total, item) => total + item.price * item.quantity,
                0,
            );
        },
    },
    methods: {
        searchProducts() {
            // Logic for searching products (if dynamic search is needed)
            console.log("Search query:", this.searchQuery);
        },
        addToCart(product) {
            const existingItem = this.cart.find(
                (item) => item.id === product.id,
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
        removeFromCart(productId) {
            this.cart = this.cart.filter((item) => item.id !== productId);
        },
        checkout() {
            this.confirmationDialogVisible = true;
        },
        confirmCheckout() {
            console.log("Checkout successful. Cart items:", this.cart);
            this.cart = [];
            this.confirmationDialogVisible = false;
        },
    },
};
</script>

<template>
    <div class="p-4 card">
        <h1 class="text-2xl font-bold mb-4">Mini-Store POS</h1>

        <!-- Search Bar -->
        <div class="flex items-center mb-4">
            <InputText
                v-model="searchQuery"
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
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
                v-for="product in filteredProducts"
                :key="product.id"
                class="p-4 border rounded-lg shadow-md"
            >
                <h3 class="text-lg font-medium">{{ product.name }}</h3>
                <p class="text-sm text-gray-600">
                    Price: ₱{{ product.price.toFixed(2) }}
                </p>
                <p class="text-sm text-gray-600">Stock: {{ product.stock }}</p>
                <Button
                    label="Add to Cart"
                    icon="pi pi-plus"
                    class="p-button-success mt-2 w-full"
                    :disabled="product.stock <= 0"
                    @click="addToCart(product)"
                />
            </div>
        </div>

        <!-- Cart Section -->
        <div class="mt-8">
            <h2 class="text-xl font-bold mb-4">Cart</h2>

            <DataTable :value="cart" class="w-full mb-4">
                <Column field="name" header="Product" />
                <Column field="quantity" header="Quantity" />
                <Column field="price" header="Price" />
                <Column
                    header="Actions"
                    body="actionTemplate"
                    :style="{ width: '150px' }"
                />
            </DataTable>

            <div class="text-right font-bold text-lg">
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
                    label="Cancel"
                    class="p-button-secondary mr-2"
                    @click="confirmationDialogVisible = false"
                />
                <Button
                    label="Confirm"
                    class="p-button-primary"
                    @click="confirmCheckout"
                />
            </div>
        </Dialog>
    </div>
</template>

<style scoped></style>
