<script setup>
import { useToast } from "primevue/usetoast";
import { computed, ref, onMounted } from "vue";
import {
  fetchRoomCategories,
  fetchRoomTypes,
  addRoomType,
  updateRoomType,
  deleteRoomType,
  addRoomCategory,
  deleteRoomCategory,
} from "@/api/auth";

const toast = useToast();

/* -------- State -------- */
const showCategoryDialog = ref(false);
const newCategoryName = ref("");
const newCategoryDesc = ref("");

const roomCategories = ref([]);
const roomTypes = ref([]);

/* Dialog/Input states */
const showAddTypeDialog = ref(false);
const selectedCategory = ref(null);
const newType = ref({
  name: "",
  occupancy: 1,
  rates: { "6hrs": 0, "12hrs": 0, "24hrs": 0 },
  description: "",
});

/* Filters */
const selectedCategoryId = ref(null);
const typeFilter = ref("");

function clearFilters() {
  selectedCategoryId.value = null;
  typeFilter.value = "";
}

/* Loaders */
async function loadCategories() {
  try {
    const res = await fetchRoomCategories();
    roomCategories.value = res.data;
  } catch {
    toast.add({ severity: "error", summary: "Failed to load categories" });
  }
}

async function loadTypes() {
  try {
    const res = await fetchRoomTypes();
    roomTypes.value = res.data.map((type) => ({
      ...type,
      // normalize field name
      categoryId: type.category_id ?? type.categoryId,
    }));
  } catch {
    toast.add({ severity: "error", summary: "Failed to load types" });
  }
}

onMounted(async () => {
  await loadCategories();
  await loadTypes();
});

/* Category dialog */
function openCategoryDialog() {
  showCategoryDialog.value = true;
  newCategoryName.value = "";
  newCategoryDesc.value = "";
}
function closeCategoryDialog() {
  showCategoryDialog.value = false;
  newCategoryName.value = "";
  newCategoryDesc.value = "";
}
async function saveCategory() {
  if (!newCategoryName.value.trim()) {
    toast.add({
      severity: "warn",
      summary: "Validation Error",
      detail: "Please enter a category name.",
      life: 3000,
    });
    return;
  }
  try {
    await addRoomCategory({
      category: newCategoryName.value,
      description: newCategoryDesc.value,
    });
    toast.add({ severity: "success", summary: "Category Added!", life: 3000 });
    await loadCategories();
    closeCategoryDialog();
  } catch {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to add category.",
      life: 3000,
    });
  }
}
async function removeCategory(cat) {
  if (!confirm(`Delete category "${cat.category}"?`)) return;
  try {
    await deleteRoomCategory(cat.id);
    toast.add({
      severity: "success",
      summary: "Deleted!",
      detail: `Category "${cat.category}" deleted.`,
      life: 5000,
    });
    await loadCategories();
  } catch {
    toast.add({
      severity: "warn",
      summary: "Action Blocked",
      detail:
        `Cannot delete "${cat.category}" because it is still assigned to one or more rooms. Please reassign or remove those rooms first.`,
      life: 6000,
    });
  }
}

/* Add type dialog */
function openAddTypeDialog() {
  showAddTypeDialog.value = true;
  resetForm();
}
function closeAddTypeDialog() {
  showAddTypeDialog.value = false;
  resetForm();
}
function resetForm() {
  selectedCategory.value = null;
  newType.value = {
    name: "",
    occupancy: 1,
    rates: { "6hrs": 0, "12hrs": 0, "24hrs": 0 },
    description: "",
  };
}
async function saveType() {
  if (!selectedCategory.value) {
    toast.add({
      severity: "warn",
      summary: "Validation Error",
      detail: "Please select a category.",
      life: 3000,
    });
    return;
  }
  if (!newType.value.name.trim()) {
    toast.add({
      severity: "warn",
      summary: "Validation Error",
      detail: "Please enter a type name.",
      life: 3000,
    });
    return;
  }
  if (newType.value.occupancy <= 0) {
    toast.add({
      severity: "warn",
      summary: "Validation Error",
      detail: "Please enter a valid occupancy limit.",
      life: 3000,
    });
    return;
  }
  try {
    await addRoomType({
      categoryId: selectedCategory.value.id,
      name: newType.value.name,
      occupancy: newType.value.occupancy,
      rates: { ...newType.value.rates },
      description: newType.value.description,
    });
    toast.add({
      severity: "success",
      summary: "Type Added",
      detail: `Room type "${newType.value.name}" added!`,
      life: 3000,
    });
    closeAddTypeDialog();
    await loadTypes();
  } catch {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to add room type.",
      life: 3000,
    });
  }
}

/* Delete type */
const showDeleteDialog = ref(false);
const deleteType = ref(null);
function openDeleteDialog(type) {
  deleteType.value = type;
  showDeleteDialog.value = true;
}
function closeDeleteDialog() {
  deleteType.value = null;
  showDeleteDialog.value = false;
}
async function confirmDelete() {
  if (!deleteType.value) return;
  try {
    await deleteRoomType(deleteType.value.id);
    toast.add({
      severity: "error",
      summary: "Delete Successful",
      detail: `Room type "${deleteType.value.name}" deleted.`,
      life: 3000,
    });
    closeDeleteDialog();
    await loadTypes();
  } catch (err) {
    const detail =
      err?.response?.data?.error ||
      `Cannot delete room type "${deleteType.value.name}" because it is used by existing rooms. Update those rooms first.`;
    toast.add({
      severity: "warn",
      summary: "Cannot Delete Room Type",
      detail,
      life: 5000,
    });
  }
}

/* Edit type */
const showEditDialog = ref(false);
const editType = ref(null);
function openEditDialog(type) {
  editType.value = { ...type };
  showEditDialog.value = true;
}
function closeEditDialog() {
  editType.value = null;
  showEditDialog.value = false;
}
async function saveEdit() {
  if (!editType.value) return;
  try {
    await updateRoomType(editType.value.id, {
      categoryId: editType.value.categoryId,
      name: editType.value.name,
      occupancy: editType.value.occupancy,
      rates: { ...editType.value.rates },
      description: editType.value.description,
    });
    toast.add({
      severity: "success",
      summary: "Edit Successful",
      detail: `Room type "${editType.value.name}" updated.`,
      life: 3000,
    });
    closeEditDialog();
    await loadTypes();
  } catch {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to update room type.",
      life: 3000,
    });
  }
}

/* Filtered list */
const filteredRoomTypes = computed(() => {
  let filtered = roomTypes.value;
  if (selectedCategoryId.value !== null && selectedCategoryId.value !== undefined) {
    filtered = filtered.filter((t) => t.categoryId == selectedCategoryId.value);
  }
  if (typeFilter.value.trim()) {
    const keyword = typeFilter.value.trim().toLowerCase();
    filtered = filtered.filter((t) => t.name.toLowerCase().includes(keyword));
  }
  return filtered;
});
</script>

<template>
  <div class="card flex flex-col max-h-[calc(100vh-8rem)]">
    <h1 class="text-2xl font-bold mb-4 flex-shrink-0">Room Rate Configuration</h1>

    <div class="flex gap-4 mb-6 flex-shrink-0">
      <Button
        type="button"
        icon="pi pi-filter-slash"
        label="Clear"
        outlined
        @click="clearFilters"
      />

      <Select
        v-model="selectedCategoryId"
        :options="[{ id: null, category: 'All Categories' }, ...roomCategories]"
        optionLabel="category"
        optionValue="id"
        placeholder="Filter by Category"
      />

      <InputText v-model="typeFilter" placeholder="Search by Type Name" />

      <Button
        label="Add Type"
        primary
        icon="pi pi-plus"
        @click="openAddTypeDialog"
      />
      <Button
        label="Categories"
        primary
        icon="pi pi-plus"
        @click="openCategoryDialog"
      />
    </div>

    <!-- Manage Categories -->
    <Dialog
      v-model:visible="showCategoryDialog"
      header="Manage Categories"
      :modal="true"
      style="width: 32vw"
      :dismissable-mask="true"
      :closable="true"
    >
      <div class="mb-4">
        <label class="block mb-1">Category Name</label>
        <InputText v-model="newCategoryName" class="w-full" placeholder="Enter new category" />
      </div>
      <div class="mb-4">
        <label class="block mb-1">Description</label>
        <Textarea v-model="newCategoryDesc" class="w-full" rows="2" placeholder="(Optional)" />
      </div>
      <div class="flex justify-end gap-2 mb-4">
        <Button @click="closeCategoryDialog" label="Cancel" class="p-button-secondary" />
        <Button @click="saveCategory" label="Add" class="p-button-primary" />
      </div>
      <hr class="my-2" />
      <div>
        <p class="font-bold mb-2">Existing Categories</p>
        <ul>
          <li v-for="cat in roomCategories" :key="cat.id" class="flex items-center justify-between mb-1">
            <span>
              <b>{{ cat.category }}</b>
              <span v-if="cat.description" class="text-xs text-gray-400 ml-2">({{ cat.description }})</span>
            </span>
            <Button icon="pi pi-trash" size="small" class="p-button-danger" @click="removeCategory(cat)" />
          </li>
        </ul>
      </div>
    </Dialog>

    <!-- Add Type -->
    <Dialog
      :dismissable-mask="true"
      v-model:visible="showAddTypeDialog"
      header="Add New Type"
      :modal="true"
      style="width: 40vw"
    >

     <div class="mb-4">
        <label for="type" class="block mb-1">Type Name</label>
        <InputText
          v-model="newType.name"
          id="type"
          class="w-full px-4 py-2 border rounded-lg"
          placeholder="Enter Type "
        />
      </div>
      
      <div class="mb-4">
        <label for="category" class="block mb-1">Category</label>
        <Select
          v-model="selectedCategory"
          :options="roomCategories"
          optionLabel="category"
          placeholder="Select a category"
          class="w-full"
        />
      </div>

      <div class="mb-4">
        <label for="occupancy" class="block mb-1">Occupancy Limit</label>
        <InputText
          v-model.number="newType.occupancy"
          id="occupancy"
          type="number"
          class="w-full px-4 py-2 border rounded-lg"
          placeholder="Enter occupancy limit"
        />
      </div>

      <div class="mb-4">
        <label class="block mb-1">Rates</label>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label for="rate6hrs" class="block text-sm">6hrs</label>
            <InputText v-model.number="newType.rates['6hrs']" id="rate6hrs" type="number" class="w-full" />
          </div>
          <div>
            <label for="rate12hrs" class="block text-sm">12hrs</label>
            <InputText v-model.number="newType.rates['12hrs']" id="rate12hrs" type="number" class="w-full" />
          </div>
          <div>
            <label for="rate24hrs" class="block text-sm">24hrs</label>
            <InputText v-model.number="newType.rates['24hrs']" id="rate24hrs" type="number" class="w-full" />
          </div>
        </div>
      </div>

      <div class="mb-4">
        <label for="description" class="block mb-1">Description</label>
        <Textarea
          v-model="newType.description"
          id="description"
          placeholder="Enter a brief description for the room type"
          class="w-full px-4 py-2 border rounded-lg"
          rows="3"
        />
      </div>

      <div class="flex justify-end gap-2">
        <Button @click="closeAddTypeDialog" label="Cancel" class="p-button-secondary" />
        <Button @click="saveType" label="Save" class="p-button-primary" />
      </div>
    </Dialog>

    <!-- Cards -->
    <div class="overflow-y-auto flex-1 pr-2">
      <div class="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
        <div v-for="type in filteredRoomTypes" :key="type.id">
          <div class="card shadow-md p-4 flex flex-col h-[290px] border border-white rounded-xl relative">
          <h3 class="text-xl font-bold">{{ type.name }}</h3>
          <p class="text-sm mb-2">
            {{
              roomCategories.find((c) => c.id === (type.category_id ?? type.categoryId))?.category
              || "Unknown Category"
            }}
          </p>
          <p class="text-sm mb-4">{{ type.description }}</p>
          <p class="text-sm mb-4">
            <i class="pi pi-users"></i>
            Occupancy: {{ type.occupancy }} person(s)
          </p>

          <div class="grid grid-cols-3 gap-4 bg-gray-100 dark:bg-black p-4 rounded-lg mb-4">
            <div>
              <p class="text-sm font-bold">6hrs:</p>
              <p>₱{{ (type.rates?.["6hrs"] ?? 0).toLocaleString("en-PH") }}</p>
            </div>
            <div>
              <p class="text-sm font-bold">12hrs:</p>
              <p>₱{{ (type.rates?.["12hrs"] ?? 0).toLocaleString("en-PH") }}</p>
            </div>
            <div>
              <p class="text-sm font-bold">24hrs:</p>
              <p>₱{{ (type.rates?.["24hrs"] ?? 0).toLocaleString("en-PH") }}</p>
            </div>
          </div>

          <div class="mt-auto flex items-center gap-2">
            <Button
              label="Edit"
              class="p-button-primary flex-1 text-center h-10"
              icon="pi pi-pencil"
              @click="openEditDialog(type)"
            />
            <Button
              label="Delete"
              class="p-button-danger flex-1 text-center h-10"
              icon="pi pi-trash"
              @click="openDeleteDialog(type)"
            />
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- Edit Room Type -->
    <Dialog
      v-model:visible="showEditDialog"
      header="Edit Room Type"
      :modal="true"
      style="width: 40vw"
      :dismissable-mask="true"
      :closable="true"
    >
      <div class="mb-4">
        <label for="name" class="block mb-1">Type Name</label>
        <InputText v-model="editType.name" id="name" type="text" class="w-full" placeholder="Enter room type name" />
      </div>

      <div class="mb-4">
        <label for="category" class="block mb-1">Category</label>
        <Select
          v-model="editType.categoryId"
          :options="roomCategories"
          optionLabel="category"
          optionValue="id"
          class="w-full"
          placeholder="Select a category"
        />
      </div>

      <div class="mb-4">
        <label class="block mb-1">Rates</label>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label for="rate6hrs" class="block text-sm">6hrs</label>
            <InputText v-model.number="editType.rates['6hrs']" id="rate6hrs" type="number" class="w-full" />
          </div>
          <div>
            <label for="rate12hrs" class="block text-sm">12hrs</label>
            <InputText v-model.number="editType.rates['12hrs']" id="rate12hrs" type="number" class="w-full" />
          </div>
          <div>
            <label for="rate24hrs" class="block text-sm">24hrs</label>
            <InputText v-model.number="editType.rates['24hrs']" id="rate24hrs" type="number" class="w-full" />
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2">
        <Button label="Cancel" class="p-button-secondary" @click="closeEditDialog" />
        <Button label="Save" class="p-button-primary" @click="saveEdit" />
      </div>
    </Dialog>

    <!-- Delete Dialog -->
    <Dialog v-model:visible="showDeleteDialog" header="Confirm Delete" :modal="true" style="width: 30vw">
      <div class="text-center">
        <p>Are you sure you want to delete the room type:</p>
        <p class="font-bold text-lg">{{ deleteType?.name }}</p>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <Button label="Cancel" class="p-button-secondary" @click="closeDeleteDialog" />
        <Button label="Delete" class="p-button-danger" @click="confirmDelete" />
      </div>
    </Dialog>
  </div>

  <div>
</div>
</template>
