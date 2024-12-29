<template>
    <footer class="py-10 px-6 bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
            <!-- Logo and Brand Name -->
            <div class="flex flex-col items-center md:items-start">
                <a class="flex items-center">
                    <svg viewBox="0 0 54 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-14 mr-3">
                        <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M17.1637 19.2467C17.1566 19.4033 17.1529 19.561 17.1529 19.7194C17.1529 25.3503 21.7203 29.915 27.3546 29.915C32.9887 29.915 37.5561 25.3503 37.5561 19.7194C37.5561 19.5572 37.5524 19.3959 37.5449 19.2355C38.5617 19.0801 39.5759 18.9013 40.5867 18.6994L40.6926 18.6782C40.7191 19.0218 40.7326 19.369 40.7326 19.7194C40.7326 27.1036 34.743 33.0896 27.3546 33.0896C19.966 33.0896 13.9765 27.1036 13.9765 19.7194C13.9765 19.374 13.9896 19.0316 14.0154 18.6927L14.0486 18.6994C15.0837 18.9062 16.1223 19.0886 17.1637 19.2467ZM33.3284 11.4538C31.6493 10.2396 29.5855 9.52381 27.3546 9.52381C25.1195 9.52381 23.0524 10.2421 21.3717 11.4603C20.0078 11.3232 18.6475 11.1387 17.2933 10.907C19.7453 8.11308 23.3438 6.34921 27.3546 6.34921C31.36 6.34921 34.9543 8.10844 37.4061 10.896C36.0521 11.1292 34.692 11.3152 33.3284 11.4538Z"
                            fill="var(--primary-color)"
                        />
                    </svg>
                    <h4 class="text-2xl font-bold text-center md:text-left">Woodland Suites</h4>
                </a>
            </div>

            <!-- Contact Section -->
            <div class="text-center md:text-left">
                <h4 class="text-xl font-semibold mb-4">Contact</h4>
                <p class="text-surface-700 dark:text-surface-400 mb-2">Phone: +1 234 567 890</p>
                <p class="text-surface-700 dark:text-surface-400 mb-2">Email: contact@woodlandsuites.com</p>
                <p class="text-surface-700 dark:text-surface-400">Address: 123 Woodland Ave, Cityville</p>
            </div>

            <!-- Powered By Section -->
            <div class="text-center md:text-left">
                <h4 class="text-xl font-semibold mb-4">Powered By</h4>
                <p class="text-surface-700 dark:text-surface-400 mb-2">Woodland Suites Management</p>
                <p class="text-surface-700 dark:text-surface-400">&copy; 2024 Woodland Suites. All rights reserved.</p>
            </div>
        </div>

        <!-- Social Media Links -->
        <div class="mt-8 flex flex-col md:flex-row justify-center md:justify-between items-center">
            <p class="text-surface-700 dark:text-surface-400 text-center mb-4 md:mb-0">
                Follow us on:
            </p>
            <div class="flex gap-4">
                <a href="#" class="text-surface-700 dark:text-surface-400 hover:text-primary transition">
                    <i class="pi pi-facebook text-2xl"></i>
                </a>
                <a href="#" class="text-surface-700 dark:text-surface-400 hover:text-primary transition">
                    <i class="pi pi-twitter text-2xl"></i>
                </a>
                <a href="#" class="text-surface-700 dark:text-surface-400 hover:text-primary transition">
                    <i class="pi pi-instagram text-2xl"></i>
                </a>
            </div>
        </div>
    </footer>
</template>
