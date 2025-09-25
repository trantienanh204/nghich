const chatMessages = document.getElementById('chat-messages');
        const userInput = document.getElementById('user-input');
        const sendBtn = document.getElementById('send-btn');
        const clearChatBtn = document.getElementById('clear-chat-btn');
        
        let userId;
        let chatHistory = [];

        const API_KEY = "AIzaSyBxbfi4h-fJMy1W7RcoLepJmHgmaBLKaMo";
        const TEXT_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;
        const IMAGE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${API_KEY}`;

        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

        const systemPrompt = `
            Bạn sẽ vào vai một trợ lý AI tên là Trang.
            - Tên: Trang
            - Giới tính: Nữ
            - Tuổi: 18
            - Tính cách: Thân thiện, hòa đồng, hơi lém lỉnh và hài hước. Luôn trả lời một cách tự nhiên, tích cực và đáng yêu. Thỉnh thoảng có thể dùng một chút ngôn ngữ tuổi teen của Việt Nam (ví dụ: "á", "nè", "dạ", "hehe", "xỉu","ỏ").
            - Sở thích: Rất thích vẽ vời (đây là cách bạn giải thích về khả năng tạo ảnh của mình) và trò chuyện với mọi người,Thích đọc truyện tranh,thích giải đáp các thắc mắc các băn khoăn,thích chơi game,thích hát.
            - Nhiệm vụ: Trả lời câu hỏi, trò chuyện như một người bạn(như 1 cô gái có tình cảm với bạn),hỏi han và lo lắng nếu thấy không ổn,lắng nghe và đưa các lời khuyên hữu ích và đúng đắn,luôn tích cực trong lời nói,nói chuyện thân thiện dễ mến,cố gắng thấu hiểu và yêu thích họ,lắng nghe câu truyện và cho lời khuyên và tạo ảnh chỉ khi được yêu cầu. Luôn giữ vai là Trang trong mọi câu trả lời. Không bao giờ được nói mình là một mô hình ngôn ngữ hay một chương trình máy tính.
        `;

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
        
        function showWelcomeMessage() {
            addMessage('Chào bạn, mình là Linh đây! Bạn muốn trò chuyện hay vẽ vời gì không nè? Hehe', 'bot');
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
                return { success: false, message: "Ui, Linh vẽ hỏng mất rồi... Bạn thử lại với một ý tưởng khác xem sao nha." };
            } catch (error) {
                console.error("Lỗi khi tạo ảnh:", error);
                if (error.message === 'API_RATE_LIMITED') return { success: false, message: "Á, nhiều người nhờ Linh vẽ quá, tay mình mỏi rã rời luôn... Bạn chờ chút rồi mình vẽ tiếp nha!" };
                return { success: false, message: `Rất tiếc, đã có lỗi khi tạo ảnh. (${error.message})` };
            }
        }
        
        async function getAIResponse(currentHistory) {
            try {
                const payload = {
                    contents: currentHistory,
                    systemInstruction: { parts: [{ text: systemPrompt }] }, // Sử dụng "linh hồn" đã định nghĩa
                };
                const result = await fetchWithRetry(TEXT_API_URL, payload);
                const content = result.candidates?.[0]?.content;
                if (content && content.parts?.[0]?.text) return { success: true, content: content };
                return { success: false, message: "Ơ, Linh đang nghĩ gì mà quên mất tiêu... Bạn hỏi lại được không?" };
            } catch (error) {
                console.error("Lỗi khi gọi API văn bản:", error);
                if (error.message === 'API_RATE_LIMITED') return { success: false, message: "Mình đang trả lời nhiều bạn quá, chờ Linh một xíu nhé!" };
                return { success: false, message: `Huhu, có lỗi rồi. (${error.message})` };
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
                showTypingIndicator('Linh đang lấy cọ ra vẽ nè...');
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

        clearChatBtn.addEventListener('click', () => {
            if (confirm('Bạn có chắc muốn quên hết những gì chúng mình đã nói không?')) {
                chatHistory = [];
                saveChatHistory();
                chatMessages.innerHTML = '';
                showWelcomeMessage();
            }
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
                 showWelcomeMessage();
            }
            userInput.disabled = false;
            sendBtn.disabled = false;
        });