// netlify/functions/gemini-proxy.js
const fetch = require('node-fetch');

exports.handler = async function(event) {
    // Sadece POST isteklerini kabul et
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Gemini API anahtarı sunucuda ayarlanmamış.' }) };
    }

    // 1. Gelen isteğin yolundan model adını al (örn: /gemini-1.5-flash-latest:generateContent)
    const path = event.path.replace('/api/gemini', '');

    // 2. Google Gemini API'sinin tam URL'ini oluştur
    const url = `https://generativelanguage.googleapis.com/v1beta/models${path}?key=${GEMINI_API_KEY}`;

    try {
        // 3. İstemciden gelen isteğin gövdesini (body) olduğu gibi Google API'sine ilet
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: event.body 
        });

        const data = await response.json();

        // 4. Google API'sinden gelen yanıtı olduğu gibi istemciye geri döndür
        return {
            statusCode: response.status,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('Gemini Proxy Hatası:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Gemini API\'sine veri gönderilirken bir hata oluştu.' })
        };
    }
};