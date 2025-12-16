<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import axios from 'axios';

export default {
  setup() {
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();

    const token = ref(route.query.token || '');
    const password = ref('');
    const confirmPassword = ref('');
    const passwordStrength = ref(null);
    const isLoading = ref(false);
    const isValidToken = ref(true);
    const errorMessage = ref('');

    const evaluatePasswordStrength = (pwd) => {
      if (!pwd) return null;

      if (pwd.length < 8) {
        return 'Weak';
      }

      const hasLowercase = /[a-z]/.test(pwd);
      const hasUppercase = /[A-Z]/.test(pwd);
      const hasNumbers = /[0-9]/.test(pwd);
      const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);

      const characterTypeCount = [hasLowercase, hasUppercase, hasNumbers, hasSpecial].filter(Boolean).length;

      if (characterTypeCount < 2) {
        return 'Weak';
      }

      let strength = 0;
      if (pwd.length >= 8) strength += 1;
      if (pwd.length >= 12) strength += 1;
      if (hasLowercase) strength += 1;
      if (hasUppercase) strength += 1;
      if (hasNumbers) strength += 1;
      if (hasSpecial) strength += 1;

      if (strength <= 3) return 'Medium';
      return 'Strong';
    };

    const isResetDisabled = () => {
      const hasRequiredFields = password.value && confirmPassword.value;
      const passwordsMatch = password.value === confirmPassword.value;
      const passwordIsNotWeak = passwordStrength.value !== 'Weak';
      return !hasRequiredFields || !passwordsMatch || !passwordIsNotWeak || isLoading.value;
    };

    const handleResetPassword = async () => {
      errorMessage.value = '';

      if (!token.value) {
        errorMessage.value = 'Invalid or missing reset token';
        return;
      }

      if (password.value !== confirmPassword.value) {
        errorMessage.value = 'Passwords do not match';
        return;
      }

      if (passwordStrength.value === 'Weak') {
        errorMessage.value = 'Password is too weak. Use at least 8 characters with mixed character types.';
        return;
      }

      isLoading.value = true;
      try {
        await axios.post(
          'http://127.0.0.1:5000/reset-password',
          {
            token: token.value,
            password: password.value
          }
        );

        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Your password has been reset successfully!',
          life: 3000
        });

        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/pages/auth/login');
        }, 2000);
      } catch (error) {
        errorMessage.value = error.response?.data?.message || 'Failed to reset password. Token may have expired.';
        isValidToken.value = false;
      } finally {
        isLoading.value = false;
      }
    };

    onMounted(() => {
      if (!token.value) {
        errorMessage.value = 'No reset token provided. Please use the link from your email.';
        isValidToken.value = false;
      }
    });

    return {
      token,
      password,
      confirmPassword,
      passwordStrength,
      isLoading,
      isValidToken,
      errorMessage,
      evaluatePasswordStrength,
      isResetDisabled,
      handleResetPassword
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
          Reset Password
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Create a new password for your account
        </p>
      </div>

      <!-- Error State -->
      <div v-if="!isValidToken" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div class="flex items-center mb-3">
          <i class="pi pi-exclamation-triangle text-red-500 text-2xl mr-3"></i>
          <h3 class="text-red-700 dark:text-red-300 font-semibold">Invalid Reset Link</h3>
        </div>
        <p class="text-red-600 dark:text-red-200 text-sm mb-4">
          {{ errorMessage }}
        </p>
        <router-link to="/pages/auth/login">
          <Button label="Back to Login" class="w-full p-button-success" />
        </router-link>
      </div>

      <!-- Reset Form -->
      <div v-else class="bg-white dark:bg-gray-800 shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <form @submit.prevent="handleResetPassword" class="space-y-6">
          <!-- Password Field -->
          <div class="space-y-2">
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              New Password
            </label>
            <Password
              id="password"
              v-model="password"
              @input="passwordStrength = evaluatePasswordStrength(password)"
              placeholder="Create a new password"
              :toggleMask="true"
              class="w-full password-field"
              :feedback="true"
              :promptLabel="'Enter a password'"
              :weakLabel="'Weak'"
              :mediumLabel="'Medium'"
              :strongLabel="'Strong'"
              fluid
            />
            <div class="flex items-center justify-between mt-2">
              <small class="text-gray-500 dark:text-gray-400">
                Password must be at least 8 characters with letters and numbers for Medium strength
              </small>
              <small :class="password.length >= 8 ? 'text-green-500' : 'text-red-500'" class="font-medium">
                {{ password.length }}/8 
              </small>
            </div>
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
              placeholder="Confirm your new password"
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

          <!-- Error Message -->
          <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div class="flex items-center">
              <i class="pi pi-exclamation-triangle text-red-500 mr-2"></i>
              <span class="text-red-700 dark:text-red-300 text-sm">{{ errorMessage }}</span>
            </div>
          </div>

          <!-- Security Info -->
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p class="text-blue-700 dark:text-blue-300 text-xs flex items-start">
              <i class="pi pi-shield text-blue-600 dark:text-blue-400 mr-2 mt-1"></i>
              <span>Your password will be securely encrypted and stored.</span>
            </p>
          </div>

          <!-- Submit Button -->
          <Button
            label="Reset Password"
            class="w-full"
            size="large"
            @click="handleResetPassword"
            :loading="isLoading"
            :disabled="isResetDisabled()"
          />
        </form>

        <!-- Back to Login -->
        <div class="text-center mt-6">
          <router-link
            to="/pages/auth/login"
            class="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
          >
            <i class="pi pi-arrow-left mr-1"></i>
            Back to Login
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.password-field :deep(.p-password) {
  width: 100%;
}

.password-field :deep(.p-inputtext) {
  width: 100%;
}

.p-inputtext:focus,
.password-field :deep(.p-inputtext:focus) {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
}

.p-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
