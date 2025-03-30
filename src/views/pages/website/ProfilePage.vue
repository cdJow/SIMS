<template>
    <div class="profile-details-container">
        <!-- Profile Header -->
        <div class="flex items-center justify-between mb-8">
            <h2 class="text-2xl font-bold text-gray-800">
                Profile Information
            </h2>
            <Button
                :label="editMode ? 'Cancel' : 'Edit Profile'"
                icon="pi pi-pencil"
                class="p-button-text"
                @click="toggleEditMode"
            />
        </div>

        <!-- Avatar Section -->
        <div class="flex flex-col items-center mb-8">
            <div class="relative group">
                <Avatar
                    :image="formData.avatar"
                    class="w-32 h-32 mb-4"
                    size="xlarge"
                    shape="circle"
                />
                <FileUpload
                    v-if="editMode"
                    mode="basic"
                    accept="image/*"
                    :maxFileSize="1000000"
                    chooseLabel="Change Photo"
                    class="absolute bottom-0 right-0"
                    @select="handleFileUpload"
                />
            </div>
            <h3 class="text-xl font-semibold text-gray-800">
                {{ formData.firstName }} {{ formData.lastName }}
            </h3>
            <p class="text-gray-600">{{ formData.position }}</p>
        </div>

        <!-- Personal Information Form -->
        <form @submit.prevent="handleSubmit">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Personal Details Card -->
                <Card class="mb-6">
                    <template #title>Personal Information</template>
                    <template #content>
                        <div class="grid grid-cols-1 gap-4">
                            <div class="field">
                                <label class="block text-sm font-medium mb-2"
                                    >First Name</label
                                >
                                <InputText
                                    v-model="formData.firstName"
                                    :disabled="!editMode"
                                    class="w-full"
                                    required
                                />
                            </div>
                            <div class="field">
                                <label class="block text-sm font-medium mb-2"
                                    >Last Name</label
                                >
                                <InputText
                                    v-model="formData.lastName"
                                    :disabled="!editMode"
                                    class="w-full"
                                />
                            </div>
                            <div class="field">
                                <label class="block text-sm font-medium mb-2"
                                    >Date of Birth</label
                                >
                                <Datepicker
                                    v-model="formData.dob"
                                    :disabled="!editMode"
                                    dateFormat="dd/mm/yy"
                                    class="w-full"
                                />
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Contact Information Card -->
                <Card>
                    <template #title>Contact Information</template>
                    <template #content>
                        <div class="grid grid-cols-1 gap-4">
                            <div class="field">
                                <label class="block text-sm font-medium mb-2"
                                    >Email</label
                                >
                                <InputText
                                    v-model="formData.email"
                                    type="email"
                                    :disabled="!editMode"
                                    class="w-full"
                                    required
                                />
                            </div>
                            <div class="field">
                                <label class="block text-sm font-medium mb-2"
                                    >Phone Number</label
                                >
                                <InputMask
                                    v-model="formData.phone"
                                    mask="(999) 999-9999"
                                    :disabled="!editMode"
                                    class="w-full"
                                />
                            </div>
                            <div class="field">
                                <label class="block text-sm font-medium mb-2"
                                    >Address</label
                                >
                                <Textarea
                                    v-model="formData.address"
                                    :disabled="!editMode"
                                    class="w-full"
                                    rows="2"
                                    autoResize
                                />
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Security Settings Card -->
                <Card v-if="!editMode" class="md:col-span-2">
                    <template #title>Security</template>
                    <template #content>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div
                                class="flex items-center justify-between p-3 bg-gray-50 rounded"
                            >
                                <span class="font-medium">Password</span>
                                <Button
                                    label="Change Password"
                                    icon="pi pi-lock"
                                    class="p-button-text"
                                    @click="showPasswordDialog = true"
                                />
                            </div>
                            <div
                                class="flex items-center justify-between p-3 bg-gray-50 rounded"
                            >
                                <span class="font-medium"
                                    >Two-Factor Authentication</span
                                >
                                <ToggleButton
                                    v-model="formData.twoFactorEnabled"
                                    onLabel="ON"
                                    offLabel="OFF"
                                />
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Form Actions -->
            <div v-if="editMode" class="mt-6 flex justify-end gap-3">
                <Button
                    label="Discard Changes"
                    icon="pi pi-times"
                    class="p-button-outlined"
                    @click="resetForm"
                />
                <Button
                    type="submit"
                    label="Save Changes"
                    icon="pi pi-check"
                    class="p-button-success"
                />
            </div>
        </form>

        <!-- Change Password Dialog -->
        <Dialog
            v-model:visible="showPasswordDialog"
            header="Change Password"
            :modal="true"
        >
            <div class="grid gap-4">
                <div class="field">
                    <label class="block text-sm font-medium mb-2"
                        >Current Password</label
                    >
                    <Password
                        v-model="password.current"
                        toggleMask
                        class="w-full"
                        :feedback="false"
                    />
                </div>
                <div class="field">
                    <label class="block text-sm font-medium mb-2"
                        >New Password</label
                    >
                    <Password
                        v-model="password.new"
                        toggleMask
                        class="w-full"
                        :feedback="true"
                    />
                </div>
                <div class="field">
                    <label class="block text-sm font-medium mb-2"
                        >Confirm Password</label
                    >
                    <Password
                        v-model="password.confirm"
                        toggleMask
                        class="w-full"
                        :feedback="false"
                    />
                </div>
            </div>
            <template #footer>
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    @click="showPasswordDialog = false"
                    class="p-button-text"
                />
                <Button
                    label="Change Password"
                    icon="pi pi-check"
                    @click="handlePasswordChange"
                    class="p-button-success"
                />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { useToast } from "primevue/usetoast";
import { reactive, ref, watch } from "vue";

const toast = useToast();
const props = defineProps({
    user: {
        type: Object,
        required: true,
    },
});

const emit = defineEmits(["update-profile"]);

// Form states
const editMode = ref(false);
const showPasswordDialog = ref(false);
const originalData = ref({});

const formData = reactive({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    address: "",
    avatar: "/default-avatar.png",
    position: "Hotel Manager",
    twoFactorEnabled: false,
});

const password = reactive({
    current: "",
    new: "",
    confirm: "",
});

// Initialize form with user data
watch(
    () => props.user,
    (newUser) => {
        Object.assign(formData, newUser);
        originalData.value = { ...newUser };
    },
    { immediate: true }
);

// Methods
const toggleEditMode = () => {
    editMode.value = !editMode.value;
    if (!editMode.value) resetForm();
};

const resetForm = () => {
    Object.assign(formData, originalData.value);
    editMode.value = false;
};

const handleSubmit = async () => {
    try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        emit("update-profile", formData);
        originalData.value = { ...formData };
        editMode.value = false;

        toast.add({
            severity: "success",
            summary: "Profile Updated",
            detail: "Your profile changes have been saved",
            life: 3000,
        });
    } catch (error) {
        toast.add({
            severity: "error",
            summary: "Update Failed",
            detail: error.message,
            life: 5000,
        });
    }
};

const handleFileUpload = (event) => {
    const file = event.files[0];
    if (file) {
        formData.avatar = URL.createObjectURL(file);
    }
};

const handlePasswordChange = async () => {
    if (password.new !== password.confirm) {
        toast.add({
            severity: "error",
            summary: "Password Mismatch",
            detail: "New passwords do not match",
            life: 5000,
        });
        return;
    }

    try {
        // Simulate password change API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        showPasswordDialog.value = false;
        toast.add({
            severity: "success",
            summary: "Password Changed",
            detail: "Your password has been updated successfully",
            life: 3000,
        });
    } catch (error) {
        toast.add({
            severity: "error",
            summary: "Password Change Failed",
            detail: error.message,
            life: 5000,
        });
    }
};
</script>

<style scoped>
.profile-details-container {
    @apply p-6 bg-white rounded-lg shadow;
}

:deep(.p-card) {
    @apply bg-white rounded-lg shadow;
}

:deep(.p-card-title) {
    @apply text-lg font-semibold mb-4 text-gray-800;
}

.field {
    @apply mb-4;
}

:deep(.p-password-input) {
    @apply w-full;
}
</style>
