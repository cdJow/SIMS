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
const searchQuery = ref("");

// Filtered products based on search query
const filteredProducts = computed(() => {
  if (!searchQuery.value) {
    return products.value;
  }
  
  const query = searchQuery.value.toLowerCase();
  return products.value.filter(product => {
    const productName = (product.product_name || "").toLowerCase();
    const brand = (product.brand || "").toLowerCase();
    return productName.includes(query) || brand.includes(query);
  });
});

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

const onProductSelect = (event) => {
  selectedProduct.value = event.data;
  if (op2.value) op2.value.hide();
};

const toggleDataTable = (event) => {
  fetchProducts();
  if (op2.value) op2.value.toggle(event);
};

const formatDateTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true // This enables AM/PM format
  };
  
  return date.toLocaleString('en-US', options);
};

const formatDateForBackend = (date) => {
  if (!date) return null;
  
  // Convert Date object to YYYY-MM-DD format in local timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
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
      severity: "warn",
      summary: "Warn",
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
    arrival_date: formatDateForBackend(arrivalDate.value),
    unit_retail_price: isConsumable.value ? unitRetailPrice.value : null,
    expiry_date: isConsumable.value ? formatDateForBackend(expiryDate.value) : null,
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

const handleSubmitWithToast = () => {
  // Check if no product is selected
  if (!selectedProduct.value) {
    toast.add({
      severity: "warn",
      summary: "No Product Selected",
      detail: "Please select a product first.",
      life: 5000,
    });
    return;
  }
  
  // Check if stock limit is reached
  if (maxQuantity.value === 0) {
    toast.add({
      severity: "error",
      summary: "Stock Limit Reached",
      detail: "Cannot add more items. Stock limit has been reached.",
      life: 5000,
    });
    return;
  }
  
  // If all checks pass, proceed with normal submit
  handleSubmit();
};

onMounted(() => {
  fetchProducts();
  // Set arrival date to today's date automatically (but user can edit it)
  arrivalDate.value = new Date();
});
</script>

<template>
  <div class="card flex flex-col gap-4">
    <div class="font-semibold text-xl">Add Item</div>
    <div class="flex flex-wrap gap-4">
      <div class="flex flex-col grow basis-0 gap-2">
        <label>Select Product</label>
        <Button icon="pi pi-list" label="Choose Product" @click="toggleDataTable($event)" />
        <Popover ref="op2" id="overlay_panel" style="width: 70rem">
          <div class="mb-3" style="max-width: 400px;">
            <IconField iconPosition="left">
              <InputIcon class="pi pi-search" />
              <InputText 
                v-model="searchQuery" 
                placeholder="Search by Product Name or Brand..." 
                style="width: 100%;"
              />
            </IconField>
          </div>
          <DataTable 
            v-model:selection="selectedProduct" 
            :value="filteredProducts" 
            selectionMode="single" 
            paginator 
            :rows="5" 
            @row-select="onProductSelect"
            stripedRows
            :pt="{
              bodyRow: { style: 'height: 3.5rem;' }
            }"
          >
            <Column field="product_name" header="Product Name" sortable />
            <Column field="brand" header="Brand" sortable />
            <Column field="category" header="Category" sortable />
            <Column field="type" header="Type" sortable />
            <Column field="unit" header="Unit" sortable />
            <Column field="created_at" header="Created At" sortable>
              <template #body="slotProps">
                {{ formatDateTime(slotProps.data.created_at) }}
              </template>
            </Column>
          </DataTable>
        </Popover>
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
        <InputNumber 
          v-model="purchasePrice" 
          mode="currency" 
          currency="PHP" 
          :minFractionDigits="2" 
          :maxFractionDigits="2"
          placeholder="50.00" 
          input-class="text-right"
          class="w-full"
        />
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
        <InputNumber 
          v-model="unitRetailPrice" 
          mode="currency" 
          currency="PHP" 
          :minFractionDigits="2" 
          :maxFractionDigits="2"
          placeholder="100.00" 
          input-class="text-right"
          class="w-full"
        />
      </div>
      <div class="flex flex-col grow basis-0 gap-2" v-if="isConsumable">
        <label>Expiry Date</label>
        <DatePicker v-model="expiryDate" showButtonBar placeholder="Expiry Date" />
      </div>
      <div class="flex flex-col grow basis-0 gap-2" v-if="isNonConsumable">
        <label>Unit Rental Price <span style="color: #aaa;">(optional)</span></label>
        <InputNumber 
          v-model="unitRentalPrice" 
          mode="currency" 
          currency="PHP" 
          :minFractionDigits="2" 
          :maxFractionDigits="2"
          placeholder="20.00" 
          input-class="text-right"
          class="w-full"
        />
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
    <div class="flex gap-4 justify-end">
      <Button label="Submit" :disabled="maxQuantity === 0 || !selectedProduct" class="px-32 py-4" @click="handleSubmitWithToast" />
      <Button label="Clear" :fluid="false" class="px-32 py-4" @click="clearForm" />
    </div>
     <span v-if="maxQuantity === 0 && selectedProduct" class="text-red-500">Stock limit reached. Cannot add more.</span></div>
</template>
