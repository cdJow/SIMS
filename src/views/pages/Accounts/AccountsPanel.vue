<script setup>
import { Button, Dialog, InputText, Tag } from "primevue";
import MultiSelect from "primevue/multiselect";
import Select from "primevue/select";
import { useToast } from "primevue/usetoast";
import { computed, nextTick, onMounted, ref, watch, shallowRef } from "vue";
import {
    getUsers, addUser, updateUser, deleteUser,
    resetUserPassword, uploadUserImage, getUserLogs, adminResetUserPassword
} from "@/api/auth";
import { getCurrentUser } from "@/api/auth";
import { useCurrentUser } from "@/service/CurrentUser";

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const { setUser } = useCurrentUser();

const toast = useToast();
const ALLOWED_ROLES = ["Front Desk", "Manager", "System Admin", "Inventory"];

// Account list state with pagination
const accounts = shallowRef([]);
const loading = ref(false);
const searchQuery = ref("");
const currentPage = ref(1);
const itemsPerPage = ref(12);
const totalAccounts = ref(0);

// Computed properties for performance
const filteredAccounts = computed(() => {
  if (!searchQuery.value.trim()) {
    return accounts.value;
  }
  
  const query = searchQuery.value.toLowerCase();
  return accounts.value.filter(account => 
    account.name.toLowerCase().includes(query) ||
    account.email.toLowerCase().includes(query) ||
    account.role.label.toLowerCase().includes(query)
  );
});

const paginatedAccounts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredAccounts.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredAccounts.value.length / itemsPerPage.value);
});

const showPassword = ref(false);

const emailError = ref(""); // for Add
const editEmailError = ref(""); // for Edit


const nameError = ref("");         // for Add
const editNameError = ref("");

function validateNameInput() {
    if (!accountForm.value.name || accountForm.value.name.trim() === "") {
        nameError.value = "Name is required.";
    } else {
        nameError.value = "";
    }
}
function validateEditNameInput() {
    if (!accountForm.value.name || accountForm.value.name.trim() === "") {
        editNameError.value = "Name is required.";
    } else {
        editNameError.value = "";
    }
}

// Debounced search to improve performance
const debouncedSearch = debounce(() => {
  currentPage.value = 1; // Reset to first page when searching
}, 300);

// Watch search query with debouncing
watch(searchQuery, () => {
  debouncedSearch();
});

// Pagination functions
function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
}




// Options for roles/statuses
const roles = [
    { label: "Front Desk", value: "Front Desk" },
    { label: "Manager", value: "Manager" },
    { label: "System Admin", value: "System Admin" },
    { label: "Inventory", value: "Inventory" },
];


const statuses = [
    { label: "Active", value: "Active" },
    { label: "Locked", value: "Locked" },
    { label: "Disabled", value: "Disabled" },
];

// Fetch all users on mount with caching
let accountsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function loadAccounts(useCache = true) {
  loading.value = true;
  try {
    // Check cache first
    if (useCache && accountsCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      accounts.value = accountsCache;
      totalAccounts.value = accountsCache.length;
      loading.value = false;
      return;
    }

    const { data } = await getUsers();

    const processedAccounts = data
      .filter(acc => {
        const extras = Array.isArray(acc.roles) ? acc.roles : [];
        const all = [acc.role, ...extras].filter(Boolean);
        return all.some(r => ALLOWED_ROLES.includes(r));
      })
      .map(acc => ({
        ...acc,
        extraRoles: Array.isArray(acc.roles) ? acc.roles : [],
        role: roles.find(r => r.value === acc.role) || roles[0],
        status: statuses.find(s => s.value === acc.status) || statuses[0],
      }));

    // Cache the results
    accountsCache = processedAccounts;
    cacheTimestamp = Date.now();
    
    accounts.value = processedAccounts;
    totalAccounts.value = processedAccounts.length;
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: "Failed to fetch users", life: 3000 });
  }
  loading.value = false;
}






// Dialog states, form state, etc (your original logic retained)
const isEditDialogVisible = ref(false);
const isEditing = ref(false);
const accountForm = ref({});
const isDetailsDialogVisible = ref(false);
const isAddDialogVisible = ref(false);
const isDeleteDialogVisible = ref(false);
const accountToDelete = ref(null);
const selectedAccount = ref(null);
const isResetPasswordDialogVisible = ref(false);
const currentPassword = ref("");
const newPassword = ref("");
const passwordInputRef = ref(null);
const isCalendarDialogVisible = ref(false);
const userLogs = ref([]);
const selectedFilter = ref(null);
const eventTypes = ref([
    { label: "All", value: null },
    { label: "Login", value: "login" },
    { label: "Logout", value: "logout" },
]);

// For image uploads
const previewImageUrl = ref(null);
function onImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        previewImageUrl.value = URL.createObjectURL(file);
        accountForm.value.image = file;
    }
}

// Add user
async function addAccount() {
    validateNameInput();
    validateEmailInput();
    if (emailError.value) return;
    
    try {
        // Only send fields needed for initial user creation
        let payload = {
            name: accountForm.value.name,
            email: accountForm.value.email,
            password: accountForm.value.password,
            role: accountForm.value.role.value,
            status: "Active"
        };
        
        // POST to backend (user created, returns ID)
        const { data } = await addUser(payload);

        // Only now, upload the image if provided
        if (accountForm.value.image && data.id) {
            let formData = new FormData();
            formData.append("image", accountForm.value.image);
            await uploadUserImage(data.id, formData);
        }

        toast.add({ severity: "success", summary: "Success", detail: "Account Created", life: 3000 });
        isAddDialogVisible.value = false;
        
        // Clear cache and reload
        accountsCache = null;
        await loadAccounts(false);
    } catch (err) {
        toast.add({
            severity: "error",
            summary: "Error",
            detail: err.response?.data?.message || "Failed to add user",
            life: 3000
        });
    }
}


function openResetPasswordDialog(account) {
  selectedAccount.value = account;
  isResetPasswordDialogVisible.value = true;
  newPassword.value = "";
  nextTick(() => setTimeout(() => {
    // Check if any element already has focus before trying to focus
    if (!document.activeElement || document.activeElement === document.body) {
      passwordInputRef.value?.$el?.focus();
    }
  }, 50));
}

async function confirmResetPassword() {
  if (!newPassword.value) {
    toast.add({ severity: "warn", summary: "Missing", detail: "Enter new password", life: 3000 });
    return;
  }
  try {
    await adminResetUserPassword(selectedAccount.value.id, { new_password: newPassword.value });
    toast.add({ severity: "success", summary: "Success", detail: "Password reset.", life: 3000 });
    isResetPasswordDialogVisible.value = false;
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: err.response?.data?.message || "Failed", life: 3000 });
  }
}


// Edit user
function openEditDialog(account) {
  const primaryValue = account.role?.value || account.role;

  accountForm.value = {
    ...account,
    role: roles.find((r) => r.value === primaryValue) || roles[0], // PRIMARY (editable)
    status:
      statuses.find((s) => s.value === (account.status?.value || account.status)) ||
      statuses[0],
    // Additional roles (array) - exclude current primary
    extraRoles: (Array.isArray(account.roles) ? account.roles : []).filter(
      (r) => r !== primaryValue
    ),
  };

  isEditing.value = true;
  isEditDialogVisible.value = true;

  previewImageUrl.value = account.image_url
    ? `http://localhost:5000/uploads/users/${account.image_url}`
    : null;
}

watch(
  () => accountForm.value.role,
  (newRoleObj) => {
    if (!newRoleObj || !accountForm.value?.extraRoles) return;
    const newPrimary = newRoleObj.value;
    accountForm.value.extraRoles = accountForm.value.extraRoles.filter(
      (r) => r !== newPrimary
    );
  }
);

async function saveAccount() {
  if (!isEditing.value) return;
  validateEditNameInput();
  validateEditEmailInput();
  if (editEmailError.value) return;

  try {
    const editedId = accountForm.value.id;

    const payload = {
      name: accountForm.value.name,
      email: accountForm.value.email,
      status: accountForm.value.status.value,
      role: accountForm.value.role.value,
      roles: accountForm.value.extraRoles || [],
    };

    await updateUser(editedId, payload);

    if (accountForm.value.image) {
      const formData = new FormData();
      formData.append("image", accountForm.value.image);
      await uploadUserImage(editedId, formData);
    }

    const loggedId = Number(localStorage.getItem("userId") || 0);
    if (loggedId && Number(editedId) === loggedId) {
      try {
        const { data: res } = await getCurrentUser(loggedId);
        setUser(res.user);
      } catch {}
    }

    toast.add({
      severity: "success",
      summary: "Success",
      detail: "Account Updated",
      life: 3000,
    });
    isEditDialogVisible.value = false;
    
    // Clear cache and reload
    accountsCache = null;
    await loadAccounts(false);
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: err.response?.data?.message || "Failed to update user",
      life: 3000,
    });
  }
}


// Delete user
function openDeleteDialog(account) {
    accountToDelete.value = account;
    isDeleteDialogVisible.value = true;
}
async function confirmDeleteAccount() {
    try {
        await deleteUser(accountToDelete.value.id);
        toast.add({ severity: "success", summary: "Success", detail: "Account Deleted", life: 3000 });
        
        // Clear cache and reload
        accountsCache = null;
        await loadAccounts(false);
    } catch (err) {
        toast.add({ severity: "error", summary: "Error", detail: "Failed to delete user", life: 3000 });
    }
    isDeleteDialogVisible.value = false;
    accountToDelete.value = null;
}

// Add new user
function openAddUserDialog() {
    accountForm.value = {
        name: "",
        email: "",
        password: "",
        role: roles[0],
    };
    isAddDialogVisible.value = true;
    previewImageUrl.value = null;
}



// Details dialog
function openDetailsDialog(account) {
    selectedAccount.value = account;
    isDetailsDialogVisible.value = true;
    // Load user logs if API exists
    userLogs.value = [];
    getUserLogs(account.id)
        .then(({ data }) => userLogs.value = data)
        .catch(() => userLogs.value = []);
}
function openCalendar() { isCalendarDialogVisible.value = true; }

// Password generator
function generatePassword() {
    const length = 12;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < length; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
    accountForm.value.password = password;
}

// Status tag color
function getAccountStatusSeverity(statusValue) {
    switch (statusValue) {
        case "Active": return "success";
        case "Locked": return "warn";
        case "Disabled": return "danger";
        default: return "info";
    }
}


function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validateEmailInput() {
    if (!accountForm.value.email) {
        emailError.value = "Email is required.";
    } else if (!isValidEmail(accountForm.value.email)) {
        emailError.value = "Please enter a valid email address.";
    } else {
        emailError.value = "";
    }
}


function validateEditEmailInput() {
    if (!accountForm.value.email) {
        editEmailError.value = "Email is required.";
    } else if (!isValidEmail(accountForm.value.email)) {
        editEmailError.value = "Please enter a valid email address.";
    } else {
        editEmailError.value = "";
    }
}


// Log filtering (if using logs API, adapt for actual log shape)
const filteredLogs = computed(() => {
    return userLogs.value
        .filter((log) =>
            !selectedFilter.value?.value || log.action === selectedFilter.value.value
        )
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
});
const groupedLogs = computed(() => {
    return filteredLogs.value.reduce((groups, log) => {
        const dateKey = new Date(log.timestamp).toDateString();
        if (!groups[dateKey]) groups[dateKey] = { date: new Date(log.timestamp), entries: [] };
        groups[dateKey].entries.push(log);
        return groups;
    }, {});
});

// Date formatting
const formatDate = (date) => new Date(date).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

// Dialog closes
function closeAddDialog() { isAddDialogVisible.value = false; }
function closeEditDialog() { isEditDialogVisible.value = false; }
function closeResetPasswordDialog() { isResetPasswordDialogVisible.value = false; }
function closeDeleteDialog() { isDeleteDialogVisible.value = false; accountToDelete.value = null; }

// On mount, fetch accounts
onMounted(loadAccounts);
</script>
<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4 text-gray-900 dark:text-gray-100">Accounts Management</div>

        <!-- Controls Section -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <!-- Search Bar -->
            <div class="flex-1 max-w-md">
                <div class="relative">
                    <InputText
                        v-model="searchQuery"
                        placeholder="Search accounts..."
                        class="w-full pl-10"
                    />
                    <i class=" absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                </div>
            </div>
            
            <!-- Add New User Button -->
            <Button
                label="Add New User"
                icon="pi pi-plus"
                class="p-button-primary"
                @click="openAddUserDialog"
            />
        </div>
        
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
            <i class="pi pi-spin pi-spinner text-2xl text-blue-500"></i>
            <p class="mt-2 text-gray-600 dark:text-gray-300">Loading accounts...</p>
        </div>
        
        <!-- Results Info -->
        <div v-else class="mb-4 text-sm text-gray-600 dark:text-gray-300">
            Showing {{ paginatedAccounts.length }} of {{ filteredAccounts.length }} accounts
            <span v-if="searchQuery">(filtered from {{ totalAccounts }} total)</span>
        </div>
        
        <div v-if="!loading">
            <!-- Responsive Grid -->
            <div
                class="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
            >
                <div
                    v-for="(account, index) in paginatedAccounts"
                    :key="account.id"
                    class="relative shadow-md border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-white dark:bg-gray-800"
                >
                    <!-- Profile Image -->
                    <div
                        class="absolute top-4 right-4 w-24 h-24 bg-white dark:bg-gray-700 rounded-full border border-slate-200 dark:border-slate-600 flex items-center justify-center"
                    >
                      <img v-if="account.image_url"
     :src="`http://localhost:5000/uploads/users/${account.image_url}`"
     alt="Profile Picture"
     class="w-full h-full object-cover rounded-full"
/>
                        <i v-else class="pi pi-user text-4xl text-gray-400 dark:text-gray-300"></i>
                    </div>

                    <!-- Account Info -->
                    <div>
                        <div class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ account.name }}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-300">{{ account.email }}</div>
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
            
            <!-- Pagination Controls -->
            <div v-if="totalPages > 1" class="flex justify-center items-center mt-8 gap-2">
                <Button
                    icon="pi pi-angle-left"
                    class="p-button-outlined p-button-sm"
                    @click="prevPage"
                    :disabled="currentPage === 1"
                />
                
                <span class="mx-4 text-sm text-gray-600 dark:text-gray-300">
                    Page {{ currentPage }} of {{ totalPages }}
                </span>
                
                <Button
                    icon="pi pi-angle-right"
                    class="p-button-outlined p-button-sm"
                    @click="nextPage"
                    :disabled="currentPage === totalPages"
                />
            </div>
            
            <!-- No Results -->
            <div v-if="filteredAccounts.length === 0 && searchQuery" class="text-center py-8">
                <i class="pi pi-search text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
                <p class="text-gray-500 dark:text-gray-400">No accounts found matching "{{ searchQuery }}"</p>
                <Button
                    label="Clear Search"
                    icon="pi pi-times"
                    class="p-button-text mt-2"
                    @click="searchQuery = ''"
                />
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
    <div v-if="selectedAccount" class="text-gray-800 dark:text-gray-200">
        <p class="text-sm mb-4">
            You are resetting the password for
            <strong>{{ selectedAccount.name }}</strong>.
        </p>
        <!-- New Password Only -->
        <div class="mb-4">
            <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                New Password
            </label>
            <InputText
                v-model="newPassword"
                type="password"
                placeholder="Enter new password"
                class="w-full"
                ref="passwordInputRef"
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
                :disabled="!newPassword"
                @click="confirmResetPassword"
            />
        </div>
    </div>
</Dialog>

    <Dialog
    v-model:visible="isCalendarDialogVisible"
    header="Log History"
    :dismissable-mask="true"
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
                <!-- Group Date -->
                <div
                  class="font-semibold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 p-2 rounded-t transition-all"
                >
                    {{ formatDate(group.date) }}
                </div>
                <div class="border-x border-b border-slate-200 dark:border-slate-700 rounded-b p-2 bg-white dark:bg-gray-900 transition-all">
                    <div
                        v-for="(log, index) in group.entries"
                        :key="index"
                        class="flex items-center justify-between py-2 border-b last:border-b-0 border-slate-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                        <div class="flex items-center gap-2">
                            <span
                              class="w-36 text-xs font-bold tracking-wide px-2 rounded transition-colors"
                              :class="{
                                'text-green-600 dark:text-green-400': log.action === 'login',
                                'text-red-600 dark:text-red-400': log.action === 'logout',
                                'text-blue-700 dark:text-blue-400': log.action === 'admin_reset_password',
                                'text-yellow-700 dark:text-yellow-400': log.action === 'reset_password'
                              }"
                            >
                              <template v-if="log.action === 'admin_reset_password'">ADMIN RESET PASSWORD</template>
                              <template v-else-if="log.action === 'reset_password'">RESET PASSWORD</template>
                              <template v-else>{{ log.action.toUpperCase() }}</template>
                            </span>
                            <span class="text-sm truncate min-w-20 ml-2 text-gray-800 dark:text-gray-200 transition-colors">
                                {{ formatTime(log.timestamp) }}
                            </span>
                        </div>
                        <span class="text-xs text-gray-600 dark:text-gray-400">
                            {{ new Date(log.timestamp).toLocaleTimeString() }}
                        </span>
                    </div>
                </div>
            </div>

            <div
                v-if="Object.keys(groupedLogs).length === 0"
                class="text-center py-4 text-gray-500 dark:text-gray-400"
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
        <div v-if="selectedAccount" class="text-gray-800 dark:text-gray-200">
            <!-- Account Info -->
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ selectedAccount.name }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-300">{{ selectedAccount.email }}</p>
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
        <div class="text-gray-800 dark:text-gray-200">
            <!-- Name -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Name</label>
                <InputText
        v-model="accountForm.name"
        placeholder="Enter name"
        class="w-full"
        @blur="validateNameInput"
        @input="validateNameInput"
    />
    <span v-if="nameError" class="text-xs text-red-500 mt-1 block">{{ nameError }}</span>
            </div>

            <!-- Email -->
            <div class="mb-4">
    <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Email</label>
    <InputText
        v-model="accountForm.email"
        class="w-full"
        placeholder="Enter Email"
        type="email"
        @blur="validateEmailInput"
        @input="validateEmailInput"
    />
    <span v-if="emailError" class="text-xs text-red-500 mt-1 block">{{ emailError }}</span>
</div>


            <!-- Password -->
            <div class="mb-4">
    <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Password</label>
    <div class="flex gap-2 items-center">
        <InputText
            v-model="accountForm.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Enter or generate password"
            class="w-full"
        />
        <Button
            :icon="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
            class="p-button-secondary p-2"
            @click="showPassword = !showPassword"
            type="button"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
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
                <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
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
    v-if="previewImageUrl"
    :src="previewImageUrl"
    alt="Preview"
    class="w-16 h-16 rounded-full object-cover"
/>

                </div>
            </div>

            <!-- Role -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Role</label>
                <Select
                    placeholder="Select Role"
                    v-model="accountForm.role"
                    :options="roles"
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
    <div class="text-gray-800 dark:text-gray-200">
        <!-- Name -->
        <div class="mb-4">
            <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Name</label>
               <InputText
        v-model="accountForm.name"
        placeholder="Enter name"
        class="w-full"
        @blur="validateEditNameInput"
        @input="validateEditNameInput"
    />
    <span v-if="editNameError" class="text-xs text-red-500 mt-1 block">{{ editNameError }}</span>
        </div>

        <!-- Email -->
       <div class="mb-4">
    <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Email</label>
    <InputText
        v-model="accountForm.email"
        class="w-full"
        placeholder="Enter Email"
        type="email"
        @blur="validateEditEmailInput"
        @input="validateEditEmailInput"
    />
    <span v-if="editEmailError" class="text-xs text-red-500 mt-1 block">{{ editEmailError }}</span>
</div>


       <!-- Primary Role (read-only) -->
<div class="mb-4">
  <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Primary Role</label>
  <Select
    v-model="accountForm.role"
    :options="roles"
    optionLabel="label"
    class="w-full"
    placeholder="Select primary role"
  />
</div>

<!-- Additional Roles -->
<div class="mb-4">
  <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Additional Roles</label>
  <MultiSelect
    v-model="accountForm.extraRoles"
    :options="roles.filter(r => r.value !== accountForm.role.value)"
    optionLabel="label"
    optionValue="value"
    placeholder="Assign additional roles"
    display="chip"
    class="w-full"
    :maxSelectedLabels="4"
  />
</div>


         <!-- Image Upload -->
        <div class="mb-4">
            <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Profile Picture</label>
            <input
                type="file"
                accept="image/*"
                @change="onImageUpload"
                class="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />

            <div class="mt-2">
                <img
                    v-if="previewImageUrl"
                    :src="previewImageUrl"
                    alt="Preview"
                    class="w-16 h-16 rounded-full object-cover"
                />
                <img
                    v-else-if="accountForm.image_url"
                    :src="`http://localhost:5000/uploads/users/${accountForm.image_url}`"
                    alt="Profile"
                    class="w-16 h-16 rounded-full object-cover"
                />
            </div>
        </div>


        <!-- Status -->
        <div class="mb-4">
            <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Status</label>
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
        <div class="flex flex-col items-center text-gray-800 dark:text-gray-200">
            <p class="text-sm text-center mb-4">
                Are you sure you want to delete
                <strong class="text-red-500 dark:text-red-400">{{ accountToDelete?.name }}</strong
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
