const mockReservations = [
    {
        reservationId: "RES-1001",
        guestName: "John Doe",
        roomNumber: "201",
        roomType: "Deluxe Suite",
        selectedRate: 299.99,
        checkInDate: "2023-12-25T15:00:00",
        checkOutDate: "2023-12-30T11:00:00",
        paymentStatus: {
            ratePaid: true,
            depositAmount: 100.0,
            depositStatus: "Pending",
            balanceDue: 0.0,
        },
        specialRequests: ["Early check-in", "Extra pillows"],
        contactInfo: "john@email.com | +1 (555) 123-4567",
        loyaltyStatus: "Gold Member",
        checkInStatus: "Completed",
        notes: "Deposit to be refunded to CC ending in 1234",
    },
    {
        reservationId: "RES-1002",
        guestName: "Jane Smith",
        roomNumber: "305",
        roomType: "Executive Suite",
        selectedRate: 399.99,
        checkInDate: "2023-12-24T14:00:00",
        checkOutDate: "2023-12-28T10:00:00",
        paymentStatus: {
            ratePaid: false,
            depositAmount: 150.0,
            depositStatus: "Pending",
            balanceDue: 399.99,
        },
        specialRequests: ["Late check-out", "Airport transfer"],
        contactInfo: "jane@email.com | +1 (555) 987-6543",
        loyaltyStatus: "Silver Member",
        checkInStatus: "Pending",
        notes: "Needs wheelchair accessible room",
    },
    // Add more mock reservations as needed
];

export default class ReservationService {
    static getActiveReservations() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(mockReservations);
            }, 500); // Simulate API delay
        });
    }

    static getReservationById(id) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const reservation = mockReservations.find(
                    (r) => r.reservationId === id,
                );
                if (reservation) {
                    resolve(reservation);
                } else {
                    reject(new Error("Reservation not found"));
                }
            }, 500);
        });
    }

    static updateReservation(updatedReservation) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const index = mockReservations.findIndex(
                    (r) => r.reservationId === updatedReservation.reservationId,
                );
                if (index !== -1) {
                    mockReservations[index] = updatedReservation;
                }
                resolve(updatedReservation);
            }, 500);
        });
    }
}
