<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { getProducts, addItem, generateBatchNumber, generateSerialNumbers, getCurrentQuantity } from "@/api/auth";




const toast = useToast();
const op2 = ref(null);
const stockLimit = computed(() => selectedProduct.value?.stock_limit || 1);
const currentStock = ref(0);

// Shared fields
const batchNumber = ref("");
const quantity = ref(1);
const purchasePrice = ref("");
const supplier = ref("");
const arrivalDate = ref("");

// Consumable-specific
const unitRetailPrice = ref("");
const expiryDate = ref("");

// Non-consumable-specific
const unitRentalPrice = ref("");
const warranty = ref("");
const serialNumbers = ref(""); // comma-separated string

const products = ref([]);
const selectedProduct = ref(null);

const isConsumable = computed(
  () => selectedProduct.value?.category === "Consumable"
);
const isNonConsumable = computed(
  () => selectedProduct.value?.category === "Non-Consumable"
);

const maxQuantity = computed(() => {
  // Only restrict consumables by stock limit
    if (!selectedProduct.value) return 0;
  // Always restrict by what's left to reach the limit
  const left = stockLimit.value - currentStock.value;
  return left > 0 ? left : 0;
});



watch(selectedProduct, async (prod) => {
  quantity.value = 0;
  if (prod && prod.id) {
    try {
      const res = await getCurrentQuantity(prod.id);
      currentStock.value = res.data.current_quantity;
    } catch {
      currentStock.value = 0;
    }
  } else {
    currentStock.value = 0;
  }
});

// Watch for changes to product or quantity for batch/serial generation
watch(
   [selectedProduct, quantity],
  async ([prod, qty]) => {
    if (qty > maxQuantity.value) {
      quantity.value = maxQuantity.value;
    }
    // ... rest of your logic ...
  

    if (prod && prod.id) {
      // Generate batch number for any product
      try {
        const res = await generateBatchNumber(prod.id);
        batchNumber.value = res.data.batch_number;
      } catch (e) {
        batchNumber.value = "";
        toast.add({
          severity: "error",
          summary: "Error",
          detail: "Failed to generate batch number.",
          life: 3000,
        });
      }

      // If non-consumable and qty > 0, generate serials
      if (prod.category === "Non-Consumable" && qty > 0) {
        try {
          const res = await generateSerialNumbers(prod.id, qty);
          serialNumbers.value = res.data.serial_numbers.join(", ");
        } catch (e) {
          serialNumbers.value = "";
          toast.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to generate serial numbers.",
            life: 3000,
          });
        }
      }
    } else {
      // If no product, clear fields
      batchNumber.value = "";
      serialNumbers.value = "";
      quantity.value = 1;
      purchasePrice.value = "";
      supplier.value = "";
      arrivalDate.value = "";
      unitRetailPrice.value = "";
      expiryDate.value = "";
      unitRentalPrice.value = "";
      warranty.value = "";
    }
  },
  { immediate: true }
);

watch(quantity, (val) => {
   if (!selectedProduct.value) return;
  if (val > maxQuantity.value) {
    quantity.value = maxQuantity.value;
    toast.add({
      severity: "warn",
      summary: "Warning",
      detail: `Quantity cannot exceed available stock limit (${maxQuantity.value}).`,
      life: 2000,
    });
  }
});

const clearForm = () => {
  batchNumber.value = "";
  quantity.value = null;
  purchasePrice.value = "";
  supplier.value = "";
  arrivalDate.value = "";
  unitRetailPrice.value = "";
  expiryDate.value = "";
  unitRentalPrice.value = "";
  warranty.value = "";
  serialNumbers.value = "";
  selectedProduct.value = null;
};



const fetchProducts = async () => {
  try {
    const response = await getProducts();
    products.value = response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
  }
};

const onProductSelect = (selected) => {
  selectedProduct.value = selected;
  if (op2.value) op2.value.hide();
};

const toggleDataTable = (event) => {
  fetchProducts();
  if (op2.value) op2.value.toggle(event);
};



const handleSubmit = async () => {
  if (!selectedProduct.value) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Select a product.",
      life: 3000,
    });
    return;
  }
  if (isConsumable.value && quantity.value > maxQuantity.value) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: `You cannot add more than the stock limit. Only ${maxQuantity.value} left.`,
      life: 3000,
    });
    return;
  }
  if (isNonConsumable.value && quantity.value > stockLimit.value) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: `Cannot add more than stock limit (${stockLimit.value}) for this non-consumable product.`,
      life: 3000,
    });
    return;
  }
  if (
    !batchNumber.value.trim() ||
    !quantity.value ||
    !purchasePrice.value ||
    !arrivalDate.value ||
    (isConsumable.value && (!unitRetailPrice.value || !expiryDate.value)) ||
    (isNonConsumable.value && (!serialNumbers.value.trim()))
  ) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Fill in all required fields.",
      life: 3000,
    });
    return;
  }
  if (quantity.value > stockLimit.value) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: `Quantity cannot exceed stock limit (${stockLimit.value}).`,
      life: 3000,
    });
    return;
  }
  if (isConsumable.value) {
    if (quantity.value < 1) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Quantity must be at least 1.",
        life: 3000,
      });
      return;
    }
    if (serialNumbers.value.trim() || unitRentalPrice.value) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Serial numbers and Unit Rental Price not allowed for consumables.",
        life: 3000,
      });
      return;
    }
  }
  if (quantity.value > stockLimit.value) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: `Quantity cannot exceed stock limit (${stockLimit.value}).`,
      life: 3000,
    });
    return;
  }
  if (isNonConsumable.value) {
    if (quantity.value < 1) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Quantity must be at least 1.",
        life: 3000,
      });
      return;
    }
    const serialsArray = serialNumbers.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (serialsArray.length !== Number(quantity.value)) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: `Provide exactly ${quantity.value} serial number(s), separated by commas.`,
        life: 5000,
      });
      return;
    }
  }

  const payload = {
    product_id: selectedProduct.value.id,
    batch_number: batchNumber.value,
    quantity: quantity.value,
    purchase_price: purchasePrice.value,
    supplier: supplier.value,
    arrival_date: arrivalDate.value,
    unit_retail_price: isConsumable.value ? unitRetailPrice.value : null,
    expiry_date: isConsumable.value ? expiryDate.value : null,
    unit_rental_price: isNonConsumable.value ? unitRentalPrice.value || null : null,
    warranty: isNonConsumable.value ? warranty.value || null : null,
    serial_numbers: isNonConsumable.value ? serialNumbers.value : null,
  };

  try {
    const response = await addItem(payload);
    if (response.status === 200) {
      toast.add({
        severity: "success",
        summary: "Success",
        detail: "Item added successfully!",
        life: 3000,
      });
      clearForm();
      await fetchProducts(); // <--- Refresh

      // Refresh current stock info (optional)
      if (selectedProduct.value && selectedProduct.value.id) {
        try {
          const res = await getCurrentQuantity(selectedProduct.value.id);
          currentStock.value = res.data.current_quantity;
        } catch {
          currentStock.value = 0;
        }
      } else {
        currentStock.value = 0;
      }
    } else {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Failed to add item.",
        life: 3000,
      });
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Error adding item.",
      life: 3000,
    });
  }
};


onMounted(fetchProducts);
</script>

<template>
  <div class="card flex flex-col gap-4">
    <div class="font-semibold text-xl">Add Item</div>
    <div class="flex flex-wrap gap-4">
      <div class="flex flex-col grow basis-0 gap-2">
        <label>Select Product</label>
        <Button icon="pi pi-list" label="Choose Product" @click="toggleDataTable($event)" />
        <popover ref="op2" id="overlay_panel" style="width: 70rem">
          <DataTable v-model:selection="selectedProduct" :value="products" selectionMode="single" paginator :rows="5" @row-select="onProductSelect">
            <Column field="product_name" header="Product Name" sortable />
            <Column field="brand" header="Brand" sortable />
            <Column field="category" header="Category" sortable />
            <Column field="type" header="Type" sortable />
            <Column field="unit" header="Unit" sortable />
            <Column field="created_at" header="Created At" sortable />
            <Column header="Actions">
              <template #body="slotProps">
                <Button label="Select" icon="pi pi-check" class="w-full" @click="onProductSelect(slotProps.data)" />
              </template>
            </Column>
          </DataTable>
        </popover>
      </div>
      <div class="flex flex-col grow basis-0 gap-2">
        <label>Batch Number</label>
        <InputText v-model="batchNumber" placeholder="Batch Number" readonly />
      </div>
      <div class="flex flex-col grow basis-0 gap-2">
         <label>Quantity</label>
  <InputText
  v-model="quantity"
  type="number"
    :placeholder="`Up to max: ${maxQuantity}`"
  min="1"
  :max="maxQuantity"
/>
<small v-if="selectedProduct">
  Stock Limit: {{ stockLimit }}<br>
  Already in stock: {{ currentStock }}<br>
  You can add up to <b>{{ maxQuantity }}</b> more.
</small>
      </div>
      <div class="flex flex-col grow basis-0 gap-2">
        <label>Purchase Price</label>
        <InputText v-model="purchasePrice" type="number" placeholder="e.g., 50.00" />
      </div>
    </div>
    <div class="flex flex-wrap gap-4">
      <div class="flex flex-col grow basis-0 gap-2">
        <label>Supplier  <span style="color: #aaa;">(optional)</span></label>
        <InputText v-model="supplier" placeholder="Supplier" />
      </div>

      <div class="flex flex-col grow basis-0 gap-2">
        <label>Arrival Date</label>
        <DatePicker v-model="arrivalDate" showButtonBar placeholder="Arrival Date" />
      </div>

      <div class="flex flex-col grow basis-0 gap-2" v-if="isConsumable">
        <label>Unit Retail Price</label>
        <InputText v-model="unitRetailPrice" type="number" placeholder="e.g., 10.00" />
      </div>
      <div class="flex flex-col grow basis-0 gap-2" v-if="isConsumable">
        <label>Expiry Date</label>
        <DatePicker v-model="expiryDate" showButtonBar placeholder="Expiry Date" />
      </div>
      <div class="flex flex-col grow basis-0 gap-2" v-if="isNonConsumable">
        <label>Unit Rental Price <span style="color: #aaa;">(optional)</span></label>
        <InputText v-model="unitRentalPrice" type="number" placeholder="e.g., 100.00" />
      </div>
      <div class="flex flex-col grow basis-0 gap-2" v-if="isNonConsumable">
        <label>Warranty <span style="color: #aaa;">(optional)</span></label>
        <InputText v-model="warranty" placeholder="e.g., 12 months" />
      </div>
      <div class="flex flex-col grow basis-0 gap-2" v-if="isNonConsumable">
        <label>Serial Numbers</label>
        <InputText v-model="serialNumbers" placeholder="Serial Numbers" readonly />
        <small>Automatically generated, one per quantity</small>
      </div>
    </div>
    <div class="flex gap-4">
      <Button label="Submit" :disabled="maxQuantity === 0" class="w-1/2" @click="handleSubmit" />
      <Button label="Clear" :fluid="false" class="w-1/2" @click="clearForm" />
    </div>
    <span v-if="maxQuantity === 0" class="text-red-500">Stock limit reached. Cannot add more.</span>
    <Toast />
  </div>
</template>
