<script setup>

import { useToast } from "primevue/usetoast";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import {
  fetchRooms,
  updateRoom,
  deleteRoom,
  fetchSerialNumbers,
  getRoomSerialNumbers,
  updateRoomSerialNumbers,
  fetchRoomTypes,
  fetchRoomCategories,
  uploadRoomImage,
  setRoomMaintenance,
  cleaningComplete
} from "@/api/auth";

const isAmenitiesDialogVisible = ref(false);
const selectedType = ref(null); // for filter by type
const amenityTypes = computed(() => {
  const types = serialNumbers.value.map(sn => sn.type).filter(Boolean);
  const uniqueTypes = [...new Set(types)].map(type => ({ label: type, value: type }));
  return [{ label: "All", value: null }, ...uniqueTypes];
});

const selectedImageFile = ref(null);
const previewImageUrl = ref(null);

function handleImageChange(event) {
  const file = event.target.files[0];
  if (file) {
    selectedImageFile.value = file;
    previewImageUrl.value = URL.createObjectURL(file);
  } else {
    selectedImageFile.value = null;
    previewImageUrl.value = null;
  }
}

function removeImage() {
    previewImageUrl.value = null;
}



const amenitySearch = ref('');
const selectedAmenities = ref([]); // selection for DataTable
const availableAmenities = computed(() => {
  // 1. Get IDs of assigned amenities
  const assignedIds = assignedSerialNumbers.value.map(sn => sn.id);

  // 2. Split serials into assigned (show first) and unassigned (show next)
  let assigned = [];
  let unassigned = [];

  serialNumbers.value.forEach(sn => {
    if (assignedIds.includes(sn.id)) {
      assigned.push(sn);
    } else if (sn.status === "in_stock") {
      unassigned.push(sn);
    }
  });

  // 3. Merge them, assigned first
  let amenities = [...assigned, ...unassigned];

  // 4. Type filter
  if (selectedType.value !== null) {
  amenities = amenities.filter(sn => sn.type === selectedType.value);
}


  // 5. Search filter
  if (amenitySearch.value) {
    const term = amenitySearch.value.toLowerCase();
    amenities = amenities.filter(sn =>
      (sn.product_name?.toLowerCase().includes(term) || '') ||
      (sn.brand?.toLowerCase().includes(term) || '') ||
      (sn.serial_number?.toLowerCase().includes(term) || '') ||
      (sn.category?.toLowerCase().includes(term) || '')
    );
  }
  return amenities;
});

function clearAmenitySearch() {
  selectedType.value = null;
  amenitySearch.value = '';
}

// --- Open Dialog: Always fetch fresh assigned + serials
const openAmenitiesDialog = async (room) => {
  roomToEdit.value = { ...room };
  // Get assigned serials for this room
  const assignedRes = await getRoomSerialNumbers(room.id);
  assignedSerialNumbers.value = assignedRes.data;
  const assignedIds = assignedRes.data.map(sn => sn.id);

  // Get all serial numbers (filter to in_stock or assigned in computed)
  const allSerialsRes = await fetchSerialNumbers();
  serialNumbers.value = allSerialsRes.data;

  // Pre-select currently assigned
  selectedAmenities.value = serialNumbers.value.filter(sn => assignedIds.includes(sn.id));
  isAmenitiesDialogVisible.value = true;
};

function closeAmenitiesDialog() {
  isAmenitiesDialogVisible.value = false;
}

// --- Confirm: Save to backend and update status logic
const confirmAmenitiesSelection = async () => {
  try {
    const ids = selectedAmenities.value.map(a => a.id);
    await updateRoomSerialNumbers(roomToEdit.value.id, { serial_ids: ids });

    toast.add({ severity: "success", summary: "Assigned", detail: "Amenities updated.", life: 3000 });

    // Refresh rooms, serial numbers, and assigned serials for the current room
    await loadRooms();
    await loadSerialNumbers();
    // Refresh assigned serials for the edited room so the list updates
    const assignedRes = await getRoomSerialNumbers(roomToEdit.value.id);
    assignedSerialNumbers.value = assignedRes.data;

    // Emit a global event so other views update instantly
    window.dispatchEvent(new CustomEvent("rooms:changed", { detail: { reason: "amenities-updated", roomId: roomToEdit.value.id } }));

    isAmenitiesDialogVisible.value = false;
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: "Failed to update amenities.", life: 3000 });
  }
};






const selectedStatus = ref(null); // This replaces selectedFilter.status
const selectedFilter = ref({
  searchQuery: "",
  roomCategory: null,

});

const getRoomTypeRates = (type_id) =>
  roomTypes.value.find((t) => t.id === type_id) || {};

// --- State ---
const rooms = ref([]);
const roomTypes = ref([]);
const roomCategories = ref([]);
const serialNumbers = ref([]);
const assignedSerialNumbers = ref([]);
const selectedSerials = ref([]);
const selectedRoom = ref(null);

const stats = ref({
  operationalRooms: 0,
  underMaintinance: 0,
  totalRooms: 0,
});


const layout = ref("grid");
const isEditDialogVisible = ref(false);
const isSerialDialogVisible = ref(false);
const isDetailsDialogVisible = ref(false);
const isDeleteDialogVisible = ref(false);
const roomToEdit = ref(null);
const roomNumberError = ref("");
const canSave = ref(true);
const roomToDelete = ref(null);

const toast = useToast();

// --- Computed ---
const filteredRooms = computed(() => {
  return rooms.value.filter((room) => {
    const matchesSearch = (room.room_number || "")
      .toLowerCase()
      .includes(selectedFilter.value.searchQuery.toLowerCase());
    const matchesCategory =
      !selectedFilter.value.roomCategory ||
      room.category_id === selectedFilter.value.roomCategory;
    const matchesStatus =
      !selectedStatus.value || room.status === selectedStatus.value;
    return matchesSearch && matchesCategory && matchesStatus;
  });
});



const categoryOptions = computed(() =>
  roomCategories.value.map((c) => ({ label: c.category, value: c.id }))
);


const clearFilters = () => {
  selectedFilter.value = {
    searchQuery: "",
    roomType: null,
  };
  selectedStatus.value = null; // resets the radio filter!
};
const getRoomType = (id) =>
  roomTypes.value.find((t) => t.id === id)?.name || "-";
const getRoomCategory = (id) =>
  roomCategories.value.find((c) => c.id === id)?.category || "-";

const getSeverity = (room) => {
  switch (room.status) {
    case "Available":
      return "success";
    case "Occupied":
      return "info";
    case "Cleaning":
      return "warn";
    case "Maintenance":
    case "Under Maintenance":
      return "danger";
    default:
      return "danger";
  }
};


function formatPrice(value) {
  // Convert to float safely, even if value is string/number
  const num = Number(value);
  if (isNaN(num) || value === "" || value == null) return "₱0.00";
  return `₱${num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const roomTypeOptions = computed(() =>
  roomTypes.value.map((type) => ({
    label: type.name,
    value: type.id,
    categoryId: type.category_id,
  }))
);

// Computed: Display category name for the current selected type in Edit Dialog
const selectedEditType = computed(() => {
  if (!roomToEdit.value?.type_id) return null;
  return roomTypes.value.find(t => t.id === roomToEdit.value.type_id);
});
const selectedEditCategory = computed(() => {
  if (!selectedEditType.value) return "";
  const categoryId = selectedEditType.value.category_id;
  const cat = roomCategories.value.find(c => c.id === categoryId);
  return cat ? cat.category : "";
});

// --- Data Loading ---
const loadRooms = async () => {
  try {
    const res = await fetchRooms();
     console.log("Rooms loaded from backend (RAW):", res.data);

    rooms.value = res.data;
    stats.value.totalRooms = res.data.length;
    stats.value.operationalRooms = res.data.filter(r => r.status === "Available").length;
    stats.value.cleaning = res.data.filter(r => r.status === "Cleaning").length;
    stats.value.underMaintinance = res.data.filter(r => r.status === "Under Maintenance").length;
  } catch {
    toast.add({ severity: "error", summary: "Error", detail: "Failed to load rooms.", life: 3000 });
  }
};
const loadSerialNumbers = async () => {
  try {
    const res = await fetchSerialNumbers();
    serialNumbers.value = res.data;
  } catch {
    toast.add({ severity: "error", summary: "Error", detail: "Failed to load serial numbers.", life: 3000 });
  }
};
const loadRoomTypes = async () => {
  const res = await fetchRoomTypes();
  roomTypes.value = res.data;
};
const loadRoomCategories = async () => {
  const res = await fetchRoomCategories();
  roomCategories.value = res.data;
};

// --- Dialogs ---
const openEditDialog = async (room) => {
  roomToEdit.value = { ...room };
  // Get the current name for this type_id
  isEditDialogVisible.value = true;
};

const saveRoomDetails = async () => {
  try {
    if (selectedImageFile.value) {
      const formData = new FormData();
      formData.append("image", selectedImageFile.value);

      // Axios handles JWT for you!
      const res = await uploadRoomImage(roomToEdit.value.id, formData);
      if (res.data.filename) {
        roomToEdit.value.image_url = res.data.filename;
      } else {
        throw new Error(res.data.error || "Image upload failed");
      }
    }

    await updateRoom(roomToEdit.value.id, {
      room_number: roomToEdit.value.room_number,
      floor_number: roomToEdit.value.floor_number,
      type_id: roomToEdit.value.type_id,
      category_id: roomToEdit.value.category_id,
      description: roomToEdit.value.description,
      occupancy: roomToEdit.value.occupancy,
      image_url: roomToEdit.value.image_url,
    });



    toast.add({ severity: "success", summary: "Room Saved", detail: "Room updated.", life: 3000 });
    isEditDialogVisible.value = false;
    await loadRooms();
    await loadRoomTypes();
    // Emit a global event so other views update instantly
    window.dispatchEvent(new CustomEvent("rooms:changed", { detail: { reason: "room-updated", roomId: roomToEdit.value.id } }));
    selectedImageFile.value = null;
    previewImageUrl.value = null;
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: err.message || "Failed to save.", life: 3000 });
  }
};

const cancelEdit = () => { isEditDialogVisible.value = false; };


const openDetailsDialog = async (room) => {
  selectedRoom.value = { ...room };
  const res = await getRoomSerialNumbers(room.id);
  assignedSerialNumbers.value = res.data;
  isDetailsDialogVisible.value = true;
};


watch(
  () => roomToEdit.value?.type_id,
  (newTypeId) => {
    if (!newTypeId) return;
    const typeObj = roomTypes.value.find(t => t.id === newTypeId);
    if (typeObj && roomToEdit.value) {
      roomToEdit.value.category_id = typeObj.category_id;
    }
  }
);

watch(
  () => roomToEdit.value?.room_number,
  (newRoomNumber) => {
    if (!newRoomNumber) {
      roomNumberError.value = "Room number is required.";
      canSave.value = false;
      return;
    }
    // Check ang room number basin duplicated ba
    const isDuplicate = rooms.value.some(
      r => r.room_number === newRoomNumber && r.id !== roomToEdit.value.id
    );
    if (isDuplicate) {
      roomNumberError.value = "Room number already exists.";


      canSave.value = false;
    } else {
      roomNumberError.value = "";
      canSave.value = true;


    }
  }
);



const openDeleteDialog = (room) => {
  roomToDelete.value = room;
  isDeleteDialogVisible.value = true;
};
const confirmDeleteRoom = async () => {
  try {
    await deleteRoom(roomToDelete.value.id);
    toast.add({ severity: "success", summary: "Deleted", detail: "Room deleted.", life: 3000 });
    isDeleteDialogVisible.value = false;
    await loadRooms();
    // Notify other views
    window.dispatchEvent(new CustomEvent("rooms:changed", { detail: { reason: "room-deleted", roomId: roomToDelete.value.id } }));
  } catch {
    toast.add({ severity: "error", summary: "Error", detail: "Failed to delete room.", life: 3000 });
  }
};
const cancelDelete = () => {
  roomToDelete.value = null;
  isDeleteDialogVisible.value = false;
};

// Instant refresh: react to global room/bookings changes

const onGlobalRoomsChanged = async (e) => {
  try {
    console.debug("[RoomControl] Global change received", e?.type, e?.detail || {});
    await Promise.all([
      loadRooms(),
      loadRoomTypes(),
      loadRoomCategories(),
      loadSerialNumbers(),
    ]);
  } catch (err) {
    console.warn("[RoomControl] Refresh failed", err);

// (no-op here; moved toggleMaintenance to top-level scope below)


  }
};


// Toggle maintenance status for a room (safe + optimistic)
// eslint-disable-next-line no-unused-vars
const toggleMaintenance = async (room) => {
  let prevStatus;
  let idx = -1;
  try {
    if (!room || !room.id) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Invalid room selected', life: 2500 });
      return;
    }
    const statusStr = String(room.status ?? '').trim();
    const wasMaint = statusStr === 'Under Maintenance' || statusStr === 'Maintenance';
    const targetStatus = wasMaint ? 'Available' : 'Under Maintenance';

    // Optimistically update local state for instant feedback
    idx = rooms.value.findIndex(r => r.id === room.id);
    prevStatus = room.status;
    if (idx !== -1) rooms.value[idx].status = targetStatus;
    room.status = targetStatus;

    if (wasMaint) {
      await cleaningComplete(room.id);
      toast.add({ severity: 'success', summary: 'Maintenance Ended', detail: `Room ${room.room_number} is now available`, life: 2000 });
    } else {
      await setRoomMaintenance(room.id);
      toast.add({ severity: 'warn', summary: 'Maintenance', detail: `Room ${room.room_number} set to maintenance`, life: 2000 });
    }

    await loadRooms();
    window.dispatchEvent(new CustomEvent('rooms:changed', { detail: { reason: targetStatus, roomId: room.id } }));
  } catch (err) {
    if (idx !== -1) rooms.value[idx].status = prevStatus;
    if (room) room.status = prevStatus;
    toast.add({ severity: 'error', summary: 'Error', detail: err?.response?.data?.error || err.message || 'Failed to toggle maintenance', life: 3000 });
  }
};

onMounted(() => {
  loadRooms();
  loadSerialNumbers();
  loadRoomTypes();
  loadRoomCategories();
  // Listen for global changes emitted elsewhere (e.g., RoomList)
  window.addEventListener("rooms:changed", onGlobalRoomsChanged);
  window.addEventListener("bookings:changed", onGlobalRoomsChanged);
});

onUnmounted(() => {
  window.removeEventListener("rooms:changed", onGlobalRoomsChanged);
  window.removeEventListener("bookings:changed", onGlobalRoomsChanged);

});
</script>

<template>
  <div class="grid grid-cols-12 gap-4 mb-3">
    <div class="col-span-12 lg:col-span-6 xl:col-span-4 card mb-0">
      <span class="block text-muted-color font-medium mb-4">Operational Rooms</span>
      <div class="text-green-500 text-4xl font-bold">{{ stats.operationalRooms }}</div>
    </div>
    <div class="col-span-12 lg:col-span-6 xl:col-span-4 card mb-0">
      <span class="block text-muted-color font-medium mb-4">Under Maintenance</span>
      <div class="text-red-500 text-4xl font-bold">{{ stats.underMaintinance }}</div>



    </div>
    <div class="col-span-12 lg:col-span-6 xl:col-span-4 card mb-0">
      <span class="block text-muted-color font-medium mb-4">Total Rooms</span>
      <div class="text-blue-900 text-4xl font-bold">{{ stats.totalRooms }}</div>
    </div>
  </div>

  <div class="flex flex-col md:flex-row gap-4">
    <div class="w-full md:w-1/3 lg:w-1/4 xl:w-1/5 p-2 md:p-4 card rounded-lg order-first md:order-last">
      <h3 class="text-base md:text-lg font-bold mb-2">Filters</h3>
      <Button type="button" icon="pi pi-filter-slash" severity="danger" label="Clear" outlined class="w-full" @click="clearFilters"/>
      <InputText placeholder="Search Room Number" class="w-full mt-2" v-model="selectedFilter.searchQuery"/>
      <Select v-model="selectedFilter.roomCategory" :options="categoryOptions" optionLabel="label" optionValue="value" placeholder="Room Type" class="w-full mt-2"/>
      <div class="mt-2 flex flex-col gap-2">
  <div>
    <RadioButton v-model="selectedStatus" inputId="status-available" value="Available" class="mr-1" />
    <label for="status-available" class="mr-2">Available</label>
  </div>
  <div>
    <RadioButton v-model="selectedStatus" inputId="status-occupied" value="Occupied" class="mr-1" />
    <label for="status-occupied" class="mr-2">Occupied</label>
  </div>
  <div>
    <RadioButton v-model="selectedStatus" inputId="status-cleaning" value="Cleaning" class="mr-1" />
    <label for="status-cleaning">Cleaning</label>
  </div>
   <div>
    <RadioButton v-model="selectedStatus" inputId="status-maintenance" value="Under Maintenance" class="mr-1" />
    <label for="status-maintenance">Maintenance</label>
  </div>
</div>
    </div>

    <div class="flex-1">
      <div class="card">
        <div class="font-semibold text-xl mb-4">Rooms</div>
        <!-- Empty State Check -->
        <div v-if="filteredRooms.length === 0" class="text-center p-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <i class="pi pi-home text-6xl text-gray-400 mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            <span v-if="selectedFilter.searchQuery || selectedFilter.roomCategory || selectedStatus">
              No Rooms Found
            </span>
            <span v-else>
              No Rooms Available
            </span>
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mb-4">
            <span v-if="selectedFilter.searchQuery">
              No rooms match your search "{{ selectedFilter.searchQuery }}"
            </span>
            <span v-else-if="selectedFilter.roomCategory || selectedStatus">
              No rooms match your current filters
            </span>
            <span v-else>
              There are no rooms in the system yet. Add your first room to get started.
            </span>
          </p>
          <div class="flex justify-center gap-2">
            <Button 
              v-if="selectedFilter.searchQuery || selectedFilter.roomCategory || selectedStatus"
              icon="pi pi-filter-slash" 
              label="Clear Filters" 
              class="p-button-outlined p-button-secondary"
              @click="clearFilters"
            />
            <router-link v-else to="/Rooms/AddRoom">
              <Button 
                icon="pi pi-plus" 
                label="Add Your First Room" 
                class="p-button-primary"
              />
            </router-link>
          </div>
        </div>

        <!-- Rooms DataView -->
        <DataView v-else :value="filteredRooms" :layout="layout">
          <template #grid="slotProps">
            <div class="grid grid-cols-2 gap-4 items-stretch">
              <div v-for="room in slotProps.items" :key="room.id" class="border rounded-lg shadow-md p-4 card h-full flex flex-col">
                <div class="relative flex justify-center mb-4">
                  <img class="rounded-md w-full h-48 object-cover" :src="`http://localhost:5000/uploads/rooms/${room.image_url}`" :alt="room.room_number"/>
                  <Tag :value="room.status" :severity="getSeverity(room)" class="absolute top-2 left-2"/>
                </div>
                <div class="mb-2 text-lg font-bold">Room {{ room.room_number }}</div>
                <div class="text-sm">Name: {{ getRoomType(room.type_id) }}</div>
                <div class="text-sm">Category: {{ getRoomCategory(room.category_id) }}</div>
                <div class="text-sm mt-2">{{ room.description }}</div>
                <div class="text-sm mt-2">
                  <i class="pi pi-user"></i> Occupancy: {{ room.occupancy }}
                </div>
             <div class="text-sm mt-2">
  Rates:
  <span class="ml-2">
    6h {{ formatPrice(getRoomTypeRates(room.type_id).rates?.['6hrs']) }},
    12h {{ formatPrice(getRoomTypeRates(room.type_id).rates?.['12hrs']) }},
    24h {{ formatPrice(getRoomTypeRates(room.type_id).rates?.['24hrs']) }}
  </span>
</div>
<div v-if="getRoomTypeRates(room.type_id).discount_percent" class="text-xs text-red-500 font-bold mt-1">
  Discount: {{ getRoomTypeRates(room.type_id).discount_percent }}%
</div>


                <div class="flex gap-2 mt-4">
                  <Button icon="pi pi-pencil" label="Edit" :disabled="room.status==='Occupied' || room.status==='Under Maintenance' || room.status==='Maintenance'" @click="openEditDialog(room)" class="flex-auto"></Button>
                  <Button icon="pi pi-info-circle" label="Details" severity="info" @click="openDetailsDialog(room)" class="flex-auto"></Button>
                  <Button icon="pi pi-wrench"
                          :label="(room.status==='Under Maintenance'||room.status==='Maintenance') ? 'End Maintenance' : 'Maintenance'"
                          severity="warn"
                          :disabled="room.status==='Occupied'"
                          @click="toggleMaintenance(room)"
                          class="flex-auto "></Button>
                  <Button icon="pi pi-trash" label="Delete" severity="danger" :disabled="room.status==='Occupied' || room.status==='Under Maintenance' || room.status==='Maintenance'" @click="openDeleteDialog(room)" class="flex-auto"></Button>
                </div>
              </div>
            </div>
          </template>
        </DataView>
      </div>
    </div>
  </div>

  <!-- Details Dialog -->
  <Dialog v-model:visible="isDetailsDialogVisible" :dismissable-mask="true"  :header="selectedRoom?.room_number || 'Room Details'" :modal="true" :closable="true" :style="{ width: '50vw' }">
  <div v-if="selectedRoom">
    <h3 class="text-lg font-semibold">Type: {{ getRoomType(selectedRoom.type_id) }}</h3>
    <p class="text-sm text-gray-500">Category: {{ getRoomCategory(selectedRoom.category_id) }}</p>
    <p class="mt-2 text-sm">{{ selectedRoom.description }}</p>
    <div class="mt-2">
      <i class="pi pi-user"></i> Occupancy: {{ selectedRoom.occupancy }}
    </div>
    <div class="text-sm mt-2">
  Rates:
  <span class="ml-2">
    6h {{ formatPrice(getRoomTypeRates(selectedRoom.type_id).rates?.['6hrs']) }},
    12h {{ formatPrice(getRoomTypeRates(selectedRoom.type_id).rates?.['12hrs']) }},
    24h {{ formatPrice(getRoomTypeRates(selectedRoom.type_id).rates?.['24hrs']) }}
  </span>
</div>
<div v-if="getRoomTypeRates(selectedRoom.type_id).discount_percent" class="text-xs text-red-500 font-bold mt-1">
  Discount: {{ getRoomTypeRates(selectedRoom.type_id).discount_percent }}%
</div>

    <h4 class="font-semibold mt-4 mb-2">Assigned Amenities</h4>
    
    <!-- Empty State for No Amenities -->
    <div v-if="assignedSerialNumbers.length === 0" class="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
      <i class="pi pi-box text-3xl text-gray-400 mb-2"></i>
      <p class="text-gray-500 dark:text-gray-400 text-sm">
        No amenities assigned to this room
      </p>
    </div>
    
    <!-- Amenities Grid -->
    <div v-else class="grid grid-cols-4 gap-2 text-sm font-medium">
      <div class="font-semibold">Product</div>
      <div class="font-semibold">Category</div>
      <div class="font-semibold">Brand</div>
      <div class="font-semibold">Serial Number</div>
      <div v-for="serial in assignedSerialNumbers" :key="serial.id" class="contents">
        <div>{{ serial.product_name }}</div>
        <div>{{ serial.category }}</div>
        <div>{{ serial.brand }}</div>
        <div>{{ serial.serial_number }}</div>
      </div>
    </div>
  </div>
</Dialog>

  <!-- Delete Dialog -->
  <Dialog v-model:visible="isDeleteDialogVisible"  :dismissable-mask="true" :header="'Confirm Deletion'" :modal="true" :closable="true" :style="{ width: '30vw' }">
    <div class="flex flex-col items-center">
      <p class="text-sm text-center mb-4">
        Are you sure you want to delete
        <strong class="text-red-500">{{ roomToDelete?.room_number }}</strong>? This action cannot be undone.
      </p>
      <div class="flex justify-end gap-2 w-full">
         <Button label="Delete" icon="pi pi-trash" severity="danger" @click="confirmDeleteRoom"></Button>
        <Button label="Cancel" icon="pi pi-times" @click="cancelDelete"></Button>

      </div>
    </div>
  </Dialog>

  <!-- Edit Room Dialog -->
  <Dialog v-model:visible="isEditDialogVisible"  :dismissable-mask="true" :header="'Edit Room - ' + (roomToEdit?.room_number || '')" :modal="true" :closable="true" :style="{ width: '30vw' }">
       <div v-if="roomToEdit">
    <!-- Image Update Section -->

   <label class="block text-sm font-medium mb-2">Room Image</label>
    <input
        type="file"
        id="roomImage"
        accept="image/*"
        @change="handleImageChange"
        class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-500 hover:file:bg-green-100"
    />
    <!-- Image Preview Section -->
    <div
        v-if="previewImageUrl || roomToEdit?.image_url"
        class="mt-4 flex items-center gap-4"
    >
        <img
            :src="previewImageUrl || `http://localhost:5000/uploads/rooms/${roomToEdit.image_url}`"
            alt="Room Preview"
            class="w-24 h-24 object-cover rounded-md border border-gray-300"
        />
        <div>
            <p class="text-sm font-medium text-gray-700">Preview:</p>
            <p class="text-sm text-gray-500">
                {{ previewImageUrl ? "Room Image Selected" : "Current Room Image" }}
            </p>
        </div>
        <Button
            v-if="previewImageUrl"
            label="Remove"
            icon="pi pi-times"
            class="p-button-danger p-button-sm"
            @click="removeImage"
        />
    </div>


      <label class="block text-sm font-medium mb-2 mt-2">Room Number</label>
      <InputText v-model="roomToEdit.room_number" class="w-full"/>
<span v-if="roomNumberError" class="text-red-500 text-xs">{{ roomNumberError }}</span>

       <!-- Room Type Dropdown -->
    <label class="block text-sm font-medium mb-2 mt-2">Room Type</label>
    <Select
      v-model="roomToEdit.type_id"
      :options="roomTypeOptions"
      optionLabel="label"
      optionValue="value"
      class="w-full"
    />

    <!-- Readonly Category Display -->
    <label class="block text-sm font-medium mb-2 mt-2">Category</label>
    <InputText
      :value="selectedEditCategory"
      class="w-full"
      disabled
      style="background-color: #f9fafb;"
    />
      <label class="block text-sm font-medium mb-2 mt-2">Description</label>
      <Textarea v-model="roomToEdit.description" class="w-full"/>
      <label class="block text-sm font-medium mb-2 mt-2">Occupancy</label>
      <InputText v-model="roomToEdit.occupancy" class="w-full" type="number"/>
      <Button label="Manage Amenities" icon="pi pi-pencil"  class=" mb-2 mt-5" @click="openAmenitiesDialog(roomToEdit)"></Button>
      <div class="flex justify-end gap-2 mt-4">
        <Button
  label="Save"
  icon="pi pi-save"
  @click="saveRoomDetails"
  :disabled="!canSave"
  :class="{ 'opacity-60 pointer-events-none': !canSave }"
/>
        <Button label="Cancel" severity="secondary" icon="pi pi-times" @click="cancelEdit"></Button>

      </div>
    </div>
  </Dialog>

 <Dialog
  v-model:visible="isAmenitiesDialogVisible"
  header="Select Amenities"
  :modal="true"
  :dismissable-mask="true"
  :closable="true"
  :style="{ width: '50vw' }"
>
  <div>
    <div class="flex items-center mb-4 gap-2">
      <Select
        v-model="selectedType"
        :options="amenityTypes"
        optionLabel="label"
        optionValue="value"
        placeholder="Filter by Type"
        clearable
        class="w-44"
      />
      <IconField>
        <InputIcon>
          <i class="pi pi-search" />
        </InputIcon>
        <InputText
          v-model="amenitySearch"
          placeholder="Keyword Search"
          class="w-full"
          clearable
        />
      </IconField>
      <Button
        type="button"
        icon="pi pi-filter-slash"
        label="Clear"
        severity="danger"
        outlined
        @click="clearAmenitySearch"
      />
    </div>
    <!-- Empty State for No Available Amenities -->
    <div v-if="availableAmenities.length === 0" class="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
      <i class="pi pi-search text-4xl text-gray-400 mb-4"></i>
      <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
        No Amenities Found
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-4">
        <span v-if="amenitySearch || selectedType">
          No amenities match your current search or filter
        </span>
        <span v-else>
          No amenities are available in the inventory
        </span>
      </p>
      <Button 
        v-if="amenitySearch || selectedType"
        icon="pi pi-filter-slash" 
        label="Clear Search & Filters" 
        class="p-button-outlined p-button-secondary"
        @click="clearAmenitySearch"
      />
    </div>

    <!-- DataTable for Available Amenities -->
    <DataTable
      v-else
      :value="availableAmenities"
      selection-mode="multiple"
      v-model:selection="selectedAmenities"
      dataKey="id"
      class="w-full"
      :paginator="true"
      :rows="5"
    >
      <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
      <Column field="product_name" header="Product Name" sortable></Column>
      <Column field="brand" header="Brand" sortable></Column>
      <Column field="type" header="Type" sortable></Column>
      <Column field="serial_number" header="Serial Number" sortable></Column>
      <Column field="category" header="Category" sortable></Column>
      <Column field="status" header="Status" sortable></Column>
    </DataTable>
    <!-- Action Buttons -->
    <div class="flex justify-end mt-4 gap-4">
      <Button
        label="Done"
        icon="pi pi-check"
        @click="confirmAmenitiesSelection"
      ></Button>
      <Button
        label="Close"
        icon="pi pi-times"
        class="p-button-secondary"
        @click="closeAmenitiesDialog"
      ></Button>
    </div>
  </div>
</Dialog>

  <Toast />
</template>
