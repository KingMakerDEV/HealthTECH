import axios from "axios";

const BASE_URL = "http://127.0.0.1:5000/auth";

export const loginUser = async (data) => {
    return await axios.post(`${BASE_URL}/login`, data);
};

export const registerUser = async (data) => {
    return await axios.post(`${BASE_URL}/register`, data);
};
