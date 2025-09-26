<script setup>
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { addProduct, getProducts } from "@/api/auth";

const toast = useToast();

// Popover and Dialog Refs
const op2 = ref(null);


// Form fields


const productName = ref("");
const brand = ref("");
const category = ref("");
const minimumStock = ref("");
const stockLimit = ref("");
const type = ref("");
const unit = ref("");

// Product list for popover
const products = ref([]);
const selectedProduct = ref(null);

// Fetch products for the popover
const fetchProducts = async () => {
  try {
    const response = await getProducts();
    products.value = response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
  }
};

const onProductSelect = (selected) => {
  if (selected) {
    productName.value = selected.product_name || "";
    brand.value = selected.brand || "";
    category.value = selected.category || "";
    type.value = selected.type || "";
    unit.value = selected.unit || "";
    minimumStock.value = selected.minimum_stock || ""; 
    stockLimit.value = selected.stock_limit || "";    
    if (op2.value) op2.value.hide();
  }
};

const toggleDataTable = (event) => {
  fetchProducts();
  if (op2.value) op2.value.toggle(event);
};

const clearForm = () => {
  productName.value = "";
  brand.value = "";
  category.value = "";
  type.value = "";
  unit.value = "";
  minimumStock.value = "";
  stockLimit.value = "";
};


const handleSubmit = async () => {
 if (
  !productName.value.trim() ||
  !category.value ||
  !type.value ||
  !unit.value ||
  !minimumStock.value ||
  !stockLimit.value
) {
  toast.add({
    severity: "error",
    summary: "Error",
    detail: "Please fill in all required fields.",
    life: 3000,
  });
  return;
}

try {
  const response = await addProduct({
    product_name: productName.value,
    brand: brand.value,
    category: category.value,
    type: type.value,
    unit: unit.value,
    minimum_stock: minimumStock.value,
    stock_limit: stockLimit.value,
  });

    if (response.status === 200) {
      toast.add({
        severity: "success",
        summary: "Success",
        detail: "Product added successfully!",
        life: 3000,
      });
      clearForm();
      fetchProducts();
    } else {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Failed to add product.",
        life: 3000,
      });
    }
  } catch (error) {
    console.error(error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Error adding product.",
      life: 3000,
    });
  }
};

onMounted(() => {
  fetchProducts();
});
</script>

<template>
  <Fluid>
    <div class="">
      <div class="card flex flex-col gap-4">
        <div class="font-semibold text-xl">Add Product</div>
        <div class="flex flex-wrap gap-4">
          <!-- Product Name -->
          <div class="flex flex-col grow basis-0 gap-2">
            <label for="productName">Product Name</label>
            <InputText
              id="productName"
              type="text"
              placeholder="Product Name"
              v-model="productName"
            />
            <div class="flex flex-wrap gap-2">
              <!-- Existing Products Button -->
              <Button
                type="button"
                icon="pi pi-list"
                label="Existing Products"
                @click="toggleDataTable"
              />
              <!-- Popover for Existing Products -->
              <Popover
                ref="op2"
                id="overlay_panel"
                style="width: 70rem"
              >
                <DataTable
                  v-model:selection="selectedProduct"
                  :value="products"
                  selectionMode="single"
                  paginator
                  :rows="5"
                  @row-select="onProductSelect"
                >
                  <Column field="product_name" header="Product Name" sortable />
                  <Column field="brand" header="Brand" sortable />
                  <Column field="category" header="Category" sortable />
                  <Column field="type" header="Type" sortable />
                  <Column field="unit" header="Unit" sortable />
                  <Column field="created_at" header="Created At" sortable />
                  <Column header="Actions">
                    <template #body="slotProps">
                      <Button
                        label="Select"
                        icon="pi pi-check"
                        class="w-full"
                        @click="onProductSelect(slotProps.data)"
                      />
                    </template>
                  </Column>
                </DataTable>
              </Popover>
            </div>
          </div>
          <!-- Brand -->
          <div class="flex flex-col grow basis-0 gap-2">
            <label for="brand">Brand</label>
            <InputText
              id="brand"
              type="text"
              placeholder="Brand"
              v-model="brand"
            />
          </div>
          <!-- Category -->
          <div class="flex flex-col grow basis-0 gap-2">
            <label for="category">Category</label>
            <Dropdown
              id="category"
              v-model="category"
              :options="[
                { label: 'Consumable', value: 'Consumable' },
                { label: 'Non-Consumable', value: 'Non-Consumable' }
              ]"
              optionLabel="label"
              optionValue="value"
              placeholder="Select Category"
              class="w-full"
            />
          </div>
         <!-- Type -->
<div class="flex flex-col grow basis-0 gap-2">
  <label for="type">Type</label>
  <Dropdown
    id="type"
    v-model="type"
    :options="[
      { label: 'Food/Beverage', value: 'Food/Beverage' },
      { label: 'Basic needs/Essentials', value: 'Basic needs/Essentials' },
      { label: 'Furniture', value: 'Furniture' },
      { label: 'Appliances', value: 'Appliances' },
      { label: 'Bath & Bed Linens', value: 'Bath & Bed Linens' },
      { label: 'Foam', value: 'Foam' }   
    ]"
    optionLabel="label"
    optionValue="value"
    placeholder="Select Type"
    class="w-full"
  />
</div>

          </div>
          <!-- Unit -->
           <div class="flex flex-wrap gap-4">
          <div class="flex flex-col grow basis-0 gap-2">
            <label for="unit">Unit</label>
            <InputText
              id="unit"
              type="text"
              placeholder="Pcs, box, etc."
              v-model="unit"
            />
          </div>
          <!-- Minimum Stock -->
<div class="flex flex-col grow basis-0 gap-2">
  <label for="minimumStock">Minimum Stock</label>
  <InputText
    id="minimumStock"
    type="number"
    placeholder="Minimum Stock"
    v-model="minimumStock"
  />
</div>
<!-- Stock Limit -->
<div class="flex flex-col grow basis-0 gap-2">
  <label for="stockLimit">Stock Limit</label>
  <InputText
    id="stockLimit"
    type="number"
    placeholder="Stock Limit"
    v-model="stockLimit"
  />
</div>
</div>
        </div>
        <div class="flex gap-4">
          <Button label="Submit" :fluid="false" class="w-1/2" @click="handleSubmit" />
          <Button label="Clear" :fluid="false" class="w-1/2" @click="clearForm" />
        </div>
      
    </div>
    <Toast />
  </Fluid>
</template>
