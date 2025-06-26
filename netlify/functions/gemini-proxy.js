// netlify/functions/gemini-proxy.js
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Netlify ortam değişkeninden Gemini API anahtarını al
    const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
    
    const { model, payload } = JSON.parse(event.body);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${GEMINI_API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();

        return {
            statusCode: response.status,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('Gemini Proxy Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch data from Gemini API' })
        };
    }
};