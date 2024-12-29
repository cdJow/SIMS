// src/service/BookingService.js
export const BookingService = {
    getPendingBookings() {
        return new Promise((resolve) => {
            // Simulated data for pending bookings
            const data = [
                {
                    guestName: "John Doe",
                    roomNumber: "101",
                    bookingDate: "2024-06-12",
                },
                {
                    guestName: "Jane Smith",
                    roomNumber: "205",
                    bookingDate: "2024-06-14",
                },
                {
                    guestName: "Mark Brown",
                    roomNumber: "304",
                    bookingDate: "2024-06-15",
                },
            ];

            setTimeout(() => resolve(data), 500); // Simulates an API delay
        });
    },
};
