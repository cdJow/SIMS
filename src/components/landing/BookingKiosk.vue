<script setup>
import { ref, computed } from 'vue';

const rooms = ref([
    { id: 1, name: 'Cozy Single Room', type: 'Single Size', status: 'AVAILABLE', price: 100, image: 'https://via.placeholder.com/300x200.png?text=Single+Room' },
    { id: 2, name: 'Luxury Double Room', type: 'Double Size', status: 'AVAILABLE', price: 150, image: 'https://via.placeholder.com/300x200.png?text=Double+Room' },
    { id: 3, name: 'Queen Comfort Room', type: 'Queen Size', status: 'AVAILABLE', price: 200, image: 'https://via.placeholder.com/300x200.png?text=Queen+Room' },
    { id: 4, name: 'Elegant Double Room', type: 'Double Size', status: 'AVAILABLE', price: 160, image: 'https://via.placeholder.com/300x200.png?text=Double+Room' },
    { id: 5, name: 'Premium Queen Room', type: 'Queen Size', status: 'AVAILABLE', price: 220, image: 'https://via.placeholder.com/300x200.png?text=Premium+Queen+Room' },
]);

const searchQuery = ref('');
const layout = ref('list');
const options = ref(['list', 'grid']);
const showBookingForm = ref(false);
const selectedRoom = ref(null);

const form = ref({
    customerName: '',
    cellphone: '',
    hoursOfStay: '',
});

// Filter rooms to exclude booked ones and match search query
const filteredRooms = computed(() => {
    const query = searchQuery.value.toLowerCase();
    return rooms.value.filter((room) =>
        room.status === 'AVAILABLE' &&
        (room.name.toLowerCase().includes(query) ||
            room.type.toLowerCase().includes(query) ||
            room.price.toString().includes(query))
    );
});

function getRoomTagColor(status) {
    switch (status) {
        case 'AVAILABLE':
            return 'success';
        case 'BOOKED':
            return 'warning';
        case 'MAINTENANCE':
            return 'danger';
        default:
            return null;
    }
}

function bookRoom(room) {
    selectedRoom.value = room;
    showBookingForm.value = true;
}

function handleBooking() {
    if (selectedRoom.value) {
        // Update room status to BOOKED
        const roomIndex = rooms.value.findIndex(r => r.id === selectedRoom.value.id);
        if (roomIndex !== -1) {
            rooms.value[roomIndex].status = 'BOOKED';
        }
    }

    // Show success message
    alert(`Booking Successful for ${selectedRoom.value.name}!\nName: ${form.value.customerName}\nCellphone: ${form.value.cellphone}\nHours of Stay: ${form.value.hoursOfStay}`);

    // Reset form and close modal
    showBookingForm.value = false;
    form.value.customerName = '';
    form.value.cellphone = '';
    form.value.hoursOfStay = '';
}
</script>

<template>
    <div class="p-4 flex flex-col items-center">
        <!-- Search and Layout Options -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 w-full max-w-3xl">
            <input
                v-model="searchQuery"
                type="text"
                placeholder="Search"
                class="border border-gray-300 rounded px-4 py-2 w-full sm:max-w-md"
            />
            <SelectButton v-model="layout" :options="options" :allowEmpty="false">
                <template #option="{ option }">
                    <i :class="[option === 'list' ? 'pi pi-bars' : 'pi pi-table']" />
                </template>
            </SelectButton>
        </div>

        <!-- Rooms List/Grid -->
        <div class="card w-full max-w-5xl">
            <DataView :value="filteredRooms" :layout="layout">
                <!-- List View -->
                <template #list="slotProps">
                    <div v-for="room in slotProps.items" :key="room.id" class="p-4 border rounded mb-4 shadow">
                        <div class="flex flex-col md:flex-row gap-4">
                            <div class="md:w-40">
                                <img :src="room.image" alt="Room Image" class="rounded w-full h-32 object-cover" />
                            </div>
                            <div class="flex-1">
                                <div class="text-xl font-bold">{{ room.name }}</div>
                                <div class="text-sm text-gray-600">{{ room.type }}</div>
                                <Tag :value="room.status" :severity="getRoomTagColor(room.status)" class="mt-2"></Tag>
                            </div>
                            <div class="flex flex-col items-end justify-between">
                                <div class="text-2xl font-bold">₱{{ room.price }} / 6 Hours</div>
                                <Button
                                    label="Book Now"
                                    class="bg-red-500 text-white px-4 py-2 rounded mt-4 hover:bg-red-600"
                                    @click="bookRoom(room)"
                                ></Button>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- Grid View -->
                <template #grid="slotProps">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div v-for="room in slotProps.items" :key="room.id" class="border rounded shadow-md p-4">
                            <img :src="room.image" alt="Room Image" class="w-full h-40 object-cover rounded mb-4" />
                            <div class="text-xl font-bold">{{ room.name }}</div>
                            <div class="text-sm text-gray-600">{{ room.type }}</div>
                            <Tag :value="room.status" :severity="getRoomTagColor(room.status)" class="mt-2"></Tag>
                            <div class="text-2xl font-bold mt-4">${{ room.price }} / night</div>
                            <Button
                                label="Book Now"
                                class="bg-red-500 text-white w-full py-2 rounded mt-4 hover:bg-red-600"
                                @click="bookRoom(room)"
                            ></Button>
                        </div>
                    </div>
                </template>
            </DataView>       
        </div>
    </div>

    

    <!-- Booking Form Modal -->
    <Dialog v-model:visible="showBookingForm" header="Book Your Stay" :modal="true" :closable="false">
    <p class="text-sm text-red-600 mb-4">
        Notice: Your reservation will be canceled if not checked in within 30 minutes of the scheduled time.
    </p>
    <!-- Room Details -->
    <div class="mb-4 border rounded p-4 bg-gray-50">
        <h3 class="font-bold text-lg">{{ selectedRoom?.name }}</h3>
        <p class="text-sm text-gray-600">{{ selectedRoom?.type }}</p>
        <p class="text-xl font-semibold mt-2">₱{{ selectedRoom?.price }} / 6 Hours</p>
    </div>
    <form @submit.prevent="handleBooking">
        <div class="mb-4">
            <label class="block mb-2 font-medium">Customer Name</label>
            <input
                type="text"
                v-model="form.customerName"
                class="w-full px-4 py-2 border rounded focus:outline-none"
                placeholder="Enter your name"
                required
            />
        </div>
        <div class="mb-4">
            <label class="block mb-2 font-medium">Cellphone Number</label>
            <input
                type="tel"
                v-model="form.cellphone"
                class="w-full px-4 py-2 border rounded focus:outline-none"
                placeholder="Enter your cellphone number"
                required
            />
        </div>
        <div class="mb-4">
            <label class="block mb-2 font-medium">Hours of Stay</label>
            <select
                v-model="form.hoursOfStay"
                class="w-full px-4 py-2 border rounded focus:outline-none"
                required
            >
                <option disabled value="">Select hours of stay</option>
                <option value="6">6 Hours</option>
                <option value="12">12 Hours</option>
                <option value="24">24 Hours</option>
            </select>
        </div>
        <div class="flex justify-between gap-4 mt-4">
            <!-- Confirm Booking Button -->
            <Button type="submit" label="Book" class="flex-1 bg-blue-600 text-white" />
            <!-- Cancel Button -->
            <Button
                type="button"
                label="Cancel"
                class="flex-1 bg-gray-400 text-white"
                @click="showBookingForm = false"
            />
        </div>
    </form>
</Dialog>

</template>
