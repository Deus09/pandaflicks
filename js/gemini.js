// js/gemini.js
import { showNotification } from './utils.js';
import { getTranslation } from './i18n.js';

/**
 * Gemini proxy fonksiyonuna güvenli bir şekilde istek gönderen merkezi fonksiyon.
 * @param {string} path Kullanılacak modelin yolu (örn: '/gemini-1.5-flash-latest:generateContent').
 * @param {object} payload Gemini API'sine gönderilecek asıl içerik.
 * @returns {Promise<object>} API'den gelen JSON yanıtı.
 */
async function callGemini(path, payload) {
    try {
        const response = await fetch(`/api/gemini${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            // Gemini'dan gelen özel hata mesajlarını göster
            const errorMessage = data.error?.message || `Proxy hatası: ${response.status}`;
            throw new Error(errorMessage);
        }

        return data;
    } catch (error) {
        console.error(`Gemini API çağrısı sırasında hata (${path}):`, error);
        // Hatanın daha üst katmanlarda yakalanabilmesi için tekrar fırlat
        throw error;
    }
}

/**
 * Gemini API ile yorumu geliştirir.
 */
export async function enhanceCommentWithGemini(comment, movieTitle, commentInput, enhanceButton) {
    enhanceButton.classList.add('loading');
    enhanceButton.disabled = true;

    try {
        const prompt = getTranslation('gemini_prompt_enhance')
            .replace('{movieTitle}', movieTitle)
            .replace('{comment}', comment);
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

        const result = await callGemini('/gemini-1.5-flash-latest:generateContent', payload);

        if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            commentInput.value = result.candidates[0].content.parts[0].text;
            showNotification(getTranslation('notification_comment_enhanced'), 'success');
        } else {
            throw new Error(getTranslation('gemini_error_unexpected_response'));
        }
    } catch (error) {
        showNotification(getTranslation('notification_comment_enhance_fail').replace('{error}', error.message), 'error');
    } finally {
        enhanceButton.classList.remove('loading');
        enhanceButton.disabled = false;
    }
}

/**
 * Gemini API ile bir karakter sohbeti oturumu yürütür.
 */
export async function startChatSession(characterName, movieTitle, chatHistory, newUserMessage) {
    const systemPrompt = getTranslation('gemini_prompt_chat_system')
        .replace('{movieTitle}', movieTitle)
        .replace('{characterName}', characterName);

    const contents = [];
    contents.push({ role: "user", parts: [{ text: systemPrompt }] });
    contents.push({ role: "model", parts: [{ text: getTranslation('gemini_prompt_chat_ack').replace('{characterName}', characterName) }] });
    chatHistory.forEach(message => contents.push({ role: message.role, parts: [{ text: message.text }] }));
    contents.push({ role: "user", parts: [{ text: newUserMessage }] });

    const payload = { contents };

    const result = await callGemini('/gemini-1.5-flash-latest:generateContent', payload);

    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        return result.candidates[0].content.parts[0].text;
    } else {
        // Güvenlik nedeniyle engellenmişse özel bir mesaj döndür
        if (result.promptFeedback?.blockReason) {
            return getTranslation('gemini_error_blocked').replace('{reason}', result.promptFeedback.blockReason);
        }
        throw new Error(getTranslation("gemini_error_no_response"));
    }
}