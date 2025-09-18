<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { getRooms, getRoomTypeRates, bookRoom, fetchLatestBooking, cancelBooking, checkInBooking, checkoutRoom, cleaningComplete, fetchPOSProducts, fetchPOSPreview, posCheckout, fetchDiscounts, getAvailableAmenities, getRoomSerialNumbers, updateRoomSerialNumbers, createCheckinPayment } from "@/api/auth";
import { useToast } from "primevue/usetoast";
import RoomSummary from "./RoomSummary.vue";

//--------------discounts-----------




const discounts = ref([]); // [{ id, name, percent, status }]

const activeDiscounts = computed(() =>
  discounts.value.filter(d => String(d.status).toLowerCase() === "active")
);

const selectedDiscountId = ref(null); // bound to UI dropdown
const selectedDiscount = computed(() =>
  activeDiscounts.value.find(d => Number(d.id) === Number(selectedDiscountId.value)) || null
);

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
const roomDiscountAmount = computed(() => +(roomRate.value * roomDiscountPercent.value / 100).toFixed(2));
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
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
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

// reschedule when rooms list changes
watch(rooms, () => { scheduleBookingExpiryForAll(); }, { deep: true });

// also run once when mounted
onMounted(() => { scheduleBookingExpiryForAll(); });

onUnmounted(() => {
  for (const [, id] of bookingExpiryTimers) clearTimeout(id);
  bookingExpiryTimers.clear();
});



    function BookingselectRateAndHours(hours, rate) {
        guestDetails.value.selectedHours = hours; // Update booking state
        guestDetails.value.selectedrate = rate;
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
            amountReceived: 0,
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
                amountReceived: 0,
                deposit: 0,
                isPaid: false,
            },
        },
    });


    const cancelDialogVisible = ref(false); // Tracks visibility of the dialog
    const cleaningConfirmationVisible = ref(false);
    const toast = useToast();

    // Lightweight global emitters for instant cross-view updates
    function emitRoomsChanged(reason, roomId) {
        window.dispatchEvent(new CustomEvent("rooms:changed", { detail: { reason, roomId } }));
    }
    function emitBookingsChanged(reason, bookingId, roomId) {
        window.dispatchEvent(new CustomEvent("bookings:changed", { detail: { reason, bookingId, roomId } }));
    }


    const selectedBookingId = ref(null);

    async function fetchRooms() {
        try {
            const response = await getRooms();
            const baseRooms = response.data || [];

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
                                  selectedRoom.value.guestDetails.extrasTotal = Number(res.data.extras_total || 0);
                                  selectedRoom.value.guestDetails.amenitiesTotal = Number(res.data.amenities_total || 0);
                                  selectedRoom.value.guestDetails.extrasItems = res.data.extras_items || [];
                                  selectedRoom.value.guestDetails.amenitiesItems = res.data.amenities_items || [];
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

            rooms.value = withBookings;
        } catch (err) {
            toast.add({
                severity: "error",
                summary: "Failed to load rooms",
                detail: err.message,
            });
        }
    }
    onMounted(() => {
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
        deposit: "",
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
  const promoNote = promo ? ` [DISCOUNT] ${promo.name} (${roomDiscountPercent.value}%) -₱${roomDiscountAmount.value.toFixed(2)}` : "";
  const userNote = (paymentDetails.value.note || "").trim();
  // Build rentals note from selected amenities
  const amenMap = new Map((amenitiesPD.value || []).map(a => [Number(a.serial_id), a]));
  const rentals = (selectedAmenityIds.value || []).map(id => amenMap.get(Number(id))).filter(Boolean);
  const rentalNote = rentals.length
    ? ` [RENTALS] ` + rentals.map(r => `${r.product_name || 'Amenity'} (${r.serial_number}) ₱${Number(r.unit_rental_price||0).toFixed(2)}`).join(', ')
    : "";
 const noteSuffix = (userNote ? ` [NOTE] ${userNote}` : "") + rentalNote;


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
      notes: (posBill?.invoice_no ? `POS invoice: ${posBill.invoice_no}` : (g.notes || "")) + noteSuffix + promoNote
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
   const finalRate = Number((selectedDiscount.value ? discountedRoomRate.value : roomRate.value) || 0);
   const cpPayload = {
     room_id: room.id,
     booking_id: bookingIdForLog,
     guest_name: selectedRoom.value?.guestDetails?.guestName || "",
     booking_type: paymentFlow.value === "WALKIN" ? "Walk-In" : "Booking",
     hours_selected: hours,
     room_rate: finalRate,
     discount_name: selectedDiscount.value?.name || "",
     discount_percent: Number(roomDiscountPercent.value || 0),
     discount_id: selectedDiscount.value?.id || null,
     extras_bill_id: posBill?.bill_id || null,
     extras_total: Number((posBill?.total ?? uiTotalExtrasPD.value) || 0),
     amenities_total: Number(uiTotalAmenitiesPD.value || 0),
     deposit_amount: deposit,
     amount_received: amountReceived,
     total_due: Number(totalAmountDue.value || 0),
     change_amount: Number(calculateChange.value || 0),
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
selectedRoom.value.guestDetails.payment = { amountReceived, deposit, isPaid: paid };
selectedRoom.value.guestDetails.checkInDateTime = now.toISOString();
selectedRoom.value.guestDetails.checkOutDateTime = out.toISOString();


const idx = rooms.value.findIndex(r => r.id === selectedRoom.value?.id);
if (idx !== -1) {
const r = rooms.value[idx];
r.status = "Occupied";
r.guestDetails ||= {};
r.guestDetails.payment = { amountReceived, deposit, isPaid: paid };
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

    // Total amount due = rate + deposit
const totalAmountDue = computed(() => {
  const deposit = Number(paymentDetails.value.deposit) || 0;
  const extras = Number(uiTotalExtrasPD.value) || 0;
  const amenRent = Number(uiTotalAmenitiesPD.value) || 0;
  return discountedRoomRate.value + deposit + extras + amenRent;
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
const occupiedPayment = computed(() => (
  selectedRoom.value?.guestDetails?.payment || { amountReceived: 0, deposit: 0, isPaid: false }
));
const occRoomRate = computed(() => {
  const g = selectedRoom.value?.guestDetails || {};
  const charged = Number(g.roomRateCharged || g.room_rate_charged || 0);
  if (charged) return charged;
  return Number(g.selectedrate) || 0;
});
const occExtras = computed(() => Number(selectedRoom.value?.guestDetails?.extrasTotal || 0));
const occRent = computed(() => Number(selectedRoom.value?.guestDetails?.amenitiesTotal || 0));
const occTotalDue = computed(() => occRoomRate.value + occExtras.value + occRent.value + Number(occupiedPayment.value.deposit || 0));
const occChange = computed(() => Number(occupiedPayment.value.amountReceived || 0) - occTotalDue.value);

// Visual highlight for Discount card
const discountHighlightClass = computed(() => {
  return selectedDiscount.value
    ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20'
    : 'border-slate-200';
});
    
    // Reset Payment Form
function resetPaymentForm() {
    paymentDetails.value = {
        amountReceived: "",
        deposit: "",
        note: "",
    };
    selectedAmenityIds.value = [];
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

  const hasDiscount = !!selectedDiscount.value;
  const ratePart = hasDiscount
    ? `${formatCurrency(roomRate.value)} (Promo ${selectedDiscount.value?.name} ${Number(roomDiscountPercent.value)}% -> ${formatCurrency(discountedRoomRate.value)})`
    : `${formatCurrency(roomRate.value)}`;

  // Extras summary
  const extrasRows = cartViewPD.value || [];
  const extrasList = extrasRows.map(r => `${r.name} x${r.quantity} @ ${formatCurrency(r.unitPrice)}`).join('; ');
  const extrasTotal = formatCurrency(uiTotalExtrasPD.value || 0);

  // Amenities summary
  const amenRows = selectedAmenitiesPD.value || [];
  const amenList = amenRows.map(a => `${a.name} #${a.serial} ${formatCurrency(a.price)}`).join('; ');
  const amenTotal = formatCurrency(uiTotalAmenitiesPD.value || 0);

  const amtRecv = Number(paymentDetails.value.amountReceived) || 0;
  const deposit = Number(paymentDetails.value.deposit) || 0;
  const totalDue = Number(totalAmountDue.value) || 0;
  const change = Number(calculateChange.value) || 0;
  const note = (paymentDetails.value.note || '').trim() || '—';
  const discountText = hasDiscount ? `${selectedDiscount.value?.name} (${Number(roomDiscountPercent.value)}%)` : 'None';

  return `Guest ${guestName} in Room ${roomNo} for ${hours} hour(s); rate ${ratePart}. ` +
         `Extras ${extrasTotal}: ${extrasList || 'None'}. ` +
         `Amenities ${amenTotal}: ${amenList || 'None'}. ` +
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
const discountBadgeText = computed(() => selectedDiscount.value ? `${selectedDiscount.value.name} (${Number(roomDiscountPercent.value)}%)` : null);

    // Open Payment Dialog
async function openPaymentDialog(room) {
paymentDetails.value = { amountReceived: "", deposit: "", note: "" };
selectedAmenityIds.value = [];
selectedDiscountId.value = null; // reset promo selection each time


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
  payment: { amountReceived: 0, deposit: 0, isPaid: false },
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

 // Load available amenities with unit rental price (in-stock only)
 try {
   const resA = await getAvailableAmenities();
   amenitiesPD.value = (resA?.data || []).map(a => ({
     serial_id: Number(a.serial_id ?? a.id ?? a.serialId),
     serial_number: a.serial_number,
     product_name: a.product_name,
     brand: a.brand,
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

    // Function to open the checkout dialog
    function openCheckoutDialog(room) {
        selectedRoom.value = {
            ...room,
            guestDetails: { ...room.guestDetails }, // Copy nested object
            selectedrate: room.rate || 0,
        };
        checkoutDialogVisible.value = true;
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


    // Checkout payment computed values
    const checkoutPayment = computed(() => {
        const p = selectedRoom.value?.guestDetails?.payment;
        return p ? p : { amountReceived: 0, deposit: 0, isPaid: false };
    });
    const checkoutDeposit = computed(() => Number(checkoutPayment.value.deposit) || 0);
    // Amount to give back to guest at checkout (refund of deposit)
    const checkoutRefundToGuest = computed(() => checkoutDeposit.value);

    // Function to confirm checkout
    function confirmCheckout() {
        console.log("Checkout confirmed:", selectedRoom.value);

        // Find the room in the rooms array
        const roomIndex = rooms.value.findIndex(
            (r) => r.id === selectedRoom.value.id
        );

        if (roomIndex === -1) {
            console.error("Room not found in the rooms array.");
            toast.add({
                severity: "error",
                summary: "Checkout Failed",
                detail: "Room not found. Please try again.",
                life: 3000,
            });
            return;
        }

        // Update local state FIRST
        rooms.value[roomIndex].status = "Cleaning";
        rooms.value[roomIndex].guestDetails = null;

        // Sync with localStorage IMMEDIATELY
        localStorage.setItem("rooms", JSON.stringify(rooms.value));

        // THEN call the API
        checkoutRoom(selectedRoom.value.id)
            .then(() => {
                toast.add({
                    severity: "success",
                    summary: "Checkout Successful",
                    detail: `Room ${selectedRoom.value.roomNumber} has been checked out.`,
                    life: 3000,
                });
                lastCheckInByRoom.delete(selectedRoom.value.id);
                emitBookingsChanged("checked-out", selectedRoom.value?.guestDetails?.id || null, selectedRoom.value.id);
                emitRoomsChanged("status-updated", selectedRoom.value.id);
            })
            .catch((error) => {
                console.error("API Error:", error);
                // Rollback local state if needed
                rooms.value[roomIndex].status = "Occupied";
                localStorage.setItem("rooms", JSON.stringify(rooms.value));

                toast.add({
                    severity: "error",
                    summary: "Checkout Failed",
                    detail: "Failed to sync with server. Changes reverted.",
                    life: 3000,
                });
            });

        checkoutDialogVisible.value = false;
        DialogVisible.value = false;
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

    // (reverted) No auto options; hours and rate entered manually

    // Reset function
    function resetExtensionForm() {
        additionalHours.value = null;
        additionalRate.value = 0;
    }

    function openExtendDialog(room) {
        selectedRoom.value = {
            ...room,
            guestDetails: { ...room.guestDetails },
        };
        // (reverted) Do not fetch rates here
        resetExtensionForm();
        extendDialogVisible.value = true;
    }

    async function confirmExtension() {
        try {
            if (!additionalHours.value || additionalHours.value <= 0) {
                throw new Error("Please enter valid additional hours");
            }

            if (additionalRate.value <= 0) {
                throw new Error("Please enter a valid additional amount");
            }

            const roomIndex = rooms.value.findIndex(
                (r) => r.id === selectedRoom.value.id
            );

            if (roomIndex === -1) {
                throw new Error("Room not found");
            }

            // Local-only extension (reverted)
            rooms.value[roomIndex].guestDetails.selectedHours += Number(additionalHours.value);
            rooms.value[roomIndex].guestDetails.extendedHours = (rooms.value[roomIndex].guestDetails.extendedHours || 0) + Number(additionalHours.value);
            rooms.value[roomIndex].guestDetails.selectedrate = newTotal.value;
            const checkInDate = new Date(rooms.value[roomIndex].guestDetails.checkInDateTime);
            const newCheckOut = new Date(checkInDate.getTime() + rooms.value[roomIndex].guestDetails.selectedHours * 60 * 60 * 1000);
            rooms.value[roomIndex].guestDetails.checkOutDateTime = newCheckOut.toISOString();
            localStorage.setItem("rooms", JSON.stringify(rooms.value));
            await updateRoomStatus(selectedRoom.value.id, "Occupied");

            // (reverted) Do not log extension to payment history here

            toast.add({
                severity: "success",
                summary: "Stay Extended",
                detail: `Room ${selectedRoom.value.roomNumber} extended successfully`,
                life: 3000,
            });
        } catch (error) {
            toast.add({
                severity: "error",
                summary: "Extension Failed",
                detail: error.message,
                life: 3000,
            });
        } finally {
            extendDialogVisible.value = false;
            resetExtensionForm();
        }
    }
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




    async function submitBooking(guestDetails) {
        // Generate unique codes
        const room = rooms.value.find(r => r.id === selectedRoom.value.id);
        if (!room) return;
const isBookType = customerType.value === "Book";
const effectiveCheckIn = isBookType ? new Date() : (guestDetails.checkInDateTime || new Date());

const bookingData = {
  room_id: room.id,
  guest_name: guestDetails.guestName,
  cellphone: guestDetails.cellphone,
  guest_email: guestDetails.guestEmail,
  booking_type: "Booking",
  status: "Booked",
  check_in_datetime: toPHDateTimeString(effectiveCheckIn), // <- forced for Book
  selected_hours: guestDetails.selectedHours,
  selected_rate: guestDetails.selectedrate,
  room_code: generateroomCode(room.id),
  book_code: generateroomCode("BK"),
  notes: guestDetails.notes || "",
};

const nowMs = Date.now();
uiBookedAtMsByRoom.set(room.id, nowMs);

// Optimistic UI so the card shows ~59:59 immediately
const optimisticDetails = {
  ...guestDetails,
  checkInDateTime: new Date(nowMs).toISOString(),
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
                <h2 class="text-xl font-bold mb-5">Room List</h2>
                <div class="h-[70vh] overflow-y-auto">
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
        class="room-card__inner relative w-full p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow text-white min-h-[120px]"
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
        v-if="room.guestDetails?.extendedHours > 0"
        class="absolute top-2 right-2 bg-yellow-400 text-white text-xs font-semibold px-2 py-1 rounded-full"
        >
        +{{ room.guestDetails.extendedHours }} hrs
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
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <!-- LEFT: Room info -->
        <div class="space-y-1 md:flex-1">
          <div class="flex items-baseline gap-2">
            <h2 class="text-2xl font-bold">Room {{ selectedRoom?.roomNumber }}</h2>
            <span class="text-lg">|</span>
            <span class="text-lg font-semibold">{{ selectedRoom?.type }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium">Floor:</span>
            <span class="text-sm">{{ selectedRoom?.floor || "N/A" }}</span>
          </div>
        </div>

        <!-- RIGHT: Status -->
        <div class="flex items-center gap-3 ml-auto">
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
                        <p>
                            Room Code:
                            {{ selectedRoom.guestDetails?.roomCode || "N/A" }}
                        </p>
                        <p>
                            Book Code:
                            {{ selectedRoom.guestDetails?.bookCode || "N/A" }}
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
                    <p>
                        <strong>Room Code:</strong>
                        {{ selectedRoom.guestDetails?.roomCode || "N/A" }}
                    </p>
                    <p>
                        <strong>Booking Code:</strong>
                        {{ selectedRoom.guestDetails?.bookCode || "N/A" }}
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




                    <div class="mt-4 pt-4 border-t space-y-3">
                        <h4 class="text-xl mb-2 font-bold">Payment Details</h4>

                        

                        <!-- Extras list -->
                        <div>
                          <div class="text-sm uppercase tracking-wide text-gray-500 mb-1">Extras</div>
                          <div v-if="(selectedRoom.guestDetails?.extrasItems || []).length" class="space-y-1 text-sm">
                            <div v-for="(it, i) in selectedRoom.guestDetails.extrasItems" :key="i" class="flex items-center justify-between">
                              <span>{{ it.name }}<span v-if="it.brand" class="opacity-60"> ({{ it.brand }})</span> ×{{ it.quantity }}</span>
                              <span>{{ formatCurrency(it.price) }}</span>
                            </div>
                          </div>
                          <div v-else class="text-sm opacity-60">No extras.</div>
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
                              <strong>{{ formatCurrency(occRoomRate) }}</strong>
                              <span
                                v-if="Number(selectedRoom.guestDetails?.discountPercent || 0) > 0"
                                class="discount-pill"
                              >
                                {{ selectedRoom.guestDetails?.discountName || 'Promo' }} -{{ Number(selectedRoom.guestDetails.discountPercent) }}%
                              </span>
                            </span>
                          </div>
                          <div class="flex items-center justify-between text-sm">
                            <span>Extras</span>
                            <strong>{{ formatCurrency(occExtras) }}</strong>
                          </div>
                          <div class="flex items-center justify-between text-sm">
                            <span>Rent</span>
                            <strong>{{ formatCurrency(occRent) }}</strong>
                          </div>
                          <div class="flex items-center justify-between text-sm">
                            <span>Deposit</span>
                            <strong>{{ formatCurrency(occupiedPayment.deposit || 0) }}</strong>
                          </div>
                          <div class="flex items-center justify-between text-sm">
                            <span>Amount Received</span>
                            <strong>{{ formatCurrency(occupiedPayment.amountReceived || 0) }}</strong>
                          </div>
                          <hr>
                          <div class="flex items-center justify-between text-m">
                            <span>Total Due</span>
                            <strong>{{ formatCurrency(occTotalDue) }}</strong>
                          </div>
                          <div class="flex items-center justify-between text-xl">
                            <span>Change</span>
                            <strong :class="{ 'text-red-600': (occupiedPayment.amountReceived||0) < occTotalDue, 'text-green-700': (occupiedPayment.amountReceived||0) >= occTotalDue }">
                              {{ formatCurrency(occChange) }}
                            </strong>
                          </div>
                          <hr></hr>
                          <div class="flex items-start justify-between text-sm">
                            <span>Note</span>
                            <span class="text-right opacity-80">{{ selectedRoom.guestDetails?.payment?.note || '—' }}</span>
                          </div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
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
                                    <label class="block text-sm font-medium mb-1 mt-3">
                                    Select Stay Duration:
                                    </label>

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

    
    


      <div :class="['rounded-lg p-3 border', paymentHighlightClass]">
        <div class="flex items-center justify-between mb-2">
          <div class="font-semibold">Payment</div>
          <div class="text-sm font-bold">Total: {{ formatCurrency(totalAmountDue) }}</div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InputText
            v-model="paymentDetails.amountReceived"
            placeholder="Amount received (cash)"
            type="number"
            :class="['w-full', { 'p-invalid': isAmountInsufficient }]"
          />
          <InputText v-model="paymentDetails.deposit" placeholder="Deposit" type="number" />
        </div>
        <div v-if="isAmountInsufficient" class="text-xs text-red-700 mt-1">Insufficient amount received.</div>
      </div>
       <div :class="['rounded-lg p-3 border', discountHighlightClass]">
<div class="flex flex-col md:flex-row md:items-center gap-3">
<span class="font-medium">Discount</span>
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
</div>
      <div class="border rounded-lg p-3">
        <div class="font-semibold mb-2">Note</div>
        <textarea
          v-model="paymentDetails.note"
          rows="3"
          placeholder="e.g., No change available; will return ₱20 later."
          class="w-full p-2 border rounded-md focus:outline-none focus:ring"
        />
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
      <template v-if="selectedDiscount">
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
                  <template v-if="selectedDiscount">
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
                    <template v-if="selectedDiscount">
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
                 <div class="text-sm flex items-center justify-between">
                  <span>Amount Received</span>
                  <strong>{{ formatCurrency(paymentDetails.amountReceived) }}</strong>
                </div>
                  <hr />
                <div class="text-xl flex items-center justify-between">
                  <span>Total Due</span>
                  <strong>{{ formatCurrency(totalAmountDue) }}</strong>
                </div>
                <div class="text-m flex items-center justify-between">
                  <span>Change</span>
                  <strong :class="{ 'text-red-600': isAmountInsufficient, 'text-green-700': !isAmountInsufficient }">{{ formatCurrency(calculateChange) }}</strong>
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
                    <label class="block text-sm font-medium text-gray-600">
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
                    <label class="block text-sm font-medium text-gray-600">
                        Room Code:
                    </label>
                    <InputText
                        :modelValue="selectedRoom.guestDetails?.roomCode || 'N/A'"
                        class="w-full"
                        readonly
                    />
                </div>

                <!-- Duration and Rate Summary -->
                <div class="space-y-4">
                    <div class="flex justify-between items-center">
                        <span class="font-medium">Duration:</span>
                        <span class="font-semibold">
                            {{ selectedRoom.guestDetails?.selectedHours || "N/A" }}
                            Hours
                        </span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="font-medium">Rate:</span>
                        <span class="font-semibold">
                            {{
                                formatCurrency(
                                    selectedRoom.guestDetails?.selectedrate || 0
                                )
                            }}
                        </span>
                    </div>
                </div>

                <!-- Payment Section -->
                <div class="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="font-medium">Rate (Total):</span>
                        <span class="font-semibold text-lg">
                            {{ formatCurrency(selectedRoom.guestDetails?.selectedrate || 0) }}
                        </span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="font-medium">Deposit (to refund):</span>
                        <span class="font-semibold text-lg">
                            {{ formatCurrency(checkoutDeposit) }}
                        </span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="font-medium">Amount to give to guest:</span>
                        <span class="font-semibold text-lg text-green-700">
                            {{ formatCurrency(checkoutRefundToGuest) }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
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
                    :disabled="selectedRoom.selectedrate == null"
                    @click="confirmCheckout"
                />
            </div>
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

            <div class="p-4 space-y-4">
                <!-- Guest Information -->
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-600">
                        Current Hours:
                        {{ selectedRoom.guestDetails?.selectedHours || 0 }}h
                    </label>
                    <label class="block text-sm font-medium text-gray-600">
                        Current Rate:
                        {{
                            formatCurrency(
                                selectedRoom.guestDetails?.selectedrate || 0
                            )
                        }}
                    </label>
                </div>

                <!-- Extend Stay Inputs -->
                <div class="space-y-4">
                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-gray-600">
                            Additional Hours
                        </label>
                        <InputNumber
                            v-model="additionalHours"
                            placeholder="Enter hours"
                            class="w-full"
                            :min="1"
                        />
                    </div>

                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-gray-600">
                            Additional Amount
                        </label>
                        <InputNumber
                            v-model="additionalRate"
                            placeholder="Enter amount"
                            class="w-full"
                            :min="0"
                            mode="currency"
                            currency="PHP"
                        />
                    </div>
                </div>

                <!-- Payment Summary -->
                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-medium">Current Total:</span>
                        <span class="font-semibold">
                            {{
                                formatCurrency(
                                    selectedRoom.guestDetails?.selectedrate || 0
                                )
                            }}
                        </span>
                    </div>
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-medium">Additional Amount:</span>
                        <span class="font-semibold">
                            {{ formatCurrency(additionalRate) }}
                        </span>
                    </div>
                    <hr class="my-2" />
                    <div class="flex justify-between items-center">
                        <span class="font-medium text-lg">New Total:</span>
                        <span class="font-semibold text-lg">
                            {{ formatCurrency(newTotal) }}
                        </span>
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
                    :disabled="
                        !additionalHours ||
                        additionalHours <= 0 ||
                        additionalRate <= 0
                    "
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

        <Toast />
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
    padding: 5px;            /* border thickness */
    }

    /* The animated gradient lives on a pseudo-element behind the content */
    .room-card::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    z-index: 0;
    opacity: 0;              /* off by default */
    background-size: 200% 100%;
    }

    /* Inner content sits above */
    .room-card__inner {
    position: relative;
    border-radius: calc(0.5rem - 3px); /* keep the ring visible */
    z-index: 1;
    }

    /* Near-expiry: yellow/orange animated border */
    .near-expiry-anim::before {
    opacity: 1;
    background: linear-gradient(90deg, #00ff00, #00ff00, #00ff00);
    }

    /* Time's up: red animated border */
    .timeup-anim::before {
    opacity: 1;
    background: linear-gradient(90deg, #00ff00, #00ff00, #00ff00);
    animation: border-move 2s linear infinite;
    }

    @keyframes border-move {
    0%   { background-position:   0% 50%; }
    100% { background-position: 200% 50%; }
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
