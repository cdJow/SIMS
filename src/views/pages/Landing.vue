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

// Google Reviews data
const reviews = ref([]);
const loadingReviews = ref(false);
const reviewStats = ref({
    averageRating: 4.1,
    totalReviews: 61
});

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

// Load static reviews data
const loadStaticReviews = () => {
    loadingReviews.value = true;
    
    // Static reviews data - Only 3 reviews as requested
    reviews.value = [
        {
            author_name: 'Riezl Joy Gutierrez',
            rating: 5,
            text: 'A good place to stay after a long city ride right in the corner of the city proper where you can easily access other establishments around the perimeter and other local prides. Cozy space and accommodating staff. Highly recommended!',
            time: '2 years ago'
        },
        {
            author_name: 'Gerard June Fuentes',
            rating: 5,
            text: 'This is where we stayed overnight during Hazels cash for work with PWDs in Iligan City. The accomodations is fairly clean and it looks modern inside the rooms. I can only say the wifi is bad and the smart tv did not work because there is no cable and it only works with internet servers.',
            time: '2 years ago'
        },
        {
            author_name: 'Quirk Enoch Quilinguen',
            rating: 4,
            text: 'We stayed at New Woodland Suites and really liked the Queen Size bed room, especially the view of the road and Gaisano Mall. The room was clean, and the location is convenient. My girlfriend and I felt very comfortable during our stay. However, the TV didn’t work, and the internet was very slow, which is a big downside for those with online jobs or businesses.',
            time: '8 months ago '
        },
        {
            author_name: 'Biplab Roy',
            rating: 4,
            text: 'Hotel was good Staff co-operative Location is nice - middle of the city, accessible in terms of basic amenities - literally near the city proper. Charges can be made more flexible - especially if you are staying on monthly basis, paying 18k is  too costly. New monthly pricing plans should be rolled out. Comparatively, other than pricing, all were good. Hoping they read this and roll out the new pricing options for long stays Also, they should roll out online reservation model such as website or Facebook page (active).',
            time: 'a year ago'
        },
        {
            author_name: 'Sai Abbu',
            rating: 5,
            text: 'Cheapest in town very good rooms',
            time: 'Edited 7 months ago'
        }
    ];
    
    // Use actual Google Maps data
    reviewStats.value = {
        averageRating: 4.1, // Matches Google Maps embedded data
        totalReviews: 61 // Matches Google Maps embedded data
    };
    
    loadingReviews.value = false;
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

// Open Google Reviews page in new tab
const openGoogleReviews = () => {
    // Opens the actual Woodland Suites Google Maps reviews page
    window.open('https://www.google.com/maps/place/Woodland+Suites/@8.2304465,124.2380444,17z/data=!4m8!3m7!1s0x3255758d3ab4ab77:0xf498dd27637f6b05!8m2!3d8.2304465!4d124.2406193!9m1!1b1!16s%2Fg%2F11h4kh6qdb?entry=ttu&g_ep=EgoyMDI1MTAwOC4wIKXMDSoASAFQAw%3D%3D', '_blank');
};

// Fetch rooms and rates when component mounts
onMounted(() => {
    checkAuthStatus(); // Check authentication status
    fetchRooms();
    fetchRoomRates();
    loadStaticReviews();
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
                        href="#reviews"
                        class="hover:text-accent text-white transition-colors p-2"
                        >Reviews</a
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
                    <a href="#rates" class="block hover:text-accent">Rates</a>
                    <a href="#reviews" class="block hover:text-accent">Reviews</a>
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
                                <div class="group relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border-b-4 border-red-500 overflow-hidden transform hover:-translate-y-2">
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
                                                    class="pi pi-bed text-xl text-white"
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
                                                class="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-red-50 rounded-lg hover:from-white hover:to-red-100 transition-all duration-300 border border-gray-200"
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

        <!-- Google Reviews Section -->
        <section 
            id="reviews" 
            class="py-16 md:py-24 bg-white px-4 sm:px-6"
        >
            <div class="container mx-auto max-w-7xl">
                <div class="text-center mb-12 md:mb-16">
                    <h2 
                        class="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
                    >
                        <span 
                            class="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent"
                        >
                            Guest Reviews
                        </span>
                    </h2>
                    <p 
                        class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-6"
                    >
                        See what our guests are saying about their experience
                    </p>
                    
                    <!-- Rating Summary -->
                    <div class="flex items-center justify-center gap-6 mb-8">
                        <div class="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                            <div class="flex items-center justify-center mb-3">
                                <div class="bg-gradient-to-br from-red-500 to-orange-500 rounded-full p-3 mr-4">
                                    <i class="pi pi-google text-white text-2xl"></i>
                                </div>
                                <div>
                                    <div class="flex items-center mb-1">
                                        <span class="text-4xl font-bold text-gray-900">
                                            {{ reviewStats.averageRating }}
                                        </span>
                                        <div class="ml-3">
                                            <div class="flex items-center">
                                                <i 
                                                    v-for="star in 5" 
                                                    :key="star"
                                                    class="text-yellow-400 text-lg"
                                                    :class="{
                                                        'pi pi-star-fill': star <= Math.floor(reviewStats.averageRating),
                                                        'pi pi-star': star > Math.floor(reviewStats.averageRating)
                                                    }"
                                                ></i>
                                            </div>
                                        </div>
                                    </div>
                                    <p class="text-gray-600 text-sm">
                                        Based on Google reviews
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <span v-if="loadingReviews" class="text-sm text-gray-500 ml-2">
                        <i class="pi pi-spin pi-spinner"></i>
                        Loading reviews...
                    </span>
                </div>

                <!-- Loading State -->
                <div v-if="loadingReviews" class="text-center py-12">
                    <div class="inline-flex items-center space-x-2 text-gray-500">
                        <i class="pi pi-spin pi-spinner text-2xl"></i>
                        <span class="text-lg">Loading guest reviews...</span>
                    </div>
                </div>

                <!-- Reviews Carousel -->
                <div v-else-if="!loadingReviews && reviews.length > 0" class="p-2 sm:p-6 md:p-8">
                    <Carousel
                        :value="reviews"
                        :numVisible="3"
                        :numScroll="1"
                        :responsiveOptions="[
                            { breakpoint: '1200px', numVisible: 3, numScroll: 1 },
                            { breakpoint: '1024px', numVisible: 2, numScroll: 1 },
                            { breakpoint: '768px', numVisible: 1, numScroll: 1 },
                            { breakpoint: '560px', numVisible: 1, numScroll: 1 }
                        ]"
                        circular
                        :autoplayInterval="6000"
                    >
                        <template #item="slotProps">
                            <div class="m-2">
                                <div class="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 p-6 h-full">
                                    <!-- Review Header -->
                                    <div class="flex items-center mb-4">
                                        <div 
                                            v-if="slotProps.data.author_photo" 
                                            class="w-12 h-12 rounded-full overflow-hidden mr-4"
                                        >
                                            <img 
                                                :src="slotProps.data.author_photo" 
                                                :alt="slotProps.data.author_name"
                                                class="w-full h-full object-cover"
                                                @error="$event.target.style.display='none'"
                                            />
                                        </div>
                                        <div 
                                            v-else 
                                            class="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center mr-4"
                                        >
                                            <i class="pi pi-user text-white text-lg"></i>
                                        </div>
                                        
                                        <div class="flex-1">
                                            <h4 class="font-semibold text-gray-900">
                                                {{ slotProps.data.author_name }}
                                            </h4>
                                            <div class="flex items-center mt-1">
                                                <div class="flex items-center mr-2">
                                                    <i 
                                                        v-for="star in 5" 
                                                        :key="star"
                                                        class="text-yellow-400 text-sm"
                                                        :class="{
                                                            'pi pi-star-fill': star <= slotProps.data.rating,
                                                            'pi pi-star': star > slotProps.data.rating
                                                        }"
                                                    ></i>
                                                </div>
                                                <span class="text-gray-500 text-sm">
                                                    {{ slotProps.data.time }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Review Text -->
                                    <p class="text-gray-700 leading-relaxed mb-4">
                                        "{{ slotProps.data.text }}"
                                    </p>
                                    
                                    <!-- Google Badge -->
                                    <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                        <div class="flex items-center text-gray-500 text-sm">
                                            <i class="pi pi-google text-red-500 mr-2"></i>
                                            <span>Google Review</span>
                                        </div>
                                        <div class="flex items-center">
                                            <span class="text-red-600 font-semibold">
                                                {{ slotProps.data.rating }}/5
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Carousel>
                </div>

                <!-- No Reviews Available -->
                <div v-else class="text-center py-12">
                    <div class="text-gray-500">
                        <i class="pi pi-star text-4xl mb-4"></i>
                        <h3 class="text-xl font-semibold mb-2">No reviews available</h3>
                        <p>Be the first to leave a review for Woodland Suites!</p>
                        <Button 
                            label="Leave a Review" 
                            icon="pi pi-external-link" 
                            class="mt-4 p-button-outlined"
                            @click="openGoogleReviews"
                        />
                    </div>
                </div>

                <!-- Call to Action -->
                <div class="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-8 text-center mt-12">
                    <div class="max-w-2xl mx-auto">
                        <div class="flex items-center justify-center mb-4">
                            <i class="pi pi-google text-red-500 text-3xl mr-3"></i>
                            <h3 class="text-2xl font-semibold text-gray-900">
                                Share Your Experience
                            </h3>
                        </div>
                        <p class="text-gray-600 mb-6 leading-relaxed">
                            Your feedback helps us improve and assists other travelers in making their choice. 
                            Share your stay experience on Google Maps.
                        </p>
                        <div class="flex flex-col sm:flex-row gap-4 items-center justify-center">
                            <Button 
                                label="Write a Google Review"
                                icon="pi pi-external-link"
                                class="bg-red-500 hover:bg-red-600 border-0 text-white px-8 py-3 shadow-lg"
                                @click="openGoogleReviews"
                            />
                            <div class="flex items-center text-gray-600 text-sm">
                                <i class="pi pi-star-fill text-yellow-400 mr-1"></i>
                                <span>Join happy guests</span>
                            </div>
                        </div>
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
                                allowfullscreen
                                loading="lazy"
                                referrerpolicy="no-referrer-when-downgrade"
                                title="Woodland Suites Location Map"
                            ></iframe>
                        </div>
                        
                        <!-- Map Overlay with Reviews Info -->
                        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                        
                        <!-- Reviews Badge Overlay -->
                        <div class="absolute bottom-4 left-4 right-4 pointer-events-auto">
                            <div class="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center">
                                        <div class="flex items-center mr-3">
                                            <i class="pi pi-google text-red-500 text-xl mr-2"></i>
                                            <div>
                                                <div class="flex items-center">
                                                    <span class="font-bold text-lg text-gray-900 mr-2">
                                                        {{ reviewStats.averageRating }}
                                                    </span>
                                                    <div class="flex items-center">
                                                        <i 
                                                            v-for="star in 5" 
                                                            :key="star"
                                                            class="text-yellow-400 text-sm"
                                                            :class="{
                                                                'pi pi-star-fill': star <= Math.floor(reviewStats.averageRating),
                                                                'pi pi-star': star > Math.floor(reviewStats.averageRating)
                                                            }"
                                                        ></i>
                                                    </div>
                                                </div>
                                                <p class="text-gray-600 text-sm">
                                                    {{ reviewStats.totalReviews }} reviews
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <Button 
                                        icon="pi pi-pencil"
                                        label="Review"
                                        class="p-button-sm bg-red-500 hover:bg-red-600 border-0 text-white"
                                        @click="openGoogleReviews"
                                    />
                                </div>
                            </div>
                        </div>
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
                         Roxas Ave <br />Iligan City<br /> Lanao del Norte <br/>Phone: 0956 680 1497
                        <br />Email: woodlandsuite@gmail.com
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

        <!-- Floating Review Button -->
        <div class="fixed bottom-6 right-6 z-50">
            <Button 
                icon="pi pi-star"
                class="p-button-rounded p-button-lg bg-red-500 hover:bg-red-600 border-0 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 animate-float animate-pulse-glow"
                @click="openGoogleReviews"
                v-tooltip.left="'Write a Google Review'"
            />
        </div>
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

@keyframes float {
    0%, 100% {
        transform: translateY(0px);
    }
    50% {
        transform: translateY(-10px);
    }
}

@keyframes pulse-glow {
    0%, 100% {
        box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
    }
    50% {
        box-shadow: 0 0 30px rgba(239, 68, 68, 0.5);
    }
}

.animate-float {
    animation: float 3s ease-in-out infinite;
}

.animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
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

/* Custom scrollbar for better UX */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}

::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #ef4444, #f97316);
    border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #dc2626, #ea580c);
}
</style>
