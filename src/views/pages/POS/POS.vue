<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount  } from "vue";
import { fetchPOSProducts, posCheckout, fetchBills, fetchPOSPreview } from "@/api/auth";
import { useToast } from "primevue/usetoast";

const toast = useToast();

/* ---------------- State ---------------- */
const productSearchQuery = ref("");
const historySearchDate = ref(null);
const products = ref([]);
const history = ref([]);
const historyDialogVisible = ref(false);
const selectedHistory = ref(null);
const historyQuery = ref("");
const billDialogVisible = ref(false);
const confirmingCheckout = ref(false);
const lastBillId = ref(null);
const lastInvoiceNo = ref(null);

// ONE ROW PER PRODUCT in cart
// item = { id, name, brand, quantity }
const cart = ref([]);

/* ------------- Server preview (authoritative pricing) ------------- */
const preview = ref({ lines: [], total: 0 });
// lines: [{ product_id, quantity, subtotal }]

/* ---------- Fast helpers ---------- */
const nameById = computed(
  () => new Map(products.value.map(p => [Number(p.id), p.name || p.product_name || `#${p.id}`]))
);
const brandById = computed(
  () => new Map(products.value.map(p => [Number(p.id), p.brand || p.product_brand || p.Brand || "—"]))
);
const priceById = computed(
  () => new Map(products.value.map(p => [Number(p.id), Number(p.price) || 0]))
);
const stockById = computed(() => {
  const m = new Map();
  for (const p of products.value) m.set(Number(p.id), Number(p.stock ?? 0));
  return m;
});
function getStock(id) { return stockById.value.get(Number(id)) ?? 0; }

onBeforeUnmount(() => {
  clearTimeout(debounceTimer);
});



function warnLimit(id) {
  const stock = getStock(id);
  toast.add({
    severity: "warn",
    summary: "Stock limit reached",
    detail: `Only ${stock} in stock for this product.`,
    life: 3000
  });
}



/* ---------- UI prices (preview avg or fallback list price) ---------- */
function previewLineFor(productId) {
  const pid = Number(productId);
  return (preview.value.lines || []).find(l => Number(l.product_id) === pid) || null;
}
function uiUnitPrice(row) {
  const line = previewLineFor(row.id);
  if (line && Number(line.quantity) > 0) {
    return Number(line.subtotal) / Number(line.quantity); // avg price
  }
  return priceById.value.get(Number(row.id)) || 0; // fallback
}
function uiSubtotal(row) {
  const line = previewLineFor(row.id);
  if (line) return Number(line.subtotal);
  return uiUnitPrice(row) * Number(row.quantity || 0);
}
const uiTotal = computed(() => {
  const t = Number(preview.value?.total || 0);
  if (t > 0) return t;
  return cart.value.reduce((sum, it) => sum + uiSubtotal(it), 0);
});

/* ---------- Breakdowns and display rows (split by price) ---------- */
function previewBreakdownFor(productId) {
  const line = previewLineFor(productId);
  if (!line || !Array.isArray(line.breakdown)) return null;
  const grouped = new Map();
  for (const b of line.breakdown) {
    const price = Number(b.unit_price);
    const qty = Number(b.qty);
    grouped.set(price, (grouped.get(price) || 0) + qty);
  }
  return Array.from(grouped.entries()).map(([unit_price, quantity]) => ({
    unit_price: Number(unit_price),
    quantity: Number(quantity),
    subtotal: Number(unit_price) * Number(quantity)
  }));
}



const cartBreakdownRows = computed(() => {
  const rows = [];
  for (const it of cart.value) {
    const id = Number(it.id);
    const breakdown = previewBreakdownFor(id);
    if (breakdown && breakdown.length) {
      for (const part of breakdown) {
        rows.push({
          key: `${id}@${part.unit_price}`,
          id,
          name: it.name,
          brand: it.brand || brandById.value.get(id) || "—",
          quantity: Number(part.quantity),
          unit_price: Number(part.unit_price),
          subtotal: Number(part.subtotal)
        });
      }
    } else {
      const unit = uiUnitPrice(it);
      rows.push({
        key: `${id}`,
        id,
        name: it.name,
        brand: it.brand || brandById.value.get(id) || "—",
        quantity: Number(it.quantity || 0),
        unit_price: unit,
        subtotal: unit * Number(it.quantity || 0)
      });
    }
  }
  return rows;
});


/* ---------- Debounced + deduped preview ---------- */
let debounceTimer = null;
let reqSeq = 0;
let lastPayloadKey = "";

const payloadItems = computed(() =>
  cart.value
    .filter(it => (it.quantity || 0) > 0)
    .map(it => ({ id: Number(it.id), quantity: Number(it.quantity) }))
);

function payloadKey(items) {
  return JSON.stringify(items.slice().sort((a,b)=>a.id-b.id));
}

function schedulePreview() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runPreview, 200);
}

async function runPreview() {
  const items = payloadItems.value;
  if (!items.length) {
    preview.value = { lines: [], total: 0 };
     lastPayloadKey = "";
    return;
  }
  const key = payloadKey(items);
  if (key === lastPayloadKey) return; // skip duplicate
  lastPayloadKey = key;

  const seq = ++reqSeq;
  try {
    const { data } = await fetchPOSPreview({ items });
    if (seq !== reqSeq) return; // drop stale
    preview.value = data || { lines: [], total: 0 };
  } catch {
    // keep previous preview
  }
}

/* ---------- Filters ---------- */
const filteredProducts = computed(() => {
  const q = productSearchQuery.value.trim().toLowerCase();
  if (!q) return products.value;
  return products.value.filter(p =>
    ((p.name || "") + " " + (p.brand || p.product_brand || "")).toLowerCase().includes(q)
  );
});

/* ---------- API loads ---------- */
async function loadProducts() {
  try {
    const res = await fetchPOSProducts();
    products.value = res.data || [];
  } catch {
    toast.add({ severity: "error", summary: "Products", detail: "Failed to load products.", life: 3000 });
  }
}
async function loadHistory() {
  try {
    const res = await fetchBills();
    history.value = res.data || [];
  } catch {
    toast.add({ severity: "error", summary: "History", detail: "Failed to load transaction history.", life: 3000 });
  }
}

onMounted(() => {
  loadProducts();
  loadHistory();
  schedulePreview();
});

/* ---------- Watchers ---------- */
watch(
  () => cart.value.map(i => `${i.id}:${i.quantity}`).join("|"),
  () => schedulePreview()
);

/* ---------- Cart operations (one row per product) ---------- */
function addToCart(product) {
  const id = Number(product.id);
  const stock = getStock(id);
  const existing = cart.value.find(i => Number(i.id) === id);
  const currentQty = existing ? Number(existing.quantity) : 0;

  if (stock <= 0 || currentQty >= stock) { warnLimit(id); return; }

  if (existing) existing.quantity += 1;
  else cart.value.push({ id, name: product.name || product.product_name || `#${id}`, brand: product.brand || product.product_brand || product.Brand || "—", quantity: 1 });

  schedulePreview();
}

// Adjust quantity by product id (affects whole requested qty; server will re-split by price)
function increaseByProductId(productId) {
  const id = Number(productId);
  const stock = getStock(id);
  const row = cart.value.find(i => Number(i.id) === id);
  const qty = row ? Number(row.quantity) : 0;
  if (qty >= stock) { warnLimit(id); return; }
  if (row) row.quantity += 1;
  else cart.value.push({ id, name: nameById.value.get(id) || `#${id}`, brand: brandById.value.get(id) || "—", quantity: 1 });
  schedulePreview();
}
function decreaseByProductId(productId) {
  const id = Number(productId);
  const row = cart.value.find(i => Number(i.id) === id);
  if (!row) return;
  if (row.quantity > 1) row.quantity -= 1;
  else removeRow(row);
  schedulePreview();
}


function removeSlice(row) {
  const id = Number(row.id);
  const removeQty = Number(row.quantity || 0);
  const idx = cart.value.findIndex(i => Number(i.id) === id);
  if (idx < 0) return;
  const current = Number(cart.value[idx].quantity || 0);
  const next = Math.max(0, current - removeQty);
  if (next <= 0) cart.value.splice(idx, 1);
  else cart.value[idx].quantity = next;
  schedulePreview();
}

function increaseRow(row) {
  const id = Number(row.id);
  const stock = getStock(id);
  if (Number(row.quantity) >= stock) {
    warnLimit(id);
    return;
  }
  row.quantity += 1;
  schedulePreview();
}

function decreaseRow(row) {
  if (row.quantity > 1) {
    row.quantity -= 1;
  } else {
    removeRow(row);
  }
  schedulePreview();
}

function removeRow(row) {
  const id = Number(row.id);
  const idx = cart.value.findIndex(i => Number(i.id) === id);
  if (idx >= 0) cart.value.splice(idx, 1);
  schedulePreview();
}

/* ---------- Checkout ---------- */
function checkout() {
  confirmingCheckout.value = true;
  billDialogVisible.value = true;
  runPreview(); // refresh once for accurate prices
}

async function confirmCheckout() {
  try {
    const res = await posCheckout({ items: payloadItems.value });
    lastBillId.value = res.data?.bill_id || null;
    lastInvoiceNo.value = res.data?.invoice_no || null;

    await loadHistory();
    await loadProducts();

    cart.value = [];
    preview.value = { lines: [], total: 0 };
    confirmingCheckout.value = false;
    billDialogVisible.value = false;

    toast.add({
      severity: "success",
      summary: "Checkout Successful",
      detail: res.data?.invoice_no ? `Invoice ${res.data.invoice_no} created.` : "Transaction completed.",
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Checkout Failed",
      detail: error?.response?.data?.message || "An error occurred.",
      life: 3000
    });
  }
}
function cancelCheckout() {
  confirmingCheckout.value = false;
  billDialogVisible.value = false;
}

/* ---------- History ---------- */
const displayedHistory = computed(() => {
  const base = (() => {
    if (!historySearchDate.value) return history.value;
    const d = new Date(historySearchDate.value);
    return history.value.filter(entry => {
      const e = new Date(entry.timestamp);
      return (
        d.getFullYear() === e.getFullYear() &&
        d.getMonth() === e.getMonth() &&
        d.getDate() === e.getDate()
      );
    });
  })();

  const q = historyQuery.value.trim().toLowerCase();
  if (!q) return base;

  // accept “#INV-...” or “INV-...” in search
  const qNoHash = q.startsWith("#") ? q.slice(1) : q;

  return base.filter(bill => {
    const inv = String(bill.invoice_no || "").toLowerCase();
    const invWithHash = `#${inv}`;

    const dateStr = new Date(bill.timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }).toLowerCase();

    // match invoice number (with or without #) OR the formatted date/time
    return (
      inv.includes(qNoHash) ||
      invWithHash.includes(q) ||
      dateStr.includes(q)
    );
  });
});

const safeSelectedItems = computed(() => selectedHistory.value?.items || []);


/* ---------- Bill dialog lines (split by price when available) ---------- */
const billLines = computed(() => {
  if ((preview.value.lines || []).length) {
    const rows = [];
    for (const l of preview.value.lines) {
      const pid = Number(l.product_id);
      const name = nameById.value.get(pid) ?? `#${pid}`;
      const brand = brandById.value.get(pid) ?? "—";
      const breakdown = Array.isArray(l.breakdown) ? l.breakdown : null;
      if (breakdown && breakdown.length) {
        // One line per batch price
        for (const b of breakdown) {
          const qty = Number(b.qty || 0);
          const unit = Number(b.unit_price || 0);
          rows.push({ product_id: pid, name, brand, quantity: qty, unit_price: unit, subtotal: unit * qty });
        }
      } else {
        const qty = Number(l.quantity || 0);
        const subtotal = Number(l.subtotal || 0);
        const unit = qty ? (subtotal / qty) : (priceById.value.get(pid) || 0);
        rows.push({ product_id: pid, name, brand, quantity: qty, unit_price: unit, subtotal });
      }
    }
    return rows;
  }
  // Fallback from cart when preview is empty
  return cart.value.map(it => {
    const unit = uiUnitPrice(it);
    return {
      product_id: Number(it.id),
      name: it.name,
      brand: it.brand || brandById.value.get(Number(it.id)) || "—",
      quantity: Number(it.quantity || 0),
      unit_price: unit,
      subtotal: unit * Number(it.quantity || 0)
    };
  });
});

function onHistoryRowClick(event) {
  if (event?.data) {
    selectedHistory.value = event.data;
    historyDialogVisible.value = true;
  }
}
function viewHistoryDetails(bill) {
  selectedHistory.value = bill;
  historyDialogVisible.value = true;
}
</script>


<template>
  <div class="p-4 card">
    <Toast />

    <h1 class="text-2xl font-bold mb-4">POS</h1>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Products -->
      <div class="border rounded-lg shadow-md p-4">
        <InputText
          v-model="productSearchQuery"
          placeholder="Search for products..."
          class="w-full mb-4"
        />
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto" style="max-height: 400px">
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            class="p-4 border rounded-lg shadow-md"
          >
            <h3 class="text-lg font-medium">{{ product.name }}</h3>
            <p class="text-sm text-white-600">Brand: <span class="font-medium">{{ product.brand || product.product_brand || "—" }}</span></p>
            <p class="text-sm text-white-600">Price: ₱{{ Number(product.price).toFixed(2) }}</p>
            <p class="text-sm text-white-600">Stock: {{ product.stock }}</p>
            <Button
              label="Add to Cart"
              icon="pi pi-plus"
              class="p-button-primary mt-2 w-full"
              :disabled="product.stock <= 0"
              @click="addToCart(product)"
            />
          </div>
        </div>
      </div>

      <!-- Cart -->
      <div class="border rounded-lg shadow-md p-4">
        <h2 class="text-xl font-bold mb-4">Cart</h2>

        <div class="overflow-y-auto" style="max-height: 400px">
          <DataTable
            :value="cartBreakdownRows"
            class="p-datatable-sm shadow-md"
            responsiveLayout="scroll"
            dataKey="key"
          >
            <Column field="name" header="Product" headerClass="text-left" bodyClass="text-left" />
            <Column field="brand" header="Brand" headerClass="text-left" bodyClass="text-left">
              <template #body="{ data }">
                {{ data.brand || "—" }}
              </template>
            </Column>

            <Column header="Quantity" headerClass="text-center" bodyClass="text-center">
              <template #body="{ data }">
                <div class="flex items-center">
                  <Button icon="pi pi-minus" class="p-button-text" @click.stop="decreaseByProductId(data.id)" />
                  <span class="inline-block min-w-[2ch] text-center">{{ data.quantity }}</span>
                  <Button
                    icon="pi pi-plus"
                    class="p-button-text"
                    :disabled="(cart.find(i => Number(i.id) === Number(data.id))?.quantity || 0) >= (stockById.get(Number(data.id)) || 0)"
                    @click.stop="increaseByProductId(data.id)"
                  />
                </div>
              </template>
            </Column>

            <Column header="Unit (₱)" headerClass="text-right" bodyClass="text-right">
              <template #body="{ data }">₱{{ Number(data.unit_price).toFixed(2) }}</template>
            </Column>

            <Column header="Subtotal (₱)" headerClass="text-right" bodyClass="text-right">
              <template #body="{ data }">₱{{ Number(data.subtotal).toFixed(2) }}</template>
            </Column>

            <Column header="Actions" headerClass="text-center" bodyClass="text-center">
              <template #body="{ data }">
                <div class="flex items-center ">
                  <!-- Remove only this price slice -->
                  <Button
                    icon="pi pi-trash"
                    class="p-button-danger"
                    v-tooltip.top="'Remove this price slice'"
                    @click.stop="removeSlice(data)"
                  />
                  
                </div>
              </template>
            </Column>
          </DataTable>
        </div>

        <div class="text-right font-bold text-lg mt-4">
          Total: ₱{{ uiTotal.toFixed(2) }}
        </div>
        <Button
          label="Checkout"
          icon="pi pi-check"
          class="p-button-primary mt-4 w-full"
          :disabled="cart.length === 0"
          @click="checkout"
        />
      </div>

      <!-- Transaction History -->
      <div class="border rounded-lg shadow-md p-4">
        <h2 class="text-xl font-bold mb-3">Transaction History</h2>

        <div class="mb-3">
          <InputText
  v-model="historyQuery"
  placeholder="Search by invoice # or date/time (e.g. INV-2025, Aug, 12:30 PM)"
  class="w-full"
/>
        </div>

        <DataTable
          :value="displayedHistory"
          class="p-datatable-sm shadow-md"
          responsiveLayout="scroll"
          style="max-height: 400px; overflow-y: auto"
          :paginator="true"
          :rows="5"
          :showGridlines="true"
          @row-click="onHistoryRowClick"
          dataKey="id"
        >
          <Column field="invoice_no" header="Invoice #">
            <template #body="slotProps">
              <span class="font-medium">#{{ slotProps.data.invoice_no }}</span>
            </template>
          </Column>

          <Column field="timestamp" header="Date/Time">
            <template #body="slotProps">
              {{
                new Date(slotProps.data.timestamp).toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true
                })
              }}
            </template>
          </Column>

          <Column field="total" header="Total (₱)">
            <template #body="slotProps">₱{{ Number(slotProps.data.total).toFixed(2) }}</template>
          </Column>

          <Column header="Details">
            <template #body="slotProps">
              <Button
                icon="pi pi-info-circle"
                class="p-button-info"
                outlined
                rounded
                @click.stop="viewHistoryDetails(slotProps.data)"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Transaction Details dialog -->
    <Dialog v-model:visible="historyDialogVisible" header="Transaction Details" :dismissable-mask="true" :modal="true" class="w-1/3">
      <div v-if="selectedHistory">
        <div class="mb-1">
          <strong>Invoice #:</strong> <span class="font-medium">{{ selectedHistory.invoice_no }}</span>
        </div>
        <div class="mb-2">
          <strong>Date/Time:</strong>
          {{
            new Date(selectedHistory.timestamp).toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true
            })
          }}
        </div>

        <DataTable :value="safeSelectedItems" class="w-full mt-4" :showGridlines="true" scrollable scrollHeight="240px">
          <Column field="name" header="Product Name" sortable />
          <!-- We only know brands reliably from current products list; history items may not carry brand.
               If your history items include product_id or brand, add a Brand column similar to the cart/bill. -->
          <Column field="quantity" header="Quantity" sortable />



           <Column header="Unit Price">
    <template #body="slotProps">
      ₱{{ Number(slotProps.data.price).toFixed(2) }}
    </template>
  </Column>

  <Column header="Subtotal">
    <template #body="slotProps">
      ₱{{ (Number(slotProps.data.quantity) * Number(slotProps.data.price)).toFixed(2) }}
    </template>
  </Column>

        </DataTable>

        <hr class="my-4" />
        <div class="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>₱{{ Number(selectedHistory.total).toFixed(2) }}</span>
        </div>
      </div>

      <div v-else><p>No transaction selected.</p></div>

      <div class="flex justify-end mt-4">
        <Button label="Close" class="p-button-primary" @click="historyDialogVisible = false" />
      </div>
    </Dialog>

    <!-- Bill Summary (pre-confirm) -->
    <Dialog v-model:visible="billDialogVisible" header="Bill Summary" :modal="true" class="w-1/2">
      <div v-if="confirmingCheckout && cart.length > 0">
        <h3 class="text-lg font-bold mb-2">Bill Details</h3>

        <DataTable
          :value="billLines"
          class="w-full"
          :showGridlines="true"
          scrollable
          scrollHeight="220px"
          dataKey="product_id"
        >
          <Column field="name" header="Product Name" />
          <Column field="brand" header="Brand" />
          <Column field="quantity" header="Qty" />
          <Column header="Unit Price">
            <template #body="{ data }">₱{{ Number(data.unit_price).toFixed(2) }}</template>
          </Column>
          <Column header="Subtotal">
            <template #body="{ data }">₱{{ Number(data.subtotal).toFixed(2) }}</template>
          </Column>
        </DataTable>

        <hr class="my-4" />
        <div class="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>₱{{ uiTotal.toFixed(2) }}</span>
        </div>
        <div class="flex justify-end mt-4">
          <Button label="Confirm" class="p-button-primary mr-2" @click="confirmCheckout" />
          <Button label="Cancel" class="p-button-secondary" @click="cancelCheckout" />
        </div>
      </div>
      <div v-else><p>No checkout data available.</p></div>
    </Dialog>
  </div>
</template>
