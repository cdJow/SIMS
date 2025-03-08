export const ProductService = {
    getProductsData() {
        return [
            {
                id: "1000",
                code: "f230fh0g3",
                name: "Rejoice",
                description: "Product Description",
                image: "bamboo-watch.jpg",
                price: 16,
                category: "Accessories",
                quantity: 24,
                inventoryStatus: "INSTOCK",
                rating: 5,
            },
            {
                id: "1001",
                code: "nvklal433",
                name: "Soap",
                description: "Product Description",
                image: "black-watch.jpg",
                price: 17,
                category: "Accessories",
                quantity: 61,
                inventoryStatus: "INSTOCK",
                rating: 4,
            },
            {
                id: "1002",
                code: "zz21cz3c1",
                name: "Soap",
                description: "Product Description",
                image: "blue-band.jpg",
                price: 79,
                category: "Fitness",
                quantity: 2,
                inventoryStatus: "LOWSTOCK",
                rating: 3,
            },
            {
                id: "1003",
                code: "244wgerg2",
                name: "Cup Noodles",
                description: "Product Description",
                image: "blue-t-shirt.jpg",
                price: 29,
                category: "Clothing",
                quantity: 25,
                inventoryStatus: "INSTOCK",
                rating: 5,
            },
            {
                id: "1004",
                code: "h456wer53",
                name: "Mineral Water",
                description: "Product Description",
                image: "bracelet.jpg",
                price: 15,
                category: "Accessories",
                quantity: 73,
                inventoryStatus: "INSTOCK",
                rating: 4,
            },
            {
                id: "1005",
                code: "av2231fwg",
                name: "Chippy",
                description: "Product Description",
                image: "brown-purse.jpg",
                price: 120,
                category: "Accessories",
                quantity: 0,
                inventoryStatus: "OUTOFSTOCK",
                rating: 4,
            },
            {
                id: "1006",
                code: "bib36pfvm",
                name: "Oishi",
                description: "Product Description",
                image: "chakra-bracelet.jpg",
                price: 32,
                category: "Accessories",
                quantity: 5,
                inventoryStatus: "LOWSTOCK",
                rating: 3,
            },
        ];
    },

    getProductsWithOrdersData() {
        return [
            {
                id: 1,
                name: "Product A",
                brand: "Brand A",
                quantity: 100,
                description: "Description A",
                category: "Non-Consumable",
                inventoryStatus: "INSTOCK",
                batches: [
                    {
                        batchId: 101,
                        batchNumber: "Batch A1",
                        quantity: 50,
                        purchaseDate: "2024-01-17",
                        purchasePrice: 458.02, // Rounded for clarity
                        unit: "Box",
                        supplier: "Supplier A",
                        rental: "yes",
                        rentalprice: 345.0,
                        warrantyValue: 1,
                        warrantyUnit: "year(s)",
                        minimumstocks: 12,
                        stocklimit: 100,
                        status: "Active",
                        serialNumbers: [
                            {
                                serialNumber: "SN11",
                                status: "Available",
                                rental: "No",
                                rentalPrice: "-",
                                roomNumber: "-",
                            },
                            {
                                serialNumber: "SN12",
                                status: "Assigned",
                                rental: "yes",
                                rentalPrice: "900",
                                roomNumber: "104",
                            },
                            {
                                serialNumber: "SN13",
                                status: "Damaged",
                                rental: "yes",
                                rentalPrice: "900",
                                roomNumber: "102",
                            },
                            {
                                serialNumber: "SN14",
                                status: "Rented",
                                rental: "yes",
                                rentalPrice: "900",
                                roomNumber: "101",
                            },
                        ],
                    },
                ],
            },

            {
                id: 4,
                name: "Product D",
                brand: "Brand D",
                quantity: 100,
                description: "Description D",
                category: "Consumable",
                inventoryStatus: "INSTOCK",
                batches: [
                    {
                        batchId: 401,
                        batchNumber: "Batch D4",
                        quantity: 85,
                        purchaseDate: "2024-09-09",
                        purchasePrice: 65.75234191392829,
                        srp: 20,
                        unit: "L",
                        supplier: "Supplier D",
                        expDate: "2025-01-27",
                        status: "Active",
                        serialNumbers: [
                            {
                                serialNumber: "SN41",
                                srp: "90",
                                status: "Available",
                            },
                            { serialNumber: "SN42", srp: "50", status: "Sold" },
                            { serialNumber: "SN43", srp: "60", status: "Sold" },
                        ],
                    },
                ],
            },
        ];
    },

    getProductsMini() {
        return Promise.resolve(this.getProductsData().slice(0, 5));
    },

    getProductsSmall() {
        return Promise.resolve(this.getProductsData().slice(0, 10));
    },

    getProducts() {
        return Promise.resolve(this.getProductsData());
    },

    getProductsWithOrdersSmall() {
        return Promise.resolve(this.getProductsWithOrdersData().slice(0, 10));
    },

    getProductsWithOrders() {
        return Promise.resolve(this.getProductsWithOrdersData());
    },
};
