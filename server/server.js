const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
    res.status(200).json({
        status: "active",
        message: "🚀 GovBus Live Tracker Backend is running!",
        timestamp: new Date()
    });
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "https://yatra-live-track.vercel.app"], // आपका डोमेन [cite: 42]
        methods: ["GET", "POST"]
    }
});

let activeBuses = {};
// एक्सपायरी टाइमर्स को ट्रैक करने के लिए एक ऑब्जेक्ट
let expiryTimers = {}; 

const removeBus = (socketId) => {
    let changed = false;
    // अगर इस सॉकेट का कोई एक्टिव टाइमर है, तो उसे क्लियर करें
    if (expiryTimers[socketId]) {
        clearTimeout(expiryTimers[socketId]);
        delete expiryTimers[socketId];
    }

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
    socket.emit('initial_bus_list', activeBuses);

    socket.on('request_initial_data', () => {
        socket.emit('initial_bus_list', activeBuses);
    });

    socket.on('update_location', (data) => {
        const { routeId, lat, lng, duration, expiresAt } = data;
        
        if (!activeBuses[routeId]) activeBuses[routeId] = {};

        activeBuses[routeId][socket.id] = { 
            routeId, lat, lng, 
            duration, expiresAt, // नया मेटाडेटा
            lastUpdated: Date.now() 
        };

        // 🕒 Auto-Expiry Logic (WhatsApp Style)
        if (duration && !expiryTimers[socket.id]) {
            console.log(`Setting expiry for ${routeId}: ${duration} mins`);
            
            expiryTimers[socket.id] = setTimeout(() => {
                console.log(`⏳ Duration expired for Route: ${routeId}`);
                if (removeBus(socket.id)) {
                    io.emit('update_bus_list', activeBuses); // तुरंत सबको अपडेट भेजें
                }
            }, duration * 60 * 1000);
        }
        
        io.emit('bus_moved', data); 
        io.emit('update_bus_list', activeBuses);
    });

    socket.on('manual_disconnect', () => {
        if (removeBus(socket.id)) {
            io.emit('update_bus_list', activeBuses);
        }
    });

    socket.on('disconnect', () => {
        if (removeBus(socket.id)) {
            io.emit('update_bus_list', activeBuses);
        }
    });
});

const PORT = process.env.PORT || 5000; 
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});