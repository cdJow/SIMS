<script setup>
import { ref, computed, onMounted } from "vue";
import { useCurrentUser } from "@/service/CurrentUser";

import AppMenuItem from "./AppMenuItem.vue";

const { user } = useCurrentUser();

// Function to check if user has access to a specific role
const hasRole = (requiredRoles) => {
    if (!user.value) return false;
    
    // Convert single role to array for consistent processing
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    // Get user's primary role and additional roles
    const userRoles = [user.value.role];
    if (user.value.additional_roles && Array.isArray(user.value.additional_roles)) {
        userRoles.push(...user.value.additional_roles);
    }
    
    // Check if user has any of the required roles
    return rolesArray.some(role => userRoles.includes(role));
};

// Full menu structure with role requirements
const fullMenuModel = [
    {
        label: "System Admin",
        requiredRoles: ["System Admin"],
        items: [
            {
                label: "Rates Management",
                icon: "pi pi-fw pi-money-bill",
                requiredRoles: ["System Admin"],
                items: [
                    {
                        label: "Rate Configuration",
                        icon: "pi pi-fw pi-plus",
                        to: "/Rates/RatePage",
                        requiredRoles: ["System Admin"],
                    },
                    {
                        label: "Discount",
                        icon: "pi pi-fw pi-percentage",
                        to: "/Rooms/Discount",
                        requiredRoles: ["System Admin"],
                    },
                ],
            },
            {
                label: "Room Management",
                icon: "pi pi-fw pi-cog",
                requiredRoles: ["System Admin"],
                items: [
                    {
                        label: "Add Rooms",
                        icon: "pi pi-fw pi-plus",
                        to: "/Rooms/AddRoom",
                        requiredRoles: ["System Admin"],
                    },
                    {
                        label: "Room Control",
                        icon: "pi pi-fw pi-cog",
                        to: "/Rooms/RoomControl",
                        requiredRoles: ["System Admin"],
                    },
                ],
            },
            {
                label: "Account Management ",
                icon: "pi  pi-users",
                to: "/Accounts/AccountsPanel",
                requiredRoles: ["System Admin"],
            },
            {
                label: "Canceled Bookings",
                icon: "pi pi-fw pi-file",
                to: "/Rooms/CanceledBookingAdmin",
                requiredRoles: ["System Admin"],
            },
            {
                label: "POS Invoice",
                icon: "pi pi-fw pi-file",
                to: "/POS/InvoiceAdmin",
                requiredRoles: ["System Admin"],
            },
            {
                label: "Room Invoices",
                icon: "pi pi-fw pi-file",
                to: "/POS/RoomInvoiceAdmin",
                requiredRoles: ["System Admin"],
            },
        ],
    },
    {
        label: "Manager",
        requiredRoles: ["Manager"],
        items: [
            { 
                label: "Dashboard", 
                icon: "pi pi-fw pi-home", 
                to: "/Dashboard",
                requiredRoles: ["Manager", "System Admin", "Front Desk"]
            },
            {
                label: "Inventory Summary",
                icon: "pi pi-fw pi-file-pdf",
                to: "/Inventory/GenerateReport/InventorySummary",
                requiredRoles: ["Manager", "System Admin"],
            },
            {
                label: "View Inventory",
                icon: "pi pi-fw pi-eye",
                to: "/Inventory/ViewInventory/ViewItems",
                requiredRoles: ["Manager", "System Admin", "Inventory"],
            },
            {
                label: "POS Invoices",
                icon: "pi pi-fw pi-file",
                to: "/POS/Invoice",
                requiredRoles: ["Manager", "System Admin", "Front Desk"],
            },
            {
                label: "Room Invoices",
                icon: "pi pi-fw pi-file",
                to: "/POS/RoomInvoice",
                requiredRoles: ["Manager", "System Admin", "Front Desk"],
            },
        ],
    },
    {
        label: "Front Desk",
        requiredRoles: ["Front Desk"],
        items: [
            {
                label: "Rooms ",
                icon: "pi pi-fw pi-info-circle",
                to: "/Rooms/RoomList",
                requiredRoles: ["Front Desk", "Manager", "System Admin"],
            },
            {
                label: "Check-In List",
                icon: "pi pi-fw pi-sign-in",
                to: "/Rooms/CheckInList",
                requiredRoles: ["Front Desk", "Manager", "System Admin"],
            },
            {
                label: "Check-Out List",
                icon: "pi pi-fw pi-sign-out",
                to: "/Rooms/CheckoutList",
                requiredRoles: ["Front Desk", "Manager", "System Admin"],
            },
            {
                label: "Canceled Booking",
                icon: "pi pi-fw pi-ban",
                to: "/Rooms/CanceledBooking",
                requiredRoles: ["Front Desk", "Manager", "System Admin"],
            },
            {
                label: "Damage Report",
                icon: "pi pi-fw pi-minus-circle",
                to: "/Rooms/DamageReport",
                requiredRoles: ["Front Desk", "Manager", "System Admin", "Inventory"],
            },
            {
                label: "POS ",
                icon: "pi pi-fw pi-shopping-cart",
                to: "/POS/POS",
                requiredRoles: ["Front Desk", "Manager", "System Admin"],
            },
            {
                label: "POS Invoices",
                icon: "pi pi-fw pi-file",
                to: "/POS/Invoice",
                requiredRoles: ["Front Desk", "Manager", "System Admin"],
            },
            {
                label: "Room Invoices",
                icon: "pi pi-fw pi-file",
                to: "/POS/RoomInvoice",
                requiredRoles: ["Front Desk", "Manager", "System Admin"],
            },
        ],
    },
    {
        label: "Inventory",
        requiredRoles: ["Inventory"],
        items: [
            {
                label: "Products/Items",
                icon: "pi pi-fw pi-plus",
                requiredRoles: ["Inventory", "System Admin"],
                items: [
                    {
                        label: "Add Products",
                        icon: "pi pi-fw pi-box",
                        to: "/Inventory/Additems/ConsumableForm",
                        requiredRoles: ["Inventory", "System Admin"],
                    },
                    {
                        label: "Add Items",
                        icon: "pi pi-fw pi-box",
                        to: "/Inventory/AddItems/NonConsumableForm",
                        requiredRoles: ["Inventory", "System Admin"],
                    },
                ],
            },
            {
                label: "Item Control",
                icon: "pi pi-fw pi-cog",
                to: "/Inventory/ManageInventory/ManageItems",
                requiredRoles: ["Inventory", "System Admin", "Manager"],
            },
            {
                label: "Amenities Control",
                icon: "pi pi-fw pi-cog",
                to: "/Inventory/ManageInventory/CleanAmenities",
                requiredRoles: ["Inventory", "System Admin", "Manager"],
            },
            {
                label: "Stock History",
                icon: "pi pi-fw pi-calendar",
                to: "/Inventory/GenerateReport/StockHistory",
                requiredRoles: ["Inventory", "System Admin", "Manager"],
            },
            {
                label: "Low Stock Report",
                icon: "pi pi-fw pi-exclamation-circle",
                to: "/Inventory/GenerateReport/LowstockReport",
                requiredRoles: ["Inventory", "System Admin", "Manager"],
            },
            {
                label: "Expired Items Report",
                icon: "pi pi-fw pi-times-circle",
                to: "/Inventory/GenerateReport/ExpiredItems",
                requiredRoles: ["Inventory", "System Admin", "Manager"],
            },
            {
                label: "Damaged Report",
                icon: "pi pi-fw pi-minus-circle",
                to: "/Rooms/DamageReport",
                requiredRoles: ["Inventory", "System Admin", "Manager", "Front Desk"],
            },
        ],
    },
];



// Filter menu based on user's roles
const filterMenuItems = (items) => {
    return items.filter(item => {
        // If item doesn't have role requirements, show it to everyone
        if (!item.requiredRoles) {
            return true;
        }
        
        // Check if user has required roles
        if (!hasRole(item.requiredRoles)) {
            return false;
        }
        
        // If item has sub-items, recursively filter them
        if (item.items) {
            const filteredSubItems = filterMenuItems(item.items);
            // Only show the item if it has accessible sub-items or if it has a direct route
            if (filteredSubItems.length > 0 || item.to) {
                item.items = filteredSubItems;
                return true;
            }
            return false;
        }
        
        return true;
    });
};

// Computed property for filtered menu model
const model = computed(() => {
    if (!user.value || !user.value.role) return [];
    return filterMenuItems(JSON.parse(JSON.stringify(fullMenuModel)));
});
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
