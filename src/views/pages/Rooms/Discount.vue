<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useToast } from "primevue/usetoast";
import { getDiscounts, addDiscount, updateDiscount, deleteDiscount } from "@/api/auth";

/* ---------------- State ---------------- */
const toast = useToast();
const promos = ref([]);
const loading = ref(false);
const search = ref("");

// allow past dates? set to new Date() if you want to block past selections
const minDate = ref(null);

/* ------------- Dialog / Form State ------------- */
const showAddDialog = ref(false);
const showEditDialog = ref(false);

const form = ref({ name: "", percent: 0, status: "active", starts_at: null, ends_at: null });
const editPromo = ref(null);

/* ----------------- Validation ------------------ */
const errors = ref({ name: "", percent: "", dates: "" });

function formatAMPM(d) {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleString("en-PH", {
    year: "numeric", month: "short", day: "2-digit",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

// Parse "YYYY-MM-DD HH:mm:ss" (local) or ISO into a Date safely (Safari-friendly)
function parseSQLDate(input) {
  if (!input) return null;
  if (input instanceof Date) return input;
  const s = String(input).trim();
  if (s.includes("T")) return new Date(s); // ISO-like
  // SQL-like "YYYY-MM-DD HH:mm:ss"
  const [datePart, timePart = "00:00:00"] = s.split(" ");
  const [Y, M, D] = datePart.split("-").map(Number);
  const [h, m, sec] = timePart.split(":").map(Number);
  return new Date(Y, (M || 1) - 1, D || 1, h || 0, m || 0, sec || 0);
}

// format to local MySQL DATETIME string
function toLocalSQL(d) {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  const pad = (n) => String(n).padStart(2, "0");
  const Y = dt.getFullYear(), M = pad(dt.getMonth() + 1), D = pad(dt.getDate());
  const h = pad(dt.getHours()), m = pad(dt.getMinutes()), s = pad(dt.getSeconds());
  return `${Y}-${M}-${D} ${h}:${m}:${s}`;
}

function validateForm(target = form.value) {
  errors.value = { name: "", percent: "", dates: "" };
  const n = (target.name || "").trim();
  const p = Number(target.percent);

  if (!n) errors.value.name = "Promo name is required.";
  if (!Number.isFinite(p) || p <= 0 || p > 100) errors.value.percent = "Percent must be between 1 and 100.";

  const S = target.starts_at ? new Date(target.starts_at) : null;
  const E = target.ends_at ? new Date(target.ends_at) : null;
  if (S && E && E < S) errors.value.dates = "End date/time must be after Start date/time.";

  return !errors.value.name && !errors.value.percent && !errors.value.dates;
}

function toPayload(target) {
  return {
    name: (target.name || "").trim(),
    percent: Number(target.percent),
    status: (target.status || "active").toLowerCase(), // 'active' | 'inactive'
    starts_at: target.starts_at ? toLocalSQL(target.starts_at) : null,
    ends_at: target.ends_at ? toLocalSQL(target.ends_at) : null,
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
          starts_at: p.starts_at ? parseSQLDate(p.starts_at) : null,
          ends_at: p.ends_at ? parseSQLDate(p.ends_at) : null,
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
  form.value = { name: "", percent: 0, status: "active", starts_at: null, ends_at: null };
  errors.value = { name: "", percent: "", dates: "" };
}
function openAddDialog() { resetForm(); showAddDialog.value = true; }
function closeAddDialog() { showAddDialog.value = false; }
function openEditDialog(promo) {
  editPromo.value = { ...promo };
  form.value = {
    name: promo.name,
    percent: promo.percent,
    status: promo.status || "active",
    starts_at: promo.starts_at || null,
    ends_at: promo.ends_at || null,
  };
  errors.value = { name: "", percent: "", dates: "" };
  showEditDialog.value = true;
}
function closeEditDialog() { editPromo.value = null; showEditDialog.value = false; }

/* --- keep end >= start automatically --- */
watch(() => form.value.starts_at, (s) => {
  if (!s) return;
  const S = new Date(s);
  const E = form.value.ends_at ? new Date(form.value.ends_at) : null;
  if (E && E < S) form.value.ends_at = S; // snap end to start if needed
});

/* ----------------- Create/Update/Delete ------------------ */
async function saveNewPromo() {
  if (!validateForm()) return;
  try {
    await addDiscount(toPayload(form.value));
    toast.add({ severity: "success", summary: "Promo added", detail: form.value.name, life: 3000 });
    closeAddDialog(); await loadPromos();
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: err?.response?.data?.error || "Could not add promo.", life: 4000 });
  }
}
async function saveEditPromo() {
  if (!editPromo.value) return;
  const payload = toPayload(form.value);
  if (!validateForm(payload)) return;
  try {
    await updateDiscount(editPromo.value.id, payload);
    toast.add({ severity: "success", summary: "Promo updated", detail: payload.name, life: 3000 });
    closeEditDialog(); await loadPromos();
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: err?.response?.data?.error || "Could not update promo.", life: 4000 });
  }
}
async function removePromo(promo) {
  if (!confirm(`Delete promo "${promo.name}"?`)) return;
  try {
    await deleteDiscount(promo.id);
    toast.add({ severity: "warn", summary: "Promo deleted", detail: promo.name, life: 3000 });
    await loadPromos();
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: err?.response?.data?.error || "Could not delete promo.", life: 4000 });
  }
}
/* ----------------- Filtering ------------------ */
const filteredPromos = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return promos.value;
  return promos.value.filter((p) => p.name.toLowerCase().includes(q));
});

</script>


<template>
  <div class="card">
    <h1 class="text-2xl font-bold mb-4">Discounts & Promos</h1>

    <!-- Toolbar -->
    <div class="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-6">
      <div class="flex gap-2 items-center">
        <InputText v-model="search" placeholder="Search promo name…" class="w-72" />
        <Button icon="pi pi-times" outlined @click="search = ''" label="Clear" />
      </div>
      <div>
        <Button icon="pi pi-plus" label="Add Promo" class="p-button-primary" @click="openAddDialog" />
      </div>
    </div>

    <!-- Grid of promo cards] -->
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
    <p class="text-gray-500 text-xs mb-2">
  <span v-if="p.starts_at">From: {{ formatAMPM(p.starts_at) }}</span>
  <span v-if="p.ends_at"> • Until: {{ formatAMPM(p.ends_at) }}</span>
  </p>
  
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

<div class="mb-2 grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <label class="block mb-1">Start (optional)</label>
    <DatePicker v-model="form.starts_at" :minDate="minDate" :showButtonBar="true" showTime hourFormat="12" class="w-full" />
  </div>
  <div>
    <label class="block mb-1">End (optional)</label>
    <!-- ensure ends_at binding -->
    <DatePicker v-model="form.ends_at" :minDate="form.starts_at || minDate" :showButtonBar="true" showTime hourFormat="12" class="w-full" />
  </div>
</div>
<small v-if="errors.dates" class="text-red-400">{{ errors.dates }}</small>


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

<div class="mb-2 grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <label class="block mb-1">Start (optional)</label>
    <DatePicker v-model="form.starts_at" :minDate="minDate" :showButtonBar="true" showTime hourFormat="12" class="w-full" />
  </div>
  <div>
    <label class="block mb-1">End (optional)</label>
    <!-- ensure ends_at binding -->
    <DatePicker v-model="form.ends_at" :minDate="form.starts_at || minDate" :showButtonBar="true" showTime hourFormat="12" class="w-full" />
  </div>
</div>
<small v-if="errors.dates" class="text-red-400">{{ errors.dates }}</small>

      <div class="flex justify-end gap-2">
        <Button label="Cancel" class="p-button-secondary" @click="closeEditDialog" />
        <Button label="Save" class="p-button-primary" @click="saveEditPromo" />
      </div>
    </Dialog>

    <Toast />
  </div>
</template>

<style scoped>
/* Optional: keep cards consistent with your existing look */

</style>
