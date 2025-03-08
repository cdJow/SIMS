<script setup>
import { AccountService } from "@/service/AccountService";
import { Button, Dialog, InputText, Tag } from "primevue";
import { useToast } from "primevue/usetoast"; // Import useToast
import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    onUnmounted,
    ref,
} from "vue";

// Fetch accounts from AccountService
const accounts = ref(AccountService.getAccounts());

const roles = [
    { label: "Front Desk", value: "Super Admin" },
    { label: "Manager", value: "Moderator" },
    { label: "System Admin", value: "Auditor" },
    { label: "Inventory", value: "Stock Manager" }, // Added Inventory role
];

const statuses = [
    { label: "Active", value: "Active" },
    { label: "Locked", value: "Locked" },
    { label: "Disabled", value: "Disabled" },
];

// Date and time handling
const currentTime = ref("");
let timeInterval;

// Lifecycle hooks
onMounted(() => {
    timeInterval = setInterval(() => {
        currentTime.value = new Date().toLocaleTimeString();
    }, 1000);
});

onBeforeUnmount(() => {
    clearInterval(timeInterval);
});
const isEditDialogVisible = ref(false);
const isEditing = ref(false);
const accountForm = ref({});
const isDetailsDialogVisible = ref(false); // Account details dialog visibility

// State variables
const isDeleteDialogVisible = ref(false);
const accountToDelete = ref(null);

const currentPassword = ref("");

const selectedAccount = ref(null);

const isResetPasswordDialogVisible = ref(false);
const newPassword = ref("");

// Automatically update the time every second
onMounted(() => {
    updateCurrentDate();
    const interval = setInterval(updateCurrentDate, 1000);

    // Cleanup interval on unmount
    onUnmounted(() => clearInterval(interval));
});

const calendarEvents = ref([]); // List of events to display on the calendar

// Update current date every second
function updateCurrentDate() {
    const now = new Date();
    currentTime.value = now.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });
}

// Dummy logs data
const logs = ref([
    { date: new Date(2024, 0, 1), action: "login", timestamp: "09:00:00" },
    { date: new Date(2024, 0, 1), action: "logout", timestamp: "17:30:00" },
    { date: new Date(2024, 0, 2), action: "login", timestamp: "08:45:00" },
    { date: new Date(2024, 0, 2), action: "logout", timestamp: "16:15:00" },
    { date: new Date(2024, 0, 5), action: "login", timestamp: "10:00:00" },
    { date: new Date(2024, 0, 5), action: "logout", timestamp: "18:00:00" },
]);

// Event filter
const selectedFilter = ref(null);
const eventTypes = ref([
    { label: "All", value: null },
    { label: "Login", value: "login" },
    { label: "Logout", value: "logout" },
]);

// Formatting functions
const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const closeResetPasswordDialog = () => {
    isResetPasswordDialogVisible.value = false;
    currentPassword.value = ""; // Reset current password
    newPassword.value = ""; // Reset new password
};

const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(":");
    return new Date(0, 0, 0, hours, minutes).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });
};

// Filtered logs
const filteredLogs = computed(() => {
    return logs.value
        .filter(
            (log) =>
                !selectedFilter.value?.value ||
                log.action === selectedFilter.value.value
        )
        .sort((a, b) => b.date - a.date);
});

// Group logs by date
const groupedLogs = computed(() => {
    return filteredLogs.value.reduce((groups, log) => {
        const dateKey = log.date.toDateString();
        if (!groups[dateKey]) {
            groups[dateKey] = {
                date: log.date,
                entries: [],
            };
        }
        groups[dateKey].entries.push(log);
        return groups;
    }, {});
});

// Map mock events to PrimeVue's calendar events format
onMounted(() => {
    updateCurrentDate();
    setInterval(updateCurrentDate, 1000);

    calendarEvents.value = mockEvents.map((event) => ({
        date: new Date(event.date),
        activities: event.activities,
    }));
});

// Handle date selection

// Open the reset password dialog// In script setup
const passwordInputRef = ref(null);

function openResetPasswordDialog(account) {
    selectedAccount.value = account;
    isResetPasswordDialogVisible.value = true;

    nextTick(() => {
        // Add a 50ms delay to ensure PrimeVue's dialog finishes rendering
        setTimeout(() => {
            if (passwordInputRef.value?.$el) {
                passwordInputRef.value.$el.focus();
            }
        }, 50);
    });
}
// Close the reset password dialog

// Confirm Reset Password
const confirmResetPassword = async () => {
    if (!currentPassword.value || !newPassword.value) return;

    try {
        // First verify current password
        const isValid = await currentPassword(
            selectedAccount.value.id,
            currentPassword.value
        );

        if (isValid) {
            // Proceed with password reset
            await resetPassword(selectedAccount.value.id, newPassword.value);
            closeResetPasswordDialog();
            toast.add({
                severity: "success",
                summary: "Success",
                detail: "Password updated",
                life: 3000,
            });
        } else {
            toast.add({
                severity: "error",
                summary: "Error",
                detail: "Current password is incorrect",
                life: 3000,
            });
        }
    } catch (error) {
        toast.add({
            severity: "error",
            summary: "Error",
            detail: "Password update failed",
            life: 3000,
        });
    }
};

// State variables

const toast = useToast();

// Function to open the details dialog
function openDetailsDialog(account) {
    selectedAccount.value = account; // Set the selected account
    isDetailsDialogVisible.value = true; // Open the dialog
}

// Open Calendar
function openCalendar() {
    isCalendarDialogVisible.value = true;
}

// Generate calendar days

// Show popover

// Open Delete Dialog
function openDeleteDialog(account) {
    accountToDelete.value = account;
    isDeleteDialogVisible.value = true;
}

// Close Delete Dialog
function closeDeleteDialog() {
    isDeleteDialogVisible.value = false;
    accountToDelete.value = null;
}

// Confirm Delete Account
function confirmDeleteAccount() {
    if (accountToDelete.value) {
        // Perform deletion logic
        console.log(`Deleted account: ${accountToDelete.value.name}`);

        // Simulate removing from the list
        accounts.value = accounts.value.filter(
            (acc) => acc.id !== accountToDelete.value.id
        );

        // Show success toast
        toast.add({
            severity: "success",
            summary: "Account Deleted",
            detail: `Account "${accountToDelete.value.name}" has been deleted successfully.`,
            life: 3000,
        });
    }

    closeDeleteDialog();
}

// Utility function to generate a random password
function generatePassword() {
    const length = 12;
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    accountForm.value.password = password;
}

const isAddDialogVisible = ref(false);

// Close Add Dialog
function closeAddDialog() {
    isAddDialogVisible.value = false;
}

// Close Add Dialog
function closeEditDialog() {
    isEditDialogVisible.value = false;
}

function addAccount() {
    accounts.value.push({
        ...accountForm.value,
        id: accounts.value.length + 1, // Generate a new ID
    });

    // Show success toast
    toast.add({
        severity: "success",
        summary: "Account Created",
        detail: `Account "${accountForm.value.name}" has been created successfully.`,
        life: 3000,
    });

    closeAddDialog();
}

// Add New User Handler
function openAddUserDialog() {
    accountForm.value = {
        name: "",
        email: "",
        password: "",
        role: roles[0], // Default role
        status: statuses[0], // Default status
    };
    isAddDialogVisible.value = true;
}

// Edit User Handler
function openEditDialog(account) {
    accountForm.value = {
        ...account,
        role: roles.find((r) => r.value === account.role.value) || roles[0],
        status:
            statuses.find((s) => s.value === account.status.value) ||
            statuses[0],
    };
    isEditing.value = true;
    isEditDialogVisible.value = true;
}

// Save User Handler
function saveAccount() {
    if (isEditing.value) {
        const index = accounts.value.findIndex(
            (account) => account.id === accountForm.value.id
        );

        if (index !== -1) {
            // Create a NEW object to trigger reactivity
            accounts.value[index] = {
                ...accountForm.value,
                role: { ...accountForm.value.role },
                status: { ...accountForm.value.status },
            };

            // Add log entry directly to the updated account
            accounts.value[index].logs.push({
                action: "Account Edited",
                timestamp: new Date().toLocaleString(),
            });
        }

        toast.add({
            severity: "success",
            summary: "Account Updated",
            detail: `Account "${accountForm.value.name}" updated`,
            life: 3000,
        });
    } else {
        // Add new user logic
        accounts.value.push({
            ...accountForm.value,
            id: accounts.value.length + 1, // Generate a new ID
            role: { ...accountForm.value.role }, // Ensure role is an object
            status: { ...accountForm.value.status }, // Ensure status is an object
        });

        // Show success toast
        toast.add({
            severity: "success",
            summary: "Account Created",
            detail: `Account "${accountForm.value.name}" has been created successfully.`,
            life: 3000,
        });
    }
    isEditDialogVisible.value = false; // Close the dialog
}

// Utility function to get status severity
function getAccountStatusSeverity(statusValue) {
    switch (statusValue) {
        case "Active":
            return "success"; // Green
        case "Locked":
            return "warn"; // Yellow
        case "Disabled":
            return "danger"; // Red
        default:
            return "info"; // Blue or default
    }
}

// Dialog visibility
const isCalendarDialogVisible = ref(false);

// Mock activity data
const mockEvents = [
    {
        date: "2023-12-05",
        activities: [
            { type: "Login", detail: "Logged in at 08:30 AM" },
            { type: "Logout", detail: "Logged out at 05:00 PM" },
        ],
    },
    {
        date: "2023-12-12",
        activities: [{ type: "Meeting", detail: "Team meeting at 03:00 PM" }],
    },
    {
        date: "2023-12-15",
        activities: [{ type: "Task", detail: "Project deadline" }],
    },
];

// Update the current time
function updateCurrentTime() {
    const now = new Date();
    currentTime.value = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

// Navigation

// Initialize
onMounted(() => {
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
});
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Accounts Management</div>

        <!-- Add New User Button -->
        <Button
            label="Add New User"
            icon="pi pi-plus"
            class="p-button-primary mb-4"
            @click="openAddUserDialog"
        />
        <div>
            <!-- Responsive Grid -->
            <div
                class="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
            >
                <div
                    v-for="(account, index) in accounts"
                    :key="account.id"
                    class="relative shadow-md border border-white rounded-xl p-4"
                >
                    <!-- Profile Image -->
                    <div
                        class="absolute top-4 right-4 w-24 h-24 bg-white rounded-full border border-slate-200 flex items-center justify-center"
                    >
                        <img
                            v-if="account.image"
                            :src="account.image"
                            alt="Profile Picture"
                            class="w-full h-full object-cover rounded-full"
                        />
                        <i v-else class="pi pi-user text-4xl"></i>
                    </div>

                    <!-- Account Info -->
                    <div>
                        <div class="text-lg font-bold">{{ account.name }}</div>
                        <div class="text-sm">{{ account.email }}</div>
                        <div class="text-sm mt-2">
                            <Tag :value="account.role.label" severity="info" />
                        </div>
                        <div class="text-sm mt-2">
                            <Tag
                                :value="account.status.label"
                                :severity="
                                    getAccountStatusSeverity(
                                        account.status.value
                                    )
                                "
                            />
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="mt-4 grid grid-cols-2 gap-2">
                        <Button
                            icon="pi pi-eye"
                            label="View Details"
                            class="p-button-primary text-xs"
                            @click="openDetailsDialog(account)"
                        ></Button>
                        <Button
                            label="Reset Password"
                            icon="pi pi-key"
                            class="p-button-warning text-xs"
                            @click="openResetPasswordDialog(account)"
                        />
                        <Button
                            icon="pi pi-pencil"
                            label="Edit"
                            class="p-button-primary text-xs"
                            @click="openEditDialog(account)"
                        ></Button>
                        <Button
                            icon="pi pi-trash"
                            label="Delete"
                            class="p-button-primary text-xs"
                            @click="openDeleteDialog(account)"
                        ></Button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Reset Password Dialog -->
    <Dialog
        v-model:visible="isResetPasswordDialogVisible"
        @hide="closeResetPasswordDialog"
        header="Reset Password"
        :dismissable-mask="true"
        :modal="true"
        :closable="true"
        :style="{ width: '30vw' }"
    >
        <div v-if="selectedAccount">
            <p class="text-sm mb-4">
                You are resetting the password for
                <strong>{{ selectedAccount.name }}</strong
                >.
            </p>

            <!-- Current Password Input -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">
                    Current Password
                </label>
                <InputText
                    v-model="currentPassword"
                    type="password"
                    placeholder="Enter current password"
                    ref="passwordInputRef"
                    class="w-full"
                    @keyup.enter="confirmResetPassword"
                />
            </div>

            <!-- New Password Input -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">
                    New Password
                </label>
                <InputText
                    v-model="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    class="w-full"
                    @keyup.enter="confirmResetPassword"
                />
            </div>

            <div class="flex justify-end gap-2">
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    class="p-button-secondary"
                    @click="closeResetPasswordDialog"
                    :autoFocus="false"
                />
                <Button
                    label="Confirm Reset"
                    icon="pi pi-key"
                    class="p-button-warning"
                    :disabled="!currentPassword || !newPassword"
                    @click="confirmResetPassword"
                />
            </div>
        </div>
    </Dialog>

    <Dialog
        v-model:visible="isCalendarDialogVisible"
        header="Log History"
        :modal="true"
        :closable="true"
        :style="{ width: '40vw', height: '80vh' }"
    >
        <div class="flex flex-col h-full">
            <!-- Filter Section -->
            <div class="flex justify-between items-center mb-4">
                <Select
                    v-model="selectedFilter"
                    :options="eventTypes"
                    optionLabel="label"
                    placeholder="Filter by Log Type"
                    class="w-48"
                />
            </div>

            <!-- Logs List -->
            <div class="flex-1 overflow-auto">
                <div
                    v-for="(group, date) in groupedLogs"
                    :key="date"
                    class="mb-4"
                >
                    <div class="font-semibold bg-gray-100 p-2 rounded-t">
                        {{ formatDate(group.date) }}
                    </div>
                    <div class="border-x border-b rounded-b p-2">
                        <div
                            v-for="(log, index) in group.entries"
                            :key="index"
                            class="flex items-center justify-between py-2 border-b last:border-b-0"
                        >
                            <div class="flex items-center gap-2">
                                <span
                                    class="w-20 text-sm font-medium"
                                    :class="{
                                        'text-green-600':
                                            log.action === 'login',
                                        'text-red-600': log.action === 'logout',
                                    }"
                                >
                                    {{ log.action.toUpperCase() }}
                                </span>
                                <span class="text-sm">
                                    {{ formatTime(log.timestamp) }}
                                </span>
                            </div>
                            <span class="text-xs">
                                {{ log.date.toLocaleTimeString() }}
                            </span>
                        </div>
                    </div>
                </div>

                <div
                    v-if="Object.keys(groupedLogs).length === 0"
                    class="text-center py-4"
                >
                    No logs found for selected filter
                </div>
            </div>
        </div>
    </Dialog>

    <!-- Account Details Dialog -->
    <Dialog
        :dismissable-mask="true"
        v-model:visible="isDetailsDialogVisible"
        header="Account Details"
        :modal="true"
        :closable="true"
        :style="{ width: '40vw' }"
    >
        <div v-if="selectedAccount">
            <!-- Account Info -->
            <h3 class="text-lg font-semibold">{{ selectedAccount.name }}</h3>
            <p class="text-sm">{{ selectedAccount.email }}</p>
            <p class="text-sm mt-2">
                Role:
                <Tag :value="selectedAccount.role.label" severity="info" />
            </p>
            <p class="text-sm mt-2">
                Status:
                <Tag
                    :value="selectedAccount.status.label"
                    :severity="
                        getAccountStatusSeverity(selectedAccount.status.value)
                    "
                />
            </p>
            <p class="text-sm mt-2">
                <strong>Created At:</strong>
                {{ selectedAccount.dateCreated }}
            </p>

            <!-- Open Calendar Button -->
            <div class="mt-4">
                <Button
                    label="Open Logs"
                    icon="pi pi-calendar"
                    class="p-button-primary"
                    @click="openCalendar"
                />
            </div>
        </div>
    </Dialog>

    <!-- Add Account Dialog -->
    <Dialog
        v-model:visible="isAddDialogVisible"
        header="Add Account"
        :dismissable-mask="true"
        :modal="true"
        :closable="true"
        :style="{ width: '36vw' }"
    >
        <div>
            <!-- Name -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Name</label>
                <InputText
                    v-model="accountForm.name"
                    placeholder="Enter name"
                    class="w-full"
                />
            </div>

            <!-- Email -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Email</label>
                <InputText
                    v-model="accountForm.email"
                    class="w-full"
                    placeholder="Enter Email"
                />
            </div>

            <!-- Password -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Password</label>
                <div class="flex gap-2">
                    <InputText
                        v-model="accountForm.password"
                        type="password"
                        placeholder="Enter or generate password"
                        class="w-full"
                    />
                    <Button
                        label="Generate"
                        icon="pi pi-refresh"
                        class="p-button-secondary p-2"
                        @click="generatePassword"
                    />
                </div>
            </div>

            <!-- Image Upload -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2"
                    >Profile Picture</label
                >
                <input
                    type="file"
                    accept="image/*"
                    @change="onImageUpload"
                    class="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <div class="mt-2">
                    <img
                        v-if="accountForm.image"
                        :src="accountForm.image"
                        alt="Preview"
                        class="w-16 h-16 rounded-full object-cover"
                    />
                </div>
            </div>

            <!-- Role -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Role</label>
                <Select
                    placeholder="Select Role"
                    v-model="accountForm.role"
                    :options="roles"
                    optionLabel="label"
                    class="w-full"
                />
            </div>

            <!-- Status -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Status</label>
                <Select
                    v-model="accountForm.status"
                    :options="statuses"
                    optionLabel="label"
                    class="w-full"
                />
            </div>

            <!-- Dialog Actions -->
            <div class="flex justify-end gap-2">
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    class="p-button-secondary"
                    @click="closeAddDialog"
                />
                <Button
                    label="Add"
                    icon="pi pi-plus"
                    class="p-button-primary"
                    @click="addAccount"
                />
            </div>
        </div>
    </Dialog>

    <!-- Edit Account Dialog -->
    <Dialog
        :dismissable-mask="true"
        v-model:visible="isEditDialogVisible"
        header="Edit Account"
        :modal="true"
        :closable="true"
        :style="{ width: '30vw' }"
    >
        <div>
            <!-- Name -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Name</label>
                <InputText v-model="accountForm.name" class="w-full" />
            </div>

            <!-- Email -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Email</label>
                <InputText v-model="accountForm.email" class="w-full" />
            </div>

            <!-- Role -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Role</label>
                <Select
                    v-model="accountForm.role"
                    :options="roles"
                    optionLabel="label"
                    class="w-full"
                />
            </div>

            <!-- Status -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2">Status</label>
                <Select
                    v-model="accountForm.status"
                    :options="statuses"
                    optionLabel="label"
                    class="w-full"
                />
            </div>

            <!-- Dialog Actions -->
            <div class="flex justify-end gap-2">
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    class="p-button-secondary"
                    @click="closeEditDialog"
                />
                <Button
                    label="Save"
                    icon="pi pi-save"
                    class="p-button-primary"
                    @click="saveAccount"
                />
            </div>
        </div>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog
        :dismissable-mask="true"
        v-model:visible="isDeleteDialogVisible"
        :header="'Confirm Deletion'"
        :modal="true"
        :closable="true"
        :style="{ width: '30vw' }"
    >
        <div class="flex flex-col items-center">
            <p class="text-sm text-center mb-4">
                Are you sure you want to delete
                <strong class="text-red-500">{{ accountToDelete?.name }}</strong
                >? This action cannot be undone.
            </p>
            <div class="flex justify-end gap-2 w-full">
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    class="p-button-secondary"
                    @click="closeDeleteDialog"
                />
                <Button
                    label="Delete"
                    icon="pi pi-trash"
                    class="p-button-danger"
                    @click="confirmDeleteAccount"
                />
            </div>
        </div>
    </Dialog>
    <Toast />
</template>
