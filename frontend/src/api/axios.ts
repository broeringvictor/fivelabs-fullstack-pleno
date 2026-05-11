import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar o token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("@express:token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros globais
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Se não houver resposta, é erro de rede
    if (!error.response) {
      toast.error("Erro de conexão com o servidor. Verifique sua internet.");
      return Promise.reject(error);
    }

    const message = error.response?.data?.error || "Ocorreu um erro na comunicação com o servidor.";
    const status = error.response?.status;

    // Tratamento de 401 (Não autorizado)
    if (status === 401) {
      localStorage.removeItem("@express:token");
      localStorage.removeItem("@express:user");
      return Promise.reject(error);
    }

    // Tratamento de 403 (Proibido)
    if (status === 403) {
      toast.error("Você não tem permissão para acessar este recurso.");
      return Promise.reject(error);
    }

    // Tratamento de 404 (Não encontrado)
    if (status === 404) {
      toast.error("Recurso não encontrado.");
      return Promise.reject(error);
    }

    // Tratamento de 500+ (Erro do servidor)
    if (status && status >= 500) {
      toast.error("Erro no servidor. Tente novamente mais tarde.");
      return Promise.reject(error);
    }

    // Outros erros (400, 409, etc)
    toast.error(message);
    return Promise.reject(error);
  }
);

export default api;
