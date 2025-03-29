<script setup>
import { useAuthStore } from "@/stores/auth";
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const authStore = useAuthStore();

const form = ref({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
});

const errors = ref({});
const isLoading = ref(false);

const validateForm = () => {
    errors.value = {};
    let isValid = true;

    if (!form.value.name) {
        errors.value.name = "Full name is required";
        isValid = false;
    }

    if (!form.value.email) {
        errors.value.email = "Email is required";
        isValid = false;
    }

    if (!form.value.phone) {
        errors.value.phone = "Phone number is required";
        isValid = false;
    }

    if (!form.value.password) {
        errors.value.password = "Password is required";
        isValid = false;
    }

    if (form.value.password !== form.value.confirmPassword) {
        errors.value.confirmPassword = "Passwords do not match";
        isValid = false;
    }

    return isValid;
};

const handleSignup = async () => {
    if (!validateForm()) return;

    isLoading.value = true;
    try {
        await authStore.register(form.value);
        router.push("/");
    } catch (error) {
        errors.value.form = error.message;
    } finally {
        isLoading.value = false;
    }
};
</script>

<template>
    <div class="min-h-screen flex flex-col md:flex-row">
        <!-- Left Side - Background Image -->
        <div
            class="hidden md:block md:w-1/2 bg-gradient-to-r from-red-600 to-orange-500 relative overflow-hidden"
        >
            <!-- Same image section as login -->
            <div class="relative w-full h-auto overflow-hidden">
                <img
                    src="@/assets/images/main.jpg"
                    class="w-full h-auto max-h-[450px] md:max-h-[600px] aspect-[16/9] object-cover opacity-10"
                    alt="Luxury Suite"
                />
            </div>
            <div
                class="absolute inset-0 bg-black/40 flex items-center justify-center"
            >
                <div class="text-center z-10 px-4 max-w-6xl">
                    <h1
                        class="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-3 md:mb-4"
                    >
                        WOODLAND SUITES
                    </h1>
                    <p
                        class="text-white text-base sm:text-lg md:text-xl lg:text-2xl"
                    >
                        Your home away from home
                    </p>
                </div>
            </div>
        </div>

        <!-- Right Side - Signup Form -->
        <div
            class="w-full md:w-1/2 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8"
        >
            <div
                class="w-full max-w-md space-y-4 md:space-y-6 bg-white rounded-lg shadow-md"
            >
                <!-- Mobile Header -->
                <div class="block bg-red-500 md:hidden relative w-full">
                    <img
                        src="@/assets/images/main.jpg"
                        class="w-full h-48 sm:h-64 object-cover opacity-10"
                        alt="Luxury Suite"
                    />
                    <div
                        class="absolute inset-0 bg-black/40 flex items-center justify-center"
                    >
                        <div class="text-center px-4">
                            <h1
                                class="text-white text-xl sm:text-2xl font-bold"
                            >
                                WOODLAND SUITES
                            </h1>
                            <p class="text-white text-sm sm:text-base">
                                Your home away from home
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Form Container -->
                <div class="card p-6">
                    <h2
                        class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6"
                    >
                        Create New Account
                    </h2>

                    <form
                        @submit.prevent="handleSignup"
                        class="space-y-3 sm:space-y-4"
                    >
                        <div class="space-y-4 sm:space-y-6">
                            <!-- Name Input -->
                            <div>
                                <label
                                    class="block text-sm sm:text-base font-medium text-gray-700 mb-2"
                                >
                                    Full Name
                                </label>
                                <InputText
                                    v-model="form.name"
                                    placeholder="Enter your full name"
                                    class="w-full text-sm sm:text-base"
                                    :class="{ 'p-invalid': errors.name }"
                                />
                                <small
                                    v-if="errors.name"
                                    class="p-error mt-1 block text-xs sm:text-sm"
                                >
                                    {{ errors.name }}
                                </small>
                            </div>

                            <!-- Email Input -->
                            <div>
                                <label
                                    class="block text-sm sm:text-base font-medium text-gray-700 mb-2"
                                >
                                    Email Address
                                </label>
                                <InputText
                                    v-model="form.email"
                                    type="email"
                                    placeholder="Enter your email"
                                    class="w-full text-sm sm:text-base"
                                    :class="{ 'p-invalid': errors.email }"
                                />
                                <small
                                    v-if="errors.email"
                                    class="p-error mt-1 block text-xs sm:text-sm"
                                >
                                    {{ errors.email }}
                                </small>
                            </div>

                            <!-- Phone Input -->
                            <div>
                                <label
                                    class="block text-sm sm:text-base font-medium text-gray-700 mb-2"
                                >
                                    Phone Number
                                </label>
                                <InputText
                                    v-model="form.phone"
                                    type="tel"
                                    placeholder="Enter your phone number"
                                    class="w-full text-sm sm:text-base"
                                    :class="{ 'p-invalid': errors.phone }"
                                />
                                <small
                                    v-if="errors.phone"
                                    class="p-error mt-1 block text-xs sm:text-sm"
                                >
                                    {{ errors.phone }}
                                </small>
                            </div>

                            <!-- Password Input -->
                            <div>
                                <label
                                    class="block text-sm sm:text-base font-medium text-gray-700 mb-2"
                                >
                                    Password
                                </label>
                                <Password
                                    v-model="form.password"
                                    toggleMask
                                    placeholder="Create password"
                                    class="w-full text-sm sm:text-base"
                                    :class="{ 'p-invalid': errors.password }"
                                />
                                <small
                                    v-if="errors.password"
                                    class="p-error mt-1 block text-xs sm:text-sm"
                                >
                                    {{ errors.password }}
                                </small>
                            </div>

                            <!-- Confirm Password Input -->
                            <div>
                                <label
                                    class="block text-sm sm:text-base font-medium text-gray-700 mb-2"
                                >
                                    Confirm Password
                                </label>
                                <Password
                                    v-model="form.confirmPassword"
                                    toggleMask
                                    placeholder="Confirm password"
                                    class="w-full text-sm sm:text-base"
                                    :class="{
                                        'p-invalid': errors.confirmPassword,
                                    }"
                                />
                                <small
                                    v-if="errors.confirmPassword"
                                    class="p-error mt-1 block text-xs sm:text-sm"
                                >
                                    {{ errors.confirmPassword }}
                                </small>
                            </div>
                        </div>

                        <!-- Submit Button -->
                        <Button
                            type="submit"
                            label="Create Account"
                            class="w-full p-button-success text-sm sm:text-base"
                            :loading="isLoading"
                        />

                        <!-- Login Link -->
                        <div
                            class="text-center text-xs sm:text-sm mt-3 sm:mt-4"
                        >
                            <span class="text-gray-600"
                                >Already have an account?</span
                            >
                            <router-link
                                to="/login"
                                class="text-primary font-medium hover:underline ml-1"
                                @click="() => router.push('/pages/auth/Login')"
                            >
                                Login Here
                            </router-link>

                            <router-link
                                to="/"
                                class="self-start mb-4 sm:mb-6 text-gray-600 hover:text-primary transition-colors"
                            >
                                <Button
                                    icon="pi pi-arrow-left"
                                    class="p-button-text p-button-sm"
                                    label="Back to Home"
                                />
                            </router-link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>
