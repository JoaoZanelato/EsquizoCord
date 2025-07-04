const axios = require('axios')

const AI_USER_ID = 3
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`

async function getAiResponse(prompt) {
    try {
        const response = await axios.post(API_URL, {
            contents: [{
                parts: [{
                    text: `Você é uma IA chamada EsquizoIA em um chat chamado EsquizoCord. Responda de forma útil e concisa. Pergunta do usuário: "${prompt}"`
                }]
            }]
        })
        return response.data.candidates[0].content.parts[0].text
    } catch (error) {
        console.error("Erro ao chamar a API da IA:", error.response ? error.response.data : error.message)
        return "Desculpe, não consegui processar sua solicitação no momento."
    }
}
module.exports = {getAiResponse, AI_USER_ID}