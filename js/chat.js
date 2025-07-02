import { fetchMovieDetailsFromApi, TMDB_IMAGE_BASE_URL_W185 } from './api.js';
import { startChatSession } from './gemini.js';
import { showNotification } from './utils.js';

// DOM Elementleri - Artık global değil, ilgili fonksiyon içinde bulunacaklar
let characterSelectionModal, closeCharacterSelectionModalBtn, characterList, characterListLoader;
let chatInterfaceModal, closeChatInterfaceModalBtn, chatHeaderAvatar, chatHeaderName, chatMessagesContainer, chatForm, chatMessageInput, chatSendBtn;

// Durum Değişkenleri
let currentMovie = { tmdbId: null, title: null };
let currentCharacter = null;
let chatHistory = [];
const CHAT_HISTORY_LIMIT = 10;
let isChatInitialized = false;

// Sadece bir kez çalışarak tüm chat elementlerini bulur ve olayları bağlar.
function initializeChatDOM() {
    if (isChatInitialized) return;

    characterSelectionModal = document.getElementById('character-selection-modal');
    closeCharacterSelectionModalBtn = document.getElementById('close-character-selection-modal-btn');
    characterList = document.getElementById('character-list-container');
    characterListLoader = document.getElementById('character-list-loader');

    chatInterfaceModal = document.getElementById('chat-interface-modal');
    closeChatInterfaceModalBtn = document.getElementById('close-chat-interface-modal-btn');
    chatHeaderAvatar = document.getElementById('chat-header-character-avatar');
    chatHeaderName = document.getElementById('chat-header-character-name');
    chatMessagesContainer = document.getElementById('chat-messages-container');
    chatForm = document.getElementById('chat-form');
    chatMessageInput = document.getElementById('chat-message-input');
    chatSendBtn = document.getElementById('chat-send-btn');

    if (closeCharacterSelectionModalBtn) closeCharacterSelectionModalBtn.addEventListener('click', closeCharacterSelectionModal);
    if (characterSelectionModal) characterSelectionModal.addEventListener('click', (e) => { if (e.target === characterSelectionModal) closeCharacterSelectionModal(); });

    if (closeChatInterfaceModalBtn) closeChatInterfaceModalBtn.addEventListener('click', closeChatInterfaceModal);
    if (chatInterfaceModal) chatInterfaceModal.addEventListener('click', (e) => { if (e.target === chatInterfaceModal) closeChatInterfaceModal(); });
    
    if (chatForm) chatForm.addEventListener('submit', handleSendMessage);

    isChatInitialized = true;
}

function renderCharacterList(characters) {
    characterList.replaceChildren();
    if (!characters || characters.length === 0) {
        const noCharacterMsg = document.createElement('p');
        noCharacterMsg.className = 'text-center text-gray-500';
        noCharacterMsg.textContent = 'Bu film için konuşulacak karakter bulunamadı.';
        characterList.appendChild(noCharacterMsg);
        return;
    }

    characters.forEach(character => {
        const charItem = document.createElement('div');
        charItem.className = 'character-item';
        const avatarImg = document.createElement('img');
        avatarImg.className = 'character-avatar';
        avatarImg.alt = character.name;
        avatarImg.src = character.profile_path ? `${TMDB_IMAGE_BASE_URL_W185}${character.profile_path}` : 'https://placehold.co/60x60/2d333b/8b949e?text=?';
        avatarImg.addEventListener('error', () => { avatarImg.src = 'https://placehold.co/60x60/2d333b/8b949e?text=?'; }, { once: true });
        const infoDiv = document.createElement('div');
        infoDiv.className = 'character-info';
        const nameDiv = document.createElement('div');
        nameDiv.className = 'character-name';
        nameDiv.textContent = character.character || character.name;
        const actorDiv = document.createElement('div');
        actorDiv.className = 'character-actor';
        actorDiv.textContent = character.name;
        infoDiv.append(nameDiv, actorDiv);
        charItem.append(avatarImg, infoDiv);
        charItem.addEventListener('click', () => handleCharacterSelect(character));
        characterList.appendChild(charItem);
    });
}

export function handleOpenCharacterSelection() {
    initializeChatDOM(); // Sohbet elementlerinin var olduğundan emin ol
    const tmdbId = document.getElementById('movie-tmdb-id').value;
    const title = document.getElementById('movie-title-input').value;
    if (!tmdbId) {
        showNotification("Sohbet için filmin TMDB verisi gerekli.", "error");
        return;
    }
    openCharacterSelectionModal({ id: tmdbId, title: title });
}

async function openCharacterSelectionModal(movie) {
    currentMovie = movie;
    characterSelectionModal.classList.remove('hidden');
    setTimeout(() => characterSelectionModal.classList.add('visible'), 10);
    document.body.classList.add('no-scroll');
    characterList.classList.add('hidden');
    characterListLoader.classList.remove('hidden');
    characterListLoader.classList.add('visible');
    const player = characterListLoader.querySelector('dotlottie-player');
    if (player) player.play();

    try {
        const { cast } = await fetchMovieDetailsFromApi(movie.id);
        const characters = cast.filter(c => c.known_for_department === 'Acting' && c.profile_path).sort((a,b) => a.order - b.order).slice(0, 10);
        renderCharacterList(characters);
        characterList.classList.remove('hidden');
    } catch (error) {
        console.error("Karakterler alınırken hata:", error);
        characterList.replaceChildren();
        const errorEl = document.createElement('p');
        errorEl.className = 'text-red-400 text-center';
        errorEl.textContent = 'Karakterler yüklenemedi.';
        characterList.appendChild(errorEl);
        characterList.classList.remove('hidden');
    } finally {
        if (player) player.stop();
        characterListLoader.classList.add('hidden');
        characterListLoader.classList.remove('visible');
    }
}

function closeCharacterSelectionModal() {
    characterSelectionModal.classList.remove('visible');
    if (!chatInterfaceModal.classList.contains('visible')) {
        document.body.classList.remove('no-scroll');
    }
}

function handleCharacterSelect(character) {
    currentCharacter = character;
    closeCharacterSelectionModal();
    openChatInterfaceModal();
}

function openChatInterfaceModal() {
    chatHistory = [];
    chatMessagesContainer.innerHTML = '';
    chatMessageInput.value = '';
    const characterName = currentCharacter.character || currentCharacter.name;
    chatHeaderName.textContent = characterName;
    chatHeaderAvatar.src = currentCharacter.profile_path ? TMDB_IMAGE_BASE_URL_W185 + currentCharacter.profile_path : 'https://placehold.co/60x60/2A2A2A/AAAAAA?text=?';
    chatInterfaceModal.classList.remove('hidden');
    setTimeout(() => chatInterfaceModal.classList.add('visible'), 10);
    document.body.classList.add('no-scroll');
    const welcomeMessage = `Merhaba, ben ${characterName}. Senin için ne yapabilirim?`;
    addMessageToUI('model', welcomeMessage);
}

function closeChatInterfaceModal() {
    chatInterfaceModal.classList.remove('visible');
    if (!characterSelectionModal.classList.contains('visible')) {
        document.body.classList.remove('no-scroll');
    }
    currentCharacter = null;
    currentMovie = { tmdbId: null, title: null };
}

async function handleSendMessage(e) {
    e.preventDefault();
    const userMessage = chatMessageInput.value.trim();
    if (!userMessage) return;
    addMessageToUI('user', userMessage);
    updateChatHistory({ role: 'user', text: userMessage });
    chatMessageInput.value = '';
    const thinkingBubble = addMessageToUI('model', '', true);
    chatSendBtn.disabled = true;

    try {
        const aiResponse = await startChatSession(currentCharacter.character || currentCharacter.name, currentMovie.title, chatHistory, userMessage);
        thinkingBubble.innerHTML = aiResponse;
        thinkingBubble.classList.remove('thinking');
        updateChatHistory({ role: 'model', text: aiResponse });
    } catch (error) {
        thinkingBubble.innerHTML = `Bir hata oluştu: ${error.message}`;
        thinkingBubble.classList.remove('thinking');
    } finally {
        chatSendBtn.disabled = false;
        chatMessageInput.focus();
    }
}

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
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    return bubble;
}

function updateChatHistory(newMessage) {
    chatHistory.push(newMessage);
    if (chatHistory.length > CHAT_HISTORY_LIMIT) {
        chatHistory.splice(0, chatHistory.length - CHAT_HISTORY_LIMIT);
    }
}