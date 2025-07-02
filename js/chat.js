// js/chat.js
import { fetchMovieDetailsFromApi, TMDB_IMAGE_BASE_URL_W185 } from './api.js';
import { startChatSession } from './gemini.js';
import { showNotification } from './utils.js';

// DOM Elementleri
let chatWithCharacterButton;
let characterSelectionModal, closeCharacterSelectionModalBtn, characterListContainer, characterListLoader;
let chatInterfaceModal, closeChatInterfaceModalBtn, chatHeaderAvatar, chatHeaderName, chatMessagesContainer, chatForm, chatMessageInput, chatSendBtn;

// Durum Değişkenleri (State)
let currentMovie = {
    tmdbId: null,
    title: null,
};
let currentCharacter = null;
let chatHistory = []; // { role: 'user' | 'model', text: '...' }
const CHAT_HISTORY_LIMIT = 10; // Son 10 mesajı tut (5 soru-cevap)

/**
 * Sohbet özelliğini ve olay dinleyicilerini başlatır.
 */
export function initChat() {
    // Ana modal üzerindeki buton
    
    // Karakter seçim modalı
    characterSelectionModal = document.getElementById('character-selection-modal');
    closeCharacterSelectionModalBtn = document.getElementById('close-character-selection-modal-btn');
    characterListContainer = document.getElementById('character-list-container');
    characterListLoader = document.getElementById('character-list-loader');

    // Sohbet arayüzü modalı
    chatInterfaceModal = document.getElementById('chat-interface-modal');
    closeChatInterfaceModalBtn = document.getElementById('close-chat-interface-modal-btn');
    chatHeaderAvatar = document.getElementById('chat-header-character-avatar');
    chatHeaderName = document.getElementById('chat-header-character-name');
    chatMessagesContainer = document.getElementById('chat-messages-container');
    chatForm = document.getElementById('chat-form');
    chatMessageInput = document.getElementById('chat-message-input');
    chatSendBtn = document.getElementById('chat-send-btn');

    // Olay Dinleyicileri

    if (closeCharacterSelectionModalBtn) {
        closeCharacterSelectionModalBtn.addEventListener('click', () => closeCharacterSelectionModal());
    }
    if(characterSelectionModal) {
        characterSelectionModal.addEventListener('click', (e) => {
            if (e.target === characterSelectionModal) closeCharacterSelectionModal();
        });
    }

    if (closeChatInterfaceModalBtn) {
        closeChatInterfaceModalBtn.addEventListener('click', () => closeChatInterfaceModal());
    }
    if (chatInterfaceModal) {
        chatInterfaceModal.addEventListener('click', (e) => {
            if (e.target === chatInterfaceModal) closeChatInterfaceModal();
        });
    }
    
    if (chatForm) {
        chatForm.addEventListener('submit', handleSendMessage);
    }
}

/**
 * Karakter listesini DOM'a güvenli bir şekilde çizer.
 * @param {Array<object>} characters - Gösterilecek karakterlerin dizisi.
 */
function renderCharacterList(characters) {
    characterList.replaceChildren(); // Önceki listeyi ve olay dinleyicilerini güvenli bir şekilde temizle

    if (!characters || characters.length === 0) {
        const noCharacterMsg = document.createElement('p');
        noCharacterMsg.className = 'text-center text-gray-500';
        noCharacterMsg.textContent = 'Bu film için konuşulacak karakter bulunamadı.';
        characterList.appendChild(noCharacterMsg);
        return;
    }

    characters.forEach(character => {
        // Elementleri programatik olarak oluşturarak XSS zafiyetini önle
        const charItem = document.createElement('div');
        charItem.className = 'character-item';

        const avatarImg = document.createElement('img');
        avatarImg.className = 'character-avatar';
        avatarImg.alt = character.name;
        avatarImg.src = character.profile_path
            ? `${TMDB_IMAGE_BASE_URL_W185}${character.profile_path}`
            : 'https://placehold.co/60x60/2d333b/8b949e?text=?';

        // Güvenli hata yönetimi
        avatarImg.addEventListener('error', () => {
            avatarImg.src = 'https://placehold.co/60x60/2d333b/8b949e?text=?';
        }, { once: true });

        const infoDiv = document.createElement('div');
        infoDiv.className = 'character-info';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'character-name';
        nameDiv.textContent = character.character || character.name; // .textContent ile güvenli atama

        const actorDiv = document.createElement('div');
        actorDiv.className = 'character-actor';
        actorDiv.textContent = character.name; // .textContent ile güvenli atama

        infoDiv.append(nameDiv, actorDiv);
        charItem.append(avatarImg, infoDiv);

        // Olay dinleyicisini ekle
        charItem.addEventListener('click', () => handleCharacterSelect(character));
        
        characterList.appendChild(charItem);
    });
}



/**
 * Karakter seçim modalını açmak için olay yöneticisi.
 */
export function handleOpenCharacterSelection() {
    const tmdbId = document.getElementById('movie-tmdb-id').value;
    const title = document.getElementById('movie-title-input').value;

    if (!tmdbId) {
        showNotification("Sohbet için filmin TMDB verisi gerekli.", "error");
        return;
    }
    
    // DÜZELTME: Fonksiyonu çağırırken gerekli film bilgisini bir nesne olarak iletiyoruz.
    openCharacterSelectionModal({ id: tmdbId, title: title });
}

async function openCharacterSelectionModal(movie) {
    // DÜZELTME: 'currentMovieForChat' yerine, modülün başında tanımlanan 'currentMovie' kullanılıyor.
    currentMovie = movie;

    characterSelectionModal.classList.remove('hidden');
    setTimeout(() => characterSelectionModal.classList.add('visible'), 10);
    document.body.classList.add('no-scroll');

    characterList.classList.add('hidden');
    
    // Animasyonu göster ve OYNAT
    characterListLoader.classList.remove('hidden');
    characterListLoader.classList.add('visible');
    const player = characterListLoader.querySelector('dotlottie-player');
    if (player) {
        player.play();
    }

    try {
        // DÜZELTME: Karakterleri, parametre olarak gelen 'movie.id' ile çekiyoruz.
        const { cast } = await fetchMovieDetailsFromApi(movie.id);
        const characters = cast
            .filter(member => member.known_for_department === 'Acting' && member.profile_path)
            .sort((a, b) => a.order - b.order)
            .slice(0, 10);

        renderCharacterList(characters);
        characterList.classList.remove('hidden');

    } catch (error) {
        console.error("Karakterler alınırken hata:", error);
        characterList.innerHTML = ''; // Önce temizle
        const errorEl = document.createElement('p');
        errorEl.className = 'text-red-400 text-center';
        errorEl.textContent = 'Karakterler yüklenemedi.';
        characterList.appendChild(errorEl);
        characterList.classList.remove('hidden');
    } finally {
        // Animasyonu gizle ve DURDUR
        characterListLoader.classList.add('hidden');
        characterListLoader.classList.remove('visible');
        if (player) {
            player.stop();
        }
    }
}

/**
 * Karakter seçimi modalını gizler.
 */
function closeCharacterSelectionModal() {
    characterSelectionModal.classList.remove('visible');
    if (!chatInterfaceModal.classList.contains('visible')) {
        document.body.classList.remove('no-scroll');
    }
}

/**
 * API'den karakterleri yükler ve ekranda listeler.
 * @param {string} tmdbId - Filmin TMDB ID'si.
 */
async function loadAndRenderCharacters(tmdbId) {
    try {
        const { cast } = await fetchMovieDetailsFromApi(tmdbId);
        characterListLoader.style.display = 'none';

        if (!cast || cast.length === 0) {
            characterListContainer.innerHTML = '<p class="text-center text-gray-500">Bu film için karakter bilgisi bulunamadı.</p>';
            return;
        }

        cast.forEach(character => {
            const charItem = document.createElement('div');
            charItem.className = 'character-item';
            charItem.innerHTML = `
                <img src="${character.profile_path ? TMDB_IMAGE_BASE_URL_W185 + character.profile_path : 'https://placehold.co/60x60/2A2A2A/AAAAAA?text=?'}" alt="${character.name}" class="character-avatar">
                <div class="character-info">
                    <div class="character-name">${character.character || character.name}</div>
                    <div class="character-actor">${character.name}</div>
                </div>
            `;
            charItem.addEventListener('click', () => handleCharacterSelect(character));
            characterListContainer.appendChild(charItem);
        });

    } catch (error) {
        console.error("Karakterler yüklenirken hata oluştu:", error);
        characterListLoader.style.display = 'none';
        characterListContainer.innerHTML = '<p class="text-center text-red-400">Karakterler yüklenemedi. Lütfen tekrar deneyin.</p>';
    }
}

/**
 * Bir karakter seçildiğinde sohbet arayüzünü başlatır.
 * @param {object} character - Seçilen karakter nesnesi.
 */
function handleCharacterSelect(character) {
    currentCharacter = character;
    closeCharacterSelectionModal();
    openChatInterfaceModal();
}

/**
 * Sohbet arayüzü modalını açar ve hazırlar.
 */
function openChatInterfaceModal() {
    chatHistory = [];
    chatMessagesContainer.innerHTML = '';
    chatMessageInput.value = '';
    
    const characterName = currentCharacter.character || currentCharacter.name;
    chatHeaderName.textContent = characterName;
    chatHeaderAvatar.src = currentCharacter.profile_path ? TMDB_IMAGE_BASE_URL_W185 + currentCharacter.profile_path : 'https://placehold.co/60x60/2A2A2A/AAAAAA?text=?';

    chatInterfaceModal.classList.add('visible');
    document.body.classList.add('no-scroll');

    // İlk AI mesajını ekle
    const welcomeMessage = `Merhaba, ben ${characterName}. Senin için ne yapabilirim?`;
    addMessageToUI('model', welcomeMessage);
}

/**
 * Sohbet arayüzü modalını gizler.
 */
function closeChatInterfaceModal() {
    chatInterfaceModal.classList.remove('visible');
    if (!characterSelectionModal.classList.contains('visible')) {
        document.body.classList.remove('no-scroll');
    }
    currentCharacter = null;
    currentMovie = { tmdbId: null, title: null };
}

/**
 * Kullanıcı mesaj gönderdiğinde tetiklenir.
 * @param {Event} e - Form submit olayı.
 */
async function handleSendMessage(e) {
    e.preventDefault();
    const userMessage = chatMessageInput.value.trim();
    if (!userMessage) return;

    // Kullanıcı mesajını UI'a ve geçmişe ekle
    addMessageToUI('user', userMessage);
    updateChatHistory({ role: 'user', text: userMessage });
    chatMessageInput.value = '';

    // AI düşünme animasyonunu göster
    const thinkingBubble = addMessageToUI('model', '', true);
    chatSendBtn.disabled = true;

    try {
        const aiResponse = await startChatSession(
            currentCharacter.character || currentCharacter.name,
            currentMovie.title,
            chatHistory,
            userMessage // FIXED: Added the missing userMessage argument
        );
        
        // Düşünme animasyonunu gerçek cevapla değiştir
        thinkingBubble.innerHTML = aiResponse;
        thinkingBubble.classList.remove('thinking');
        
        // AI cevabını geçmişe ekle
        updateChatHistory({ role: 'model', text: aiResponse });

    } catch (error) {
        thinkingBubble.innerHTML = `Bir hata oluştu: ${error.message}`;
        thinkingBubble.classList.remove('thinking');
    } finally {
        chatSendBtn.disabled = false;
        chatMessageInput.focus();
    }
}

/**
 * Bir mesajı sohbet arayüzüne ekler.
 * @param {'user' | 'model'} role - Mesajı gönderen (kullanıcı veya yapay zeka).
 * @param {string} text - Mesajın içeriği.
 * @param {boolean} isThinking - Mesajın "düşünüyor" balonu olup olmadığı.
 * @returns {HTMLElement} Oluşturulan mesaj balonu elementi.
 */
function addMessageToUI(role, text, isThinking = false) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `chat-message ${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    if (isThinking) {
        bubble.classList.add('thinking');
        bubble.innerHTML = `<span></span><span></span><span></span>`;
    } else {
        bubble.textContent = text;
    }
    
    messageWrapper.appendChild(bubble);
    chatMessagesContainer.appendChild(messageWrapper);
    
    // Konuşma alanını en alta kaydır
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

    return bubble;
}

/**
 * Sohbet geçmişini günceller ve limiti uygular.
 * @param {object} newMessage - Eklenen yeni mesaj.
 */
function updateChatHistory(newMessage) {
    chatHistory.push(newMessage);
    if (chatHistory.length > CHAT_HISTORY_LIMIT) {
        chatHistory.splice(0, chatHistory.length - CHAT_HISTORY_LIMIT);
    }
}