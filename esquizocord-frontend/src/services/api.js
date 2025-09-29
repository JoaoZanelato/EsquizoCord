// src/services/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000', // !! CONFIRME SE A PORTA DO SEU BACKEND É ESTA !!
  withCredentials: true,
});

export default apiClient;