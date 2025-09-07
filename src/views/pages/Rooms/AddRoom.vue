<script setup>
import { ref, computed, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { getRoomTypes, getAvailableAmenities, addRoom, fetchRoomCategories, getRooms, getSerialTypes  } from "@/api/auth";


const amenityTypes = ref([]);
const selectedType = ref(null);

const canSubmit = computed(() => {
  return (
    !!newRoom.value.roomName &&
    !!newRoom.value.floorNumber &&
    !!newRoom.value.imageUrl
  );
});


let lastPreviewUrl = null;

async function setImageFromUrl(url, filename = 'sample.jpg') {
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const blob = await res.blob();

  const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });

  // as if the user picked a file
  newRoom.value.imageFile = file;

  // preview
  const objectUrl = URL.createObjectURL(blob);
  if (lastPreviewUrl) URL.revokeObjectURL(lastPreviewUrl);
  lastPreviewUrl = objectUrl;
  newRoom.value.imageUrl = objectUrl;
}

const selectedFileName = computed(() => newRoom.value.imageFile?.name || '');

const newRoom = ref({   
    roomName: "",
    floorNumber: "",
    imageUrl: "",
    imageFile: null,
    typeId: null,
    categoryId: null,
    Rdescription: "",
    occupancy: 0,
    rates: { "6hrs": 0, "12hrs": 0, "24hrs": 0 },
    amenities: [],
});
const currentStep = ref(1);

const showConfirmDialog = ref(false);
const floorOptions = ref([
    { label: "1st Floor", value: 1 },
    { label: "2nd Floor", value: 2 },
    { label: "3rd Floor", value: 3 },
    { label: "4th Floor", value: 4 },
    { label: "5th Floor", value: 5 },
]);
const roomCategories = ref([]);
const roomTypes = ref([]);
const filteredRoomTypes = ref([]);
const selectedRoomType = ref(null);

const flatData = ref([]);
const selectedItems = ref([]);

const filteredData = computed(() =>
    flatData.value.filter(
        (item) => item.category === "Non-Consumable" && item.status === "in_stock"
    )
);
const toast = useToast();
const completedSteps = ref([]);

const showExistingDialog = ref(false);

// pick an existing room -> fill into the form
function useExistingRoom(room) {
  newRoom.value.roomName = String(room.room_number);
  // match the correct floor option object
  const opt = floorOptions.value.find(o => o.value === Number(room.floor_number));
  newRoom.value.floorNumber = opt || null;

  toast.add({
    severity: "info",
    summary: "Existing Room Selected",
    detail: `Room ${room.room_number} (Floor ${room.floor_number}) transferred.`,
    life: 2000,
  });
  showExistingDialog.value = false;
}



const isAmenitiesDialogVisible = ref(false);

const amenitySearch = ref("");


function clearAmenitySearch() {
  amenitySearch.value = "";
  selectedType.value = null;
}

function canClickStep(step) {
  // Can always go to current step or any completed step
  if (step === currentStep.value) return true;
  if (completedSteps.value.includes(step)) return true;

  // Allow the user to click only the immediate next step if current step is completed
  const maxStep = Math.max(0, ...completedSteps.value);
  return step === maxStep + 1;
}



// Selection handling
const selectedAmenities = ref([]); // Will be set to your selectedItems logic

function confirmAmenitiesSelection() {
  // Assign selectedAmenities to selectedItems (or however you want to handle)
  selectedItems.value = [...selectedAmenities.value];
  isAmenitiesDialogVisible.value = false;
}
function closeAmenitiesDialog() {
  isAmenitiesDialogVisible.value = false;
}


const existingRooms = ref([]);

const fetchRooms = async () => {
  try {
    const res = await getRooms();
    existingRooms.value = res.data;
  } catch (e) {
    toast.add({ severity: "error", summary: "Fetch Rooms Error", detail: e.message, life: 3000 });
  }
};

const roomsByFloor = computed(() => {
  // Floor value to label map for pretty display
  const floorMap = {
    1: "1st Floor",
    2: "2nd Floor",
    3: "3rd Floor",
    4: "4th Floor",
    5: "5th Floor",
  };

   // Group rooms per floor, sorted numerically by room_number
  const grouped = {};
  for (let floor = 1; floor <= 5; floor++) {
    grouped[floorMap[floor]] = existingRooms.value
      .filter(r => Number(r.floor_number) === floor)
      .sort((a, b) => {
        const numA = parseInt(a.room_number, 10);
        const numB = parseInt(b.room_number, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        if (!isNaN(numA)) return -1;
        if (!isNaN(numB)) return 1;
        return (a.room_number + "").localeCompare(b.room_number + "");
      });
  }
  return grouped;
});




const nextRoomNumber = computed(() => {
  const nums = existingRooms.value
    .map(r => parseInt(r.room_number, 10))
    .filter(num => !isNaN(num));
  if (nums.length === 0) return "1";
  return (Math.max(...nums) + 1).toString();
});

//Property to Check Duplicates
const isRoomNumberDuplicate = computed(() => {
  if (!newRoom.value.roomName) return false;
  return existingRooms.value.some(
    room => room.room_number.toString().trim().toLowerCase() === newRoom.value.roomName.toString().trim().toLowerCase()
  );
});


const availableAmenities = computed(() => {
  let filtered = filteredData.value;
  // Only filter by type if selectedType.value is NOT null
  if (selectedType.value) {
    filtered = filtered.filter(item => item.type === selectedType.value);
  }
  if (amenitySearch.value.trim()) {
    const q = amenitySearch.value.toLowerCase();
    filtered = filtered.filter(item =>
      (item.productName || "").toLowerCase().includes(q) ||
      (item.brand || "").toLowerCase().includes(q) ||
      (item.serialNumber || "").toLowerCase().includes(q) ||
      (item.category || "").toLowerCase().includes(q) ||
      (item.status || "").toLowerCase().includes(q) ||
      (item.type || "").toLowerCase().includes(q)
    );
  }
  return filtered;
});


const fetchAmenities = async () => {
    try {
        const res = await getAvailableAmenities();
        flatData.value = Array.isArray(res.data)
            ? res.data.map(item => ({
                serialId: item.serial_id,
                productName: item.product_name,
                brand: item.brand,
                serialNumber: item.serial_number,
                category: item.category,
                status: item.status,
                type: item.type, 
            }))
            : [];
    } catch (e) {
        toast.add({ severity: "error", summary: "Amenities error", detail: e.message, life: 3000 });
    }
};


onMounted(async () => {

       try {
    const res = await getSerialTypes();
    // Add "All" at the start
    amenityTypes.value = [{ label: "All", value: null }, ...res.data.map(type => ({ label: type, value: type }))];
  } catch (e) {
    toast.add({ severity: "error", summary: "Type error", detail: e.message, life: 3000 });
  }

    try {
        const catRes = await fetchRoomCategories();
        roomCategories.value = catRes.data;
    } catch (e) {
        toast.add({ severity: "error", summary: "Room categories error", detail: e.message, life: 3000 });
    }
    try {
        const res = await getRoomTypes();
        roomTypes.value = res.data;
        filteredRoomTypes.value = res.data.map((type) => ({
            ...type,
            category: type.category_name,
        }));
    } catch (e) {
        toast.add({ severity: "error", summary: "Room types error", detail: e.message, life: 3000 });
    }
    try {
        const res = await getAvailableAmenities();
        flatData.value = Array.isArray(res.data)
            ? res.data.map(item => ({
                serialId: item.serial_id,
                productName: item.product_name,
                brand: item.brand,
                serialNumber: item.serial_number,
                category: item.category,
                status: item.status,
            }))
            : [];
    } catch (e) {
        toast.add({ severity: "error", summary: "Amenities error", detail: e.message, life: 3000 });
    }
    await fetchAmenities();
     await fetchRooms();
    try {
  // Make sure the file exists at this URL:
  // backend/static/uploads/rooms/sample.jpg  ->  http://localhost:5000/uploads/rooms/sample.jpg
  await setImageFromUrl('http://localhost:5000/uploads/rooms/sample.jpg', 'sample.jpg');
} catch (e) {
  console.warn('Auto image preload failed:', e);
}
});

function validateGeneralInfo() {
  if (
    !newRoom.value.imageFile ||
    !newRoom.value.roomName.trim() ||
    !newRoom.value.floorNumber
  ) {
    toast.add({
      severity: "warn",
      summary: "Missing Fields",
      detail: "Please provide an image, room number, and floor number before proceeding.",
      life: 3000,
    });
    return;
  }
  nextStep();
}


function validateRates() {
  if (!selectedRoomType.value) {
    toast.add({
      severity: "warn",
      summary: "No Room Rate Selected",
      detail: "Please select a room rate before proceeding.",
      life: 3000,
    });
    return;
  }
  nextStep();
}

function nextStep() {
  if (currentStep.value === 1 && isRoomNumberDuplicate.value) {
    toast.add({
      severity: "warn",
      summary: "Duplicate Room Number",
      detail: "This room number already exists. Please choose another.",
      life: 3000,
    });
    return;
  }
  if (currentStep.value < 4) {
    if (!completedSteps.value.includes(currentStep.value)) {
      completedSteps.value.push(currentStep.value);
    }
    currentStep.value++;
  }
}


function prevStep() {
    if (currentStep.value > 1) currentStep.value--;
}
function goToStep(step) {
    currentStep.value = step;
}

function selectCard(type) {
    if (selectedRoomType.value) {
        filteredRoomTypes.value.push(selectedRoomType.value);
        filteredRoomTypes.value.sort((a, b) => a.id - b.id);
    }
    selectedRoomType.value = type;
    filteredRoomTypes.value = filteredRoomTypes.value.filter((room) => room.id !== type.id);
    toast.add({ severity: "success", summary: "Room Selected", detail: `${type.name} has been selected.`, life: 3000 });
}
function removeSelectedRoom() {
    if (selectedRoomType.value) {
        filteredRoomTypes.value.push(selectedRoomType.value);
        filteredRoomTypes.value.sort((a, b) => a.id - b.id);
        selectedRoomType.value = null;
        toast.add({ severity: "info", summary: "Room Removed", detail: "The selected room has been removed.", life: 3000 });
    }
}

function openConfirmDialog() { showConfirmDialog.value = true; }
function closeConfirmDialog() { showConfirmDialog.value = false; }
function removeItem(item) {
    selectedItems.value = selectedItems.value.filter(
        (selected) => selected.serialNumber !== item.serialNumber
    );
    toast.add({
        severity: "info",
        summary: "Item Removed",
        detail: `${item.productName} (${item.serialNumber}) removed.`,
        life: 3000,
    });
}
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        newRoom.value.imageFile = file;
        const reader = new FileReader();
        reader.onload = () => {
            newRoom.value.imageUrl = reader.result;
        };
        reader.readAsDataURL(file);
    } else {
        toast.add({
            severity: "warn",
            summary: "No Image Selected",
            detail: "Please select an image to upload.",
            life: 3000,
        });
    }
}

function removeImage() {
  if (lastPreviewUrl) {
    URL.revokeObjectURL(lastPreviewUrl);
    lastPreviewUrl = null;
  }
  newRoom.value.imageUrl = "";
  newRoom.value.imageFile = null;
  toast.add({
    severity: "info",
    summary: "Image Removed",
    detail: "Room image has been removed.",
    life: 3000,
  });
}

async function saveRoom() {
    // Assign selected room type data
    if (selectedRoomType.value) {
        newRoom.value.typeId = selectedRoomType.value.id;
        newRoom.value.categoryId = selectedRoomType.value.category_id;
        newRoom.value.description = selectedRoomType.value.description;
        newRoom.value.occupancy = selectedRoomType.value.occupancy;
        newRoom.value.rates = {
            "6hrs": selectedRoomType.value.rate_6hrs,
            "12hrs": selectedRoomType.value.rate_12hrs,
            "24hrs": selectedRoomType.value.rate_24hrs,
        };
        newRoom.value.discountedRates = {
            "6hrs": selectedRoomType.value.discounted_6hrs,
            "12hrs": selectedRoomType.value.discounted_12hrs,
            "24hrs": selectedRoomType.value.discounted_24hrs,
        };
        newRoom.value.discountPercent = selectedRoomType.value.discount_percent;
    }
    newRoom.value.amenities = selectedItems.value.map(i => i.serialNumber);

    // --- VALIDATION ---
    if (!newRoom.value.roomName.trim() || !newRoom.value.typeId || !newRoom.value.floorNumber) {
        toast.add({
            severity: "warn",
            summary: "Validation Error",
            detail: "Please complete all fields before submitting.",
            life: 3000,
        });
        return;
    }

    // --- Build FormData ---
    const formData = new FormData();
    formData.append('room_number', newRoom.value.roomName);
    formData.append('floor_number', newRoom.value.floorNumber.value || newRoom.value.floorNumber);
    formData.append('description', newRoom.value.Rdescription);
    formData.append('type_id', newRoom.value.typeId);
    formData.append('category_id', newRoom.value.categoryId);
    formData.append('occupancy', newRoom.value.occupancy);
    if (newRoom.value.imageFile) {
        formData.append('image', newRoom.value.imageFile);
    }
    formData.append('amenities', JSON.stringify(newRoom.value.amenities)); // Array of serials

    try {
        await addRoom(formData); // Will be handled as multipart/form-data
        toast.add({
            severity: "success",
            summary: "Room Added",
            detail: `Room "${newRoom.value.roomName}" added successfully.`,
            life: 3000,
        });
        // Reset form
        currentStep.value = 1;
        newRoom.value = {
            roomName: "",
            floorNumber: "",
            imageUrl: "",
            imageFile: null,
            typeId: null,
            categoryId: null,
            Rdescription: "",
            occupancy: 0,
            rates: { "6hrs": 0, "12hrs": 0, "24hrs": 0 },
            amenities: [],
        };
        if (selectedRoomType.value) {
            filteredRoomTypes.value.push(selectedRoomType.value);
            filteredRoomTypes.value.sort((a, b) => a.id - b.id);
            selectedRoomType.value = null;
        }
        selectedItems.value = [];
        completedSteps.value = [];
        showConfirmDialog.value = false;

         await fetchAmenities();

         await fetchRooms();
    } catch (error) {
        toast.add({
            severity: "error",
            summary: "Error",
            detail: error.response?.data?.error || "Failed to add room.",
            life: 3000,
        });
    }
}
</script>




<template>
    <div class="card">
        <h1 class="text-2xl font-bold mb-4">Add New Room</h1>

        <!-- Stepper -->
        <div class="mb-4">
            <Stepper :value="currentStep">
  <StepList>
    <Step
      v-for="step in [1, 2, 3, 4]"
      :key="step"
      :value="step"
      :class="{
        'text-green-500': completedSteps.includes(step),
        'text-blue-500 font-bold': currentStep === step,
        'cursor-pointer': canClickStep(step), // Only allow click if function returns true
        'pointer-events-none opacity-60': !canClickStep(step), // Show disabled state
      }"
      @click="canClickStep(step) && goToStep(step)"
    >
      <template v-if="step === 1">General Information</template>
      <template v-else-if="step === 2">Rates</template>
      <template v-else-if="step === 3">Assign Amenities</template>
      <template v-else>Review & Submit</template>
    </Step>
  </StepList>
</Stepper>
        </div>

      
        <!-- Step 1: General Information -->
        <div v-if="currentStep === 1" class="space-y-4">
            <!-- Image Upload -->
            <div class="card border-b border-gray-300">
                <label for="roomImage" class="block mb-1 font-medium"
                    >Upload Room Image</label
                >
                <input
                    type="file"
                    id="roomImage"
                    accept="image/*"
                    @change="handleImageUpload"
                    class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-500 hover:file:bg-green-100"
                />
                <!-- Image Preview -->
                <div
                    v-if="newRoom.imageUrl"
                    class="mt-4 flex items-center gap-4"
                >
                    <img
                        :src="newRoom.imageUrl"
                        alt="Room Preview"
                        class="w-24 h-24 object-cover rounded-md border border-gray-300"
                    />
                    <div>
                        <p class="text-sm font-medium text-gray-700">
                            Preview:
                        </p>
                        <p class="text-sm text-gray-500">Room Image Selected</p>
                    </div>
                    <Button
                        label="Remove"
                        icon="pi pi-times"
                        class="p-button-danger p-button-sm"
                        @click="removeImage"
                    />
                </div>
            </div>

            <!-- Room Number -->
            <div>
                <label for="roomName" class="block mb-1 font-medium"
                    >Room Number</label
                >
                <InputText
                    v-model="newRoom.roomName"
                    id="roomName"
                    placeholder="Enter room number"
                    class="w-full"
                />

                <div class="flex items-center gap-2 mt-1">
  <small class="text-xs text-gray-400">Suggested: {{ nextRoomNumber }}</small>
  <span
    v-if="isRoomNumberDuplicate"
    class="ml-2 text-xs font-semibold text-red-600 flex items-center gap-1"
  >
    <i class="pi pi-exclamation-triangle"></i> Room already exists!
  </span>
</div>


<div class="mt-2">
  <Button
    label="View Existing Rooms"
    icon="pi pi-list"
    size="small"
    outlined
    @click="showExistingDialog = true"
  />
</div>


<Dialog
  v-model:visible="showExistingDialog"
  header="Existing Rooms"
  :modal="true"
  :dismissable-mask="true"
  :style="{ width: '28rem' }"
  :breakpoints="{ '960px': '90vw', '640px': '95vw' }"
>
  <div class="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
    <div v-for="(rooms, floor) in roomsByFloor" :key="floor" class="pb-2">
      <div class="font-semibold mb-1">{{ floor }}</div>

      <!-- horizontally scrollable row -->
      <div
        v-if="rooms.length"
        class="flex flex-nowrap overflow-x-auto gap-2 pr-1 py-1"
      >
       <Button
  v-for="room in rooms"
  :key="room.id"
  unstyled
  :label="String(room.room_number)"
  @click="useExistingRoom(room)"
  class="inline-block px-3 py-1 rounded bg-green-100 text-green-700 text-sm cursor-pointer hover:bg-green-200 shrink-0"
/>

      </div>
      <div v-else class="text-gray-400 text-sm">No rooms found.</div>

      <hr class="mt-2" />
    </div>
  </div>

  <template #footer>
    <Button label="Close" icon="pi pi-times" severity="secondary" @click="showExistingDialog = false" />
  </template>
</Dialog>

            </div>

            <!-- Floor Number -->
            <div>
                <label class="block mb-1 font-medium">Floor Number</label>
<Select
  v-model="newRoom.floorNumber"
  :options="floorOptions"
  optionLabel="label"
  placeholder="Select Floor Number"
  class="w-full"
  inputId="floorNumber"
/>
            </div>

            <div>
                <label for="Rdescription" class="block mb-1 font-medium"
                    >Description</label
                >
                <Textarea
                    v-model="newRoom.Rdescription"
                    id="Rdescription"
                    placeholder="Enter Description"
                    class="w-full"
                />
            </div>

            <!-- Next Button -->
            <div class="flex justify-end">
                <Button
                    label="Next"
                    icon="pi pi-arrow-right"
                    @click="validateGeneralInfo"
                    />
            </div>
        </div>

        <div v-if="currentStep === 2" class="space-y-6">
            <!-- Selected Room Preview -->
            <div
                v-if="selectedRoomType"
                class="mt-6 card shadow-md p-4 flex flex-col relative"
            >
                <div>
                    <span>
                        <span class="text-lg font-bold text-green-500">
                            Selected Room Rate
                        </span>
                    </span>
                </div>

                <!-- Discount Badge -->
                <span
                    v-if="selectedRoomType.discountPercentage"
                    class="absolute top-2 right-2 bg-red-500 text-white text-sm font-bold px-4 py-1 rounded-full shadow-lg"
                >
                    -{{ selectedRoomType.discountPercentage }}%
                </span>

                <h3 class="text-xl font-bold">{{ selectedRoomType.name }}</h3>
                <p class="text-sm mb-2">
                    {{
                        roomCategories.find(
                            (category) =>
                                category.id === selectedRoomType.category_id,
                        )?.category || "Unknown Category"
                    }}
                </p>
                <p class="text-sm mb-4">{{ selectedRoomType.description }}</p>
                <p class="text-sm mb-4">
                    <i class="pi pi-users"></i>
                    Occupancy: {{ selectedRoomType.occupancy }} person(s)
                </p>
                <div
                    class="grid grid-cols-3 gap-4 bg-gray-100 dark:bg-black p-4 rounded-lg mb-4"
                >
                    <div>
                        <p class="text-sm font-bold">6hrs:</p>
                        <p>
                            <span
                                v-if="
                                    selectedRoomType.rates &&
                                    selectedRoomType.rates['6hrs']
                                "
                            >
                                <span
                                    v-if="
                                        selectedRoomType.discountedRates?.[
                                            '6hrs'
                                        ]
                                    "
                                >
                                    <span class="line-through text-red-400">
                                        ₱{{
                                            selectedRoomType.rates[
                                                "6hrs"
                                            ].toLocaleString("en-PH")
                                        }}
                                    </span>
                                    <span class="text-gray-500 font-bold">
                                        ₱{{
                                            selectedRoomType.discountedRates[
                                                "6hrs"
                                            ].toLocaleString("en-PH")
                                        }}
                                    </span>
                                </span>
                                <span v-else>
                                    ₱{{
                                        selectedRoomType.rates[
                                            "6hrs"
                                        ].toLocaleString("en-PH")
                                    }}
                                </span>
                            </span>
                            <span v-else class="text-sm text-red-500">
                                Rate not available
                            </span>
                        </p>
                    </div>
                    <div>
                        <p class="text-sm font-bold">12hrs:</p>
                        <p>
                            <span
                                v-if="
                                    selectedRoomType.rates &&
                                    selectedRoomType.rates['12hrs']
                                "
                            >
                                <span
                                    v-if="
                                        selectedRoomType.discountedRates?.[
                                            '12hrs'
                                        ]
                                    "
                                >
                                    <span class="line-through text-red-400">
                                        ₱{{
                                            selectedRoomType.rates[
                                                "12hrs"
                                            ].toLocaleString("en-PH")
                                        }}
                                    </span>
                                    <span class="text-gray-500 font-bold">
                                        ₱{{
                                            selectedRoomType.discountedRates[
                                                "12hrs"
                                            ].toLocaleString("en-PH")
                                        }}
                                    </span>
                                </span>
                                <span v-else>
                                    ₱{{
                                        selectedRoomType.rates[
                                            "12hrs"
                                        ].toLocaleString("en-PH")
                                    }}
                                </span>
                            </span>
                            <span v-else class="text-sm text-red-500">
                                Rate not available
                            </span>
                        </p>
                    </div>
                    <div>
                        <p class="text-sm font-bold">24hrs:</p>
                        <p>
                            <span
                                v-if="
                                    selectedRoomType.rates &&
                                    selectedRoomType.rates['24hrs']
                                "
                            >
                                <span
                                    v-if="
                                        selectedRoomType.discountedRates?.[
                                            '24hrs'
                                        ]
                                    "
                                >
                                    <span class="line-through text-red-400">
                                        ₱{{
                                            selectedRoomType.rates[
                                                "24hrs"
                                            ].toLocaleString("en-PH")
                                        }}
                                    </span>
                                    <span class="text-gray-500 font-bold">
                                        ₱{{
                                            selectedRoomType.discountedRates[
                                                "24hrs"
                                            ].toLocaleString("en-PH")
                                        }}
                                    </span>
                                </span>
                                <span v-else>
                                    ₱{{
                                        selectedRoomType.rates[
                                            "24hrs"
                                        ].toLocaleString("en-PH")
                                    }}
                                </span>
                            </span>
                            <span v-else class="text-sm text-red-500">
                                Rate not available
                            </span>
                        </p>
                    </div>
                </div>
                <!-- Remove Button -->
                <Button
                    label="Remove"
                    icon="pi pi-times"
                    class="p-button-danger mt-4"
                    @click="removeSelectedRoom"
                    style="width: 150px"
                />
            </div>

            <div>
                <span class="text-lg font-bold text-green-500"
                    >Select Room Rates</span
                >
            </div>
            <!-- Room Types Card Layout -->
            <div class="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
                <div
                    v-for="type in filteredRoomTypes"
                    :key="type.id"
                    @click="!selectedRoomType.value && selectCard(type)"
                >
                    <div
                        class="card shadow-md p-4 flex flex-col h-[290px] relative cursor-pointer"
                        @click="selectCard(type)"
                    >
                        <!-- Discount Badge -->
                        <span
                            v-if="type.discountPercentage"
                            class="absolute top-2 right-2 bg-red-500 text-white text-sm font-bold px-4 py-1 rounded-full shadow-lg"
                        >
                            -{{ type.discountPercentage }}%
                        </span>

                        <h3 class="text-xl font-bold">{{ type.name }}</h3>
                        <p class="text-sm mb-2">
                            {{
                                roomCategories.find(
                                    (category) =>
                                        category.id === type.category_id,
                                )?.category || "Unknown Category"
                            }}
                        </p>
                        <p class="text-sm mb-4">{{ type.description }}</p>
                        <p class="text-sm mb-4">
                            <i class="pi pi-users"></i>
                            Occupancy: {{ type.occupancy }} person(s)
                        </p>
                        <div class="grid grid-cols-3 gap-4 p-4 rounded-lg mb-4">
                            <div>
                                <p class="text-sm font-bold">6hrs:</p>
                                <p>
                                    <span
                                        v-if="type.rates && type.rates['6hrs']"
                                    >
                                        <span
                                            v-if="
                                                type.discountedRates?.['6hrs']
                                            "
                                        >
                                            <span
                                                class="line-through text-red-400"
                                            >
                                                ₱{{
                                                    type.rates[
                                                        "6hrs"
                                                    ].toLocaleString("en-PH")
                                                }}
                                            </span>
                                            <span class="font-bold">
                                                ₱{{
                                                    type.discountedRates[
                                                        "6hrs"
                                                    ].toLocaleString("en-PH")
                                                }}
                                            </span>
                                        </span>
                                        <span v-else>
                                            ₱{{
                                                type.rates[
                                                    "6hrs"
                                                ].toLocaleString("en-PH")
                                            }}
                                        </span>
                                    </span>
                                    <span v-else class="text-sm text-red-500">
                                        Rate not available
                                    </span>
                                </p>
                            </div>
                            <div>
                                <p class="text-sm font-bold">12hrs:</p>
                                <p>
                                    <span
                                        v-if="type.rates && type.rates['12hrs']"
                                    >
                                        <span
                                            v-if="
                                                type.discountedRates?.['12hrs']
                                            "
                                        >
                                            <span
                                                class="line-through text-red-400"
                                            >
                                                ₱{{
                                                    type.rates[
                                                        "12hrs"
                                                    ].toLocaleString("en-PH")
                                                }}
                                            </span>
                                            <span class="font-bold">
                                                ₱{{
                                                    type.discountedRates[
                                                        "12hrs"
                                                    ].toLocaleString("en-PH")
                                                }}
                                            </span>
                                        </span>
                                        <span v-else>
                                            ₱{{
                                                type.rates[
                                                    "12hrs"
                                                ].toLocaleString("en-PH")
                                            }}
                                        </span>
                                    </span>
                                    <span v-else class="text-sm text-red-500">
                                        Rate not available
                                    </span>
                                </p>
                            </div>
                            <div>
                                <p class="text-sm font-bold">24hrs:</p>
                                <p>
                                    <span
                                        v-if="type.rates && type.rates['24hrs']"
                                    >
                                        <span
                                            v-if="
                                                type.discountedRates?.['24hrs']
                                            "
                                        >
                                            <span
                                                class="line-through text-red-400"
                                            >
                                                ₱{{
                                                    type.rates[
                                                        "24hrs"
                                                    ].toLocaleString("en-PH")
                                                }}
                                            </span>
                                            <span class="font-bold">
                                                ₱{{
                                                    type.discountedRates[
                                                        "24hrs"
                                                    ].toLocaleString("en-PH")
                                                }}
                                            </span>
                                        </span>
                                        <span v-else>
                                            ₱{{
                                                type.rates[
                                                    "24hrs"
                                                ].toLocaleString("en-PH")
                                            }}
                                        </span>
                                    </span>
                                    <span v-else class="text-sm text-red-500">
                                        Rate not available
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div>
                            <Button
                                label="Select"
                                icon="pi pi-check"
                                class="p-button-primary w-full"
                                @click.stop="selectCard(type)"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div class="flex justify-between">
                <Button
                    label="Back"
                    icon="pi pi-arrow-left"
                    @click="prevStep"
                />
                <Button
                    label="Next"
                    icon="pi pi-arrow-right"
                    @click="validateRates"
                />
            </div>
        </div>

        <!-- Step 3: Assign Amenities -->
        <div v-if="currentStep === 3" class="space-y-4">
            <div class="card">
                <h2 class="text-lg font-bold mb-4">Assigned Amenities</h2>
                <!-- Button to Open Dialog -->
                <div class="mt-4">
                    <Button
  label="Open Inventory"
  icon="pi pi-plus"
  class="p-button-sm p-button-primary mb-4"
  @click="isAmenitiesDialogVisible = true"
/>
                </div>

                <!-- Check if there are selected items -->
                <div v-if="selectedItems.length > 0">
                    <DataTable
                        :value="selectedItems"
                        class="p-datatable-sm"
                        dataKey="serialNumber"
                    >
                        <Column field="productName" header="Product Name" />
                        <Column field="serialNumber" header="Serial Number" />
                        <Column field="category" header="Category" />
                        <Column field="brand" header="Brand" />
                        <Column field="status" header="Status" />
                        <Column header="Actions">
                            <template #body="slotProps">
                                <Button
                                    icon="pi pi-trash"
                                    class="p-button-sm p-button-danger"
                                    @click="removeItem(slotProps.data)"
                                    outlined
                                    rounded
                                />
                            </template>
                        </Column>
                    </DataTable>
                </div>
                <div v-else class="text-red-500 font-semibold">
                    No amenities assigned.
                </div>

                <!-- Dialog for DataTable -->
                <!-- Edit Amenities Dialog -->
<Dialog
  v-model:visible="isAmenitiesDialogVisible"
  header="Select Amenities"
  :modal="true"
  :dismissable-mask="true"
  :closable="true"
  :style="{ width: '50vw' }"
>
  <div>
    <h3 class="text-lg font-medium mb-4">Available Products</h3>

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
    <!-- DataTable for Available Amenities -->
    <DataTable
      :value="availableAmenities"
      selection-mode="multiple"
      v-model:selection="selectedAmenities"
      dataKey="serialNumber"
      class="w-full"
      :paginator="true"
      :rows="5"
    >
      <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
      <Column field="productName" header="Product Name" sortable></Column>
      <Column field="brand" header="Brand" sortable></Column>
      <Column field="type" header="Type" sortable></Column>
      <Column field="serialNumber" header="Serial Number" sortable></Column>
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
        severity="secondary"
        @click="closeAmenitiesDialog"
      ></Button>
    </div>
  </div>
</Dialog>


                <!-- Navigation Buttons -->
                <div class="flex justify-between mt-5">
                    <Button
                        label="Back"
                        icon="pi pi-arrow-left"
                        @click="prevStep"
                    />
                    <Button
                        label="Next"
                        icon="pi pi-arrow-right"
                        @click="nextStep"
                    />
                </div>
            </div>
        </div>

        <div v-if="currentStep === 4" class="space-y-6">
            <h2 class="text-lg font-semibold">Review Details</h2>

            <!-- General Information -->
            <div class="card shadow-md p-4">
                <h3 class="text-xl font-bold mb-2">General Information</h3>
                <p class="flex items-center">
  <strong>Room Number:</strong>
  <span class="ml-1">
    {{ newRoom.roomName }}
    <span
      v-if="!newRoom.roomName.trim()"
      class="ml-2 text-xs font-semibold text-yellow-600 px-2 py-1 rounded inline-flex items-center gap-1"
    >
      <i class="pi pi-exclamation-triangle"></i> Room number not entered!
    </span>
    <span
      v-else-if="isRoomNumberDuplicate"
      class="ml-2 text-xs font-semibold text-red-600 inline-flex items-center gap-1"
    >
      <i class="pi pi-exclamation-triangle"></i> Room already exists!
    </span>
  </span>
</p>
                
               <p class="flex items-center">
  <strong>Floor Number:</strong>
  <span class="ml-1">
    {{ newRoom.floorNumber?.label || '' }}
    <span
      v-if="!newRoom.floorNumber"
      class="ml-2 text-xs font-semibold text-yellow-600 inline-flex items-center gap-1"
    >
      <i class="pi pi-exclamation-triangle"></i> Floor not assigned!
    </span>
  </span>
</p>

                <p>
                    <strong>Description:</strong>
                    {{ newRoom.Rdescription }}
                </p>

                  <!-- Room Image -->
                <div class="mt-5">
  <p class="flex items-center mb-2">
    <strong>Room Image:</strong>
    <span v-if="!newRoom.imageUrl" class="ml-2 text-xs font-semibold text-yellow-600 inline-flex items-center gap-1">
      <i class="pi pi-exclamation-triangle"></i> Room image not uploaded!
    </span>
  </p>
  <div v-if="newRoom.imageUrl" class="w-full">
    <img
      :src="newRoom.imageUrl"
      alt="Room Preview"
      class="w-full max-h-64 object-cover rounded-md border"
    />
  </div>
</div>

            </div>

            <!-- Selected Room Preview -->
            <div v-if="selectedRoomType" class="card shadow-md p-4">
                <h3 class="text-xl font-bold mb-2">Selected Room</h3>
                <p><strong>Room Type:</strong> {{ selectedRoomType.name }}</p>
                <p>
                    <strong>Category:</strong>
                    {{
                        roomCategories.find(
                            (category) =>
                                category.id === selectedRoomType.category_id,
                        )?.category || "Unknown Category"
                    }}
                </p>

                <p>
                    <strong>Occupancy:</strong>
                    {{ selectedRoomType.occupancy }} person(s)
                </p>

                <!-- Room Rates -->
                <h4 class="text-lg font-bold mt-4">Rates</h4>
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <p class="font-semibold">6 Hours:</p>
                        <p>
                            <span
                                v-if="
                                    selectedRoomType.rates &&
                                    selectedRoomType.rates['6hrs']
                                "
                            >
                                <span
                                    v-if="
                                        selectedRoomType.discountedRates?.[
                                            '6hrs'
                                        ]
                                    "
                                >
                                    <span class="line-through text-red-400">
                                        ₱{{
                                            selectedRoomType.rates[
                                                "6hrs"
                                            ].toLocaleString("en-PH")
                                        }}
                                    </span>
                                    <span class="text-gray-500 font-bold">
                                        ₱{{
                                            selectedRoomType.discountedRates[
                                                "6hrs"
                                            ].toLocaleString("en-PH")
                                        }}
                                    </span>
                                </span>
                                <span v-else>
                                    ₱{{
                                        selectedRoomType.rates[
                                            "6hrs"
                                        ].toLocaleString("en-PH")
                                    }}
                                </span>
                            </span>
                            <span v-else class="text-sm text-red-500">
                                Rate not available
                            </span>
                        </p>
                    </div>
                    <div>
                        <p class="font-semibold">12 Hours:</p>
                        <p>
                            <span
                                v-if="
                                    selectedRoomType.rates &&
                                    selectedRoomType.rates['12hrs']
                                "
                            >
                                <span
                                    v-if="
                                        selectedRoomType.discountedRates?.[
                                            '12hrs'
                                        ]
                                    "
                                >
                                    <span class="line-through text-red-400">
                                        ₱{{
                                            selectedRoomType.rates[
                                                "12hrs"
                                            ].toLocaleString("en-PH")
                                        }}
                                    </span>
                                    <span class="text-gray-500 font-bold">
                                        ₱{{
                                            selectedRoomType.discountedRates[
                                                "12hrs"
                                            ].toLocaleString("en-PH")
                                        }}
                                    </span>
                                </span>
                                <span v-else>
                                    ₱{{
                                        selectedRoomType.rates[
                                            "12hrs"
                                        ].toLocaleString("en-PH")
                                    }}
                                </span>
                            </span>
                            <span v-else class="text-sm text-red-500">
                                Rate not available
                            </span>
                        </p>
                    </div>
                    <div>
                        <p class="font-semibold">24 Hours:</p>
                        <p>
                            <span
                                v-if="
                                    selectedRoomType.rates &&
                                    selectedRoomType.rates['24hrs']
                                "
                            >
                                <span
                                    v-if="
                                        selectedRoomType.discountedRates?.[
                                            '24hrs'
                                        ]
                                    "
                                >
                                    <span class="line-through text-red-400">
                                        ₱{{
                                            selectedRoomType.rates[
                                                "24hrs"
                                            ].toLocaleString("en-PH")
                                        }}
                                    </span>
                                    <span class="text-gray-500 font-bold">
                                        ₱{{
                                            selectedRoomType.discountedRates[
                                                "24hrs"
                                            ].toLocaleString("en-PH")
                                        }}
                                    </span>
                                </span>
                                <span v-else>
                                    ₱{{
                                        selectedRoomType.rates[
                                            "24hrs"
                                        ].toLocaleString("en-PH")
                                    }}
                                </span>
                            </span>
                            <span v-else class="text-sm text-red-500">
                                Rate not available
                            </span>
                        </p>
                    </div>
                </div>

                <!-- Remove Button -->
                <Button
                    label="Remove Room"
                    icon="pi pi-times"
                    class="p-button-danger mt-4"
                    @click="removeSelectedRoom"
                />
            </div>

            <!-- Assigned Amenities Preview -->
            <div class="card shadow-md p-4">
                <h3 class="text-xl font-bold mb-2">Assigned Amenities</h3>
                <div v-if="selectedItems.length > 0">
                    <DataTable
                        :value="selectedItems"
                        class="p-datatable-sm"
                        dataKey="serialNumber"
                    >
                        <Column field="productName" header="Product Name" />
                        <Column field="serialNumber" header="Serial Number" />
                        <Column field="category" header="Category" />
                        <Column field="brand" header="Brand" />
                        <Column field="status" header="Status" />
                    </DataTable>
                </div>
                <div v-else class="text-red-500">No amenities assigned.</div>
            </div>

            <!-- Navigation Buttons -->
            <div class="flex justify-between mt-4">
                <Button
                    label="Back"
                    icon="pi pi-arrow-left"
                    @click="prevStep"
                />
                <Button
                    label="Submit"
                    icon="pi pi-check"
                    class="p-button-primary"
                      :disabled="!canSubmit || isRoomNumberDuplicate"
                      
                    @click="openConfirmDialog"
                    
                />
            </div>
        </div>

        <!-- Confirmation Dialog -->
        <Dialog
            header="Confirm Submission"
            v-model:visible="showConfirmDialog"
            style="width: 400px"
            :modal="true"
            :dismissableMask="true"
        >
            <p class="text-sm">Are you sure you want to submit this room?</p>
            <div class="flex justify-end mt-4 gap-2">
                <Button
                    label="Submit"
                    class=" p-button-sm"
                    @click="saveRoom"
                />
                <Button
                    label="Cancel"
                    severity="secondary"
                    class="p-button-secondary p-button-sm"
                    @click="closeConfirmDialog"
                />
            </div>
        </Dialog>
        <Toast />
    </div>
</template>
