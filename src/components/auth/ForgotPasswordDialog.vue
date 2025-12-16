<script>
import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import axios from 'axios';

export default {
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:visible'],
  setup(props, { emit }) {
    const toast = useToast();
    const email = ref('');
    const isLoading = ref(false);
    const resetEmailSent = ref(false);

    const handleForgotPassword = async () => {
      if (!email.value) {
        toast.add({
          severity: 'warn',
          summary: 'Required',
          detail: 'Please enter your email address',
          life: 3000
        });
        return;
      }

      isLoading.value = true;
      try {
        const response = await axios.post(
          'http://127.0.0.1:5000/forgot-password',
          { email: email.value }
        );

        if (response.data.email_notification) {
          resetEmailSent.value = true;
          toast.add({
            severity: 'success',
            summary: 'Email Sent',
            detail: 'Password reset link has been sent to your email',
            life: 5000
          });

          // Auto close dialog after 2 seconds
          setTimeout(() => {
            closeDialog();
          }, 2000);
        } else {
          toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Email could not be sent. Please try again later.',
            life: 3000
          });
        }
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.response?.data?.message || 'An error occurred',
          life: 3000
        });
      } finally {
        isLoading.value = false;
      }
    };

    const closeDialog = () => {
      email.value = '';
      resetEmailSent.value = false;
      emit('update:visible', false);
    };

    return {
      email,
      isLoading,
      resetEmailSent,
      handleForgotPassword,
      closeDialog
    };
  }
};
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    header="Reset Your Password"
    :modal="true"
    :style="{ width: '90vw', maxWidth: '400px' }"
    @hide="closeDialog"
  >
    <div class="space-y-4">
      <!-- Success Message -->
      <div v-if="resetEmailSent" class="bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex items-start">
          <i class="pi pi-check-circle text-green-600 text-xl mr-3 mt-1"></i>
          <div>
            <h4 class="text-green-800 font-semibold mb-1">Check Your Email</h4>
            <p class="text-green-700 text-sm">
              We've sent a password reset link to <strong>{{ email }}</strong>
            </p>
            <p class="text-green-600 text-xs mt-2">
              The link will expire in 24 hours.
            </p>
          </div>
        </div>
      </div>

      <!-- Form -->
      <div v-else class="space-y-4">
        <p class="text-gray-600 text-sm">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <div class="space-y-2">
          <label for="reset-email" class="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <InputText
            id="reset-email"
            v-model="email"
            type="email"
            placeholder="Enter your email address"
            class="w-full"
            @keyup.enter="handleForgotPassword"
          />
        </div>

        <!-- Security Info -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p class="text-blue-700 text-xs flex items-start">
            <i class="pi pi-shield text-blue-600 mr-2 mt-1"></i>
            <span>Your password reset link is secure and will only work for 24 hours.</span>
          </p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button
          label="Cancel"
          @click="closeDialog"
          class="p-button-text"
          :disabled="isLoading"
        />
        <Button
          v-if="!resetEmailSent"
          label="Send Reset Link"
          @click="handleForgotPassword"
          :loading="isLoading"
          class="p-button-success"
        />
        <Button
          v-else
          label="Close"
          @click="closeDialog"
          class="p-button-success"
        />
      </div>
    </template>
  </Dialog>
</template>
