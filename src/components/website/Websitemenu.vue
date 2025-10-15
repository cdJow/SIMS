<script setup>
import { ref } from "vue";
import WebsiteMenuItem from "./WebsiteMenuItem.vue";

const model = ref([
    {
        label: "Guest Menu",
        items: [
            {
                label: "Profile",
                icon: "pi pi-fw pi-user",
                to: "/pages/website/ProfilePage",
            },

            {
                label: "Book Rooms",
                icon: "pi pi-fw pi-calendar-plus",
                to: "/pages/website/BookedRooms",
            },
            {
                label: "Accommodations",
                icon: "pi pi-fw pi-dollar",
                to: "/pages/website/TransactionHistory",
            },
        ],
    },
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <website-menu-item
                v-if="!item.separator"
                :item="item"
                :index="i"
            ></website-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>
