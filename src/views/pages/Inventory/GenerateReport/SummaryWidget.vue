<script setup>
import { ref, onMounted } from "vue";
import { getRentalSummary, getLowStockRentals } from "@/api/auth";
import { useToast } from "primevue/usetoast";

const toast = useToast();
const loading = ref(false);
const rentalSummary = ref({
    total_items: 0,
    available_items: 0,
    rented_items: 0,
    total_revenue: 0
});
const lowStockCount = ref(0);
const lowStockItems = ref([]);
const showLowStockDialog = ref(false);

const loadRentalSummary = async () => {
    try {
        loading.value = true;
        
        // Make both API calls in parallel for faster loading
        const [summaryResponse, lowStockResponse] = await Promise.all([
            getRentalSummary(),
            getLowStockRentals()
        ]);
        
        // Update data
        rentalSummary.value = summaryResponse.data;
        lowStockItems.value = lowStockResponse.data;
        lowStockCount.value = lowStockResponse.data.length;
        
    } catch (error) {
        toast.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to load rental summary data",
            life: 3000,
        });
    } finally {
        loading.value = false;
    }
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
    }).format(value);
};

const calculatePercentage = (available, total) => {
    if (total === 0) return 0;
    return Math.round((available / total) * 100);
};

const showLowStockDetails = () => {
    if (lowStockCount.value > 0) {
        showLowStockDialog.value = true;
    }
};

onMounted(() => {
    loadRentalSummary();
});
</script>

<template>
    <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 mb-4"
    >
        <!-- Card 1: Total Rental Items -->
        <div class="card h-full p-6 transition-all hover:shadow-lg">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <span class="block text-gray-600 text-sm font-medium mb-1"
                        >Total Rental Items</span
                    >
                    <div
                        class="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                        <ProgressSpinner v-if="loading" size="small" />
                        <span v-else>{{ rentalSummary.total_items }}</span>
                    </div>
                </div>
                <div
                    class="w-12 h-12 bg-blue-100 dark:bg-blue-500/10 rounded-lg flex items-center justify-center"
                >
                    <i class="pi pi-calendar text-blue-500 text-xl"></i>
                </div>
            </div>
            <div class="text-sm">
            
                 <span class=" text-blue-500 font-semibold">Total rental</span>
                  <span class="text-gray-500 ml-1">of items</span>
            </div>
        </div>

        <!-- Card 2: Available Items -->
        <div class="card h-full p-6 transition-all hover:shadow-lg">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <span class="block text-gray-600 text-sm font-medium mb-1"
                        >Available Items</span
                    >
                    <div
                        class="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                        <ProgressSpinner v-if="loading" size="small" />
                        <span v-else>{{ rentalSummary.available_items }}</span>
                    </div>
                </div>
                <div
                    class="w-12 h-12 bg-green-100 dark:bg-green-500/10 rounded-lg flex items-center justify-center"
                >
                    <i class="pi pi-check-circle text-green-500 text-xl"></i>
                </div>
            </div>
            <div class="text-sm">
                <span class="text-green-600 font-semibold">
                    {{ calculatePercentage(rentalSummary.available_items, rentalSummary.total_items) }}%
                </span>
                <span class="text-gray-500 ml-1">available for rental</span>
            </div>
        </div>

        <!-- Card 3: Rented Items -->
        <div class="card h-full p-6 transition-all hover:shadow-lg">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <span class="block text-gray-600 text-sm font-medium mb-1"
                        >Currently Rented</span
                    >
                    <div
                        class="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                        <ProgressSpinner v-if="loading" size="small" />
                        <span v-else>{{ rentalSummary.rented_items }}</span>
                    </div>
                </div>
                <div
                    class="w-12 h-12 bg-orange-100 dark:bg-orange-500/10 rounded-lg flex items-center justify-center"
                >
                    <i class="pi pi-clock text-orange-500 text-xl"></i>
                </div>
            </div>
            <div class="text-sm">
                <span class="text-orange-600 font-semibold">
                    {{ calculatePercentage(rentalSummary.rented_items, rentalSummary.total_items) }}%
                </span>
                <span class="text-gray-500 ml-1">utilization rate</span>
            </div>
        </div>

        <!-- Card 4: Total Revenue Potential -->
        <div class="card h-full p-6 transition-all hover:shadow-lg">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <span class="block text-gray-600 text-sm font-medium mb-1"
                        >Total Rental</span
                    >
                    <div
                        class="text-2xl font-bold text-gray-900 dark:text-white"
                    >
                        <ProgressSpinner v-if="loading" size="small" />
                        <span v-else>{{ formatCurrency(rentalSummary.total_revenue) }}</span>
                    </div>
                </div>
                <div
                    class="w-12 h-12 bg-purple-100 dark:bg-purple-500/10 rounded-lg flex items-center justify-center"
                >
                    <i class="pi pi-dollar text-purple-500 text-xl"></i>
                </div>
            </div>
            <div class="text-sm">
                <span class="text-purple-600 font-semibold">Total value</span>
                <span class="text-gray-500 ml-1">of rental inventory</span>
            </div>
        </div>
    </div>

    <!-- Low Stock Details Dialog -->
    <Dialog v-model:visible="showLowStockDialog" header="Low Stock Items" :style="{ width: '80vw' }" :modal="true">
        <DataTable :value="lowStockItems" :paginator="true" :rows="10" class="p-datatable-gridlines">
            <Column field="product_name" header="Product Name" sortable></Column>
            <Column field="brand" header="Brand" sortable></Column>
            <Column field="category" header="Category" sortable></Column>
            <Column field="quantity" header="Current Qty" sortable>
                <template #body="slotProps">
                    <span class="text-red-600 font-semibold">{{ slotProps.data.quantity }}</span>
                </template>
            </Column>
            <Column field="minimum_stock" header="Min Stock" sortable>
                <template #body="slotProps">
                    <span class="text-orange-600">{{ slotProps.data.minimum_stock }}</span>
                </template>
            </Column>
            <Column header="Stock Deficit" sortable>
                <template #body="slotProps">
                    <span class="text-red-700 font-bold">
                        {{ slotProps.data.minimum_stock - slotProps.data.quantity }}
                    </span>
                </template>
            </Column>
            <Column field="unit_rental_price" header="Rental Price" sortable>
                <template #body="slotProps">
                    {{ formatCurrency(slotProps.data.unit_rental_price) }}
                </template>
            </Column>
        </DataTable>
    </Dialog>

    <Toast />
</template>
