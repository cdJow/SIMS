<template>
    <div class="card">
        <!-- Profile Content -->
        <div v-if="!loading">
            <!-- Profile Header -->
            <div class="flex items-center justify-between mb-8">
                <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Profile Information
                </h2>
                
            </div>

            <!-- Avatar Section -->
            <div class="flex flex-col items-center mb-8">
                <Avatar
                    :image="getUserAvatarUrl()"
                    class="w-32 h-32 mb-4 border-4 border-primary shadow-xl"
                    size="xlarge"
                    shape="circle"
                />
                <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    {{ user?.name || 'Guest User' }}
                </h3>
                <p class="text-gray-600 dark:text-gray-400 capitalize">{{ user?.role || 'Guest' }}</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Personal Information Card -->
                <Card class="mb-6 dark:bg-gray-800">
                    <template #title>Personal Information</template>
                    <template #content>
                        <div class="space-y-4">
                            <div class="field">
                                <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Full Name</label>
                                <InputText
                                    :value="user?.name || 'N/A'"
                                    disabled
                                    class="w-full bg-gray-50 dark:bg-gray-700 dark:text-gray-200"
                                />
                                <small class="text-gray-500 dark:text-gray-400 mt-1 block">This field is read-only</small>
                            </div>
                            <div class="field">
                                <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Email Address</label>
                                <InputText
                                    :value="user?.email || 'N/A'"
                                    disabled
                                    class="w-full bg-gray-50 dark:bg-gray-700 dark:text-gray-200"
                                />
                                <small class="text-gray-500 dark:text-gray-400 mt-1 block">This field is read-only</small>
                            </div>
                            <div class="field">
                                <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Member Since</label>
                                <InputText
                                    :value="formatDate(user?.created_at)"
                                    disabled
                                    class="w-full bg-gray-50 dark:bg-gray-700 dark:text-gray-200"
                                />
                                <small class="text-gray-500 dark:text-gray-400 mt-1 block">Account creation date</small>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Security Settings Card -->
                <Card class="dark:bg-gray-800">
                    <template #title>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-shield text-primary"></i>
                            Security Settings
                        </div>
                    </template>
                    <template #content>
                        <div class="space-y-4">
                            <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                                <div>
                                    <span class="font-medium block dark:text-gray-100">Password</span>
                                    <small class="text-gray-600 dark:text-gray-400">Update your account password</small>
                                </div>
                                <Button
                                    label="Change"
                                    icon="pi pi-lock"
                                    class="p-button-primary p-button-sm"
                                    @click="showPasswordDialog = true"
                                />
                            </div>
                            <div class="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <div class="flex items-start gap-3">
                                    <i class="pi pi-info-circle text-blue-600 dark:text-blue-400 mt-1"></i>
                                    <div class="text-sm text-blue-800 dark:text-blue-200">
                                        <strong>Profile Security:</strong> Only password can be changed. 
                                        
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Change Password Dialog -->
        <Dialog
            v-model:visible="showPasswordDialog"
            :modal="true"
            :closable="true"
            :draggable="false"
            class="password-change-dialog"
            :style="{ width: '450px' }"
        >
            <template #header>
                <div class="flex items-center gap-3">
                    <i class="pi pi-lock text-primary text-xl"></i>
                    <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-100">Change Password</h3>
                </div>
            </template>

            <div class="dialog-content">
                <!-- Security Notice -->
                <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div class="flex items-start gap-3">
                        <i class="pi pi-info-circle text-blue-600 dark:text-blue-400 mt-1"></i>
                        <div class="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Security Notice:</strong> Choose a strong password with at least 6 characters.
                        </div>
                    </div>
                </div>

                <!-- Password Fields -->
                <div class="space-y-5">
                    <div class="field">
                        <label class="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                            <i class="pi pi-key mr-2 text-primary"></i>
                            New Password
                        </label>
                        <Password
                            v-model="password.new"
                            toggleMask
                            class="w-full"
                            inputClass="w-full h-12"
                            :feedback="true"
                            placeholder="Enter your new password"
                            :pt="{
                                input: { class: 'text-base' }
                            }"
                        />
                    </div>

                    <div class="field">
                        <label class="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                            <i class="pi pi-shield mr-2 text-primary"></i>
                            Confirm New Password
                        </label>
                        <Password
                            v-model="password.confirm"
                            toggleMask
                            class="w-full"
                            inputClass="w-full h-12"
                            :feedback="false"
                            placeholder="Confirm your new password"
                            :pt="{
                                input: { class: 'text-base' }
                            }"
                        />
                        <small v-if="password.new && password.confirm && password.new !== password.confirm" 
                               class="text-red-500 dark:text-red-400 mt-2 block font-medium flex items-center gap-1">
                            <i class="pi pi-exclamation-triangle text-xs"></i>
                            Passwords do not match
                        </small>
                    </div>

                    <!-- Error Message -->
                    <div v-if="passwordError" class="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                        <div class="flex items-start gap-3">
                            <i class="pi pi-exclamation-circle text-red-600 dark:text-red-400 mt-1"></i>
                            <div class="text-sm text-red-700 dark:text-red-300 font-medium">
                                {{ passwordError }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                        <i class="pi pi-info-circle mr-1"></i>
                        Password must be at least 6 characters long
                    </div>
                    <div class="flex gap-3">
                        <Button
                            label="Cancel"
                            icon="pi pi-times"
                            @click="closePasswordDialog"
                            class="p-button-text p-button-secondary"
                            :disabled="passwordLoading"
                        />
                        <Button
                            label="Change"
                            icon="pi pi-check"
                            @click="handlePasswordChange"
                            class="p-button-success px-6"
                            :disabled="!isPasswordValid"
                            :loading="passwordLoading"
                        />
                    </div>
                </div>
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useToast } from "primevue/usetoast";
import { getCurrentUser, resetUserPassword } from "@/api/auth";
import Card from "primevue/card";
import Avatar from "primevue/avatar";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Password from "primevue/password";
import Tag from "primevue/tag";
import Toast from "primevue/toast";

const toast = useToast();

// State
const loading = ref(true);
const user = ref(null);
const showPasswordDialog = ref(false);
const passwordLoading = ref(false);
const passwordError = ref("");

const password = ref({
    new: "",
    confirm: "",
});

// Computed
const isPasswordValid = computed(() => {
    return password.value.new && 
           password.value.confirm && 
           password.value.new === password.value.confirm &&
           password.value.new.length >= 6;
});

// Methods
const fetchUserData = async () => {
    try {
        loading.value = true;
        const userId = localStorage.getItem('userId');
        if (!userId) {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'User not authenticated',
                life: 3000
            });
            return;
        }

        const response = await getCurrentUser(userId);
        user.value = response.data.user;
    } catch (error) {
        console.error('Error fetching user data:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load profile data',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const getUserAvatarUrl = () => {
    if (user.value?.image_url) {
        return `http://127.0.0.1:5000/uploads/users/${user.value.image_url}`;
    }
    return 'https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png';
};

const getRoleSeverity = (role) => {
    switch(role?.toLowerCase()) {
        case 'system admin':
            return 'danger';
        case 'manager':
            return 'warning';
        case 'front desk':
            return 'success';
        case 'inventory':
            return 'info';
        case 'guest':
        default:
            return 'secondary';
    }
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const handlePasswordChange = async () => {
    if (!isPasswordValid.value) {
        passwordError.value = "Please ensure passwords match and are at least 6 characters long";
        return;
    }

    try {
        passwordLoading.value = true;
        passwordError.value = "";
        
        const userId = localStorage.getItem('userId');
        await resetUserPassword(userId, { 
            new_password: password.value.new 
        });

        showPasswordDialog.value = false;
        toast.add({
            severity: 'success',
            summary: 'Password Updated',
            detail: 'Your password has been changed successfully',
            life: 3000
        });

        // Reset password fields
        password.value.new = "";
        password.value.confirm = "";
        
    } catch (error) {
        console.error('Error changing password:', error);
        passwordError.value = error.response?.data?.message || "Failed to update password";
        toast.add({
            severity: 'error',
            summary: 'Password Update Failed',
            detail: passwordError.value,
            life: 5000
        });
    } finally {
        passwordLoading.value = false;
    }
};

const closePasswordDialog = () => {
    showPasswordDialog.value = false;
    password.value.new = "";
    password.value.confirm = "";
    passwordError.value = "";
};

// Initialize
onMounted(() => {
    fetchUserData();
});
</script>

<style scoped>
.profile-details-container {
    padding: 1.5rem;
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.dark .profile-details-container {
    background-color: rgb(31, 41, 55) !important;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2);
    color: rgb(229, 231, 235);
}
</style>

<style>
/* Global dark mode overrides for PrimeVue Card */
.dark .p-card {
    background-color: rgb(31, 41, 55) !important;
    border: 1px solid rgb(55, 65, 81) !important;
    color: rgb(229, 231, 235) !important;
}

.dark .p-card .p-card-body {
    background-color: rgb(31, 41, 55) !important;
    color: rgb(229, 231, 235) !important;
}

.dark .p-card .p-card-content {
    background-color: rgb(31, 41, 55) !important;
    color: rgb(229, 231, 235) !important;
}

.dark .p-card .p-card-title {
    color: rgb(229, 231, 235) !important;
}

/* InputText dark mode */
.dark .p-inputtext {
    background-color: rgb(55, 65, 81) !important;
    border-color: rgb(75, 85, 99) !important;
    color: rgb(229, 231, 235) !important;
}

.dark .p-inputtext:disabled {
    background-color: rgb(55, 65, 81) !important;
    color: rgb(229, 231, 235) !important;
    border-color: rgb(75, 85, 99) !important;
    opacity: 1 !important;
}

/* Button dark mode */
.dark .p-button.p-button-primary {
    background-color: rgb(59, 130, 246) !important;
    border-color: rgb(59, 130, 246) !important;
    color: white !important;
}

.dark .p-button.p-button-primary:hover {
    background-color: rgb(37, 99, 235) !important;
    border-color: rgb(37, 99, 235) !important;
}

.dark .p-button.p-button-text {
    color: rgb(156, 163, 175) !important;
}

.dark .p-button.p-button-text:hover {
    background-color: rgb(55, 65, 81) !important;
    color: rgb(229, 231, 235) !important;
}

.dark .p-button.p-button-success {
    background-color: rgb(34, 197, 94) !important;
    border-color: rgb(34, 197, 94) !important;
}

.dark .p-button.p-button-success:hover {
    background-color: rgb(22, 163, 74) !important;
    border-color: rgb(22, 163, 74) !important;
}

.field {
    margin-bottom: 1rem;
}

:deep(.p-password-input) {
    width: 100%;
}

/* Avatar styling */
:deep(.p-avatar img) {
    object-fit: cover;
    object-position: center;
    width: 100%;
    height: 100%;
}

/* Enhanced button hover effects */
:deep(.p-button:hover) {
    transform: translateY(-1px);
    transition: transform 0.2s ease;
}

:deep(.p-tag) {
    font-size: 0.875rem;
    padding: 0.5rem 1rem;
}

/* Password Dialog Styling */
:deep(.password-change-dialog) {
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

:deep(.password-change-dialog .p-dialog-header) {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-bottom: 1px solid #e2e8f0;
    border-radius: 12px 12px 0 0;
    padding: 1.5rem 2rem;
}

:deep(.password-change-dialog .p-dialog-content) {
    padding: 2rem;
    background-color: white;
}

:deep(.password-change-dialog .p-dialog-footer) {
    background-color: #fafafa;
    border-top: 1px solid #e2e8f0;
    border-radius: 0 0 12px 12px;
    padding: 1.5rem 2rem;
}

.dialog-content .field {
    margin-bottom: 0;
}

:deep(.password-change-dialog .p-password) {
    width: 100%;
}

:deep(.password-change-dialog .p-password .p-password-input) {
    border-radius: 8px;
    border: 2px solid #e2e8f0;
    transition: all 0.2s ease;
}

:deep(.password-change-dialog .p-password .p-password-input:focus) {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

:deep(.password-change-dialog .p-button) {
    border-radius: 8px;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    transition: all 0.2s ease;
}

:deep(.password-change-dialog .p-button:hover) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
