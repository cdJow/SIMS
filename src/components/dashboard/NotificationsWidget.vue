<script setup>
import { ref } from "vue";

// Sample Data for Today's Check-ins and Check-outs
const checkIns = ref([
    { guestName: "Richard Jones", roomNumber: "101", time: "10:00 AM" },
    { guestName: "Anna Smith", roomNumber: "203", time: "11:30 AM" },
]);

const checkOuts = ref([
    { guestName: "John Doe", roomNumber: "105", time: "9:00 AM" },
    { guestName: "Jane Davis", roomNumber: "304", time: "10:15 AM" },
]);

const menu = ref(null);

const items = ref([
    { label: "Add New", icon: "pi pi-fw pi-plus" },
    { label: "Remove", icon: "pi pi-fw pi-trash" },
]);
</script>
<template>
    <div class="card">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
            <div class="font-semibold text-xl">
                Today's Check-ins and Check-outs
            </div>
            <div>
                <Button
                    icon="pi pi-ellipsis-v"
                    class="p-button-text p-button-plain p-button-rounded"
                    @click="$refs.menu.toggle($event)"
                ></Button>
                <Menu ref="menu" popup :model="items" class="!min-w-40"></Menu>
            </div>
        </div>

        <!-- Check-ins Section -->
        <span class="block text-muted-color font-medium mb-4"
            >TODAY'S CHECK-INS</span
        >
        <ul class="p-0 mx-0 mt-0 mb-6 list-none">
            <li
                v-for="(checkIn, index) in checkIns"
                :key="index"
                class="flex items-center py-6 border-b border-surface"
            >
                <div
                    class="w-12 h-12 flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-full mr-4 shrink-0"
                >
                    <i class="pi pi-user-plus !text-xl text-green-500"></i>
                </div>
                <span
                    class="text-surface-900 dark:text-surface-0 leading-normal"
                >
                    <strong>{{ checkIn.guestName }}</strong>
                    <span class="text-surface-700 dark:text-surface-100">
                        checked into
                        <span class="text-primary font-bold"
                            >Room {{ checkIn.roomNumber }}</span
                        >
                        at {{ checkIn.time }}.
                    </span>
                </span>
            </li>
        </ul>

        <!-- Check-outs Section -->
        <span class="block text-muted-color font-medium mb-4"
            >TODAY'S CHECK-OUTS</span
        >
        <ul class="p-0 mx-0 mt-0 mb-6 list-none">
            <li
                v-for="(checkOut, index) in checkOuts"
                :key="index"
                class="flex items-center py-6 border-b border-surface"
            >
                <div
                    class="w-12 h-12 flex items-center justify-center bg-red-100 dark:bg-red-400/10 rounded-full mr-4 shrink-0"
                >
                    <i class="pi pi-user-minus !text-xl text-red-500"></i>
                </div>
                <span
                    class="text-surface-900 dark:text-surface-0 leading-normal"
                >
                    <strong>{{ checkOut.guestName }}</strong>
                    <span class="text-surface-700 dark:text-surface-100">
                        checked out from
                        <span class="text-primary font-bold"
                            >Room {{ checkOut.roomNumber }}</span
                        >
                        at {{ checkOut.time }}.
                    </span>
                </span>
            </li>
        </ul>
    </div>
</template>
