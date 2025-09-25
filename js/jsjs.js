const chatMessages = document.getElementById('chat-messages');
        const userInput = document.getElementById('user-input');
        const sendBtn = document.getElementById('send-btn');
        
        let userId;
        let chatHistory = [];

        const API_KEY = "AIzaSyBxbfi4h-fJMy1W7RcoLepJmHgmaBLKaMo";
        const TEXT_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;
        const IMAGE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${API_KEY}`;

        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

        function saveChatHistory() {
            if (userId) localStorage.setItem(`chatHistory_${userId}`, JSON.stringify(chatHistory));
        }

        function loadChatHistory() {
            if (userId) {
                const savedHistory = localStorage.getItem(`chatHistory_${userId}`);
                chatHistory = savedHistory ? JSON.parse(savedHistory) : [];
            }
        }

        function renderChatHistory() {
            chatMessages.innerHTML = '';
            chatHistory.forEach(msg => {
                const sender = msg.role === 'user' ? 'user' : 'bot';
                const textPart = msg.parts.find(p => p.text);
                const imagePart = msg.parts.find(p => p.inlineData);
                let content = '';
                if (textPart) content = textPart.text;
                else if (imagePart) content = `data:image/png;base64,${imagePart.inlineData.data}`;
                if (content) addMessage(content, sender);
            });
        }

        function addMessage(content, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `flex mb-4 ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
            const messageBubble = document.createElement('div');
            messageBubble.className = `max-w-xs lg:max-w-md px-4 py-3 rounded-2xl break-words ${
                sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'
            }`;
            
            if (content.startsWith('data:image/')) {
                 messageBubble.innerHTML = `<img src="${content}" alt="Generated Image" class="message-image">`;
                 messageBubble.classList.remove('px-4', 'py-3');
            } else {
                // NÂNG CẤP: Logic phát hiện URL mới, thông minh hơn
                const urlRegex = /(https?:\/\/)?([\w-]+\.[\w-]{2,63}(?:\.[\w-]+)*(?:\/[^\s]*)?)/gi;
                const formattedContent = content.replace(urlRegex, (url) => {
                    const hasProtocol = /^(https?:\/\/)/.test(url);
                    const href = hasProtocol ? url : `https://${url}`;
                    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:underline">${url}</a>`;
                });
                messageBubble.innerHTML = formattedContent;
            }

            messageDiv.appendChild(messageBubble);
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function showTypingIndicator(text = "") {
            const typingDiv = document.createElement('div');
            typingDiv.id = 'typing-indicator';
            typingDiv.className = 'flex justify-start mb-4';
            typingDiv.innerHTML = `
                <div class="bg-gray-700 px-4 py-3 rounded-2xl rounded-bl-none">
                    ${text ? `<p class="text-sm text-gray-400 mb-1">${text}</p>` : ''}
                    <div class="typing-indicator"><span></span><span></span><span></span></div>
                </div>`;
            chatMessages.appendChild(typingDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function hideTypingIndicator() {
            const indicator = document.getElementById('typing-indicator');
            if (indicator) indicator.remove();
        }
        
        async function fetchWithRetry(url, payload, maxRetries = 3) {
            let lastError;
            for (let i = 0; i < maxRetries; i++) {
                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (response.ok) return await response.json();
                    if (response.status === 429) {
                        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                        console.warn(`Rate limited. Retrying in ${delay.toFixed(0)}ms...`);
                        await sleep(delay);
                        lastError = new Error(`API_RATE_LIMITED`);
                        continue; 
                    }
                    lastError = new Error(`Lỗi API: ${response.status}`);
                    break; 
                } catch (error) { lastError = error; }
            }
            throw lastError;
        }

        async function generateImage(prompt) {
            try {
                const payload = {
                    contents: [{ parts: [{ text: `Một bức ảnh chất lượng cao, siêu thực về: ${prompt}` }] }],
                    generationConfig: { responseModalities: ['IMAGE'] },
                };
                const result = await fetchWithRetry(IMAGE_API_URL, payload);
                const content = result?.candidates?.[0]?.content;
                if (content && content.parts?.find(p => p.inlineData)) return { success: true, content: content };
                return { success: false, message: "Xin lỗi, không thể tạo ảnh. Phản hồi API không chứa dữ liệu hình ảnh." };
            } catch (error) {
                console.error("Lỗi khi tạo ảnh:", error);
                if (error.message === 'API_RATE_LIMITED') return { success: false, message: "Tôi đang nhận được quá nhiều yêu cầu tạo ảnh. Vui lòng thử lại sau vài phút nhé." };
                return { success: false, message: `Rất tiếc, đã có lỗi khi tạo ảnh. (${error.message})` };
            }
        }
        
        async function getAIResponse(currentHistory) {
            try {
                const payload = {
                    contents: currentHistory,
                    systemInstruction: { parts: [{ text: "Bạn là một trợ lý chatbot thân thiện và hữu ích. Hãy trả lời một cách ngắn gọn và tự nhiên." }] },
                };
                const result = await fetchWithRetry(TEXT_API_URL, payload);
                const content = result.candidates?.[0]?.content;
                if (content && content.parts?.[0]?.text) return { success: true, content: content };
                return { success: false, message: "Xin lỗi, tôi không thể tạo ra phản hồi lúc này." };
            } catch (error) {
                console.error("Lỗi khi gọi API văn bản:", error);
                if (error.message === 'API_RATE_LIMITED') return { success: false, message: "Tôi đang nhận được quá nhiều yêu cầu. Vui lòng thử lại sau giây lát." };
                return { success: false, message: `Rất tiếc, đã có lỗi xảy ra. (${error.message})` };
            }
        }

        async function handleUserMessage() {
            const message = userInput.value.trim();
            if (message === '') return;
            addMessage(message, 'user');
            chatHistory.push({ role: "user", parts: [{ text: message }] });
            saveChatHistory();
            userInput.value = '';
            userInput.disabled = true;
            sendBtn.disabled = true;

            const imageKeywords = ['vẽ', 'tạo ảnh', 'generate', 'draw', 'hãy vẽ', 'vẽ cho tôi'];
            const isImageRequest = imageKeywords.some(keyword => message.toLowerCase().startsWith(keyword));

            let result, botResponseForUI;
            if (isImageRequest) {
                const prompt = message.replace(new RegExp(imageKeywords.join('|'), 'i'), '').trim();
                showTypingIndicator('Đang vẽ, chờ chút nhé...');
                result = await generateImage(prompt);
                if(result.success) {
                    const base64Data = result.content.parts.find(p => p.inlineData).inlineData.data;
                    botResponseForUI = `data:image/png;base64,${base64Data}`;
                }
            } else {
                showTypingIndicator();
                result = await getAIResponse([...chatHistory]);
                if(result.success) botResponseForUI = result.content.parts[0].text;
            }
            
            hideTypingIndicator();
            if (result && result.success) {
                chatHistory.push(result.content);
                saveChatHistory();
                addMessage(botResponseForUI, 'bot');
            } else {
                chatHistory.pop();
                saveChatHistory();
                addMessage(result ? result.message : "Đã xảy ra lỗi không xác định.", 'bot');
            }
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();
        }

        sendBtn.addEventListener('click', handleUserMessage);
        userInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') handleUserMessage();
        });

        window.addEventListener('load', () => {
            userId = localStorage.getItem('chatbotUserId');
            if (!userId) {
                userId = crypto.randomUUID();
                localStorage.setItem('chatbotUserId', userId);
            }
            loadChatHistory();
            renderChatHistory();
            if (chatHistory.length === 0) {
                 addMessage('Xin chào! Tôi có thể trò chuyện hoặc vẽ ảnh cho bạn. Bạn muốn bắt đầu với điều gì?', 'bot');
            }
            userInput.disabled = false;
            sendBtn.disabled = false;
        });