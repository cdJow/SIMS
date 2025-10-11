<template>
    <div class="profile-details-container">
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center py-20">
            <ProgressSpinner />
        </div>

        <!-- Profile Content -->
        <div v-else>
            <!-- Profile Header -->
            <div class="flex items-center justify-between mb-8">
                <h2 class="text-2xl font-bold text-gray-800">
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
                <h3 class="text-xl font-semibold text-gray-800">
                    {{ user?.name || 'Guest User' }}
                </h3>
                <p class="text-gray-600 capitalize">{{ user?.role || 'Guest' }}</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Personal Information Card -->
                <Card class="mb-6">
                    <template #title>Personal Information</template>
                    <template #content>
                        <div class="space-y-4">
                            <div class="field">
                                <label class="block text-sm font-medium mb-2 text-gray-700">Full Name</label>
                                <InputText
                                    :value="user?.name || 'N/A'"
                                    disabled
                                    class="w-full bg-gray-50"
                                />
                                <small class="text-gray-500 mt-1 block">This field is read-only</small>
                            </div>
                            <div class="field">
                                <label class="block text-sm font-medium mb-2 text-gray-700">Email Address</label>
                                <InputText
                                    :value="user?.email || 'N/A'"
                                    disabled
                                    class="w-full bg-gray-50"
                                />
                                <small class="text-gray-500 mt-1 block">This field is read-only</small>
                            </div>
                            <div class="field">
                                <label class="block text-sm font-medium mb-2 text-gray-700">Member Since</label>
                                <InputText
                                    :value="formatDate(user?.created_at)"
                                    disabled
                                    class="w-full bg-gray-50"
                                />
                                <small class="text-gray-500 mt-1 block">Account creation date</small>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Security Settings Card -->
                <Card>
                    <template #title>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-shield text-primary"></i>
                            Security Settings
                        </div>
                    </template>
                    <template #content>
                        <div class="space-y-4">
                            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                                <div>
                                    <span class="font-medium block">Password</span>
                                    <small class="text-gray-600">Update your account password</small>
                                </div>
                                <Button
                                    label="Change"
                                    icon="pi pi-lock"
                                    class="p-button-primary p-button-sm"
                                    @click="showPasswordDialog = true"
                                />
                            </div>
                            <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div class="flex items-start gap-3">
                                    <i class="pi pi-info-circle text-blue-600 mt-1"></i>
                                    <div class="text-sm text-blue-800">
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
            header="Change Password"
            :modal="true"
            :closable="true"
            :style="{ width: '400px' }"
        >
            <div class="space-y-4">
                <div class="field">
                    <label class="block text-sm font-medium mb-2">New Password</label>
                    <Password
                        v-model="password.new"
                        toggleMask
                        class="w-full"
                        inputClass="w-full"
                        :feedback="true"
                        placeholder="Enter new password"
                    />
                </div>
                <div class="field">
                    <label class="block text-sm font-medium mb-2">Confirm New Password</label>
                    <Password
                        v-model="password.confirm"
                        toggleMask
                        class="w-full"
                        inputClass="w-full"
                        :feedback="false"
                        placeholder="Confirm new password"
                    />
                    <small v-if="password.new && password.confirm && password.new !== password.confirm" 
                           class="text-red-500 mt-1 block">
                        Passwords do not match
                    </small>
                </div>
                <div v-if="passwordError" class="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {{ passwordError }}
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button
                        label="Cancel"
                        icon="pi pi-times"
                        @click="closePasswordDialog"
                        class="p-button-text"
                    />
                    <Button
                        label="Update Password"
                        icon="pi pi-check"
                        @click="handlePasswordChange"
                        class="p-button-success"
                        :disabled="!isPasswordValid"
                        :loading="passwordLoading"
                    />
                </div>
            </template>
        </Dialog>
    </div>
    <Toast />
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
import ProgressSpinner from "primevue/progressspinner";
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

:deep(.p-card) {
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

:deep(.p-card-title) {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: #374151;
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

/* Tag styling */
:deep(.p-tag) {
    font-size: 0.875rem;
    padding: 0.5rem 1rem;
}
</style>
