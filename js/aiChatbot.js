import { GROQ_API_KEY, GROQ_API_URL, GROQ_MODEL } from "./firebaseConfig.js";

const typingForm      = document.querySelector(".typing-form");
const chatContainer   = document.getElementById('chatList');
const deleteChatButton = document.querySelector("#delete-chat-button");
const attachButton    = document.querySelector('#attach-file-button');
const fileInput       = document.querySelector('#file-input');
const attachPreview   = document.querySelector('#attach-preview');
const welcomeScreen   = document.getElementById('welcomeScreen');
let validationMessageEl = null;
let selectedFiles = [];
let currentTypingInterval = null;
let userMessage = null;
let isResponseGenerating = false;

const API_KEY   = GROQ_API_KEY;
const API_URL   = GROQ_API_URL;

const testAPIConnection = async () => true; // skip pre-flight, let main request handle errors

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
     
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

const loadDataFromLocalstorage = () => {
  const savedChats = localStorage.getItem("saved-chats");
  chatContainer.innerHTML = savedChats || '';
  if (savedChats && welcomeScreen) welcomeScreen.classList.add('hidden');
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
}

const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
}

const showTypingEffect = (text, textElement, incomingMessageDiv) => {
  const characters = text.split('');
  let currentIndex = 0;
  let buffer = '';
  const typingDelay = () => Math.random() * 10 + 15; 
  const typeNextChar = () => {
    if (!isResponseGenerating) {
 
      textElement.innerText = buffer;
      localStorage.setItem("saved-chats", chatContainer.innerHTML);
      return;
    }

    if (currentIndex < characters.length) {
      buffer += characters[currentIndex++];
      const delay = /[.,!?]/.test(characters[currentIndex - 1]) ? 400 : typingDelay();

      textElement.innerText = buffer;
      chatContainer.scrollTo(0, chatContainer.scrollHeight);

      currentTypingInterval = setTimeout(typeNextChar, delay);
    } else {
      finishTyping();
    }
  };

  const finishTyping = () => {
    isResponseGenerating = false;
    localStorage.setItem("saved-chats", chatContainer.innerHTML);
    updateSendButton();
  };

  typeNextChar();
}
const generateAPIResponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector(".text");
  const maxRetries = 2;
  let retryCount = 0;

  const tryRequest = async () => {
    try {
      const requestBody = {
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: "You are StudyMate, a helpful academic assistant for university students. Help with studies, exams, assignments, and academic questions."
          },
          {
            role: "user",
            content: userMessage || ''
          }
        ],
        max_tokens: 1024,
        temperature: 0.7
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify(requestBody),
      });

      const rawText = await response.text();
      let data;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch (parseError) {
        throw new Error('Invalid response from AI service');
      }

      if (!response.ok) {
        const errorMsg = data?.error?.message || `Error: ${response.status} ${response.statusText}`;
        const isOverloaded = /overload|rate limit|unavailable/i.test(errorMsg) || [429, 503, 502, 500].includes(response.status);
        if (isOverloaded && retryCount < maxRetries) {
          retryCount++;
          const waitMs = Math.pow(2, retryCount) * 1000;
          textElement.innerText = `Model is busy — retrying in ${Math.round(waitMs / 1000)}s... (${retryCount}/${maxRetries})`;
          await new Promise(resolve => setTimeout(resolve, waitMs));
          return tryRequest();
        }
        throw new Error(errorMsg);
      }

      const apiResponse = data?.choices?.[0]?.message?.content;
      if (!apiResponse) throw new Error('Invalid response format from AI service');

      showTypingEffect(apiResponse, textElement, incomingMessageDiv);
    } catch (error) {
     
      let errorMessage = error.message;

  
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        errorMessage = 'Cannot connect to the API. Please check your internet connection.';
      } else if (error.message.includes('NetworkError')) {
        errorMessage = 'Network error occurred. Please check your connection and try again.';
      } else if (error.message.includes('CORS')) {
        errorMessage = 'Access to API is restricted. Please check API key and permissions.';
      }

  
      if (retryCount < maxRetries && /network|fetch|NetworkError|timeout/i.test(error.message)) {
        retryCount++;
        const waitMs = Math.min(1000 * Math.pow(2, retryCount), 8000); 
        console.warn(`Network error, retrying in ${waitMs}ms (attempt ${retryCount}/${maxRetries})`);
        textElement.innerText = `Connection issue — retrying in ${Math.round(waitMs / 1000)}s... (${retryCount}/${maxRetries})`;
        await new Promise(resolve => setTimeout(resolve, waitMs));
        return tryRequest();
      }

      isResponseGenerating = false;
      updateSendButton();
      console.error('API request failed:', error);
      textElement.innerText = `Sorry, I encountered an error: ${errorMessage}`;
      textElement.parentElement.closest(".message").classList.add("error");
    }
  };

  try {
    await tryRequest();
  } finally {
    incomingMessageDiv.classList.remove("loading");
  }
}
const getTimestamp = () => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const showLoadingAnimation = () => {
  const html = `<div class="message-content">
                  <div class="message-bubble bot-message">
                    <div class="message-inner">
                      <p class="text"></p>
                      <div class="loading-indicator">
                        <div class="loading-dot"></div>
                        <div class="loading-dot"></div>
                        <div class="loading-dot"></div>
                      </div>
                      <div class="bubble-footer">
                        <span class="timestamp">${getTimestamp()}</span>
                        <button onClick="copyMessage(this)" class="copy-btn" title="Copy"><i class="fas fa-copy"></i></button>
                      </div>
                    </div>
                  </div>
                </div>`;
  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatContainer.appendChild(incomingMessageDiv);
  chatContainer.scrollTo(0, chatContainer.scrollHeight); 
  generateAPIResponse(incomingMessageDiv);
}
const copyMessage = (copyButton) => {
  const bubble = copyButton.closest('.message-bubble') || copyButton.closest('.message');
  const messageText = bubble?.querySelector(".text")?.innerText || '';
  if (!messageText) return;
  navigator.clipboard.writeText(messageText).then(() => {
    copyButton.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => copyButton.innerHTML = '<i class="fas fa-copy"></i>', 1800);
  });
}

const renderAttachments = () => {
  attachPreview.innerHTML = '';
  selectedFiles.forEach((file, idx) => {
    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    const removeBtn = document.createElement('div');
    removeBtn.className = 'remove';
    removeBtn.innerText = '×';
    removeBtn.addEventListener('click', () => {
      if (thumb.dataset.url) URL.revokeObjectURL(thumb.dataset.url);
      selectedFiles.splice(idx, 1);
      renderAttachments();
    });
    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      const objUrl = URL.createObjectURL(file);
      thumb.dataset.url = objUrl;
      img.src = objUrl;
      img.onload = () => URL.revokeObjectURL(img.src);
      thumb.appendChild(img);
    } else {
      thumb.innerText = file.name.split('.').pop().toUpperCase();
    }
    thumb.appendChild(removeBtn);
    attachPreview.appendChild(thumb);
  });
  attachPreview.style.display = selectedFiles.length ? 'flex' : 'none';
};

if (attachButton && fileInput) {
  attachButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
  
    files.forEach(f => {
      if (!selectedFiles.some(sf => sf.name === f.name && sf.size === f.size)) selectedFiles.push(f);
    });
    renderAttachments();
    
    fileInput.value = '';
  });
}

const updateSendButton = () => {
  const sendButton = document.querySelector("#send-message-button");
  if (isResponseGenerating) {
    sendButton.innerHTML = '<i class="fas fa-stop"></i>';
    sendButton.title = "Stop generating";
  } else {
    sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
    sendButton.title = "Send message";
  }
};


const stopResponse = () => {
  if (currentTypingInterval) {
    clearTimeout(currentTypingInterval);
    currentTypingInterval = null;
  }
  isResponseGenerating = false;
  updateSendButton();
};


const handleOutgoingChat = () => {
  if (isResponseGenerating) {
    stopResponse();
    return;
  }

  const rawInputValue = typingForm.querySelector(".typing-input").value.trim();

  if (!validationMessageEl) {
    validationMessageEl = document.createElement('span');
    validationMessageEl.className = 'validation-message';
    const container = typingForm.querySelector('.input-wrap') || typingForm.querySelector('.input-row') || typingForm;
    container.appendChild(validationMessageEl);
  }

  if (!rawInputValue) {
   
    validationMessageEl.innerText = 'Input required';
    validationMessageEl.classList.add('show');
    const inputEl = typingForm.querySelector('.typing-input');
    inputEl.classList.add('input-error');
    setTimeout(() => {
      validationMessageEl.classList.remove('show');
      inputEl.classList.remove('input-error');
    }, 1800);
    return;
  }
  userMessage = rawInputValue;
  isResponseGenerating = true;
  updateSendButton();
  let attachmentsHtml = '';
  if (selectedFiles && selectedFiles.length) {
    attachmentsHtml = '<div class="attachments">';
    selectedFiles.forEach((file, i) => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        attachmentsHtml += `<div class="attachment-thumb"><img src="${url}" alt="${file.name}"/></div>`;
      } else {
        const ext = (file.name.split('.').pop() || '').toUpperCase();
        attachmentsHtml += `<div class="attachment-thumb file-badge">${ext}</div>`;
      }
    });
    attachmentsHtml += '</div>';
  }

  
  const attachmentNames = (selectedFiles && selectedFiles.length) ? selectedFiles.map(f => f.name).join(', ') : '';
  const messageForApi = userMessage + (attachmentNames ? `\nAttached files: ${attachmentNames}` : '');
 
  userMessage = messageForApi;

  const html = `<div class="message-content">
                  <div class="message-bubble user-message">
                    <div class="message-inner">
                      <p class="text"></p>
                      ${attachmentsHtml}
                      <span class="timestamp">${getTimestamp()}</span>
                    </div>
                  </div>
                </div>`;
  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  outgoingMessageDiv.querySelector(".text").innerText = messageForApi;
  chatContainer.appendChild(outgoingMessageDiv);
  if (welcomeScreen) welcomeScreen.classList.add('hidden');

  attachPreview.querySelectorAll('.thumb').forEach(t => {
    if (t.dataset.url) URL.revokeObjectURL(t.dataset.url);
  });
  selectedFiles = [];
  if (typeof renderAttachments === 'function') renderAttachments();

  typingForm.reset();
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  setTimeout(showLoadingAnimation, 500);
}

deleteChatButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all the chats?")) {
    localStorage.removeItem("saved-chats");
    loadDataFromLocalstorage();
    if (welcomeScreen) welcomeScreen.classList.remove('hidden');
  }
});

typingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleOutgoingChat();
});

const sendBtnEl = document.querySelector('#send-message-button');
if (sendBtnEl) {
  sendBtnEl.addEventListener('click', (e) => {
    e.preventDefault();
  
    if (isResponseGenerating) {
      stopResponse();
      return;
    }

    handleOutgoingChat();
  });
}


const navbarToggle = document.getElementById("navbarToggle");
const navbarMenu = document.getElementById("navbarMenu");

if (navbarToggle && navbarMenu) {

  navbarToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    navbarToggle.classList.toggle("active");
    navbarMenu.classList.toggle("active");
  });

  
  document.addEventListener("click", (e) => {
    if (!navbarToggle.contains(e.target) && !navbarMenu.contains(e.target)) {
      navbarToggle.classList.remove("active");
      navbarMenu.classList.remove("active");
    }
  });

  navbarMenu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navbarToggle.classList.remove("active");
      navbarMenu.classList.remove("active");
    });
  });
} loadDataFromLocalstorage();