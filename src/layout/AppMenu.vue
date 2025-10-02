<script setup>
import { ref } from "vue";

import AppMenuItem from "./AppMenuItem.vue";

const model = ref([
    {
        label: " Admin",
        items: [
            {
                label: "Rates Management",
                icon: "pi pi-fw pi-money-bill",
                items: [
                    {
                        label: "Rate Configuration",
                        icon: "pi pi-fw pi-plus",
                        to: "/Rates/RatePage",
                    },

                    {
                        label: "Discount",
                        icon: "pi pi-fw pi-percentage",
                        to: "/Rooms/Discount",
                    },
                ],
            },
            {
                label: "Room Management",
                icon: "pi pi-fw pi-cog",
                items: [
                    {
                        label: "Add Rooms",
                        icon: "pi pi-fw pi-plus",
                        to: "/Rooms/AddRoom",
                    },

                    {
                        label: "Room Control",
                        icon: "pi pi-fw pi-cog",
                        to: "/Rooms/RoomControl",
                    },
                ],
            },

            {
                label: "Account Management ",
                icon: "pi  pi-users",
                to: "/Accounts/AccountsPanel",
            },
            {
                label: "Canceled Bookings",
                icon: "pi pi-fw pi-file",
                to: "/Rooms/CanceledBookingAdmin",
            },
            {
                label: "POS Invoice",
                icon: "pi pi-fw pi-file",
                to: "/POS/InvoiceAdmin",
            },
            {
                label: "Room Invoices",
                icon: "pi pi-fw pi-file",
                to: "/POS/RoomInvoiceAdmin",
            },
        ],
    },

    {
        label: "Manager",
        items: [
            { label: "Dashboard", icon: "pi pi-fw pi-home", to: "/Dashboard" },
            {
                label: "Inventory Summary",
                icon: "pi pi-fw pi-file-pdf",
                to: "/Inventory/GenerateReport/InventorySummary",
            },
            {
                label: "View Inventory",
                icon: "pi pi-fw pi-eye",
                to: "/Inventory/ViewInventory/ViewItems",
            },
            {
                label: "POS Invoices",
                icon: "pi pi-fw pi-file",
                to: "/POS/Invoice",
            },
            {
                label: "Room Invoices",
                icon: "pi pi-fw pi-file",
                to: "/POS/RoomInvoice",
            },
        ],
    },

    {
        label: "Front Desk",
        items: [
            {
                label: "Rooms ",
                icon: "pi pi-fw pi-info-circle",
                to: "/Rooms/RoomList",
            },
            {
                label: "Check-In List",
                icon: "pi pi-fw pi-sign-in",
                to: "/Rooms/CheckInList", // Add the navigation route here
            },
            {
                label: "Check-Out List",
                icon: "pi pi-fw pi-sign-out",
                to: "/Rooms/CheckoutList", // Add the navigation route here
            },
            {
                label: "Canceled Booking",
                icon: "pi pi-fw pi-ban",
                to: "/Rooms/CanceledBooking",
            },
            {
                label: "Damage Report",
                icon: "pi pi-fw pi-minus-circle",
                to: "/Rooms/DamageReport",
            },
            {
                label: "POS ",
                icon: "pi pi-fw pi-shopping-cart",
                to: "/POS/POS",
            },


            {
                label: "POS Invoices",
                icon: "pi pi-fw pi-file",
                to: "/POS/Invoice",
            },
            {
                label: "Room Invoices",
                icon: "pi pi-fw pi-file",
                to: "/POS/RoomInvoice",
            },
        ],
    },

    {
        label: "Inventory",
        items: [
            {
                label: "Products/Items",
                icon: "pi pi-fw pi-plus",
                items: [
                    {
                        label: "Add Products",
                        icon: "pi pi-fw pi-box",
                        to: "/Inventory/Additems/ConsumableForm",
                    },
                    {
                        label: "Add Items",
                        icon: "pi pi-fw pi-box",
                        to: "/Inventory/AddItems/NonConsumableForm",
                    },
                ],
            },

            {
                label: "Item Control",
                icon: "pi pi-fw pi-cog",
                to: "/Inventory/ManageInventory/ManageItems",
            },
            {
                label: "Stock History",
                icon: "pi pi-fw pi-calendar",
                to: "/Inventory/GenerateReport/StockHistory",
            },
            {
                label: "Low Stock Report",
                icon: "pi pi-fw pi-exclamation-circle",
                to: "/Inventory/GenerateReport/LowstockReport",
            },
            {
                label: "Expired Items Report",
                icon: "pi pi-fw pi-times-circle",
                to: "/Inventory/GenerateReport/ExpiredItems",
            },

            {
                label: "Damaged Report",
                icon: "pi pi-fw pi-minus-circle",
                to: "/Rooms/DamageReport",
            },
        ],
    },



    {},
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item
                v-if="!item.separator"
                :item="item"
                :index="i"
            ></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<!--


  {
                        label: "Stock Management",
                        icon: "pi pi-fw pi-sort",
                        items: [
                            {
                                label: "Track Stock In",
                                icon: "pi pi-fw pi-arrow-circle-down",
                                to: "",
                            },
                            {
                                label: "Track Stock Out",
                                icon: "pi pi-fw pi-arrow-circle-up",
                                to: "",
                            },

                            {
                                label: "Overstock Alerts",
                                icon: "pi pi-fw pi-bell",
                                to: "",
                            },
                        ],
                    },





    {
        label: "UI Components",
        items: [
            {
                label: "Form Layout",
                icon: "pi pi-fw pi-id-card",
                to: "/uikit/formlayout",
            },
            {
                label: "Input",
                icon: "pi pi-fw pi-check-square",
                to: "/uikit/input",
            },
            {
                label: "Button",
                icon: "pi pi-fw pi-mobile",
                to: "/uikit/button",
                class: "rotated-icon",
            },
            { label: "Table", icon: "pi pi-fw pi-table", to: "/uikit/table" },
            { label: "List", icon: "pi pi-fw pi-list", to: "/uikit/list" },
            { label: "Tree", icon: "pi pi-fw pi-share-alt", to: "/uikit/tree" },
            { label: "Panel", icon: "pi pi-fw pi-tablet", to: "/uikit/panel" },
            {
                label: "Overlay",
                icon: "pi pi-fw pi-clone",
                to: "/uikit/overlay",
            },
            { label: "Media", icon: "pi pi-fw pi-image", to: "/uikit/media" },
            { label: "Menu", icon: "pi pi-fw pi-bars", to: "/uikit/menu" },
            {
                label: "Message",
                icon: "pi pi-fw pi-comment",
                to: "/uikit/message",
            },
            { label: "File", icon: "pi pi-fw pi-file", to: "/uikit/file" },
            {
                label: "Chart",
                icon: "pi pi-fw pi-chart-bar",
                to: "/uikit/charts",
            },
            {
                label: "Timeline",
                icon: "pi pi-fw pi-calendar",
                to: "/uikit/timeline",
            },
            { label: "Misc", icon: "pi pi-fw pi-circle", to: "/uikit/misc" },
        ],
    },
    {
        label: "Pages",
        icon: "pi pi-fw pi-briefcase",
        to: "/pages",
        items: [
            {
                label: "Landing",
                icon: "pi pi-fw pi-globe",
                to: "/landing",
            },
            {
                label: "Auth",
                icon: "pi pi-fw pi-user",
                items: [
                    {
                        label: "Login",
                        icon: "pi pi-fw pi-sign-in",
                        to: "/auth/login",
                    },
                    {
                        label: "Error",
                        icon: "pi pi-fw pi-times-circle",
                        to: "/auth/error",
                    },
                    {
                        label: "Access Denied",
                        icon: "pi pi-fw pi-lock",
                        to: "/auth/access",
                    },
                ],
            },
            {
                label: "Crud",
                icon: "pi pi-fw pi-pencil",
                to: "/pages/crud",
            },
            {
                label: "Not Found",
                icon: "pi pi-fw pi-exclamation-circle",
                to: "/pages/notfound",
            },
            {
                label: "Empty",
                icon: "pi pi-fw pi-circle-off",
                to: "/pages/empty",
            },
        ],
    },
    {
        label: "Hierarchy",
        items: [
            {
                label: "Submenu 1",
                icon: "pi pi-fw pi-bookmark",
                items: [
                    {
                        label: "Submenu 1.1",
                        icon: "pi pi-fw pi-bookmark",
                        items: [
                            {
                                label: "Submenu 1.1.1",
                                icon: "pi pi-fw pi-bookmark",
                            },
                            {
                                label: "Submenu 1.1.2",
                                icon: "pi pi-fw pi-bookmark",
                            },
                            {
                                label: "Submenu 1.1.3",
                                icon: "pi pi-fw pi-bookmark",
                            },
                        ],
                    },
                    {
                        label: "Submenu 1.2",
                        icon: "pi pi-fw pi-bookmark",
                        items: [
                            {
                                label: "Submenu 1.2.1",
                                icon: "pi pi-fw pi-bookmark",
                            },
                        ],
                    },
                ],
            },
            {
                label: "Submenu 2",
                icon: "pi pi-fw pi-bookmark",
                items: [
                    {
                        label: "Submenu 2.1",
                        icon: "pi pi-fw pi-bookmark",
                        items: [
                            {
                                label: "Submenu 2.1.1",
                                icon: "pi pi-fw pi-bookmark",
                            },
                            {
                                label: "Submenu 2.1.2",
                                icon: "pi pi-fw pi-bookmark",
                            },
                        ],
                    },
                    {
                        label: "Submenu 2.2",
                        icon: "pi pi-fw pi-bookmark",
                        items: [
                            {
                                label: "Submenu 2.2.1",
                                icon: "pi pi-fw pi-bookmark",
                            },
                        ],
                    },
                ],
            },
        ],
    },
    {
        label: "Get Started",
        items: [
            {
                label: "Documentation",
                icon: "pi pi-fw pi-book",
                to: "/documentation",
            },
            {
                label: "View Source",
                icon: "pi pi-fw pi-github",
                url: "https://github.com/primefaces/sakai-vue",
                target: "_blank",
            },
        ],
    },



-->
