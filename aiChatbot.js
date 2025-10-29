const typingForm = document.querySelector(".typing-form");
const chatContainer = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion");
const deleteChatButton = document.querySelector("#delete-chat-button");
const attachButton = document.querySelector('#attach-file-button');
const fileInput = document.querySelector('#file-input');
const attachPreview = document.querySelector('#attach-preview');
let validationMessageEl = null;
let selectedFiles = []; 
let currentTypingInterval = null;
let userMessage = null;
let isResponseGenerating = false;

const API_KEY = "AIzaSyB5y-Cg4R0iF3qEEJ-VDRn2zhUZORpGYHk"; // <-- change this to your real key
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

const testAPIConnection = async () => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: "Hello" }]
        }]
      })
    });
    if (!response.ok) {
      throw new Error(`API test failed: ${response.status} ${response.statusText}`);
    }
    console.log('API connection successful');
    return true;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
};

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
  const isLightMode = (localStorage.getItem("themeColor") === "light_mode");
 
  document.body.classList.toggle("light_mode", isLightMode);

  chatContainer.innerHTML = savedChats || '';
  document.body.classList.toggle("hide-header", savedChats);
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
      incomingMessageDiv.querySelector(".icon").classList.remove("hide");
      localStorage.setItem("saved-chats", chatContainer.innerHTML);
      return;
    }

    if (currentIndex < characters.length) {
      buffer += characters[currentIndex++];
      const delay = /[.,!?]/.test(characters[currentIndex - 1]) ? 400 : typingDelay();

      textElement.innerText = buffer;
      incomingMessageDiv.querySelector(".icon").classList.add("hide");
      chatContainer.scrollTo(0, chatContainer.scrollHeight);

      currentTypingInterval = setTimeout(typeNextChar, delay);
    } else {
      finishTyping();
    }
  };

  const finishTyping = () => {
    isResponseGenerating = false;
    incomingMessageDiv.querySelector(".icon").classList.remove("hide");
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
 
      const isAPIAccessible = await testAPIConnection();
      if (!isAPIAccessible) {
        throw new Error('Cannot connect to API. Please check your internet connection and API key.');
      }

      const requestBody = {
        contents: [{
          role: "user",
          parts: [{
            text: userMessage || ''
          }]
        }]
      };

      const imageFiles = selectedFiles.filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          try {
            if (file.size > 4 * 1024 * 1024) { 
              throw new Error(`Image ${file.name} is too large. Maximum size is 4MB.`);
            }
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
              throw new Error(`Image ${file.name} format not supported. Use JPEG, PNG, or WEBP.`);
            }
            const base64Data = await fileToBase64(file);
            requestBody.contents[0].parts.push({
              inline_data: {
                mime_type: file.type,
                data: base64Data
              }
            });
          } catch (error) {
            console.error('Failed to process image:', error);
            textElement.innerText = `Error processing image: ${error.message}`;
            return;
          }
        }
      }

      console.log('Sending request:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestBody),
      });

      const rawText = await response.text();
      let data;

      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch (parseError) {
        console.error('Failed to parse API response:', rawText);
        throw new Error('Invalid response from AI service');
      }

      if (!response.ok) {
        const errorMsg = data?.error?.message || `Error: ${response.status} ${response.statusText}`;

        if (errorMsg.includes('model') && errorMsg.includes('not found')) {
          throw new Error('This version of the model does not support image analysis. Text-only queries are supported.');
        }

        const isOverloaded = /overload|overloaded|throttle|rate limit|unavailable/i.test(errorMsg) || [429, 503, 502, 500].includes(response.status);
        if (isOverloaded && retryCount < maxRetries) {
          retryCount++;
          const waitMs = Math.pow(2, retryCount) * 1000; // exponential backoff
          console.warn(`API overloaded, retrying in ${waitMs}ms (attempt ${retryCount}/${maxRetries})`);
          textElement.innerText = `Model is busy — retrying in ${Math.round(waitMs / 1000)}s... (${retryCount}/${maxRetries})`;
          await new Promise(resolve => setTimeout(resolve, waitMs));
          return tryRequest();
        }
        throw new Error(errorMsg);
      }

      if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error('Unexpected API response structure:', data);
        throw new Error('Invalid response format from AI service');
      }

      const apiResponse = data.candidates[0].content.parts[0].text.replace(/\\(.?)\\*/g, '$1');
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
        const waitMs = Math.min(1000 * Math.pow(2, retryCount), 8000); // Exponential backoff with 8s max
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
                      <span class="timestamp">${getTimestamp()}</span>
                    </div>
                  </div>
                  <span onClick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>
                </div>`;
  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatContainer.appendChild(incomingMessageDiv);
  chatContainer.scrollTo(0, chatContainer.scrollHeight); 
  generateAPIResponse(incomingMessageDiv);
}
const copyMessage = (copyButton) => {
  const messageText = copyButton.parentElement.querySelector(".text").innerText;
  navigator.clipboard.writeText(messageText);
  copyButton.innerText = "done"; 
  setTimeout(() => copyButton.innerText = "content_copy", 1000); 
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
    sendButton.innerHTML = "stop";
    sendButton.title = "Stop generating";
  } else {
    sendButton.innerHTML = "send";
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
    typingForm.querySelector('.input-row').appendChild(validationMessageEl);
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

  attachPreview.querySelectorAll('.thumb').forEach(t => {
    if (t.dataset.url) URL.revokeObjectURL(t.dataset.url);
  });
  selectedFiles = [];
  if (typeof renderAttachments === 'function') renderAttachments();

  typingForm.reset(); 
  document.body.classList.add("hide-header");
  chatContainer.scrollTo(0, chatContainer.scrollHeight); 
  setTimeout(showLoadingAnimation, 500); 
}

deleteChatButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all the chats?")) {
    localStorage.removeItem("saved-chats");
    loadDataFromLocalstorage();
  }
});

suggestions.forEach(suggestion => {
  suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerText;
    handleOutgoingChat();
  });
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