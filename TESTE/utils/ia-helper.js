// TESTE/utils/ia-helper.js
const axios = require('axios');

const AI_USER_ID = 1;
// ATUALIZAÇÃO: Revertido para 'gemini-pro' que é um modelo mais estável.
// O modelo 'gemini-1.5-flash-latest' estava retornando erros de sobrecarga (503).
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;

async function getAiResponse(prompt) {
    try {
        const response = await axios.post(API_URL, {
            contents: [{
                parts: [{
                    text: `Você é uma IA chamada EsquizoIA em um chat chamado EsquizoCord. Responda de forma esquizofrênica, porém precisa e termine seu pensamento com uma risada maléfica. Pergunta do usuário: "${prompt}"`
                }]
            }]
        });
        // Validação para garantir que a resposta da API tem o formato esperado
        if (response.data && response.data.candidates && response.data.candidates.length > 0 && response.data.candidates[0].content && response.data.candidates[0].content.parts && response.data.candidates[0].content.parts.length > 0) {
            return response.data.candidates[0].content.parts[0].text;
        } else {
            // Log de um erro caso a resposta da API venha em um formato inesperado
            console.error("Formato inesperado da resposta da API da IA:", response.data);
            return "Minha mente está um caos agora, não consigo responder. Muahahaha!";
        }
    } catch (error) {
        // Log do erro completo para facilitar a depuração
        console.error("Erro ao chamar a API da IA:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        
        // Retorna uma mensagem de erro mais amigável para o usuário
        if (error.response && error.response.status === 503) {
            return "Estou sobrecarregada com pensamentos sombrios! Tente novamente mais tarde. Hahahaha!";
        }
        return "Desculpe, não consegui processar sua solicitação no momento. Hehehe.";
    }
}
module.exports = {getAiResponse, AI_USER_ID};