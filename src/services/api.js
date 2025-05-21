import axios from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    config => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (token) config.headers.token = token;

        return config;
    },
    error => Promise.reject(error)
);

const buildFormData = (formData, data, parentKey) => {
    if (data && typeof data === "object" && !(data instanceof Date) && !(data instanceof File)) {
        Object.keys(data).forEach(key => {
            buildFormData(formData, data[key], parentKey ? `${parentKey}[${key}]` : key);
        });
    } else {
        formData.append(parentKey, data || "");
    }
};

export const authLogin = async (username, password, mode) => {
    try {
        const response = await api.post("/gettoken", {
            identity: username,
            password: password,
            mode: mode,
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getProfile = async () => {
    try {
        const response = await api.post('/cektoken');
        return response.data;
    } catch (error) {
        throw {
            code: error.response.status,
            message: error.response.data.message || 'Terjadi kesalahan'
        }
    }
};

export const fetchGet = async (payload, payloadHeader) => {
    try {
        const formData = new FormData();
        buildFormData(formData, payload);

        const response = await api.post("/route", formData, {
            headers: {
                "X-Slice": payloadHeader,
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data;
    } catch (error) {
        throw {
            code: error.response.status,
            message: error.response.data.message || "Terjadi kesalahan",
        };
    }
};

export const fetchPost = async (payload, payloadHeader) => {
    try {
        const formData = new FormData();
        buildFormData(formData, payload);

        const response = await api.post("/route", formData, {
            headers: {
                "X-Slice": payloadHeader,
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data;
    } catch (error) {
        throw {
            code: error.response.status,
            message: error.response.data.message || "Terjadi kesalahan",
        };
    }
};

export default api;
