<script>
export default {
    data() {
        return {
            searchQuery: "",
            dummyProducts: [
                { id: 1, name: "Product A", price: 50, stock: 20 },
                { id: 2, name: "Product B", price: 100, stock: 10 },
                { id: 3, name: "Product C", price: 30, stock: 15 },
                { id: 4, name: "Product D", price: 20, stock: 25 },
            ],
            cart: [],
            rooms: [
                { id: 101, roomNumber: "101", status: "Occupied" },
                { id: 102, roomNumber: "102", status: "Occupied" },
                { id: 103, roomNumber: "103", status: "Available" },
            ],
            selectedRoom: null,
        };
    },
    computed: {
        filteredProducts() {
            return this.dummyProducts.filter((product) =>
                product.name
                    .toLowerCase()
                    .includes(this.searchQuery.toLowerCase()),
            );
        },
        total() {
            return this.cart.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0,
            );
        },
    },
    methods: {
        searchProducts() {
            console.log("Search for:", this.searchQuery);
        },
        addToCart(product) {
            const existingItem = this.cart.find(
                (item) => item.id === product.id,
            );
            if (existingItem) {
                if (existingItem.quantity < product.stock) {
                    existingItem.quantity++;
                } else {
                    alert("Stock limit reached!");
                }
            } else {
                this.cart.push({ ...product, quantity: 1 });
            }
        },
        removeFromCart(item) {
            this.cart = this.cart.filter((cartItem) => cartItem.id !== item.id);
        },
        selectRoom(room) {
            this.selectedRoom = room;
        },
        assignRoom() {
            if (!this.selectedRoom) {
                alert("Please select a room to assign items!");
                return;
            }
            alert(`Items assigned to Room ${this.selectedRoom.roomNumber}`);
            this.cart = []; // Clear the cart after assigning items
        },
        checkout() {
            alert("Checkout successful!");
            this.cart = [];
        },
    },
};
</script>

<template>
    <div class="card">
        <!-- Main Content -->
        <div class="flex flex-grow gap-4">
            <!-- Product List Section -->
            <div class="flex-1 card rounded-lg p-4 overflow-y-auto">
                <!-- Search Bar -->
                <div class="flex items-center gap-2 mb-4">
                    <InputText
                        v-model="searchQuery"
                        placeholder="Search for products..."
                        class="w-full"
                    />
                    <Button
                        label="Search"
                        icon="pi pi-search"
                        class="p-button-primary"
                        @click="searchProducts"
                    />
                </div>

                <!-- Product List -->
                <div class="grid grid-cols-2 gap-4">
                    <!-- Product Card -->
                    <div
                        v-for="product in filteredProducts"
                        :key="product.id"
                        class="p-4 border rounded-lg shadow"
                    >
                        <h3 class="font-bold text-lg">{{ product.name }}</h3>
                        <p class="text-sm">Price: ₱{{ product.price }}</p>
                        <p class="text-sm">Stock: {{ product.stock }}</p>
                        <Button
                            label="Add to Cart"
                            icon="pi pi-plus"
                            class="p-button-primary w-full mt-2"
                            :disabled="product.stock === 0"
                            @click="addToCart(product)"
                        />
                    </div>
                </div>
            </div>

            <!-- Room List Section -->
            <div class="w-1/4 card rounded-lg shadow p-4">
                <h2 class="text-xl font-bold mb-4">Assign Room</h2>
                <div
                    class="grid grid-cols-1 gap-4 overflow-y-auto"
                    style="max-height: 400px"
                >
                    <!-- Room Card -->
                    <div
                        v-for="room in rooms"
                        :key="room.id"
                        :class="[
                            selectedRoom === room
                                ? 'p-4 border-green-500 border '
                                : 'p-4 ',
                        ]"
                        class="rounded-lg shadow cursor-pointer"
                        @click="selectRoom(room)"
                    >
                        <h3 class="font-bold text-lg">
                            Room {{ room.roomNumber }}
                        </h3>
                        <p class="text-sm">Status: {{ room.status }}</p>
                    </div>
                </div>
            </div>

            <!-- Cart Section -->
            <div class="w-1/3 card rounded-lg shadow p-4">
                <h2 class="text-xl font-bold mb-4">Cart</h2>
                <DataTable :value="cart" class="p-datatable-sm">
                    <Column field="name" header="Product"></Column>
                    <Column field="quantity" header="Quantity"></Column>
                    <Column
                        header="Price (₱)"
                        body="item => `₱${item.price}`"
                    ></Column>

                    <Column header="Actions" body="rowData">
                        <template #body="slotProps">
                            <Button
                                icon="pi pi-trash"
                                class="p-button-danger p-button-text"
                                @click="removeFromCart(slotProps.data)"
                            />
                        </template>
                    </Column>
                </DataTable>
                <!-- Total -->
                <div class="mt-4 text-right">
                    <p class="text-lg font-semibold">Total: ₱{{ total }}</p>
                    <Button
                        label="Check - Out"
                        class="w-full p-button-primary mt-4"
                        @click="assignRoom"
                    />
                </div>
            </div>
        </div>
    </div>
</template>
