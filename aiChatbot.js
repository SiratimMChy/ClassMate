const typingForm = document.querySelector(".typing-form");
const chatContainer = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion");
const deleteChatButton = document.querySelector("#delete-chat-button");
const attachButton = document.querySelector('#attach-file-button');
const fileInput = document.querySelector('#file-input');
const attachPreview = document.querySelector('#attach-preview');
// Validation message element (created dynamically if not present)
let validationMessageEl = null;
let selectedFiles = []; // Array<File>
let currentTypingInterval = null;
// State variables
let userMessage = null;
let isResponseGenerating = false;
// API configuration
const API_KEY = "AIzaSyB5y-Cg4R0iF3qEEJ-VDRn2zhUZORpGYHk"; // <-- change this to your real key
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

// Check if API is accessible
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

// Convert File to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};
// Load theme and chat data from local storage on page load
const loadDataFromLocalstorage = () => {
  const savedChats = localStorage.getItem("saved-chats");
  const isLightMode = (localStorage.getItem("themeColor") === "light_mode");
  // Apply the stored theme
  document.body.classList.toggle("light_mode", isLightMode);
  // Restore saved chats or clear the chat container
  chatContainer.innerHTML = savedChats || '';
  document.body.classList.toggle("hide-header", savedChats);
  chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to the bottom
}
// Create a new message element and return it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
}
// Show typing effect by displaying words one by one
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
  const characters = text.split('');
  let currentIndex = 0;
  let buffer = '';
  const typingDelay = () => Math.random() * 10 + 15; // Random delay between 2-5ms

  const typeNextChar = () => {
    if (!isResponseGenerating) {
      // Stop was clicked
      textElement.innerText = buffer;
      incomingMessageDiv.querySelector(".icon").classList.remove("hide");
      localStorage.setItem("saved-chats", chatContainer.innerHTML);
      return;
    }

    if (currentIndex < characters.length) {
      buffer += characters[currentIndex++];

      // Natural pauses at punctuation
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
// Fetch response from the API based on user message
const generateAPIResponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector(".text");
  const maxRetries = 2;
  let retryCount = 0;

  const tryRequest = async () => {
    try {
      // Test API connection first
      const isAPIAccessible = await testAPIConnection();
      if (!isAPIAccessible) {
        throw new Error('Cannot connect to API. Please check your internet connection and API key.');
      }

      // Prepare message content
      const requestBody = {
        contents: [{
          role: "user",
          parts: [{
            text: userMessage || ''
          }]
        }]
      };

      // Add image parts if there are any images
      const imageFiles = selectedFiles.filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          try {
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
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

      // Read raw response text first
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

        // Check for specific model-related errors
        if (errorMsg.includes('model') && errorMsg.includes('not found')) {
          throw new Error('This version of the model does not support image analysis. Text-only queries are supported.');
        }

        // detect overloaded / throttled responses and retry with backoff
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
      // Enhanced error handling with specific messages
      let errorMessage = error.message;

      // Check for common error types
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        errorMessage = 'Cannot connect to the API. Please check your internet connection.';
      } else if (error.message.includes('NetworkError')) {
        errorMessage = 'Network error occurred. Please check your connection and try again.';
      } else if (error.message.includes('CORS')) {
        errorMessage = 'Access to API is restricted. Please check API key and permissions.';
      }

      // Retry on transient network errors
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
// Show a loading animation while waiting for the API response
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
  chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to the bottom
  generateAPIResponse(incomingMessageDiv);
}
// Copy message text to the clipboard
const copyMessage = (copyButton) => {
  const messageText = copyButton.parentElement.querySelector(".text").innerText;
  navigator.clipboard.writeText(messageText);
  copyButton.innerText = "done"; // Show confirmation icon
  setTimeout(() => copyButton.innerText = "content_copy", 1000); // Revert icon after 1 second
}

// File attachment helpers
const renderAttachments = () => {
  attachPreview.innerHTML = '';
  selectedFiles.forEach((file, idx) => {
    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    const removeBtn = document.createElement('div');
    removeBtn.className = 'remove';
    removeBtn.innerText = '×';
    removeBtn.addEventListener('click', () => {
      // revoke any object URL associated with this file
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
    // append files (dedupe by name and size)
    files.forEach(f => {
      if (!selectedFiles.some(sf => sf.name === f.name && sf.size === f.size)) selectedFiles.push(f);
    });
    renderAttachments();
    // clear file input to allow re-selecting same file
    fileInput.value = '';
  });
}
// Update send button appearance and functionality
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

// Stop the current response generation
const stopResponse = () => {
  if (currentTypingInterval) {
    clearTimeout(currentTypingInterval);
    currentTypingInterval = null;
  }
  isResponseGenerating = false;
  updateSendButton();
};

// Handle sending outgoing chat messages
const handleOutgoingChat = () => {
  if (isResponseGenerating) {
    stopResponse();
    return;
  }

  const rawInputValue = typingForm.querySelector(".typing-input").value.trim();
  // Create validation message element if it doesn't exist
  if (!validationMessageEl) {
    validationMessageEl = document.createElement('span');
    validationMessageEl.className = 'validation-message';
    typingForm.querySelector('.input-row').appendChild(validationMessageEl);
  }

  // If input is empty, show validation and do not reuse previous message
  if (!rawInputValue) {
    // show validation feedback
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
  // Use the current input as the message (do not fallback to previous userMessage)
  userMessage = rawInputValue;
  isResponseGenerating = true;
  updateSendButton();
  // Build attachments HTML (appear inside the outgoing bubble) and append filenames to message sent to API
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

  // Include attachment filenames in the prompt sent to the API (client-side only)
  const attachmentNames = (selectedFiles && selectedFiles.length) ? selectedFiles.map(f => f.name).join(', ') : '';
  const messageForApi = userMessage + (attachmentNames ? `\nAttached files: ${attachmentNames}` : '');
  // Set global userMessage so generateAPIResponse reads it
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

  // Clear previews and selection after sending
  // Revoke any object URLs used in the preview
  attachPreview.querySelectorAll('.thumb').forEach(t => {
    if (t.dataset.url) URL.revokeObjectURL(t.dataset.url);
  });
  selectedFiles = [];
  if (typeof renderAttachments === 'function') renderAttachments();

  typingForm.reset(); // Clear input field
  document.body.classList.add("hide-header");
  chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to the bottom
  setTimeout(showLoadingAnimation, 500); // Show loading animation after a delay
}
// (theme toggle removed)
// Delete all chats from local storage when button is clicked
deleteChatButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all the chats?")) {
    localStorage.removeItem("saved-chats");
    loadDataFromLocalstorage();
  }
});
// Set userMessage and handle outgoing chat when a suggestion is clicked
suggestions.forEach(suggestion => {
  suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerText;
    handleOutgoingChat();
  });
});
// Prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleOutgoingChat();
});
// Ensure send button toggles stop/send explicitly when clicked
const sendBtnEl = document.querySelector('#send-message-button');
if (sendBtnEl) {
  sendBtnEl.addEventListener('click', (e) => {
    e.preventDefault();
    // If a response is being generated, clicking should stop it
    if (isResponseGenerating) {
      stopResponse();
      return;
    }
    // Otherwise, submit the form
    handleOutgoingChat();
  });
}

// Navbar toggle functionality
const navbarToggle = document.getElementById("navbarToggle");
const navbarMenu = document.getElementById("navbarMenu");

if (navbarToggle && navbarMenu) {
  // Toggle menu when clicking the hamburger icon
  navbarToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    navbarToggle.classList.toggle("active");
    navbarMenu.classList.toggle("active");
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!navbarToggle.contains(e.target) && !navbarMenu.contains(e.target)) {
      navbarToggle.classList.remove("active");
      navbarMenu.classList.remove("active");
    }
  });

  // Close menu when clicking a link
  navbarMenu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navbarToggle.classList.remove("active");
      navbarMenu.classList.remove("active");
    });
  });
} loadDataFromLocalstorage();