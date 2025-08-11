import axios from "axios";

const api = axios.create({
  baseURL: '/api',
});

export const getData = async () => {
    const response = await api.get('/data');
    return response.data;
};

export const postData = async (data: any) => {
    const response = await api.post('/data', data);
    return response.data;
};