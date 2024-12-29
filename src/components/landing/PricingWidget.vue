<template>
    <div id="pricing" class="py-6 px-6 lg:px-20 my-2 md:my-6">
        <div class="text-center mb-6">
            <div class="text-surface-900 dark:text-surface-0 font-normal mb-2 text-4xl">Book Your Stay</div>
            <span class="text-muted-color text-2xl">Reserve your spot now and enjoy a delightful experience</span>
        </div>

        <!-- Big Book Now Button -->
        <div class="flex justify-center mt-12">
            <Button 
                label="Book Now" 
                class="p-button-rounded bg-primary text-white hover:bg-primary-dark" 
                as="router-link" to="/BookingPanel"
                style="width: 300px; height: 80px; font-size: 2rem; font-weight: bold; border-radius: 12px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);"
            ></Button>
        </div>
    </div>
</template>
