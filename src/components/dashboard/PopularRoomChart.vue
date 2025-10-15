<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { getPopularRooms } from "@/api/analytics";

/* ---------------- Range mode + period picker ---------------- */
const mode = ref("weekly"); // "weekly" | "monthly" | "yearly"
const loading = ref(false);
const error = ref(null);

/* ---- Date & period helpers ---- */
function fmt(d){ return d.toISOString().slice(0,10); }
function startOfWeek(d){ const x=new Date(d);const day=x.getDay();const diff=(day+6)%7;x.setDate(x.getDate()-diff);x.setHours(0,0,0,0);return x;}
function endOfWeek(s){const e=new Date(s);e.setDate(e.getDate()+6);e.setHours(23,59,59,999);return e;}
function startOfMonth(d){return new Date(d.getFullYear(),d.getMonth(),1,0,0,0,0);}
function endOfMonth(s){return new Date(s.getFullYear(),s.getMonth()+1,0,23,59,59,999);}
function startOfYear(d){return new Date(d.getFullYear(),0,1,0,0,0,0);}
function endOfYear(d){return new Date(d.getFullYear(),11,31,23,59,59,999);}

function buildWeeks(n=12){
  const t=new Date();const arr=[];
  for(let i=0;i<n;i++){
    const e=new Date(t);e.setDate(e.getDate()-(i*7));e.setHours(23,59,59,999);
    const s=new Date(e);s.setDate(s.getDate()-6);s.setHours(0,0,0,0);
    const daysAgo=i*7;
    const label=daysAgo===0?'Last 7 days':`${daysAgo+1}-${daysAgo+7} days ago`;
    arr.push({key:`W-${fmt(s)}_${fmt(e)}`,label,start:new Date(s),end:new Date(e)});
  }
  return arr;
}
function buildMonths(n=12){
  const t=new Date();const arr=[];let cur=startOfMonth(t);
  for(let i=0;i<n;i++){const s=new Date(cur),e=endOfMonth(s);
    arr.push({key:`M-${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,"0")}`,label:s.toLocaleDateString(undefined,{month:"short",year:"numeric"}),start:s,end:e});
    cur=new Date(s.getFullYear(),s.getMonth()-1,1);}
  return arr;
}
function buildYears(n=6){
  const y=new Date().getFullYear();
  return Array.from({length:n},(_,i)=>{
    const yr=y-i,s=new Date(yr,0,1,0,0,0,0),e=new Date(yr,11,31,23,59,59,999);
    return{key:`Y-${yr}`,label:String(yr),start:s,end:e};
  });
}

/* reactive period choices */
const periodOptions=computed(()=>mode.value==="weekly"?buildWeeks(16):mode.value==="monthly"?buildMonths(14):buildYears(8));
const selectedKey=ref("");
watch(periodOptions,(opts)=>{selectedKey.value=opts?.[0]?.key??"";},{immediate:true});
const selectedPeriod=computed(()=>periodOptions.value.find(p=>p.key===selectedKey.value)||periodOptions.value[0]);

function goPrev(){
  const idx=periodOptions.value.findIndex(p=>p.key===selectedKey.value);
  if(idx>=0&&idx<periodOptions.value.length-1)selectedKey.value=periodOptions.value[idx+1].key;
}
function goNext(){
  const idx=periodOptions.value.findIndex(p=>p.key===selectedKey.value);
  if(idx>0)selectedKey.value=periodOptions.value[idx-1].key;
}

/* ---------------- Real data from API ---------------- */
const roomsData = ref([]);

async function fetchRoomsData() {
  if (!selectedPeriod.value) return;
  
  try {
    loading.value = true;
    error.value = null;
    
    const response = await getPopularRooms(mode.value, selectedKey.value, 100);
    roomsData.value = response.rooms || [];
    
  } catch (err) {
    console.error('Error fetching rooms data:', err);
    error.value = 'Failed to load room data';
    roomsData.value = [];
  } finally {
    loading.value = false;
  }
}

/* ---------------- Chart state ---------------- */
const chartData=ref({labels:[],datasets:[]});
const chartOptions=ref({
  responsive:true,maintainAspectRatio:false,
  plugins:{
    legend:{display:false},
    tooltip:{
      mode:"index",
      intersect:false,
      callbacks: {
        afterLabel: (context) => {
          const room = roomsData.value[context.dataIndex];
          return room ? `Room Revenue: ₱${room.room_revenue.toLocaleString()}` : '';
        }
      }
    }
  },
  scales:{
    x:{ticks:{maxRotation:0,minRotation:0},grid:{display:false}},
    y:{beginAtZero:true,grid:{drawBorder:false},title:{display:true,text:'Number of Stays'}},
  },
});

function renderChart(){
  if (!roomsData.value.length) {
    chartData.value = { labels: [], datasets: [] };
    return;
  }
  
  // Sort rooms by stays (most to least) and then by room number
  const sortedRooms = [...roomsData.value].sort((a, b) => {
    if (b.stays !== a.stays) {
      return b.stays - a.stays;
    }
    return parseInt(a.room_number) - parseInt(b.room_number);
  });
  
  // Generate color gradient based on stay count
  const maxStays = Math.max(...sortedRooms.map(r => r.stays));
  const colors = sortedRooms.map((room, index) => {
    const intensity = room.stays / maxStays;
    if (room.stays === 0) return '#E5E7EB'; // Gray for no stays
    // Blue gradient from light to dark based on popularity
    const blue = Math.floor(59 + (196 * intensity)); // 59 to 255
    return `rgb(59, 130, ${blue})`;
  });
  
  chartData.value = {
    labels: sortedRooms.map(r => `Room ${r.room_number}`),
    datasets: [{
      label: "Checked In",
      data: sortedRooms.map(r => r.stays),
      backgroundColor: colors,
      borderWidth: 1,
      borderColor: '#E5E7EB'
    }],
  };
}

// Watch for changes and fetch new data
watch([mode, selectedKey], fetchRoomsData);
watch(roomsData, renderChart);

// Initial load
onMounted(() => {
  fetchRoomsData();
});

/* Label for date range */
const periodLabel=computed(()=>{
  const p=selectedPeriod.value;if(!p)return"";
  const opts={month:"short",day:"numeric",year:"numeric"};
  return `${p.start.toLocaleDateString(undefined,opts)} — ${p.end.toLocaleDateString(undefined,opts)}`;
});

// Stats computed
const totalStays = computed(() => roomsData.value.reduce((sum, room) => sum + room.stays, 0));
const totalRoomRevenue = computed(() => roomsData.value.reduce((sum, room) => sum + room.room_revenue, 0));
const occupiedRooms = computed(() => roomsData.value.filter(room => room.stays > 0).length);
</script>

<template>
  <div class="card mb-0">
    <div class="flex items-center justify-between mb-2 gap-3">
      <div>
        <h3 class="text-lg font-semibold">Most Availed Rooms</h3>
        <div class="text-xs opacity-80 mt-1">{{ periodLabel }}</div>
        
        <!-- Stats row -->
        <div class="flex gap-4 mt-1 text-xs opacity-70" v-if="!loading && !error && roomsData.length">
          <span>{{ occupiedRooms }} rooms occupied</span>
          <span>{{ totalStays }} total stays</span>
          <span>₱{{ totalRoomRevenue.toLocaleString() }} room revenue</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Mode -->
        <select v-model="mode" :disabled="loading"
          class="p-2 border rounded-md text-sm bg-white dark:bg-surface-900 dark:border-surface-700">
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>

        <!-- Period picker -->
        <select v-model="selectedKey" :disabled="loading"
          class="p-2 border rounded-md text-sm bg-white dark:bg-surface-900 dark:border-surface-700">
          <option v-for="p in periodOptions" :key="p.key" :value="p.key">{{ p.label }}</option>
        </select>

        <!-- Prev / Next -->
        <button class="px-2 py-1 border rounded-md text-sm dark:border-surface-700"
                @click="goPrev" :disabled="loading || periodOptions.findIndex(p=>p.key===selectedKey)===periodOptions.length-1">‹</button>
        <button class="px-2 py-1 border rounded-md text-sm dark:border-surface-700"
                @click="goNext" :disabled="loading || periodOptions.findIndex(p=>p.key===selectedKey)<=0">›</button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center h-72 text-muted-color">
      <div class="flex flex-col items-center gap-2">
        <i class="pi pi-spin pi-spinner text-2xl"></i>
        <span class="text-sm">Loading room analytics...</span>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex items-center justify-center h-72 text-muted-color">
      <div class="flex flex-col items-center gap-2">
        <i class="pi pi-exclamation-triangle text-2xl text-red-500"></i>
        <span class="text-sm text-red-600">{{ error }}</span>
        <Button 
          size="small" 
          severity="secondary" 
          @click="fetchRoomsData"
          class="mt-2"
        >
          Retry
        </Button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!roomsData.length" class="flex items-center justify-center h-72 text-muted-color">
      <div class="flex flex-col items-center gap-2">
        <i class="pi pi-calendar-times text-2xl"></i>
        <span class="text-sm">No booking data for this period</span>
      </div>
    </div>

    <!-- Chart container -->
    <div v-else class="h-72">
      <Chart type="bar" :data="chartData" :options="chartOptions" />
    </div>

    <div class="mt-3 text-xs text-muted-color" v-if="!loading && roomsData.length">
      Sorted by Most Popular → Least Popular
    </div>
  </div>
</template>
