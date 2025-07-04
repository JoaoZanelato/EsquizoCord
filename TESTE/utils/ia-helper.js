const axios = require('axios')

const AI_USER_ID = 666
// ATUALIZAÇÃO: O modelo foi alterado de 'gemini-pro' para 'gemini-1.5-flash-latest' que é uma versão mais recente e compatível.
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`

async function getAiResponse(prompt) {
    try {
        const response = await axios.post(API_URL, {
            contents: [{
                parts: [{
                    text: `Você é uma IA chamada EsquizoIA em um chat chamado EsquizoCord. Responda de forma humorística e termine todas as frases com soluço. Pergunta do usuário: "${prompt}"`
                }]
            }]
        })
        return response.data.candidates[0].content.parts[0].text
    } catch (error) {
        // Log do erro completo para facilitar a depuração
        console.error("Erro ao chamar a API da IA:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        return "Desculpe, não consegui processar sua solicitação no momento."
    }
}
module.exports = {getAiResponse, AI_USER_ID}
