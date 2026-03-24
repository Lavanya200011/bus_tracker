import { io } from 'socket.io-client';

// 1. डायनामिक URL: यह लोकल पर localhost और लाइव पर Render का URL उठाएगा
const URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

const socket = io(URL, {
    autoConnect: false, // यूजर के स्टार्ट करने पर ही कनेक्ट होगा
    
    // 2. Render और Vercel के बीच स्टेबल कनेक्शन के लिए ये सेटिंग्स ज़रूरी हैं
    transports: ['websocket'], 
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

export default socket;