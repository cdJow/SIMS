<script setup>
import { AccountService } from "@/service/AccountService";
import { Button, Dialog, InputText, Tag } from "primevue";
import { useToast } from "primevue/usetoast"; // Import useToast
import { computed, onMounted, onUnmounted, ref } from "vue";

// Fetch accounts from AccountService
const accounts = ref(AccountService.getAccounts());

const roles = [
    { label: "Front Desk", value: "Super Admin" },
    { label: "Manager", value: "Moderator" },
    { label: "System Admin", value: "Auditor" },
];

const statuses = [
    { label: "Active", value: "Active" },
    { label: "Locked", value: "Locked" },
    { label: "Disabled", value: "Disabled" },
];

const isEditDialogVisible = ref(false);
const isEditing = ref(false);
const accountForm = ref({});
const isDetailsDialogVisible = ref(false); // Account details dialog visibility

// State variables
const isDeleteDialogVisible = ref(false);
const accountToDelete = ref(null);

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

// Open the reset password dialog
function openResetPasswordDialog(account) {
    selectedAccount.value = account;
    isResetPasswordDialogVisible.value = true;
}

// Close the reset password dialog
function closeResetPasswordDialog() {
    isResetPasswordDialogVisible.value = false;
    newPassword.value = ""; // Clear the password
}

// Confirm password reset
// Confirm Reset Password
function confirmResetPassword() {
    generatePassword(); // Generate a new password

    // Add log entry for the password reset
    selectedAccount.value.logs.push({
        action: "Password Reset",
        timestamp: new Date().toLocaleString(), // Add current date and time
    });

    // Notify admin via toast
    toast.add({
        severity: "success",
        summary: "Password Reset",
        detail: `Password reset for ${selectedAccount.value.name}`,
        life: 5000,
    });

    closeResetPasswordDialog();
}

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
            (acc) => acc.id !== accountToDelete.value.id,
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
        // Update user logic
        const index = accounts.value.findIndex(
            (account) => account.id === accountForm.value.id,
        );
        if (index !== -1) {
            accounts.value[index] = {
                ...accountForm.value,
                role: { ...accountForm.value.role },
                status: { ...accountForm.value.status },
            };
        }
        if (isEditing.value) {
            // Update account details
            const account = accounts.value.find(
                (acc) => acc.id === selectedAccount.value.id,
            );

            if (account) {
                Object.assign(account, selectedAccount.value); // Update details

                // Add log entry for edit
                account.logs.push({
                    action: "Account Edited",
                    timestamp: new Date().toLocaleString(),
                });
            }
        }

        // Show success toast
        toast.add({
            severity: "success",
            summary: "Account Updated",
            detail: `Account "${accountForm.value.name}" has been updated successfully.`,
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

// Current time
const currentTime = ref("");

// Navigation month and year
const selectedMonth = ref(new Date().getMonth());
const selectedYear = ref(new Date().getFullYear());

// Event filter
const eventTypes = [
    { label: "All Events", value: null },
    { label: "Login", value: "Login" },
    { label: "Logout", value: "Logout" },
    { label: "Meeting", value: "Meeting" },
    { label: "Task", value: "Task" },
];
const selectedFilter = ref(null);

// Days of the week
const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

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

// Compute the current month and year
const currentMonthYear = computed(() => {
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    return `${monthNames[selectedMonth.value]} ${selectedYear.value}`;
});

// Calendar data generation
const calendarDays = computed(() => {
    const firstDay = new Date(selectedYear.value, selectedMonth.value, 1);
    const lastDay = new Date(selectedYear.value, selectedMonth.value + 1, 0);

    const startDay = new Date(firstDay);
    startDay.setDate(firstDay.getDate() - firstDay.getDay());

    const endDay = new Date(lastDay);
    endDay.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

    const days = [];
    for (let d = new Date(startDay); d <= endDay; d.setDate(d.getDate() + 1)) {
        const dateString = d.toISOString().split("T")[0];
        days.push({
            date: d.getDate(),
            isCurrentMonth: d.getMonth() === selectedMonth.value,
            activities: mockEvents
                .filter((event) => event.date === dateString)
                .flatMap((event) => event.activities),
        });
    }

    return days;
});

// Filtered calendar days
const filteredCalendarDays = computed(() => {
    if (!selectedFilter.value) {
        return calendarDays.value;
    }
    return calendarDays.value.map((day) => ({
        ...day,
        activities: day.activities.filter(
            (activity) => activity.type === selectedFilter.value,
        ),
    }));
});

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
function navigateMonth(step) {
    selectedMonth.value += step;
    if (selectedMonth.value < 0) {
        selectedMonth.value = 11;
        selectedYear.value -= 1;
    } else if (selectedMonth.value > 11) {
        selectedMonth.value = 0;
        selectedYear.value += 1;
    }
}

// Popover handling
const popover = ref({
    visible: false,
    activities: [],
    x: 0,
    y: 0,
});

function showPopover(day, event) {
    if (!day.activities.length) return;

    popover.value = {
        visible: true,
        activities: day.activities,
        x: event.clientX + 10,
        y: event.clientY + 10,
    };
}

function hidePopover() {
    popover.value.visible = false;
}

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
                    :key="index"
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
                        <i v-else class="pi pi-user text-4xl text-gray-400"></i>
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
                                        account.status.value,
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
        header="Reset Password"
        :modal="true"
        :closable="true"
        :style="{ width: '30vw' }"
    >
        <div v-if="selectedAccount">
            <p class="text-sm">
                You are resetting the password for
                <strong>{{ selectedAccount.name }}</strong
                >.
            </p>
            <!-- New Password Input -->
            <div class="mt-4">
                <label class="block text-sm font-medium mb-2">
                    New Password
                </label>
                <InputText
                    v-model="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    class="w-full"
                />
            </div>
            <!-- Generate Password Button -->
            <div class="mt-2 flex justify-end">
                <Button
                    label="Generate Password"
                    icon="pi pi-refresh"
                    class="p-button-secondary"
                    @click="generatePassword"
                />
            </div>
            <div class="flex justify-end mt-4 gap-2">
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    class="p-button-secondary"
                    @click="closeResetPasswordDialog"
                />
                <Button
                    label="Confirm Reset"
                    icon="pi pi-key"
                    class="p-button-warning"
                    :disabled="!newPassword"
                    @click="confirmResetPassword"
                />
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
            <p class="text-sm text-gray-600">{{ selectedAccount.email }}</p>
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
                    label="Open Calendar"
                    icon="pi pi-calendar"
                    class="p-button-primary"
                    @click="openCalendar"
                />
            </div>
        </div>
    </Dialog>

    <!-- Account Calendar Logs Dialog -->

    <Dialog
        v-model:visible="isCalendarDialogVisible"
        header="Activity Calendar"
        :modal="true"
        :closable="true"
        :style="{ width: '90vw', height: '80vh' }"
    >
        <!-- Real-Time Date and Time -->
        <div class="flex justify-between items-center mb-4">
            <!-- Current Month and Time -->
            <div class="font-semibold">
                <p class="text-xl">{{ currentMonthYear }}</p>
                <p class="text-xs">Current Time: {{ currentTime }}</p>
            </div>

            <!-- Event Filter and Navigation -->
            <div class="flex gap-4">
                <!-- Event Filter -->
                <Select
                    v-model="selectedFilter"
                    :options="eventTypes"
                    optionLabel="label"
                    placeholder="Filter by Event Type"
                    class="w-48"
                />
                <!-- Navigation Buttons -->
                <div class="flex gap-2">
                    <Button
                        icon="pi pi-chevron-left"
                        class="p-button-outlined"
                        @click="navigateMonth(-1)"
                    />
                    <Button
                        icon="pi pi-chevron-right"
                        class="p-button-outlined"
                        @click="navigateMonth(1)"
                    />
                </div>
            </div>
        </div>

        <!-- Calendar Header -->
        <div class="grid grid-cols-7 text-center font-bold bg-gray-100 py-2">
            <div v-for="day in daysOfWeek" :key="day">{{ day }}</div>
        </div>

        <!-- Calendar Grid -->
        <div class="grid grid-cols-7 gap-1">
            <div
                v-for="(day, index) in filteredCalendarDays"
                :key="index"
                class="border rounded-lg p-2 h-28 relative"
                :class="{
                    'bg-gray-200': !day.isCurrentMonth,
                    'bg-white': day.isCurrentMonth,
                }"
                @mouseover="showPopover(day, $event)"
                @mouseleave="hidePopover"
            >
                <!-- Date Number -->
                <div class="text-sm font-bold mb-1 text-left">
                    {{ day.date || "" }}
                </div>

                <!-- Events -->
                <div v-if="day.activities.length" class="text-xs text-gray-700">
                    <ul>
                        <li
                            v-for="(activity, i) in day.activities"
                            :key="i"
                            class="truncate"
                        >
                            {{ activity.type }} - {{ activity.detail }}
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Popover -->
        <div
            v-if="popover.visible"
            class="absolute bg-white shadow-lg border p-4 rounded-lg z-50"
            :style="{ top: `${popover.y}px`, left: `${popover.x}px` }"
        >
            <h4 class="font-bold text-md mb-2">Event Details</h4>
            <ul>
                <li
                    v-for="(activity, index) in popover.activities"
                    :key="index"
                    class="text-sm"
                >
                    <strong>{{ activity.type }}:</strong> {{ activity.detail }}
                </li>
            </ul>
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
                    class="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
