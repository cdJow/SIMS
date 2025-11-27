<script setup>
import { ref, computed, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { getDiscounts, addDiscount, updateDiscount, deleteDiscount } from "@/api/auth";

/* ---------------- State ---------------- */
const toast = useToast();
const confirm = useConfirm();
const promos = ref([]);
const loading = ref(false);
const search = ref("");

/* ------------- Dialog / Form State ------------- */
const showAddDialog = ref(false);
const showEditDialog = ref(false);

const form = ref({ name: "", percent: 0, status: "active" });
const editPromo = ref(null);

/* ----------------- Validation ------------------ */
const errors = ref({ name: "", percent: "" });

function validateForm(target = form.value) {
  errors.value = { name: "", percent: "" };
  const n = (target.name || "").trim();
  const p = Number(target.percent);

  if (!n) errors.value.name = "Promo name is required.";
  if (!Number.isFinite(p) || p <= 0 || p > 100)
    errors.value.percent = "Percent must be between 1 and 100.";

  return !errors.value.name && !errors.value.percent;
}

function toPayload(target) {
  // NO dates included
  return {
    name: (target.name || "").trim(),
    percent: Number(target.percent),
    status: (target.status || "active").toLowerCase(), // 'active' | 'inactive'
  };
}

/* ----------------- Load Data ------------------ */
async function loadPromos() {
  loading.value = true;
  try {
    const res = await getDiscounts();
    promos.value = Array.isArray(res.data)
      ? res.data.map((p) => ({
          id: p.id,
          name: p.name,
          percent: Number(p.percent),
          status: (p.status || (p.active ? "active" : "inactive"))?.toLowerCase(),
          // start/end intentionally ignored/removed from UI
        }))
      : [];
  } catch (err) {
    toast.add({ severity: "error", summary: "Failed to load promos", life: 3000 });
  } finally {
    loading.value = false;
  }
}
onMounted(loadPromos);

/* ----------------- Helpers ------------------ */
function resetForm() {
  form.value = { name: "", percent: 0, status: "active" };
  errors.value = { name: "", percent: "" };
}
function openAddDialog() { resetForm(); showAddDialog.value = true; }
function closeAddDialog() { showAddDialog.value = false; }

function openEditDialog(promo) {
  editPromo.value = { ...promo };
  form.value = {
    name: promo.name,
    percent: promo.percent,
    status: promo.status || "active",
  };
  errors.value = { name: "", percent: "" };
  showEditDialog.value = true;
}
function closeEditDialog() { editPromo.value = null; showEditDialog.value = false; }

/* ----------------- Create/Update/Delete ------------------ */
async function saveNewPromo() {
  if (!validateForm()) return;
  try {
    await addDiscount(toPayload(form.value)); // no dates sent
    toast.add({ severity: "success", summary: "Promo added", detail: form.value.name, life: 3000 });
    closeAddDialog(); await loadPromos();
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: err?.response?.data?.error || "Could not add promo.", life: 4000 });
  }
}
async function saveEditPromo() {
  if (!editPromo.value) return;
  const payload = toPayload(form.value); // no dates sent -> backend should preserve existing dates
  if (!validateForm(payload)) return;
  try {
    await updateDiscount(editPromo.value.id, payload);
    toast.add({ severity: "success", summary: "Promo updated", detail: payload.name, life: 3000 });
    closeEditDialog(); await loadPromos();
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: err?.response?.data?.error || "Could not update promo.", life: 4000 });
  }
}
function removePromo(promo) {
  confirm.require({
    message: `Are you sure you want to delete the promo "${promo.name}"? This action cannot be undone.`,
    header: 'Delete Confirmation',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Delete',
      severity: 'danger'
    },
    accept: async () => {
      try {
        await deleteDiscount(promo.id);
        toast.add({ severity: "warn", summary: "Promo deleted", detail: promo.name, life: 3000 });
        await loadPromos();
      } catch (err) {
        // Check if error is related to existing room usage
        const errorMessage = err?.response?.data?.error || err?.message || "Could not delete promo.";
        
        if (errorMessage === "Failed to delete promo." || errorMessage.toLowerCase().includes('room') || errorMessage.toLowerCase().includes('used') || errorMessage.toLowerCase().includes('referenced')) {
          toast.add({ 
            severity: "error", 
            summary: "Cannot Delete Promo", 
            detail: `"${promo.name}" cannot be deleted because it is currently being used by existing rooms. Please remove this discount from all rooms first.`, 
            life: 6000 
          });
        } else {
          toast.add({ 
            severity: "error", 
            summary: "Error", 
            detail: errorMessage, 
            life: 4000 
          });
        }
      }
    }
  });
}

/* ----------------- Filtering ------------------ */
const filteredPromos = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return promos.value;
  return promos.value.filter((p) => p.name.toLowerCase().includes(q));
});
</script>

<template>
  <div class="card flex flex-col max-h-[calc(100vh-8rem)]">
    <h1 class="text-2xl font-bold mb-4 flex-shrink-0">Discounts & Promos</h1>

    <!-- Toolbar -->
    <div class="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-6 flex-shrink-0">
      <div class="flex gap-2 items-center">
        <InputText v-model="search" placeholder="Search promo name…" class="w-72" />
        <Button icon="pi pi-times" outlined @click="search = ''" label="Clear" />
      </div>
      <div>
        <Button icon="pi pi-plus" label="Add Promo" class="p-button-primary" @click="openAddDialog" />
      </div>
    </div>

    <!-- Grid of promo cards -->
    <div class="overflow-y-auto flex-1 pr-2">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
      <div
        v-for="p in filteredPromos"
        :key="p.id"
        class="card h-full flex flex-col shadow-md p-4 border border-white rounded-xl relative"
      >
        <span class="absolute top-2 right-2 bg-primary-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
          -{{ p.percent }}%
        </span>

        <h3 class="text-xl font-bold mb-1">{{ p.name }}</h3>

        <p class="text-gray-500 text-sm mb-4">Promo discount</p>

        <p class="text-sm mb-2">
          Status:
          <b v-if="(p.status || 'inactive') === 'inactive'" class="text-red-600">Inactive</b>
          <b v-else class="text-primary-600">Active</b>
        </p>

        <div class="bg-gray-100 dark:bg-black rounded-lg p-4 mb-4">
          <p class="text-sm">All applicable items/rooms will be discounted by</p>
          <p class="text-2xl font-extrabold">{{ p.percent }}%</p>
        </div>

        <div class="flex gap-2 mt-auto">
          <Button label="Edit" icon="pi pi-pencil" class="p-button-primary flex-1" @click="openEditDialog(p)" />
          <Button label="Delete" icon="pi pi-trash" class="p-button-danger flex-1" @click="removePromo(p)" />
        </div>
      </div>
      </div>
    </div>

    <!-- Add Dialog -->
    <Dialog v-model:visible="showAddDialog" header="Add Promo" :modal="true" style="width: 28rem" :dismissable-mask="true" :closable="true">
      <div class="mb-4">
        <label class="block mb-1">Promo Name</label>
        <InputText v-model="form.name" class="w-full" placeholder="e.g., ChristmasDay" />
        <small v-if="errors.name" class="text-red-400">{{ errors.name }}</small>
      </div>

      <div class="mb-4">
        <label class="block mb-1">Discount Percentage</label>
        <InputText v-model.number="form.percent" type="number" class="w-full" placeholder="e.g., 20" />
        <small v-if="errors.percent" class="text-red-400">{{ errors.percent }}</small>
      </div>

      <div class="mb-4">
        <label class="block mb-1">Status</label>
        <Select
          v-model="form.status"
          :options="[
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' }
          ]"
          optionLabel="label"
          optionValue="value"
          class="w-full"
          placeholder="Select status"
        />
      </div>

      <div class="flex justify-end gap-2">
        <Button label="Cancel" class="p-button-secondary" @click="closeAddDialog" />
        <Button label="Save" class="p-button-primary" @click="saveNewPromo" />
      </div>
    </Dialog>

    <!-- Edit Dialog -->
    <Dialog v-model:visible="showEditDialog" header="Edit Promo" :modal="true" style="width: 28rem" :dismissable-mask="true" :closable="true">
      <div class="mb-4">
        <label class="block mb-1">Promo Name</label>
        <InputText v-model="form.name" class="w-full" />
        <small v-if="errors.name" class="text-red-400">{{ errors.name }}</small>
      </div>

      <div class="mb-4">
        <label class="block mb-1">Discount Percentage</label>
        <InputText v-model.number="form.percent" type="number" class="w-full" />
        <small v-if="errors.percent" class="text-red-400">{{ errors.percent }}</small>
      </div>

      <div class="mb-4">
        <label class="block mb-1">Status</label>
        <Select
          v-model="form.status"
          :options="[
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' }
          ]"
          optionLabel="label"
          optionValue="value"
          class="w-full"
          placeholder="Select status"
        />
      </div>

      <div class="flex justify-end gap-2">
        <Button label="Cancel" class="p-button-secondary" @click="closeEditDialog" />
        <Button label="Save" class="p-button-primary" @click="saveEditPromo" />
      </div>
    </Dialog>

    <ConfirmDialog /></div>
</template>

<style scoped>

</style>
