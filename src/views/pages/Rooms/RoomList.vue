<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { getRooms, getRoomTypeRates, bookRoom, fetchLatestBooking, cancelBooking, checkInBooking, checkoutRoom, cleaningComplete, fetchPOSProducts, fetchPOSPreview, posCheckout, fetchDiscounts, getAvailableAmenities, getRoomSerialNumbers, updateRoomSerialNumbers, createCheckinPayment, updateCheckinPaymentNote, updateCheckinPaymentAmount, extendCheckinPayment, extendBooking, updateCheckinPaymentExtras } from "@/api/auth";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import RoomSummary from "./RoomSummary.vue";
//extend rates

const extendRates = ref({ "6": 0, "12": 0, "24": 0 });   // fetched via getRoomTypeRates
const extendHoursSel = ref(null);                        // 6 | 12 | 24
const extendAmount = computed(() => {
  // If we have an extended duration selected, use its rate
  if (selectedExtendDuration.value) {
    return selectedExtendDuration.value.rate;
  }
  
  // Otherwise, use regular rates for 6/12/24 hours
  const h = String(extendHoursSel.value ?? "");
  return Number(extendRates.value[h] || 0);
});

const extendAmountReceived = ref(null);
const extendChange = computed(() => {
  const received = Number(extendAmountReceived.value || 0);
  return received - extendAmount.value;
});
const extendIsInsufficient = computed(() => extendAmount.value > 0 && extendChange.value < 0);
const extendHasAmount = computed(() => Number(extendAmountReceived.value || 0) > 0);
const confirmExtendDialogVisible = ref(false);

// More Stay Duration for Extend Dialog
const extendMoreDurationDialogVisible = ref(false);
const selectedExtendDuration = ref(null);
const settingExtendedHours = ref(false); // Flag to prevent watch interference
const preventingAutoRefetch = ref(false); // Flag to prevent automatic refetch during extension

// Transaction Report
const transactionReportDialogVisible = ref(false);
const transactionReportStartDate = ref(null);
const transactionReportEndDate = ref(null);
const transactionReportStartTime = ref(null);
const transactionReportEndTime = ref(null);
const transactionReportData = ref({
    checkinPayments: [],
    bills: [],
    totalCheckinPayments: 0,
    totalBills: 0,
    grandTotal: 0
});
const loadingTransactionReport = ref(false);

// Calculate daily rates for extend based on 24-hour rate
const extendDailyRates = computed(() => {
    const rate24h = extendRates.value?.["24"] || 0;
    return {
        1: rate24h, // 1 day
        2: rate24h * 2, // 2 days
        3: rate24h * 3, // 3 days
        4: rate24h * 4, // 4 days
        5: rate24h * 5, // 5 days
        6: rate24h * 6, // 6 days
        7: rate24h * 7, // 7 days
        week: rate24h * 7, // 1 week (same as 7 days but separate for display)
        twoWeeks: rate24h * 14, // 2 weeks
        month: rate24h * 30, // 1 month
    };
});

// Show extend amount inside dialogs
const extendAmountPD = computed(() =>
  Number(selectedRoom.value?.guestDetails?.extend?.amount || 0)
);

function resetExtensionForm() {
  extendHoursSel.value = null;
  extendAmountReceived.value = null;
  confirmExtendDialogVisible.value = false;
  selectedExtendDuration.value = null;
}

function openExtendMoreDurationDialog() {
    extendMoreDurationDialogVisible.value = true;
}

function selectExtendDailyRateAndHours(days, rate) {
    let actualDays;
    if (days === 'week') actualDays = 7;
    else if (days === 'twoWeeks') actualDays = 14;
    else if (days === 'month') actualDays = 30;
    else actualDays = parseInt(days);
    
    const hours = actualDays * 24; // Convert days to hours
    
    // Set flag to prevent watch interference
    settingExtendedHours.value = true;
    
    // Store the selected duration for highlighting BEFORE setting hours
    selectedExtendDuration.value = {
        days: days,
        label: getDayLabel(days),
        hours: hours,
        rate: rate
    };
    
    // Set hours after storing duration
    extendHoursSel.value = hours;
    
    // Clear flag after a brief delay
    setTimeout(() => {
        settingExtendedHours.value = false;
    }, 100);
    
    extendMoreDurationDialogVisible.value = false; // Close dialog after selection
}

// Helper function to check if current selection matches extended duration
function isSelectedExtendDays(days) {
    return selectedExtendDuration.value?.days === days;
}

// Watch for regular hour selections to clear extended duration
watch(extendHoursSel, (newValue, oldValue) => {
    // Don't interfere if we're setting extended hours programmatically
    if (settingExtendedHours.value) return;
    
    // Only clear if user selects regular hours (6, 12, 24) from dropdown
    if ([6, 12, 24].includes(newValue) && oldValue !== newValue) {
        selectedExtendDuration.value = null;
    }
});

async function openExtendDialog(room) {
  selectedRoom.value = {
    ...room,
    guestDetails: { ...room.guestDetails },
  };
  resetExtensionForm();
  selectedExtendDuration.value = null; // Reset extended duration selection

  try {
    const res = await getRoomTypeRates(selectedRoom.value.type_id);
    const d = res?.data?.rates || {};
    extendRates.value = {
      "6": Number(d["6"] ?? d[6] ?? 0),
      "12": Number(d["12"] ?? d[12] ?? 0),
      "24": Number(d["24"] ?? d[24] ?? 0),
    };
  } catch {
    extendRates.value = { "6": 0, "12": 0, "24": 0 };
  }

  extendDialogVisible.value = true;
}

function validateExtendInputs() {
  const hours = Number(extendHoursSel.value || 0);
  const amount = Number(extendAmount.value || 0);
  const amountReceived = Number(extendAmountReceived.value || 0);
  if (!hours) throw new Error("Please select extension duration from the available options.");
  if (amount <= 0) throw new Error("Rate not available for the selected duration.");
  if (!amountReceived) throw new Error("Please enter amount received.");
  if (amountReceived < amount) throw new Error("Insufficient amount received for the extension.");
  return { hours, amount, amountReceived };
}

function openConfirmExtend() {
  try {
    validateExtendInputs();
    confirmExtendDialogVisible.value = true;
  } catch (error) {
    toast.add({
      severity: "warn",
      summary: "Extend Stay",
      detail: error.message,
      life: 2500,
    });
  }
}

async function confirmExtension() {
  try {
    const { hours, amount, amountReceived } = validateExtendInputs();

    const roomId = Number(selectedRoom.value?.id);
    if (!roomId) throw new Error('Room not found');

    const roomIndex = rooms.value.findIndex(r => r.id === selectedRoom.value.id);
    if (roomIndex === -1) throw new Error("Room not found");

    const roomRef = rooms.value[roomIndex];
    const gd = roomRef.guestDetails ||= {};
    const bookingId = Number(selectedRoom.value?.guestDetails?.id) || null;

    // Handle extended durations by making multiple API calls if needed
    if (bookingId) {
      try {
        if (hours > 24) {
          // For extended durations, break into 24-hour chunks
          const fullDays = Math.floor(hours / 24);
          const remainderHours = hours % 24;
          const rate24h = extendRates.value?.["24"] || 0;
          
          // Make multiple 24-hour extension calls
          for (let i = 0; i < fullDays; i++) {
            await extendBooking(bookingId, {
              extend_hours: 24,
              extend_amount: rate24h,
            });
          }
          
          // Handle remainder hours if any
          if (remainderHours > 0) {
            let remainderRate = 0;
            if (remainderHours <= 6) {
              remainderRate = extendRates.value?.["6"] || 0;
              await extendBooking(bookingId, {
                extend_hours: 6,
                extend_amount: remainderRate,
              });
            } else if (remainderHours <= 12) {
              remainderRate = extendRates.value?.["12"] || 0;
              await extendBooking(bookingId, {
                extend_hours: 12,
                extend_amount: remainderRate,
              });
            } else {
              remainderRate = extendRates.value?.["24"] || 0;
              await extendBooking(bookingId, {
                extend_hours: 24,
                extend_amount: remainderRate,
              });
            }
          }
        } else {
          // Regular extension (6, 12, or 24 hours)
          await extendBooking(bookingId, {
            extend_hours: hours,
            extend_amount: amount,
          });
        }
      } catch (apiError) {
        throw new Error(apiError?.response?.data?.error || apiError.message || 'Failed to update booking extension');
      }
    }

    const prevExtendHours = Number(gd.extendedHours ?? gd.extend?.hours ?? 0);
    const prevExtendAmount = Number(gd.extend?.amount ?? 0);
    const newExtendHours = prevExtendHours + hours;
    const newExtendAmount = +(prevExtendAmount + amount).toFixed(2);

    // For the payment API, send the full hours to properly track cumulative extension
    let paymentExtendHours = hours;

    const payload = {
      room_id: roomId,
      booking_id: bookingId,
      extend_hours: paymentExtendHours,
      extend_amount: amount, // Use full amount for payment
    };

    let paymentSnapshot = null;
    try {
      const res = await extendCheckinPayment(payload);
      paymentSnapshot = res?.data?.payment || null;
    } catch (apiError) {
      throw new Error(apiError?.response?.data?.error || apiError.message);
    }

    gd.extendedHours = newExtendHours;
    gd.extend = {
      hours: newExtendHours,
      amount: newExtendAmount,
    };

    const baseInTsRaw = parseDateMaybePH(gd.checkInDateTime);
    const baseInTs = Number.isFinite(baseInTsRaw) ? baseInTsRaw : Date.now();
    if (!gd.checkInDateTime || !Number.isFinite(baseInTsRaw)) {
      gd.checkInDateTime = new Date(baseInTs).toISOString();
    }
    const originalHours = Number(gd.selectedHours || 0);
    const prevOutRaw = parseDateMaybePH(gd.checkOutDateTime);
    const fallbackPrevOut = baseInTs + (originalHours + prevExtendHours) * 60 * 60 * 1000;
    const prevOutTs = Number.isFinite(prevOutRaw) ? prevOutRaw : fallbackPrevOut;
    const extensionStartTs = Math.max(Date.now(), prevOutTs);
    const newCheckoutTs = extensionStartTs + hours * 60 * 60 * 1000;
    gd.checkOutDateTime = new Date(newCheckoutTs).toISOString();

    if (!gd.payment) gd.payment = { deposit: 0, isPaid: false, note: '' };
    if (paymentSnapshot) {
      const totalDue = Number(paymentSnapshot.total_due ?? paymentSnapshot.totalDue ?? gd.payment.totalDue ?? 0);
      const extendAmt = Number(paymentSnapshot.extend_amount ?? paymentSnapshot.extendAmount ?? newExtendAmount);
      
      // IMPORTANT: Use our calculated newExtendHours, not the backend's limited extend_hours
      // The backend only knows about the last 24-hour payment, but we track the total extension
      const extendHours = newExtendHours; // Always use our correct total
      
      // Get amount received from localStorage since we removed it from database
      const storageKey = `amountReceived_room_${roomId}`;
      const amtRecv = Number(localStorage.getItem(storageKey) || 0);
      
      gd.payment.totalDue = totalDue;
      gd.payment.total_due = totalDue;
      gd.payment.extend_amount = extendAmt;
      gd.payment.extendAmount = extendAmt;
      gd.payment.extend_hours = extendHours;
      gd.payment.extendHours = extendHours;
      gd.payment.isPaid = amtRecv >= totalDue - 0.009;
    }

    rooms.value[roomIndex] = { ...roomRef, guestDetails: { ...gd } };
    rooms.value = [...rooms.value];
    selectedRoom.value = {
      ...selectedRoom.value,
      guestDetails: { ...gd },
    };

    lastCheckInByRoom.set(roomId, {
      inISO: gd.checkInDateTime,
      outISO: gd.checkOutDateTime,
      at: Date.now(),
    });

    localStorage.setItem("rooms", JSON.stringify(rooms.value));

    toast.add({
      severity: "success",
      summary: "Stay Extended",
      detail: `+${hours}h added. Extend charge ₱${amount.toFixed(2)}. Change ₱${Math.max(0, extendChange.value).toFixed(2)}.`,
      life: 3000,
    });

    // Store extension data in localStorage for persistence across refreshes
    const persistentExtensionData = JSON.parse(localStorage.getItem('roomExtensions') || '{}');
    persistentExtensionData[roomId] = {
      totalExtendedHours: newExtendHours,
      totalExtendedAmount: newExtendAmount,
      timestamp: Date.now()
    };
    localStorage.setItem('roomExtensions', JSON.stringify(persistentExtensionData));

    // Prevent automatic refetch temporarily to preserve our extension data
    preventingAutoRefetch.value = true;
    
    emitRoomsChanged("extended", Number(selectedRoom.value.id));
    emitBookingsChanged("extended", Number(selectedRoom.value?.guestDetails?.id) || null, Number(selectedRoom.value.id));

    // Re-enable refetch after a delay to allow events to settle
    setTimeout(() => {
        preventingAutoRefetch.value = false;
    }, 3000);

    extendDialogVisible.value = false;

    confirmExtendDialogVisible.value = false;
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Extension Failed",
      detail: error.message,
      life: 3000,
    });
  }
}

//--------------discounts-----------

const discounts = ref([]); // [{ id, name, percent, status }]

const activeDiscounts = computed(() =>
  discounts.value.filter(d => String(d.status).toLowerCase() === "active")
);

const selectedDiscountId = ref(null); // bound to UI dropdown
const selectedDiscount = computed(() =>
  activeDiscounts.value.find(d => Number(d.id) === Number(selectedDiscountId.value)) || null
);

// Manual discount functionality
const discountType = ref("manual"); // "percentage" | "manual"
const manualDiscountAmount = ref(0);

const discountTypeOptions = [
  { label: "Manual Discount", value: "manual" },
  { label: "Percentage Discount", value: "percentage" }
];

// Watch for discount type changes to clear opposite values
watch(discountType, (newType) => {
  if (newType === "percentage") {
    manualDiscountAmount.value = 0;
  } else if (newType === "manual") {
    selectedDiscountId.value = null;
  }
});

async function loadDiscounts() {
  try {
    const res = await fetchDiscounts({ status: "active" }); // GET /discounts?status=active
    discounts.value = res?.data || [];
  } catch (e) {
    toast.add({ severity: "error", summary: "Discounts", detail: "Failed to load discounts.", life: 2500 });
  }
}

// ==== Discounted totals (room only) ====
const roomRate = computed(() => Number(selectedRoom.value?.guestDetails?.selectedrate) || 0);
const roomDiscountPercent = computed(() => Number(selectedDiscount.value?.percent) || 0);
const roomDiscountAmount = computed(() => {
  if (discountType.value === "manual") {
    return Number(manualDiscountAmount.value) || 0;
  }
  return +(roomRate.value * roomDiscountPercent.value / 100).toFixed(2);
});
const discountedRoomRate = computed(() => Math.max(0, +(roomRate.value - roomDiscountAmount.value).toFixed(2)));

const productSearchQueryPD = ref("");
const productsPD = ref([]);
const cartPD = ref([]); // [{ id, name, brand, quantity }]
const previewPD = ref({ lines: [], total: 0 }); // authoritative pricing

// load-on-open flag
let loadedProductsOncePD = false;

// Amenities (non-consumables) for rent in payment dialog
const amenitiesPD = ref([]); // [{ serial_id, serial_number, product_name, brand, unit_rental_price }]
const amenitiesSearch = ref("");
const selectedAmenityIds = ref([]); // [serial_id]
const filteredAmenitiesPD = computed(() => {
  const q = amenitiesSearch.value.trim().toLowerCase();
  const list = amenitiesPD.value || [];
  if (!q) return list;
  return list.filter(a => (
    ((a.product_name || "") + " " + (a.brand || "") + " " + (a.serial_number || "")).toLowerCase().includes(q)
  ));
});
const uiTotalAmenitiesPD = computed(() => {
  const byId = new Map((amenitiesPD.value || []).map(a => [Number(a.serial_id), Number(a.unit_rental_price) || 0]));
  return (selectedAmenityIds.value || []).reduce((sum, id) => sum + (byId.get(Number(id)) || 0), 0);
});

// Selected amenities derived from checkbox selection (for cart view)
const selectedAmenitiesPD = computed(() => {
  const byId = new Map((amenitiesPD.value || []).map(a => [Number(a.serial_id), a]));
  return (selectedAmenityIds.value || [])
    .map(id => byId.get(Number(id)))
    .filter(Boolean)
    .map(a => ({
      id: Number(a.serial_id),
      name: a.product_name,
      serial: a.serial_number,
      price: Number(a.unit_rental_price) || 0,
      brand: a.brand || ''
    }));
});

// ---- Occupied extras dialog state ----
const occExtrasDialogVisible = ref(false);
const occCart = ref([]); // [{ id, name, quantity }]
const occPreview = ref({ lines: [], total: 0 });
const occProductSearch = ref('');
const occSelectedAmenityIds = ref([]);
const occAmenitiesList = ref([]);
const occAmenitiesSearch = ref('');

const occNameById = computed(() => new Map(productsPD.value.map(p => [Number(p.id), p.name || p.product_name || `#${p.id}`])));
const occBrandById = computed(() => new Map(productsPD.value.map(p => [Number(p.id), p.brand || p.product_brand || p.Brand || '—'])));
const occPriceById = computed(() => new Map(productsPD.value.map(p => [Number(p.id), Number(p.price) || 0])));
const occStockById = computed(() => {
  const m = new Map();
  for (const p of productsPD.value) m.set(Number(p.id), Number(p.stock ?? 0));
  return m;
});

const occFilteredProducts = computed(() => {
  const q = occProductSearch.value.trim().toLowerCase();
  if (!q) return productsPD.value;
  return productsPD.value.filter(p => ((p.name || p.product_name || '') + ' ' + (p.brand || p.product_brand || '')).toLowerCase().includes(q));
});

const occPayloadItems = computed(() =>
  occCart.value
    .filter(it => (it.quantity || 0) > 0)
    .map(it => ({ id: Number(it.id), quantity: Number(it.quantity) }))
);

const occFilteredAmenities = computed(() => {
  const q = occAmenitiesSearch.value.trim().toLowerCase();
  const list = occAmenitiesList.value || [];
  if (!q) return list;
  return list.filter(a => (
    ((a.product_name || '') + ' ' + (a.brand || '') + ' ' + (a.serial_number || '')).toLowerCase().includes(q)
  ));
});

const occSelectedAmenities = computed(() => {
  const byId = new Map((occAmenitiesList.value || []).map(a => [Number(a.serial_id), a]));
  return (occSelectedAmenityIds.value || [])
    .map(id => byId.get(Number(id)))
    .filter(Boolean)
    .map(a => ({
      id: Number(a.serial_id),
      serial_id: Number(a.serial_id),
      amenity_name: a.product_name,
      serial_number: a.serial_number,
      unit_rental_price: Number(a.unit_rental_price) || 0,
      brand: a.brand || ''
    }));
});

const occAmenitiesTotal = computed(() => {
  return occSelectedAmenities.value.reduce((sum, a) => sum + Number(a.unit_rental_price || 0), 0);
});

const occCartTotal = computed(() => {
  const total = Number(occPreview.value?.total || 0);
  if (total > 0) return total;
  return occCart.value.reduce((sum, it) => {
    const price = occUnitPrice(it);
    return sum + price * Number(it.quantity || 0);
  }, 0);
});

const occAmountReceived = ref(null);
const occTotalAddOn = computed(() => Number(occCartTotal.value || 0) + Number(occAmenitiesTotal.value || 0));
const occChangeDelta = computed(() => {
  const received = Number(occAmountReceived.value || 0);
  return received - occTotalAddOn.value;
});
const occIsInsufficient = computed(() => occTotalAddOn.value > 0 && occChangeDelta.value < 0);

function removeAmenityPD(id){
  const nid = Number(id);
  selectedAmenityIds.value = (selectedAmenityIds.value || []).filter(v => Number(v) !== nid);
}

/* fast maps (built from productsPD) */
const nameByIdPD = computed(() => new Map(productsPD.value.map(p => [Number(p.id), p.name || p.product_name || `#${p.id}`])));
const brandByIdPD = computed(() => new Map(productsPD.value.map(p => [Number(p.id), p.brand || p.product_brand || p.Brand || "—"])));
const priceByIdPD = computed(() => new Map(productsPD.value.map(p => [Number(p.id), Number(p.price) || 0])));
const stockByIdPD = computed(() => {
  const m = new Map();
  for (const p of productsPD.value) m.set(Number(p.id), Number(p.stock ?? 0));
  return m;
});
function getStockPD(id){ return stockByIdPD.value.get(Number(id)) ?? 0; }

const lastCheckInByRoom = new Map();

const paymentFlow = ref("WALKIN");

const payloadItemsPD = computed(() =>
  cartPD.value.filter(it => (it.quantity || 0) > 0)
              .map(it => ({ id: Number(it.id), quantity: Number(it.quantity) }))
);

let debounceTimerPD = null;
let reqSeqPD = 0;
let lastPayloadKeyPD = "";

let occPreviewTimer = null;
let occReqSeq = 0;
let occLastPayloadKey = "";

function payloadKeyPD(items){ return JSON.stringify(items.slice().sort((a,b)=>a.id-b.id)); }

function schedulePreviewPD(){
  clearTimeout(debounceTimerPD);
  debounceTimerPD = setTimeout(runPreviewPD, 200);
}

async function runPreviewPD(){
  const items = payloadItemsPD.value;
  if (!items.length){
    previewPD.value = { lines: [], total: 0 };
    lastPayloadKeyPD = "";
    return;
  }
  const key = payloadKeyPD(items);
  if (key === lastPayloadKeyPD) return;
  lastPayloadKeyPD = key;

  const seq = ++reqSeqPD;
  try{
    const { data } = await fetchPOSPreview({ items });
    if (seq !== reqSeqPD) return;
    previewPD.value = data || { lines: [], total: 0 };
  }catch{ /* keep previous */ }
}

/* ---- UI unit/subtotal (use preview if present) ---- */
function previewLineForPD(productId){
  const pid = Number(productId);
  return (previewPD.value.lines || []).find(l => Number(l.product_id) === pid) || null;
}
function uiUnitPricePD(row){
  const line = previewLineForPD(row.id);
  if (line && Number(line.quantity) > 0) return Number(line.subtotal) / Number(line.quantity);
  return priceByIdPD.value.get(Number(row.id)) || 0;
}
function uiSubtotalPD(row){
  const line = previewLineForPD(row.id);
  if (line) return Number(line.subtotal);
  return uiUnitPricePD(row) * Number(row.quantity || 0);
}
const uiTotalExtrasPD = computed(() => {
  const t = Number(previewPD.value?.total || 0);
  if (t > 0) return t;
  return cartPD.value.reduce((sum, it) => sum + uiSubtotalPD(it), 0);
});

// Split cart view by batch/unit price using preview breakdown
const cartViewPD = computed(() => {
  const lines = previewPD.value?.lines || [];
  const byId = new Map(cartPD.value.map(it => [Number(it.id), it]));
  const rows = [];

  for (const ln of lines) {
    const pid = Number(ln.product_id);
    const src = byId.get(pid);
    if (!src) continue;
    const breakdown = ln.breakdown || [];

    // If we have breakdown from server, render one row per batch/price
    if (Array.isArray(breakdown) && breakdown.length) {
      for (const b of breakdown) {
        const qty = Number(b.qty) || 0;
        if (qty <= 0) continue;
        const unit = Number(b.unit_price) || 0;
        rows.push({
          vkey: `${pid}@${b.item_id ?? unit}`,
          id: pid,
          name: nameByIdPD.value.get(pid) || src.name || `#${pid}`,
          brand: brandByIdPD.value.get(pid) || src.brand || '',
          quantity: qty,
          unitPrice: unit,
          subtotal: +(qty * unit).toFixed(2),
        });
      }
      continue;
    }

    // Fallback: no breakdown yet, show single aggregated row
    const unit = uiUnitPricePD(src);
    const qty = Number(src.quantity) || 0;
    if (qty > 0) {
      rows.push({
        vkey: `${pid}`,
        id: pid,
        name: nameByIdPD.value.get(pid) || src.name || `#${pid}`,
        brand: brandByIdPD.value.get(pid) || src.brand || '',
        quantity: qty,
        unitPrice: unit,
        subtotal: +(unit * qty).toFixed(2),
      });
    }
  }

  // Also include any items not present in preview yet (e.g., before first fetch)
  if (!rows.length && cartPD.value.length) {
    for (const src of cartPD.value) {
      const pid = Number(src.id);
      const qty = Number(src.quantity) || 0;
      if (qty <= 0) continue;
      const unit = uiUnitPricePD(src);
      rows.push({
        vkey: `${pid}`,
        id: pid,
        name: nameByIdPD.value.get(pid) || src.name || `#${pid}`,
        brand: brandByIdPD.value.get(pid) || src.brand || '',
        quantity: qty,
        unitPrice: unit,
        subtotal: +(unit * qty).toFixed(2),
      });
    }
  }

  return rows;
});

/* ---- product filtering (for Payment dialog) ---- */
const filteredProductsPD = computed(() => {
  const q = productSearchQueryPD.value.trim().toLowerCase();
  if (!q) return productsPD.value;
  return productsPD.value.filter(p =>
    ((p.name || p.product_name || "") + " " + (p.brand || p.product_brand || ""))
      .toLowerCase().includes(q)
  );
});

function warnLimitPD(id){
  const stock = getStockPD(id);
  toast.add({ severity: "warn", summary: "Stock limit reached", detail: `Only ${stock} in stock for this product.`, life: 2500 });
}

function adjustProductQtyPD(productId, delta){
  const id = Number(productId);
  const stock = getStockPD(id);
  let row = cartPD.value.find(i => Number(i.id) === id);
  const qty = row ? Number(row.quantity) : 0;

  if (delta > 0){
    const canAdd = Math.min(delta, Math.max(0, stock - qty));
    if (canAdd <= 0){ warnLimitPD(id); return; }
    if (row) row.quantity += canAdd;
    else cartPD.value.push({ id, name: nameByIdPD.value.get(id) || `#${id}`, brand: brandByIdPD.value.get(id) || '', quantity: canAdd });
  } else if (delta < 0){
    const newQty = qty + delta;
    if (newQty > 0 && row){ row.quantity = newQty; }
    else { cartPD.value = cartPD.value.filter(i => Number(i.id) !== id); }
  }
  schedulePreviewPD();
}

function decreaseBatchPD(row){ adjustProductQtyPD(row.id, -1); }
function increaseBatchPD(row){ adjustProductQtyPD(row.id, +1); }
function removeBatchPD(row){ adjustProductQtyPD(row.id, -Number(row.quantity || 0)); }

function addToCartPD(product){
  const id = Number(product.id);
  const stock = getStockPD(id);
  const existing = cartPD.value.find(i => Number(i.id) === id);
  const currentQty = existing ? Number(existing.quantity) : 0;
  if (stock <= 0 || currentQty >= stock) { warnLimitPD(id); return; }

  if (existing) existing.quantity += 1;
  else cartPD.value.push({ id, name: product.name || product.product_name || `#${id}`, brand: product.brand || product.product_brand || "—", quantity: 1 });

  schedulePreviewPD();
}
function increasePD(rowOrId){
  const id = typeof rowOrId === "object" ? Number(rowOrId.id) : Number(rowOrId);
  const stock = getStockPD(id);
  const row = cartPD.value.find(i => Number(i.id) === id);
  const qty = row ? Number(row.quantity) : 0;
  if (qty >= stock) { warnLimitPD(id); return; }
  if (row) row.quantity += 1;
  else cartPD.value.push({ id, name: nameByIdPD.value.get(id) || `#${id}`, brand: brandByIdPD.value.get(id) || "—", quantity: 1 });
  schedulePreviewPD();
}
function decreasePD(rowOrId){
  const id = typeof rowOrId === "object" ? Number(rowOrId.id) : Number(rowOrId);
  const row = cartPD.value.find(i => Number(i.id) === id);
  if (!row) return;
  if (row.quantity > 1) row.quantity -= 1;
  else cartPD.value = cartPD.value.filter(i => Number(i.id) !== id);
  schedulePreviewPD();
}
function removePD(row){
  cartPD.value = cartPD.value.filter(i => Number(i.id) !== Number(row.id));
  schedulePreviewPD();
}

function occWarnLimit(id){
  const stock = occStockById.value.get(Number(id)) ?? 0;
  toast.add({ severity: 'warn', summary: 'Stock limit reached', detail: `Only ${stock} in stock for this product.`, life: 2500 });
}

function occAdjustProductQty(productId, delta){
  const id = Number(productId);
  const stock = occStockById.value.get(id) ?? 0;
  let row = occCart.value.find(i => Number(i.id) === id);
  const qty = row ? Number(row.quantity) : 0;

  if (delta > 0){
    const canAdd = Math.min(delta, Math.max(0, stock - qty));
    if (canAdd <= 0){ occWarnLimit(id); return; }
    if (row) row.quantity += canAdd;
    else occCart.value.push({ id, name: occNameById.value.get(id) || `#${id}`, brand: occBrandById.value.get(id) || '', quantity: canAdd });
  } else if (delta < 0){
    const newQty = qty + delta;
    if (newQty > 0 && row){ row.quantity = newQty; }
    else { occCart.value = occCart.value.filter(i => Number(i.id) !== id); }
  }
  occSchedulePreview();
}

function occIncreaseProduct(rowOrId){
  const id = typeof rowOrId === 'object' ? Number(rowOrId.id) : Number(rowOrId);
  const stock = occStockById.value.get(id) ?? 0;
  let row = occCart.value.find(i => Number(i.id) === id);
  const qty = row ? Number(row.quantity) : 0;
  if (qty >= stock){ occWarnLimit(id); return; }
  if (row) row.quantity += 1;
  else occCart.value.push({ id, name: occNameById.value.get(id) || `#${id}`, brand: occBrandById.value.get(id) || '', quantity: 1 });
  occSchedulePreview();
}

function occDecreaseProduct(rowOrId){
  const id = typeof rowOrId === 'object' ? Number(rowOrId.id) : Number(rowOrId);
  const row = occCart.value.find(i => Number(i.id) === id);
  if (!row) return;
  if (row.quantity > 1) row.quantity -= 1;
  else occCart.value = occCart.value.filter(i => Number(i.id) !== id);
  occSchedulePreview();
}

function occRemoveProduct(row){
  occCart.value = occCart.value.filter(i => Number(i.id) !== Number(row.id));
  occSchedulePreview();
}

function occPayloadKey(items){ return JSON.stringify(items.slice().sort((a,b)=>a.id-b.id)); }

function occSchedulePreview(){
  clearTimeout(occPreviewTimer);
  occPreviewTimer = setTimeout(occRunPreview, 200);
}

async function occRunPreview(){
  const items = occPayloadItems.value;
  if (!items.length){
    occPreview.value = { lines: [], total: 0 };
    occLastPayloadKey = '';
    return;
  }
  const key = occPayloadKey(items);
  if (key === occLastPayloadKey) return;
  occLastPayloadKey = key;

  const seq = ++occReqSeq;
  try{
    const { data } = await fetchPOSPreview({ items });
    if (seq !== occReqSeq) return;
    occPreview.value = data || { lines: [], total: 0 };
  }catch{
    // keep previous preview
  }
}

function occPreviewLine(productId){
  const pid = Number(productId);
  return (occPreview.value.lines || []).find(l => Number(l.product_id) === pid) || null;
}

function occUnitPrice(row){
  const line = occPreviewLine(row.id);
  if (line && Number(line.quantity) > 0){
    return Number(line.subtotal) / Number(line.quantity);
  }
  return occPriceById.value.get(Number(row.id)) || 0;
}

function occSubtotal(row){
  const line = occPreviewLine(row.id);
  if (line) return Number(line.subtotal);
  return occUnitPrice(row) * Number(row.quantity || 0);
}

const occCartView = computed(() => {
  const lines = occPreview.value?.lines || [];
  const byId = new Map(occCart.value.map(it => [Number(it.id), it]));
  const rows = [];

  for (const ln of lines) {
    const pid = Number(ln.product_id);
    const src = byId.get(pid);
    if (!src) continue;
    const breakdown = ln.breakdown || [];

    if (Array.isArray(breakdown) && breakdown.length) {
      for (const b of breakdown) {
        const qty = Number(b.qty) || 0;
        if (qty <= 0) continue;
        const unit = Number(b.unit_price) || 0;
        rows.push({
          vkey: `${pid}@${b.item_id ?? unit}`,
          id: pid,
          name: occNameById.value.get(pid) || src.name || `#${pid}`,
          brand: occBrandById.value.get(pid) || src.brand || '',
          quantity: qty,
          unitPrice: unit,
          subtotal: +(qty * unit).toFixed(2),
        });
      }
      continue;
    }

    const unit = occUnitPrice(src);
    const qty = Number(src.quantity) || 0;
    if (qty > 0) {
      rows.push({
        vkey: `${pid}`,
        id: pid,
        name: occNameById.value.get(pid) || src.name || `#${pid}`,
        brand: occBrandById.value.get(pid) || src.brand || '',
        quantity: qty,
        unitPrice: unit,
        subtotal: +(unit * qty).toFixed(2),
      });
    }
  }

  if (!rows.length && occCart.value.length) {
    for (const src of occCart.value) {
      const pid = Number(src.id);
      const qty = Number(src.quantity) || 0;
      if (qty <= 0) continue;
      const unit = occUnitPrice(src);
      rows.push({
        vkey: `${pid}`,
        id: pid,
        name: occNameById.value.get(pid) || src.name || `#${pid}`,
        brand: occBrandById.value.get(pid) || src.brand || '',
        quantity: qty,
        unitPrice: unit,
        subtotal: +(unit * qty).toFixed(2),
      });
    }
  }

  return rows;
});

function getCheckoutTs(room) {
  // Only apply the local override for OCCUPIED rooms
  if (room?.status === "Occupied") {
    const local = lastCheckInByRoom.get(room.id);
    if (local && room.guestDetails) {
      const serverOut = parseDateMaybePH(room.guestDetails.checkOutDateTime);
      const localOut  = parseDateMaybePH(local.outISO);
      if (Number.isFinite(localOut) && (!Number.isFinite(serverOut) || serverOut < localOut)) {
        room.guestDetails.checkInDateTime  = local.inISO;
        room.guestDetails.checkOutDateTime = local.outISO;
      }
    }
  }

  const b = room?.guestDetails;
  if (!b) return null;

  // Prefer explicit checkout time if present (server or local)
  if (b.checkOutDateTime) {
    const t = parseDateMaybePH(b.checkOutDateTime);
    return Number.isFinite(t) ? t : null;
  }

  // Fallback: check-in + selectedHours
  const inTs = parseDateMaybePH(b.checkInDateTime);
  const hrs = Number(b.selectedHours || 0);
  if (!Number.isFinite(inTs) || !hrs) return null;
  return inTs + hrs * 60 * 60 * 1000;
}

function getBookingExpiryTs(room) {
  const b = room?.guestDetails;
  if (!b) return null;

  // If we just booked this room in the UI, prefer that "now" for a short window
  const uiStart = uiBookedAtMsByRoom.get(room?.id);
  if (room?.status === "Booked" && Number.isFinite(uiStart)) {
    // For the first 3 minutes after booking, trust the UI start to avoid stale server times
    if ((Date.now() - uiStart) < 3 * 60 * 1000) {
      return uiStart + CHECKIN_WINDOW_MS; // 60 minutes from the UI click
    }
  }

  const baseTs = parseDateMaybePH(b.checkInDateTime || b.createdAt);
  if (!Number.isFinite(baseTs)) return null;
  return baseTs + CHECKIN_WINDOW_MS;
}

const CHECKIN_WINDOW_MS = 60 * 60 * 1000;

const uiBookedAtMsByRoom = new Map();

const isBook = computed(() => customerType.value === "Book");

const uiBookingTs = ref(null); 

    const NOW_TICK_MS = 1000;

// Resort the list less often so the UI doesn't churn every second
const SORT_TICK_MS = 15000; // 15s. Tweak to 5–30s as you like.

const nowTick = ref(Date.now()); // drives just the text labels
const sortTick = ref(0);         // drives resort cadence

let tickTimer = null;
let sortTimer = null;

function bookedRemainingMs(room) {
  if (room?.status !== "Booked") return null;
  const endTs = getBookingExpiryTs(room);
  if (endTs == null) return null;
  return endTs - nowTick.value;
}

function isBookedNear(room) {
  if (room?.status !== "Booked") return false;
  const ms = bookedRemainingMs(room);
  return ms != null && ms > 0 && ms <= NEAR_MS; // reuse 30m threshold
}

function isBookedExpired(room) {
  if (room?.status !== "Booked") return false;
  const ms = bookedRemainingMs(room);
  return ms != null && ms <= 0;
}

function bookedRemainingLabel(room) {
  const ms = bookedRemainingMs(room);
  if (ms == null) return null;
  return ms <= 0 ? null : `${formatRemaining(ms)} left`;
}

const customerType = ref("Book"); // "Book" | "Check-In"
const customerTypeOptions = [
  { label: "Book", value: "Book" },
  { label: "Check-In", value: "Check-In" },
];

function parseDateMaybePH(x) {
  if (!x) return NaN;
  if (typeof x === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(x)) {
    return new Date(x.replace(" ", "T") + "+08:00").getTime(); // treat as Asia/Manila
  }
  const t = new Date(x).getTime();
  return Number.isFinite(t) ? t : NaN;
}

// Reusable listener to nudge resorts when room/bookings change
const bumpSort = () => { sortTick.value++; };

    const NEAR_MS = 30 * 60 * 1000;       // 30 minutes in ms

    function remainingMs(room) {
    const endTs = getCheckoutTs(room);
    if (endTs == null) return null;
    return endTs - nowTick.value;
    }

    function isNearThirty(room) {
    if (room?.status !== "Occupied") return false;
    const ms = remainingMs(room);
    return ms != null && ms > 0 && ms <= NEAR_MS;
    }

    function isTimeUp(room) {
    if (room?.status !== "Occupied") return false;
    const ms = remainingMs(room);
    return ms != null && ms <= 0;
    }

function formatRemaining(ms) {
  if (ms == null) return "";
  const sec = ms > 0 ? Math.floor(ms / 1000) : 0; // floor keeps first tick at 59:59
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

    function remainingLabel(room) {
    const ms = remainingMs(room);
    if (ms == null) return null;
    return ms <= 0 ? null : `${formatRemaining(ms)} left`;
    }

    const rooms = ref([]);  

    // Live counters for RoomSummary props
    const countAvailable = computed(() => rooms.value.filter(r => r.status === 'Available').length);
    const countOccupied = computed(() => rooms.value.filter(r => r.status === 'Occupied').length);
    const countCleaning = computed(() => rooms.value.filter(r => r.status === 'Cleaning').length);
    const countBooked = computed(() => rooms.value.filter(r => r.status === 'Booked').length);

    function isWalkInStay(target) {
  // accepts a room or a guestDetails object
  const b = target?.guestDetails ?? target;
  const t = String(b?.bookingType || "").toLowerCase();
  if (t) return t.includes("walk");    // "Walk-In", "WALK-IN", etc.
  // fallback: no book code usually means walk-in
  return !b?.bookCode;
}

function isBookedStay(target) {
  const b = target?.guestDetails ?? target;
  const t = String(b?.bookingType || "").toLowerCase();
  if (t) return t.includes("book");    // "Booking", "BOOKING", etc.
  // fallback: presence of a book code usually means a booking
  return !!b?.bookCode;}

    function toPHDateTimeString(date) {
        // Convert any JS date to PH time string "YYYY-MM-DD HH:mm:ss"
        const d = new Date(
            typeof date === "string" ? date : date.toLocaleString("en-US", { timeZone: "Asia/Manila" })
        );
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const h = String(d.getHours()).padStart(2, "0");
        const min = String(d.getMinutes()).padStart(2, "0");
        const s = String(d.getSeconds()).padStart(2, "0");
        return `${y}-${m}-${day} ${h}:${min}:${s}`;
    }

    let bookingExpiryTimers = new Map();   // bookingId -> timeoutId
const bookingExpiryInFlight = new Set();

function scheduleBookingExpiryForRoom(room) {
  if (room.status !== "Booked") return;
  const b = room.guestDetails;
  if (!b?.id) return;

  // prefer explicit checkIn; fallback to createdAt
  const baseTs = parseDateMaybePH(b.checkInDateTime || b.createdAt);
  if (!Number.isFinite(baseTs)) return;

  const expiryTs = baseTs + CHECKIN_WINDOW_MS;
  const delay = Math.max(0, expiryTs - Date.now());

  // clear existing
  if (bookingExpiryTimers.has(b.id)) {
    clearTimeout(bookingExpiryTimers.get(b.id));
    bookingExpiryTimers.delete(b.id);
  }

  const timeoutId = setTimeout(async () => {
    if (bookingExpiryInFlight.has(b.id)) return;
    bookingExpiryInFlight.add(b.id);
    try {
      await cancelBooking(b.id);
      // Local state update
      room.status = "Available";
      room.guestDetails = null;
      if (selectedRoom.value?.id === room.id) {
        selectedRoom.value.status = "Available";
        selectedRoom.value.guestDetails = null;
      }
      uiBookedAtMsByRoom.delete(room.id);
      toast.add({
        severity: "warn",
        summary: "Booking cancelled",
        detail: `1-hour check-in window expired for Room ${room.room_number}`,
        life: 3000,
      });
      emitBookingsChanged("auto-cancelled-1h", b.id, room.id);
      emitRoomsChanged("status-updated", room.id);
    } catch (e) {
      // no-op
    } finally {
      bookingExpiryInFlight.delete(b.id);
      bookingExpiryTimers.delete(b.id);
    }
  }, delay);

  bookingExpiryTimers.set(b.id, timeoutId);
}

function scheduleBookingExpiryForAll() {
  for (const [, id] of bookingExpiryTimers) clearTimeout(id);
  bookingExpiryTimers.clear();
  for (const room of rooms.value) scheduleBookingExpiryForRoom(room);
}

watch(
  () => cartPD.value.map(i => `${i.id}:${i.quantity}`).join("|"),
  () => schedulePreviewPD()
);

watch(
  () => occCart.value.map(i => `${i.id}:${i.quantity}`).join('|'),
  () => occSchedulePreview()
);

const bookingExpirySignature = computed(() => {
  return rooms.value
    .map(room => {
      const g = room?.guestDetails || {};
      const bookingId = g.id || g.booking_id || '';
      const status = room?.status || '';
      const rawCreated = g.createdAt || g.created_at || g.checkInDateTime || '';
      let createdKey = '';
      if (rawCreated) {
        const parsed = new Date(rawCreated);
        createdKey = Number.isNaN(parsed.getTime()) ? String(rawCreated) : parsed.toISOString();
      }
      const selectedHours = g.selectedHours || g.selected_hours || 0;
      return `${room?.id || 0}:${bookingId}:${status}:${createdKey}:${selectedHours}`;
    })
    .join('|');
});

watch(bookingExpirySignature, () => {
  scheduleBookingExpiryForAll();
}, { immediate: true });

onUnmounted(() => {
  for (const [, id] of bookingExpiryTimers) clearTimeout(id);
  bookingExpiryTimers.clear();
});

    function BookingselectRateAndHours(hours, rate) {
        guestDetails.value.selectedHours = hours; // Update booking state
        guestDetails.value.selectedrate = rate;
        // Clear extended duration when regular hours are selected
        selectedExtendedDuration.value = null;
    }

    // More Stay Duration Dialog
    const moreDurationDialogVisible = ref(false);
    const selectedExtendedDuration = ref(null); // Track selection from More Duration Dialog
    
    // Calculate daily rates based on 24-hour rate
    const dailyRates = computed(() => {
        const rate24h = selectedRoom.value?.rate?.["24"] || 0;
        return {
            1: rate24h, // 1 day
            2: rate24h * 2, // 2 days
            3: rate24h * 3, // 3 days
            4: rate24h * 4, // 4 days
            5: rate24h * 5, // 5 days
            6: rate24h * 6, // 6 days
            7: rate24h * 7, // 7 days
            week: rate24h * 7, // 1 week (same as 7 days but separate for display)
            twoWeeks: rate24h * 14, // 2 weeks
            month: rate24h * 30, // 1 month
        };
    });
    
    function selectDailyRateAndHours(days, rate) {
        let actualDays;
        if (days === 'week') actualDays = 7;
        else if (days === 'twoWeeks') actualDays = 14;
        else if (days === 'month') actualDays = 30;
        else actualDays = parseInt(days);
        
        const hours = actualDays * 24; // Convert days to hours
        guestDetails.value.selectedHours = hours;
        guestDetails.value.selectedrate = rate;
        
        // Store the selected duration for highlighting
        selectedExtendedDuration.value = {
            days: days,
            label: getDayLabel(days),
            hours: hours,
            rate: rate
        };
        
        moreDurationDialogVisible.value = false; // Close dialog after selection
    }
    
    function openMoreDurationDialog() {
        moreDurationDialogVisible.value = true;
    }
    
    // Helper functions for More Duration Dialog
    function getDayLabel(days) {
        if (days === 'week') return '1 Week';
        if (days === 'twoWeeks') return '2 Weeks';
        if (days === 'month') return '1 Month';
        return `${days} Day${days > 1 ? 's' : ''}`;
    }
    
    function getDaysCount(days) {
        if (days === 'week') return 7;
        if (days === 'twoWeeks') return 14;
        if (days === 'month') return 30;
        return parseInt(days);
    }
    
    function isSelectedDays(days) {
        const actualDays = getDaysCount(days);
        const selectedHours = guestDetails.value.selectedHours;
        return selectedHours === (actualDays * 24);
    }

    const isWalkIn = computed({
  get: () => customerType.value === "Check-In",
  set: (v) => { customerType.value = v ? "Check-In" : "Book"; }
});

    const guestDetails = ref({
        guestName: "",
        cellphone: "",
        guestEmail: "",
        checkInDateTime: null,
        selectedHours: null,
        selectedrate: null,
        bookingType: computed(() => (isWalkIn.value ? "WALK-IN" : "BOOKING")),
        payment: {
            deposit: 0,
            isPaid: false,
        },
    });

    const selectedRoom = ref({
        id: 1,
        roomNumber: "",
        guestDetails: {
            guestName: null,
            cellphone: null,
            guestEmail: null,
            selectedHours: null,
            selectedrate: null,
            notes: null,
            roomCode: null,
            timestamp: null,
            checkInDateTime: null,
            checkOutDateTime: null,
            extendedHours: 0,
            bookingType: computed(() => (isWalkIn.value ? "WALK-IN" : "BOOKING")),
            payment: {
                deposit: 0,
                isPaid: false,
            },
        },
    });

// Edit Payment Note state
const editingPaymentNote = ref(false);
const editPaymentNoteText = ref('');

function startEditPaymentNote(){
  editPaymentNoteText.value = (selectedRoom.value?.guestDetails?.payment?.note || '').trim();
  editingPaymentNote.value = true;
}
function cancelEditPaymentNote(){
  editingPaymentNote.value = false;
}
async function savePaymentNote(){
  try{
    const roomId = Number(selectedRoom.value?.id);
    const bookingId = Number(selectedRoom.value?.guestDetails?.id) || null;
    await updateCheckinPaymentNote({ room_id: roomId, booking_id: bookingId, note: editPaymentNoteText.value });

    // Update local state for immediate reflection
    if (!selectedRoom.value.guestDetails.payment) selectedRoom.value.guestDetails.payment = { deposit: 0, isPaid: false };
    selectedRoom.value.guestDetails.payment.note = editPaymentNoteText.value;

    // Also mirror into rooms list
    const idx = rooms.value.findIndex(r => Number(r.id) === roomId);
    if (idx >= 0) {
      const r = rooms.value[idx];
      if (r.guestDetails) {
        if (!r.guestDetails.payment) r.guestDetails.payment = { deposit: 0, isPaid: false };
        r.guestDetails.payment.note = editPaymentNoteText.value;
      }
    }

    toast.add({ severity: 'success', summary: 'Payment Note', detail: 'Note updated.', life: 2000 });
    editingPaymentNote.value = false;
  }catch(e){
    toast.add({ severity: 'error', summary: 'Payment Note', detail: e.response?.data?.error || e.message, life: 2500 });
  }
}

    const cancelDialogVisible = ref(false); // Tracks visibility of the dialog
    const cleaningConfirmationVisible = ref(false);
    const toast = useToast();
    const confirm = useConfirm();

    // Lightweight global emitters for instant cross-view updates
    function emitRoomsChanged(reason, roomId) {
        window.dispatchEvent(new CustomEvent("rooms:changed", { detail: { reason, roomId } }));
    }
    function emitBookingsChanged(reason, bookingId, roomId) {
        window.dispatchEvent(new CustomEvent("bookings:changed", { detail: { reason, bookingId, roomId } }));
    }

    const selectedBookingId = ref(null);

    async function fetchRooms() {
        // Skip automatic refetch if we're in the middle of an extension process
        if (preventingAutoRefetch.value) {
            console.log('Skipping automatic room refetch during extension process');
            return;
        }
        
        try {
            const response = await getRooms();
            const baseRooms = response.data || [];

            // Preserve local extension data before fetching
            const localExtensionData = new Map();
            for (const room of rooms.value || []) {
                if (room.guestDetails?.extendedHours || room.guestDetails?.extend?.hours) {
                    localExtensionData.set(room.id, {
                        extendedHours: room.guestDetails.extendedHours || room.guestDetails.extend?.hours || 0,
                        extendAmount: room.guestDetails.extend?.amount || 0
                    });
                }
            }

            // Enrich with latest booking so filters can search booking codes reliably
            const withBookings = await Promise.all(
                baseRooms.map(async (room) => {
                    try {
                        if (room.status === "Booked" || room.status === "Occupied") {
                            const res = await fetchLatestBooking(room.id);
                            if (res?.data && Object.keys(res.data).length) {
                                room.guestDetails = {
                                     id: res.data.id,
                                     guestName: res.data.guest_name,
                                     cellphone: res.data.cellphone,
                                     guestEmail: res.data.guest_email,
                                     selectedHours: res.data.selected_hours,
                                     selectedrate: res.data.selected_rate,
                                     roomCode: res.data.room_code,
                                     bookCode: res.data.book_code,
                                     createdAt: res.data.created_at,
                                     checkInDateTime: res.data.check_in_datetime,
                                     checkOutDateTime: res.data.check_out_datetime,   // <-- ADD THIS
                                     bookingType: res.data.booking_type,
                                     payment: res.data.payment || null,
                                  };
                                // attach totals + items if present
                                if (res?.data) {
                                  room.guestDetails.extrasTotal = Number(res.data.extras_total || 0);
                                  room.guestDetails.amenitiesTotal = Number(res.data.amenities_total || 0);
                                  room.guestDetails.extrasItems = res.data.extras_items || [];
                                  room.guestDetails.amenitiesItems = res.data.amenities_items || [];
                                  if (!room.guestDetails.payment && res.data.payment) {
                                    room.guestDetails.payment = res.data.payment;
                                  }

                                  if (selectedRoom.value?.id === room.id) {
                                    const currentDetails = selectedRoom.value.guestDetails || {};
                                    selectedRoom.value = {
                                      ...selectedRoom.value,
                                      guestDetails: {
                                        ...currentDetails,
                                        ...room.guestDetails,
                                      },
                                    };
                                  }
                                }
                                
                                const uiStart = uiBookedAtMsByRoom.get(room.id);
if (uiStart) {
  const serverBase = parseDateMaybePH(
    room.guestDetails?.checkInDateTime || room.guestDetails?.createdAt
  );
  if (Number.isFinite(serverBase) && Math.abs(serverBase - uiStart) < 5000) {
    uiBookedAtMsByRoom.delete(room.id); // let server timing take over
  }
}

                            }
                        }
                    } catch (_) { /* ignore room-level errors */ }
                    return room;
                })
            );

            // Restore extension data from both local state and localStorage
            const persistentExtensionData = JSON.parse(localStorage.getItem('roomExtensions') || '{}');
            const now = Date.now();
            
            for (const room of withBookings) {
                const localData = localExtensionData.get(room.id);
                const persistentData = persistentExtensionData[room.id];
                
                // Use persistent data if it's recent (within 1 hour) and valid
                const isPersistentDataValid = persistentData && 
                                            (now - persistentData.timestamp) < (60 * 60 * 1000) &&
                                            persistentData.totalExtendedHours > 0;
                
                // Only apply extension data to rooms that are currently occupied or booked
                if (room.guestDetails && room.status && ['Occupied', 'Booked'].includes(room.status)) {
                    const backendHours = room.guestDetails.extend?.hours || room.guestDetails.extendedHours || 0;
                    let finalExtendedHours = backendHours;
                    let finalExtendedAmount = room.guestDetails.extend?.amount || 0;
                    
                    // Use local data if it's higher than backend data
                    if (localData && localData.extendedHours > backendHours) {
                        finalExtendedHours = localData.extendedHours;
                        finalExtendedAmount = localData.extendAmount;
                    }
                    
                    // Use persistent data if it's valid and higher than current values
                    if (isPersistentDataValid && persistentData.totalExtendedHours > finalExtendedHours) {
                        finalExtendedHours = persistentData.totalExtendedHours;
                        finalExtendedAmount = persistentData.totalExtendedAmount;
                    }
                    
                    // Apply the final extension data if it's different from backend
                    if (finalExtendedHours > backendHours) {
                        room.guestDetails.extendedHours = finalExtendedHours;
                        room.guestDetails.extend = {
                            hours: finalExtendedHours,
                            amount: finalExtendedAmount
                        };
                        
                        // Also update payment data if it exists
                        if (room.guestDetails.payment) {
                            room.guestDetails.payment.extend_hours = finalExtendedHours;
                            room.guestDetails.payment.extendHours = finalExtendedHours;
                            room.guestDetails.payment.extend_amount = finalExtendedAmount;
                            room.guestDetails.payment.extendAmount = finalExtendedAmount;
                        }
                    }
                }
            }
            
            // Clean up persistent extension data for rooms that are no longer occupied/booked or expired
            Object.keys(persistentExtensionData).forEach(roomId => {
                const data = persistentExtensionData[roomId];
                const room = withBookings.find(r => r.id === parseInt(roomId));
                
                // Remove if expired (older than 24 hours) or room is no longer occupied/booked
                if ((now - data.timestamp > (24 * 60 * 60 * 1000)) || 
                    (!room || !room.guestDetails || !['Occupied', 'Booked'].includes(room.status))) {
                    delete persistentExtensionData[roomId];
                }
            });
            localStorage.setItem('roomExtensions', JSON.stringify(persistentExtensionData));

            rooms.value = withBookings;
        } catch (err) {
            toast.add({
                severity: "error",
                summary: "Failed to load rooms",
                detail: err.message,
            });
        }
    }
    // Initialize persistent extension data
    function initializePersistentExtensions() {
        const persistentExtensionData = JSON.parse(localStorage.getItem('roomExtensions') || '{}');
        const now = Date.now();
        
        // Clean up expired data (older than 24 hours)
        Object.keys(persistentExtensionData).forEach(roomId => {
            const data = persistentExtensionData[roomId];
            if (now - data.timestamp > (24 * 60 * 60 * 1000)) {
                delete persistentExtensionData[roomId];
            }
        });
        localStorage.setItem('roomExtensions', JSON.stringify(persistentExtensionData));
    }

    onMounted(() => {
    initializePersistentExtensions();
    fetchRooms();

    // Existing listeners for data refresh
    window.addEventListener("rooms:changed", fetchRooms);
    window.addEventListener("bookings:changed", fetchRooms);

    // Also bump sort cadence when data changes
    window.addEventListener("rooms:changed", bumpSort);
    window.addEventListener("bookings:changed", bumpSort);

    // 1s label updates (real-time countdown text)
    tickTimer = setInterval(() => { nowTick.value = Date.now(); }, NOW_TICK_MS);

    // Periodic resort (prevents janky reordering every second)
    sortTimer = setInterval(() => { sortTick.value++; }, SORT_TICK_MS);
});

onUnmounted(() => {
    window.removeEventListener("rooms:changed", fetchRooms);
    window.removeEventListener("bookings:changed", fetchRooms);
    window.removeEventListener("rooms:changed", bumpSort);
    window.removeEventListener("bookings:changed", bumpSort);

    if (tickTimer) clearInterval(tickTimer);
    if (sortTimer) clearInterval(sortTimer);
});

    function openCleaningConfirmation(room) {
        selectedRoom.value = room;
        cleaningConfirmationVisible.value = true;
    }

    async function refreshRoomsAndSelectedRoom() {
        await fetchRooms();
        if (selectedRoom.value && selectedRoom.value.id) {
            // Find the fresh updated room object from the new room list
            const updated = rooms.value.find(r => r.id === selectedRoom.value.id);
            if (updated) {
                selectedRoom.value = { ...updated, roomNumber: updated.room_number, type: updated.room_type_name, floor: updated.floor_number };
            }
        }
    }

    async function confirmCleaningCompletion() {
        try {
            if (!selectedRoom.value?.id) {
                throw new Error("No room selected");
            }

            const roomIndex = rooms.value.findIndex(
                (r) => r.id === selectedRoom.value.id
            );

            if (roomIndex === -1) {
                throw new Error("Room not found in local state");
            }

            // Update local state first
            rooms.value[roomIndex].status = "Available";
            rooms.value[roomIndex].guestDetails = null;
            localStorage.setItem("rooms", JSON.stringify(rooms.value));

            // Sync to backend
            await cleaningComplete(selectedRoom.value.id);

            toast.add({
                severity: "success",
                summary: "Cleaning Confirmed",
                detail: `Room ${selectedRoom.value.roomNumber} is now available`,
                life: 3000,
            });
            lastCheckInByRoom.delete(selectedRoom.value.id);
            emitRoomsChanged("status-updated", selectedRoom.value.id);
            // Update currently open dialog data and close it for a smooth UX
            if (selectedRoom.value) {
                selectedRoom.value.status = "Available";
                if (selectedRoom.value.guestDetails) selectedRoom.value.guestDetails = null;
            }
            DialogVisible.value = false;
        } catch (error) {
            console.error("Cleaning error:", error);
            toast.add({
                severity: "error",
                summary: "Cleaning Failed",
                detail: error.message,
                life: 3000,
            });
        } finally {
            cleaningConfirmationVisible.value = false;
        }
    }

    // Add these filter-related state variables
    const selectedFilter = ref({
        searchQuery: "",
        status: {
            Available: false,
            Occupied: false,
            Cleaning: false,
            Booked: false,
        },
    });

    const clearFilters = () => {
        selectedFilter.value = {
            searchQuery: "",
            status: {
                Available: false,
                Occupied: false,
                Cleaning: false,
                Booked: false,
            },
        };
    };

    function bookingExpiresAt(room) {
  const b = room?.guestDetails;
  if (!b) return "N/A";
  const baseTs = parseDateMaybePH(b.checkInDateTime || b.createdAt);
  if (!Number.isFinite(baseTs)) return "N/A";
  const ts = baseTs + CHECKIN_WINDOW_MS;
  return new Date(ts).toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

    // Add computed properties for filtering
    const filteredRooms = computed(() => {
        return rooms.value.filter((room) => {
            // Search by room number and booking/room codes (handle multiple possible shapes)
            const valuesToSearch = [
                room?.room_number,
                room?.guestDetails?.bookCode,
                room?.guestDetails?.roomCode,
                room?.book_code,
                room?.room_code,
            ]
                .filter(Boolean)
                .map((v) => String(v).toLowerCase());

            const query = String(selectedFilter.value.searchQuery ?? "").trim().toLowerCase();
            const matchesSearch = query.length === 0 || valuesToSearch.some((v) => v.includes(query));

            const statusFilters = Object.entries(selectedFilter.value.status)
                .filter(([, checked]) => checked)
                .map(([status]) => status);

            const matchesStatus = statusFilters.length === 0 || statusFilters.includes(room.status);

            return matchesSearch && matchesStatus;
        });
    });

    // Dev helper: force a room to have X minutes remaining (local UI only)
    function devPinRemaining(roomNumber, minutes = 29) {
    const r = rooms.value.find(rr => String(rr.room_number) === String(roomNumber));
    if (!r) { console.warn('Room not found:', roomNumber); return; }

    // ensure it's Occupied so the near-30 logic applies
    r.status = 'Occupied';
    r.guestDetails ||= {};
    const now = Date.now();

    // set checkout to minutes from now
    r.guestDetails.checkOutDateTime = new Date(now + minutes * 60 * 1000).toISOString();

    // set a plausible check-in (so remaining time math works cleanly)
    const hoursBooked = r.guestDetails.selectedHours ?? 6; // any positive hours
    const totalMs = hoursBooked * 60 * 60 * 1000;
    r.guestDetails.checkInDateTime = new Date(now + minutes*60*1000 - totalMs).toISOString();

    // kick reactivity
    rooms.value = [...rooms.value];
    }

    // expose for quick console testing
    onMounted(() => {
    window.devPinRemaining = devPinRemaining;
    });

    const sortedRooms = computed(() => {
  // Only resort when sortTick changes or filtered list identity changes
  const _ = sortTick.value;
  const now = Date.now();

  const items = filteredRooms.value.map((room) => {
  const now = Date.now();
  // default: use checkout time for Occupied; Infinity otherwise
  const coTs = getCheckoutTs(room);
  let ms = coTs == null ? Infinity : coTs - now;

  let pri = 6;
  if (room.status === 'Occupied') {
    if (ms <= 0) pri = 1;
    else if (ms <= NEAR_MS) pri = 0;
    else pri = 2;
  } else if (room.status === 'Booked') {
    // NEW: use booking expiry for Booked
    const be = getBookingExpiryTs(room);
    ms = be == null ? Infinity : be - now;
    pri = 3;
  } else if (room.status === 'Cleaning') pri = 4;
  else if (room.status === 'Available') pri = 5;

  return { room, pri, ms };
});

  items.sort((a, b) => {
    if (a.pri !== b.pri) return a.pri - b.pri;
    if (a.pri <= 1) return a.ms - b.ms; // urgent buckets: soonest first

    // fallback: by room number
    const an = parseInt(a.room.room_number, 10);
    const bn = parseInt(b.room.room_number, 10);
    if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
    return String(a.room.room_number).localeCompare(String(b.room.room_number));
  });

  return items.map(i => i.room);
});

    // Payment Dialog Visibility
    const paymentDialogVisible = ref(false);

    // Payment Details
    const paymentDetails = ref({
        amountReceived: "",
        deposit: "100",
        note: "",
    });

    // Basic form validation for Booking/Walk-In
    // Cellphone and Email are OPTIONAL: if provided, must be valid; if empty, allowed.
    const isFormValid = computed(() => {
        const gd = guestDetails.value;
        const hasName = !!(gd.guestName && gd.guestName.trim().length);
        const cellOk = !gd.cellphone || isCellphoneValid.value; // ok if empty or valid
        const emailOk = !gd.guestEmail || isEmailValid.value;   // ok if empty or valid
        const hasHours = gd.selectedHours !== null && gd.selectedHours !== undefined;
        const hasRate = gd.selectedrate !== null && gd.selectedrate !== undefined;

        if (isWalkIn.value) {
            return hasName && cellOk && emailOk && hasHours && hasRate;
        }
        // Booking requires a scheduled check-in time
        return hasName && cellOk && emailOk && !!gd.checkInDateTime && hasHours && hasRate;
    });

   async function handleWalkInPayment() {
const room = rooms.value.find(r => r.id === selectedRoom.value.id);
if (!room) return;

try {
// Require a deposit amount before proceeding
if (Number(paymentDetails.value.deposit) <= 0) {
  toast.add({ severity: "warn", summary: "Deposit required", detail: "Enter a deposit amount before confirming.", life: 2500 });
  return;
}

// 0) Sell extras (if any) via POS — this decrements stock + creates bill
let posBill = null;
if (cartPD.value.length > 0) {
try {
const resBill = await posCheckout({ items: payloadItemsPD.value });
posBill = resBill?.data; // { bill_id, invoice_no, total }
} catch (err) {
toast.add({ severity: "error", summary: "POS Checkout Failed", detail: err?.response?.data?.message || "Unable to sell extras. Adjust quantities or retry.", life: 3500 });
return; // stop — don’t proceed with check-in if extras failed to sell
}
}

 // 1) Compute payment fields for the room
 const amountReceived = parseFloat(paymentDetails.value.amountReceived) || 0;
 const deposit = parseFloat(paymentDetails.value.deposit) || 0;
 const paid = !isAmountInsufficient.value;

const hours = Number(selectedRoom.value?.guestDetails?.selectedHours || 0);
const now = new Date();
const out = new Date(now.getTime() + (hours || 0) * 60 * 60 * 1000);

lastCheckInByRoom.set(room.id, { inISO: now.toISOString(), outISO: out.toISOString(), at: Date.now() });

  // Promo note (if any)
  const promo = selectedDiscount.value;
  let promoNote = "";
  if (discountType.value === "manual" && manualDiscountAmount.value > 0) {
    promoNote = ` [DISCOUNT] Manual Discount -₱${manualDiscountAmount.value.toFixed(2)}`;
  } else if (promo) {
    promoNote = ` [DISCOUNT] ${promo.name} (${roomDiscountPercent.value}%) -₱${roomDiscountAmount.value.toFixed(2)}`;
  }
  const userNote = (paymentDetails.value.note || "").trim();
  // Build rentals note from selected amenities
  const amenMap = new Map((amenitiesPD.value || []).map(a => [Number(a.serial_id), a]));
  const rentals = (selectedAmenityIds.value || []).map(id => amenMap.get(Number(id))).filter(Boolean);
  const rentalNote = rentals.length
    ? ` [RENTALS] ` + rentals.map(r => `${r.product_name || 'Amenity'} (${r.serial_number}) ₱${Number(r.unit_rental_price||0).toFixed(2)}`).join(', ')
    : "";
 
  // Build additional person note
  const additionalPersonNote = Number(additionalPersonCount.value) > 0 
    ? ` [ADDITIONAL PERSON] ${additionalPersonCount.value} person(s) @ ₱${Number(additionalPersonPrice.value).toFixed(2)} each = ₱${Number(totalAdditionalPersonCharge.value).toFixed(2)}`
    : "";
 
 const noteSuffix = (userNote ? ` [NOTE] ${userNote}` : "") + rentalNote + additionalPersonNote;

 // 2) Persist room check-in (walk-in or booked)
  if (paymentFlow.value === "WALKIN") {
  const g = selectedRoom.value.guestDetails || {};
  await bookRoom({
      room_id: room.id,
      guest_name: g.guestName,
      cellphone: g.cellphone,
      guest_email: g.guestEmail,
      booking_type: "Walk-In",
      status: "Occupied",
      check_in_datetime: toPHDateTimeString(now),
      check_out_datetime: toPHDateTimeString(out),
      selected_hours: g.selectedHours,
      selected_rate: g.selectedrate,
      room_code: generateroomCode("WI"),
      book_code: generateroomCode("WI"),
      notes: (posBill?.invoice_no ? `POS invoice: ${posBill.invoice_no}` : (g.notes || "")) + noteSuffix + promoNote,
      discount_type: discountType.value,
      discount_name: discountType.value === "manual" ? "Manual Discount" : (selectedDiscount.value?.name || ""),
      discount_percent: discountType.value === "manual" ? 0 : Number(roomDiscountPercent.value || 0),
      discount_amount: discountType.value === "manual" ? Number(manualDiscountAmount.value || 0) : 0,
      discount_id: discountType.value === "manual" ? null : (selectedDiscount.value?.id || null)
  });
} else {
  const bookingId = selectedRoom.value?.guestDetails?.id;
  if (!bookingId) throw new Error("No booking found to check in.");

  await checkInBooking(bookingId, {
      check_in_datetime: toPHDateTimeString(now),
      check_out_datetime: toPHDateTimeString(out)
  });
}

 // 3) Record payment to backend payment tables now that we have a booking id (non-blocking)
 try{
   let bookingIdForLog = null;
   if (paymentFlow.value === "WALKIN"){
     try{
       const latest = await fetchLatestBooking(room.id);
       bookingIdForLog = latest?.data?.id || null;
     }catch{}
   } else {
     bookingIdForLog = selectedRoom.value?.guestDetails?.id || null;
   }
   const finalRate = Number(discountedRoomRate.value || roomRate.value || 0);
   const cpPayload = {
     room_id: room.id,
     booking_id: bookingIdForLog,
     guest_name: selectedRoom.value?.guestDetails?.guestName || "",
     booking_type: paymentFlow.value === "WALKIN" ? "Walk-In" : "Booking",
     hours_selected: hours,
     room_rate: finalRate,
     discount_name: discountType.value === "manual" ? "Manual Discount" : (selectedDiscount.value?.name || ""),
     discount_percent: discountType.value === "manual" ? 0 : Number(roomDiscountPercent.value || 0),
     discount_amount: discountType.value === "manual" ? Number(manualDiscountAmount.value || 0) : 0,
     discount_id: discountType.value === "manual" ? null : (selectedDiscount.value?.id || null),
     extras_bill_id: posBill?.bill_id || null,
     extras_total: Number((posBill?.total ?? uiTotalExtrasPD.value) || 0),
     amenities_total: Number(uiTotalAmenitiesPD.value || 0),
     additional_person_count: Number(additionalPersonCount.value || 0),
     additional_person_total: Number(totalAdditionalPersonCharge.value || 0),
     deposit_amount: deposit,
     total_due: Number(totalAmountDue.value || 0),
     note: paymentDetails.value.note || "",
     amenities: (selectedAmenitiesPD.value || []).map(a => ({ serial_id: a.id, amenity_name: a.name, unit_rental_price: a.price }))
   };
   await createCheckinPayment(cpPayload);
 }catch(e){
   console.warn("createCheckinPayment failed", e);
   toast.add({ severity: "warn", summary: "Payment Log", detail: "Saved room, but failed to record payment history.", life: 2500 });
 }

 // 4) Update local UI mirror
selectedRoom.value.status = "Occupied";
selectedRoom.value.guestDetails.payment = { deposit, isPaid: paid, note: paymentDetails.value.note || "" };
selectedRoom.value.guestDetails.checkInDateTime = now.toISOString();
selectedRoom.value.guestDetails.checkOutDateTime = out.toISOString();

const idx = rooms.value.findIndex(r => r.id === selectedRoom.value?.id);
if (idx !== -1) {
const r = rooms.value[idx];
r.status = "Occupied";
r.guestDetails ||= {};
 r.guestDetails.payment = { deposit, isPaid: paid, note: paymentDetails.value.note || "" };
r.guestDetails.checkInDateTime = now.toISOString();
r.guestDetails.checkOutDateTime = out.toISOString();
}

 // 5) Clear mini-POS state + refresh products list (stock changed)
cartPD.value = [];
previewPD.value = { lines: [], total: 0 };
try {
const res = await fetchPOSProducts();
productsPD.value = res.data || [];
} catch {}

// Broadcast + toasts
if (paymentFlow.value === "WALKIN") {
emitBookingsChanged("walkin-booked", null, room.id);
} else {
emitBookingsChanged("checked-in", selectedRoom.value?.guestDetails?.id || null, room.id);
}
emitRoomsChanged("status-updated", room.id);

toast.add({ severity: "success", summary: "Payment Completed", detail: posBill?.invoice_no ? `Extras sold (Invoice ${posBill.invoice_no}). Room checked in.` : "Room checked in.", life: 3500 });

paymentDialogVisible.value = false;
BookingDialogVisible.value = false;
DialogVisible.value = false;

 // Assign selected amenities to this room (merge with currently assigned)
 try {
   if (Array.isArray(selectedAmenityIds.value) && selectedAmenityIds.value.length > 0) {
     const cur = await getRoomSerialNumbers(room.id);
     const currentIds = (cur?.data || []).map(s => Number(s.id || s.serial_id)).filter(n => Number.isFinite(n));
     const merged = Array.from(new Set([...currentIds, ...selectedAmenityIds.value.map(Number)]));
     await updateRoomSerialNumbers(room.id, { serial_ids: merged });
   }
 } catch (_) { /* non-fatal */ }

} catch (err) {
toast.add({ severity: "error", summary: "Check-In Failed", detail: err?.response?.data?.message || err.message, life: 3000 });
}
}

    // Modified generator function with prefix support
    function generateroomCode(prefix = "BK") {
    // Helper to safely parse numeric inputs from text/number fields

        const randomString = Math.random()
            .toString(36)
            .substring(2, 6)
            .toUpperCase();
        return `${prefix}-${randomString}`;
    }
    // Rename 'change' to 'calculateChange'
    // Business rule: Change should subtract both the rate and any deposit entered
    const calculateChange = computed(() => {
  const amountReceived = Number(paymentDetails.value.amountReceived) || 0;
  return amountReceived - totalAmountDue.value;
});

    // Total amount due = (room rate + extras + amenities + deposit) with discount applied, then add extend + additional person
const totalAmountDue = computed(() => {
  const deposit = Number(paymentDetails.value.deposit) || 0;
  const extras = Number(uiTotalExtrasPD.value) || 0;
  const amenRent = Number(uiTotalAmenitiesPD.value) || 0;
  const additionalPersonCharges = Number(totalAdditionalPersonCharge.value) || 0;
  
  // Base amount to apply discount to: room rate + extras + amenities + deposit
  const baseAmount = roomRate.value + deposit + extras + amenRent;
  
  // Apply discount to the base amount
  const discountAmount = Number(roomDiscountAmount.value) || 0;
  const discountedBaseAmount = Math.max(0, baseAmount - discountAmount);
  
  // Add non-discountable charges: extend amount + additional person charges
  return discountedBaseAmount + extendAmountPD.value + additionalPersonCharges;
});

    // Validation for Insufficient Amount compares against (rate + deposit)
const isAmountInsufficient = computed(() => {
  const amountReceived = Number(paymentDetails.value.amountReceived) || 0;
  return amountReceived < totalAmountDue.value;
});

// Visual highlight for Payment card
const paymentHighlightClass = computed(() => {
  const amt = Number(paymentDetails.value.amountReceived || 0);
  if (!amt) {
    return 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-700';
  }
  return isAmountInsufficient.value
    ? 'bg-red-50 text-red-900 border-red-200 dark:bg-red-900/30 dark:text-red-100 dark:border-red-700'
    : 'bg-green-50 text-green-900 border-green-200 dark:bg-green-900/30 dark:text-green-100 dark:border-green-700';
});

// ---- Occupied room payment view (read-only) ----
const occupiedPayment = computed(() => {
  const pay = selectedRoom.value?.guestDetails?.payment;
  if (!pay) {
    return {
      deposit: 0,
      deposit_amount: 0,
      totalDue: 0,
      total_due: 0,
      extend_amount: 0,
      discountName: '',
      discountPercent: 0,
      discountAmount: 0,
      discount_name: '',
      discount_percent: 0,
      discount_amount: 0,
    };
  }
  return pay;
});
const occRoomRate = computed(() => {
  const payRate = Number(occupiedPayment.value.roomRate ?? occupiedPayment.value.room_rate ?? NaN);
  if (Number.isFinite(payRate) && payRate > 0) return payRate;
  const g = selectedRoom.value?.guestDetails || {};
  const charged = Number(g.roomRateCharged || g.room_rate_charged || 0);
  if (charged) return charged;
  return Number(g.selectedrate) || 0;
});
const occDiscountName = computed(() => {
  const payName = occupiedPayment.value.discountName ?? occupiedPayment.value.discount_name;
  if (payName) return payName;
  const g = selectedRoom.value?.guestDetails || {};
  return g.discountName ?? g.discount_name ?? '';
});
const occDiscountPercent = computed(() => {
  const payPct = Number(occupiedPayment.value.discountPercent ?? occupiedPayment.value.discount_percent ?? NaN);
  if (Number.isFinite(payPct)) return payPct;
  const g = selectedRoom.value?.guestDetails || {};
  const raw = Number(g.discountPercent ?? g.discount_percent ?? NaN);
  return Number.isFinite(raw) ? raw : 0;
});

const occDiscountAmount = computed(() => {
  const payAmt = Number(occupiedPayment.value.discountAmount ?? occupiedPayment.value.discount_amount ?? NaN);
  if (Number.isFinite(payAmt)) return payAmt;
  const g = selectedRoom.value?.guestDetails || {};
  const raw = Number(g.discountAmount ?? g.discount_amount ?? NaN);
  return Number.isFinite(raw) ? raw : 0;
});
const occBaseRoomRate = computed(() => {
  const g = selectedRoom.value?.guestDetails || {};
  const base = Number(g.selectedrate) || Number(g.room_rate) || 0;
  if (base) return base;
  return occRoomRate.value;
});
const occExtras = computed(() => {
  const g = selectedRoom.value?.guestDetails || {};
  const payVal = Number(g.payment?.extras_total ?? g.payment?.extrasTotal ?? NaN);
  if (Number.isFinite(payVal)) return payVal;
  return Number(g.extrasTotal ?? g.extras_total ?? 0);
});
const occRent = computed(() => {
  const g = selectedRoom.value?.guestDetails || {};
  const payVal = Number(g.payment?.amenities_total ?? g.payment?.amenitiesTotal ?? NaN);
  if (Number.isFinite(payVal)) return payVal;
  return Number(g.amenitiesTotal ?? g.amenities_total ?? 0);
});
const occExtend = computed(() => {
  const payVal = Number(occupiedPayment.value.extend_amount ?? occupiedPayment.value.extendAmount ?? NaN);
  if (Number.isFinite(payVal)) return payVal;
  const g = selectedRoom.value?.guestDetails || {};
  return Number(g.extend?.amount ?? g.extend_amount ?? 0);
});
const occDamageCharges = computed(() => {
  const payVal = Number(occupiedPayment.value.damage_charges ?? occupiedPayment.value.damageCharges ?? NaN);
  if (Number.isFinite(payVal)) return payVal;
  const g = selectedRoom.value?.guestDetails || {};
  return Number(g.payment?.damage_charges ?? g.payment?.damageCharges ?? 0);
});
const occExtendHours = computed(() => {
  const payHrs = Number(occupiedPayment.value.extend_hours ?? occupiedPayment.value.extendHours ?? NaN);
  if (Number.isFinite(payHrs)) return payHrs;
  const g = selectedRoom.value?.guestDetails || {};
  const fromBooking = Number(g.extend?.hours ?? g.extend_hours ?? g.extendedHours ?? 0);
  return Number.isFinite(fromBooking) ? fromBooking : 0;
});
const occDeposit = computed(() => {
  const pay = occupiedPayment.value;
  const val = Number(pay.deposit ?? pay.deposit_amount ?? NaN);
  if (Number.isFinite(val)) return val;
  const g = selectedRoom.value?.guestDetails || {};
  return Number(g.payment?.deposit ?? g.payment?.deposit_amount ?? 0);
});
const occTotalDue = computed(() => {
  const base = occRoomRate.value + occExtras.value + occRent.value + occExtend.value + occAdditionalPersonTotal.value;
  const liveDamage = checkoutDamageChargesNumber.value;
  if (Number.isFinite(liveDamage) && liveDamage > 0) {
    return roundCurrency(base + liveDamage);
  }
  const storedTotal = Number(occupiedPayment.value.totalDue ?? occupiedPayment.value.total_due ?? NaN);
  if (Number.isFinite(storedTotal) && storedTotal > 0) return storedTotal;
  return roundCurrency(base + occDamageCharges.value);
});
const occChange = computed(() => {
  // Calculate change using localStorage amount since we removed it from database
  const roomId = selectedRoom.value?.id;
  if (!roomId) return 0;
  const storageKey = `amountReceived_room_${roomId}`;
  const amt = Number(localStorage.getItem(storageKey) || 0);
  return amt - occTotalDue.value;
});

// Additional person computed properties for occupied rooms
const occAdditionalPersonCount = computed(() => {
  const payVal = Number(occupiedPayment.value.additional_person_count ?? occupiedPayment.value.additionalPersonCount ?? NaN);
  if (Number.isFinite(payVal)) return payVal;
  const g = selectedRoom.value?.guestDetails || {};
  return Number(g.payment?.additional_person_count ?? g.payment?.additionalPersonCount ?? 0);
});

const occAdditionalPersonTotal = computed(() => {
  const payVal = Number(occupiedPayment.value.additional_person_total ?? occupiedPayment.value.additionalPersonTotal ?? NaN);
  if (Number.isFinite(payVal)) return payVal;
  const g = selectedRoom.value?.guestDetails || {};
  return Number(g.payment?.additional_person_total ?? g.payment?.additionalPersonTotal ?? 0);
});

function roomExtendedHours(room){
  const g = room?.guestDetails || {};
  // Prioritize total extended hours over individual payment hours
  const totalExtendedHours = Number(g.extendedHours ?? g.extend?.hours ?? 0);
  if (Number.isFinite(totalExtendedHours) && totalExtendedHours > 0) return totalExtendedHours;
  
  // Fallback to payment hours if no total is available
  const payHours = Number(g.payment?.extend_hours ?? g.payment?.extendHours ?? 0);
  return Number.isFinite(payHours) && payHours > 0 ? payHours : 0;
}

function roomExtendedLabel(room){
  const hrs = Math.floor(roomExtendedHours(room));
  if (!hrs) return '';
  
  // Always display as hours instead of days
  return `${hrs}h`;
}

const occupiedAmountDraft = ref(0);
const updatingOccupiedAmount = ref(false);

watch(
  () => selectedRoom.value?.id,
  () => {
    const roomId = selectedRoom.value?.id;
    if (!roomId) {
      occupiedAmountDraft.value = 0;
      return;
    }
    // Load amount received from localStorage since we removed it from database
    const storageKey = `amountReceived_room_${roomId}`;
    const storedAmount = Number(localStorage.getItem(storageKey) || 0);
    occupiedAmountDraft.value = Number.isFinite(storedAmount) ? storedAmount : 0;
  },
  { immediate: true }
);

const occChangeDraft = computed(() => {
  const amt = Number(occupiedAmountDraft.value || 0);
  return amt - occTotalDue.value;
});

const occIsDraftInsufficient = computed(() => occChangeDraft.value < 0);

const occHasPendingAmountChange = computed(() => {
  // Use localStorage to get the stored amount since we removed it from database
  const roomId = selectedRoom.value?.id;
  if (!roomId) return false;
  const storageKey = `amountReceived_room_${roomId}`;
  const stored = Number(localStorage.getItem(storageKey) || 0);
  const draft = Number(occupiedAmountDraft.value || 0);
  return Math.abs(stored - draft) > 0.009;
});

const occChangeDisplay = computed(() => (
  occHasPendingAmountChange.value ? occChangeDraft.value : occChange.value
));

async function saveOccupiedAmountReceived(){
  if (!selectedRoom.value) return;
  const roomId = Number(selectedRoom.value.id);
  if (!roomId) return;

  const bookingId = Number(selectedRoom.value?.guestDetails?.id) || null;
  const amountValRaw = Number(occupiedAmountDraft.value || 0);
  const amountVal = Number.isFinite(amountValRaw) ? amountValRaw : 0;
  const totalDueVal = Number(occTotalDue.value || 0);
  const changeVal = Number((amountVal - totalDueVal).toFixed(2));

  updatingOccupiedAmount.value = true;
  try {
    // Store amount received in localStorage instead of database
    const storageKey = `amountReceived_room_${roomId}`;
    localStorage.setItem(storageKey, amountVal.toString());

    // Update only the total_due in the database (without amount_received and change_amount)
    await updateCheckinPaymentAmount({
      room_id: roomId,
      booking_id: bookingId,
      total_due: totalDueVal,
    });

    if (selectedRoom.value?.guestDetails) {
      const payment = selectedRoom.value.guestDetails.payment || (selectedRoom.value.guestDetails.payment = { deposit: 0, isPaid: false, note: '' });
      payment.totalDue = totalDueVal;
      payment.total_due = totalDueVal;
      payment.isPaid = amountVal >= totalDueVal - 0.009;
    }

    const idx = rooms.value.findIndex(r => Number(r.id) === roomId);
    if (idx >= 0) {
      const targetRoom = rooms.value[idx];
      if (!targetRoom.guestDetails) targetRoom.guestDetails = {};
      const payment = targetRoom.guestDetails.payment || (targetRoom.guestDetails.payment = { deposit: 0, isPaid: false, note: '' });
      payment.totalDue = totalDueVal;
      payment.total_due = totalDueVal;
      payment.isPaid = amountVal >= totalDueVal - 0.009;
      rooms.value = rooms.value.slice();
    }

    occupiedAmountDraft.value = Number(amountVal.toFixed(2));

    toast.add({ severity: 'success', summary: 'Payment', detail: 'Amount received updated.', life: 2000 });
    emitRoomsChanged('payment-updated', roomId);
  } catch (e) {
    const detail = e?.response?.data?.error || e?.message || 'Failed to update amount.';
    toast.add({ severity: 'error', summary: 'Payment', detail, life: 3000 });
  } finally {
    updatingOccupiedAmount.value = false;
  }
}

function occRemoveAmenity(id){
  const nid = Number(id);
  occSelectedAmenityIds.value = (occSelectedAmenityIds.value || []).filter(v => Number(v) !== nid);
}

async function openOccupiedExtrasDialog(){
  if (!selectedRoom.value?.id) return;

  occCart.value = [];
  occPreview.value = { lines: [], total: 0 };
  occProductSearch.value = '';
  occSelectedAmenityIds.value = [];
  occAmenitiesSearch.value = '';
  occLastPayloadKey = '';
  occAmountReceived.value = null;

  if (!productsPD.value.length){
    try {
      const res = await fetchPOSProducts();
      productsPD.value = res.data || [];
      loadedProductsOncePD = true;
    } catch (e) {
      toast.add({ severity: 'error', summary: 'POS Products', detail: 'Failed to load products.', life: 2500 });
    }
  }

  try {
    const resA = await getAvailableAmenities();
    occAmenitiesList.value = (resA?.data || [])
      .filter(a => {
        const category = (a.category || '').toLowerCase().trim();
        const type = (a.type || '').toLowerCase().trim();
        // Only allow Foam and Bath & Bed Linens
        return category === 'foam' || type === 'foam' || 
               category === 'bath & bed linens' || type === 'bath & bed linens' ||
               category === 'bathbedlinens' || type === 'bathbedlinens';
      })
      .map(a => ({
        serial_id: Number(a.serial_id ?? a.id ?? a.serialId),
        serial_number: a.serial_number,
        product_name: a.product_name,
        brand: a.brand,
        category: a.category,
        type: a.type,
        unit_rental_price: Number(a.unit_rental_price || 0)
      }));
  } catch (e) {
    occAmenitiesList.value = [];
  }

  occExtrasDialogVisible.value = true;
}

async function confirmOccupiedExtras(){
  if (!selectedRoom.value?.id) return;

  const roomId = Number(selectedRoom.value.id);
  const bookingId = Number(selectedRoom.value?.guestDetails?.id) || null;

  const items = occPayloadItems.value;
  const amenitiesSelected = occSelectedAmenities.value;

  if (!items.length && !amenitiesSelected.length){
    toast.add({ severity: 'warn', summary: 'Add Extras', detail: 'Select consumables or amenities to add.', life: 2500 });
    return;
  }

  let posBill = null;
  let extrasTotalDelta = 0;

  if (items.length){
    try {
      const resBill = await posCheckout({ items });
      posBill = resBill?.data || null;
      extrasTotalDelta = Number(posBill?.total ?? (occCartTotal.value || 0));
    } catch (err) {
      toast.add({ severity: 'error', summary: 'POS Checkout Failed', detail: err?.response?.data?.message || 'Unable to sell extras. Adjust quantities or retry.', life: 3500 });
      return;
    }
  }

  const amenitiesTotalDelta = Number(occAmenitiesTotal.value || 0);

  try {
    const res = await updateCheckinPaymentExtras({
      room_id: roomId,
      booking_id: bookingId,
      extras_bill_id: posBill?.bill_id || null,
      extras_total: Number(posBill?.total ?? (occCartTotal.value || 0)),
      amenities_total: amenitiesTotalDelta,
      amenities: amenitiesSelected,
    });

    const totals = res?.data?.totals || {};
    const paymentSnap = res?.data?.payment || null;

    const extrasItemsToAppend = occCartView.value.map(row => ({
      name: row.name,
      brand: row.brand,
      quantity: row.quantity,
      price: row.unitPrice,
    }));

    const amenitiesItemsToAppend = amenitiesSelected.map(a => ({
      amenity_name: a.amenity_name,
      serial_number: a.serial_number,
      unit_rental_price: Number(a.unit_rental_price || 0),
    }));

    const guestDetails = selectedRoom.value.guestDetails || (selectedRoom.value.guestDetails = {});

    if (typeof totals.extras_total === 'number') guestDetails.extrasTotal = totals.extras_total;
    else guestDetails.extrasTotal = Number(guestDetails.extrasTotal || 0) + extrasTotalDelta;

    if (typeof totals.amenities_total === 'number') guestDetails.amenitiesTotal = totals.amenities_total;
    else guestDetails.amenitiesTotal = Number(guestDetails.amenitiesTotal || 0) + amenitiesTotalDelta;

    if (!guestDetails.extrasItems) guestDetails.extrasItems = [];
    if (extrasItemsToAppend.length) guestDetails.extrasItems = guestDetails.extrasItems.concat(extrasItemsToAppend);

    if (!guestDetails.amenitiesItems) guestDetails.amenitiesItems = [];
    if (amenitiesItemsToAppend.length) guestDetails.amenitiesItems = guestDetails.amenitiesItems.concat(amenitiesItemsToAppend);

    guestDetails.payment = guestDetails.payment || { deposit: 0, isPaid: false, note: '' };
    if (paymentSnap) {
      guestDetails.payment = { ...guestDetails.payment, ...paymentSnap };
    }

    const roomIdx = rooms.value.findIndex(r => Number(r.id) === roomId);
    if (roomIdx >= 0) {
      rooms.value[roomIdx] = {
        ...rooms.value[roomIdx],
        guestDetails: { ...guestDetails },
      };
      rooms.value = rooms.value.slice();
    }

    if (amenitiesSelected.length){
      try {
        const current = await getRoomSerialNumbers(roomId);
        const currentIds = (current?.data || []).map(s => Number(s.id || s.serial_id)).filter(n => Number.isFinite(n));
        const merged = Array.from(new Set([...currentIds, ...amenitiesSelected.map(a => Number(a.id || a.serial_id))]));
        await updateRoomSerialNumbers(roomId, { serial_ids: merged });
      } catch (_) {
        // non-fatal
      }
    }

    toast.add({ severity: 'success', summary: 'Extras Added', detail: 'Consumables and amenities updated.', life: 2500 });
    emitRoomsChanged('extras-updated', roomId);
    emitBookingsChanged('extras-updated', bookingId, roomId);

    occCart.value = [];
    occPreview.value = { lines: [], total: 0 };
    occSelectedAmenityIds.value = [];
    occAmountReceived.value = null;
    occExtrasDialogVisible.value = false;
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Extras Failed', detail: err?.response?.data?.error || err.message, life: 3000 });
  }
}

// Visual highlight for Discount card
const discountHighlightClass = computed(() => {
  const hasDiscount = (discountType.value === "manual" && manualDiscountAmount.value > 0) || !!selectedDiscount.value;
  return hasDiscount
    ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20'
    : 'border-slate-200';
});
    
    // Additional Person functionality
const additionalPersonCount = ref(0);
const additionalPersonPrice = ref(250);

const totalAdditionalPersonCharge = computed(() => {
    return Number(additionalPersonCount.value || 0) * Number(additionalPersonPrice.value || 0);
});

// Reset Payment Form
function resetPaymentForm() {
    paymentDetails.value = {
        amountReceived: "",
        deposit: "100",
        note: "",
    };
    selectedAmenityIds.value = [];
    additionalPersonCount.value = 0;
    additionalPersonPrice.value = 250;
}

// Confirmation dialog before finalizing payment/check-in
const confirmPaymentDialogVisible = ref(false);

function openConfirmPayment() {
  // Optional: could validate again here
  confirmPaymentDialogVisible.value = true;
}

function confirmAndCheckIn(){
  confirmPaymentDialogVisible.value = false;
  handleWalkInPayment();
}

const confirmSummaryText = computed(() => {
  const g = selectedRoom.value?.guestDetails || {};
  const guestName = g.guestName || 'N/A';
  const roomNo = selectedRoom.value?.roomNumber || '—';
  const hours = Number(g.selectedHours || 0);

  const hasDiscount = (discountType.value === "manual" && manualDiscountAmount.value > 0) || !!selectedDiscount.value;
  let ratePart;
  let discountText;
  
  if (discountType.value === "manual" && manualDiscountAmount.value > 0) {
    ratePart = `${formatCurrency(roomRate.value)} (Manual Discount -₱${manualDiscountAmount.value} -> ${formatCurrency(discountedRoomRate.value)})`;
    discountText = `Manual Discount (₱${manualDiscountAmount.value})`;
  } else if (selectedDiscount.value) {
    ratePart = `${formatCurrency(roomRate.value)} (Promo ${selectedDiscount.value?.name} ${Number(roomDiscountPercent.value)}% -> ${formatCurrency(discountedRoomRate.value)})`;
    discountText = `${selectedDiscount.value?.name} (${Number(roomDiscountPercent.value)}%)`;
  } else {
    ratePart = `${formatCurrency(roomRate.value)}`;
    discountText = 'None';
  }

  // Extras summary
  const extrasRows = cartViewPD.value || [];
  const extrasList = extrasRows.map(r => `${r.name} x${r.quantity} @ ${formatCurrency(r.unitPrice)}`).join('; ');
  const extrasTotal = formatCurrency(uiTotalExtrasPD.value || 0);

  // Amenities summary
  const amenRows = selectedAmenitiesPD.value || [];
  const amenList = amenRows.map(a => `${a.name} #${a.serial} ${formatCurrency(a.price)}`).join('; ');
  const amenTotal = formatCurrency(uiTotalAmenitiesPD.value || 0);

  // Additional person summary
  const additionalPersonSummary = Number(additionalPersonCount.value) > 0 
    ? `${additionalPersonCount.value} additional person(s) @ ${formatCurrency(additionalPersonPrice.value)} each`
    : 'None';
  const additionalPersonTotal = formatCurrency(totalAdditionalPersonCharge.value || 0);

  const amtRecv = Number(paymentDetails.value.amountReceived) || 0;
  const deposit = Number(paymentDetails.value.deposit) || 0;
  const totalDue = Number(totalAmountDue.value) || 0;
  const change = Number(calculateChange.value) || 0;
  const note = (paymentDetails.value.note || '').trim() || '—';

  return `Guest ${guestName} in Room ${roomNo} for ${hours} hour(s); rate ${ratePart}. ` +
         `Extras ${extrasTotal}: ${extrasList || 'None'}. ` +
         `Amenities ${amenTotal}: ${amenList || 'None'}. ` +
         `Additional Person ${additionalPersonTotal}: ${additionalPersonSummary}. ` +
         `Payment: received ${formatCurrency(amtRecv)}, deposit ${formatCurrency(deposit)}, total due ${formatCurrency(totalDue)}, change ${formatCurrency(change)}. ` +
         `Discount: ${discountText}. Note: ${note}.`;
});

// Compact, readable lists for confirmation dialog
const extrasListTop = computed(() => {
  const rows = cartViewPD.value || [];
  return rows.slice(0, 5).map(r => `${r.name} ×${r.quantity} (${formatCurrency(r.unitPrice)})`);
});
const extrasOverflow = computed(() => {
  const total = (cartViewPD.value || []).length;
  return total > 5 ? total - 5 : 0;
});
const amenitiesListTop = computed(() => {
  const rows = selectedAmenitiesPD.value || [];
  return rows.slice(0, 5).map(a => `${a.name} #${a.serial} (${formatCurrency(a.price)})`);
});
const amenitiesOverflow = computed(() => {
  const total = (selectedAmenitiesPD.value || []).length;
  return total > 5 ? total - 5 : 0;
});
const discountBadgeText = computed(() => {
  if (discountType.value === "manual" && manualDiscountAmount.value > 0) {
    return `Manual Discount (₱${manualDiscountAmount.value})`;
  }
  return selectedDiscount.value ? `${selectedDiscount.value.name} (${Number(roomDiscountPercent.value)}%)` : null;
});

    // Open Payment Dialog
async function openPaymentDialog(room) {
paymentDetails.value = { amountReceived: "", deposit: "100", note: "" };
selectedAmenityIds.value = [];
selectedDiscountId.value = null; // reset promo selection each time
discountType.value = "manual"; // reset to manual discount
manualDiscountAmount.value = 0; // reset manual discount amount
additionalPersonCount.value = 0; // reset additional person count
additionalPersonPrice.value = 250; // reset additional person price to default

// Use the same reference (or a shallow copy once), don't call openDialog here
selectedRoom.value = { ...room, guestDetails: room.guestDetails ? { ...room.guestDetails } : null };

if (room?.status === "Booked") {
paymentFlow.value = "BOOKED";
if (!selectedRoom.value.guestDetails?.id) {
try {
const res = await fetchLatestBooking(room.id);
if (res?.data && Object.keys(res.data).length) {
selectedRoom.value.guestDetails = {
id: res.data.id,
guestName: res.data.guest_name,
cellphone: res.data.cellphone,
guestEmail: res.data.guest_email,
selectedHours: res.data.selected_hours,
selectedrate: res.data.selected_rate,
notes: res.data.notes,
roomCode: res.data.room_code,
bookCode: res.data.book_code,
createdAt: res.data.created_at,
checkInDateTime: res.data.check_in_datetime,
checkOutDateTime: res.data.check_out_datetime,
bookingType: res.data.booking_type,
payment: res.data.payment || null,
};
}
} catch (e) {
toast.add({ severity: "error", summary: "Failed to fetch booking", detail: e.message, life: 2500 });
return;
}
}
} else {
paymentFlow.value = "WALKIN";
const g = guestDetails.value || {};
  selectedRoom.value.guestDetails = {
  guestName: g.guestName ?? "",
  cellphone: g.cellphone ?? "",
  guestEmail: g.guestEmail ?? "",
  selectedHours: g.selectedHours ?? null,
  selectedrate: g.selectedrate ?? null,
  bookingType: "WALK-IN",
  payment: { deposit: 0, isPaid: false },
  };
}

// finally show dialog
paymentDialogVisible.value = true;

if (!loadedProductsOncePD) {
try {
const res = await fetchPOSProducts();
productsPD.value = res.data || [];
loadedProductsOncePD = true;
} catch (e) {
toast.add({ severity: "error", summary: "POS Products", detail: "Failed to load products.", life: 2500 });
}
}

// reset cart + preview every time you open payment
cartPD.value = [];
previewPD.value = { lines: [], total: 0 };
productSearchQueryPD.value = "";

// load active discounts last
await loadDiscounts();

 // Load available amenities with unit rental price (in-stock only) - Foam and Bath & Bed Linens only
 try {
   const resA = await getAvailableAmenities();
   amenitiesPD.value = (resA?.data || [])
     .filter(a => {
       const category = (a.category || '').toLowerCase().trim();
       const type = (a.type || '').toLowerCase().trim();
       // Only allow Foam and Bath & Bed Linens
       return category === 'foam' || type === 'foam' || 
              category === 'bath & bed linens' || type === 'bath & bed linens' ||
              category === 'bathbedlinens' || type === 'bathbedlinens';
     })
     .map(a => ({
       serial_id: Number(a.serial_id ?? a.id ?? a.serialId),
       serial_number: a.serial_number,
       product_name: a.product_name,
       brand: a.brand,
       category: a.category,
       type: a.type,
       unit_rental_price: Number(a.unit_rental_price || 0)
     }));
 } catch (e) {
   amenitiesPD.value = [];
 }
}

    const checkInDialogVisible = ref(false); // Controls the visibility of the dialog

    // Derived data: Check-In and Check-Out dates

    const checkInDate = computed(() => new Date()); // Check-in is always the current date/time
    const checkOutDate = computed(() => {
  const base = guestDetails.value?.checkInDateTime
    ? new Date(guestDetails.value.checkInDateTime)
    : null;
  const hrs = Number(guestDetails.value?.selectedHours || 0);
  return base && hrs ? new Date(base.getTime() + hrs * 60 * 60 * 1000) : null;
});

    const minDate = ref(new Date(new Date().setHours(0, 0, 0, 0)));
    // Function to format currency
    function formatCurrency(value) {
        if (!value) return "0.00";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "PHP",
        }).format(value);
    }

    function roundCurrency(value) {
        const num = Number(value);
        if (!Number.isFinite(num)) return 0;
        return Math.round(num * 100) / 100;
    }

    function openCheckoutDialog(room) {
        const roomId = room?.id;
        const isSameRoom = roomId && lastPaymentConfirmedRoomId.value === roomId;
        
        selectedRoom.value = {
            ...room,
            guestDetails: { ...room.guestDetails }, // Copy nested object
            selectedrate: room.rate || 0,
        };
        const pay = selectedRoom.value?.guestDetails?.payment || {};
        const existingDamage = Number(pay.damage_charges ?? pay.damageCharges ?? 0);
        checkoutDamageCharges.value = roundCurrency(Math.max(0, existingDamage));
        const existingDeposit = Number(pay.deposit ?? pay.deposit_amount ?? 0);
        checkoutDepositOriginal.value = roundCurrency(Math.max(0, existingDeposit));
        
        // Only reset payment confirmation if opening a different room
        if (!isSameRoom) {
            checkoutAdditionalPaymentReceived.value = 0;
            isPaymentConfirmed.value = false;
            lastPaymentConfirmedRoomId.value = null;
        }
        
        checkoutAssignedAmenities.value = [];
        checkoutAmenitiesError.value = null;
        checkoutDialogVisible.value = true;
        if (room?.id) {
            loadCheckoutAssignedAmenities(room.id);
        }
    }

    // Function to select rate and hours

    const isCellphoneValid = ref(true); // Initially assume valid

    function validatePhilippineCellphone(event) {
        const input = event.target.value || "";
        const cleanedInput = input.replace(/\D/g, "");

        // Allow empty as valid (optional field)
        if (cleanedInput.length === 0) {
            guestDetails.value.cellphone = "";
            isCellphoneValid.value = true;
            return;
        }

        // Accept formats starting with 09 and exactly 11 digits (you can expand as needed)
        const isValid = cleanedInput.startsWith("09") && cleanedInput.length === 11;

        if (isValid) {
            guestDetails.value.cellphone = cleanedInput;
            isCellphoneValid.value = true;
        } else {
            // Keep the user input for correction; just flag invalid
            guestDetails.value.cellphone = input;
            isCellphoneValid.value = false;
        }
    }

    // Validation state
    const isEmailValid = ref(true);

    // Gmail validation function
    function validateGmail(email) {
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        return gmailRegex.test(email);
    }

    // Email validation method
    function validateEmail(event) {
        const email = (event.target.value || "").trim();

        // Allow empty as valid (optional field)
        if (!email) {
            isEmailValid.value = true;
            return;
        }

        // Otherwise must be a valid Gmail address (current rule)
        isEmailValid.value = validateGmail(email);
    }

    // Reactive state for checkout dialog
    const checkoutDialogVisible = ref(false);
    const checkoutDamageCharges = ref(0);
    const checkoutDamageChargesNumber = computed(() => roundCurrency(Math.max(0, Number(checkoutDamageCharges.value || 0))));
    const checkoutDepositOriginal = ref(0);
    const checkoutPayment = computed(() => selectedRoom.value?.guestDetails?.payment || {});
    const checkoutDepositOriginalNumber = computed(() => roundCurrency(Math.max(0, Number(checkoutDepositOriginal.value || 0))));
    const checkoutRefundToGuest = computed(() => roundCurrency(Math.max(0, checkoutDepositOriginalNumber.value - checkoutDamageChargesNumber.value)));
    const checkoutDamageShortfall = computed(() => roundCurrency(Math.max(0, checkoutDamageChargesNumber.value - checkoutDepositOriginalNumber.value)));
    
    // Additional payment fields
    const checkoutAdditionalPaymentReceived = ref(0);
    const checkoutAdditionalPaymentChange = computed(() => {
        const received = Number(checkoutAdditionalPaymentReceived.value || 0);
        const due = checkoutDamageShortfall.value;
        return roundCurrency(Math.max(0, received - due));
    });
    const isCheckoutPaymentComplete = computed(() => {
        // Allow checkout if there's no shortfall OR if payment received covers the shortfall
        if (checkoutDamageShortfall.value <= 0) return true;
        return Number(checkoutAdditionalPaymentReceived.value || 0) >= checkoutDamageShortfall.value;
    });
    const showAdditionalPaymentDialog = ref(false);
    const isPaymentConfirmed = ref(false);
    const lastPaymentConfirmedRoomId = ref(null); // Track which room has confirmed payment
    
    // This computed checks if checkout can proceed - no shortfall OR payment confirmed
    const canProceedWithCheckout = computed(() => {
        // If there's no shortfall, can proceed immediately
        if (checkoutDamageShortfall.value <= 0) return true;
        // If there IS a shortfall, payment must be confirmed
        return isPaymentConfirmed.value;
    });

    const checkoutAssignedAmenities = ref([]);
    const checkoutAmenitiesLoading = ref(false);
    const checkoutAmenitiesError = ref(null);
    const checkoutFoamSerialIds = ref([]);

    const watcherStopCheckout = watch(checkoutDialogVisible, (visible) => {
        if (!visible) {
            checkoutAssignedAmenities.value = [];
            checkoutAmenitiesError.value = null;
            checkoutAmenitiesLoading.value = false;
            // Don't reset payment confirmation state - keep it if user reopens
            // checkoutAdditionalPaymentReceived.value = 0;
            // isPaymentConfirmed.value = false;
            showAdditionalPaymentDialog.value = false;
        }
    });

    watch(checkoutDamageCharges, (val) => {
        const normalized = checkoutDamageChargesNumber.value;
        const roomRef = selectedRoom.value;
        if (!roomRef) return;
        const guest = roomRef.guestDetails || (roomRef.guestDetails = {});
        const payment = guest.payment || (guest.payment = { deposit: 0, isPaid: false });
        payment.damage_charges = normalized;
        payment.damageCharges = normalized;
        const idx = rooms.value.findIndex(r => Number(r.id) === Number(roomRef.id));
        if (idx >= 0) {
            const target = rooms.value[idx];
            target.guestDetails = target.guestDetails || {};
            const targetPayment = target.guestDetails.payment || (target.guestDetails.payment = { deposit: 0, isPaid: false });
            targetPayment.damage_charges = normalized;
            targetPayment.damageCharges = normalized;
        }
    });

    const checkoutDamagedSerialIds = computed(() => (
        (checkoutAssignedAmenities.value || [])
            .filter(item => item && item.damaged)
            .map(item => Number(item.serial_id ?? item.id))
            .filter(id => Number.isFinite(id))
    ));

    // Function to toggle damage marking of an amenity during checkout
    function toggleCheckoutAmenityDamage(amenity) {
        // This function is called when the damage checkbox is toggled
        // The amenity.damaged property is automatically updated by v-model
        // Note: This only marks the item for damage reporting - it does NOT change
        // the serial_numbers status. The status will remain unchanged (assigned, cleaning, etc.)
        // Only a damage report will be created during checkout
    }

    function confirmAdditionalPayment() {
        if (isCheckoutPaymentComplete.value) {
            isPaymentConfirmed.value = true;
            lastPaymentConfirmedRoomId.value = selectedRoom.value?.id || null;
            showAdditionalPaymentDialog.value = false;
        }
    }

    async function loadCheckoutAssignedAmenities(roomId) {
        if (!roomId) {
            checkoutAssignedAmenities.value = [];
            return;
        }
        const currentRoomId = Number(roomId);
        checkoutAmenitiesLoading.value = true;
        checkoutAmenitiesError.value = null;
        checkoutAssignedAmenities.value = [];
        try {
            const res = await getRoomSerialNumbers(roomId);
            const rows = Array.isArray(res?.data) ? res.data : [];
            if (selectedRoom.value?.id && Number(selectedRoom.value.id) !== currentRoomId) {
                return;
            }
            const normalizeLabel = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
            // Reset foam IDs
            checkoutFoamSerialIds.value = [];
            
            const processed = rows.map((item, idx) => {
                const serialId = Number(item?.serial_id ?? item?.id ?? item?.serialId);
                const statusRaw = String(item?.status ?? '').toLowerCase();
                const isDamaged = statusRaw === 'damaged';
                const productType = (item?.product_type ?? item?.type ?? '').toString().trim();
                const productCategory = (item?.product_category ?? item?.category ?? '').toString().trim();
                const linenKey = 'bathbedlinens';
                const cleanEligible = normalizeLabel(productType) === linenKey || normalizeLabel(productCategory) === linenKey;
                const isFoam = normalizeLabel(productType) === 'foam' || normalizeLabel(productCategory) === 'foam';
                
                // Track foam items for auto-return
                if (isFoam && serialId) {
                    checkoutFoamSerialIds.value.push(serialId);
                }
                
                return {
                    ...item,
                    id: serialId,
                    serial_id: serialId,
                    serial_number: item?.serial_number || '',
                    product_name: item?.product_name || item?.amenity_name || item?.name || ('Amenity ' + (idx + 1)),
                    brand: item?.brand || item?.product_brand || '',
                    product_type: productType,
                    product_category: productCategory,
                    cleanEligible,
                    isFoam,
                    damaged: cleanEligible ? false : isDamaged,
                };
            }).filter(entry => entry && !entry.cleanEligible && !entry.isFoam);
            checkoutAssignedAmenities.value = processed;
        } catch (error) {
            checkoutAmenitiesError.value = error?.response?.data?.error || error?.message || 'Failed to load amenities.';
            toast.add({ severity: 'error', summary: 'Amenities', detail: checkoutAmenitiesError.value, life: 3000 });
        } finally {
            checkoutAmenitiesLoading.value = false;
        }
    }

    // Function to confirm checkout
    async function confirmCheckout() {
        const roomRef = selectedRoom.value;
        if (!roomRef) return;

        const roomId = Number(roomRef.id);
        if (!roomId) {
            toast.add({
                severity: "error",
                summary: "Checkout Failed",
                detail: "Room not found. Please try again.",
                life: 3000,
            });
            return;
        }

        const roomNumberLabel = roomRef?.roomNumber || roomRef?.room_number || roomRef?.roomCode || 'Room';
        const depositReturn = checkoutRefundToGuest.value;
        const hasAdditionalPayment = isPaymentConfirmed.value && checkoutAdditionalPaymentReceived.value > 0;
        
        // Build confirmation message
        let confirmMessage = `Are you sure you want to check out ${roomNumberLabel}?`;
        
        // If there's additional payment, only show deposit return (if any)
        if (hasAdditionalPayment) {
            if (depositReturn > 0) {
                confirmMessage += `\n\n✓ Deposit to Return: ${formatCurrency(depositReturn)}`;
            }
        } else {
            // No additional payment - show deposit return if available
            if (depositReturn > 0) {
                confirmMessage += `\n\n✓ Deposit to Return: ${formatCurrency(depositReturn)}`;
            }
        }
        
        // Show confirmation dialog
        confirm.require({
            message: confirmMessage,
            header: 'Confirm Checkout',
            icon: 'pi pi-exclamation-triangle',
            rejectClass: 'p-button-secondary p-button-outlined',
            rejectLabel: 'Cancel',
            acceptLabel: 'Confirm',
            accept: async () => {
                await processCheckout(roomRef, roomId, roomNumberLabel);
            }
        });
    }

    // Separate function to process the actual checkout
    async function processCheckout(roomRef, roomId, roomNumberLabel) {
        const damagedSerialIds = checkoutDamagedSerialIds.value.slice();
        const damageCount = damagedSerialIds.length;
        const bookingRef = Number(roomRef?.guestDetails?.id) || null;

        const originalDepositVal = checkoutDepositOriginalNumber.value;
        const damageVal = checkoutDamageChargesNumber.value;
        const newDepositVal = 0;
        const totalDueVal = roundCurrency(occRoomRate.value + occExtras.value + occRent.value + occExtend.value + occAdditionalPersonTotal.value + damageVal);
        // Use localStorage to get the amount received since we removed it from database
        const storageKey = `amountReceived_room_${roomId}`;
        const storedAmount = Number(localStorage.getItem(storageKey) || 0);
        const amountReceivedVal = roundCurrency(Number.isFinite(storedAmount) ? storedAmount : 0);
        const changeVal = roundCurrency(amountReceivedVal - totalDueVal);

        try {
            const res = await updateCheckinPaymentAmount({
                room_id: roomId,
                booking_id: bookingRef,

                total_due: totalDueVal,
                deposit_amount: newDepositVal,
                damage_charges: damageVal,
            });

            const snapshot = res?.data?.payment || null;
            const resolvedDamage = roundCurrency(Number(snapshot?.damage_charges ?? damageVal));
            const resolvedDeposit = roundCurrency(Number(snapshot?.deposit_amount ?? newDepositVal));
            const resolvedTotal = roundCurrency(Number(snapshot?.total_due ?? totalDueVal));
            const payment = roomRef.guestDetails?.payment || (roomRef.guestDetails.payment = { deposit: 0, isPaid: false });
            payment.damage_charges = resolvedDamage;
            payment.damageCharges = resolvedDamage;
            payment.deposit = resolvedDeposit;
            payment.deposit_amount = resolvedDeposit;
            payment.totalDue = resolvedTotal;
            payment.total_due = resolvedTotal;
            // Note: amountReceived and change are now calculated client-side only

            const roomIdx = rooms.value.findIndex(r => Number(r.id) === roomId);
            if (roomIdx >= 0) {
                const target = rooms.value[roomIdx];
                target.guestDetails = target.guestDetails || {};
                target.guestDetails.payment = { ...(target.guestDetails.payment || {}), ...payment };
            }

            checkoutDamageCharges.value = resolvedDamage;
            checkoutDepositOriginal.value = originalDepositVal;
        } catch (error) {
            toast.add({
                severity: "error",
                summary: "Checkout Failed",
                detail: error?.response?.data?.error || error.message || 'Failed to update payment.',
                life: 3500,
            });
            return;
        }

        const roomIndex = rooms.value.findIndex((r) => r.id === roomRef.id);

        if (roomIndex === -1) {
            toast.add({
                severity: "error",
                summary: "Checkout Failed",
                detail: "Room not found. Please try again.",
                life: 3000,
            });
            return;
        }

        const previousStatus = rooms.value[roomIndex].status;
        const previousGuestDetails = rooms.value[roomIndex].guestDetails;

        rooms.value[roomIndex].status = "Cleaning";
        rooms.value[roomIndex].guestDetails = null;
        if (selectedRoom.value) {
            selectedRoom.value = { ...selectedRoom.value, status: 'Cleaning', guestDetails: null };
        }

        localStorage.setItem("rooms", JSON.stringify(rooms.value));

        try {
            await checkoutRoom(roomId, { 
                damaged_serial_ids: damagedSerialIds,
                foam_serial_ids: checkoutFoamSerialIds.value 
            });
            const damageLabel = damageCount === 1 ? 'amenity' : 'amenities';
            const detailMessage = damageCount
                ? `Room ${roomNumberLabel} checked out. ${damageCount} ${damageLabel} reported as damaged (status preserved).`
                : `Room ${roomNumberLabel} has been checked out.`;
            toast.add({
                severity: "success",
                summary: "Checkout Successful",
                detail: detailMessage,
                life: 3000,
            });
            
            // Clean up localStorage entries for this room
            const storageKey = `amountReceived_room_${roomId}`;
            localStorage.removeItem(storageKey);
            
            lastCheckInByRoom.delete(roomId);
            emitBookingsChanged("checked-out", bookingRef, roomId);
            emitRoomsChanged("status-updated", roomId);
        } catch (error) {
            console.error("API Error:", error);
            rooms.value[roomIndex].status = previousStatus || 'Occupied';
            rooms.value[roomIndex].guestDetails = previousGuestDetails || roomRef.guestDetails || null;
            if (selectedRoom.value) {
                selectedRoom.value = { ...selectedRoom.value, status: previousStatus || 'Occupied', guestDetails: rooms.value[roomIndex].guestDetails };
            }
            localStorage.setItem("rooms", JSON.stringify(rooms.value));

            toast.add({
                severity: "error",
                summary: "Checkout Failed",
                detail: "Failed to sync with server. Changes reverted.",
                life: 3000,
            });
        }

        checkoutDialogVisible.value = false;
        DialogVisible.value = false;
        checkoutAssignedAmenities.value = [];
        
        // Reset payment confirmation after successful checkout
        checkoutAdditionalPaymentReceived.value = 0;
        isPaymentConfirmed.value = false;
        lastPaymentConfirmedRoomId.value = null;
    }

    // Mock version: Update room status in local storage
    async function updateRoomStatus(roomId, status) {
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    const rooms = JSON.parse(localStorage.getItem("rooms") || "[]");
                    const roomIndex = rooms.findIndex((r) => r.id === roomId);

                    if (roomIndex === -1) {
                        reject(new Error("Room not found"));
                        return;
                    }

                    // Update status and clear guest details
                    rooms[roomIndex].status = status;
                    rooms[roomIndex].guestDetails = null;

                    localStorage.setItem("rooms", JSON.stringify(rooms));
                    resolve({ success: true });
                } catch (error) {
                    reject(error);
                }
            }, 500);
        });
    }

    // Update reactive variables
    const extendDialogVisible = ref(false);
    const additionalHours = ref(null);
    const additionalRate = ref(0);
    const newTotal = computed(() => {
        const base = selectedRoom.value?.guestDetails?.selectedrate || 0;
        return base + additionalRate.value;
    });

    // Functions
    function formatDate(date) {
        if (!date) return "N/A";
        return new Date(date).toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Manila"
        });
    }

    // State for dialog visibility and selected room

    const DialogVisible = ref(false); // Controls visibility of the dialog

    const isCheckInAllowed = computed(() => {
  const b = selectedRoom.value?.guestDetails;
  if (!b) return false;

  // allow createdAt as fallback if checkInDateTime missing
  const base = b.checkInDateTime || b.createdAt;
  const t = parseDateMaybePH(base);
  if (!Number.isFinite(t)) return false;

  const now = Date.now();
  return now >= t && now <= (t + CHECKIN_WINDOW_MS);
});

    // Function to open the dialog
    async function openDialog(room) {
        // Set the base room info
        selectedRoom.value = {
            ...room,
            guestDetails: null, // We'll fill this after fetching
            roomNumber: room.room_number,
            type: room.room_type_name,
            floor: room.floor_number,
        };
        DialogVisible.value = true;

        // If Booked or Occupied, fetch latest booking from backend
        if (room.status === "Booked" || room.status === "Occupied") {
            try {
                const res = await fetchLatestBooking(room.id);
                if (res.data && Object.keys(res.data).length) {
                    // Map backend booking fields to guestDetails
                    selectedRoom.value.guestDetails = {
                        id: res.data.id,
                        guestName: res.data.guest_name,
                        cellphone: res.data.cellphone,
                        guestEmail: res.data.guest_email,
                        selectedHours: res.data.selected_hours,
                        selectedrate: res.data.selected_rate,
                        roomCode: res.data.room_code,
                        bookCode: res.data.book_code,
                        createdAt: res.data.created_at,
                        checkInDateTime: res.data.check_in_datetime,
                        checkOutDateTime: res.data.check_out_datetime, 
                        bookingType: res.data.booking_type,
                        payment: res.data.payment || selectedRoom.value.guestDetails?.payment || null,
                    };
                    // Attach totals and items from backend if available
                    selectedRoom.value.guestDetails.extrasTotal = Number(res.data.extras_total || 0);
                    selectedRoom.value.guestDetails.amenitiesTotal = Number(res.data.amenities_total || 0);
                    selectedRoom.value.guestDetails.extrasItems = res.data.extras_items || [];
                    selectedRoom.value.guestDetails.amenitiesItems = res.data.amenities_items || [];
                    // Charged room rate and discount snapshot (if provided)
                    selectedRoom.value.guestDetails.roomRateCharged = Number(res.data.room_rate_charged || res.data.room_rate || 0);
                    selectedRoom.value.guestDetails.discountName = res.data.discount_name || '';
                    selectedRoom.value.guestDetails.discountPercent = Number(res.data.discount_percent || 0);
                    selectedRoom.value.guestDetails.discountAmount = Number(res.data.discount_amount || 0);
                    // (no extension logs in this version)
                } else {
                    selectedRoom.value.guestDetails = null;
                }
            } catch (err) {
                selectedRoom.value.guestDetails = null;
                // Optionally show error toast
                toast.add({
                    severity: "error",
                    summary: "Fetch Booking Error",
                    detail: err.message,
                    life: 3000,
                });
            }
        }
    }

    function closeBookingDialog() {
        BookingDialogVisible.value = false; // Hide the dialog
    }

    // Function to open the dialog
    function openCancelDialog(room) {
        selectedBookingId.value = room.guestDetails?.id; // from your fetched latest booking
        cancelDialogVisible.value = true;

    }

    // Function to confirm and cancel the booking
    async function confirmAndCancelBooking(bookingId) {
        try {
            await cancelBooking(bookingId);
            uiBookedAtMsByRoom.delete(selectedRoom.value?.id);
            toast.add({ severity: "success", summary: "Booking cancelled!", life: 3000 });
            fetchRooms(); // Reload the rooms
            cancelDialogVisible.value = false;
            await refreshRoomsAndSelectedRoom();
            emitBookingsChanged("cancelled", bookingId, selectedRoom.value?.id || null);
            emitRoomsChanged("status-updated", selectedRoom.value?.id || null);
        } catch (err) {
            toast.add({
                severity: "error",
                summary: "Error",
                detail: err.response?.data?.error || err.message,
            });
        }
    }

    // Reactive state for dialog visibility
    const BookingDialogVisible = ref(false); // Tracks visibility of the booking dialog

    // Function to open the booking dialog
    async function openBookingDialog() {
  uiBookingTs.value = Date.now();
  selectedExtendedDuration.value = null; // Reset extended duration selection

  // NEW: when opening as Book, freeze to "now"
  if (isBook.value) {
    guestDetails.value.checkInDateTime = new Date();
  }

  const typeId = selectedRoom.value.type_id;
  try {
    const res = await getRoomTypeRates(typeId);
    const d = res?.data || {};
    const base = d.rates || {};
    selectedRoom.value.rate = {
      "6": Number(base["6"] ?? base[6] ?? 0),
      "12": Number(base["12"] ?? base[12] ?? 0),
      "24": Number(base["24"] ?? base[24] ?? 0),
    };
  } catch (err) {
    selectedRoom.value.rate = {};
    toast.add({
      severity: "error",
      summary: "Failed to fetch rates",
      detail: err?.response?.data?.message || err.message,
    });
  }
  BookingDialogVisible.value = true;
}
watch(customerType, (val) => {
  if (val === "Book") {
    // Freeze to now when switching to Book
    guestDetails.value.checkInDateTime = new Date();
  }
});

// Auto-generate sales report when dates change
watch([transactionReportStartDate, transactionReportEndDate], () => {
  if (transactionReportStartDate.value && transactionReportDialogVisible.value) {
    fetchTransactionReport();
  }
});

// Also trigger when start/end times change
watch([transactionReportStartTime, transactionReportEndTime], () => {
  if (transactionReportStartDate.value && transactionReportDialogVisible.value) {
    fetchTransactionReport();
  }
});

    async function submitBooking(guestDetails) {
        // Generate unique codes
        const room = rooms.value.find(r => r.id === selectedRoom.value.id);
        if (!room) return;
const isBookType = customerType.value === "Book";

const bookingData = {
  room_id: room.id,
  guest_name: guestDetails.guestName,
  cellphone: guestDetails.cellphone,
  guest_email: guestDetails.guestEmail,
  booking_type: "Booking",
  status: "Booked",
  // Don't set check_in_datetime for bookings - only when actually checking in
  check_in_datetime: isBookType ? null : toPHDateTimeString(guestDetails.checkInDateTime || new Date()),
  selected_hours: guestDetails.selectedHours,
  selected_rate: guestDetails.selectedrate,
  room_code: generateroomCode(room.id),
  book_code: generateroomCode("BK"),
  notes: guestDetails.notes || "",
  discount_type: discountType.value,
  discount_name: discountType.value === "manual" ? "Manual Discount" : (selectedDiscount.value?.name || ""),
  discount_percent: discountType.value === "manual" ? 0 : Number(roomDiscountPercent.value || 0),
  discount_amount: discountType.value === "manual" ? Number(manualDiscountAmount.value || 0) : 0,
  discount_id: discountType.value === "manual" ? null : (selectedDiscount.value?.id || null),
};

const nowMs = Date.now();
uiBookedAtMsByRoom.set(room.id, nowMs);

// Optimistic UI - bookings should not have checkInDateTime until actual check-in
const optimisticDetails = {
  ...guestDetails,
  checkInDateTime: isBookType ? null : new Date(nowMs).toISOString(),
  createdAt: new Date(nowMs).toISOString(), // Use createdAt for booking expiry calculations
};
selectedRoom.value.status = "Booked";
selectedRoom.value.guestDetails = optimisticDetails;

const idx = rooms.value.findIndex(r => r.id === room.id);
if (idx !== -1) {
  rooms.value[idx].status = "Booked";
  rooms.value[idx].guestDetails = optimisticDetails;
}

        try {
            await bookRoom(bookingData);
            toast.add({
                severity: "success",
                summary: "Booking Saved",
                detail: "The booking was saved successfully.",
                life: 3000,
            });
            BookingDialogVisible.value = false;
            DialogVisible.value = false;
            await refreshRoomsAndSelectedRoom();
            fetchRooms(); // Refresh room list to reflect new status
            // Emit global events for instant updates across views
            emitBookingsChanged("booked", null, room.id);
            emitRoomsChanged("status-updated", room.id);

        } catch (err) {
            toast.add({
                severity: "error",
                summary: "Booking Failed",
                detail: err.response?.data?.message || err.message,
                life: 3000,
            });
            DialogVisible.value = false;
        }
    }

    // Sales Report Functions
    function showTransactionReport() {
        // Set default to current date
        const now = new Date();
        transactionReportStartDate.value = new Date(now);
        transactionReportEndDate.value = null; // Leave end date empty initially (same as start date)
        
        // Clear times to show full day data initially
        transactionReportStartTime.value = null;
        transactionReportEndTime.value = null;
        
        transactionReportDialogVisible.value = true;
        fetchTransactionReport();
    }

    async function fetchTransactionReport() {
        if (!transactionReportStartDate.value) {
            toast.add({
                severity: "warn",
                summary: "Start Date Required",
                detail: "Please select a start date",
                life: 3000
            });
            return;
        }

        // Reset data before loading
        transactionReportData.value = {
            checkinPayments: [],
            bills: [],
            totalCheckinPayments: 0,
            totalBills: 0,
            grandTotal: 0
        };

        loadingTransactionReport.value = true;
        try {
            const startDate = transactionReportStartDate.value;
            const endDate = transactionReportEndDate.value || startDate; // Use start date if end date is not set
            
            let startDateTime, endDateTime;
            
            // Determine start datetime
            if (transactionReportStartTime.value) {
                const startHour = transactionReportStartTime.value.getHours();
                const startMinute = transactionReportStartTime.value.getMinutes();
                const startSecond = transactionReportStartTime.value.getSeconds();
                
                startDateTime = new Date(
                    startDate.getFullYear(),
                    startDate.getMonth(),
                    startDate.getDate(),
                    startHour,
                    startMinute,
                    startSecond
                );
            } else {
                // No start time specified, use beginning of start date
                startDateTime = new Date(
                    startDate.getFullYear(),
                    startDate.getMonth(),
                    startDate.getDate(),
                    0, 0, 0
                );
            }
            
            // Determine end datetime
            if (transactionReportEndTime.value) {
                const endHour = transactionReportEndTime.value.getHours();
                const endMinute = transactionReportEndTime.value.getMinutes();
                const endSecond = transactionReportEndTime.value.getSeconds();
                
                endDateTime = new Date(
                    endDate.getFullYear(),
                    endDate.getMonth(),
                    endDate.getDate(),
                    endHour,
                    endMinute,
                    endSecond
                );
            } else {
                // No end time specified, use end of end date
                endDateTime = new Date(
                    endDate.getFullYear(),
                    endDate.getMonth(),
                    endDate.getDate(),
                    23, 59, 59
                );
            }
            
            // Format for API - use Philippines timezone (UTC+8)
            const formatPHDateTime = (date) => {
                // Ensure we're working with local PH time
                const phDate = new Date(date.getTime());
                const year = phDate.getFullYear();
                const month = String(phDate.getMonth() + 1).padStart(2, '0');
                const day = String(phDate.getDate()).padStart(2, '0');
                const hours = String(phDate.getHours()).padStart(2, '0');
                const minutes = String(phDate.getMinutes()).padStart(2, '0');
                const seconds = String(phDate.getSeconds()).padStart(2, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            };
            
            const startDateTimeStr = formatPHDateTime(startDateTime);
            const endDateTimeStr = formatPHDateTime(endDateTime);
            
            console.log('Sendsing datetime query:', { startDateTimeStr, endDateTimeStr });
            
            // Fetch sales data: checked-in sales + POS sales
            const response = await fetch(`http://127.0.0.1:5000/transaction-report?start_datetime=${startDateTimeStr}&end_datetime=${endDateTimeStr}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch sales report');
            }
            
            const data = await response.json();
            transactionReportData.value = {
                checkinPayments: data.checkin_payments || [],
                bills: data.bills || [],
                totalCheckinPayments: data.total_checkin_payments || 0,
                totalBills: data.total_bills || 0,
                grandTotal: data.grand_total || 0
            };
        } catch (error) {
            toast.add({
                severity: "error",
                summary: "Error",
                detail: "Failed to fetch sales report: " + error.message,
                life: 3000
            });
        } finally {
            loadingTransactionReport.value = false;
        }
    }

    function clearTransactionReportFilters() {
        // Clear only end date, start time, and end time (keep start date)
        transactionReportEndDate.value = null;
        transactionReportStartTime.value = null;
        transactionReportEndTime.value = null;
        
        // If start date exists, automatically fetch the full day report
        if (transactionReportStartDate.value) {
            fetchTransactionReport();
        } else {
            // Clear the report data if no start date
            transactionReportData.value = {
                checkinPayments: [],
                bills: [],
                totalCheckinPayments: 0,
                totalBills: 0,
                grandTotal: 0
            };
        }
        
        toast.add({
            severity: "info",
            summary: "Cleared",
            detail: "Time filters cleared - showing full day data",
            life: 2000
        });
    }

    </script>

    <template>
        <div class="col-span-12 mb-2">
            <RoomSummary
                :operationalRooms="countAvailable"
                :occupiedRooms="countOccupied"
                :underMaintinance="countCleaning"
                :totalRooms="countBooked"
            />
        </div>
        <div class="flex flex-row gap-4">
            <!-- Filter Section -->

            <!-- Room Grid Section -->
            <div class="flex-1 card p-4">
                <div class="flex justify-between items-center mb-5">
                    <h2 class="text-xl font-bold">Room List</h2>
                    <Button 
                        icon="pi pi-chart-bar" 
                        label="Sales Report" 
                        class="p-button-info" 
                        @click="showTransactionReport"
                    />
                </div>
                
                <!-- Empty State -->
                <div v-if="sortedRooms.length === 0" 
                     class="text-center py-12">
                    <div class="flex flex-col items-center gap-4">
                        <i class="pi pi-home text-6xl text-gray-300 dark:text-gray-600"></i>
                        <div class="space-y-2">
                            <h3 class="text-xl font-semibold text-gray-600 dark:text-gray-400">No Rooms Found</h3>
                            <p class="text-gray-500 dark:text-gray-500 max-w-md">
                                No rooms match your current filters. 
                                <br>Try adjusting your search criteria or clearing the filters.
                            </p>
                        </div>
                        <Button
                            icon="pi pi-filter-slash"
                            label="Clear Filters"
                            class="p-button-outlined"
                            @click="clearFilters"
                        />
                    </div>
                </div>

                <!-- Room Grid (only show when there are rooms) -->
                <div v-else class="h-[70vh] overflow-y-auto">
                    <!-- Scrollable container -->
                    <div
                        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 justify-center pb-4"
                    >
                        <div
    v-for="room in sortedRooms"
    :key="room.id"
    class="room-card"                                     
    :class="{
  'near-expiry-anim': (isNearThirty(room) && !isTimeUp(room)) || (isBookedNear(room) && !isBookedExpired(room)),
  'timeup-anim': isTimeUp(room) || isBookedExpired(room),
}"

    @click="openDialog(room)"
    >
    <div
        class="room-card__inner relative w-full p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow text-white min-h-[130px]"
        :class="{
        'bg-green-500': room.status === 'Available',
        'bg-blue-500': room.status === 'Booked',
        'bg-orange-500': room.status === 'Cleaning',
        'bg-red-500': room.status === 'Occupied',
        'bg-gray-400': !['Available','Booked','Cleaning','Occupied'].includes(room.status),
        }"
    >
        <!-- keep ALL your existing inner content exactly as-is, e.g.: -->

        <div
        v-if="roomExtendedHours(room) > 0"
        class="absolute top-2 right-2 bg-yellow-400 text-white text-xs font-semibold px-2 py-1 rounded-full"
        >
        +{{ roomExtendedLabel(room) }}
        </div>

        <div
        v-if="room.status === 'Occupied' && remainingLabel(room)"
        class="absolute bottom-2 right-2 text-xs bg-white/85 text-gray-800 px-2 py-1 rounded border border-yellow-300"
        >
        {{ remainingLabel(room) }}
        </div>

        <div
        v-if="room.status === 'Occupied' && isTimeUp(room)"
        class="absolute bottom-2 right-2 text-xs bg-white/90 text-red-700 px-2 py-1 rounded border border-red-300 font-bold"
        >
        TIME’S UP
        </div>
        <!-- Booked: time left to check in -->
<div
  v-if="room.status === 'Booked' && bookedRemainingLabel(room)"
  class="absolute bottom-2 right-2 text-xs bg-white/85 text-gray-800 px-2 py-1 rounded border border-yellow-300"
>
  {{ bookedRemainingLabel(room) }}
</div>

<!-- Booked: expired -->
<div
  v-if="room.status === 'Booked' && isBookedExpired(room)"
  class="absolute bottom-2 right-2 text-xs bg-white/90 text-red-700 px-2 py-1 rounded border border-red-300 font-bold"
>
  EXPIRED
</div>

        <div class="text-center text-2xl font-bold mb-2">
        Room {{ room.room_number }}
        </div>
        <div class="text-center text-sm">
        <p>{{ room.room_type_name }}</p>
        <p>{{ room.status }}</p>
        </div>
    </div>
    </div>
                    </div>
                </div>
            </div>
            <div
                class="w-full md:w-1/3 lg:w-1/4 xl:w-1/5 p-2 md:p-4 card rounded-lg order-first md:order-last"
            >
                <h3 class="text-base md:text-lg font-bold mb-2 md:mb-4">Filters</h3>

                <!-- Clear and Search -->
                <div class="mb-2 md:mb-4 space-y-2">
                    <Button
                        type="button"
                        icon="pi pi-filter-slash"
                        label="Clear"
                        outlined
                        class="w-full text-sm md:text-base"
                        @click="clearFilters"
                    />
                    <IconField class="w-full">
                        <InputIcon class="mt-1">
                            <i class="pi pi-search text-sm md:text-base" />
                        </InputIcon>
                        <InputText
                            placeholder="Room # or Booking Code"
                            class="w-full text-sm md:text-base"
                            v-model="selectedFilter.searchQuery"
                        />
                    </IconField>
                </div>

                <!-- Status Filters -->
                <div class="mb-2 md:mb-4">
                    <h4 class="font-bold text-sm md:text-base mb-1 md:mb-2">
                        Status
                    </h4>
                    <div class="flex flex-col gap-1 md:gap-2">
                        <div class="flex items-center">
                            <Checkbox
                                v-model="selectedFilter.status.Available"
                                :binary="true"
                                class="h-4 w-4 md:h-5 md:w-5"
                            />
                            <label class="text-sm md:text-base ml-2"
                                >Available</label
                            >
                        </div>
                        <div class="flex items-center">
                            <Checkbox
                                v-model="selectedFilter.status.Occupied"
                                :binary="true"
                                class="h-4 w-4 md:h-5 md:w-5"
                            />
                            <label class="text-sm md:text-base ml-2"
                                >Occupied</label
                            >
                        </div>
                        <div class="flex items-center">
                            <Checkbox
                                v-model="selectedFilter.status.Cleaning"
                                :binary="true"
                                class="h-4 w-4 md:h-5 md:w-5"
                            />
                            <label class="text-sm md:text-base ml-2"
                                >Cleaning</label
                            >
                        </div>
                        <div class="flex items-center">
                            <Checkbox
                                v-model="selectedFilter.status.Booked"
                                :binary="true"
                                class="h-4 w-4 md:h-5 md:w-5"
                            />
                            <label class="text-sm md:text-base ml-2">Booked</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Room Dialog -->
        <Dialog
            v-model:visible="DialogVisible"
            header="Room Details"
            :modal="true"
            :dismissable-mask="true"
        >
           <template #header>
    <div class="px-4 py-3">
  <div
    class="p-4 rounded-lg border
           bg-blue-50 text-blue-900 border-blue-200
           dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-700
           transition-colors duration-200 mt-5"
  >
    <!-- Auto-sizing header row -->
    <div class="grid grid-cols-1 md:grid-cols-[1fr_auto] items-start md:items-center gap-4">
      
      <!-- LEFT: Room info -->
      <div class="space-y-1 min-w-0">
        <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h2 class="text-2xl md:text-3xl font-bold truncate">
            Room {{ selectedRoom?.roomNumber }}
          </h2>
          <span class="text-lg hidden sm:inline">|</span>
          <span class="text-lg font-semibold truncate">
            {{ selectedRoom?.type }}
          </span>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <span class="font-medium">Floor:</span>
          <span class="truncate">{{ selectedRoom?.floor || "N/A" }}</span>
        </div>
      </div>

      <!-- RIGHT: Status -->
      <div class="flex items-center gap-3 justify-start md:justify-end flex-shrink-0">
        <div
          class="h-8 w-1 rounded-full"
          :class="{
            'bg-green-500': selectedRoom?.status === 'Available',
            'bg-blue-500': selectedRoom?.status === 'Booked',
            'bg-yellow-500': selectedRoom?.status === 'Cleaning',
            'bg-red-500': selectedRoom?.status === 'Occupied',
            'bg-gray-500': !['Available','Booked','Cleaning','Occupied'].includes(selectedRoom?.status),
          }"
        ></div>

        <div class="space-y-0.5 text-right">
          <span class="block text-xs font-medium uppercase tracking-wide">Status</span>
          <p
            class="text-sm font-semibold"
            :class="{
              'text-green-600': selectedRoom?.status === 'Available',
              'text-blue-600': selectedRoom?.status === 'Booked',
              'text-yellow-600': selectedRoom?.status === 'Cleaning',
              'text-red-600': selectedRoom?.status === 'Occupied',
              'text-gray-600': !['Available','Booked','Cleaning','Occupied'].includes(selectedRoom?.status),
            }"
          >
            {{ selectedRoom?.status }}
          </p>
        </div>
      </div>

    </div>
  </div>
</div>

</template>

            <div v-if="selectedRoom">
                <!-- Available Room Actions -->
                <div
                    v-if="selectedRoom.status === 'Available'"
                    class="flex flex-col gap-2"
                >
                    <div class="flex gap-2 mt-4 justify-center">
                        <Button
                            label=" Book / Check-In"
                            icon="pi pi-sign-in"
                            class="p-button-primary w-full"
                            @click="openBookingDialog"
                        />
                    </div>
                </div>

                <div v-if="selectedRoom.status === 'Cleaning'">

                    <div class="mb-4">
                        <p>Cleaning Started: {{ formatDate(new Date()) }}</p>
                    </div>

                    <Button
                        label="Confirm Cleaning Completion"
                        icon="pi pi-check"
                        class="p-button-primary w-full"
                        @click="openCleaningConfirmation(selectedRoom)"
                    />
                  </div>

                  <!-- Booked Room Actions -->
                  <div v-if="selectedRoom && selectedRoom.status === 'Booked'">
                    <!-- Booked Room Details -->
                    <div
                        v-if="
                            selectedRoom.status === 'Booked' &&
                            selectedRoom.guestDetails
                        "
                        class="flex flex-col gap-4 p-4"
                    >
                        <h4 class="text-xl mb-2 font-bold">Guest Details</h4>
                        <p>
                            Booked on:
                            {{ selectedRoom.guestDetails?.createdAt ? formatDate(selectedRoom.guestDetails.createdAt) : "N/A" }}
                        </p>
                        <p v-if="selectedRoom?.status === 'Booked' && selectedRoom.guestDetails?.bookCode">
                            Book Code:
                            {{ selectedRoom.guestDetails?.bookCode || "N/A" }}
                        </p>
                        <p v-else-if="selectedRoom.guestDetails?.roomCode">
                            Room Code:
                            {{ selectedRoom.guestDetails?.roomCode || "N/A" }}
                        </p>
                        <p>
                            Guest Name:
                            {{ selectedRoom?.guestDetails?.guestName || "N/A" }}
                        </p>
                        <p>
                            Cellphone:
                            {{ selectedRoom?.guestDetails?.cellphone || "N/A" }}
                        </p>
                        <p>
                            Email:
                            {{ selectedRoom?.guestDetails?.guestEmail || "N/A" }}
                        </p>

                        <p>
                            Hours:
                            {{ selectedRoom.guestDetails?.selectedHours || "N/A" }}
                            Hours
                        </p>
                        <p>
                            Rate:
                            {{
                                selectedRoom.guestDetails?.selectedrate
                                    ? `₱${selectedRoom.guestDetails.selectedrate}`
                                    : "N/A"
                            }}
                        </p>
                        <p>
                                 Time left:
                            <span v-if="!isBookedExpired(selectedRoom)" class="text-yellow-600">
                            {{ bookedRemainingLabel(selectedRoom) || 'N/A' }}
                            </span>
                            <span v-else class="ml-2 inline-block px-2 py-1 rounded bg-red-100 text-red-700 font-semibold">
                            EXPIRED
                            </span>
                        </p>

                        <p>
                            Auto-cancel: {{ bookingExpiresAt(selectedRoom) }}
                        </p>

                    </div>
                    <!-- Actions for Booked Rooms -->
                    <div class="flex gap-2 mt-4 justify-center">
                       <Button
                          label="Check In"
                                    :disabled="!isCheckInAllowed"
                              class="p-button-primary w-full rounded-lg"
                                    @click="openPaymentDialog(selectedRoom)"
                                />

                        <Button
                            label="Cancel Booking"
                            class="p-button-primary w-full rounded-lg"
                            @click="openCancelDialog(selectedRoom)"
                        />
                    </div>
                  </div>
                </div>
                  <!-- Occupied Room Actions -->

                <div
                    v-if="selectedRoom.status === 'Occupied'"
                    class="flex flex-col gap-4 p-4">

                    <!-- Enhanced Occupied Details -->
                    <h4 class="text-xl mb-2 font-bold">Guest Details</h4>
                    <p>
                        <strong>Guest Name:</strong>
                        {{ selectedRoom.guestDetails?.guestName || "N/A" }}
                    </p>
                    <p>
                        <strong>Time remaining: </strong>
                        <span v-if="!isTimeUp(selectedRoom)"
                            class="text-yellow-600">
                        {{ remainingLabel(selectedRoom) || 'N/A' }}
                        </span>
                        <span v-else class="ml-2 inline-block px-2 py-1 rounded bg-red-100 text-red-700 font-semibold"> TIME’S UP </span>
                    </p>
                    <p>
                        <strong>Cellphone:</strong>
                        {{ selectedRoom.guestDetails?.cellphone || "N/A" }}
                    </p>
                    <p>
                        <strong>Email:</strong>
                        {{ selectedRoom.guestDetails?.guestEmail || "N/A" }}
                    </p>
                    <p v-if="selectedRoom?.status === 'Booked' && selectedRoom.guestDetails?.bookCode">
                        <strong>Book Code:</strong>
                        {{ selectedRoom.guestDetails?.bookCode || "N/A" }}
                    </p>
                    <p v-else-if="selectedRoom.guestDetails?.roomCode">
                        <strong>Room Code:</strong>
                        {{ selectedRoom.guestDetails?.roomCode || "N/A" }}
                    </p>
                    <p>
                        <strong>Hours:</strong>
                        {{ selectedRoom.guestDetails?.selectedHours || "N/A" }}
                        Hours
                    </p>
                    <p>
                        <strong>Rate:</strong>
                        {{
                            selectedRoom.guestDetails?.selectedrate
                                ? `₱${selectedRoom.guestDetails.selectedrate}`
                                : "N/A"
                        }}
                    </p>
              
                    <p v-if="isBookedStay(selectedRoom)">
  <strong>Booked on:</strong>
  {{ selectedRoom.guestDetails?.createdAt ? formatDate(selectedRoom.guestDetails.createdAt) : "N/A" }}
</p>
                    <p v-if="selectedRoom.guestDetails?.checkInDateTime">
  <strong>Checked-in:</strong>
  {{ formatDate(selectedRoom.guestDetails.checkInDateTime) }}
</p>

                    <div class="mt-4 pt-4 border-t space-y-3" v-if="selectedRoom?.status === 'Occupied'">
                        <div class="flex items-center justify-between gap-2 mb-2">
                          <h4 class="text-xl font-bold">Payment Details</h4>
                          <Button
                            label="Add Consumables / Amenities"
                            icon="pi pi-plus"
                            class="p-button-sm"
                            @click.stop="openOccupiedExtrasDialog"
                          />
                        </div>

                        <!-- Extras list -->
                        <div>
                          <div class="text-sm uppercase tracking-wide text-gray-500 mb-1">Consumables</div>
                          <div v-if="(selectedRoom.guestDetails?.extrasItems || []).length" class="space-y-1 text-sm">
                            <div v-for="(it, i) in selectedRoom.guestDetails.extrasItems" :key="i" class="flex items-center justify-between">
                              <span>{{ it.name }}<span v-if="it.brand" class="opacity-60"> ({{ it.brand }})</span> ×{{ it.quantity }}</span>
                              <span>{{ formatCurrency(it.price) }}</span>
                            </div>
                          </div>
                          <div v-else class="text-sm opacity-60">No Consumables.</div>
                        </div>

                        <!-- Amenities list -->
                        <div>
                          <div class="text-sm uppercase tracking-wide text-gray-500 mb-1">Amenities</div>
                          <div v-if="(selectedRoom.guestDetails?.amenitiesItems || []).length" class="space-y-1 text-sm">
                            <div v-for="(a, i) in selectedRoom.guestDetails.amenitiesItems" :key="i" class="flex items-center justify-between">
                              <span>{{ a.amenity_name }} <span v-if="a.serial_number" class="opacity-60">#{{ a.serial_number }}</span></span>
                              <span>{{ formatCurrency(a.unit_rental_price) }}</span>
                            </div>
                          </div>
                          <div v-else class="text-sm opacity-60">No amenities.</div>
                        </div>

                        <!-- Payment -->
                        <div>
                          <div class="text-sm uppercase tracking-wide text-gray-500 mb-1">Payment</div>
                          <div class="flex items-center justify-between text-sm">
                            <span>Room Rate</span>
                            <span class="flex items-center gap-2">
                              <!-- Manual Discount - Show discount name with slash and amount -->
                              <template v-if="occDiscountName && occDiscountName.toLowerCase().includes('manual') && Number(occDiscountAmount || 0) > 0">
                                <span class="price-old">{{ formatCurrency(occBaseRoomRate) }}</span>
                                <span class="discount-pill">
                                  {{ occDiscountName }} / -₱{{ Number(occDiscountAmount).toFixed(2) }}
                                </span>
                                <span class="price-new">{{ formatCurrency(occRoomRate) }}</span>
                              </template>
                              <!-- Percentage Discount -->
                              <template v-else-if="Number(occDiscountPercent || 0) > 0">
                                <span class="price-old">{{ formatCurrency(occBaseRoomRate) }}</span>
                                <span class="discount-pill">
                                  {{ occDiscountName || 'Promo' }} -{{ Number(occDiscountPercent) }}%
                                </span>
                                <span class="price-new">{{ formatCurrency(occRoomRate) }}</span>
                              </template>
                              <!-- No Discount -->
                              <strong v-else>{{ formatCurrency(occRoomRate) }}</strong>
                            </span>
                          </div>

                           <div class="flex items-center justify-between text-sm">
                            <span>Consumables</span>
                            <strong>{{ formatCurrency(occExtras) }}</strong>
                          </div>
                          <div class="flex items-center justify-between text-sm">
                            <span>Amenities Rent</span>
                            <strong>{{ formatCurrency(occRent) }}</strong>
                          </div>
                          <div class="flex items-center justify-between text-sm" >
                                <span>Extend</span>
                                <div class="flex items-center gap-2">
                                  <span v-if="occExtendHours" class="text-xs font-semibold text-amber-700">+{{ occExtendHours }}h</span>
                                  <strong>{{ formatCurrency(occExtend) }}</strong>
                                </div>
                              </div>

                          <div v-if="Number(occAdditionalPersonCount) > 0" class="flex items-center justify-between text-sm">
                            <span>Additional Person</span>
                            <div class="flex items-center gap-2">
                              <span class="text-xs font-semibold text-blue-700">{{ occAdditionalPersonCount }} person{{ occAdditionalPersonCount > 1 ? 's' : '' }}</span>
                              <strong>{{ formatCurrency(occAdditionalPersonTotal) }}</strong>
                            </div>
                          </div>

                          <div class="flex items-center justify-between text-l">
                            <span>Deposit</span>
                            <strong>{{ formatCurrency(occDeposit) }}</strong>
                          </div>
                           <hr>
                          <div
                                  class="flex items-center justify-between text-xl p-2 rounded-md border
                                        bg-green-50 text-green-800 border-green-300
                                        dark:bg-green-900/20 dark:text-green-200 dark:border-green-700"
                                >
                                  <span>Total</span>
                                  <strong>{{ formatCurrency(occTotalDue) }}</strong>
                                </div>

                          <!-- Payment note (view/edit) -->
                          <div class="mt-2">
                            <div class="flex items-center justify-between text-l">
                              <span>Note</span>
                              <Button v-if="!editingPaymentNote" label="Edit" class="p-button-text" @click="startEditPaymentNote" />
                            </div>
                            <div v-if="!editingPaymentNote" class="rounded-md border bg-blue-50 text-blue-900 border-blue-200 p-3 whitespace-pre-wrap break-words">
                              {{ selectedRoom.guestDetails?.payment?.note || '-' }}
                            </div>
                            <div v-else class="space-y-2">
                              <textarea v-model="editPaymentNoteText" rows="3" class="w-full p-2 border rounded-md focus:outline-none focus:ring"></textarea>
                              <div class="flex gap-2 justify-end">
                                <Button label="Cancel" class="p-button-text" @click="cancelEditPaymentNote" />
                                <Button label="Save" icon="pi pi-check" class="p-button-primary" @click="savePaymentNote" />
                              </div>
                            </div>
                          </div>
                    <div class="flex gap-2 mt-4 justify-center">
                        <Button
                            class="p-button-primary w-full"
                            @click="openCheckoutDialog(selectedRoom)"
                        >
                            Check Out
                        </Button>
                        <Button
                            class="p-button-primary w-full"
                            @click="openExtendDialog(selectedRoom)"
                        >
                            Extend Stay
                        </Button>
                    </div>
                </div>
</div>
    
        </div>
        </Dialog>

        <!-- Booking/Checkin Dialog -->
        <Dialog
            v-model:visible="BookingDialogVisible"
            :modal="true"
            :dismissable-mask="true"
            style="width: 70vh"
        >
            <template #header>
                <div class="font-bold text-xl">
                    Room {{ selectedRoom?.roomNumber }} |
                    {{ selectedRoom?.type }}
                </div>
            </template>

            <div class="p-4">
                <div class="mb-4">
  <label class="block text-sm font-medium mb-1">Customer Type</label>
  <Dropdown
    v-model="customerType"
    :options="customerTypeOptions"
    optionLabel="label"
    optionValue="value"
    placeholder="Select type"
    class="w-full md:w-60"
  />
</div>
                <!-- Customer Information -->
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-1"> Name</label>
                    <InputText
                        v-model="guestDetails.guestName"
                        placeholder="Enter name"
                        class="w-full"
                        required
                    />
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-1"
                        >Cellphone Number</label
                    >
                    <div class="relative w-full">
                        <InputText
                            v-model="guestDetails.cellphone"
                            placeholder="Enter cellphone number (optional)"
                            class="w-full pr-10"
                            :class="{ 'p-invalid': !isCellphoneValid }"
                            @input="validatePhilippineCellphone"
                        />
                        <i
                            v-if="!isCellphoneValid"
                            class="pi pi-exclamation-circle text-red-500 absolute right-3 top-1/2 transform -translate-y-1/2"
                        ></i>
                    </div>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium mb-1"> Email</label>
                    <div class="relative">
                        <InputText
                            v-model="guestDetails.guestEmail"
                            placeholder="Enter Email (optional)"
                            class="w-full"
                            :class="{ 'p-invalid': !isEmailValid }"
                            @input="validateEmail"
                        />
                        <i
                            v-if="!isEmailValid"
                            class="pi pi-exclamation-circle text-red-500 absolute right-3 top-1/2 transform -translate-y-1/2"
                        ></i>
                    </div>
                    <p v-if="!isEmailValid" class="text-sm text-red-500 mt-1">
                        Please enter a valid Gmail address (e.g.,
                        example@gmail.com).
                    </p>
                </div>

                <label class="block text-sm font-medium mb-1">
                     Check In Time:
                    <span v-if="isWalkIn || isBook" class="text-sm text-gray-500">
                         (Auto-filled with current time)
                  </span>
                </label>
            <DatePicker
                v-model="guestDetails.checkInDateTime"
                 placeholder="Select date & time"
                dateFormat="yy-mm-dd"
                showTime
                hourFormat="12"
                class="w-full"
                :minDate="minDate"
                :showButtonBar="true"
                :disabled="isWalkIn || isBook"
                />

                <div>
                    <div class="flex items-center justify-between mb-3 mt-3">
                        <label class="block text-sm font-medium">
                            Select Stay Duration:
                        </label>
                        <Button
                            label="More Stay Duration"
                            class="p-button-outlined p-button-sm"
                            icon="pi pi-calendar-plus"
                            @click="openMoreDurationDialog"
                        />
                    </div>
                    
                    <!-- Highlight selected extended duration -->
                    <div v-if="selectedExtendedDuration" class="mt-3 mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/30 dark:border-blue-700">
                        <div class="flex items-center gap-2 text-sm">
                            <i class="pi pi-check-circle text-blue-600 dark:text-blue-400"></i>
                            <span class="font-medium text-blue-900 dark:text-blue-100">
                                Selected: {{ selectedExtendedDuration.label }}
                            </span>
                        </div>
                        <div class="mt-1 text-xs text-blue-700 dark:text-blue-300">
                            {{ selectedExtendedDuration.hours }} hours • {{ formatCurrency(selectedExtendedDuration.rate) }}
                        </div>
                    </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
  <div
    v-for="(rate, hours) in selectedRoom?.rate"
    :key="hours"
    role="button"
    tabindex="0"
    :class="[
      // base
      'p-4 border rounded-lg cursor-pointer select-none transition-colors',
      // light & dark defaults
      'bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50',
      'dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800',
      // selected state
      guestDetails.selectedHours === parseInt(hours)
        ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200'
        : ''
    ]"
    @click="BookingselectRateAndHours(parseInt(hours), Number(selectedRoom?.rate?.[hours] ?? 0))"
    @keydown.enter="BookingselectRateAndHours(parseInt(hours), Number(selectedRoom?.rate?.[hours] ?? 0))"
    @keydown.space.prevent="BookingselectRateAndHours(parseInt(hours), Number(selectedRoom?.rate?.[hours] ?? 0))"
  >
    <div class="font-semibold text-lg">
      {{ hours }} Hours
    </div>

    <div class="mt-1 text-neutral-700 dark:text-neutral-300">
      {{ formatCurrency(selectedRoom?.rate?.[hours]) }}
    </div>

  </div>
</div>
</div>

                <!-- Action Buttons -->
                <div class="flex gap-4 mt-6 justify-end">
                    <Button
                        label="Cancel"
                        class="p-button-primary w-full"
                        @click="closeBookingDialog"
                    />
                    <Button
                        v-if="!isWalkIn"
                        label="Save"
                        class="p-button-primary w-full"
                        :disabled="!isFormValid"
                        @click="submitBooking(guestDetails)"
                    />
                    <!-- In Booking/Checkin Dialog template -->
                    <Button
                        v-else
                        label="Proceed to Payment"
                        class="p-button-primary w-full"
                        :disabled="!isFormValid"
                        @click="openPaymentDialog(selectedRoom)"
                    />
                </div>
            </div>
        </Dialog>

        <!-- Cancel Booking Dialog -->
        <Dialog
            v-model:visible="cancelDialogVisible"
            header="Confirm Cancellation"
            :dismissable-mask="true"
            :modal="true"
            :draggable="false"
            :style="{ width: '450px' }"
        >
            <div>
                <p>
                    Are you sure you want to cancel the booking for Room
                    <span class="font-bold text-red-500">
                        {{ selectedRoom?.roomNumber || "N/A" }} |
                        {{ selectedRoom?.type || "N/A" }} |
                        {{ selectedRoom?.floor || "N/A" }}?
                    </span>
                </p>
            </div>
            <div class="flex justify-end mt-4 gap-2">
                <Button
                    label="No"
                    class="p-button-secondary w-32"
                    @click="cancelDialogVisible = false"
                />
                <Button
    label="Yes"
    class="p-button-danger w-32"
    @click="confirmAndCancelBooking(selectedRoom.guestDetails.id)"
    />
            </div>
        </Dialog>

        <!-- More Stay Duration Dialog -->
        <Dialog
            v-model:visible="moreDurationDialogVisible"
            header="Select Extended Stay Duration"
            :modal="true"
            :dismissable-mask="true"
            :style="{ width: '800px' }"
            :breakpoints="{ '1024px': '90vw', '768px': '95vw', '640px': '98vw' }"
        >
            <div class="p-4">
                <div class="mb-4 text-center">
                    <p class="text-lg font-semibold mb-2">Daily Rate Options</p>
                    <p class="text-sm text-gray-600">
                        Based on 24-hour rate: {{ formatCurrency(selectedRoom?.rate?.['24'] || 0) }}
                    </p>
                </div>
                
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    <div
                        v-for="(rate, days) in dailyRates"
                        :key="days"
                        role="button"
                        tabindex="0"
                        :class="[
                            'p-4 border-2 rounded-lg cursor-pointer select-none transition-all duration-200 hover:shadow-lg',
                            'bg-white border-gray-200 text-gray-900 hover:bg-blue-50 hover:border-blue-300',
                            'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-blue-900/20 dark:hover:border-blue-500',
                            isSelectedDays(days) ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200' : ''
                        ]"
                        @click="selectDailyRateAndHours(days, Number(rate))"
                        @keydown.enter="selectDailyRateAndHours(days, Number(rate))"
                        @keydown.space.prevent="selectDailyRateAndHours(days, Number(rate))"
                    >
                        <div class="text-center">
                            <div class="font-bold text-lg mb-1">
                                {{ getDayLabel(days) }}
                            </div>
                            <div class="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                {{ getDaysCount(days) * 24 }}h
                            </div>
                            <div class="font-semibold text-sm text-green-600 dark:text-green-400">
                                {{ formatCurrency(rate) }}
                            </div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {{ formatCurrency(rate / getDaysCount(days)) }}/day
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="flex justify-end gap-2 mt-6">
                    <Button
                        label="Cancel"
                        class="p-button-secondary"
                        @click="moreDurationDialogVisible = false"
                    />
                </div>
            </div>
        </Dialog>

        <!-- Check-In Dialog -->
        <Dialog
            v-model:visible="checkInDialogVisible"
            header="Confirm Check-In"
            :modal="true"
            :dismissable-mask="true"
            :draggable="false"
            :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
            style="width: 30vw"
        >
            <div>
                <p class="mb-4 text-xl font-bold">
                    {{ selectedRoom?.roomNumber || "N/A" }} |
                    {{ selectedRoom?.type || "N/A" }} |
                    {{ selectedRoom?.floor || "N/A" }}
                </p>
            </div>
            <div class="flex flex-col mt-4">
                <!-- Booking Details -->
                <p class="font-medium mb-2">
                    Guest Name:
                    {{ selectedRoom?.guestDetails?.guestName || "N/A" }}
                </p>
                <p class="font-medium mb-2">
                    Cellphone:
                    {{ selectedRoom?.guestDetails?.cellphone || "N/A" }}
                </p>
                <p>
                    Email:
                    {{ selectedRoom?.guestDetails?.guestEmail || "N/A" }}
                </p>
                <p class="font-medium mb-2">
                    Room Code:
                    {{ selectedRoom?.guestDetails?.roomCode || "N/A" }}
                </p>
                <p class="font-medium mb-2">
                    Booked on:
                    {{ selectedRoom.guestDetails?.createdAt ? formatDate(selectedRoom.guestDetails.createdAt) : "N/A" }}
                </p>
                <p class="font-medium mb-2">
                    Selected Hours:
                    {{ selectedRoom?.guestDetails?.selectedHours || "N/A" }}
                </p>
                <p class="font-medium">
                    Rate:
                    {{
                        guestDetails.selectedrate !== null
                            ? `₱${guestDetails.selectedrate}`
                            : "None"
                    }}
                </p>

                <p class="font-medium mb-2">
                    Check-In Date:
                    {{
                        checkInDate
                            ? new Date(checkInDate).toLocaleString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                            })
                            : "N/A"
                    }}
                </p>
                <p class="font-medium mb-2">
                    Check-Out Date:
                    {{
                        checkOutDate
                            ? new Date(checkOutDate).toLocaleString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                            })
                            : "N/A"
                    }}
                </p>
                <!-- Notes removed: bookings.notes no longer exists -->
            </div>
            <div class="flex justify-end mt-4">
                <Button
                    label="No"
                    class="p-button-primary w-full mr-2"
                    @click="checkInDialogVisible = false"
                />
                <Button
                    label="Yes"
                    class="p-button-primary w-full"
                    @click="openPaymentDialog(selectedRoom)"
                />
            </div>
        </Dialog>

        <!-- Payment Dialog -->
       <Dialog
  v-model:visible="paymentDialogVisible"
  header="Payment for Check-In"
  :modal="true"
  :dismissable-mask="true"
  :style="{ width: '90vw', maxWidth: '1400px' }"
  :breakpoints="{ '1600px': '80vw', '1200px': '85vw', '960px': '95vw', '640px': '98vw' }"
  maximizable
>

            <template #header>
                <div class="font-bold text-xl">
                    Payment for Room {{ selectedRoom?.roomNumber }}
                </div>
            </template>

           <div
  class="p-4 rounded-lg border
         bg-blue-50 text-blue-900 border-blue-200
         dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-700
         transition-colors duration-200"
>
    <div class="space-y-2">
      <h4 class="text-lg font-semibold">Details</h4>
      <div v-if="(selectedRoom?.guestDetails?.extendedHours || 0) > 0" class="inline-block px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
        Extended: +{{ selectedRoom.guestDetails.extendedHours }}h
      </div>
      <p>Guest Name: {{ selectedRoom?.guestDetails?.guestName || "N/A" }}</p>
      <p>Hours: {{ selectedRoom?.guestDetails?.selectedHours || "N/A" }} Hours</p>
      <p>Room Rate: {{ formatCurrency(selectedRoom?.guestDetails?.selectedrate || 0) }}</p>
    </div>
  </div>

  <!-- Simple POS: Search + Products + Cart (no history) -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
    <!-- Products -->
    <div class="border rounded-lg p-3">
      <div class="font-semibold mb-2">Consumables (POS)</div>
      <InputText v-model="productSearchQueryPD" placeholder="Search product..." class="w-full mb-3" />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto" style="max-height: 260px">
        <div
          v-for="p in filteredProductsPD"
          :key="p.id"
          class="p-3 border rounded-md"
        >
          <div class="font-medium">{{ p.name }}</div>
          <div class="text-xs opacity-70"> {{ p.brand || "—" }}</div>
          <div class="text-xs opacity-70">Stock: {{ p.stock }}</div>
          <div class="text-sm font-semibold mt-1">₱{{ Number(p.price).toFixed(2) }}</div>
          <Button
            label="Add"
            icon="pi pi-plus"
            class="p-button-primary mt-2 w-full"
            :disabled="p.stock <= 0"
            @click="addToCartPD(p)"
          />
        </div>
      </div>
    </div>

    <!-- Cart -->
    <div class="border rounded-lg p-3">
      <div class="font-semibold mb-2">Extras Cart</div>

      <DataTable
        :value="cartViewPD"
        class="p-datatable-sm"
        responsiveLayout="scroll"
        dataKey="vkey"
        :showGridlines="true"
        scrollable
        scrollHeight="220px"
      >
        <Column field="name" header="Product" />
        <Column field="brand" header="Brand">
  <template #body="{ data }">
    <span class="text-sm">{{ data.brand || '—' }}</span>
  </template>
</Column>
        <Column header="Qty" class="flex items-center justify-center">>
          <template #body="{ data }">
            <div class="flex items-center gap-1">
              <Button icon="pi pi-minus" class="p-button-text" @click.stop="decreaseBatchPD(data)" />
              <span class="inline-block min-w-[2ch] text-center">{{ data.quantity }}</span>
              <Button
                icon="pi pi-plus"
                class="p-button-text"
                :disabled="(cartPD.find(i => Number(i.id) === Number(data.id))?.quantity || 0) >= (stockByIdPD.get(Number(data.id)) || 0)"
                @click.stop="increaseBatchPD(data)"
              />
            </div>
          </template>
        </Column>
        <Column header="Unit">
          <template #body="{ data }">₱{{ Number(data.unitPrice ?? uiUnitPricePD(data)).toFixed(2) }}</template>
        </Column>
        <Column header="Subtotal">
          <template #body="{ data }">₱{{ Number(data.subtotal ?? uiSubtotalPD(data)).toFixed(2) }}</template>
        </Column>
        <Column header="Action" class="flex items-center justify-center">
          <template #body="{ data }">
            <Button icon="pi pi-trash" class="p-button-danger p-button-text" @click.stop="removeBatchPD(data)" />
          </template>
        </Column>
      </DataTable>

      <div class="text-right mt-3">
        <div> Total: <span class="font-semibold">₱{{ Number(uiTotalExtrasPD).toFixed(2) }}</span></div>
      </div>
    </div>

  </div>

  <!-- Payment inputs + Totals -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <div class="space-y-2 mt-5">
        <!-- Amenities for Rent -->
      <div class="border rounded-lg p-3">
        <div class="flex items-center justify-between mb-2">
          <span class="font-semibold">Amenities Rent</span>
        </div>
        <InputText v-model="amenitiesSearch" placeholder="Search amenity..." class="w-full mb-2" />
        <div class="space-y-2 overflow-y-auto" style="max-height: 220px">
          <label v-for="a in filteredAmenitiesPD" :key="a.serial_id" class="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
            <Checkbox v-model="selectedAmenityIds" :inputId="`amen-${a.serial_id}`" :value="a.serial_id" />
            <div class="flex-1">
              <div class="font-medium text-sm">{{ a.product_name }} <span class="opacity-60">#{{ a.serial_number }}</span></div>
              <div class="text-xs opacity-60">{{ a.brand || '—' }}</div>
            </div>
            <div class="text-sm font-semibold">₱{{ Number(a.unit_rental_price).toFixed(2) }}</div>
          </label>
        </div>
      </div>

      
       <div :class="['rounded-lg p-3 border', discountHighlightClass]">
<div class="flex flex-col gap-3">
  <span class="font-medium">Discount</span>
  
  <!-- Discount Type Dropdown -->
  <div class="flex flex-col md:flex-row md:items-center gap-3">
    <Dropdown
      v-model="discountType"
      :options="discountTypeOptions"
      optionLabel="label"
      optionValue="value"
      placeholder="Select discount type"
      class="w-full md:w-64"
    />
  </div>
  
  <!-- Percentage Discount Section -->
  <div v-if="discountType === 'percentage'" class="flex flex-col md:flex-row md:items-center gap-3">
    <Dropdown
      v-model="selectedDiscountId"
      :options="activeDiscounts"
      optionLabel="name"
      optionValue="id"
      placeholder="Select promo"
      class="w-full md:w-80"
      :showClear="true"
    />
    <span v-if="selectedDiscount" class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
      {{ selectedDiscount.name }} – {{ Number(selectedDiscount.percent) }}%
    </span>
  </div>
  
  <!-- Manual Discount Section -->
  <div v-if="discountType === 'manual'" class="flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <InputNumber
        v-model="manualDiscountAmount"
        mode="decimal"
        placeholder="Enter amount"
        class="w-32"
        :min="0"
        :max="roomRate"
        prefix="₱"
      />
    </div>

    <div v-if="manualDiscountAmount > 0" class="mt-1">
      <span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
        Manual Discount – ₱{{ Number(manualDiscountAmount).toFixed(2) }}
      </span>
    </div>
  </div>
</div>
</div>
      <!-- Additional Person Section -->
      <div class="border rounded-lg p-3">
        <div class="font-semibold mb-3">Additional Person</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Number of Additional Persons</label>
            <InputNumber
              v-model="additionalPersonCount"
              :min="0"
              :max="10"
              buttonLayout="horizontal"
              class="w-full"
              placeholder="0"
            />
          </div>
          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Price per Additional Person (₱)</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₱</span>
              <InputText
                v-model="additionalPersonPrice"
                placeholder="250.00"
                type="number"
                class="w-full pl-8 text-right"
                :min="0"
              />
            </div>
          </div>
        </div>
        <div v-if="Number(additionalPersonCount) > 0 && Number(additionalPersonPrice) > 0" class="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/30 dark:border-blue-700">
          <div class="text-sm text-blue-800 dark:text-blue-200">
            <strong>{{ additionalPersonCount }} additional person(s) × ₱{{ Number(additionalPersonPrice).toFixed(2) }} = ₱{{ Number(totalAdditionalPersonCharge).toFixed(2) }}</strong>
          </div>
        </div>
      </div>

      <div class="border rounded-lg p-3">
        <div class="font-semibold mb-2">Note</div>
        <textarea
          v-model="paymentDetails.note"
          rows="3"
          placeholder="e.g., No change available; will return ₱20 later."
          class="w-full p-2 border rounded-md focus:outline-none focus:ring"
        ></textarea>
      </div>
      
    </div>
        
    <div class="space-y-2 mt-5">
      
        <!-- Amenities Cart -->
        <div class="border rounded-lg p-3">
          <div class="flex items-center justify-between mb-2">
            <div class="font-semibold mb-2">Amenities Cart</div>
          </div>

          <DataTable
            
            :value="selectedAmenitiesPD"
            class="p-datatable-sm"
            responsiveLayout="scroll"
            :showGridlines="true"
            scrollable
            scrollHeight="220px"
          >
            <Column field="name" header="Amenity" />
            <Column field="brand" header="Brand">
              <template #body="{ data }">
                <span class="text-sm">{{ data.brand || '—' }}</span>
              </template>
            </Column>
            <Column field="serial" header="Serial" />
            <Column field="price" header="Price">
              <template #body="{ data }">{{ formatCurrency(data.price) }}</template>
            </Column>
            <Column header="Action" class="flex items-center justify-center text-center">
              <template #body="{ data }">
                <Button icon="pi pi-trash" class=" p-button-danger p-button-text" @click="removeAmenityPD(data.id)" />
              </template>
            </Column>
          </DataTable>
          
           <div class="text-right mt-3">
        <div>Total: <span class="font-semibold">₱{{ Number(uiTotalAmenitiesPD).toFixed(2) }}</span></div>
      </div>
        
        </div>

        <div :class="['rounded-lg p-3 border', paymentHighlightClass]">
        <div class="flex items-center justify-between mb-2">
          <div class="font-semibold">Payment</div>
          <div class="text-sm font-bold">Total: {{ formatCurrency(totalAmountDue) }}</div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Deposit Amount</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₱</span>
              <InputText 
                v-model="paymentDetails.deposit" 
                placeholder="0.00" 
                type="number" 
                class="w-full pl-8 text-right"
              />
            </div>
          </div>
          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Amount</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₱</span>
              <InputText
                v-model="paymentDetails.amountReceived"
                placeholder="0.00"
                type="number"
                :class="['w-full pl-8 text-right', { 'p-invalid': isAmountInsufficient }]"
              />
            </div>
          </div>
        </div>
        <div v-if="isAmountInsufficient" class="text-xs text-red-700 mt-1">Insufficient amount received.</div>
      </div>

      <div
  class="p-4 rounded-lg border
         bg-blue-50 text-blue-900 border-blue-200
         dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-700
         transition-colors duration-200"
>
  <div class="font-semibold mb-2">Summary</div>
  <!-- Room price -->
  <div class="flex items-center justify-between">
    <span>Room Rate</span>
    <div class="text-right">
      <template v-if="discountType === 'manual' && manualDiscountAmount > 0">
        <div class="inline-flex items-center gap-1">
          <span class="price-old">{{ formatCurrency(roomRate) }}</span>
          <span class="discount-pill">-₱{{ manualDiscountAmount }}</span>
        </div>
        <div class="price-new">{{ formatCurrency(discountedRoomRate) }}</div>
      </template>
      <template v-else-if="selectedDiscount">
        <div class="inline-flex items-center gap-1">
          <span class="price-old">{{ formatCurrency(roomRate) }}</span>
          <span class="discount-pill">-{{ Number(roomDiscountPercent) }}%</span>
        </div>
        <div class="price-new">{{ formatCurrency(discountedRoomRate) }}</div>
      </template>
      <template v-else>
        <div class="price-new">{{ formatCurrency(roomRate) }}</div>
      </template>
    </div>
  </div>

  <!-- Extras & deposit -->
  <div class="flex items-center justify-between py-1">
    <span>Extras</span>
    <span class="font-semibold">₱{{ Number(uiTotalExtrasPD).toFixed(2) }}</span>
  </div>
  <div class="flex items-center justify-between py-1">
    <span>Amenities Rent</span>
    <span class="font-semibold">₱{{ Number(uiTotalAmenitiesPD).toFixed(2) }}</span>
  </div>
  <div v-if="Number(totalAdditionalPersonCharge) > 0" class="flex items-center justify-between py-1">
    <span>Additional Person ({{ additionalPersonCount }})</span>
    <span class="font-semibold">₱{{ Number(totalAdditionalPersonCharge).toFixed(2) }}</span>
  </div>
  <div class="flex items-center justify-between py-1">
    <span>Deposit</span>
    <span class="font-semibold">₱{{ Number(paymentDetails.deposit || 0).toFixed(2) }}</span>
  </div>

  <hr />

  <!-- Totals -->
  <div class="flex items-center justify-between text-lg font-bold">
    <span>Total Due</span>
    <span>{{ formatCurrency(totalAmountDue) }}</span>
  </div>

  <div class="flex items-center justify-between mt-1">
    <span>Change</span>
    <span class="font-semibold" :class="{ 'text-red-600': isAmountInsufficient, 'text-green-700': !isAmountInsufficient }">
      {{ formatCurrency(calculateChange) }}
    </span>
  </div>

  <div v-if="isAmountInsufficient" class="text-red-500 text-xs">
    Insufficient amount received.
  </div>
</div>
</div>
  </div>

            <!-- Action Buttons -->
            <div class="flex gap-4 mt-6">
                <Button
                    label="Cancel"
                    severity="primary"
                    class="flex-1"
                    @click="
                        paymentDialogVisible = false;
                        resetPaymentForm();
                    "
                />
                <Button
                    label="Confirm Payment & Check-In"
                    icon="pi pi-check"
                    class="flex-1 p-button-primary"
                    :disabled="isAmountInsufficient"
                    @click="openConfirmPayment"
                />
            </div>
        </Dialog>

        <!-- Confirm Payment Summary Dialog -->
        <Dialog
          v-model:visible="confirmPaymentDialogVisible"
          header="Confirm Payment"
          :modal="true"
          :dismissable-mask="true"
          :style="{ width: '30vw', maxWidth: '1200px' }"
        >
          <div class="space-y-4">
            <div class="rounded-lg border p-4 bg-white dark:bg-slate-900">
              <div class="text-lg font-semibold mb-3">Review & Confirm</div>

              <!-- Guest -->
              <div class="mb-3">
                <div class="text-xs uppercase tracking-wide text-gray-500 mb-1">Guest</div>
                <div class="text-sm">Name: <strong>{{ selectedRoom?.guestDetails?.guestName || 'N/A' }}</strong></div>
                <div class="text-sm">Room: <strong>{{ selectedRoom?.roomNumber || '—' }}</strong></div>
                <div class="text-sm">Hours: <strong>{{ selectedRoom?.guestDetails?.selectedHours || 0 }}</strong></div>
              </div>

              <!-- Rate / Discount -->
              <div class="border-t pt-3 mb-3">
                <div class="text-xs uppercase tracking-wide text-gray-500 mb-1">Rate</div>
                <div class="flex items-center justify-between">
                  <span class="text-sm">Room:</span>
                  <template v-if="discountType === 'manual' && manualDiscountAmount > 0">
                    <div class="text-right">
                      <div class="inline-flex items-center gap-1">
                        <span class="price-old">{{ formatCurrency(roomRate) }}</span>
                        <span class="discount-pill">-₱{{ manualDiscountAmount }}</span>
                      </div>
                      <div class="price-new mt-1">{{ formatCurrency(discountedRoomRate) }}</div>
                    </div>
                  </template>
                  <template v-else-if="selectedDiscount">
                    <div class="text-right">
                      <div class="inline-flex items-center gap-1">
                        <span class="price-old">{{ formatCurrency(roomRate) }}</span>
                        <span class="discount-pill">-{{ Number(roomDiscountPercent) }}%</span>
                      </div>
                      <div class="price-new mt-1">{{ formatCurrency(discountedRoomRate) }}</div>
                    </div>
                  </template>
                  <template v-else>
                    <span class="font-semibold">{{ formatCurrency(roomRate) }}</span>
                  </template>
                </div>
                <div v-if="discountBadgeText" class="mt-1 inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs">{{ discountBadgeText }}</div>
              </div>

              <!-- Extras -->
              <div class="border-t pt-3 mb-3">
                <div class="flex items-center justify-between">
                  <div class="text-xs uppercase tracking-wide text-gray-500">Extras</div>
                  <div class="text-m"> <strong>{{ formatCurrency(uiTotalExtrasPD) }}</strong></div>
                </div>
                <div class="mt-1 space-y-1">
                  <div v-if="extrasListTop.length" class="text-sm">
                    <div v-for="(t, idx) in extrasListTop" :key="idx">• {{ t }}</div>
                    <div v-if="extrasOverflow > 0" class="text-xs text-gray-500">+ {{ extrasOverflow }} more</div>
                  </div>
                  <div v-else class="text-sm opacity-60">None</div>
                </div>
              </div>

              <!-- Amenities -->
              <div class="border-t pt-3 mb-3">
                <div class="flex items-center justify-between">
                  <div class="text-xs uppercase tracking-wide text-gray-500">Amenities</div>
                  <div class="text-m"> <strong>{{ formatCurrency(uiTotalAmenitiesPD) }}</strong></div>
                </div>
                <div class="mt-1 space-y-1">
                  <div v-if="amenitiesListTop.length" class="text-sm">
                    <div v-for="(t, idx) in amenitiesListTop" :key="idx">• {{ t }}</div>
                    <div v-if="amenitiesOverflow > 0" class="text-xs text-gray-500">+ {{ amenitiesOverflow }} more</div>
                  </div>
                  <div v-else class="text-sm opacity-60">None</div>
                </div>
              </div>

              <!-- Payment -->
              <div class="border-t pt-3 mb-3">
                <div class="text-xs uppercase tracking-wide text-gray-500 mb-1">Payment</div>
                <div class="text-sm flex items-center justify-between">
                  <span>Room Rate</span>
                  <strong>
                    <template v-if="(discountType === 'manual' && manualDiscountAmount > 0) || selectedDiscount">
                      {{ formatCurrency(discountedRoomRate) }}
                    </template>
                    <template v-else>
                      {{ formatCurrency(roomRate) }}
                    </template>
                  </strong>
                </div>
                <div class="text-sm flex items-center justify-between">
                  <span>Extras</span>
                  <strong>{{ formatCurrency(uiTotalExtrasPD) }}</strong>
                </div>
                <div class="text-sm flex items-center justify-between">
                  <span>Rent</span>
                  <strong>{{ formatCurrency(uiTotalAmenitiesPD) }}</strong>
                </div>
                <div class="text-sm flex items-center justify-between">
                  <span>Deposit</span>
                  <strong>{{ formatCurrency(paymentDetails.deposit) }}</strong>
                </div>
                  <hr />
                <div class="text-xl flex items-center justify-between">
                  <span>Total Due</span>
                  <strong>{{ formatCurrency(totalAmountDue) }}</strong>
                </div>
                <div class="text-m flex items-center justify-between">
                  <span>Amount Received</span>
                  <strong>{{ formatCurrency(paymentDetails.amountReceived) }}</strong>
                </div>
                <div class="text-2xl flex items-center justify-between text-green-600">
                  <span>Change</span>
                  <strong :class="{ 'text-red-600': isAmountInsufficient, 'text-green-600': !isAmountInsufficient }">{{ formatCurrency(calculateChange) }}</strong>
                </div>
              </div>

              <!-- Note -->
              <div class="border-t pt-3">
                <div class="text-xs uppercase tracking-wide text-gray-500 mb-1">Note</div>
                <div class="text-sm whitespace-pre-line border rounded p-2">{{ paymentDetails.note || '—' }}</div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-4 mt-6">
            <Button
              label="Back"
              class="flex-1"
              @click="confirmPaymentDialogVisible = false"
            />
            <Button
              label="Confirm & Check-In"
              icon="pi pi-check"
              class="flex-1 p-button-primary"
              :disabled="isAmountInsufficient"
              @click="confirmAndCheckIn"
            />
          </div>
        </Dialog>

        <!-- Checkout Dialog -->

        <Dialog
            v-model:visible="checkoutDialogVisible"
            header="Room Checkout"
            :modal="true"
            :dismissable-mask="true"
            style="width: 70vh"
        >
            <template #header>
                <div class="font-bold text-xl">
                    Checkout: Room {{ selectedRoom.roomNumber }}
                </div>
            </template>

            <div class="p-4 space-y-4">
                <!-- Guest Information -->
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-600 dark:text-gray-300">
                        Guest Name
                    </label>
                    <InputText
                        :modelValue="selectedRoom.guestDetails?.guestName || 'N/A'"
                        class="w-full"
                        readonly
                    />
                </div>

                <!-- Contact Number -->
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-600 dark:text-gray-300">
                        Room Code:
                    </label>
                    <InputText
                        :modelValue="selectedRoom.guestDetails?.roomCode || 'N/A'"
                        class="w-full"
                        readonly
                    />
                </div>

                <div class="space-y-4">
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <div class="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">Assigned Amenities</div>
                      <span v-if="checkoutDamagedSerialIds.length" class="text-xs font-semibold text-red-600 dark:text-red-400">{{ checkoutDamagedSerialIds.length }} damaged</span>
                    </div>
                    <div v-if="checkoutAmenitiesLoading" class="text-sm text-gray-500 dark:text-gray-400">Loading assigned amenities...</div>
                    <div v-else-if="checkoutAmenitiesError" class="text-sm text-red-600 dark:text-red-400">{{ checkoutAmenitiesError }}</div>
                    <div v-else-if="checkoutAssignedAmenities.length" class="max-h-32 overflow-y-auto space-y-2 pr-1">
                      <div
                        v-for="(amenity, idx) in checkoutAssignedAmenities"
                        :key="amenity.serial_id ?? amenity.id ?? idx"
                        :class="['border rounded-md p-2 text-sm transition-colors', amenity.damaged ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800']"
                      >
                        <div class="flex items-start justify-between gap-2">
                          <div class="space-y-0.5">
                            <div class="font-semibold text-xs uppercase tracking-wide text-gray-600 dark:text-gray-300">{{ amenity.product_name || amenity.amenity_name || ('Amenity ' + (idx + 1)) }}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-2">
                              <span v-if="amenity.brand">Brand: {{ amenity.brand }}</span>
                              <span v-if="amenity.product_type">Type: {{ amenity.product_type }}</span>
                              <span v-if="amenity.serial_number">SN: {{ amenity.serial_number }}</span>
                            </div>
                          </div>
                          <span
                            v-if="amenity.status || amenity.damaged"
                            class="text-[10px] px-2 py-0.5 rounded-full border self-start"
                            :class="amenity.damaged ? 'border-red-300 text-red-600 bg-red-50 dark:border-red-700 dark:text-red-400 dark:bg-red-900/20' : 'border-gray-300 text-gray-600 bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:bg-gray-800'"
                          >
                            {{ amenity.damaged ? 'Damaged (pending)' : (amenity.status || 'Assigned') }}
                          </span>
                        </div>
                        <div class="flex items-center gap-2 mt-2 text-xs">
                          <Checkbox
                            :binary="true"
                            v-model="amenity.damaged"
                            :inputId="`checkout-damage-${idx}`"
                            @change="toggleCheckoutAmenityDamage(amenity)"
                          />
                          <label :for="`checkout-damage-${idx}`" class="font-medium">Mark as damaged</label>
                        </div>
                      </div>
                    </div>
                    <div v-else class="text-sm opacity-60">No assigned amenities found.</div>
                  </div>
                  <div>
                    <div class="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Consumables</div>
                    <div v-if="(selectedRoom.guestDetails?.extrasItems || []).length" class="space-y-1 text-sm">
                      <div
                        v-for="(it, i) in selectedRoom.guestDetails.extrasItems"
                        :key="`checkout-extra-${i}`"
                        class="flex items-center justify-between"
                      >
                        <span>{{ it.name }}<span v-if="it.brand" class="opacity-60"> ({{ it.brand }})</span> {{ it.quantity }}x</span>
                        <span>{{ formatCurrency(it.price) }}</span>
                      </div>
                    </div>
                    <div v-else class="text-sm opacity-60">No consumables.</div>
                  </div>
                  <div>
                    <div class="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Amenities</div>
                    <div v-if="(selectedRoom.guestDetails?.amenitiesItems || []).length" class="space-y-1 text-sm">
                      <div
                        v-for="(a, i) in selectedRoom.guestDetails.amenitiesItems"
                        :key="`checkout-amenity-${i}`"
                        class="flex items-center justify-between"
                      >
                        <span>{{ a.amenity_name }}<span v-if="a.serial_number" class="opacity-60"> #{{ a.serial_number }}</span></span>
                        <span>{{ formatCurrency(a.unit_rental_price) }}</span>
                      </div>
                    </div>
                    <div v-else class="text-sm opacity-60">No amenities.</div>
                  </div>
                  <div class="border rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800 dark:border-gray-700">
                    <div class="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">Payment</div>
                    <div class="flex items-center justify-between text-sm">
                      <span>Room Rate</span>
                      <span class="flex items-center gap-2">
                        <template v-if="Number(occDiscountPercent || 0) > 0">
                          <span class="price-old">{{ formatCurrency(occBaseRoomRate) }}</span>
                          <span class="discount-pill">
                            {{ occDiscountName || "Promo" }} -{{ Number(occDiscountPercent) }}%
                          </span>
                          <span class="price-new">{{ formatCurrency(occRoomRate) }}</span>
                        </template>
                        <strong v-else>{{ formatCurrency(occRoomRate) }}</strong>
                      </span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                      <span>Consumables</span>
                      <strong>{{ formatCurrency(occExtras) }}</strong>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                      <span>Amenities Rent</span>
                      <strong>{{ formatCurrency(occRent) }}</strong>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                      <span>Extend</span>
                      <div class="flex items-center gap-2">
                        <span v-if="occExtendHours" class="text-xs font-semibold text-amber-700">+{{ occExtendHours }}h</span>
                        <strong>{{ formatCurrency(occExtend) }}</strong>
                      </div>
                    </div>
                    <div class="flex items-center justify-between text-sm gap-3">
                      <span>Damage Charges</span>
                      <div class="flex items-center gap-2">
                        <InputNumber
                          v-model="checkoutDamageCharges"
                          mode="currency"
                          currency="PHP"
                          :min="0"
                          :maxFractionDigits="2"
                          input-class="w-28 text-right"
                          class="w-32"
                        />
                        
                      </div>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                      <span>Deposit Collected</span>
                      <strong>{{ formatCurrency(checkoutDepositOriginalNumber) }}</strong>
                    </div>
                    <div class="flex items-center justify-between text-xl p-2 rounded-md border bg-green-50 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-200 dark:border-green-700">
                      <span>Total Due</span>
                      <strong>{{ formatCurrency(occTotalDue) }}</strong>
                    </div>
                    <div class="flex items-center justify-between text-sm font-semibold bg-amber-100 text-amber-900 border border-amber-300 rounded-lg px-3 py-2 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-700">
                      <span>Deposit Returned</span>
                      <strong>{{ formatCurrency(checkoutRefundToGuest) }}</strong>
                    </div>
                    <div
                      v-if="checkoutDamageShortfall > 0 && !isPaymentConfirmed"
                      class="flex items-center justify-between text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 dark:text-red-200 dark:bg-red-900/20 dark:border-red-700"
                    >
                      <span>Additional Payment Due</span>
                      <strong>{{ formatCurrency(checkoutDamageShortfall) }}</strong>
                    </div>
                    
                    <!-- Additional Payment Button Section (only show if there's a shortfall) -->
                    <div v-if="checkoutDamageShortfall > 0" class="border-t pt-3">
                      <Button
                        v-if="!isPaymentConfirmed"
                        icon="pi pi-wallet"
                        label="Process Additional Payment"
                        severity="warning"
                        class="w-full mb-3"
                        @click="showAdditionalPaymentDialog = true"
                      />
                      
                      <div 
                        v-if="isPaymentConfirmed" 
                        class="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-700 flex items-center gap-2"
                      >
                        <i class="pi pi-check-circle"></i>
                        <div>
                          <div class="font-semibold">Payment Complete</div>
                          <div class="mt-1">Amount Received: {{ formatCurrency(checkoutAdditionalPaymentReceived) }}</div>
                          <div v-if="checkoutAdditionalPaymentChange > 0">Change to Return: {{ formatCurrency(checkoutAdditionalPaymentChange) }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                </div>

            <div class="flex gap-4 mt-6">
                <Button
                    label="Cancel"
                    severity="primary"
                    class="flex-1"
                    @click="checkoutDialogVisible = false"
                />
                <Button
                    label="Confirm Checkout"
                    icon="pi pi-check"
                    class="flex-1 p-button-primary"
                    :disabled="selectedRoom.selectedrate == null || !canProceedWithCheckout"
                    @click="confirmCheckout"
                />
            </div>
        </Dialog>
        
        <!-- Additional Payment Dialog -->
        <Dialog
            v-model:visible="showAdditionalPaymentDialog"
            header="Process Additional Payment"
            :modal="true"
            :dismissable-mask="true"
            style="width: 450px"
        >
            <div class="space-y-4 p-4">
                <!-- Amount Due -->
                <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                    <div class="text-sm text-red-700 dark:text-red-300 mb-1">Amount Due</div>
                    <div class="text-2xl font-bold text-red-800 dark:text-red-200">
                        {{ formatCurrency(checkoutDamageShortfall) }}
                    </div>
                </div>
                
                <!-- Amount Received Input -->
                <div class="space-y-2">
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Amount Received from Guest
                    </label>
                    <InputNumber
                        v-model="checkoutAdditionalPaymentReceived"
                        mode="currency"
                        currency="PHP"
                        :min="0"
                        :maxFractionDigits="2"
                        input-class="w-full text-right text-lg"
                        class="w-full"
                        placeholder="0.00"
                        :autofocus="true"
                    />
                </div>
                
                <!-- Change Display -->
                <div 
                    v-if="checkoutAdditionalPaymentReceived > 0"
                    class="rounded-lg p-4 border"
                    :class="checkoutAdditionalPaymentChange >= 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'"
                >
                    <div class="text-sm mb-1" :class="checkoutAdditionalPaymentChange >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'">
                        {{ checkoutAdditionalPaymentChange >= 0 ? 'Change to Return' : 'Insufficient Payment' }}
                    </div>
                    <div class="text-2xl font-bold" :class="checkoutAdditionalPaymentChange >= 0 ? 'text-blue-800 dark:text-blue-200' : 'text-red-800 dark:text-red-200'">
                        {{ formatCurrency(Math.abs(checkoutAdditionalPaymentChange)) }}
                    </div>
                    <div v-if="checkoutAdditionalPaymentChange < 0" class="text-xs mt-2 text-red-600 dark:text-red-400">
                        Still need: {{ formatCurrency(Math.abs(checkoutAdditionalPaymentChange)) }}
                    </div>
                </div>
                
                <!-- Payment Status -->
                <div 
                    v-if="isPaymentConfirmed" 
                    class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 flex items-center gap-2 text-green-700 dark:text-green-300"
                >
                    <i class="pi pi-check-circle text-lg"></i>
                    <span class="text-sm font-semibold">Payment Complete - Ready to Checkout</span>
                </div>
            </div>
            
            <template #footer>
                <div class="flex gap-2 justify-end">
                    <Button
                        label="Cancel"
                        severity="secondary"
                        @click="showAdditionalPaymentDialog = false"
                    />
                    <Button
                        label="Confirm Payment"
                        icon="pi pi-check"
                        severity="success"
                        :disabled="!isCheckoutPaymentComplete"
                        @click="confirmAdditionalPayment"
                    />
                </div>
            </template>
        </Dialog>
        
      <!-- Add Consumables & Amenities dialog -->
        <Dialog
            v-model:visible="occExtrasDialogVisible"
            header="Add Consumables & Amenities"
            :modal="true"
            :dismissable-mask="true"
            :style="{ width: '90vw', maxWidth: '1200px' }"
            :breakpoints="{ '1200px': '95vw', '960px': '98vw' }"
        >
          <div class="space-y-4">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div class="border rounded-lg p-3">
                <div class="flex items-center justify-between mb-3">
                  <span class="font-semibold">Consumables</span>
                  <InputText v-model="occProductSearch" placeholder="Search product..." class="w-48" />
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto" style="max-height: 260px">
                  <div
                    v-for="p in occFilteredProducts"
                    :key="p.id"
                    class="p-3 border rounded-md"
                  >
                    <div class="font-medium">{{ p.name }}</div>
                    <div class="text-xs opacity-70">{{ p.brand || '—' }}</div>
                    <div class="text-xs opacity-70">Stock: {{ p.stock }}</div>
                    <div class="text-sm font-semibold mt-1">{{ formatCurrency(p.price) }}</div>
                    <Button
                      label="Add"
                      icon="pi pi-plus"
                      class="p-button-primary mt-2 w-full"
                      :disabled="Number(p.stock || 0) <= 0"
                      @click="occAdjustProductQty(p.id, 1)"
                    />
                  </div>
                </div>
              </div>

              <div class="border rounded-lg p-3">
                <div class="flex items-center justify-between mb-3">
                  <span class="font-semibold">Cart</span>
                  <span class="text-sm text-slate-500">Total: {{ formatCurrency(occCartTotal) }}</span>
                </div>
                <DataTable
                  :value="occCartView"
                  class="p-datatable-sm"
                  :showGridlines="true"
                  dataKey="vkey"
                  responsiveLayout="scroll"
                  scrollable
                  scrollHeight="220px"
                >
                  <Column field="name" header="Product" />
                  <Column field="brand" header="Brand">
                    <template #body="{ data }">
                      <span class="text-sm">{{ data.brand || '—' }}</span>
                    </template>
                  </Column>
                  <Column header="Qty">
                    <template #body="{ data }">
                      <div class="flex items-center gap-1">
                        <Button icon="pi pi-minus" class="p-button-text" @click.stop="occDecreaseProduct(data)" />
                        <span class="inline-block min-w-[2ch] text-center">{{ data.quantity }}</span>
                        <Button
                          icon="pi pi-plus"
                          class="p-button-text"
                          @click.stop="occIncreaseProduct(data)"
                        />
                      </div>
                    </template>
                  </Column>
                  <Column header="Unit">
                    <template #body="{ data }">{{ formatCurrency(data.unitPrice ?? occUnitPrice(data)) }}</template>
                  </Column>
                  <Column header="Subtotal">
                    <template #body="{ data }">{{ formatCurrency(data.subtotal ?? occSubtotal(data)) }}</template>
                  </Column>
                  <Column header="Action">
                    <template #body="{ data }">
                      <Button icon="pi pi-trash" class="p-button-danger p-button-text" @click.stop="occRemoveProduct(data)" />
                    </template>
                  </Column>
                </DataTable>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div class="border rounded-lg p-3">
                <div class="flex items-center justify-between mb-3">
                  <span class="font-semibold">Amenities</span>
                  <InputText v-model="occAmenitiesSearch" placeholder="Search amenity..." class="w-48" />
                </div>
                <div class="space-y-2 overflow-y-auto" style="max-height: 220px">
                  <label
                    v-for="a in occFilteredAmenities"
                    :key="a.serial_id"
                    class="flex items-center gap-2 p-2 rounded hover:bg-gray-50"
                  >
                    <Checkbox v-model="occSelectedAmenityIds" :value="a.serial_id" />
                    <div class="flex-1">
                      <div class="font-medium text-sm">{{ a.product_name }} <span class="opacity-60">#{{ a.serial_number }}</span></div>
                      <div class="text-xs opacity-60">{{ a.brand || '—' }}</div>
                    </div>
                    <div class="text-sm font-semibold">{{ formatCurrency(a.unit_rental_price) }}</div>
                  </label>
                </div>
              </div>

              <div class="space-y-4">
                <div class="border rounded-lg p-3">
                  <div class="font-semibold mb-2">Amenities Cart</div>
                  <DataTable
                    :value="occSelectedAmenities"
                    class="p-datatable-sm"
                    :showGridlines="true"
                    dataKey="id"
                    responsiveLayout="scroll"
                    scrollable
                    scrollHeight="220px"
                  >
                    <Column field="amenity_name" header="Amenity" />
                    <Column field="brand" header="Brand">
                      <template #body="{ data }">
                        <span class="text-sm">{{ data.brand || '—' }}</span>
                      </template>
                    </Column>
                    <Column field="serial_number" header="Serial" />
                    <Column field="unit_rental_price" header="Price">
                      <template #body="{ data }">{{ formatCurrency(data.unit_rental_price) }}</template>
                    </Column>
                    <Column header="Action">
                      <template #body="{ data }">
                        <Button icon="pi pi-trash" class="p-button-danger p-button-text" @click.stop="occRemoveAmenity(data.id)" />
                      </template>
                    </Column>
                  </DataTable>
                  <div class="text-right mt-3">
                    <div>Total: <span class="font-semibold">{{ formatCurrency(occAmenitiesTotal) }}</span></div>
                  </div>
                </div>

                <div class="border rounded-lg p-3 space-y-3">
                  <div class="text-sm uppercase tracking-wide text-gray-500">Summary</div>
                  <div class="flex items-center justify-between mt-2 text-sm">
                    <span>Consumables</span>
                    <strong>{{ formatCurrency(occCartTotal) }}</strong>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span>Amenities</span>
                    <strong>{{ formatCurrency(occAmenitiesTotal) }}</strong>
                  </div>
                  <div class="flex items-center justify-between text-lg font-bold mt-2">
                    <span>Total Add-on</span>
                    <span>{{ formatCurrency(occCartTotal + occAmenitiesTotal) }}</span>
                  </div>
                  <div class="flex items-center justify-between text-sm mt-3">
                    <span>Amount Received</span>
                    <InputNumber
                      v-model="occAmountReceived"
                      mode="currency"
                      currency="PHP"
                      :min="0"
                      :maxFractionDigits="2"
                      input-class="w-32 text-right"
                    />
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span>Change</span>
                    <strong :class="occIsInsufficient ? 'text-red-600' : 'text-green-700'">
                      {{ formatCurrency(occIsInsufficient ? 0 : occChangeDelta) }}
                    </strong>
                  </div>
                  <div v-if="occIsInsufficient" class="text-xs text-red-600 text-right">Insufficient amount received.</div>
                </div>
              </div>
            </div>
          </div>

          <template #footer>
            <Button label="Cancel" class="p-button-text" @click="occExtrasDialogVisible = false" />
            <Button
              label="Add"
              icon="pi pi-check"
              class="p-button-primary"
              :disabled="(!occPayloadItems.length && !occSelectedAmenityIds.length) || occIsInsufficient"
              @click="confirmOccupiedExtras"
            />
          </template>
        </Dialog>

        <!-- Extend Stay Dialog -->
        <Dialog
            v-model:visible="extendDialogVisible"
            header="Extend Stay"
            :modal="true"
            :dismissable-mask="true"
            style="width: 70vh"
        >
            <template #header>
                <div class="font-bold text-xl">
                    Extend Stay for Room {{ selectedRoom.roomNumber }}
                </div>
            </template>

            <!-- Extend Stay Dialog body -->
<div class="p-4 space-y-4">
  <div class="space-y-2">
    <div class="flex items-center justify-between mb-3">
        <label class="block text-sm font-medium text-gray-600">
            Select Extension Hours:
        </label>
        <Button
            label="More Stay Duration"
            class="p-button-outlined p-button-sm"
            icon="pi pi-calendar-plus"
            @click="openExtendMoreDurationDialog"
        />
    </div>
    
    <!-- Highlight selected extended duration -->
    <div v-if="selectedExtendDuration" class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/30 dark:border-blue-700">
        <div class="flex items-center gap-2 text-sm">
            <i class="pi pi-check-circle text-blue-600 dark:text-blue-400"></i>
            <span class="font-medium text-blue-900 dark:text-blue-100">
                Selected: {{ selectedExtendDuration.label }}
            </span>
        </div>
        <div class="mt-1 text-xs text-blue-700 dark:text-blue-300">
            {{ selectedExtendDuration.hours }} hours • {{ formatCurrency(selectedExtendDuration.rate) }}
        </div>
    </div>
    
    <Dropdown
      v-model="extendHoursSel"
      :options="[{label:'6 Hours', value:6},{label:'12 Hours', value:12},{label:'24 Hours', value:24}]"
      optionLabel="label"
      optionValue="value"
      placeholder="Select hours"
      class="w-full"
    />
  </div>

  <div class="space-y-2">
    <label class="block text-sm font-medium text-gray-600">Rate</label>
    <InputText
      :modelValue="formatCurrency(extendAmount)"
      class="w-full"
      readonly
    />
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-600">Amount Received</label>
      <InputNumber
        v-model="extendAmountReceived"
        mode="currency"
        currency="PHP"
        :min="0"
        :maxFractionDigits="2"
        input-class="w-full text-right"
        class="w-full"
        placeholder="Cash"
      />
      <p v-if="!extendAmountReceived" class="text-xs text-slate-500">Enter the cash received for this extension.</p>
      <p v-else-if="extendIsInsufficient" class="text-xs text-red-600">Amount received is insufficient.</p>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-600">Change</label>
      <div
        class="p-3 rounded-lg border text-right text-lg font-semibold"
        :class="extendHasAmount
          ? extendIsInsufficient
              ? 'border-red-300 text-red-600 bg-red-50 dark:border-red-700 dark:text-red-200 dark:bg-red-900/30'
              : 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-700 dark:text-emerald-200 dark:bg-emerald-900/30'
          : 'border-slate-200 text-slate-500 bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:bg-slate-900/30'"
      >
        {{ extendHasAmount ? formatCurrency(extendChange) : '—' }}
      </div>
      <p class="text-xs" v-if="extendHasAmount && extendIsInsufficient">
        <span class="text-red-600">Additional {{ formatCurrency(Math.abs(extendChange)) }} needed.</span>
      </p>
      <p class="text-xs text-slate-500" v-else-if="extendHasAmount">Return this amount to the guest.</p>
    </div>
  </div>
</div>

            <template #footer>
  <Button
    label="Cancel"
    class="p-button-secondary"
    @click="extendDialogVisible = false"
  />
  <Button
    label="Confirm Extension"
    icon="pi pi-check"
    class="p-button-primary"
    :disabled="!extendHoursSel || extendAmount <= 0 || !extendHasAmount || extendIsInsufficient"
    @click="openConfirmExtend"
  />
</template>
        </Dialog>

        <!-- Extend More Stay Duration Dialog -->
        <Dialog
            v-model:visible="extendMoreDurationDialogVisible"
            header="Select Extended Stay Duration"
            :modal="true"
            :dismissable-mask="true"
            :style="{ width: '800px' }"
            :breakpoints="{ '1024px': '90vw', '768px': '95vw', '640px': '98vw' }"
        >
            <div class="p-4">
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    <div
                        v-for="(rate, days) in extendDailyRates"
                        :key="days"
                        role="button"
                        tabindex="0"
                        :class="[
                            'p-4 border rounded-lg cursor-pointer select-none transition-colors text-center',
                            'bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50',
                            'dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800',
                            isSelectedExtendDays(days)
                                ? 'border-blue-500 bg-blue-50 text-blue-900 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-100'
                                : ''
                        ]"
                        @click="selectExtendDailyRateAndHours(days, rate)"
                        @keydown.enter="selectExtendDailyRateAndHours(days, rate)"
                        @keydown.space.prevent="selectExtendDailyRateAndHours(days, rate)"
                    >
                        <div class="font-semibold text-base mb-2">
                            {{ getDayLabel(days) }}
                        </div>
                        
                        <div class="text-sm text-neutral-700 dark:text-neutral-300 mb-1">
                            {{ getDaysCount(days) * 24 }} hours
                        </div>
                        
                        <div class="font-medium text-green-600 dark:text-green-400">
                            {{ formatCurrency(rate) }}
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>

        <Dialog
          v-model:visible="confirmExtendDialogVisible"
          header="Confirm Extension"
          :modal="true"
          :dismissable-mask="true"
          style="width: 420px"
        >
          <div class="space-y-4 p-2">
            <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/40">
              <div class="text-sm font-semibold text-slate-700 dark:text-slate-200">Guest & Room</div>
              <div class="mt-2 text-sm text-slate-600 dark:text-slate-300">
                <div>Room: <strong>{{ selectedRoom?.roomNumber || '—' }}</strong></div>
                <div>Guest: <strong>{{ selectedRoom?.guestDetails?.guestName || 'Walk-in Guest' }}</strong></div>
              </div>
            </div>

            <div class="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/40">
              <div class="text-sm uppercase tracking-wide text-blue-700 dark:text-blue-200">Extension Details</div>
              <div class="mt-2 space-y-1 text-sm text-blue-900 dark:text-blue-100">
                <div>Additional Hours: <strong>{{ extendHoursSel || '—' }}</strong></div>
                <div>Extension Charge: <strong>{{ formatCurrency(extendAmount) }}</strong></div>
                <div>Amount Received: <strong>{{ formatCurrency(extendAmountReceived || 0) }}</strong></div>
                <div>
                  Change:
                  <strong :class="extendIsInsufficient ? 'text-red-600' : 'text-emerald-600'">
                    {{ formatCurrency(extendChange) }}
                  </strong>
                </div>
              </div>
            </div>

            <div class="text-xs text-slate-500 dark:text-slate-400">
              Please review the details above before confirming the stay extension.
            </div>
          </div>

          <template #footer>
            <Button label="Back" class="p-button-text" @click="confirmExtendDialogVisible = false" />
            <Button
              label="Confirm"
              icon="pi pi-check"
              class="p-button-primary"
              :disabled="extendIsInsufficient"
              @click="confirmExtension"
            />
          </template>
        </Dialog>
        <!-- Cleaning Confirmation Dialog -->
        <Dialog
            v-model:visible="cleaningConfirmationVisible"
            header="Confirm Cleaning Completion"
            :modal="true"
            style="width: 500px"
        >
            <div class="p-4">
                <p>
                    Are you sure you want to mark Room
                    {{ selectedRoom?.roomNumber }} as available?
                </p>
                <p class="text-sm text-gray-600 mt-2">
                    This action cannot be undone.
                </p>
            </div>

            <template #footer>
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    class="p-button-text"
                    @click="cleaningConfirmationVisible = false"
                />
                <Button
                    label="Confirm"
                    icon="pi pi-check"
                    class="p-button-primary"
                    @click="confirmCleaningCompletion"
                />
            </template>
        </Dialog>

        <!-- Sales Report Dialog -->
        <Dialog 
            v-model:visible="transactionReportDialogVisible" 
            header="Sales Report" 
            :modal="true" 
            class="w-5/6 max-w-6xl"
            :dismissable-mask="true"
        >
            <div class="space-y-4">
                <!-- Date and Time Selection -->

                <!-- Time Range Display -->
                <div v-if="transactionReportData.date_range" class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <div class="flex items-center justify-center gap-2">
                        <i class="pi pi-calendar text-gray-600"></i>
                        <span class="font-semibold text-gray-800">
                            <!-- Show date range -->
                            <span v-if="transactionReportData.date_range.start_datetime.split(' ')[0] !== transactionReportData.date_range.end_datetime.split(' ')[0]">
                                <span class="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm mr-2">Date Range</span>
                                {{ transactionReportData.date_range.start_datetime.split(' ')[0] }}
                                <span v-if="transactionReportStartTime"> {{ transactionReportData.date_range.start_time }}</span>
                                to {{ transactionReportData.date_range.end_datetime.split(' ')[0] }}
                                <span v-if="transactionReportEndTime"> {{ transactionReportData.date_range.end_time }}</span>
                            </span>
                            <!-- Same day with times -->
                            <span v-else-if="transactionReportStartTime || transactionReportEndTime">
                                {{ transactionReportData.date_range.date }} from 
                                <span v-if="transactionReportStartTime">{{ transactionReportData.date_range.start_time }}</span>
                                <span v-else>12:00 AM</span>
                                to 
                                <span v-if="transactionReportEndTime">{{ transactionReportData.date_range.end_time }}</span>
                                <span v-else>11:59 PM</span>
                            </span>
                            <!-- Full day -->
                            <span v-else>
                                {{ transactionReportData.date_range.date }} <span class="text-blue-600"> - Full Day</span>
                            </span>
                        </span>
                    </div>
                </div>

                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6" v-if="(transactionReportData.checkinPayments?.length > 0) || (transactionReportData.bills?.length > 0)">
                    <div class="card p-4 bg-blue-50 border-blue-200">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-2xl font-bold text-blue-700">₱{{ (transactionReportData.totalCheckinPayments || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
                                <div class="text-sm text-blue-600">Checked-in Sales</div>
                                <div class="text-xs text-blue-500">{{ transactionReportData.checkinPayments?.length || 0 }} transactions</div>
                            </div>
                            <i class="pi pi-home text-2xl text-blue-500"></i>
                        </div>
                    </div>
                    <div class="card p-4 bg-green-50 border-green-200">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-2xl font-bold text-green-700">₱{{ (transactionReportData.totalBills || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
                                <div class="text-sm text-green-600">POS Sales</div>
                                <div class="text-xs text-green-500">{{ transactionReportData.bills?.length || 0 }} transactions</div>
                            </div>
                            <i class="pi pi-shopping-cart text-2xl text-green-500"></i>
                        </div>
                    </div>
                    <div class="card p-4 bg-purple-50 border-purple-200">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-2xl font-bold text-purple-700">₱{{ (transactionReportData.grandTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
                                <div class="text-sm text-purple-600">Total Sales</div>
                                <div class="text-xs text-purple-500">{{ (transactionReportData.checkinPayments?.length || 0) + (transactionReportData.bills?.length || 0) }} total transactions</div>
                            </div>
                            <i class="pi pi-chart-bar text-2xl text-purple-500"></i>
                        </div>
                    </div>
                    <div class="card p-4 bg-orange-50 border-orange-200">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-2xl font-bold text-orange-700">₱{{ ((transactionReportData.checkinPayments || []).reduce((sum, payment) => sum + (payment.deposit_amount || 0), 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
                                <div class="text-sm text-orange-600">Total Deposits</div>
                                <div class="text-xs text-orange-500">{{ (transactionReportData.checkinPayments || []).filter(p => p.deposit_amount > 0).length }} with deposits</div>
                            </div>
                            <i class="pi pi-wallet text-2xl text-orange-500"></i>
                        </div>
                    </div>
                    <div class="card p-4 bg-red-50 border-red-200">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-2xl font-bold text-red-700">₱{{ ((transactionReportData.checkinPayments || []).reduce((sum, payment) => sum + (payment.damage_charges || 0), 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
                                <div class="text-sm text-red-600">Damage Charges</div>
                                <div class="text-xs text-red-500">{{ (transactionReportData.checkinPayments || []).filter(p => p.damage_charges > 0).length }} with damages</div>
                            </div>
                            <i class="pi pi-exclamation-triangle text-2xl text-red-500"></i>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end mb-4">
                   
                  <div class="flex items-end">
                        <Button 
                            label="Clear" 
                            icon="pi pi-filter-slash" 
                            class="p-button-secondary p-button-outlined w-full"
                            @click="clearTransactionReportFilters" 
                        />
                    </div>
                  <div class="flex flex-col">
                        
                        <Calendar v-model="transactionReportStartDate" showIcon />
                    </div>
                    <div class="flex flex-col">
                       
                        <Calendar v-model="transactionReportEndDate" showIcon placeholder="End Date" />
                    </div>
                    <div class="flex flex-col">
                        
                        <Calendar 
                            v-model="transactionReportStartTime" 
                            timeOnly 
                            showIcon 
                            iconDisplay="input"
                            showTime
                            hourFormat="12"
                            placeholder="Start Time"
                        />
                    </div>
                    <div class="flex flex-col">
                      
                        <Calendar 
                            v-model="transactionReportEndTime" 
                            timeOnly 
                            showIcon 
                            iconDisplay="input"
                            showTime
                            hourFormat="12"
                            placeholder="End Time"
                        />
                    </div>
                  
                </div>

                <!-- Sales Tables -->
                <div v-if="!loadingTransactionReport && ((transactionReportData.checkinPayments?.length > 0) || (transactionReportData.bills?.length > 0))">
                    <!-- Checked-in Sales Table -->
                    <div v-if="transactionReportData.checkinPayments?.length > 0" class="mb-6">
                        <h3 class="text-lg font-semibold mb-3 text-blue-700">Checked-in Sales ({{ transactionReportData.checkinPayments?.length || 0 }})</h3>
                        <DataTable 
                            :value="transactionReportData.checkinPayments" 
                            class="p-datatable-sm"
                            :paginator="true"
                            :rows="5"
                            :showGridlines="true"
                            responsiveLayout="scroll"
                        >
                            <Column field="created_at" header="Date/Time" sortable>
                                <template #body="{ data }">
                                    {{ new Date(data.created_at).toLocaleString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                    }) }}
                                </template>
                            </Column>
                            <Column field="guest_name" header="Guest Name" sortable />
                            <Column field="room_number" header="Room" sortable />
                            <Column field="booking_type" header="Type" sortable>
                                <template #body="{ data }">
                                    <Tag :value="data.booking_type" :severity="data.booking_type === 'Walk-In' ? 'info' : 'success'" />
                                </template>
                            </Column>
                            <Column field="hours_selected" header="Hours" sortable>
                                <template #body="{ data }">
                                    <div class="flex flex-col items-start">
                                        <span>{{ data.hours_selected }}h</span>
                                        <span v-if="data.extend_hours > 0" class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">+{{ data.extend_hours }}h</span>
                                    </div>
                                </template>
                            </Column>
                            <Column field="amount" header="Total Due" sortable>
                                <template #body="{ data }">
                                    <div class="flex flex-col">
                                        <span class="font-semibold">₱{{ data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
                                        <div class="text-xs text-gray-500">
                                            <div v-if="data.room_rate">Room: ₱{{ data.room_rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
                                            <div v-if="data.extend_amount > 0" class="text-blue-600 font-medium">Extend: ₱{{ data.extend_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
                                            <div v-if="data.extras_total > 0">Extras: ₱{{ data.extras_total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
                                            <div v-if="data.amenities_total > 0">Amenities: ₱{{ data.amenities_total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
                                            <div v-if="data.additional_person_total > 0">Add'l Person: ₱{{ data.additional_person_total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
                                            <div v-if="data.damage_charges > 0" class="text-red-600 font-medium">Damage: ₱{{ data.damage_charges.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
                                            <div v-if="data.discount_amount > 0" class="text-red-500">Discount: -₱{{ data.discount_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
                                            <div v-if="data.deposit_amount > 0" class="text-green-600 font-medium">Deposit: ₱{{ data.deposit_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
                                        </div>
                                    </div>
                                </template>
                            </Column>
                            <Column field="created_by_name" header="Created By">
                                <template #body="{ data }">
                                    <div class="flex flex-col">
                                        <span class="font-medium text-sm">{{ data.created_by_name || 'Unknown' }}</span>
                                        <span class="text-xs text-gray-500 capitalize">{{ data.created_by_role || 'Unknown' }}</span>
                                    </div>
                                </template>
                            </Column>
                        </DataTable>
                    </div>

                    <!-- POS Sales Table -->
                    <div v-if="transactionReportData.bills?.length > 0">
                        <h3 class="text-lg font-semibold mb-3 text-green-700">POS Sales ({{ transactionReportData.bills?.length || 0 }})</h3>
                        <DataTable 
                            :value="transactionReportData.bills" 
                            class="p-datatable-sm"
                            :paginator="true"
                            :rows="5"
                            :showGridlines="true"
                            responsiveLayout="scroll"
                        >
                            <Column field="created_at" header="Date/Time" sortable>
                                <template #body="{ data }">
                                    {{ new Date(data.created_at).toLocaleString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                    }) }}
                                </template>
                            </Column>
                            <Column field="invoice_no" header="Invoice #" sortable>
                                <template #body="{ data }">#{{ data.invoice_no }}</template>
                            </Column>
                            <Column field="amount" header="Amount" sortable>
                                <template #body="{ data }">₱{{ data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</template>
                            </Column>
                            <Column field="created_by_name" header="Created By">
                                <template #body="{ data }">
                                    <div class="flex flex-col">
                                        <span class="font-medium text-sm">{{ data.created_by_name || 'Unknown' }}</span>
                                        <span class="text-xs text-gray-500 capitalize">{{ data.created_by_role || 'Unknown' }}</span>
                                    </div>
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-else-if="!loadingTransactionReport" class="text-center py-12">
                    <i class="pi pi-chart-bar text-6xl text-gray-300 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 mb-2">No Sales Found</h3>
                    <p class="text-gray-500">No checked-in sales or POS sales found for the selected date range.</p>
                </div>

                <!-- Loading State -->
                <div v-if="loadingTransactionReport" class="text-center py-12">
                    <ProgressSpinner />
                    <p class="text-gray-500 mt-4">Generating sales report...</p>
                </div>
            </div>

            <template #footer>
                <Button 
                    label="Close" 
                    class="p-button-secondary" 
                    @click="transactionReportDialogVisible = false" 
                />
            </template>
        </Dialog>
        
        <!-- Confirmation Dialog for Checkout -->
        <ConfirmDialog :dismissableMask="true"></ConfirmDialog>
    </template>
    <style scoped>
    /* Add to your style section */
    .extended-badge {
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.05);
        }
        100% {
            transform: scale(1);
        }
    }

    .room-card {
      position: relative;
      border-radius: 0.5rem;   /* same rounding as inner */
      padding: 4px;
      margin: 4px;            /* border thickness */
      overflow: visible;       /* allow glow to extend */
      z-index: 0;              /* create stacking context */
      isolation: isolate;      /* keep pseudo-element layering self-contained */
    }

    /* The animated gradient lives on a pseudo-element behind the content */

    /* Inner content sits above */
    .room-card__inner {
    position: relative;
    border-radius: calc(0.5rem - 3px); /* keep the ring visible */
    z-index: 1;
    }

    /* Near-expiry: multi-color animated border */
    .near-expiry-anim::before {
      opacity: 1;
      content: "";
      position: absolute;
      left: -2px;
      top: -2px;
      width: calc(100% + 4px);
      height: calc(100% + 4px);
      border-radius: inherit;
      background: linear-gradient(45deg,
        #3b82f6,
        #00ff00,
        #3b82f6,
        #00ff00
      );
      background-size: 400%;
      z-index: 0;
      animation: steam 20s linear infinite;
      pointer-events: none;
    }

    /* Time's up: same animated border */
    .timeup-anim::before {
      opacity: 1;
      content: "";
      position: absolute;
      left: -2px;
      top: -2px;
      width: calc(100% + 4px);
      height: calc(100% + 4px);
      border-radius: inherit;
      background: linear-gradient(45deg,
        #3b82f6,
        #00ff00,
        #3b82f6,
        #00ff00
      );
      background-size: 400%;
      z-index: 0;
      animation: steam 20s linear infinite;
      pointer-events: none;
    }

    @keyframes steam {
      0%   { background-position:   0% 0; }
      50%  { background-position: 400% 0; }
      100% { background-position:   0% 0; }
    }

    .price-old {
  position: relative;
  display: inline-block;
  color: #9ca3af;          /* gray-400 */
  text-decoration: line-through;
}

.price-old::after {
  content: "";
  position: absolute;
  left: -2px;
  right: -2px;
  top: 50%;
  border-top: 2px solid #ef4444; /* red-500 */
  transform: rotate(-10deg);
}

.price-new {
  font-weight: 700;
  font-size: 1.125rem; /* text-lg */
}

.discount-pill {
  display: inline-block;
  font-weight: 700;
  font-size: 0.75rem;       /* text-xs */
  background: #fee2e2;      /* red-100 */
  color: #b91c1c;           /* red-700 */
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;    /* pill */
}

    </style>

