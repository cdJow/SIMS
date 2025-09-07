<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { getRooms, getRoomTypeRates,  bookRoom, fetchLatestBooking, cancelBooking, checkInBooking, checkoutRoom, cleaningComplete  } from "@/api/auth";
import { useToast } from "primevue/usetoast";
import RoomSummary from "./RoomSummary.vue";

const lastCheckInByRoom = new Map();

const paymentFlow = ref("WALKIN");

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
                                    notes: res.data.notes,
                                    roomCode: res.data.room_code,
                                    bookCode: res.data.book_code,
                                    createdAt: res.data.created_at,
                                    checkInDateTime: res.data.check_in_datetime,
                                    checkOutDateTime: res.data.check_out_datetime,   // <-- ADD THIS
                                    bookingType: res.data.booking_type,
                                    payment: res.data.payment || null,
                                };
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
    const amountReceived = parseFloat(paymentDetails.value.amountReceived) || 0;
    const deposit = parseFloat(paymentDetails.value.deposit) || 0;
    const paid = !isAmountInsufficient.value;

    // Hours always come from the guest details in the dialog we just opened
    const hours = Number(selectedRoom.value?.guestDetails?.selectedHours || 0);
    const now = new Date();
    const out = new Date(now.getTime() + (hours || 0) * 60 * 60 * 1000);

    lastCheckInByRoom.set(room.id, { inISO: now.toISOString(), outISO: out.toISOString(), at: Date.now() });

    if (paymentFlow.value === "WALKIN") {
      // Create Occupied booking from transient form
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
        amount_received: amountReceived,
        deposit,
        is_paid: paid,
        notes: g.notes || "",
      });

    } else {
      // BOOKED → CHECK-IN: only use server booking data + payment
      const bookingId = selectedRoom.value?.guestDetails?.id;
      if (!bookingId) throw new Error("No booking found to check in.");

      await checkInBooking(bookingId, {
        check_in_datetime: toPHDateTimeString(now),
        check_out_datetime: toPHDateTimeString(out),
        amount_received: amountReceived,
        deposit,
        is_paid: paid,
      });
    }

    // Update local UI mirror
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

    // Broadcast
    if (paymentFlow.value === "WALKIN") {
      emitBookingsChanged("walkin-booked", null, room.id);
    } else {
      emitBookingsChanged("checked-in", selectedRoom.value?.guestDetails?.id || null, room.id);
    }
    emitRoomsChanged("status-updated", room.id);

    toast.add({
      severity: "success",
      summary: paymentFlow.value === "WALKIN" ? "Walk-In Checked In" : "Booking Checked In",
      detail: "Payment stored and times persisted.",
      life: 3000,
    });

    // Close dialogs after success
    paymentDialogVisible.value = false;
    BookingDialogVisible.value = false;
    DialogVisible.value = false;

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
        const deposit = Number(paymentDetails.value.deposit) || 0;
        const rate = Number(selectedRoom.value?.guestDetails?.selectedrate) || 0;
        return amountReceived - (rate + deposit);
    });

    // Total amount due = rate + deposit
    const totalAmountDue = computed(() => {
        const rate = Number(selectedRoom.value?.guestDetails?.selectedrate) || 0;
        const deposit = Number(paymentDetails.value.deposit) || 0;
        return rate + deposit;
    });

    // Validation for Insufficient Amount compares against (rate + deposit)
    const isAmountInsufficient = computed(() => {
        const amountReceived = Number(paymentDetails.value.amountReceived) || 0;
        const deposit = Number(paymentDetails.value.deposit) || 0;
        const rate = Number(selectedRoom.value?.guestDetails?.selectedrate) || 0;
        return amountReceived < (rate + deposit);
    });
    // Reset Payment Form
    function resetPaymentForm() {
        paymentDetails.value = {
            amountReceived: "",
            deposit: "",
        };
    }

    // Open Payment Dialog
   async function openPaymentDialog(room) {
  // Always clear payment inputs
  paymentDetails.value = { amountReceived: "", deposit: "" };

  // Decide the flow strictly from the room state
  const looksBooked = room?.status === "Booked";

  // Build a clean selectedRoom shell
  selectedRoom.value = { ...room, guestDetails: null };

  if (looksBooked) {
    paymentFlow.value = "BOOKED";

    // Ensure we have the latest booking WITH an id
    let booking = room.guestDetails || null;
    if (!booking?.id) {
      try {
        const res = await fetchLatestBooking(room.id);
        if (res?.data && Object.keys(res.data).length) {
          booking = {
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
      }
    }

    // If still no booking info, block Payment with a clear error
    if (!booking?.id) {
      toast.add({ severity: "error", summary: "No booking found", detail: "Cannot check in without a valid booking.", life: 3000 });
      return;
    }

    // Deep copy server booking into selectedRoom
    selectedRoom.value.guestDetails = { ...booking };

    // Optional: scrub transient form so it can’t leak later
    guestDetails.value = {
      guestName: "",
      cellphone: "",
      guestEmail: "",
      checkInDateTime: null,
      selectedHours: null,
      selectedrate: null,
      bookingType: guestDetails.value.bookingType, // keep computed to avoid ref errors
      payment: { amountReceived: 0, deposit: 0, isPaid: false },
    };

  } else {
    // WALK-IN flow uses the transient form *once* to create an Occupied booking
    paymentFlow.value = "WALKIN";
    const g = guestDetails.value || {};
    selectedRoom.value.guestDetails = {
      guestName: g.guestName ?? "",
      cellphone: g.cellphone ?? "",
      guestEmail: g.guestEmail ?? "",
      selectedHours: g.selectedHours ?? null,
      selectedrate: g.selectedrate ?? null,
      notes: g.notes ?? "",
      bookingType: "WALK-IN",
      payment: { amountReceived: 0, deposit: 0, isPaid: false },
    };
  }

  paymentDialogVisible.value = true;
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

            // Update local state
            rooms.value[roomIndex].guestDetails.selectedHours +=
                additionalHours.value;
            rooms.value[roomIndex].guestDetails.extendedHours =
                (rooms.value[roomIndex].guestDetails.extendedHours || 0) +
                additionalHours.value;
            rooms.value[roomIndex].guestDetails.selectedrate = newTotal.value;
            // Update check-out time
            const checkInDate = new Date(
                rooms.value[roomIndex].guestDetails.checkInDateTime
            );
            const newCheckOut = new Date(
                checkInDate.getTime() +
                    rooms.value[roomIndex].guestDetails.selectedHours *
                        60 *
                        60 *
                        1000
            );
            rooms.value[roomIndex].guestDetails.checkOutDateTime =
                newCheckOut.toISOString();

            // Persist changes
            localStorage.setItem("rooms", JSON.stringify(rooms.value));

            // Simulate API call
            await updateRoomStatus(selectedRoom.value.id, "Occupied");

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
                        notes: res.data.notes,
                        roomCode: res.data.room_code,
                        bookCode: res.data.book_code,
                        createdAt: res.data.created_at,
                        checkInDateTime: res.data.check_in_datetime,
                        checkOutDateTime: res.data.check_out_datetime, 
                        bookingType: res.data.booking_type,
                        payment: res.data.payment || selectedRoom.value.guestDetails?.payment || null,
                    };
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

        <!-- Dialog -->
        <Dialog
            v-model:visible="DialogVisible"
            header="Room Details"
            :modal="true"
            :dismissable-mask="true"
        >
            <template #header>
                <div
                    class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4 py-3"
                >
                    <!-- Left Section: Room Information -->
                    <div class="space-y-1">
                        <div class="flex items-baseline gap-2">
                            <h2 class="text-2xl font-bold">
                                Room {{ selectedRoom?.roomNumber }}
                            </h2>
                            <span class="text-lg">|</span>
                            <span class="text-lg font-semibold">
                                {{ selectedRoom?.type }}
                            </span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-medium"> Floor: </span>
                            <span class="text-sm">
                                {{ selectedRoom?.floor || "N/A" }}
                            </span>
                        </div>
                    

                    </div>

                    <!-- Right Section: Status Indicator -->
                    <div class="flex items-center gap-3">
                        <div
                            class="h-full w-1 rounded-l-md"
                            :class="{
                                'bg-green-500':
                                    selectedRoom?.status === 'Available',
                                'bg-blue-500': selectedRoom?.status === 'Booked',
                                'bg-yellow-500':
                                    selectedRoom?.status === 'Cleaning',
                                'bg-red-500': selectedRoom?.status === 'Occupied',
                                'bg-gray-500': ![
                                    'Available',
                                    'Booked',
                                    'Cleaning',
                                    'Occupied',
                                ].includes(selectedRoom?.status),
                            }"
                        ></div>
                        <div class="space-y-1">
                            <span
                                class="text-xs font-medium uppercase tracking-wide"
                            >
                                Status
                            </span>
                            <p
                                class="text-sm font-semibold"
                                :class="{
                                    'text-green-600':
                                        selectedRoom?.status === 'Available',
                                    'text-blue-600':
                                        selectedRoom?.status === 'Booked',
                                    'text-yellow-600':
                                        selectedRoom?.status === 'Cleaning',
                                    'text-red-600':
                                        selectedRoom?.status === 'Occupied',
                                    'text-gray-600': ![
                                        'Available',
                                        'Booked',
                                        'Cleaning',
                                        'Occupied',
                                    ].includes(selectedRoom?.status),
                                }"
                            >
                                {{ selectedRoom?.status }}
                            </p>
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
                            Selected Hours:
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
  @click="async () => { await openDialog(selectedRoom); openPaymentDialog(selectedRoom); }"
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
                        <strong>Selected Hours:</strong>
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




                    <div class="mt-4 pt-4 border-t">
                        <h4 class="text-xl mb-2 font-bold">Payment Details</h4>
                        <p>
                            <strong>Total Amount:</strong>
                            {{
                                selectedRoom.guestDetails?.selectedrate
                                    ? formatCurrency(
                                        selectedRoom.guestDetails.selectedrate
                                    )
                                    : "N/A"
                            }}
                        </p>
                        <p>
                            <strong>Amount Received:</strong>
                            {{
                                selectedRoom.guestDetails?.payment?.amountReceived !== undefined &&
                                selectedRoom.guestDetails?.payment?.amountReceived !== null
                                    ? formatCurrency(
                                        selectedRoom.guestDetails.payment.amountReceived
                                    )
                                    : "N/A"
                            }}
                        </p>
                        <p>
                            <strong>Deposit:</strong>
                            {{
                                selectedRoom.guestDetails?.payment?.deposit !== undefined &&
                                selectedRoom.guestDetails?.payment?.deposit !== null
                                    ? formatCurrency(
                                        selectedRoom.guestDetails.payment.deposit
                                    )
                                    : "N/A"
                            }}
                        </p>

                        <p>
                            <strong>Payment Status:</strong>
                            <span
                                :class="{
                                    'text-white rounded-full px-2 py-1 text-sm ml-2 ': true,
                                    'bg-green-500':
                                        selectedRoom.guestDetails?.payment?.isPaid,
                                    'bg-red-500':
                                        !selectedRoom.guestDetails?.payment?.isPaid,
                                }"
                            >
                                {{
                                    selectedRoom.guestDetails?.payment?.isPaid
                                        ? "Paid"
                                        : "Pending"
                                }}
                            </span>
                        </p>
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

  <div class="grid grid-cols-3 gap-4">
    <div
      v-for="(rate, hours) in selectedRoom?.rate"
      :key="hours"
      :class="[
        'p-4 border rounded-lg cursor-pointer',
        { 'border-blue-500 bg-blue-50': guestDetails.selectedHours === parseInt(hours) },
      ]"
      @click="BookingselectRateAndHours(parseInt(hours), Number(selectedRoom?.rate?.[hours] ?? 0))"
    >
      <div class="font-semibold text-lg">
        {{ hours }} Hours
      </div>

      <div class="text-gray-700 mt-1">
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
                <p class="font-medium mb-2">
                    Additional Notes:
                    {{ selectedRoom?.guestDetails?.notes || "N/A" }}
                </p>
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
            style="width: 70vh"
        >
            <template #header>
                <div class="font-bold text-xl">
                    Payment for Room {{ selectedRoom?.roomNumber }}
                </div>
            </template>

            <div class="p-4 space-y-4">
                <!-- Booking Details -->
                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="space-y-2">
                        <h4 class="text-lg font-semibold">Details</h4>
                        <p>
                            Guest Name:
                            {{ selectedRoom?.guestDetails?.guestName || "N/A" }}
                        </p>
                        <p>
                            Selected Hours:
                            {{ selectedRoom?.guestDetails?.selectedHours || "N/A" }}
                            Hours
                        </p>
                        <p>
                            Rate:
                            {{
                                formatCurrency(
                                    selectedRoom?.guestDetails?.selectedrate || 0
                                )
                            }}
                        </p>
                        <p>
                            Total Amount:
                            {{
                                formatCurrency(
                                    selectedRoom?.guestDetails?.selectedrate || 0
                                )
                            }}
                        </p>
                    </div>
                </div>

                <!-- Payment Details -->
                <div class="space-y-4">
                    <!-- Total Amount Due -->
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <div class="flex justify-between items-center">
                            <span class="font-medium">Total Amount Due:</span>
                            <span class="font-semibold text-lg">
                                {{ formatCurrency(totalAmountDue) }}
                            </span>
                        </div>
                    </div>

                    <!-- Amount Received -->
                    <div class="space-y-2">
                        <InputText
                            v-model="paymentDetails.amountReceived"
                            placeholder="Enter amount received"
                            class="w-full"
                            type="number"
                        />
                    </div>

                    <!-- Deposit -->
                    <div class="space-y-2">
                        <InputText
                            v-model="paymentDetails.deposit"
                            placeholder="Enter deposit amount"
                            class="w-full"
                            type="number"
                        />
                    </div>

                    <!-- Change -->
                    <div v-if="calculateChange !== null" class="space-y-2">
                        <label class="block text-sm font-medium text-gray-600">
                            Change
                        </label>
                        <InputText
                            :modelValue="formatCurrency(calculateChange)"
                            readonly
                            class="w-full bg-gray-100"
                        />
                    </div>

                    <!-- Validation Message -->
                    <div v-if="isAmountInsufficient" class="text-red-500 text-sm">
                        The amount received is insufficient. Please provide more
                        funds.
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
                    @click="handleWalkInPayment"
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

    </style>
