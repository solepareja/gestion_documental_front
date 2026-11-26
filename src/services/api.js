import axios from 'axios';

const api = axios.create({
  // En desarrollo, tambiÃ©n el mÃ³vil accede al backend a travÃ©s de Vite.
  baseURL: import.meta.env.DEV
    ? `${window.location.origin}/api`
    : import.meta.env.VITE_API_URL || '/api',
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
