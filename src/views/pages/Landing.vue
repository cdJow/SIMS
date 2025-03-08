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

const showBookingDialog = ref(false);
const selectedRoom = ref(null);

// Add this method
const handleBookNow = () => {
    showBookingDialog.value = true;
};

// Add this method to handle room selection
const selectRoom = (room) => {
    selectedRoom.value = room;
    showBookingDialog.value = false;
    router.push("/booking-form"); // Replace with your actual booking route
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

const isLoggedIn = ref(false);

import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const showLoginDialog = ref(false);

const loginForm = ref({
    email: "",
    password: "",
    role: "",
});

const loginErrors = ref({
    email: "",
    password: "",
    role: "",
});

const validateForm = () => {
    loginErrors.value = { email: "", password: "", role: "" };
    let isValid = true;

    if (!loginForm.value.email) {
        loginErrors.value.email = "Email is required";
        isValid = false;
    }

    if (!loginForm.value.password) {
        loginErrors.value.password = "Password is required";
        isValid = false;
    }

    if (!loginForm.value.role) {
        loginErrors.value.role = "Role is required";
        isValid = false;
    }

    return isValid;
};

const handleLogin = async () => {
    if (!validateForm()) return;

    try {
        // Mock authentication - replace with actual API call
        await mockAuthAPI(loginForm.value);

        authStore.login({
            email: loginForm.value.email,
            role: loginForm.value.role,
            token: "mock-token",
        });

        // Redirect based on role
        switch (loginForm.value.role) {
            case "admin":
                router.push("/admin-dashboard");
                break;
            case "manager":
                router.push("/manager-dashboard");
                break;
            case "frontdesk":
                router.push("/frontdesk-dashboard");
                break;
            case "inventory":
                router.push("/inventory-dashboard");
                break;
            case "kitchen":
                router.push("/kitchen-dashboard");
                break;
            default:
                router.push("/");
        }

        showLoginDialog.value = false;
    } catch (error) {
        console.error("Login failed:", error);
    }
};

// Mock authentication API
const mockAuthAPI = (credentials) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const validRoles = [
                "admin",
                "manager",
                "frontdesk",
                "inventory",
                "kitchen",
            ];
            if (validRoles.includes(credentials.role)) {
                resolve({ status: 200, data: { user: credentials } });
            } else {
                reject(new Error("Invalid role selected"));
            }
        }, 1000);
    });
};
// Handle logout
const handleLogout = () => {
    isLoggedIn.value = false;
    toast.add({
        severity: "info",
        summary: "Logged Out",
        detail: "You have been successfully logged out",
        life: 3000,
    });
};
</script>

<template>
    <div class="min-h-screen">
        <!-- Header -->
        <header class="bg-white shadow-sm fixed w-full z-50">
            <div
                class="container mx-auto px-6 py-4 flex justify-between items-center"
            >
                <div class="text-2xl font-bold text-primary">
                    Woodland<span class="text-red-500">Suites</span>
                </div>
                <nav class="hidden md:flex space-x-8">
                    <a href="#rooms" class="hover:text-accent transition-colors"
                        >Rooms</a
                    >
                    <a
                        href="#amenities"
                        class="hover:text-accent transition-colors"
                        >Amenities</a
                    >
                    <a href="#rates" class="hover:text-accent transition-colors"
                        >Rates</a
                    >
                    <a
                        href="#location"
                        class="hover:text-accent transition-colors"
                        >Location</a
                    >
                </nav>
                <Button
                    v-if="!isLoggedIn"
                    label="Login"
                    class="p-button-text p-button-secondary"
                    @click="showLoginDialog = true"
                />
                <Button
                    v-else
                    label="Logout"
                    class="p-button-text p-button-danger"
                    @click="handleLogout"
                />
            </div>
        </header>

        <!-- Hero Section -->
        <section class="relative h-screen">
            <div class="card h-full mx-auto px-6">
                <div class="grid md:grid-cols-2 h-full gap-12 items-center">
                    <!-- Left Side - Text Content -->
                    <div class="text-white relative z-10">
                        <h1
                            class="text-4xl md:text-6xl font-bold mb-6 leading-tight"
                        >
                            <span class="text-red-500">EXPERIENCE</span> LUXURY
                            REDEFINED
                        </h1>
                        <p
                            class="text-xl mb-8 md:text-2xl md:mb-12 text-gray-500"
                        >
                            Your home away from home
                        </p>
                        <Button
                            label="Book Now"
                            class="p-button-lg p-button-success hover:bg-green-600 transition-all"
                            @click="handleBookNow"
                        />
                    </div>

                    <!-- Right Side - Image -->
                    <div
                        class="relative h-full rounded-lg overflow-hidden shadow-2xl"
                    >
                        <img
                            src="@/assets/images/main.jpg"
                            class="w-full h-full rounded-lg object-cover transform hover:scale-105 transition-transform duration-500"
                            alt="Luxury Suite"
                        />
                        <div
                            class="absolute inset-0 bg-gradient-to-r from-transparent to-black/30"
                        ></div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Rooms & Suites -->
        <section id="rooms" class="py-20">
            <div class="container mx-auto px-6">
                <h2 class="text-3xl font-bold mb-12 text-center">Rooms</h2>
                <Carousel
                    :value="rooms"
                    :numVisible="3"
                    :numScroll="1"
                    :responsiveOptions="responsiveOptions"
                >
                    <template #item="room">
                        <div class="p-4">
                            <Card class="shadow-lg">
                                <template #header>
                                    <img
                                        src="@/assets/images/2.jpg"
                                        class="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                                        alt="Luxury Suite"
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

        <section id="rates" class="py-20">
            <div class="container mx-auto px-6">
                <h2 class="text-3xl font-bold mb-12 text-center">
                    Room Prices
                </h2>
                <div class="grid md:grid-cols-3 gap-8">
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

        <!-- Amenities -->
        <section id="amenities" class="py-20 bg-gray-50">
            <div class="container mx-auto px-6">
                <h2 class="text-3xl font-bold mb-12 text-center">
                    Amenities & Services
                </h2>
                <div class="grid md:grid-cols-3 gap-8">
                    <div
                        v-for="(amenity, index) in amenities"
                        :key="index"
                        class="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                        <i
                            :class="amenity.icon"
                            class="text-4xl text-accent mb-4"
                        ></i>
                        <h3 class="text-xl font-semibold mb-2">
                            {{ amenity.title }}
                        </h3>
                        <p class="text-gray-600">{{ amenity.description }}</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Contact & Location -->
        <section id="location" class="py-20 bg-white">
            <div id="highlights" class="py-6 px-6 lg:px-20 mx-0 my-12 lg:mx-20">
                <div class="text-center">
                    <div
                        class="text-surface-900 dark:text-surface-0 font-normal mb-2 text-4xl"
                    >
                        Our Location
                    </div>
                    <span class="text-muted-color text-2xl"
                        >Find us easily with the interactive map below</span
                    >
                </div>

                <div class="grid grid-cols-12 gap-4 mt-20">
                    <div class="col-span-12 flex justify-center">
                        <div
                            class="w-full h-[500px] lg:w-11/12"
                            style="border-radius: 8px; overflow: hidden"
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
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-gray-600 text-white py-12">
            <div class="container mx-auto px-6 grid md:grid-cols-4 gap-8">
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

    <Dialog
        v-model:visible="showBookingDialog"
        :style="{ width: '90vw', maxWidth: '1200px' }"
        :modal="true"
        :dismissableMask="true"
    >
        <template #header>
            <div class="text-center w-full">
                <h2 class="text-3xl font-bold text-gray-800">
                    Available Rooms
                </h2>
                <p class="text-gray-600 mt-2">
                    Select your preferred accommodation
                </p>
            </div>
        </template>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
                v-for="(room, index) in rooms"
                :key="index"
                class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 border-indigo-500"
            >
                <div class="p-6 h-full flex flex-col">
                    <div class="mb-4 relative overflow-hidden rounded-lg">
                        <img
                            :src="room.image"
                            class="w-full h-48 object-cover transform hover:scale-105 transition-transform duration-500"
                            alt="Room Image"
                        />
                    </div>
                    <h3 class="text-xl font-semibold text-gray-800 mb-2">
                        {{ room.name }}
                    </h3>
                    <p class="text-gray-600 mb-3 flex-grow">
                        {{ room.description }}
                    </p>
                    <div class="text-sm text-gray-500 mb-4">
                        <i class="pi pi-users mr-2"></i>{{ room.occupancy }}
                    </div>

                    <div class="space-y-3 mb-4">
                        <div
                            v-for="(duration, dIndex) in room.durations"
                            :key="dIndex"
                            class="flex justify-between items-center px-4 py-2 bg-gray-50 rounded-md"
                        >
                            <span class="text-gray-600"
                                >{{ duration.hours }} hours</span
                            >
                            <span class="font-semibold text-indigo-600"
                                >₱{{ duration.price }}</span
                            >
                        </div>
                    </div>

                    <Button
                        label="Select Room"
                        class="w-full p-button-success"
                        @click="selectRoom(room)"
                    />
                </div>
            </div>
        </div>
    </Dialog>

    <!-- Add login dialog -->
    <Dialog
        v-model:visible="showLoginDialog"
        :style="{ width: '400px' }"
        :modal="true"
        :dismissableMask="true"
    >
        <template #header>
            <div class="text-center w-full">
                <h2 class="text-2xl font-bold mb-2">Login!</h2>
            </div>
        </template>

        <div class="p-fluid space-y-4">
            <div class="field">
                <InputText
                    id="email"
                    v-model="loginForm.email"
                    type="email"
                    placeholder="Email"
                    :class="{ 'p-invalid': loginErrors.email }"
                    class="w-full"
                />
                <small v-if="loginErrors.email" class="p-error block mt-1">
                    {{ loginErrors.email }}
                </small>
            </div>

            <div class="field">
                <InputText
                    id="password"
                    v-model="loginForm.password"
                    type="password"
                    placeholder="Password"
                    :class="{ 'p-invalid': loginErrors.password }"
                    class="w-full"
                />
                <small v-if="loginErrors.password" class="p-error block mt-1">
                    {{ loginErrors.password }}
                </small>
            </div>
        </div>

        <template #footer>
            <div class="w-full space-y-4">
                <Button
                    label="Login"
                    class="w-full p-button-success"
                    @click="handleLogin"
                />

                <div class="text-center text-sm">
                    <span class="text-muted-color"
                        >Don't have an account?
                    </span>
                    <a
                        href="#"
                        class="text-primary font-semibold hover:underline"
                        @click.prevent="showRegisterDialog = true"
                    >
                        Create Account
                    </a>
                </div>
            </div>
        </template>
    </Dialog>

    <!-- Add toast component -->
    <Toast />
</template>
