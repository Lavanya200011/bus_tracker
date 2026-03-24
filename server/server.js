const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
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
    socket.emit('initial_bus_list', activeBuses);

    // ✅ New: तत्काल सिंक के लिए रिक्वेस्ट
    // server.js के अंदर io.on('connection', (socket) => { ... }) के भीतर
socket.on('request_initial_data', () => {
    console.log(`Syncing data for user: ${socket.id}`);
    socket.emit('initial_bus_list', activeBuses); // वर्तमान डेटा तुरंत भेजें
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
        if (removeBus(socket.id)) {
            io.emit('update_bus_list', activeBuses);
        }
    });
});

server.listen(5000, () => console.log('🚀 Server running on port 5000'));