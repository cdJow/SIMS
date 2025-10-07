import { getProductsWithItems, getProductsSimple } from "@/api/auth";

export const ProductService = {
    async getProductsData() {
        try {
            if (typeof getProductsSimple !== 'function') {
                console.error("getProductsSimple is not available");
                return [];
            }
            const response = await getProductsSimple();
            return response.data || [];
        } catch (error) {
            console.error("Error fetching products data:", error);
            return [];
        }
    },

    async getProductsWithOrdersData() {
        try {
            if (typeof getProductsWithItems !== 'function') {
                console.error("getProductsWithItems is not available");
                return [];
            }
            const response = await getProductsWithItems();
            return response.data || [];
        } catch (error) {
            console.error("Error fetching products with items:", error);
            return [];
        }
    },

    async getProductsMini() {
        try {
            const data = await this.getProductsData();
            return data.slice(0, 5);
        } catch (error) {
            console.error("Error fetching mini products:", error);
            return [];
        }
    },

    async getProductsSmall() {
        try {
            const data = await this.getProductsData();
            return data.slice(0, 10);
        } catch (error) {
            console.error("Error fetching small products:", error);
            return [];
        }
    },

    async getProducts() {
        return await this.getProductsData();
    },

    async getProductsWithOrdersSmall() {
        try {
            const data = await this.getProductsWithOrdersData();
            return data.slice(0, 10);
        } catch (error) {
            console.error("Error fetching small products with orders:", error);
            return [];
        }
    },

    async getProductsWithOrders() {
        return await this.getProductsWithOrdersData();
    },
};
