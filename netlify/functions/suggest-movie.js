// netlify/functions/suggest-movie.js
const fetch = require('node-fetch');

// Gemini'ye istek atıp film adı ve yılını alan yardımcı fonksiyon
async function getMovieSuggestionFromGemini(prompt, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    const fullPrompt = `Kullanıcının şu isteğine göre bir film öner: "${prompt}". Sadece filmin orijinal adını ve parantez içinde çıkış yılını döndür. Başka hiçbir açıklama, selamlama veya ek metin ekleme. Sadece "Film Adı (Yıl)" formatında olsun. Örneğin: "The Dark Knight (2008)"`;
    
    const payload = { contents: [{ role: "user", parts: [{ text: fullPrompt }] }] };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Gemini API Error:", errorBody);
        throw new Error('Gemini API\'sinden film adı alınamadı.');
    }

    const data = await response.json();
    if (!data.candidates || !data.candidates[0].content.parts[0].text) {
        console.error("Invalid Gemini Response:", data);
        throw new Error('Gemini\'den geçersiz yanıt alındı.');
    }
    return data.candidates[0].content.parts[0].text.trim();
}

// TMDB'de arama yapıp ilk sonucu döndüren yardımcı fonksiyon
async function searchTmdb(query, apiKey) {
    const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=tr-TR&api_key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('TMDB arama API\'sinde hata.');
    const data = await response.json();
    return data.results && data.results.length > 0 ? data.results[0] : null;
}

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Netlify ortam değişkenlerinden API anahtarlarını al
    const { VITE_GEMINI_API_KEY, VITE_TMDB_API_KEY } = process.env;
    if (!VITE_GEMINI_API_KEY || !VITE_TMDB_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: 'API anahtarları sunucuda ayarlanmamış.' }) };
    }

    try {
        const { prompt } = JSON.parse(event.body);
        if (!prompt) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Prompt gerekli.' }) };
        }

        // 1. Gemini'den film adını al
        const movieTitleAndYear = await getMovieSuggestionFromGemini(prompt, VITE_GEMINI_API_KEY);
        const movieTitle = movieTitleAndYear.replace(/\s\(\d{4}\)$/, '').trim();

        // 2. TMDB'de filmi ara
        const searchResult = await searchTmdb(movieTitle, VITE_TMDB_API_KEY);
        if (!searchResult) {
            return { statusCode: 404, body: JSON.stringify({ error: `'${movieTitle}' filmi bulunamadı.` }) };
        }

        // 3. Bulunan filmin detaylarını istemciye döndür
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(searchResult)
        };

    } catch (error) {
        console.error('suggest-movie function error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message || 'Film önerisi işlenirken sunucuda bir hata oluştu.' }) };
    }
};