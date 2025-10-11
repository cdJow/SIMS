<template>
    <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <!-- Authentication Loading -->
        <div v-if="authLoading" class="flex justify-center items-center min-h-screen">
            <div class="text-center">
                <i class="pi pi-spin pi-spinner text-4xl text-blue-600 mb-4"></i>
                <p class="text-gray-600 dark:text-gray-300">Checking authentication...</p>
            </div>
        </div>

        <!-- Not Authenticated - Login Required -->
        <div v-else-if="!isAuthenticated" class="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-900">
            <div class="max-w-md w-full mx-4">
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                    <div class="mb-6">
                        <i class="pi pi-lock text-5xl text-blue-600 dark:text-blue-400 mb-4"></i>
                        <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Login Required</h2>
                        <p class="text-gray-600 dark:text-gray-300">You need to log in as a guest to make bookings and view your booking history.</p>
                    </div>
                    
                    <div class="space-y-4">
                        <Button
                            @click="router.push('/auth/login')"
                            class="w-full p-button-primary"
                            icon="pi pi-sign-in"
                            label="Login to Your Account"
                        />
                        
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                            Don't have an account?
                            <button 
                                @click="router.push('/auth/signup')"
                                class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                            >
                                Sign up here
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Authenticated Content -->
        <div v-else>
        <!-- User Bookings Section (only show if there are visible bookings or loading/error states) -->
        <div v-if="loadingBookings || bookingError || visibleBookings.length > 0" class="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700 py-6">
            <div class="container mx-auto px-4">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-blue-900 dark:text-blue-100">
                        <i class="pi pi-calendar mr-2"></i>
                        Your Bookings
                    </h2>
                    <div class="text-sm text-blue-700 dark:text-blue-300">
                        <i class="pi pi-user mr-1"></i>
                        {{ currentUser?.name }} ({{ currentUser?.email }})
                    </div>
                </div>
                
                <!-- Booking Limits Info -->
                <div class="mb-4 p-3 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
                    <div class="flex flex-col sm:flex-row gap-4 text-sm text-blue-800 dark:text-blue-200">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-info-circle text-blue-600 dark:text-blue-400"></i>
                            <span>Active Bookings: {{ activeBookingsCount }}/1</span>
                        </div>
                        <div class="flex items-center gap-2" v-if="canMakeBooking">
                            <i class="pi pi-check-circle text-green-600 dark:text-green-400"></i>
                            <span class="text-green-700 dark:text-green-400">You can make a new booking</span>
                        </div>
                    </div>
                    <div class="mt-2 text-xs text-blue-600 dark:text-blue-400">
                        <i class="pi pi-clock mr-1"></i>
                        <span>Note: You have 1 hour to check in after booking, or it will automatically expire.</span>
                    </div>
                </div>

                <!-- Loading State -->
                <div v-if="loadingBookings" class="text-center py-8">
                    <i class="pi pi-spin pi-spinner text-2xl text-blue-600 dark:text-blue-400 mb-2"></i>
                    <p class="text-blue-600 dark:text-blue-400">Loading your bookings...</p>
                </div>

                <!-- Error State -->
                <div v-else-if="bookingError" class="text-center py-8">
                    <i class="pi pi-exclamation-triangle text-2xl text-red-600 dark:text-red-400 mb-2"></i>
                    <p class="text-red-600 dark:text-red-400 mb-2">{{ bookingError }}</p>
                    <Button @click="fetchBookings" class="p-button-outlined dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        <i class="pi pi-refresh mr-2"></i>
                        Try Again
                    </Button>
                </div>

                <!-- No Bookings State -->
                <div v-else-if="visibleBookings.length === 0" class="text-center py-8">
                    <i class="pi pi-calendar text-4xl text-gray-400 mb-4"></i>
                    <h3 class="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No Active Bookings</h3>
                    <p class="text-gray-500 dark:text-gray-400">You have no active bookings. Browse available rooms below to make a new booking!</p>
                </div>

                <!-- Bookings List (only show non-cancelled bookings) -->
                <div v-else class="grid gap-4">
                    <div
                        v-for="booking in visibleBookings"
                        :key="booking.id"
                        class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700"
                    >
                        <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                            <div class="flex-1">
                                <div class="flex items-center gap-3 mb-2">
                                    <h4 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                        Room {{ booking.room_number || booking.room_id }}
                                    </h4>
                                    <Tag 
                                        :value="getBookingStatusLabel(booking.status)" 
                                        :severity="getBookingStatusSeverity(booking.status)" 
                                        class="font-medium"
                                    />
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <div class="flex items-center gap-1">
                                        <i class="pi pi-user"></i>
                                        <span>{{ booking.guest_name }}</span>
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <i class="pi pi-clock"></i>
                                        <span>{{ booking.selected_hours }} hours</span>
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <i class="pi pi-calendar"></i>
                                        <span>{{ formatBookingDate(booking.created_at) }}</span>
                                    </div>
                                    <div class="flex items-center gap-1">
                                       
                                        <span>₱{{ formatPrice(booking.selected_rate) }}</span>
                                    </div>
                                    <!-- Time remaining display (only for occupied rooms) -->
                                    <div v-if="getTimeRemaining(booking)" class="flex items-center gap-1 col-span-2">
                                        <i :class="[
                                            'pi',
                                            getTimeRemaining(booking).color === 'red' ? 'pi-exclamation-triangle text-red-500' : 
                                            getTimeRemaining(booking).color === 'orange' ? 'pi-clock text-orange-500' : 
                                            'pi-hourglass text-green-500'
                                        ]"></i>
                                        <span :class="[
                                            'font-medium',
                                            getTimeRemaining(booking).color === 'red' ? 'text-red-600 dark:text-red-400' : 
                                            getTimeRemaining(booking).color === 'orange' ? 'text-orange-600 dark:text-orange-400' : 
                                            'text-green-600 dark:text-green-400'
                                        ]">
                                            {{ getTimeRemaining(booking).text }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <Button
                                    v-if="booking.status === 'Booked'"
                                    @click="openCancelDialog(booking)"
                                    class="p-button-outlined p-button-danger p-button-sm"
                                    icon="pi pi-times"
                                    label="Cancel"
                                />
                                <Button
                                    v-else-if="booking.status === 'Occupied'"
                                    disabled
                                    class="p-button-outlined p-button-sm"
                                    icon="pi pi-clock"
                                    label="In Use"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Page Header -->
        <div class="bg-gradient-to-r from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 py-12">
            <div class="container mx-auto px-4 text-center">
                <h1 class="text-2xl md:text-4xl font-bold mb-3 text-white">Available Rooms</h1>
                <p class="text-base md:text-lg opacity-90 text-white">
                    Discover our comfortable and luxurious accommodations
                </p>
            </div>
        </div>

        <!-- User Bookings Section -->
        

        <!-- Search and Filter Section -->
        <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-6">
            <div class="container mx-auto px-4">
                <div class="flex flex-col md:flex-row gap-4 items-center justify-center">
                    <!-- Search Input -->
                    <div class="flex-1 max-w-md">
                        <div class="relative">
                            <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"></i>
                            <InputText
                                v-model="searchQuery"
                                placeholder="Search rooms..."
                                class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                @input="filterRooms"
                            />
                        </div>
                    </div>

                    <!-- Category Filter -->
                    <div class="flex-shrink-0">
                        <Dropdown
                            v-model="selectedCategory"
                            :options="categoryOptions"
                            optionLabel="name"
                            optionValue="value"
                            placeholder="All Categories"
                            class="w-48"
                            @change="filterRooms"
                        />
                    </div>

                    <!-- Clear Filters -->
                    <div class="flex-shrink-0">
                        <Button
                            @click="clearFilters"
                            class="p-button-outlined border-gray-400 text-gray-600 hover:bg-gray-100 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-700"
                            :disabled="!hasActiveFilters"
                        >
                            <i class="pi pi-times mr-2"></i>
                            Clear
                        </Button>
                    </div>
                </div>

                <!-- Results Summary -->
                <div v-if="!loading && !error" class="mt-4 text-center">
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        Showing {{ filteredRooms.length }} of {{ allRooms.length }} rooms
                        <span v-if="hasActiveFilters" class="text-green-600 dark:text-green-400">
                            (filtered)
                        </span>
                    </p>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="container mx-auto px-4 py-16 text-center">
            <i class="pi pi-spin pi-spinner text-4xl text-red-600 dark:text-red-400 mb-4"></i>
            <p class="text-gray-600 dark:text-gray-300">Loading available rooms...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="container mx-auto px-4 py-16 text-center">
            <i class="pi pi-exclamation-triangle text-4xl text-red-600 dark:text-red-400 mb-4"></i>
            <p class="text-red-600 dark:text-red-400 mb-4">{{ error }}</p>
            <Button @click="fetchRooms" class="p-button-outlined dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <i class="pi pi-refresh mr-2"></i>
                Try Again
            </Button>
        </div>

        <!-- Rooms Content -->
        <div v-else class="container mx-auto px-4 py-16">
            <div v-if="filteredRooms.length === 0 && allRooms.length === 0" class="text-center py-16">
                <i class="pi pi-home text-6xl text-gray-400 mb-4"></i>
                <h3 class="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-2">No Rooms Available</h3>
                <p class="text-gray-500 dark:text-gray-400">All rooms are currently occupied. Please check back later.</p>
            </div>

            <div v-else-if="filteredRooms.length === 0 && hasActiveFilters" class="text-center py-16">
                <i class="pi pi-filter text-6xl text-gray-400 dark:text-gray-500 mb-4"></i>
                <h3 class="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-2">No Matching Rooms</h3>
                <p class="text-gray-500 dark:text-gray-400 mb-4">No rooms match your search criteria.</p>
                <Button
                    @click="clearFilters"
                    class="p-button-outlined border-green-600 text-green-600 hover:bg-green-600 hover:text-white dark:border-green-400 dark:text-green-400 dark:hover:bg-green-600"
                >
                    <i class="pi pi-times mr-2"></i>
                    Clear Filters
                </Button>
            </div>

            <!-- Room Grid (Scrollable - Show 3 rooms, rest scrollable) -->
            <div v-else class="max-h-[1200px] overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                <div class="grid gap-8 pb-4">
                    <div
                        v-for="room in filteredRooms"
                        :key="room.id"
                        class="rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-700"
                    >
                    <!-- Room Content -->
                    <div class="flex flex-col md:flex-row gap-6 md:gap-8 p-6">
                        <!-- Image Container -->
                        <div class="md:w-1/2">
                            <div class="relative rounded-xl overflow-hidden shadow-lg h-64 md:h-96">
                                <img
                                    :src="room.image_url || '/api/placeholder/600/400'"
                                    :alt="room.name"
                                    class="w-full h-full object-cover transform hover:scale-105 transition-all duration-300"
                                    @error="handleImageError"
                                />
                                <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent"></div>
                                
                                <!-- Room Status Badge -->
                                <div class="absolute top-4 left-4">
                                    <Tag
                                        :value="room.status"
                                        :severity="getStatusSeverity(room.status)"
                                        class="font-semibold"
                                    />
                                </div>

                                <!-- Floor Info -->
                                <div class="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 rounded-lg px-3 py-1">
                                    <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        Floor {{ room.floor_number }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Content Container -->
                        <div class="md:w-1/2 flex flex-col justify-center">
                            <div class="p-4 md:p-6">
                                <!-- Room Title -->
                                <h3 class="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                                    {{ room.name }}
                                </h3>
                                
                                <!-- Room Number -->
                                <div class="flex items-center text-gray-600 dark:text-gray-300 mb-2">
                                    <i class="pi pi-home text-red-600 mr-2"></i>
                                    Room {{ room.room_number }}
                                </div>

                                <!-- Description -->
                                <p class="text-gray-500 dark:text-gray-400 text-sm md:text-base mb-4">
                                    {{ room.description || room.room_type_description || 'Comfortable and well-equipped room for your stay.' }}
                                </p>

                                <!-- Pricing Table -->
                                <div class="mb-6" v-if="room.rates && room.rates.length > 0">
                                    <h4 class="font-semibold text-gray-700 dark:text-gray-200 mb-3">Room Rates</h4>
                                    <div class="grid grid-cols-3 gap-4 text-center mb-2">
                                        <div
                                            v-for="rate in room.rates"
                                            :key="rate.hours"
                                            class="font-semibold text-gray-600 dark:text-gray-300"
                                        >
                                            {{ rate.hours }}hrs
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-3 gap-4 text-center">
                                        <div
                                            v-for="rate in room.rates"
                                            :key="rate.hours"
                                            class="text-xl font-bold text-red-600 dark:text-red-400"
                                        >
                                            ₱{{ formatPrice(rate.price) }}
                                        </div>
                                    </div>
                                </div>

                                <!-- Room Details -->
                                <div class="space-y-3 mb-6">
                                    <div class="flex items-center text-gray-600 dark:text-gray-300">
                                        <i class="pi pi-bed text-amber-600 dark:text-amber-400 mr-2"></i>
                                        {{ room.bedType || room.room_type_name || 'Standard Bed' }}
                                    </div>
                                    <div class="flex items-center text-gray-600 dark:text-gray-300">
                                        <i class="pi pi-users text-amber-600 dark:text-amber-400 mr-2"></i>
                                        {{ room.occupancy || 2 }} Person{{ (room.occupancy || 2) > 1 ? 's' : '' }}
                                    </div>
                                    <div v-if="room.category_name" class="flex items-center text-gray-600 dark:text-gray-300">
                                        <i class="pi pi-tag text-amber-600 dark:text-amber-400 mr-2"></i>
                                        {{ room.category_name }}
                                    </div>
                                </div>

                                <!-- Action Buttons -->
                                <div class="flex flex-col sm:flex-row gap-3">
                                    <Button
                                        @click="handleBookRoom(room)"
                                        :disabled="room.status !== 'Available' || !canMakeBooking"
                                        :class="[
                                            'border-none flex-1',
                                            canMakeBooking && room.status === 'Available' 
                                                ? 'p-button-primary bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white'
                                                : 'p-button-secondary dark:bg-gray-600 dark:text-gray-300'
                                        ]"
                                    >
                                        <i class="pi pi-bookmark mr-2"></i>
                                        {{ 
                                            room.status !== 'Available' 
                                                ? 'Not Available' 
                                                : !canMakeBooking 
                                                    ? 'Limit Reached' 
                                                    : 'Book Now' 
                                        }}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>

            <!-- Load More Button (if needed) -->
            <div v-if="hasMoreRooms" class="text-center mt-12">
                <Button
                    @click="loadMoreRooms"
                    class="p-button-outlined border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                    :loading="loadingMore"
                >
                    <i class="pi pi-plus mr-2"></i>
                    Load More Rooms
                </Button>
            </div>
        </div>

        <!-- Booking Dialog -->
        <Dialog
            v-model:visible="bookingDialogVisible"
            :modal="true"
            :dismissable-mask="true"
            style="width: 70vh"
        >
            <template #header>
                <div class="font-bold text-xl">
                    Room {{ selectedBookingRoom?.room_number }} |
                    {{ selectedBookingRoom?.room_type_name }}
                </div>
            </template>

            <div class="p-4">
                <!-- Booking Limits Warning -->
                <div v-if="!canMakeBooking" class="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg dark:bg-orange-900/20 dark:border-orange-700">
                    <div class="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                        <i class="pi pi-exclamation-triangle"></i>
                        <span class="font-medium">Booking Limit Notice</span>
                    </div>
                    <p class="text-sm text-orange-600 dark:text-orange-400 mt-1">
                        {{ bookingLimitMessage }}
                    </p>
                </div>

                <!-- Customer Information -->
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-1 dark:text-gray-200">Name</label>
                    <InputText
                        v-model="guestDetails.guestName"
                        placeholder="Enter name"
                        class="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                    />
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium mb-1 dark:text-gray-200">Cellphone Number</label>
                    <div class="relative w-full">
                        <InputText
                            v-model="guestDetails.cellphone"
                            placeholder="Enter cellphone number (optional)"
                            class="w-full pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            :class="{ 'p-invalid': !isCellphoneValidBooking }"
                            @input="validateBookingCellphone"
                        />
                        <i
                            v-if="!isCellphoneValidBooking"
                            class="pi pi-exclamation-circle text-red-500 absolute right-3 top-1/2 transform -translate-y-1/2"
                        ></i>
                    </div>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium mb-1 dark:text-gray-200">Email</label>
                    <div class="relative">
                        <InputText
                            v-model="guestDetails.guestEmail"
                            placeholder="Enter Email (optional)"
                            class="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            :class="{ 'p-invalid': !isEmailValidBooking }"
                            @input="validateBookingEmail"
                        />
                        <i
                            v-if="!isEmailValidBooking"
                            class="pi pi-exclamation-circle text-red-500 dark:text-red-400 absolute right-3 top-1/2 transform -translate-y-1/2"
                        ></i>
                    </div>
                    <p v-if="!isEmailValidBooking" class="text-sm text-red-500 dark:text-red-400 mt-1">
                        Please enter a valid Gmail address (e.g., example@gmail.com).
                    </p>
                </div>

                <label class="block text-sm font-medium mb-1 dark:text-gray-200">
                    Check In Time:
                    <span class="text-sm text-gray-500 dark:text-gray-400">
                        (Auto-filled with current time)
                    </span>
                </label>
                <Calendar
                    v-model="guestDetails.checkInDateTime"
                    placeholder="Select date & time"
                    dateFormat="yy-mm-dd"
                    showTime
                    hourFormat="12"
                    class="w-full"
                    :minDate="minBookingDate"
                    :showButtonBar="true"
                    disabled
                />

                <div>
                    <div class="flex items-center justify-between mb-3 mt-3">
                        <label class="block text-sm font-medium dark:text-gray-200">
                            Select Stay Duration:
                        </label>
                        <Button
                            label="More Stay Duration"
                            class="p-button-outlined p-button-sm dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            icon="pi pi-calendar-plus"
                            @click="openMoreDurationDialog"
                        />
                    </div>
                    
                    <!-- Highlight selected extended duration -->
                    <div v-if="selectedExtendedDuration" class="mt-3 mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/30 dark:border-blue-700">
                        <div class="flex items-center gap-2 text-sm">
                            <i class="pi pi-check-circle text-blue-600 dark:text-blue-400"></i>
                            <span class="font-medium text-blue-900 dark:text-blue-100">
                                Selected: {{ selectedExtendedDuration.label }}
                            </span>
                        </div>
                        <div class="mt-1 text-xs text-blue-700 dark:text-blue-300">
                            {{ selectedExtendedDuration.hours }} hours • ₱{{ formatPrice(selectedExtendedDuration.rate) }}
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div
                            v-for="rate in selectedBookingRoom?.rates"
                            :key="rate.hours"
                            role="button"
                            tabindex="0"
                            :class="[
                                // base
                                'p-4 border rounded-lg cursor-pointer select-none transition-colors',
                                // light & dark defaults
                                'bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50',
                                'dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800',
                                // selected state
                                guestDetails.selectedHours === rate.hours
                                    ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200'
                                    : ''
                            ]"
                            @click="selectRateAndHours(rate.hours, rate.price)"
                            @keydown.enter="selectRateAndHours(rate.hours, rate.price)"
                            @keydown.space.prevent="selectRateAndHours(rate.hours, rate.price)"
                        >
                            <div class="font-semibold text-lg">
                                {{ rate.hours }} Hours
                            </div>

                            <div class="mt-1 text-neutral-700 dark:text-neutral-300">
                                ₱{{ formatPrice(rate.price) }}
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
                        label="Save"
                        class="p-button-primary w-full"
                        :disabled="!isBookingFormValid || bookingLoading"
                        :loading="bookingLoading"
                        @click="submitBooking"
                    />
                </div>
            </div>
        </Dialog>

        <!-- More Duration Dialog (matching RoomList.vue) -->
        <Dialog
            v-model:visible="moreDurationDialogVisible"
            header="Select Extended Stay Duration"
            :modal="true"
            :dismissable-mask="true"
            :style="{ width: '800px' }"
            :breakpoints="{ '1024px': '90vw', '768px': '95vw', '640px': '98vw' }"
        >
            <div class="p-4">
                <div class="mb-4 text-center">
                    <p class="text-lg font-semibold mb-2 dark:text-gray-200">Daily Rate Options</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        Based on 24-hour rate: ₱{{ formatPrice(selectedBookingRoom?.rates?.find(r => r.hours === 24)?.price || 0) }}
                    </p>
                </div>
                
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    <div
                        v-for="(rate, days) in dailyRates"
                        :key="days"
                        role="button"
                        tabindex="0"
                        :class="[
                            'p-4 border-2 rounded-lg cursor-pointer select-none transition-all duration-200 hover:shadow-lg',
                            'bg-white border-gray-200 text-gray-900 hover:bg-blue-50 hover:border-blue-300',
                            'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-blue-900/20 dark:hover:border-blue-500',
                            isSelectedDays(days) ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200' : ''
                        ]"
                        @click="selectDailyRateAndHours(days, Number(rate))"
                        @keydown.enter="selectDailyRateAndHours(days, Number(rate))"
                        @keydown.space.prevent="selectDailyRateAndHours(days, Number(rate))"
                    >
                        <div class="text-center">
                            <div class="font-bold text-lg mb-1">
                                {{ getDayLabel(days) }}
                            </div>
                            <div class="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                {{ getDaysCount(days) * 24 }}h
                            </div>
                            <div class="font-semibold text-sm text-green-600 dark:text-green-400">
                                ₱{{ formatPrice(rate) }}
                            </div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                ₱{{ formatPrice(rate / getDaysCount(days)) }}/day
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="flex justify-end gap-2 mt-6">
                    <Button
                        label="Cancel"
                        class="p-button-secondary"
                        @click="moreDurationDialogVisible = false"
                    />
                </div>
            </div>
        </Dialog>

        <!-- Cancel Booking Confirmation Dialog -->
        <Dialog
            v-model:visible="cancelDialogVisible"
            header="Cancel Booking Confirmation"
            :modal="true"
            :dismissable-mask="true"
            style="width: 400px"
        >
            <div class="p-4">
                <div class="flex items-center gap-3 mb-4">
                    <i class="pi pi-exclamation-triangle text-orange-500 text-2xl"></i>
                    <div>
                        <h4 class="font-semibold text-gray-800 dark:text-gray-200">Cancel Booking?</h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone.</p>
                    </div>
                </div>

                <div v-if="selectedBookingToCancel" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
                    <div class="text-sm space-y-1 dark:text-gray-300">
                        <div><strong>Room:</strong> {{ selectedBookingToCancel.room_number || selectedBookingToCancel.room_id }}</div>
                        <div><strong>Guest:</strong> {{ selectedBookingToCancel.guest_name }}</div>
                        <div><strong>Duration:</strong> {{ selectedBookingToCancel.selected_hours }} hours</div>
                        <div><strong>Rate:</strong> ₱{{ formatPrice(selectedBookingToCancel.selected_rate) }}</div>
                    </div>
                </div>

                <div class="flex justify-end gap-2">
                    <Button
                        label="Keep"
                        class="p-button-secondary"
                        @click="closeCancelDialog"
                    />
                    <Button
                        label="Cancel Booking"
                        class="p-button-danger"
                        @click="confirmCancelBooking"
                    />
                </div>
            </div>
        </Dialog>
        </div> <!-- End Authenticated Content -->
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Textarea from 'primevue/textarea'
import { fetchAvailableRooms, createBooking, cancelBooking, fetchUserBookings } from '@/api/bookedRooms'
import { getCurrentUser } from '@/api/auth'

const router = useRouter()
const toast = useToast()

// Authentication data
const isAuthenticated = ref(false)
const currentUser = ref(null)
const authLoading = ref(true)

// Reactive data
const loading = ref(true)
const error = ref(null)
const allRooms = ref([])
const filteredRooms = ref([])
const hasMoreRooms = ref(false)
const loadingMore = ref(false)

// Search and filter data
const searchQuery = ref('')
const selectedCategory = ref(null)
const categoryOptions = ref([
    { name: 'All Categories', value: null },
    { name: 'Standard', value: 'Standard' },
    { name: 'King', value: 'King' },
    { name: 'Suite', value: 'Suite' }
])

// Booking dialog data
const bookingDialogVisible = ref(false)
const moreDurationDialogVisible = ref(false)
const bookingLoading = ref(false)
const selectedBookingRoom = ref(null)
const minBookingDate = ref(new Date())

const guestDetails = ref({
    guestName: '',
    cellphone: '',
    guestEmail: '',
    checkInDateTime: null,
    selectedHours: null,
    selectedrate: null
})

// Validation states for booking
const isCellphoneValidBooking = ref(true)
const isEmailValidBooking = ref(true)

// Extended duration for "More Stay Duration" (matching RoomList.vue approach)
const selectedExtendedDuration = ref(null)

// User bookings management (session-based for guest users)
const userBookings = ref([])
const loadingBookings = ref(false)
const bookingError = ref(null)
const cancelDialogVisible = ref(false)
const selectedBookingToCancel = ref(null)

// Local storage key for guest bookings (legacy - now use database)
const GUEST_BOOKINGS_KEY = 'guest_bookings'

// Check authentication status
const checkAuthentication = async () => {
    try {
        authLoading.value = true
        const token = localStorage.getItem('token')
        const userId = localStorage.getItem('userId')
        
        if (!token || !userId) {
            isAuthenticated.value = false
            currentUser.value = null
            return
        }
        
        // Get current user info
        const response = await getCurrentUser(userId)
        const user = response.data.user
        
        // Check if user is a guest
        if (user.role === 'guest' || (user.additional_roles && user.additional_roles.includes('guest'))) {
            isAuthenticated.value = true
            currentUser.value = user
        } else {
            // Not a guest user, redirect to appropriate page
            isAuthenticated.value = false
            currentUser.value = null
        }
        
    } catch (error) {
        console.error('Authentication check failed:', error)
        isAuthenticated.value = false
        currentUser.value = null
        // Clear invalid token
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
    } finally {
        authLoading.value = false
    }
}



// Daily rates computed property (matching RoomList.vue)
const dailyRates = computed(() => {
    const rate24h = selectedBookingRoom.value?.rates?.find(r => r.hours === 24)?.price || 0
    return {
        1: rate24h, // 1 day
        2: rate24h * 2, // 2 days
        3: rate24h * 3, // 3 days
        4: rate24h * 4, // 4 days
        5: rate24h * 5, // 5 days
        6: rate24h * 6, // 6 days
        7: rate24h * 7, // 7 days
        week: rate24h * 7, // 1 week (same as 7 days but separate for display)
        twoWeeks: rate24h * 14, // 2 weeks
        month: rate24h * 30, // 1 month
    }
})

// Computed properties
const hasActiveFilters = computed(() => {
    return searchQuery.value.trim() !== '' || selectedCategory.value !== null
})

// Booking limits computed properties
const activeBookingsCount = computed(() => {
    // Backend already filters to only active bookings (Booked + Occupied)
    return userBookings.value.length
})

const todaysBookingsCount = computed(() => {
    const today = new Date().toDateString()
    return userBookings.value.filter(booking => {
        const bookingDate = new Date(booking.created_at).toDateString()
        // Backend already excludes completed bookings, just check if created today
        return bookingDate === today
    }).length
})

const canMakeBooking = computed(() => {
    return activeBookingsCount.value === 0 && todaysBookingsCount.value < 3
})

// Show only active bookings (Booked or Occupied) - completed/checked out are excluded by backend
const visibleBookings = computed(() => {
    return userBookings.value.filter(booking => {
        // Backend already filters to only 'Booked' and 'Occupied' status
        // Just ensure we have valid booking data
        return booking && booking.id && booking.status
    })
})

const bookingLimitMessage = computed(() => {
    if (activeBookingsCount.value > 0) {
        return 'You can only have one active booking at a time. Please cancel your current booking to make a new one.'
    }
    if (todaysBookingsCount.value >= 3) {
        return 'You have reached the daily limit of 3 active bookings. Cancelled bookings do not count towards this limit.'
    }
    return null
})

// Filter functions
const filterRooms = () => {
    let filtered = [...allRooms.value]
    
    // Filter by search query
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        filtered = filtered.filter(room => 
            room.name.toLowerCase().includes(query) ||
            room.room_number.toString().includes(query) ||
            room.category_name?.toLowerCase().includes(query) ||
            room.room_type_name?.toLowerCase().includes(query) ||
            room.description?.toLowerCase().includes(query)
        )
    }
    
    // Filter by category
    if (selectedCategory.value) {
        filtered = filtered.filter(room => 
            room.category_name === selectedCategory.value
        )
    }
    
    filteredRooms.value = filtered
}

const clearFilters = () => {
    searchQuery.value = ''
    selectedCategory.value = null
    filteredRooms.value = [...allRooms.value]
}

// Booking computed properties (matching RoomList.vue validation)
const isBookingFormValid = computed(() => {
    const hasName = guestDetails.value.guestName.trim().length > 0
    const cellOk = isCellphoneValidBooking.value
    const emailOk = isEmailValidBooking.value
    const hasDateTime = !!guestDetails.value.checkInDateTime
    const hasHours = !!guestDetails.value.selectedHours
    const hasRate = !!guestDetails.value.selectedrate
    
    return hasName && cellOk && emailOk && hasDateTime && hasHours && hasRate
})

const bookingCheckOutTime = computed(() => {
    if (!guestDetails.value.checkInDateTime || !guestDetails.value.selectedHours) {
        return null
    }
    const checkIn = new Date(guestDetails.value.checkInDateTime)
    return new Date(checkIn.getTime() + (guestDetails.value.selectedHours * 60 * 60 * 1000))
})

// Fetch user bookings from database (real-time)
const fetchBookings = async () => {
    if (!isAuthenticated.value || !currentUser.value) return
    
    try {
        loadingBookings.value = true
        bookingError.value = null
        
        // Fetch real-time bookings from database
        const response = await fetchUserBookings()
        userBookings.value = response || []
        
    } catch (err) {
        console.error('Error loading bookings from database:', err)
        bookingError.value = 'Failed to load your bookings from server.'
        userBookings.value = []
    } finally {
        loadingBookings.value = false
    }
}

// Save bookings to localStorage
const saveBookingsToStorage = () => {
    try {
        localStorage.setItem(GUEST_BOOKINGS_KEY, JSON.stringify(userBookings.value))
    } catch (error) {
        console.error('Error saving bookings to storage:', error)
    }
}

// Fetch rooms data
const fetchRooms = async () => {
    try {
        loading.value = true
        error.value = null
        
        const response = await fetchAvailableRooms()
        allRooms.value = response
        filteredRooms.value = [...response]
        
        // Dynamically create category options from available rooms
        const categories = new Set(['All Categories'])
        response.forEach(room => {
            if (room.category_name) {
                categories.add(room.category_name)
            }
        })
        
        categoryOptions.value = Array.from(categories).map(category => ({
            name: category,
            value: category === 'All Categories' ? null : category
        }))
        
        if (response.length === 0) {
            console.log('No available rooms found')
        }
        
    } catch (err) {
        console.error('Error fetching rooms:', err)
        error.value = err.message || 'Failed to load available rooms. Please try again.'
        
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load rooms. Please try again.',
            life: 5000
        })
    } finally {
        loading.value = false
    }
}

// Load more rooms (for pagination if needed)
const loadMoreRooms = async () => {
    loadingMore.value = true
    // Implement pagination if needed
    loadingMore.value = false
}

// Handle image errors
const handleImageError = (event) => {
    event.target.src = '/api/placeholder/600/400'
}

// Get status severity for Tag component
const getStatusSeverity = (status) => {
    switch (status) {
        case 'Available':
            return 'success'
        case 'Booked':
            return 'warning'
        case 'Occupied':
            return 'danger'
        case 'Cleaning':
            return 'info'
        case 'Under Maintenance':
            return 'danger'
        default:
            return 'secondary'
    }
}

// Format price display
const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(price || 0)
}

// Book room action
const handleBookRoom = (room) => {
    if (room.status !== 'Available') {
        toast.add({
            severity: 'warn',
            summary: 'Room Not Available',
            detail: 'This room is currently not available for booking.',
            life: 3000
        })
        return
    }

    // Check booking limits
    if (!canMakeBooking.value) {
        toast.add({
            severity: 'warn',
            summary: 'Booking Limit Reached',
            detail: bookingLimitMessage.value,
            life: 5000
        })
        return
    }

    openBookingDialog(room)
}

// Booking validation functions (matching RoomList.vue)
const validateBookingCellphone = (event) => {
    const input = event.target.value || ""
    const cleanedInput = input.replace(/\D/g, "")

    // Allow empty as valid (optional field)
    if (cleanedInput.length === 0) {
        isCellphoneValidBooking.value = true
        return
    }

    // Accept formats starting with 09 and exactly 11 digits
    const isValid = cleanedInput.startsWith("09") && cleanedInput.length === 11

    if (isValid) {
        isCellphoneValidBooking.value = true
    } else {
        isCellphoneValidBooking.value = false
    }
}

const validateBookingEmail = (event) => {
    const email = (event.target.value || "").trim()

    // Allow empty as valid (optional field)
    if (!email) {
        isEmailValidBooking.value = true
        return
    }

    // Otherwise must be a valid Gmail address
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/
    isEmailValidBooking.value = gmailRegex.test(email)
}

// Booking functions
const openBookingDialog = (room) => {
    selectedBookingRoom.value = room
    
    // Reset form (auto-fill current time like RoomList.vue)
    // Pre-fill with authenticated user's information
    guestDetails.value = {
        guestName: currentUser.value?.name || '',
        cellphone: '',
        guestEmail: currentUser.value?.email || '',
        checkInDateTime: new Date(), // Auto-filled with current time
        selectedHours: null,
        selectedrate: null,
        notes: ''
    }
    
    // Reset validation states
    isCellphoneValidBooking.value = true
    isEmailValidBooking.value = true
    
    // Reset extended duration selection
    selectedExtendedDuration.value = null
    
    bookingDialogVisible.value = true
}

const closeBookingDialog = () => {
    bookingDialogVisible.value = false
    selectedBookingRoom.value = null
}

const selectRateAndHours = (hours, rate) => {
    guestDetails.value.selectedHours = hours
    guestDetails.value.selectedrate = rate
    // Clear extended duration selection when selecting standard rates
    selectedExtendedDuration.value = null
}

// More Duration functions (matching RoomList.vue approach)
const openMoreDurationDialog = () => {
    moreDurationDialogVisible.value = true
}

const selectDailyRateAndHours = (days, rate) => {
    let actualDays
    if (days === 'week') actualDays = 7
    else if (days === 'twoWeeks') actualDays = 14
    else if (days === 'month') actualDays = 30
    else actualDays = parseInt(days)
    
    const hours = actualDays * 24 // Convert days to hours
    guestDetails.value.selectedHours = hours
    guestDetails.value.selectedrate = rate
    
    // Store the selected duration for highlighting
    selectedExtendedDuration.value = {
        days: days,
        label: getDayLabel(days),
        hours: hours,
        rate: rate
    }
    
    moreDurationDialogVisible.value = false // Close dialog after selection
}

// Helper functions for More Duration Dialog (matching RoomList.vue)
const getDayLabel = (days) => {
    if (days === 'week') return '1 Week'
    if (days === 'twoWeeks') return '2 Weeks'
    if (days === 'month') return '1 Month'
    return `${days} Day${days > 1 ? 's' : ''}`
}

const getDaysCount = (days) => {
    if (days === 'week') return 7
    if (days === 'twoWeeks') return 14
    if (days === 'month') return 30
    return parseInt(days)
}

const isSelectedDays = (days) => {
    const actualDays = getDaysCount(days)
    const selectedHours = guestDetails.value.selectedHours
    return selectedHours === (actualDays * 24)
}

const formatBookingDateTime = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Manila'
    })
}

const generateroomCode = (prefix = 'BK') => {
    const randomString = Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()
    return `${prefix}-${randomString}`
}

const submitBooking = async () => {
    if (!isBookingFormValid.value || !isAuthenticated.value || !currentUser.value) {
        toast.add({
            severity: 'error',
            summary: 'Authentication Required',
            detail: 'Please log in to make a booking.',
            life: 5000
        })
        return
    }
    
    // Generate unique codes
    const room = allRooms.value.find(r => r.id === selectedBookingRoom.value.id)
    if (!room) return
    
    const isBookType = true // Always true for BookedRooms.vue (customer booking)

    const bookingData = {
        room_id: room.id,
        guest_name: guestDetails.value.guestName,
        cellphone: guestDetails.value.cellphone,
        guest_email: guestDetails.value.guestEmail || currentUser.value.email, // Use authenticated user's email
        booking_type: 'Booking',
        status: 'Booked',
        // Don't set check_in_datetime for bookings - only when actually checking in
        check_in_datetime: isBookType ? null : guestDetails.value.checkInDateTime?.toISOString(),
        selected_hours: guestDetails.value.selectedHours,
        selected_rate: guestDetails.value.selectedrate,
        room_code: generateroomCode(room.id),
        book_code: generateroomCode('BK'),
        // Include user context for backend
        authenticated_user_id: currentUser.value.id
    }

    const nowMs = Date.now()

    // Optimistic UI - bookings should not have checkInDateTime until actual check-in
    const optimisticDetails = {
        ...guestDetails.value,
        checkInDateTime: isBookType ? null : new Date(nowMs).toISOString(),
        createdAt: new Date(nowMs).toISOString() // Use createdAt for booking expiry calculations
    }
    
    bookingLoading.value = true
    
    try {
        // Create booking in backend (using BookedRooms.py endpoint)
        const response = await createBooking(bookingData)
        
        // Add to localStorage for guest tracking
        const newBooking = {
            id: response.booking_id, // Use backend booking ID
            room_id: room.id,
            room_name: room.name,
            room_number: room.room_number,
            guest_name: guestDetails.value.guestName,
            cellphone: guestDetails.value.cellphone,
            guest_email: guestDetails.value.guestEmail,
            status: 'Booked',
            selected_hours: guestDetails.value.selectedHours,
            selected_rate: guestDetails.value.selectedrate,
            room_code: bookingData.room_code,
            book_code: bookingData.book_code,
            created_at: new Date().toISOString()
        }
        
        userBookings.value.push(newBooking)
        saveBookingsToStorage()
        
        toast.add({
            severity: 'success',
            summary: 'Booking Saved',
            detail: 'The booking was saved successfully.',
            life: 3000
        })
        
        bookingDialogVisible.value = false
        
        // Update room status in local data
        const roomIndex = allRooms.value.findIndex(r => r.id === selectedBookingRoom.value.id)
        if (roomIndex !== -1) {
            allRooms.value[roomIndex].status = 'Booked'
            allRooms.value[roomIndex].guestDetails = optimisticDetails
        }
        
        // Refresh filtered rooms
        filterRooms()
        
        // Refresh rooms data
        await fetchRooms()
        
    } catch (err) {
        console.error('Error creating booking:', err)
        toast.add({
            severity: 'error',
            summary: 'Booking Failed',
            detail: err.response?.data?.message || err.message,
            life: 3000
        })
    } finally {
        bookingLoading.value = false
    }
}

// Booking cancellation functions
const openCancelDialog = (booking) => {
    selectedBookingToCancel.value = booking
    cancelDialogVisible.value = true
}

const closeCancelDialog = () => {
    cancelDialogVisible.value = false
    selectedBookingToCancel.value = null
}

const confirmCancelBooking = async () => {
    if (!selectedBookingToCancel.value) return
    
    try {
        // Call backend API to cancel booking
        // This will set booking status to 'Cancelled' and room status back to 'Available'
        if (!selectedBookingToCancel.value.id || typeof selectedBookingToCancel.value.id !== 'number') {
            throw new Error('Invalid booking ID - cannot cancel booking')
        }
        
        await cancelBooking(selectedBookingToCancel.value.id)
        
        // Refresh bookings from database (cancelled booking will be automatically filtered out)
        await fetchBookings()
        
        // Refresh available rooms to show the room as available again
        await fetchRooms()
        
        toast.add({
            severity: 'success',
            summary: 'Booking Cancelled',
            detail: 'Your booking has been cancelled and the room is now available for booking.',
            life: 3000
        })
        
        closeCancelDialog()
        
    } catch (err) {
        console.error('Error cancelling booking:', err)
        toast.add({
            severity: 'error',
            summary: 'Cancellation Failed',
            detail: err.message || 'Failed to cancel booking. Please try again.',
            life: 5000
        })
    }
}

const getBookingStatusSeverity = (status) => {
    switch (status) {
        case 'Booked':
            return 'info'
        case 'Occupied':
            return 'success'
        case 'Cancelled':
            return 'danger'
        case 'Completed':
            return 'secondary'
        default:
            return 'secondary'
    }
}

const getBookingStatusLabel = (status) => {
    switch (status) {
        case 'Booked':
            return 'Booked'
        case 'Occupied':
            return 'Checked In'
        case 'Cancelled':
            return 'Cancelled'
        case 'Completed':
            return 'Completed'
        default:
            return status
    }
}

const formatBookingDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    })
}

// Calculate time remaining for bookings - only show when less than 1 hour remains (with seconds)
const getTimeRemaining = (booking) => {
    const now = new Date()
    
    if (booking.status === 'Booked') {
        // For booked rooms, show time remaining until check-in expires (1 hour window)
        const bookingTime = new Date(booking.created_at)
        const checkInExpiryTime = new Date(bookingTime.getTime() + (60 * 60 * 1000)) // 1 hour to check in
        
        if (now >= checkInExpiryTime) {
            return { expired: true, text: 'Booking Expired', color: 'red' }
        }
        
        const timeLeft = checkInExpiryTime.getTime() - now.getTime()
        const totalSeconds = Math.floor(timeLeft / 1000)
        const hoursLeft = Math.floor(totalSeconds / 3600)
        const minutesLeft = Math.floor((totalSeconds % 3600) / 60)
        const secondsLeft = totalSeconds % 60
        
        // Only show countdown when less than 1 hour remains
        if (hoursLeft >= 1) {
            return null // Don't show anything if 1+ hours remain
        }
        
        // Less than 1 hour remaining - show with seconds
        if (minutesLeft > 0) {
            return { 
                expired: false, 
                text: `${minutesLeft}m ${secondsLeft}s to check in`,
                urgent: true,
                color: 'orange'
            }
        } else if (secondsLeft > 0) {
            return { 
                expired: false, 
                text: `${secondsLeft}s to check in`,
                urgent: true,
                color: 'red'
            }
        } else {
            return { expired: true, text: 'Booking Expired', color: 'red' }
        }
    } else if (booking.status === 'Occupied') {
        // For occupied rooms, calculate time remaining from check-in time + booked duration
        const checkInTime = booking.check_in_datetime ? new Date(booking.check_in_datetime) : new Date(booking.created_at)
        const durationMs = booking.selected_hours * 60 * 60 * 1000 // Convert hours to milliseconds
        const checkOutTime = new Date(checkInTime.getTime() + durationMs)
        
        if (now >= checkOutTime) {
            return { expired: true, text: 'Stay Expired', color: 'red' }
        }
        
        const timeLeft = checkOutTime.getTime() - now.getTime()
        const totalSeconds = Math.floor(timeLeft / 1000)
        const hoursLeft = Math.floor(totalSeconds / 3600)
        const minutesLeft = Math.floor((totalSeconds % 3600) / 60)
        const secondsLeft = totalSeconds % 60
        
        // Only show countdown when less than 1 hour remains
        if (hoursLeft >= 1) {
            return null // Don't show anything if 1+ hours remain
        }
        
        // Less than 1 hour remaining - show with seconds
        if (minutesLeft > 0) {
            return { 
                expired: false, 
                text: `${minutesLeft}m ${secondsLeft}s left`,
                urgent: true,
                color: 'orange'
            }
        } else if (secondsLeft > 0) {
            return { 
                expired: false, 
                text: `${secondsLeft}s left`,
                urgent: true,
                color: 'red'
            }
        } else {
            return { expired: true, text: 'Stay Expired', color: 'red' }
        }
    }
    
    // For other statuses (cancelled, etc.), don't show time remaining
    return null
}

// Timer for updating time remaining
let timeUpdateInterval = null

// Clean up expired bookings automatically
const cleanupExpiredBookings = () => {
    const now = new Date()
    let hasChanges = false
    
    userBookings.value = userBookings.value.map(booking => {
        // Only process bookings that are still in 'Booked' status
        if (booking.status === 'Booked') {
            const bookingTime = new Date(booking.created_at)
            const checkInExpiryTime = new Date(bookingTime.getTime() + (60 * 60 * 1000)) // 1 hour to check in
            
            if (now >= checkInExpiryTime) {
                // Mark as expired/cancelled locally
                hasChanges = true
                return {
                    ...booking,
                    status: 'Expired',
                    expired_at: new Date().toISOString()
                }
            }
        }
        return booking
    })
    
    if (hasChanges) {
        saveBookingsToStorage()
        
        // Show notification about expired bookings
        toast.add({
            severity: 'warn',
            summary: 'Booking Expired',
            detail: 'One or more bookings have expired due to the 1-hour check-in window.',
            life: 5000
        })
    }
}

// Initialize component
onMounted(async () => {
    // Check authentication first
    await checkAuthentication()
    
    // Only proceed if authenticated
    if (isAuthenticated.value) {
        fetchBookings() // Load from localStorage immediately
        await fetchRooms() // Fetch rooms from API
        
        // Clean up expired bookings on load
        cleanupExpiredBookings()
        
        // Start timer to update time remaining every second (for real-time countdown with seconds)
        timeUpdateInterval = setInterval(() => {
            // Clean up expired bookings every minute (60 seconds)
            if (Date.now() % 60000 < 1000) {
                cleanupExpiredBookings()
            }
            
            // Force reactive update by triggering a re-render
            // This will update the time remaining displays with seconds precision
            userBookings.value = [...userBookings.value]
        }, 1000) // Update every 1 second
    }
})

// Cleanup timer on component unmount
onUnmounted(() => {
    if (timeUpdateInterval) {
        clearInterval(timeUpdateInterval)
    }
})
</script>

<style scoped>
/* Custom scrollbar for dialogs */
:deep(.p-dialog-content) {
    max-height: 70vh;
    overflow-y: auto;
}

/* Image hover effects */
.transform:hover {
    transform: scale(1.05);
}

/* Button hover animations */
.p-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Card hover effects */
.shadow-lg:hover {
    transform: translateY(-4px);
}

/* Gradient overlays */
.bg-gradient-to-t {
    background: linear-gradient(to top, var(--tw-gradient-stops));
}

.bg-gradient-to-r {
    background: linear-gradient(to right, var(--tw-gradient-stops));
}
</style>