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
    <div
        class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
        <div class="max-w-md w-full space-y-8">
            <div>
                <img
                    class="mx-auto h-12 w-auto"
                    src="@/assets/logo.png"
                    alt="Hotel Logo"
                />
                <h2
                    class="mt-6 text-center text-3xl font-extrabold text-gray-900"
                >
                    Sign in to your account
                </h2>
            </div>
            <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
                <div class="rounded-md shadow-sm space-y-4">
                    <div>
                        <label
                            for="email"
                            class="block text-sm font-medium text-gray-700"
                            >Email address</label
                        >
                        <InputText
                            id="email"
                            v-model="form.email"
                            type="email"
                            class="w-full mt-1"
                            :class="{ 'p-invalid': errors.email }"
                        />
                        <small v-if="errors.email" class="p-error">{{
                            errors.email
                        }}</small>
                    </div>

                    <div>
                        <label
                            for="password"
                            class="block text-sm font-medium text-gray-700"
                            >Password</label
                        >
                        <Password
                            id="password"
                            v-model="form.password"
                            toggleMask
                            class="w-full mt-1"
                            :class="{ 'p-invalid': errors.password }"
                        />
                        <small v-if="errors.password" class="p-error">{{
                            errors.password
                        }}</small>
                    </div>
                </div>

                <div class="flex items-center justify-between">
                    <div class="text-sm">
                        <router-link
                            to="/register"
                            class="font-medium text-primary hover:text-primary-dark"
                        >
                            Create an account
                        </router-link>
                    </div>
                </div>

                <Button
                    type="submit"
                    label="Sign in"
                    class="w-full p-button-success"
                    :loading="isLoading"
                />
            </form>
        </div>
    </div>
</template>
