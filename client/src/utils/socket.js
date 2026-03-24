import { io } from 'socket.io-client';

// This connects to your Node.js server running on port 5000
const socket = io('http://localhost:5000', {
    autoConnect: false // We only connect when the user starts tracking
});

export default socket;