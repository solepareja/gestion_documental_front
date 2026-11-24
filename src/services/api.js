import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      /^\/(documentos|conductores|transportistas)(\/|$)/.test(error.config?.url || '')
    ) {
      localStorage.removeItem('usuario_sesion');
      window.location.assign('/login');
    }
    return Promise.reject(error);
  },
);

export default api;
