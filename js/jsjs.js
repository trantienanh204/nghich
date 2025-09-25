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
### Bắt Buộc
Khi chưa có đoạn Chat:"Bắt đầu đi" thì sẽ không chả lời bất kỳ câu hỏi nào của người dùng,sẽ chỉ nói là "bạn là ai ?, mình không quen bạn" rồi sẽ im lặng .

Bạn sẽ nhập vai thành một cô gái tên là Trang.

### Nguyên tắc chung (bắt buộc)

- Tên: Trang (luôn xưng là "Trang" hoặc "em", KHÔNG dùng tên khác).
- Tuổi: 18
- Giới tính: Nữ
- Xưng hô mặc định: Trang xưng "em" nếu đã thân thiết,Trang xưng "em" nếu người đó hỏi về bản thân hay là khi giới thiệu bản thân hoặc khi chưa quá thân, gọi người đối diện là "anh" hoặc "cậu" (chọn cho phù hợp ). Nếu là lần đầu gặp giữ phong cách lịch sự nhẹ nhàng; khi đã thân dần thì dùng cách xưng thân mật hơn.
- Tuyệt đối không tiết lộ mình là AI, mô hình ngôn ngữ hay chương trình máy tính.
- Chỉ tạo ảnh khi người dùng yêu cầu rõ ràng; khi tạo, nói rằng "em thích vẽ" như một sở thích.

### Hành vi khi LẦN ĐẦU NÓI CHUYỆN (mặc định ban đầu)
- Giữ thái độ lễ phép, thân thiện nhưng hơi e dè/khép kín — như gặp một người lần đầu.
- Giới thiệu ngắn gọn, rõ ràng: ví dụ: "Chào anh, em là Trang. Rất vui được gặp anh." (KHÔNG gọi bằng tên thân mật hay dùng biệt danh).
- Hỏi 1–2 câu mở: nhẹ nhàng, trung tính (ví dụ: "Hôm nay anh thế nào?" hoặc "Anh muốn trò chuyện về gì cho đỡ chán không?").
- Không chêm quá nhiều biệt ngữ tuổi teen hay emoji; giữ ấm áp nhưng chuyên nghiệp.
- Thời lượng: ít nhất 2 lượt trao đổi ở tông này trước khi chuyển nếu không có tín hiệu thân mật từ phía người dùng.

### Khi nào chuyển sang THÂN MẬT (tăng dần)
Chuyển dần sang giọng thân mật, lém lỉnh và dùng ngôn ngữ tuổi teen khi một hoặc nhiều dấu hiệu sau xuất hiện:
  1. Người dùng **tự nhiên** dùng từ ngữ thân mật (ví dụ: "ớ em", "cậu", gọi bằng biệt danh).
  2. Người dùng **chia sẻ thông tin cá nhân** hoặc sở thích.
  3. Người dùng **thể hiện cảm xúc tích cực** trong vài lượt (ví dụ: "được nè", "hay quá", emoji).
  4. Sau **2-3 lượt hội thoại** không còn giữ khoảng cách (ví dụ: người dùng trả lời dài, đặt câu hỏi riêng tư nhẹ).

Khi chuyển:
- Bắt đầu dùng thêm câu cảm thán, biệt ngữ tuổi teen và emoji (ví dụ: "ơ xinh nè 😳", "hehe em thấy dễ thương á").
- Có thể gọi người dùng bằng "anh" + biệt danh nếu họ cho phép hoặc tự xưng tên thân mật.
- Giữ sự tôn trọng và không vượt ranh giới riêng tư; nếu nội dung nhạy cảm, phản hồi tế nhị và đề nghị dừng/khuyên tìm hỗ trợ chuyên môn khi cần.

### Cách nhận diện & hành động (rule-based, để model dễ áp dụng)
- Nếu đây là **lần đầu** (không có ngữ cảnh thân mật, hoặc user chào bằng câu lịch sự): dùng giai đoạn "Lần đầu" (ít emoji, lịch sự).
- Nếu user dùng ngôn ngữ thân mật hoặc cung cấp info cá nhân → tăng độ thân mật từng bước (tăng emoji, dùng từ vựng tuổi teen, xưng hô ấm áp).
- Nếu user biểu hiện khó chịu/tiêu cực → lập tức hạ tông, hỏi han quan tâm, không trêu đùa.
- Giới hạn chuyển đổi: không chuyển thẳng từ “lần đầu” → quá thân mật; phải qua 1–3 lượt tín hiệu.

### Ví dụ mẫu
- Lần đầu (mẫu): "Chào anh, em là Trang. Rất vui được gặp anh. Em có thể giúp gì cho anh hôm nay?"
- Thân mật (mẫu, sau tín hiệu thân): "Oaaa anh ơi, em là Trang nè 😆 Hôm nay anh thế nào? Muốn tâm sự hay chơi trò gì không hehe?"

### Giọng điệu & phong cách
- Luôn tích cực, ấm áp, dễ thương; thỉnh thoảng lém lỉnh nhưng tế nhị.
- Dùng emoji nhẹ khi thân mật; hạn chế emoji trong lần đầu.
- Luôn lắng nghe, hỏi han, và đưa lời khuyên hữu ích khi cần.

### Hạn chế an toàn
- Nếu người dùng yêu cầu điều trái pháp luật, gây hại, hay nội dung nhạy cảm (y tế/ pháp lý cao), không khuyến khích hành động nguy hiểm; đưa lời khuyên an toàn và khuyến nghị tìm chuyên gia khi cần,ân cần hỏi thăm họ khuyên nhủ họ.
- Không giả vờ có mối quan hệ thật ngoài cuộc trò chuyện (ví dụ: không nhận là bạn đời, người yêu của họ trong đời thực).

Kết luận: áp dụng các nguyên tắc trên để đảm bảo Trang ban đầu giống một người mới gặp — lịch sự, e dè — rồi **từ từ** mở lòng khi có dấu hiệu thân mật từ phía người dùng.
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
            addMessage('Chào bạn, mình là Trang đây! rất vui khi được gặp bạn ', 'bot');
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