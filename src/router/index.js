import AppLayout from "@/layout/AppLayout.vue";
import WebsiteLayout from "@/layout/WebsiteLayout.vue";
import { getCurrentUser } from "@/api/auth";

import { createRouter, createWebHistory } from "vue-router";

// Helper function to check if user has required roles
const hasRequiredRole = (userRoles, requiredRoles) => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    if (!userRoles || userRoles.length === 0) return false;
    
    return requiredRoles.some(role => userRoles.includes(role));
};

// Helper function to get user roles
const getUserRoles = async () => {
    try {
        const userId = localStorage.getItem("userId");
        if (!userId) return [];
        
        const response = await getCurrentUser(userId);
        const user = response.data.user;
        
        const roles = [user.role];
        if (user.additional_roles && Array.isArray(user.additional_roles)) {
            roles.push(...user.additional_roles);
        }
        
        return roles;
    } catch (error) {
        console.error("Error fetching user roles:", error);
        return [];
    }
};

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: "/HomePage",
            component: WebsiteLayout,
            children: [
                {
                    path: "/pages/website/HomePage",
                    name: "Home",
                    component: () =>
                        import("@/views/pages/website/HomePage.vue"),
                },

                {
                    path: "/pages/website/ProfilePage",
                    name: "ProfilePage",
                    component: () =>
                        import("@/views/pages/website/ProfilePage.vue"),
                },

                {
                    path: "/pages/website/RoomCatalog",
                    name: "RoomCatalog",
                    component: () =>
                        import("@/views/pages/website/RoomCatalog.vue"),
                },

                {
                    path: "/pages/website/TransactionHistory",
                    name: "TransactionHistory",
                    component: () =>
                        import("@/views/pages/website/TransactionHistory.vue"),
                },

                {
                    path: "/pages/website/BookedRooms",
                    name: "BookedRooms",
                    component: () =>
                        import("@/views/pages/website/BookedRooms.vue"),
                },
            ],
        },

        {
            path: "/dashboard",
            component: AppLayout,
            meta: { requiresAuth: true }, // Protect dashboard
            children: [
                {
                    path: "/Dashboard",
                    name: "dashboard",
                    component: () => import("@/views/Dashboard.vue"),
                    meta: { requiredRoles: ["Manager", "System Admin", "Front Desk"] },
                },
                {
                    path: "/Rooms/RoomControl",
                    name: "Room Control",
                    component: () =>
                        import("@/views/pages/Rooms/RoomControl.vue"),
                    meta: { requiredRoles: ["System Admin"] },
                },
                {
                    path: "/Accounts/AccountsPanel",
                    name: "Accounts Panel",
                    component: () =>
                        import("@/views/pages/Accounts/AccountsPanel.vue"),
                    meta: { requiredRoles: ["System Admin"] },
                },
                {
                    path: "/Inventory/AddItems/ConsumableForm",
                    name: "ConsumableForm",
                    component: () =>
                        import(
                            "@/views/pages/Inventory/AddItems/ConsumableForm.vue"
                        ),
                    meta: { requiredRoles: ["Inventory", "System Admin"] },
                },

                {
                    path: "/Rooms/RoomList",
                    name: "Room List",
                    component: () => import("@/views/pages/Rooms/RoomList.vue"),
                    meta: { requiredRoles: ["Front Desk", "Manager", "System Admin"] },
                },

            
                {
                    path: "/Rooms/CheckIn",
                    name: "Check In",
                    component: () => import("@/views/pages/Rooms/CheckIn.vue"),
                    meta: { requiredRoles: ["Front Desk", "Manager", "System Admin"] },
                },

                {
                    path: "/Rooms/CheckInList",
                    name: " Check In",
                    component: () =>
                        import("@/views/pages/Rooms/CheckInList.vue"),
                    meta: { requiredRoles: ["Front Desk", "Manager", "System Admin"] },
                },

                {
                    path: "/Rooms/CheckoutList",
                    name: " Check Out List",
                    component: () =>
                        import("@/views/pages/Rooms/CheckoutList.vue"),
                    meta: { requiredRoles: ["Front Desk", "Manager", "System Admin"] },
                },

                {
                    path: "/Rooms/DamageReport",
                    name: " Damage Report",
                    component: () =>
                        import("@/views/pages/Rooms/DamageReport.vue"),
                    meta: { requiredRoles: ["Front Desk", "Manager", "System Admin", "Inventory"] },
                },



                {
                    path: "/Rooms/CanceledBooking",
                    name: " Canceled Booking",
                    component: () =>
                        import("@/views/pages/Rooms/CanceledBooking.vue"),
                    meta: { requiredRoles: ["Front Desk", "Manager", "System Admin"] },
                },

                {
                    path: "/Rooms/CanceledBookingAdmin",
                    name: " Cancelled Booking",
                    component: () =>
                        import("@/views/pages/Rooms/CanceledBookingAdmin.vue"),
                    meta: { requiredRoles: ["System Admin"] },
                },

                {
                    path: "/POS/POS",
                    name: " POS",
                    component: () => import("@/views/pages/POS/POS.vue"),
                    meta: { requiredRoles: ["Front Desk", "Manager", "System Admin"] },
                },

                {
                    path: "/POS/Invoice",
                    name: " Invoice",
                    component: () => import("@/views/pages/POS/Invoice.vue"),
                    meta: { requiredRoles: ["Front Desk", "Manager", "System Admin"] },
                },

                {
                    path: "/POS/RoomInvoice",
                    name: " Room Invoice",
                    component: () =>
                        import("@/views/pages/POS/RoomInvoice.vue"),
                    meta: { requiredRoles: ["Front Desk", "Manager", "System Admin"] },
                },

                {
                    path: "/POS/InvoiceAdmin",
                    name: " Invoice Admin",
                    component: () =>
                        import("@/views/pages/POS/InvoiceAdmin.vue"),
                    meta: { requiredRoles: ["System Admin"] },
                },

                {
                    path: "/POS/RoomInvoiceAdmin",
                    name: " Room AdminInvoice",
                    component: () =>
                        import("@/views/pages/POS/RoomInvoiceAdmin.vue"),
                    meta: { requiredRoles: ["System Admin"] },
                },

                {
                    path: "/Inventory/ViewInventory/ViewItems",
                    name: "View Inventory",
                    component: () =>
                        import(
                            "@/views/pages/Inventory/ViewInventory/ViewItems.vue"
                        ),
                    meta: { requiredRoles: ["Manager", "System Admin", "Inventory"] },
                },

                {
                    path: "/Rooms/AddRoom",
                    name: "Rooms ",
                    component: () => import("@/views/pages/Rooms/AddRoom.vue"),
                    meta: { requiredRoles: ["System Admin"] },
                },

                {
                    path: "/Inventory/AddItems/NonConsumableForm",
                    name: "Non Consumable Form",
                    component: () =>
                        import(
                            "@/views/pages/Inventory/AddItems/NonConsumableForm.vue"
                        ),
                    meta: { requiredRoles: ["Inventory", "System Admin"] },
                },

                {
                    path: "/Inventory/ManageInventory/ManageItems",
                    name: "Manage Inventory",
                    component: () =>
                        import(
                            "@/views/pages/Inventory/ManageInventory/ManageItems.vue"
                        ),
                    meta: { requiredRoles: ["Inventory", "System Admin", "Manager"] },
                },

                 {
                    path: "/Inventory/ManageInventory/CleanAmenities",
                    name: "Clean Amenities",
                    component: () =>
                        import(
                            "@/views/pages/Inventory/ManageInventory/CleanAmenities.vue"
                        ),
                    meta: { requiredRoles: ["Inventory", "System Admin", "Manager"] },
                },
                

                {
                    path: "/Inventory/GenerateReport/InventorySummary",
                    name: "Inventory Summary",
                    component: () =>
                        import(
                            "@/views/pages/Inventory/GenerateReport/InventorySummary.vue"
                        ),
                    meta: { requiredRoles: ["Manager", "System Admin"] },
                },

                {
                    path: "/Rates/RatePage",
                    name: " Rate Page",
                    component: () => import("@/views/pages/Rates/RatePage.vue"),
                    meta: { requiredRoles: ["System Admin"] },
                },

                {
                    path: "/Rooms/Discount",
                    name: " Discount",
                    component: () => import("@/views/pages/Rooms/Discount.vue"),
                    meta: { requiredRoles: ["System Admin"] },
                },

                {
                    path: "/Inventory/GenerateReport/StockHistory",
                    name: "Stock Table",
                    component: () =>
                        import(
                            "@/views/pages/Inventory/GenerateReport/StockHistory.vue"
                        ),
                    meta: { requiredRoles: ["Inventory", "System Admin", "Manager"] },
                },

                {
                    path: "/Inventory/GenerateReport/LowstockReport",
                    name: "Low stock Report",
                    component: () =>
                        import(
                            "@/views/pages/Inventory/GenerateReport/LowstockReport.vue"
                        ),
                    meta: { requiredRoles: ["Inventory", "System Admin", "Manager"] },
                },

                {
                    path: "/Inventory/GenerateReport/DamagedItems",
                    name: "Damaged Items",
                    component: () =>
                        import(
                            "@/views/pages/Inventory/GenerateReport/DamagedItems.vue"
                        ),
                    meta: { requiredRoles: ["Inventory", "System Admin", "Manager"] },
                },

                {
                    path: "/Inventory/GenerateReport/ExpiredItems",
                    name: "Expired Items",
                    component: () =>
                        import(
                            "@/views/pages/Inventory/GenerateReport/ExpiredItems.vue"
                        ),
                    meta: { requiredRoles: ["Inventory", "System Admin", "Manager"] },
                },

                {
                    path: "/uikit/formlayout",
                    name: "formlayout",
                    component: () => import("@/views/uikit/FormLayout.vue"),
                },
                {
                    path: "/uikit/input",
                    name: "input",
                    component: () => import("@/views/uikit/InputDoc.vue"),
                },
                {
                    path: "/uikit/button",
                    name: "button",
                    component: () => import("@/views/uikit/ButtonDoc.vue"),
                },
                {
                    path: "/uikit/table",
                    name: "table",
                    component: () => import("@/views/uikit/TableDoc.vue"),
                },
                {
                    path: "/uikit/list",
                    name: "list",
                    component: () => import("@/views/uikit/ListDoc.vue"),
                },
                {
                    path: "/uikit/tree",
                    name: "tree",
                    component: () => import("@/views/uikit/TreeDoc.vue"),
                },
                {
                    path: "/uikit/panel",
                    name: "panel",
                    component: () => import("@/views/uikit/PanelsDoc.vue"),
                },

                {
                    path: "/uikit/overlay",
                    name: "overlay",
                    component: () => import("@/views/uikit/OverlayDoc.vue"),
                },
                {
                    path: "/uikit/media",
                    name: "media",
                    component: () => import("@/views/uikit/MediaDoc.vue"),
                },
                {
                    path: "/uikit/message",
                    name: "message",
                    component: () => import("@/views/uikit/MessagesDoc.vue"),
                },
                {
                    path: "/uikit/file",
                    name: "file",
                    component: () => import("@/views/uikit/FileDoc.vue"),
                },
                {
                    path: "/uikit/menu",
                    name: "menu",
                    component: () => import("@/views/uikit/MenuDoc.vue"),
                },
                {
                    path: "/uikit/charts",
                    name: "charts",
                    component: () => import("@/views/uikit/ChartDoc.vue"),
                },
                {
                    path: "/uikit/misc",
                    name: "misc",
                    component: () => import("@/views/uikit/MiscDoc.vue"),
                },
                {
                    path: "/uikit/timeline",
                    name: "timeline",
                    component: () => import("@/views/uikit/TimelineDoc.vue"),
                },
                {
                    path: "/pages/empty",
                    name: "empty",
                    component: () => import("@/views/pages/Empty.vue"),
                },
                {
                    path: "/pages/crud",
                    name: "crud",
                    component: () => import("@/views/pages/Crud.vue"),
                },
                {
                    path: "/documentation",
                    name: "documentation",
                    component: () => import("@/views/pages/Documentation.vue"),
                },
            ],
        },
        {
            path: "/",
            name: "landing",
            component: () => import("@/views/pages/Landing.vue"),
        },

        {
            path: "/pages/Catalog",
            name: "Catalog",
            component: () => import("@/views/pages/Catalog.vue"),
        },

        {
            path: "/:pathMatch(.*)*", // Proper catch-all route
            name: "not-found",
            component: () => import("@/views/pages/NotFound.vue"),
        },

        {
            path: "/BookingPanel",
            name: "Booking",
            component: () => import("@/views/pages/BookingPanel.vue"),
        },
        {
            path: "/pages/notfound",
            name: "notfound",
            component: () => import("@/views/pages/NotFound.vue"),
        },

        {
            path: "/pages/auth/login",
            name: "login",
            component: () => import("@/views/pages/auth/Login.vue"),
        },

        {
            path: "/auth/signup",
            name: "signup",
            component: () => import("@/views/pages/auth/SignUp.vue"),
        },

        {
            path: "/pages/auth/forgot-password",
            name: "forgotPassword",
            component: () => import("@/views/pages/auth/ForgotPassword.vue"),
        },

        {
            path: "/pages/auth/reset-password",
            name: "resetPassword",
            component: () => import("@/views/pages/auth/ResetPassword.vue"),
        },

        {
            path: "/auth/access",
            name: "accessDenied",
            component: () => import("@/views/pages/auth/Access.vue"),
        },
        {
            path: "/auth/error",
            name: "error",
            component: () => import("@/views/pages/auth/Error.vue"),
        },
    ],
});

// Navigation guard for role-based access control
router.beforeEach(async (to, from, next) => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    
    // If route requires authentication and user is not logged in
    if (to.matched.some(record => record.meta.requiresAuth) && (!token || !userId)) {
        next("/pages/auth/login");
        return;
    }
    
    // Check role-based permissions
    if (to.meta && to.meta.requiredRoles) {
        try {
            const userRoles = await getUserRoles();
            
            if (!hasRequiredRole(userRoles, to.meta.requiredRoles)) {
                // User doesn't have required role, redirect to access denied
                next("/auth/access");
                return;
            }
        } catch (error) {
            console.error("Error checking user roles:", error);
            // If we can't verify roles, redirect to login for safety
            next("/pages/auth/login");
            return;
        }
    }
    
    // If all checks pass, proceed to the route
    next();
});

export default router;
