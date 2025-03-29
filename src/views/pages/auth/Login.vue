<script setup>
import { useAuthStore } from "@/stores/auth";
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const authStore = useAuthStore();

const form = ref({
    email: "",
    password: "",
});

const errors = ref({});
const isLoading = ref(false);

const validateForm = () => {
    errors.value = {};
    let isValid = true;

    if (!form.value.email) {
        errors.value.email = "Email is required";
        isValid = false;
    }

    if (!form.value.password) {
        errors.value.password = "Password is required";
        isValid = false;
    }

    return isValid;
};

const handleLogin = async () => {
    if (!validateForm()) return;

    isLoading.value = true;
    try {
        await authStore.login(form.value);
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
            <!-- Image Container -->
            <div class="relative w-full h-auto overflow-hidden">
                <img
                    src="@/assets/images/main.jpg"
                    class="w-full h-auto max-h-[450px] md:max-h-[600px] aspect-[16/9] object-cover opacity-10"
                    alt="Luxury Suite"
                />
            </div>

            <!-- Overlay Content -->
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
        <!-- Right Side - Login Form -->
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
                <div class="card">
                    <h2
                        class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6"
                    >
                        Login to your account
                    </h2>

                    <form
                        @submit.prevent="handleLogin"
                        class="space-y-3 sm:space-y-4"
                    >
                        <div class="space-y-4 sm:space-y-6">
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
                                    placeholder="Enter your password"
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
                        </div>

                        <!-- Submit Button -->
                        <Button
                            type="submit"
                            label="Sign In"
                            class="w-full p-button-success text-sm sm:text-base"
                            :loading="isLoading"
                        />

                        <!-- Registration Link -->
                        <div
                            class="text-center text-xs sm:text-sm mt-3 sm:mt-4"
                        >
                            <span class="text-gray-600"
                                >Don't have an account?</span
                            >
                            <router-link
                                to="/register"
                                class="text-primary font-medium hover:underline ml-1"
                                @click="() => router.push('/auth/SignUp')"
                            >
                                Create Account
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
