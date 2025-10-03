// src/services/api.js
import axios from "axios";

const apiClient = axios.create({
  // ALTERAÇÃO AQUI
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});

// Adiciona um interceptor de resposta para lidar com erros de autenticação
apiClient.interceptors.response.use(
  (response) => {
    // Se a resposta for bem-sucedida, apenas a retorna
    return response;
  },
  (error) => {
    const { config, response } = error;

    // Verifica se o erro é 401 (Não Autorizado)
    if (response && response.status === 401) {
      // NÃO redireciona se a falha ocorreu em rotas de autenticação,
      // para evitar o loop de login.
      if (config.url === "/session" || config.url === "/login") {
        return Promise.reject(error);
      }

      // Para todos os outros erros 401, o utilizador está realmente deslogado
      // e deve ser redirecionado.
      window.location = "/login";
    }

    // Para qualquer outro erro, a 'promise' é rejeitada
    return Promise.reject(error);
  }
);

export default apiClient;
