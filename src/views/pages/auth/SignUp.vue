
<script>
import FloatingConfigurator from "@/components/FloatingConfigurator.vue";
import { signup } from "@/api/auth";
import { useRouter } from "vue-router";

export default {
  data() {
    return {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      errorMessage: "",
      successMessage: "",
      isLoading: false,
    };
  },
  setup() {
    const router = useRouter();
    return { router };
  },
  methods: {
    async handleSignUp() {
      this.errorMessage = "";
      this.successMessage = "";

      // Input validation
      if (!this.name || !this.email || !this.password || !this.confirmPassword) {
        this.errorMessage = "All fields are required.";
        return;
      }
      if (this.password !== this.confirmPassword) {
        this.errorMessage = "Passwords do not match.";
        return;
      }

      this.isLoading = true;
      try {
        const response = await signup(this.name, this.email, this.password, "guest");
        this.successMessage = "Account created successfully. Redirecting...";
        setTimeout(() => this.$router.push("/pages/auth/login"), 2000);
      } catch (error) {
        this.errorMessage = "Signup failed. Email may already be in use.";
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>


<template>
    <FloatingConfigurator />
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div class="w-full max-w-md">
            <!-- Logo and Header -->
            <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-full mb-4">
                    <i class="pi pi-home text-white text-2xl"></i>
                </div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Woodland Suite Hotel
                </h1>
                <p class="text-gray-600 dark:text-gray-400">
                    Sign up to create an account
                </p>
            </div>

            <!-- Sign Up Form Card -->
            <div class="bg-white dark:bg-gray-800  shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                <form @submit.prevent="handleSignUp" class="space-y-6">
                    <!-- Name Field -->
                    <div class="space-y-2">
                        <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Full Name
                        </label>
                        <InputText
                            id="name"
                            v-model="name"
                            type="text"
                            placeholder="Enter your full name"
                            class="w-full"
                            autofocus
                        />
                    </div>

                    <!-- Email Field -->
                    <div class="space-y-2">
                        <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email Address
                        </label>
                        <InputText
                            id="email"
                            v-model="email"
                            type="email"
                            placeholder="Enter your email address"
                            class="w-full"
                        />
                    </div>

                    <!-- Password Field -->
                    <div class="space-y-2">
                        <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Password
                        </label>
                        <Password
                            id="password"
                            v-model="password"
                            placeholder="Create a password"
                            :toggleMask="true"
                            class="w-full password-field"
                            :feedback="true"
                            :promptLabel="'Enter a password'"
                            :weakLabel="'Weak'"
                            :mediumLabel="'Medium'"
                            :strongLabel="'Strong'"
                            fluid
                        />
                        <small class="text-gray-500 dark:text-gray-400">
                            Password must be at least 6 characters long
                        </small>
                    </div>

                    <!-- Confirm Password Field -->
                    <div class="space-y-2">
                        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Confirm Password
                        </label>
                        <Password
                            id="confirmPassword"
                            v-model="confirmPassword"
                            :toggleMask="true"
                            placeholder="Confirm your password"
                            class="w-full password-field"
                            inputClass="w-full"
                            :feedback="false"
                            fluid
                        />
                        <small 
                            v-if="password && confirmPassword && password !== confirmPassword" 
                            class="text-red-500"
                        >
                            Passwords do not match
                        </small>
                    </div>

                    <!-- Error and Success Messages -->
                    <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <div class="flex items-center">
                            <i class="pi pi-exclamation-triangle text-red-500 mr-2"></i>
                            <span class="text-red-700 dark:text-red-300 text-sm">{{ errorMessage }}</span>
                        </div>
                    </div>

                    <div v-if="successMessage" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <div class="flex items-center">
                            <i class="pi pi-check-circle text-green-500 mr-2"></i>
                            <span class="text-green-700 dark:text-green-300 text-sm">{{ successMessage }}</span>
                        </div>
                    </div>

                    <!-- Sign Up Button -->
                    <Button
                        label="Create Account"
                        class="w-full"
                        size="large"
                        @click="handleSignUp"
                        :loading="isLoading"
                    />
                </form>

                <!-- Divider -->
                <div class="relative my-6">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div class="relative flex justify-center text-sm">
                        <span class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                            Already have an account?
                        </span>
                    </div>
                </div>

                <!-- Login Link -->
                <div class="text-center">
                    <router-link
                        to="/pages/auth/login"
                        class="inline-flex items-center text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors duration-200"
                    >
                        <i class="pi pi-sign-in mr-2"></i>
                        Sign in to your account
                    </router-link>
                </div>
            </div>

            <!-- Footer -->
            <div class="text-center mt-8">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    By creating an account, you agree to our 
                    <a href="#" class="text-primary-600 hover:text-primary-500 dark:text-primary-400">Terms of Service</a>
                    and 
                    <a href="#" class="text-primary-600 hover:text-primary-500 dark:text-primary-400">Privacy Policy</a>
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Password field width fix */
.password-field :deep(.p-password) {
    width: 100%;
}

.password-field :deep(.p-inputtext) {
    width: 100%;
}

/* Enhanced focus states */
.p-inputtext:focus,
.password-field :deep(.p-inputtext:focus) {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    border-color: #3b82f6;
}

/* Loading state improvements */
.p-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
