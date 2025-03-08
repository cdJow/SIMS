<script setup>
import { computed, ref } from "vue";

const rooms = ref([
    {
        number: "101",
        status: "Occupied",
        lastChecked: "2024-03-20",
        damageCount: 0,
        amenities: [
            {
                id: 1,
                name: "King Bed",
                category: "Furniture",
                condition: "Good",
                isDamaged: false,
                serialNumber: "FUR-101-KB-001",
            },
            {
                id: 2,
                name: "Smart TV",
                category: "Electronics",
                condition: "Excellent",
                isDamaged: false,
                serialNumber: "ELE-101-TV-002",
            },
        ],
    },
    {
        number: "102",
        status: "Available",
        lastChecked: "2024-03-18",
        damageCount: 1,
        amenities: [
            {
                id: 3,
                name: "Queen Bed",
                category: "Furniture",
                condition: "Good",
                isDamaged: false,
                serialNumber: "FUR-102-QB-003",
            },
            {
                id: 4,
                name: "LED TV",
                category: "Electronics",
                condition: "Excellent",
                isDamaged: false,
                serialNumber: "ELE-102-TV-004",
            },
            {
                id: 5,
                name: "Air Conditioner",
                category: "Appliance",
                condition: "Needs Repair",
                isDamaged: true,
                serialNumber: "APP-102-AC-005",
            },
        ],
    },
    {
        number: "103",
        status: "Booked",
        lastChecked: "2024-03-19",
        damageCount: 2,
        amenities: [
            {
                id: 6,
                name: "Twin Beds",
                category: "Furniture",
                condition: "Good",
                isDamaged: false,
                serialNumber: "FUR-103-TB-006",
            },
            {
                id: 7,
                name: "Smart TV",
                category: "Electronics",
                condition: "Good",
                isDamaged: false,
                serialNumber: "ELE-103-TV-007",
            },
            {
                id: 8,
                name: "Bathroom Mirror",
                category: "Fixture",
                condition: "Cracked",
                isDamaged: true,
                serialNumber: "FIX-103-MIR-008",
            },
        ],
    },
]);

const selectedRoom = ref({});
const showAmenitiesDialog = ref(false);
const showDamageDialog = ref(false);
const selectedItem = ref(null);
const damageReport = ref({ type: null, severity: null, notes: "" });

// Constants
const damageTypes = ref([
    { name: "Broken", value: "broken" },
    { name: "Stained", value: "stained" },
    { name: "Malfunctioning", value: "malfunction" },
    { name: "Water Damage", value: "water_damage" },
    { name: "Burn Marks", value: "burn_marks" },
    { name: "Scratches", value: "scratches" },
    { name: "Torn Fabric", value: "torn_fabric" },
    { name: "Pest Infestation", value: "pest_infestation" },
    { name: "Odor Issues", value: "odor_issues" },
    { name: "Electrical Fault", value: "electrical_fault" },
    { name: "Plumbing Issue", value: "plumbing_issue" },
    { name: "Furniture Damage", value: "furniture_damage" },
    { name: "Wall Damage", value: "wall_damage" },
    { name: "Carpet Stains", value: "carpet_stains" },
    { name: "Bed Frame Issue", value: "bed_frame_issue" },
    { name: "HVAC Malfunction", value: "hvac_malfunction" },
    { name: "Window Damage", value: "window_damage" },
    { name: "Door Lock Issue", value: "door_lock_issue" },
    { name: "Lighting Issue", value: "lighting_issue" },
]);

const severityLevels = ref([
    { label: "Minor", value: "minor" },
    { label: "Medium", value: "medium" },
    { label: "Severe", value: "severe" },
]);

// Computed
const filteredRooms = computed(() => rooms.value);
const damagedItems = computed(
    () => selectedRoom.value.amenities?.filter((item) => item.isDamaged) || []
);

// Methods
const selectRoom = (room) => {
    selectedRoom.value = { ...room };
    showAmenitiesDialog.value = true;
};

const openDamageReport = (item) => {
    selectedItem.value = item;
    showDamageDialog.value = true;
};

const submitDamageReport = () => {
    const roomIndex = rooms.value.findIndex(
        (r) => r.number === selectedRoom.value.number
    );
    const amenityIndex = rooms.value[roomIndex].amenities.findIndex(
        (a) => a.id === selectedItem.value.id
    );

    rooms.value[roomIndex].amenities[amenityIndex] = {
        ...selectedItem.value,
        isDamaged: true,
        damage: { ...damageReport.value },
        condition: "Damaged",
    };

    rooms.value[roomIndex].damageCount++;
    cancelDamageReport();
};

const removeDamageReport = (item) => {
    const roomIndex = rooms.value.findIndex(
        (r) => r.number === selectedRoom.value.number
    );
    const amenityIndex = rooms.value[roomIndex].amenities.findIndex(
        (a) => a.id === item.id
    );

    rooms.value[roomIndex].amenities[amenityIndex].isDamaged = false;
    rooms.value[roomIndex].damageCount--;
};

const cancelDamageReport = () => {
    showDamageDialog.value = false;
    damageReport.value = { type: null, severity: null, notes: "" };
};

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

const getConditionSeverity = (condition) => {
    switch (condition.toLowerCase()) {
        case "excellent":
            return "success";
        case "good":
            return "info";
        case "damaged":
            return "danger";
        default:
            return "warning";
    }
};

const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
</script>

<template>
    <div class="card">
        <!-- Room Grid -->
        <div class="room-grid">
            <h2 class="text-2xl font-bold mb-6">Rooms Status</h2>
            <div
                class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
                <div
                    v-for="room in filteredRooms"
                    :key="room.number"
                    class="relative w-full p-6 rounded-lg shadow-md border cursor-pointer hover:shadow-lg transition-shadow min-h-[120px]"
                    :class="{
                        'bg-green-500 text-white hover:bg-green-600':
                            room.status === 'Available',
                        'bg-blue-500 text-white hover:bg-blue-600':
                            room.status === 'Booked',
                        'bg-orange-500 text-white hover:bg-orange-600':
                            room.status === 'Cleaning',
                        'bg-red-500 text-white hover:bg-red-600':
                            room.status === 'Occupied',
                        'bg-gray-400 text-gray-800 hover:bg-gray-500': ![
                            'Available',
                            'Booked',
                            'Cleaning',
                            'Occupied',
                        ].includes(room.status),
                    }"
                    @click="selectRoom(room)"
                >
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg text-white font-semibold">
                            Room {{ room.number }}
                            <Tag
                                v-if="room.damageCount > 0"
                                severity="danger"
                                :value="room.damageCount"
                                class="ml-2 text-white"
                            />
                        </h3>
                    </div>

                    <div class="mt-2 text-sm">
                        Last Checked: {{ formatDate(room.lastChecked) }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Amenities Dialog -->
        <Dialog
            v-model:visible="showAmenitiesDialog"
            header="Room Amenities"
            :style="{ width: '800px' }"
            :dismissable-mask="true"
            :modal="true"
        >
            <div class="amenities-dialog-content">
                <DataTable
                    :value="selectedRoom.amenities"
                    class="p-datatable-sm"
                >
                    <Column field="name" header="Item"></Column>
                    <Column field="category" header="Category"></Column>
                    <Column header="Condition">
                        <template #body="{ data }">
                            <Tag
                                :value="data.condition"
                                :severity="getConditionSeverity(data.condition)"
                            />
                        </template>
                    </Column>
                    <Column header="Actions">
                        <template #body="{ data }">
                            <Button
                                icon="pi pi-exclamation-triangle"
                                class="p-button-sm p-button-danger"
                                @click="openDamageReport(data)"
                                :disabled="data.isDamaged"
                            />
                        </template>
                    </Column>
                </DataTable>

                <!-- Damage Summary -->
                <div class="mt-6" v-if="damagedItems.length > 0">
                    <h3 class="text-lg font-semibold mb-4">
                        Damage Report Summary
                    </h3>
                    <ul class="damage-list">
                        <li
                            v-for="(item, index) in damagedItems"
                            :key="index"
                            class="flex justify-between items-center p-2 bg-red-50 rounded mb-2"
                        >
                            <div>
                                <span class="font-medium">{{ item.name }}</span>
                                <span class="text-sm ml-2"
                                    >{{ item.damage.type.name }} ({{
                                        item.damage.severity.label
                                    }})</span
                                >
                            </div>
                            <Button
                                icon="pi pi-trash"
                                class="p-button-text p-button-danger"
                                @click="removeDamageReport(item)"
                            />
                        </li>
                    </ul>
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
            class="rounded-lg shadow-lg"
        >
            <div class="p-6 space-y-6">
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700"
                        >Item Name</label
                    >
                    <InputText
                        v-model="selectedItem.name"
                        readonly
                        class="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-gray-700"
                            >Damage Type</label
                        >
                        <Dropdown
                            v-model="damageReport.type"
                            :options="damageTypes"
                            optionLabel="name"
                            placeholder="Select damage type"
                            class="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-gray-700"
                            >Severity</label
                        >
                        <SelectButton
                            v-model="damageReport.severity"
                            :options="severityLevels"
                            optionLabel="label"
                            class="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700"
                        >Notes</label
                    >
                    <Textarea
                        v-model="damageReport.notes"
                        rows="3"
                        class="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-4 p-4 border-t">
                    <Button
                        label="Cancel"
                        class="p-button-text bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition"
                        @click="cancelDamageReport"
                    />
                    <Button
                        label="Submit Report"
                        class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition shadow-md"
                        @click="submitDamageReport"
                    />
                </div>
            </template>
        </Dialog>
    </div>
</template>
