import axios from "axios";

const apiClient = axios.create({
    baseURL: "http://localhost:3000/api",
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
    withCredentials: true,
});

export const api = {
    // PRODUCTS

    getProducts: async (params = {}) => {
        const response = await apiClient.get("/products", {
            params,
        });

        return response.data;
    },

    getProductById: async (id) => {
        const response = await apiClient.get(`/products/${id}`);
        return response.data;
    },

    createProduct: async (data) => {
        const response = await apiClient.post("/products", data);
        return response.data;
    },

    updateProduct: async (id, data) => {
        const response = await apiClient.put(`/products/${id}`, data);
        return response.data;
    },

    updateProductFactories: async (id, factories) => {
        const response = await apiClient.put(
            `/products/${id}/factories`,
            { factories }
        );
        return response.data;
    },

    deleteProduct: async (id) => {
        const response = await apiClient.delete(`/products/${id}`);
        return response.data;
    },

    getProductIngredients: async (id) => {
        const response = await apiClient.get(`/products/${id}/ingredients`);
        return response.data;
    },


    // FACTORIES

    getFactories: async (params = {}) => {
        const response = await apiClient.get("/factories", {
            params,
        });

        return response.data;
    },

    getFactoryById: async (id) => {
        const response = await apiClient.get(`/factories/${id}`);
        return response.data;
    },

    createFactory: async (data) => {
        const response = await apiClient.post("/factories", data);
        return response.data;
    },

    updateFactory: async (id, data) => {
        const response = await apiClient.put(`/factories/${id}`, data);
        return response.data;
    },

    deleteFactory: async (id) => {
        const response = await apiClient.delete(`/factories/${id}`);
        return response.data;
    },

    addProductToFactory: async (factoryId, productId) => {
        const response = await apiClient.post(
            `/factories/${factoryId}/products`,
            { product_id: productId }
        );

        return response.data;
    },

    deleteProductFromFactory: async (factoryId, productId) => {
        const response = await apiClient.delete(
            `/factories/${factoryId}/products/${productId}`
        );

        return response.data;
    },


    // WORKERS

    getWorkers: async (params = {}) => {
        const response = await apiClient.get("/workers", {
            params,
        });

        return response.data;
    },

    getWorkerById: async (id) => {
        const response = await apiClient.get(`/workers/${id}`);
        return response.data;
    },

    createWorker: async (data) => {
        const response = await apiClient.post("/workers", data);
        return response.data;
    },

    updateWorker: async (id, data) => {
        const response = await apiClient.put(`/workers/${id}`, data);
        return response.data;
    },

    deleteWorker: async (id) => {
        const response = await apiClient.delete(`/workers/${id}`);
        return response.data;
    },


    // INGREDIENTS

    getIngredients: async (params = {}) => {
        const response = await apiClient.get("/ingredients", {
            params,
        });

        return response.data;
    },

    getIngredientById: async (id) => {
        const response = await apiClient.get(`/ingredients/${id}`);
        return response.data;
    },

    createIngredient: async (data) => {
        const response = await apiClient.post("/ingredients", data);
        return response.data;
    },

    updateIngredient: async (id, data) => {
        const response = await apiClient.put(`/ingredients/${id}`, data);
        return response.data;
    },

    deleteIngredient: async (id) => {
        const response = await apiClient.delete(`/ingredients/${id}`);
        return response.data;
    },
    // Поставки ингредиентов
    getIngredientBatches: async (params = {}) => {
        const response = await apiClient.get("/ingredients/batches", {
            params,
        });
        return response.data;
    },

    getIngredientBatchById: async (id) => {
        const response = await apiClient.get(`/ingredients/batch/${id}`);
        return response.data;
    },

    createIngredientBatch: async (data) => {
        const response = await apiClient.post("/ingredients/batches", data);
        return response.data;
    },

    deleteIngredientBatch: async (id) => {
        const response = await apiClient.delete(`/ingredients/batches/${id}`);
        return response.data;
    },

    // BATCHES

    getBatches: async (params = {}) => {
        const response = await apiClient.get("/batches", {
            params,
        });
        return response.data;
    },

    getBatchById: async (id) => {
        const response = await apiClient.get(`/batch/${id}`);
        return response.data;
    },

    createBatch: async (data) => {
        const response = await apiClient.post("/batches", data);
        return response.data;
    },

    deleteBatch: async (id) => {
        const response = await apiClient.delete(`/batches/${id}`);
        return response.data;
    },

};

export default apiClient;