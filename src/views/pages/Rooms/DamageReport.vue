<script setup>
import { computed, ref, onMounted } from "vue";
import { 
    fetchRoomsForDamageReport, 
    fetchRoomAmenitiesWithDamageStatus, 
    createDamageReport, 
    removeDamageReport,
    updateDamageReport,
    exportDamageReports,
    exportRoomDamageReports
} from "@/api/auth";
import { useToast } from "primevue/usetoast";

const toast = useToast();
const rooms = ref([]);

const selectedRoom = ref({});
const showAmenitiesDialog = ref(false);
const showDamageDialog = ref(false);
const selectedItem = ref(null);
const damageReport = ref({ damage_description: "", notes: "" });
const loading = ref(false);
const amenitiesLoading = ref(false);

const damagedItems = computed(
    () => selectedRoom.value.amenities?.filter((item) => item.is_damaged) || []
);

// Methods
const loadRooms = async () => {
    try {
        loading.value = true;
        const response = await fetchRoomsForDamageReport();
        rooms.value = response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.error || error.message || "Failed to load rooms";
        toast.add({
            severity: "error",
            summary: "Error",
            detail: errorMessage,
            life: 5000,
        });
    } finally {
        loading.value = false;
    }
};

const selectRoom = async (room) => {
    try {
        amenitiesLoading.value = true;
        const response = await fetchRoomAmenitiesWithDamageStatus(room.id);
        selectedRoom.value = { 
            ...room, 
            amenities: response.data 
        };
        showAmenitiesDialog.value = true;
    } catch (error) {
        toast.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to load room amenities",
            life: 3000,
        });
    } finally {
        amenitiesLoading.value = false;
    }
};

const openDamageReport = (item) => {
    selectedItem.value = item;
    damageReport.value = { damage_description: "", notes: "" };
    showDamageDialog.value = true;
};

const submitDamageReport = async () => {
    if (!damageReport.value.damage_description.trim()) {
        toast.add({
            severity: "warn",
            summary: "Validation Error",
            detail: "Please describe the damage",
            life: 3000,
        });
        return;
    }

    try {
        const reportData = {
            room_id: selectedRoom.value.id,
            serial_id: selectedItem.value.serial_id,
            item_name: selectedItem.value.item_name,
            damage_description: damageReport.value.damage_description,
            notes: damageReport.value.notes
        };

        await createDamageReport(reportData);
        
        toast.add({
            severity: "success",
            summary: "Success",
            detail: "Damage report created successfully",
            life: 3000,
        });
        
        // Refresh the amenities for this room
        await selectRoom(selectedRoom.value);
        
        // Refresh the rooms list to update damage count
        await loadRooms();
        
        cancelDamageReport();
    } catch (error) {
        toast.add({
            severity: "error",
            summary: "Error", 
            detail: error.response?.data?.error || "Failed to create damage report",
            life: 3000,
        });
    }
};

const removeDamageReportItem = async (item) => {
    try {
        const response = await removeDamageReport(item.damage_report_id);
        
        // Get the response data for better feedback
        const responseData = response.data;
        const itemStatus = responseData.item_status || 'available';
        const itemName = responseData.item_name || 'Item';
        
        // Show status message indicating no status change
        const statusMessage = ` - ${itemName} status remains: ${itemStatus}`;
        
        toast.add({
            severity: "success",
            summary: "Damage Resolved",
            detail: `Damage report resolved successfully${statusMessage}`,
            life: 4000,
        });
        
        // Refresh the amenities for this room
        await selectRoom(selectedRoom.value);
        
        // Refresh the rooms list to update damage count
        await loadRooms();
    } catch (error) {
        toast.add({
            severity: "error",
            summary: "Error",
            detail: error.response?.data?.error || "Failed to resolve damage report",
            life: 3000,
        });
    }
};

const cancelDamageReport = () => {
    showDamageDialog.value = false;
    damageReport.value = { damage_description: "", notes: "" };
    selectedItem.value = null;
};

// Test function to check API connectivity
const testAPI = async () => {
    try {
        const response = await fetch('http://127.0.0.1:5000/damage-reports/test');
        const data = await response.json();
    } catch (error) {
        // API test failed silently
    }
};

// Load rooms on component mount
onMounted(() => {
    testAPI();
    loadRooms();
});

const getStatusSeverity = (status) => {
    switch (status.toLowerCase()) {
        case "occupied":
            return "danger";
        case "cleaning":
            return "warning";
        case "available":
            return "success";
        default:
            return "info";
    }
};

const searchQuery = ref("");
const selectedStatuses = ref([]);
const roomTypes = ref(["Standard", "Deluxe", "Suite"]); // Example room types
const selectedRoomType = ref("");

// Update filteredRooms computed property
const filteredRooms = computed(() => {
    return rooms.value.filter((room) => {
        const matchesSearch = room.room_number
            .toString()
            .toLowerCase()
            .includes(searchQuery.value.toLowerCase());
        const matchesStatus =
            selectedStatuses.value.length === 0 ||
            selectedStatuses.value.includes(room.status);
        const matchesType =
            !selectedRoomType.value || room.room_type_name === selectedRoomType.value;

        return matchesSearch && matchesStatus && matchesType;
    });
});

// Add clear filters method
const clearFilters = () => {
    searchQuery.value = "";
    selectedStatuses.value = [];
    selectedRoomType.value = "";
};

const getConditionSeverity = (isDamaged) => {
    return isDamaged ? "danger" : "success";
};

const formatDate = (dateString) => {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const getItemResolutionStatus = (itemName) => {
    // Status will remain unchanged when resolving damage reports
    return "Status will remain unchanged";
};

// Export functions
const exporting = ref(false);
const exportingRoom = ref(false);

const exportReports = async () => {
    try {
        exporting.value = true;
        const response = await exportDamageReports();
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        
        // Extract filename from response headers or create default
        const contentDisposition = response.headers['content-disposition'];
        let filename = `damage_reports_${new Date().toISOString().slice(0, 10)}.csv`;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }
        
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.add({
            severity: "success",
            summary: "Export Successful",
            detail: "Damage reports exported successfully",
            life: 3000,
        });
    } catch (error) {
        const errorMessage = error.response?.status === 404 
            ? "No damage reports found to export" 
            : error.response?.data?.message || error.message || "Failed to export damage reports";
        
        toast.add({
            severity: "error",
            summary: "Export Failed",
            detail: errorMessage,
            life: 5000,
        });
    } finally {
        exporting.value = false;
    }
};

const exportRoomReports = async (roomId, roomNumber) => {
    try {
        exportingRoom.value = true;
        const response = await exportRoomDamageReports(roomId);
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        
        // Extract filename from response headers or create default
        const contentDisposition = response.headers['content-disposition'];
        let filename = `room_${roomNumber}_damage_reports_${new Date().toISOString().slice(0, 10)}.csv`;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }
        
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.add({
            severity: "success",
            summary: "Export Successful",
            detail: `Room ${roomNumber} damage reports exported successfully`,
            life: 3000,
        });
    } catch (error) {
        const errorMessage = error.response?.status === 404 
            ? `No damage reports found for Room ${roomNumber}` 
            : error.response?.data?.message || "Failed to export room damage reports";
        
        toast.add({
            severity: "error",
            summary: "Export Failed",
            detail: errorMessage,
            life: 3000,
        });
    } finally {
        exportingRoom.value = false;
    }
};
</script>

<template>
    <div class="">
        <div class="flex flex-col md:flex-row gap-4 p-2 md:p-4">
            <!-- Room Grid -->
            <div class="card flex-1">
                <div class="room-grid">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Rooms Status</h2>
                        <div class="flex gap-2">
                            <Button
                                icon="pi pi-download"
                                label="Export Damage Reports"
                                severity="info"
                                :loading="exporting"
                                @click="exportReports"
                                size="small"
                                outlined
                                title="Export damage reports (unresolved only)"
                            />
                        </div>
                    </div>
                    <div
                        v-if="loading"
                        class="flex justify-center items-center h-64"
                    >
                        <ProgressSpinner />
                    </div>
                    
                    <!-- Empty State -->
                    <div v-else-if="filteredRooms.length === 0" class="text-center py-16">
                        <div class="flex flex-col items-center">
                            <i class="pi pi-home text-6xl text-gray-400 dark:text-gray-500 mb-4"></i>
                            <h3 class="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No Rooms Available</h3>
                            <p class="text-gray-500 dark:text-gray-400 mb-4">
                                {{ searchQuery || selectedStatuses.length > 0 || selectedRoomType ? 
                                   'No rooms match your current filters. Try adjusting your search criteria.' : 
                                   'There are currently no rooms available in the system.' }}
                            </p>
                            <div class="flex gap-2">
                                <Button 
                                    v-if="searchQuery || selectedStatuses.length > 0 || selectedRoomType"
                                    icon="pi pi-filter-slash" 
                                    label="Clear Filters" 
                                    @click="clearFilters"
                                    outlined
                                />
                                <Button 
                                    icon="pi pi-refresh" 
                                    label="Refresh" 
                                    @click="loadRooms"
                                    outlined
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div
                        v-else
                        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                    >
                        <div
                            v-for="room in filteredRooms"
                            :key="room.id"
                            class="relative w-full p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 cursor-pointer hover:shadow-lg transition-shadow min-h-[140px]"
                            :class="{
                                'bg-green-500 text-white hover:bg-green-600':
                                    room.status === 'Available',
                                'bg-blue-500 text-white hover:bg-blue-600':
                                    room.status === 'Booked',
                                'bg-orange-500 text-white hover:bg-orange-600':
                                    room.status === 'Cleaning',
                                'bg-red-500 text-white hover:bg-red-600':
                                    room.status === 'Occupied',
                                'bg-gray-400 text-gray-800 hover:bg-gray-500':
                                    ![
                                        'Available',
                                        'Booked',
                                        'Cleaning',
                                        'Occupied',
                                    ].includes(room.status),
                            }"
                            @click="selectRoom(room)"
                        >
                            <div class="flex flex-col h-full text-center justify-center">
                                <div class="flex justify-between items-start mb-1">
                                    <h3 class="text-xl text-white font-bold leading-tight flex-1 text-center">
                                        Room {{ room.room_number }}
                                    </h3>
                                    <Tag
                                        v-if="room.damage_count > 0 && room.amenity_count > 0"
                                        severity="danger"
                                        :value="room.damage_count"
                                        class="absolute top-2 right-2 text-white"
                                    />
                                </div>
                                <div class="text-sm text-white/90">
                                    Amenities: {{ room.amenity_count || 0 }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="w-full md:w-1/3 lg:w-1/4 xl:w-1/5 space-y-4">
                <div class="card rounded-lg p-4">
                    <h3 class="text-base md:text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Filters</h3>
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <Button
                                type="button"
                                icon="pi pi-filter-slash"
                                label="Clear"
                                outlined
                                class="w-full text-sm md:text-base"
                                @click="clearFilters"
                            />
                            <IconField>
                                <InputIcon>
                                    <i
                                        class="pi pi-search text-sm md:text-base"
                                    />
                                </InputIcon>
                                <InputText
                                    v-model="searchQuery"
                                    placeholder="Search Room Number"
                                    class="w-full text-sm md:text-base"
                                />
                            </IconField>
                        </div>

                        <!-- Room Type Filter -->
                        <div>
                            <Dropdown
                                v-model="selectedRoomType"
                                :options="roomTypes"
                                placeholder="Select Room Type"
                                class="w-full text-sm md:text-base"
                            />
                        </div>

                        <!-- Status Filters -->
                        <div>
                            <h4 class="font-bold text-sm md:text-base mb-2 text-gray-900 dark:text-gray-100">
                                Status
                            </h4>
                            <div class="flex flex-col gap-2">
                                <div
                                    v-for="status in [
                                        'Available',
                                        'Occupied',
                                        'Cleaning',
                                        'Booked',
                                    ]"
                                    :key="status"
                                    class="flex items-center"
                                >
                                    <Checkbox
                                        v-model="selectedStatuses"
                                        :inputId="status"
                                        name="status"
                                        :value="status"
                                        class="h-4 w-4 md:h-5 md:w-5"
                                    />
                                    <label
                                        :for="status"
                                        class="text-sm md:text-base ml-2 text-gray-700 dark:text-gray-300"
                                    >
                                        {{ status }}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Amenities Dialog -->
        <Dialog
            v-model:visible="showAmenitiesDialog"
            :header="`Room ${selectedRoom.room_number} Amenities`"
            :style="{ width: '900px' }"
            :dismissable-mask="true"
            :modal="true"
            maximizable
        >
            <template #header>
                <div class="flex justify-between items-center w-full">
                    <span class="text-xl font-semibold">Room {{ selectedRoom.room_number }} Amenities</span>
                    <Button
                        v-if="damagedItems.length > 0"
                        icon="pi pi-download"
                        label="Export Room Reports"
                        severity="info"
                        size="small"
                        outlined
                        :loading="exportingRoom"
                        @click="exportRoomReports(selectedRoom.id, selectedRoom.room_number)"
                        title="Export damage reports for this room"
                    />
                </div>
            </template>
            <div class="amenities-dialog-content">
                <div v-if="amenitiesLoading" class="flex justify-center p-4">
                    <ProgressSpinner />
                </div>
                <div v-else-if="!selectedRoom.amenities || selectedRoom.amenities.length === 0" class="text-center p-8">
                    <i class="pi pi-info-circle text-4xl text-gray-400 dark:text-gray-500 mb-4"></i>
                    <p class="text-lg text-gray-600 dark:text-gray-300 mb-2">No Amenities Found</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">This room currently has no amenities assigned.</p>
                </div>
                <div v-else>
                    <DataTable
                        :value="selectedRoom.amenities"
                        class="p-datatable-sm"
                    >
                        <Column field="item_name" header="Item Name"></Column>
                        <Column field="serial_number" header="Serial Number"></Column>
                        <Column field="brand" header="Brand"></Column>
                        <Column header="Status">
                            <template #body="{ data }">
                                <Tag
                                    :value="data.is_damaged ? 'Damaged' : 'Good'"
                                    :severity="getConditionSeverity(data.is_damaged)"
                                />
                            </template>
                        </Column>
                        <Column header="Actions">
                            <template #body="{ data }">
                                <Button
                                    icon="pi pi-exclamation-triangle"
                                    class="p-button-sm p-button-danger"
                                    @click="openDamageReport(data)"
                                    :disabled="data.is_damaged"
                                    title="Report Damage"
                                />
                            </template>
                        </Column>
                    </DataTable>

                    <!-- Damage Summary -->
                    <div class="mt-6" v-if="damagedItems.length > 0">
                        <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                            Damage Reports ({{ damagedItems.length }})
                        </h3>
                        <div class="space-y-3">
                            <div
                                v-for="item in damagedItems"
                                :key="item.serial_id"
                                class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                            >
                                <div class="flex justify-between items-start">
                                    <div class="flex-1">
                                        <div class="font-medium text-gray-900 dark:text-gray-100">
                                            {{ item.item_name }}
                                        </div>
                                        <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Serial: {{ item.serial_number }}
                                        </div>
                                        <div class="text-sm text-red-700 dark:text-red-300 mt-2">
                                            <strong>Damage:</strong> {{ item.damage_description }}
                                        </div>
                                        <div v-if="item.damage_notes" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            <strong>Notes:</strong> {{ item.damage_notes }}
                                        </div>
                                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            Reported: {{ formatDate(item.reported_at) }}
                                        </div>
                                        <div class="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                                            {{ getItemResolutionStatus(item.item_name) }}
                                        </div>
                                    </div>
                                    <Button
                                        icon="pi pi-check"
                                        label="Resolve"
                                        class="p-button-success p-button-sm"
                                        @click="removeDamageReportItem(item)"
                                        :title="`Resolve Damage Report - ${getItemResolutionStatus(item.item_name)}`"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Close" @click="showAmenitiesDialog = false" />
            </template>
        </Dialog>

        <!-- Damage Report Dialog -->
        <Dialog
            v-model:visible="showDamageDialog"
            header="Report Damage"
            :dismissable-mask="true"
            :modal="true"
            :style="{ width: '500px' }"
        >
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Item Name</label>
                    <InputText
                        v-model="selectedItem.item_name"
                        readonly
                        class="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Serial Number</label>
                    <InputText
                        v-model="selectedItem.serial_number"
                        readonly
                        class="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Damage Description *</label>
                    <Textarea
                        v-model="damageReport.damage_description"
                        rows="3"
                        placeholder="Describe the damage..."
                        class="w-full"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Additional Notes</label>
                    <Textarea
                        v-model="damageReport.notes"
                        rows="3"
                        placeholder="Any additional notes..."
                        class="w-full"
                    />
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button
                        label="Cancel"
                        severity="secondary"
                        @click="cancelDamageReport"
                    />
                    <Button
                        label="Submit Report"
                        severity="danger"
                        @click="submitDamageReport"
                    />
                </div>
            </template>
        </Dialog>
        
        <Toast />
    </div>
</template>
