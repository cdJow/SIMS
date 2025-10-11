<script setup>
import Avatar from "primevue/avatar";
import Menu from "primevue/menu";
import { useToast } from "primevue/usetoast";
import { computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router"; // Add these imports
import axios from "axios";

// Real-time room rates from database
const roomRates = ref([]);
const loadingRates = ref(false);

// Fetch room rates from API
const fetchRoomRates = async () => {
    try {
        loadingRates.value = true;
        const response = await axios.get('http://127.0.0.1:5000/api/landing/room-rates');
        
        console.log('Room Rates API Response:', response.data);
        
        if (response.data && response.data.room_rates) {
            roomRates.value = response.data.room_rates;
        }
    } catch (error) {
        console.error('Error fetching room rates:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load room rates',
            life: 3000
        });
        
        // Fallback to default data
        roomRates.value = [
            {
                type: "Standard Room",
                category: "Standard",
                occupancy: "2 persons",
                durations: [
                    { hours: 6, price: 200 },
                    { hours: 12, price: 400 },
                    { hours: 24, price: 800 }
                ]
            }
        ];
    } finally {
        loadingRates.value = false;
    }
};



// Add mobile menu state
const showMobileMenu = ref(false);
const showProfileMenu = ref(false);
const profileMenu = ref();
// Check actual authentication status
const isLoggedIn = ref(false);

// Check if user is authenticated
const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    isLoggedIn.value = !!(token && userData);
    return isLoggedIn.value;
};

const toggleMobileMenu = () => {
    showMobileMenu.value = !showMobileMenu.value;
};

const toggleProfileMenu = (event) => {
    // Only show profile menu on mobile
    if (window.innerWidth < 768) {
        profileMenu.value.toggle(event);
    }
};

const menuItems = computed(() => {
    if (isLoggedIn.value) {
        return [
            {
                label: "Profile",
                icon: "pi pi-user",
                command: () => router.push("/profile"),
            },
            { label: "Logout", icon: "pi pi-sign-out", command: handleLogout },
        ];
    }
    return [
        {
            label: "Login",
            icon: "pi pi-sign-in",
            command: () => router.push("/login"),
        },
    ];
});

const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    isLoggedIn.value = false;
    router.push("/");
};



const responsiveOptions = ref([
    {
        breakpoint: "1200px", // Large screens (>=1200px)
        numVisible: 4,
        numScroll: 4,
    },
    {
        breakpoint: "1024px", // Medium screens (>=1024px)
        numVisible: 4,
        numScroll: 4,
    },
    {
        breakpoint: "768px", // Small screens (>=768px)
        numVisible: 2,
        numScroll: 2,
    },
    {
        breakpoint: "560px", // Extra small screens (>=560px)
        numVisible: 2,
        numScroll: 2,
    },
]);


const showBookingDialog = ref(false);

// Add this method
// Handle Book Now button click - redirect based on auth status
const handleBookNow = () => {
    if (checkAuthStatus()) {
        // User is logged in, redirect to BookedRooms
        router.push('/pages/website/BookedRooms');
    } else {
        // User is not logged in, redirect to login
        router.push('/pages/auth/login');
    }
};

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

const showAll = ref(false);

// Real-time room data from database
const rooms = ref([]);
const loading = ref(false);

// Fetch rooms from API
const fetchRooms = async () => {
    try {
        loading.value = true;
        const response = await axios.get('http://127.0.0.1:5000/api/landing/rooms');
        
        console.log('API Response:', response.data);
        
        if (response.data && response.data.rooms) {
            console.log('Transforming rooms data:', response.data.rooms);
            // Transform API data to match UI expectations  
            rooms.value = response.data.rooms.map(room => {
                console.log('Processing room:', room);
                
                return {
                    id: room.id,
                    room_number: room.room_number,
                    name: room.name || `Room ${room.room_number}`,
                    description: room.description || `Experience comfort in our accommodations.`,
                    bedType: room.bedType || 'Standard Room',
                    occupancy: room.occupancy || 2,
                    status: room.status || 'available',
                    image_url: room.image_url ? `http://127.0.0.1:5000${room.image_url}` : null,
                    rates: room.rates || [
                        { duration: 6, price: 200, hours: 6 },
                        { duration: 12, price: 400, hours: 12 },
                        { duration: 24, price: 800, hours: 24 }
                    ]
                };
            });
        }
    } catch (error) {
        console.error('Error fetching rooms:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load room data',
            life: 3000
        });
        
        // Fallback to static data
        rooms.value = [
            {
                name: "Standard Room - Available",
                description: "Perfect for guests seeking comfort and value.",
                bedType: "Double Bed",
                occupancy: 2,
                rates: [
                    { duration: 6, price: 200, hours: 6 },
                    { duration: 12, price: 400, hours: 12 },
                    { duration: 24, price: 800, hours: 24 },
                ]
            }
        ];
    } finally {
        loading.value = false;
    }
};

const visibleRooms = computed(() => {
    return showAll.value ? rooms.value : rooms.value.slice(0, 4);
});

const toggleShowAll = () => {
    showAll.value = !showAll.value;
    if (showAll.value) {
        nextTick(() => {
            document
                .getElementById("rooms")
                .scrollIntoView({ behavior: "smooth" });
        });
    }
};

// Fetch rooms and rates when component mounts
onMounted(() => {
    checkAuthStatus(); // Check authentication status
    fetchRooms();
    fetchRoomRates();
});
</script>

<template>
    <div>
        <!-- Enhanced Header with Mobile Menu -->
        <nav
            class="bg-gradient-to-r from-red-600 to-orange-500 shadow-sm w-full sticky top-0 z-50"
        >
            <div
                class="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center"
            >
                <!-- Logo -->
                <div class="text-2xl text-white font-bold text-primary">
                    Woodland<span class="text-white">Suites</span>
                </div>

                <!-- Desktop Navigation -->
                <div class="hidden md:flex space-x-8 items-center">
                    <a
                        href="#rooms"
                        class="hover:text-accent text-white transition-colors p-2"
                        >Rooms</a
                    >
                    <a
                        href="#rates"
                        class="hover:text-accent text-white transition-colors p-2"
                        >Rates</a
                    >
                    <a
                        href="#location"
                        class="hover:text-accent text-white transition-colors p-2"
                        >Location</a
                    >

                    <!-- Desktop Auth Buttons -->
                    <div class="hidden md:flex items-center space-x-4">
                        <a
                            v-if="!isLoggedIn"
                             class="hover:text-accent text-white transition-colors p-2"
                            @click="router.push('/pages/auth/login')"
                             >Login</a
                        />
                        
                        <Button
                            v-else
                            label="Logout"
                            class="p-button-text p-button-danger"
                            @click="handleLogout"
                        />
                    </div>

                    
                </div>

                <!-- Mobile Controls -->
                <div class="flex items-center space-x-4 md:hidden">
                    <!-- Profile Icon with Mobile Dropdown -->
                    <Avatar
                        icon="pi pi-user"
                        class="cursor-pointer bg-primary hover:bg-primary-dark transition-colors"
                        size="large"
                        shape="circle"
                        @click="toggleProfileMenu"
                    />

                    <!-- Mobile Menu Toggle -->
                    <Button
                        icon="pi pi-bars"
                        class="p-button-text p-button-secondary"
                        @click="toggleMobileMenu"
                    />

                    <!-- Mobile Profile Dropdown (Only shows on mobile) -->
                    <Menu
                        ref="profileMenu"
                        :model="menuItems"
                        :popup="true"
                        class="w-48 md:hidden"
                        v-model:visible="showProfileMenu"
                    />
                </div>
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

                    <!-- Mobile Auth Options -->
                    <div class="pt-4 border-t">
                        <template v-if="isLoggedIn">
                            <a
                                href="#profile"
                                class="block hover:text-accent p-2"
                                @click="router.push('/profile')"
                            >
                                Profile
                            </a>
                            <Button
                                label="Logout"
                                class="w-full p-button-outlined p-button-danger mt-2"
                                @click="handleLogout"
                            />
                        </template>
                        <template v-else>
                            <Button
                                label="Login"
                                class="w-full p-button-outlined p-button-secondary"
                                @click="router.push('/pages/auth/login')"
                            />
                        </template>
                    </div>
                </div>
            </div>
        </nav>
        <!-- Hero Section -->
        <section
            class="relative min-h-screen flex items-center overflow-hidden"
        >
            <div class="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div class="grid lg:grid-cols-2 gap-12 items-center">
                    <!-- Text Content -->
                    <div class="text-center lg:text-left space-y-8 relative">
                        <h1
                            class="text-5xl sm:text-5xl md:text-5xl lg:text-6xl font-bold mb-6"
                        >
                            <span
                                class="bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent"
                            >
                                WOODLAND
                            </span>
                            <span
                                class="bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent"
                            >
                                SUITES
                            </span>
                        </h1>

                        <p
                            class="text-xl md:text-2xl text-orange-600 font-light max-w-lg mx-auto lg:mx-0"
                        >
                            Experience contemporary elegance in our urban
                            sanctuary
                        </p>

                        <!-- Action Buttons -->
                        <div
                            class="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start mt-10"
                        >
                            <Button
                                label="Book Your Stay"
                                class="p-button-lg bg-amber-500 hover:bg-amber-600 border-0 text-white px-10 py-5 shadow-lg"
                                icon="pi pi-calendar"
                                iconPos="right"
                                @click="handleBookNow"
                            />
                        </div>
                    </div>

                    <!-- Image and Feature Card -->
                    <div class="relative group">
                        <div
                            class="relative rounded-lg lg:rounded-2xl overflow-hidden shadow-lg lg:shadow-2xl transform group-hover:scale-[1.02] transition-all"
                        >
                            <img
                                src="@/assets/images/main.jpg"
                                class="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] object-cover"
                                alt="Luxury Suite Interior"
                            />
                            <!-- Image Overlay -->
                            <div
                                class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
                            ></div>

                            <!-- Feature Card -->
                            <div
                                class="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm p-4 md:p-6 lg:p-8"
                            >
                                <h3
                                    class="text-lg sm:text-xl lg:text-2xl font-semibold text-amber-400 mb-2 sm:mb-3 lg:mb-4"
                                >
                                    Signature Features
                                </h3>
                                <div
                                    class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4"
                                >
                                    <div
                                        class="flex items-center space-x-1 sm:space-x-2"
                                    >
                                        <i
                                            class="pi pi-check-circle text-amber-400 text-sm sm:text-base"
                                        ></i>
                                        <span
                                            class="text-white text-sm sm:text-base"
                                            >Smart Room Control</span
                                        >
                                    </div>
                                    <div
                                        class="flex items-center space-x-1 sm:space-x-2"
                                    >
                                        <i
                                            class="pi pi-check-circle text-amber-400 text-sm sm:text-base"
                                        ></i>
                                        <span
                                            class="text-white text-sm sm:text-base"
                                            >24/7 Concierge</span
                                        >
                                    </div>
                                    <div
                                        class="flex items-center space-x-1 sm:space-x-2"
                                    >
                                        <i
                                            class="pi pi-check-circle text-amber-400 text-sm sm:text-base"
                                        ></i>
                                        <span
                                            class="text-white text-sm sm:text-base"
                                            >Premium Bath Amenities</span
                                        >
                                    </div>
                                    <div
                                        class="flex items-center space-x-1 sm:space-x-2"
                                    >
                                        <i
                                            class="pi pi-check-circle text-amber-400 text-sm sm:text-base"
                                        ></i>
                                        <span
                                            class="text-white text-sm sm:text-base"
                                            >Private Balcony</span
                                        >
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Scrolling Indicator -->
            <div
                class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce"
            >
                <i class="pi pi-chevron-down text-amber-400 text-3xl"></i>
            </div>

            <!-- Background Elements -->
            <div class="absolute inset-0 z-0">
                <div
                    class="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-black/30 to-transparent"
                ></div>
            </div>
        </section>

        <!-- Rooms Section -->
        <section id="rooms" class="py-12 px-4 sm:px-6 lg:px-8">
            <div class="mx-auto max-w-9xl">
                <h2 class="text-3xl md:text-4xl font-bold mb-10 text-center">
                    Our Accommodations
                    <span v-if="loading" class="text-sm text-gray-500 ml-2">
                        <i class="pi pi-spin pi-spinner"></i>
                        Loading...
                    </span>
                </h2>

                <div class="p-6 md:p-8" v-if="!loading && rooms.length > 0">
                    <Carousel
                        :value="rooms"
                        :numVisible="2"
                        :numScroll="2"
                        :responsiveOptions="[
                            { breakpoint: '1200px', numVisible: 2, numScroll: 1 },
                            { breakpoint: '768px', numVisible: 1, numScroll: 1 },
                            { breakpoint: '560px', numVisible: 1, numScroll: 1 }
                        ]"
                        circular
                        :autoplayInterval="4000"
                    >
                        <template #item="slotProps">
                            <div
                                class="rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 m-2"
                            >
                                <!-- Room Content -->
                                <div
                                    class="flex flex-col md:flex-row gap-6 md:gap-8 p-4"
                                >
                                    <!-- Image Container -->
                                    <div class="w-full">
                                        <div
                                            class="relative rounded-xl overflow-hidden shadow-lg h-48 sm:h-64 md:h-80"
                                        >
                                            <img
                                                :src="slotProps.data.image_url || '@/assets/images/2.jpg'"
                                                class="w-full h-full object-cover transform hover:scale-105 transition-all duration-300"
                                                :alt="`${slotProps.data.name} Image`"
                                                @error="$event.target.src = '@/assets/images/2.jpg'"
                                            />
                                            <div
                                                class="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent"
                                            ></div>
                                            
                                            <!-- Status Badge -->
                                            <div 
                                                v-if="slotProps.data.status"
                                                class="absolute top-2 right-2 sm:top-4 sm:right-4 px-2 py-1 sm:px-3 rounded-full text-xs font-bold shadow-lg"
                                                :class="{
                                                    'bg-green-500 text-white': slotProps.data.status.toLowerCase() === 'available',
                                                    'bg-red-500 text-white': slotProps.data.status.toLowerCase() === 'occupied',
                                                    'bg-yellow-500 text-black': slotProps.data.status.toLowerCase() === 'maintenance',
                                                    'bg-blue-500 text-white': slotProps.data.status.toLowerCase() === 'reserved'
                                                }"
                                            >
                                                {{ slotProps.data.status.toUpperCase() }}
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Content Container -->
                                    <div
                                        class="w-full flex flex-col justify-center"
                                    >
                                        <div class="p-2 sm:p-4 md:p-6">
                                            <!-- ... Keep existing content structure ... -->
                                            <h3
                                                class="text-2xl md:text-3l font-bold text-gray-800 mb-2"
                                            >
                                                {{ slotProps.data.name }}
                                            </h3>
                                            <p
                                                class="text-gray-500 text-sm md:text-base mb-4"
                                            >
                                                {{ slotProps.data.description }}
                                            </p>

                                            <!-- Pricing Table -->
                                            <div class="mb-6">
                                                <div
                                                    class="grid grid-cols-3 gap-4 text-center mb-2"
                                                >
                                                    <div
                                                        v-for="(
                                                            rate, index
                                                        ) in slotProps.data
                                                            .rates"
                                                        :key="index"
                                                        class="font-semibold text-gray-600"
                                                    >
                                                        {{ rate.hours }}hrs
                                                    </div>
                                                </div>
                                                <div
                                                    class="grid grid-cols-3 gap-4 text-center"
                                                >
                                                    <div
                                                        v-for="(
                                                            rate, index
                                                        ) in slotProps.data
                                                            .rates"
                                                        :key="index"
                                                        class="text-xl font-bold text-red-600"
                                                    >
                                                        ₱{{ rate.price }}
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="space-y-3 mb-6">
                                                <div
                                                    class="flex items-center text-gray-600"
                                                >
                                                    <i
                                                        class="pi pi-bed text-amber-600 mr-2"
                                                    ></i>
                                                    {{ slotProps.data.bedType }}
                                                </div>
                                                <div
                                                    class="flex items-center text-gray-600"
                                                >
                                                    <i
                                                        class="pi pi-users text-amber-600 mr-2"
                                                    ></i>
                                                    {{
                                                        slotProps.data.occupancy
                                                    }}
                                                    Persons
                                                </div>
                                            </div>

                                            <div
                                                class="flex flex-col sm:flex-row gap-3"
                                            >
                                                <Button
                                                    class="p-button-primary bg-gradient-to-r from-red-600 to-orange-500 text-white border-none"
                                                    @click="handleBookNow"
                                                >
                                                    <i
                                                        class="pi pi-bookmark mr-2"
                                                    ></i>
                                                    Book Now
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Carousel>
                </div>

                <!-- Loading State -->
                <div v-else-if="loading" class="text-center py-12">
                    <div class="inline-flex items-center space-x-2 text-gray-500">
                        <i class="pi pi-spin pi-spinner text-2xl"></i>
                        <span class="text-lg">Loading accommodations...</span>
                    </div>
                </div>

                <!-- No Rooms Available -->
                <div v-else class="text-center py-12">
                    <div class="text-gray-500">
                        <i class="pi pi-exclamation-triangle text-4xl mb-4"></i>
                        <h3 class="text-xl font-semibold mb-2">No rooms available</h3>
                        <p>Please check back later or contact us directly.</p>
                        <Button 
                            label="Refresh" 
                            icon="pi pi-refresh" 
                            class="mt-4"
                            @click="fetchRooms"
                        />
                    </div>
                </div>

                <!-- See More Button -->
            
            </div>
        </section>

        <!-- Rates Section -->
        <section
            id="rates"
            class="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white px-4 sm:px-6"
        >
            <div class="container mx-auto max-w-7xl">
                <div class="text-center mb-12 md:mb-16">
                    <h2
                        class="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
                    >
                        <span
                            class="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent"
                        >
                            Room Rates
                        </span>
                    </h2>
                    <p
                        class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto"
                    >
                        Flexible options for every need, featuring premium
                        amenities and exceptional comfort
                    </p>
                    <span v-if="loadingRates" class="text-sm text-gray-500 ml-2">
                        <i class="pi pi-spin pi-spinner"></i>
                        Loading rates...
                    </span>
                </div>

                <!-- Loading State -->
                <div v-if="loadingRates" class="text-center py-12">
                    <div class="inline-flex items-center space-x-2 text-gray-500">
                        <i class="pi pi-spin pi-spinner text-2xl"></i>
                        <span class="text-lg">Loading room rates...</span>
                    </div>
                </div>

                <!-- Carousel for Room Rates -->
                <div v-else-if="!loadingRates && roomRates.length > 0" class="p-2 sm:p-6 md:p-8">
                    <Carousel
                        :value="roomRates"
                        :numVisible="3"
                        :numScroll="1"
                        :responsiveOptions="[
                            { breakpoint: '1200px', numVisible: 3, numScroll: 1 },
                            { breakpoint: '1024px', numVisible: 2, numScroll: 1 },
                            { breakpoint: '768px', numVisible: 1, numScroll: 1 },
                            { breakpoint: '560px', numVisible: 1, numScroll: 1 }
                        ]"
                        circular
                        :autoplayInterval="5000"
                    >
                        <template #item="slotProps">
                            <div class="m-2">
                                <div class="group relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border-b-4 border-red-500 overflow-hidden">
                                    <div
                                        class="absolute inset-0 bg-gradient-to-b from-red-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                                    ></div>

                                    <div class="p-8">
                                        <!-- Header -->
                                        <div class="flex items-start mb-6">
                                            <div
                                                class="bg-red-500 p-3 rounded-lg shadow-md"
                                            >
                                                <i
                                                    class="pi pi-star text-xl text-white"
                                                ></i>
                                            </div>
                                            <div class="ml-4">
                                                <h3
                                                    class="text-2xl font-bold text-gray-900"
                                                >
                                                    {{ slotProps.data.type }}
                                                </h3>
                                                <p class="text-gray-500 mt-1 text-sm">
                                                    {{ slotProps.data.occupancy }}
                                                </p>
                                            
                                            </div>
                                        </div>

                                        <!-- Features -->
                                        <ul class="space-y-4 mb-8">
                                            <li
                                                v-for="(duration, dIndex) in slotProps.data.durations"
                                                :key="dIndex"
                                                class="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-white transition-colors"
                                            >
                                                <div class="flex items-center">
                                                    <i
                                                        class="pi pi-clock text-red-500 mr-3"
                                                    ></i>
                                                    <span class="text-gray-700"
                                                        >{{ duration.hours }} Hours</span
                                                    >
                                                </div>
                                                <span
                                                    class="text-lg font-bold text-red-600"
                                                >
                                                    ₱{{ duration.price }}
                                                </span>
                                            </li>
                                        </ul>
                                    </div>

                                    <!-- Hover Ribbon -->
                                    <div
                                        class="absolute top-4 right-[-45px] group-hover:right-0 bg-red-500 text-white px-6 py-1 transform rotate-45 transition-all duration-300"
                                    >
                                        <span class="text-xs font-bold">POPULAR</span>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Carousel>
                </div>

                <!-- No Rates Available -->
                <div v-else class="text-center py-12">
                    <div class="text-gray-500">
                        <i class="pi pi-exclamation-triangle text-4xl mb-4"></i>
                        <h3 class="text-xl font-semibold mb-2">No rates available</h3>
                        <p>Please check back later or contact us directly.</p>
                        <Button 
                            label="Refresh Rates" 
                            icon="pi pi-refresh" 
                            class="mt-4"
                            @click="fetchRoomRates"
                        />
                    </div>
                </div>
            </div>
        </section>

        <!-- Location Section -->
        <section
            id="location"
            class="relative py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white px-4 sm:px-6"
        >
            <div class="container mx-auto max-w-8xl">
                <div class="text-center mb-12 md:mb-16">
                    <h2
                        class="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
                    >
                        <span
                            class="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent"
                        >
                            Find Us
                        </span>
                    </h2>
                    <p
                        class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto"
                    >
                        Nestled in the heart of the city, experience luxury
                        convenience
                    </p>
                </div>

                <div class="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <!-- Map Container -->
                    <div
                        class="relative group h-full rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300"
                    >
                        <div class="aspect-video w-full h-full">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d698.042618689094!2d124.24055174107627!3d8.23034940442809!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3255758d3ab4ab77%3A0xf498dd27637f6b05!2sWoodland%20Suites!5e0!3m2!1sen!2sph!4v1734363968355!5m2!1sen!2sph"
                                class="w-full h-full filter grayscale group-hover:grayscale-0 transition-all duration-500"
                                style="border: 0"
                                loading="lazy"
                                referrerpolicy="no-referrer-when-downgrade"
                                title="Woodland Suites Location Map"
                            ></iframe>
                        </div>
                        <div
                            class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"
                        ></div>
                    </div>

                    <!-- Contact Info -->
                    <div class="space-y-8 lg:space-y-10">
                        <div
                            class="flex items-start bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
                        >
                            <div class="bg-red-500 p-3 rounded-lg mr-4">
                                <i
                                    class="pi pi-map-marker text-2xl text-white"
                                ></i>
                            </div>
                            <div>
                                <h3
                                    class="text-xl font-bold text-gray-900 mb-2"
                                >
                                    Address
                                </h3>
                                <p class="text-gray-600 leading-relaxed">
                                    Roxas Ave<br />
                                    Iligan City, Lanao del Norte<br />
                                    Philippines
                                </p>
                            </div>
                        </div>

                        <div
                            class="flex items-start bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
                        >
                            <div class="bg-red-500 p-3 rounded-lg mr-4">
                                <i class="pi pi-phone text-2xl text-white"></i>
                            </div>
                            <div>
                                <h3
                                    class="text-xl font-bold text-gray-900 mb-2"
                                >
                                    Contact
                                </h3>
                                <p class="text-gray-600">
                                    <a
                                        href="tel:+631234567890"
                                        class="hover:text-red-500 transition-colors"
                                    >
                                       0956 680 1497</a
                                    ><br />
                                    <a
                                        href="mailto:info@woodlandsuites.com"
                                        class="hover:text-red-500 transition-colors"
                                    >
                                        info@woodlandsuites.com
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Decorative Elements -->
                <div
                    class="absolute top-0 left-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -z-10"
                ></div>
                <div
                    class="absolute bottom-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl -z-10"
                ></div>
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
                    <h3 class="font-semibold mb-4 text-white">Contact</h3>
                    <p class="text-gray-300">
                         Roxas Ave <br />Iligan City<br /> Lanao del Norte <br/>Phone: (555)
                        123-4567<br />Email: woodlandsuite@gmail.com
                    </p>
                </div>
                <div>
                    <h3 class="font-semibold mb-4 text-white">Follow Us</h3>
                    <div class="flex space-x-4">
                        <a href="https://www.facebook.com/profile.php?id=61562524193132" class="hover:text-accent transition-colors"
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

@keyframes zoom-in-out {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
    100% {
        transform: scale(1);
    }
}

@keyframes slide-up {
    from {
        transform: translateY(20px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.animate-zoom-in-out {
    animation: zoom-in-out 20s infinite;
}
.animate-slide-up {
    animation: slide-up 1s ease-out;
}
.animate-fade-in {
    animation: fade-in 1.5s ease-out;
}

.custom-carousel .p-carousel-indicators {
    padding: 1rem 0;
}

.custom-carousel .p-carousel-indicator button {
    background-color: #e5e7eb;
    transition: all 0.3s;
}

.custom-carousel .p-carousel-indicator.p-highlight button {
    background-color: #ef4444;
    width: 2rem;
}

@keyframes gradient-shift {
    0% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
    100% {
        background-position: 0% 50%;
    }
}

@keyframes gradient-shift {
    0% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
    100% {
        background-position: 0% 50%;
    }
}

.staggered-fade-enter-active,
.staggered-fade-leave-active {
    transition: all 0.3s ease;
}
.staggered-fade-enter-from,
.staggered-fade-leave-to {
    opacity: 0;
    transform: translateY(20px);
}
</style>
