<script setup>
import { useAuthStore } from "@/stores/auth";
import Dialog from "primevue/dialog";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();

// Reactive state
const showBookingDialog = ref(false);
const searchQuery = ref("");
const selectedSort = ref(null);

const selectedFilters = ref([]);
const showBackToTop = ref(false);

// Sample data - replace with your actual data source
const rooms = ref([
    {
        name: "Double Size Bed - Standard",
        description: "Perfect for two guests with additional space.",
        bedType: "Double Size Bed",
        occupancy: 2,
        rates: [
            { duration: 6, price: 50 },
            { duration: 12, price: 80 },
            { duration: 24, price: 120 },
        ],
    },
    {
        name: "Queen Size Bed - Deluxe",
        description: "A spacious and comfortable room for a relaxing stay.",
        bedType: "Queen Size Bed",
        occupancy: 2,
        rates: [
            { duration: 6, price: 70 },
            { duration: 12, price: 100 },
            { duration: 24, price: 150 },
        ],
    },
    {
        name: "King Size Bed - Suite",
        description: "Luxury suite with a king-size bed and extra amenities.",
        bedType: "King Size Bed",
        occupancy: 2,
        rates: [
            { duration: 6, price: 100 },
            { duration: 12, price: 150 },
            { duration: 24, price: 200 },
        ],
    },
    {
        name: "Family Room - Standard",
        description: "Ideal for families, featuring multiple beds.",
        bedType: "Two Double Beds",
        occupancy: 4,
        rates: [
            { duration: 6, price: 120 },
            { duration: 12, price: 180 },
            { duration: 24, price: 250 },
        ],
    },
    {
        name: "Single Room - Budget",
        description: "A compact room suitable for solo travelers.",
        bedType: "Single Bed",
        occupancy: 1,
        rates: [
            { duration: 6, price: 30 },
            { duration: 12, price: 50 },
            { duration: 24, price: 75 },
        ],
    },
]);

// Filter options
const selectedBedSize = ref(null);
const selectedRoomType = ref(null);

// Filter refs
const selectedOccupancy = ref(null);

// Occupancy options
const occupancyOptions = ref([
    { label: "1 Person", value: 1 },
    { label: "2 Persons", value: 2 },
    { label: "3-4 Persons", value: 4 },
    { label: "5+ Persons", value: 5 },
]);

const bedSizes = ref([
    { label: "Single Size Bed", value: "single" },
    { label: "Double Size Bed", value: "double" },
    { label: "Queen Size Bed", value: "queen" },
]);

const roomTypes = ref([
    { label: "Standard", value: "standard" },
    { label: "Deluxe", value: "deluxe" },
    { label: "Suite", value: "suite" },
    { label: "Budget", value: "budget" },
]);

// Computed properties
const isLoggedIn = computed(() => authStore.isAuthenticated);
const filteredRooms = computed(() => {
    let result = [...rooms.value];

    // Search filter
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(
            (room) =>
                room.name.toLowerCase().includes(query) ||
                room.description.toLowerCase().includes(query)
        );
    }

    // Selected filters
    if (selectedFilters.value.length > 0) {
        result = result.filter((room) =>
            selectedFilters.value.every((filter) =>
                room.amenities.includes(filter.label)
            )
        );
    }

    // Sorting
    if (selectedSort.value) {
        switch (selectedSort.value.value) {
            case "price-asc":
                result.sort(
                    (a, b) =>
                        a.price.replace(/,/g, "") - b.price.replace(/,/g, "")
                );
                break;
            case "price-desc":
                result.sort(
                    (a, b) =>
                        b.price.replace(/,/g, "") - a.price.replace(/,/g, "")
                );
                break;
            case "occupancy":
                result.sort(
                    (a, b) => parseInt(a.occupancy) - parseInt(b.occupancy)
                );
                break;
        }
    }

    return result;
});

// Methods
const handleBookNow = (room) => {
    if (!isLoggedIn.value) {
        router.push("/login");
        return;
    }
    showBookingDialog.value = true;
};

const checkScroll = () => {
    showBackToTop.value = window.scrollY > 200;
};

const scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth",
    });
};

// Lifecycle hooks
onMounted(() => {
    window.addEventListener("scroll", checkScroll);
});

onUnmounted(() => {
    window.removeEventListener("scroll", checkScroll);
});
</script>
<template>
    <div>
        <div>
            <div class="mx-auto">
                <div>
                    <!-- Replace Carousel with Grid -->
                    <div
                        class="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4"
                    >
                        <div
                            v-for="room in rooms"
                            :key="room.name"
                            class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            <!-- Room Content -->
                            <div
                                class="flex flex-col md:flex-row gap-6 md:gap-8 p-4"
                            >
                                <!-- Image Container -->
                                <div class="md:w-1/2">
                                    <div
                                        class="relative rounded-xl overflow-hidden shadow-lg h-64 md:h-96"
                                    >
                                        <img
                                            src="@/assets/images/2.jpg"
                                            class="w-full h-full object-cover transform hover:scale-105 transition-all duration-300"
                                            alt="Room Image"
                                        />
                                        <div
                                            class="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent"
                                        ></div>
                                    </div>
                                </div>

                                <!-- Content Container -->
                                <div
                                    class="md:w-1/2 flex flex-col justify-center"
                                >
                                    <div class="p-4 md:p-6">
                                        <h3
                                            class="text-2xl md:text-3xl font-bold text-gray-800 mb-2"
                                        >
                                            {{ room.name }}
                                        </h3>

                                        <div class="space-y-3 mb-6">
                                            <div
                                                class="flex items-center text-gray-600"
                                            >
                                                <i
                                                    class="pi pi-users text-amber-600 mr-2"
                                                ></i>
                                                {{ room.occupancy }} Persons
                                            </div>
                                        </div>
                                        <p
                                            class="text-gray-500 text-sm md:text-base mb-4"
                                        >
                                            {{ room.description }}
                                        </p>

                                        <!-- Pricing Table -->
                                        <div class="mb-6">
                                            <div
                                                class="grid grid-cols-3 gap-4 text-center mb-2"
                                            >
                                                <div
                                                    v-for="(
                                                        rate, index
                                                    ) in room.rates"
                                                    :key="index"
                                                    class="font-semibold text-gray-600"
                                                >
                                                    {{ rate.duration }}hrs
                                                </div>
                                            </div>
                                            <div
                                                class="grid grid-cols-3 gap-4 text-center"
                                            >
                                                <div
                                                    v-for="(
                                                        rate, index
                                                    ) in room.rates"
                                                    :key="index"
                                                    class="text-xl font-bold text-red-600"
                                                >
                                                    ₱{{ rate.price }}
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            class="flex flex-col sm:flex-row gap-3"
                                        >
                                            <Button
                                                @click="handleBookNow(room)"
                                                class="p-button-primary bg-gradient-to-r from-red-600 to-orange-500 text-white border-none"
                                            >
                                                <i
                                                    class="pi pi-bookmark mr-2"
                                                ></i>
                                                {{
                                                    isLoggedIn
                                                        ? "Book Now"
                                                        : "Login to Book"
                                                }}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div
                v-if="filteredRooms.length === 0"
                class="text-center py-12 text-gray-500"
            >
                <i class="pi pi-inbox text-4xl mb-4"></i>
                <p class="text-xl">No rooms match your filters</p>
            </div>

            <!-- Back to Top -->
            <button
                v-show="showBackToTop"
                @click="scrollToTop"
                class="fixed bottom-8 right-8 p-3 bg-amber-600 text-white rounded-full shadow-lg hover:bg-amber-700 transition-colors"
            >
                <i class="pi pi-arrow-up"></i>
            </button>
        </div>

        <!-- Booking Dialog -->
        <Dialog
            v-model:visible="showBookingDialog"
            :style="{ width: '500px' }"
            header="Book Room"
        >
            <!-- Add your booking form here -->
        </Dialog>
    </div>
</template>

<style scoped>
/* Custom styles */
.room-card {
    transition: transform 0.3s ease;
}

.room-card:hover {
    transform: translateY(-5px);
}

.p-multiselect,
.p-dropdown {
    width: 100%;
}
</style>
