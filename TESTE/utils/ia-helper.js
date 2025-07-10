// TESTE/utils/ia-helper.js
const axios = require('axios');

const AI_USER_ID = 1;
// ALTERAÇÃO: A URL foi atualizada para usar o modelo 'gemini-2.0-flash' conforme solicitado.
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

async function getAiResponse(prompt) {
    try {
        const response = await axios.post(API_URL, {
            contents: [{
                parts: [{
                    text: `Você é uma IA chamada EsquizoIA em um chat chamado EsquizoCord. Responda de forma esquizofrênica, porém precisa e termine seu pensamento com uma risada maléfica. Pergunta do usuário: "${prompt}"`
                }]
            }]
        });

        if (response.data && response.data.candidates && response.data.candidates[0].content) {
            return response.data.candidates[0].content.parts[0].text;
        } else {
            console.error("Formato de resposta inesperado da API da IA:", response.data);
            return "Minha mente está confusa, não consigo formular uma resposta agora. Muahahaha!";
        }

    } catch (error) {
        console.error("Erro ao chamar a API da IA:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        
        if (error.response && error.response.status === 503) {
            return "Meus circuitos estão sobrecarregados de pensamentos sombrios! Tente novamente em alguns instantes. Hahahaha!";
        }
        return "Desculpe, não consegui processar sua solicitação no momento. Hehehe.";
    }
}

module.exports = { getAiResponse, AI_USER_ID };
