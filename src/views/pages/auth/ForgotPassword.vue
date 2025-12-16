<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import axios from 'axios';

export default {
  setup() {
    const router = useRouter();
    const toast = useToast();

    const email = ref('');
    const isLoading = ref(false);
    const errorMessage = ref('');
    const successMessage = ref('');
    const emailSent = ref(false);

    const handleForgotPassword = async () => {
      errorMessage.value = '';
      successMessage.value = '';

      if (!email.value) {
        errorMessage.value = 'Email address is required.';
        return;
      }

      isLoading.value = true;
      try {
        const response = await axios.post(
          'http://127.0.0.1:5000/forgot-password',
          { email: email.value }
        );

        if (response.data.email_notification) {
          emailSent.value = true;
          successMessage.value = 'Password reset link has been sent to your email!';
          
          // Auto redirect after 3 seconds
          setTimeout(() => {
            router.push('/pages/auth/login');
          }, 3000);
        } else {
          errorMessage.value = 'Email could not be sent. Please try again later.';
        }
      } catch (error) {
        errorMessage.value = error.response?.data?.message || 'An error occurred. Please try again.';
      } finally {
        isLoading.value = false;
      }
    };

    const backToLogin = () => {
      router.push('/pages/auth/login');
    };

    return {
      email,
      isLoading,
      errorMessage,
      successMessage,
      emailSent,
      handleForgotPassword,
      backToLogin
    };
  }
};
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div class="w-full max-w-md">
            <!-- Logo and Header -->
            <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-full mb-4">
                    <i class="pi pi-lock text-white text-2xl"></i>
                </div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Woodland Suite Hotel
                </h1>
                <p class="text-gray-600 dark:text-gray-400">
                    Reset your password
                </p>
            </div>

            <!-- Forgot Password Form Card -->
            <div class="bg-white dark:bg-gray-800 shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                <form @submit.prevent="handleForgotPassword" class="space-y-6">
                    <!-- Success State -->
                    <div v-if="emailSent" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                        <div class="text-center">
                            <div class="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full mb-3">
                                <i class="pi pi-check text-green-600 dark:text-green-400 text-xl"></i>
                            </div>
                            <h3 class="text-green-800 dark:text-green-300 font-semibold mb-2">Check Your Email</h3>
                            <p class="text-green-700 dark:text-green-200 text-sm mb-2">
                                We've sent a password reset link to <strong>{{ email }}</strong>
                            </p>
                            <p class="text-green-600 dark:text-green-300 text-xs">
                                The link will expire in 24 hours. Redirecting to login...
                            </p>
                        </div>
                    </div>

                    <!-- Form Content -->
                    <template v-else>
                        <!-- Email Field -->
                        <div class="space-y-2">
                            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email Address
                            </label>
                            <InputText
                                id="email"
                                v-model="email"
                                type="email"
                                placeholder="Enter your registered email"
                                class="w-full"
                                autofocus
                                @keyup.enter="handleForgotPassword"
                            />
                        </div>

                        <!-- Helper Text -->
                        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <p class="text-blue-700 dark:text-blue-300 text-sm flex items-start">
                                <i class="pi pi-info-circle text-blue-600 dark:text-blue-400 mr-2 mt-1"></i>
                                <span>Enter the email address associated with your account and we'll send you a link to reset your password.</span>
                            </p>
                        </div>

                        <!-- Error Message -->
                        <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <div class="flex items-center">
                                <i class="pi pi-exclamation-triangle text-red-500 mr-2"></i>
                                <span class="text-red-700 dark:text-red-300 text-sm">{{ errorMessage }}</span>
                            </div>
                        </div>

                        <!-- Send Reset Link Button -->
                        <Button
                            label="Send Reset Link"
                            class="w-full"
                            size="large"
                            @click="handleForgotPassword"
                            :loading="isLoading"
                        />

                        <!-- Security Info -->
                        <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                            <p class="text-yellow-700 dark:text-yellow-300 text-xs flex items-start">
                                <i class="pi pi-shield text-yellow-600 dark:text-yellow-400 mr-2 mt-1"></i>
                                <span>Your password reset link is secure and will only work for 24 hours.</span>
                            </p>
                        </div>
                    </template>
                </form>

                <!-- Divider -->
                <div class="relative my-6">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div class="relative flex justify-center text-sm">
                        <span class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                            Remember your password?
                        </span>
                    </div>
                </div>

                <!-- Back to Login Link -->
                <div class="text-center">
                    <router-link
                        to="/pages/auth/login"
                        class="inline-flex items-center text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors duration-200"
                    >
                        <i class="pi pi-sign-in mr-2"></i>
                        Back to Login
                    </router-link>
                </div>
            </div>

            <!-- Footer -->
            <div class="text-center mt-8">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    Need help?
                    <a 
                        href="mailto:info@woodlandsuites.com"
                        class="text-primary-600 hover:text-primary-500 dark:text-primary-400 hover:underline"
                    >
                        Contact Support
                    </a>
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Enhanced focus states */
.p-inputtext:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    border-color: #3b82f6;
}

/* Loading state improvements */
.p-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
