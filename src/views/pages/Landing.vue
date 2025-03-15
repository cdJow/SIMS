<script setup>
import { useToast } from "primevue/usetoast";
import { ref } from "vue";
import { useRouter } from "vue-router";

const roomRates = ref([
    {
        type: "Single Size Bed",
        durations: [
            { hours: 6, price: 200 },
            { hours: 12, price: 400 },
            { hours: 24, price: 800 },
        ],
    },
    {
        type: "Double Size Bed",
        durations: [
            { hours: 6, price: 200 },
            { hours: 12, price: 400 },
            { hours: 24, price: 800 },
        ],
    },
    {
        type: "Queen Size Bed",
        durations: [
            { hours: 6, price: 200 },
            { hours: 12, price: 400 },
            { hours: 24, price: 800 },
        ],
    },
]);

// If using Pinia store for auth state:
import { useAuthStore } from "@/stores/auth";
const authStore = useAuthStore();
const isLoggedIn = authStore.isAuthenticated; // Update with your actual auth state property

const showBookingDialog = ref(false);

// Add mobile menu state
const showMobileMenu = ref(false);

// Add toggle method
const toggleMobileMenu = () => {
    showMobileMenu.value = !showMobileMenu.value;
};

// Add this method
const handleBookNow = () => {
    showBookingDialog.value = true;
};

const responsiveOptions = ref([
    {
        breakpoint: "1400px",
        numVisible: 2,
        numScroll: 1,
    },
    {
        breakpoint: "768px",
        numVisible: 1,
        numScroll: 1,
    },
]);

const rooms = ref([
    {
        name: "Double Size Bed - Standard",
        description: "Perfect for two guests with additional space.",
        occupancy: "2 person(s)",
    },
    {
        name: "Double Size Bed - Standard",
        description: "Perfect for two guests with additional space.",
        occupancy: "2 person(s)",
    },
    {
        name: "Double Size Bed - Standard",
        description: "Perfect for two guests with additional space.",
        occupancy: "2 person(s)",
    },
    {
        name: "Double Size Bed - Standard",
        description: "Perfect for two guests with additional space.",
        occupancy: "2 person(s)",
    },
    {
        name: "Double Size Bed - Standard",
        description: "Perfect for two guests with additional space.",
        occupancy: "2 person(s)",
    },
]);

const amenities = ref([
    {
        icon: "pi pi-wifi",
        title: "Free Wi-Fi",
        description: "Stay connected with complimentary high-speed internet.",
    },
    {
        icon: "pi pi-car",
        title: "Parking",
        description: "Safe and convenient on-site parking for all guests.",
    },
]);

const toast = useToast();

const router = useRouter();
</script>

<template>
    <div>
        <!-- Enhanced Header with Mobile Menu -->
        <nav class="bg-white shadow-sm fixed w-full z-50">
            <div
                class="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center"
            >
                <div class="text-2xl font-bold text-primary">
                    Woodland<span class="text-red-500">Suites</span>
                </div>

                <!-- Desktop Navigation -->
                <div class="hidden md:flex space-x-8 items-center">
                    <a
                        href="#rooms"
                        class="hover:text-accent transition-colors p-2"
                        >Rooms</a
                    >

                    <a
                        href="#rates"
                        class="hover:text-accent transition-colors p-2"
                        >Rates</a
                    >
                    <a
                        href="#location"
                        class="hover:text-accent transition-colors p-2"
                        >Location</a
                    >

                    <Button
                        v-if="!isLoggedIn"
                        label="Login"
                        class="p-button-text p-button-secondary ml-4"
                        @click="router.push('/pages/auth/login')"
                    />
                    <Button
                        v-else
                        label="Logout"
                        class="p-button-text p-button-danger ml-4"
                        @click="handleLogout"
                    />
                </div>

                <!-- Mobile Menu Toggle -->
                <Button
                    icon="pi pi-bars"
                    class="md:hidden p-button-text p-button-secondary"
                    @click="toggleMobileMenu"
                />
            </div>

            <!-- Mobile Menu Dropdown -->
            <div
                v-if="showMobileMenu"
                class="md:hidden absolute w-full bg-white shadow-lg"
            >
                <div class="px-6 py-4 space-y-4">
                    <a href="#rooms" class="block hover:text-accent">Rooms</a>
                    <a href="#amenities" class="block hover:text-accent"
                        >Amenities</a
                    >
                    <a href="#rates" class="block hover:text-accent">Rates</a>
                    <a href="#location" class="block hover:text-accent"
                        >Location</a
                    >
                    <div class="pt-4 border-t">
                        <Button
                            v-if="!isLoggedIn"
                            label="Login"
                            class="w-full p-button-outlined p-button-secondary"
                            @click="router.push('/pages/auth/login')"
                        />
                        <Button
                            v-else
                            label="Logout"
                            class="w-full p-button-outlined p-button-danger"
                            @click="handleLogout"
                        />
                    </div>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <section class="relative h-screen pt-16">
            <div class="h-full mx-auto px-4 sm:px-6">
                <div class="grid md:grid-cols-2 h-full gap-8 items-center">
                    <!-- Text Content -->
                    <div class="text-center md:text-left z-10 px-4">
                        <h1
                            class="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight"
                        >
                            <span class="text-red-500">EXPERIENCE</span> LUXURY
                            REDEFINED
                        </h1>
                        <p
                            class="text-lg sm:text-xl md:text-2xl mb-6 text-gray-600"
                        >
                            Your home away from home
                        </p>
                        <Button
                            label="Book Now"
                            class="p-button-lg p-button-success hover:bg-green-600 w-full md:w-auto"
                            @click="handleBookNow"
                        />
                    </div>

                    <!-- Image -->
                    <div
                        class="relative h-64 md:h-full rounded-lg overflow-hidden shadow-2xl"
                    >
                        <img
                            src="@/assets/images/main.jpg"
                            class="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                            alt="Luxury Suite"
                        />
                        <div
                            class="absolute inset-0 bg-gradient-to-r from-transparent to-black/30"
                        ></div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Rooms Section -->
        <section id="rooms" class="py-2 md:py-2 px-4 sm:px-2">
            <div class="mx-auto">
                <h2
                    class="text-2xl md:text-3xl font-bold mb-8 md:mb-12 text-center"
                >
                    Rooms
                </h2>
                <Carousel
                    :value="rooms"
                    :numVisible="1"
                    :numScroll="1"
                    :responsiveOptions="responsiveOptions"
                    class="px-2"
                >
                    <template #item="room">
                        <div class="p-2 sm:p-4">
                            <Card class="shadow-lg">
                                <template #header>
                                    <img
                                        src="@/assets/images/2.jpg"
                                        class="w-full h-48 sm:h-64 object-cover"
                                        alt="Room Image"
                                    />
                                </template>
                                <template #title>{{ room.data.name }}</template>
                                <template #content>
                                    <div class="space-y-3">
                                        <p class="text-gray-600">
                                            {{ room.data.description }}
                                        </p>
                                        <div class="text-sm text-gray-500">
                                            Occupancy: {{ room.data.occupancy }}
                                        </div>
                                        <div class="grid grid-cols-3 gap-2">
                                            <div
                                                v-for="(duration, index) in room
                                                    .data.durations"
                                                :key="index"
                                                class="p-4 border shadow-md rounded-md text-center w-full"
                                            >
                                                <span
                                                    class="text-gray-600 block"
                                                >
                                                    {{ duration.hours }}hrs:
                                                </span>
                                                <span
                                                    class="font-semibold text-green-600"
                                                >
                                                    ₱{{ duration.price }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </Card>
                        </div>
                    </template>
                </Carousel>
            </div>
        </section>

        <!-- Rates Section -->
        <section id="rates" class="py-12 md:py-20 bg-white px-4 sm:px-6">
            <div class="container mx-auto">
                <h2
                    class="text-2xl md:text-3xl font-bold mb-8 md:mb-12 text-center"
                >
                    Room Prices
                </h2>
                <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div
                        v-for="(room, index) in roomRates"
                        :key="index"
                        class="p-6 bg-white rounded-lg shadow-md transition-shadow border-l-4 border-indigo-500"
                    >
                        <div class="flex items-center mb-4">
                            <!-- Room type icon -->
                            <svg
                                class="w-8 h-8 text-indigo-500 mr-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <!-- Example bed icon -->
                                <path
                                    d="M2 10a4 4 0 014-4h8a4 4 0 014 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2z"
                                />
                                <path d="M6 12V7a1 1 0 011-1h6a1 1 0 011 1v5" />
                            </svg>
                            <h3 class="text-xl font-semibold text-gray-800">
                                {{ room.type }}
                            </h3>
                        </div>
                        <div class="space-y-3">
                            <div
                                v-for="(duration, dIndex) in room.durations"
                                :key="dIndex"
                                class="flex justify-between items-center"
                            >
                                <div class="flex items-center">
                                    <!-- Duration icon -->
                                    <span class="text-gray-600">
                                        {{ duration.hours }} hours
                                    </span>
                                </div>
                                <span class="font-semibold text-gray-700">
                                    {{ duration.price }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Location Section -->
        <section id="location" class="py-12 md:py-20 bg-white px-4 sm:px-6">
            <div class="mx-auto">
                <h2 class="text-2xl md:text-4xl font-bold mb-8 text-center">
                    Our Location
                </h2>
                <div
                    class="aspect-video w-full h-full rounded-lg overflow-hidden shadow-lg"
                >
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d698.042618689094!2d124.24055174107627!3d8.23034940442809!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3255758d3ab4ab77%3A0xf498dd27637f6b05!2sWoodland%20Suites!5e0!3m2!1sen!2sph!4v1734363968355!5m2!1sen!2sph"
                        width="100%"
                        height="500px"
                        style="border: 0"
                        loading="lazy"
                        referrerpolicy="no-referrer-when-downgrade"
                    ></iframe>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-gray-600 text-white py-12 px-4 sm:px-6">
            <div class="container mx-auto grid gap-8 md:grid-cols-4">
                <div>
                    <div class="text-2xl font-bold mb-4">
                        Woodland Suite Hotel
                    </div>
                    <p class="text-gray-300">
                        Experience luxury redefined in the heart of the city.
                    </p>
                </div>
                <div>
                    <h3 class="font-semibold mb-4 text-white">Quick Links</h3>
                    <ul class="space-y-2">
                        <li>
                            <a
                                href="#rooms"
                                class="hover:text-accent transition-colors"
                                >Rooms</a
                            >
                        </li>
                        <li>
                            <a
                                href="#amenities"
                                class="hover:text-accent transition-colors"
                                >Amenities</a
                            >
                        </li>
                    </ul>
                </div>
                <div>
                    <h3 class="font-semibold mb-4 text-white">Contact</h3>
                    <p class="text-gray-300">
                        Poblacion Iligan <br />Iligan City<br />Phone: (555)
                        123-4567<br />Email: woodlandsuite@gmail.com
                    </p>
                </div>
                <div>
                    <h3 class="font-semibold mb-4 text-white">Follow Us</h3>
                    <div class="flex space-x-4">
                        <a href="#" class="hover:text-accent transition-colors"
                            ><i class="pi pi-facebook"></i
                        ></a>
                        <a href="#" class="hover:text-accent transition-colors"
                            ><i class="pi pi-instagram"></i
                        ></a>
                        <a href="#" class="hover:text-accent transition-colors"
                            ><i class="pi pi-twitter"></i
                        ></a>
                    </div>
                </div>
            </div>
        </footer>
    </div>

    <Toast />
</template>

<style scoped>
/* Mobile-first media queries */
@media (min-width: 640px) {
    .h-hero-mobile {
        height: 50vh;
    }
}

@media (min-width: 768px) {
    .h-hero-desktop {
        height: 75vh;
    }
}
</style>
