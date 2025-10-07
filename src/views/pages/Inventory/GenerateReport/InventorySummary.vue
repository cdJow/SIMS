<script setup>
import Chart1 from "./Chart1.vue";
import LowStockAlert from "./LowStockAlert.vue";
import StockMovement from "./StockMovement.vue";
import SummaryWidget from "./SummaryWidget.vue";
</script>

<template>
    <div>
        <SummaryWidget />
    </div>
    <div class="grid grid-cols-2 gap-4">
        <StockMovement />
        <LowStockAlert />
    
    </div>

     <div>
          <Chart1 />
    </div>
</template>
