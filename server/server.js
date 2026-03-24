const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();

// 1. CORS Middleware: सभी इनकमिंग रिक्वेस्ट के लिए
app.use(cors());

// 2. Health Check Route: ताकि Render को पता चले सर्वर 'Live' है
app.get('/', (req, res) => {
    res.status(200).json({
        status: "active",
        message: "🚀 GovBus Live Tracker Backend is running!",
        timestamp: new Date()
    });
});

const server = http.createServer(app);

// 3. Socket.io CORS: यहाँ अपना Vercel URL ज़रूर डालें
const io = new Server(server, {
    cors: {
        // localhost और अपने Vercel URL दोनों को अनुमति दें
        origin: [
            "http://localhost:3000", 
            "https://your-app-name.vercel.app" // अपना असली Vercel URL यहाँ पेस्ट करें
        ],
        methods: ["GET", "POST"]
    }
});

let activeBuses = {};

const removeBus = (socketId) => {
    let changed = false;
    for (const routeId in activeBuses) {
        if (activeBuses[routeId][socketId]) {
            delete activeBuses[routeId][socketId];
            if (Object.keys(activeBuses[routeId]).length === 0) {
                delete activeBuses[routeId];
            }
            changed = true;
        }
    }
    return changed;
};

io.on('connection', (socket) => {
    console.log('User Connected:', socket.id);
    
    // शुरुआती डेटा भेजें
    socket.emit('initial_bus_list', activeBuses);

    // तत्काल सिंक के लिए रिक्वेस्ट
    socket.on('request_initial_data', () => {
        console.log(`Syncing data for user: ${socket.id}`);
        socket.emit('initial_bus_list', activeBuses);
    });

    socket.on('update_location', (data) => {
        const { routeId, lat, lng } = data;
        if (!activeBuses[routeId]) activeBuses[routeId] = {};

        activeBuses[routeId][socket.id] = { 
            routeId, lat, lng, 
            lastUpdated: Date.now() 
        };
        
        io.emit('bus_moved', data); 
        io.emit('update_bus_list', activeBuses);
    });

    socket.on('manual_disconnect', () => {
        if (removeBus(socket.id)) {
            io.emit('update_bus_list', activeBuses);
        }
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected:', socket.id);
        if (removeBus(socket.id)) {
            io.emit('update_bus_list', activeBuses);
        }
    });
});

// 4. Dynamic Port: Render अपना पोर्ट खुद तय करता है
const PORT = process.env.PORT || 5000; 

// 5. 0.0.0.0 पर सुनना ज़रूरी है ताकि बाहरी नेटवर्क कनेक्ट हो सके
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});