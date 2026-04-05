import { io } from 'socket.io-client';

// एनवायरनमेंट के अनुसार URL सेट करें
const URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

const socket = io(URL, {
    autoConnect: false, 
    transports: ['websocket'], 
    
    // 🛠️ Improved Reconnection Logic
    reconnection: true,                 // ऑटोमैटिक रीकनेक्ट चालू रखें
    reconnectionAttempts: Infinity,      // हार न मानें, कनेक्ट करने की कोशिश करते रहें 
    reconnectionDelay: 1000,            // पहली कोशिश 1 सेकंड बाद
    reconnectionDelayMax: 5000,         // कोशिशों के बीच अधिकतम 5 सेकंड का गैप (ताकि बैटरी न खत्म हो)
    randomizationFactor: 0.5,           // नेटवर्क लोड कम करने के लिए रैंडम डिले
    
    timeout: 20000,                     // 20 सेकंड तक रिस्पॉन्स न मिलने पर टाइमआउट
    ackTimeout: 10000,
});

// 📡 Connection Monitoring (Vibe Check)
if (typeof window !== 'undefined') {
    socket.on('connect', () => {
        console.log("✅ Vibe Connected: Online");
    });

    socket.on('disconnect', (reason) => {
        console.log("❌ Vibe Disconnected:", reason);
        if (reason === "io server disconnect") {
            // अगर सर्वर ने फोर्सफुली हटाया है, तो मैन्युअली रीकनेक्ट करें
            socket.connect();
        }
    });

    socket.on('reconnect_attempt', () => {
        console.log("🔄 Reconnecting... Searching for Signal");
    });

    socket.on('reconnect_error', (error) => {
        console.error("⚠️ Reconnection Error:", error);
    });
}

export default socket;