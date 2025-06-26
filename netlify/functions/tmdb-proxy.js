// netlify/functions/tmdb-proxy.js
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // Netlify ortam değişkeninden TMDB API anahtarını al
    const TMDB_API_KEY = process.env.VITE_TMDB_API_KEY;
    
    // İstemciden gelen isteğin geri kalan yolunu al (örn: /movie/trending)
    const path = event.path.replace('/api/tmdb', '');
    
    // Gelen sorgu parametrelerini al
    const queryParams = new URLSearchParams(event.queryStringParameters);
    
    // Kendi API anahtarımızı her zaman ekle
    queryParams.set('api_key', TMDB_API_KEY);
    
    // Tam ve doğru URL'yi oluştur
    const url = `https://api.themoviedb.org/3${path}?${queryParams.toString()}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        return {
            statusCode: response.status, // TMDB'den gelen status kodunu doğrudan yansıt
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('TMDB Proxy Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch data from TMDB' })
        };
    }
};