import { useState, useEffect, useRef } from 'react';
import { Play, Square, Search, Home, Clock } from 'lucide-react';
import Link from 'next/link';
import socket from '../utils/socket'; 
import { BUS_ROUTES } from '../utils/routes';

export default function ShareLocation() {
  const [isTracking, setIsTracking] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [duration, setDuration] = useState(30); // Default 30 minutes
  const watchId = useRef(null);

  useEffect(() => {
    const savedRouteId = localStorage.getItem('active_route_id');
    const wasTracking = localStorage.getItem('is_tracking') === 'true';
    const expiryTime = localStorage.getItem('active_expiry');

    // ऑटो-एक्सपायरी चेक
    if (wasTracking && expiryTime && Date.now() > parseInt(expiryTime)) {
      stopTracking();
      return;
    }

    if (wasTracking && savedRouteId) {
      setSelectedRouteId(savedRouteId);
      setIsTracking(true);
      if (watchId.current === null) {
        startTracking(savedRouteId, expiryTime);
      }
    }

    // बैकग्राउंड में एक्सपायरी चेक करने के लिए इंटरवल
    const interval = setInterval(() => {
      const currentExpiry = localStorage.getItem('active_expiry');
      if (isTracking && currentExpiry && Date.now() > parseInt(currentExpiry)) {
        stopTracking();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isTracking]);

  const toggleTracking = () => {
    if (!isTracking) {
      if (!selectedRouteId) {
        alert("Please select a route first!");
        return;
      }
      const expiry = Date.now() + duration * 60 * 1000;
      localStorage.setItem('active_expiry', expiry);
      startTracking(selectedRouteId, expiry);
    } else {
      stopTracking();
    }
  };

  const startTracking = (routeId, expiryTime) => {
    socket.connect();
    if ("geolocation" in navigator) {
      setIsTracking(true);
      localStorage.setItem('is_tracking', 'true');
      localStorage.setItem('active_route_id', routeId);
      
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const data = {
            routeId: routeId,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            duration: duration,
            expiresAt: expiryTime || localStorage.getItem('active_expiry'),
            timestamp: Date.now()
          };
          socket.emit('update_location', data);
        },
        (error) => {
          console.error("GPS Error:", error);
          stopTracking();
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    }
  };

  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    socket.emit('manual_disconnect');
    socket.disconnect();
    localStorage.removeItem('is_tracking');
    localStorage.removeItem('active_route_id');
    localStorage.removeItem('active_expiry');
    setIsTracking(false);
  };

  return (
    <div className="p-6 max-w-lg mx-auto font-sans relative min-h-screen bg-gray-50">
      {/* 🏠 Home & Search Navigation */}
      <div className="flex justify-between items-center mb-8 pt-4">
        <Link href="/">
          <button className="bg-white p-3 rounded-2xl shadow-sm border border-2 border-transparent text-stone-500 hover:border-stone-400 transition-all active:scale-90 flex items-center">
            <Home size={20} />
            <span className="ml-2 font-bold text-[10px] uppercase hidden sm:block">Home</span>
          </button>
        </Link>
        <div className="text-center">
          <h2 className="text-2xl font-black text-stone-400 italic tracking-tighter">SHARE JOURNEY</h2>
        </div>
        <Link href="/search">
          <button className="p-3 bg-white text-stone-500 rounded-2xl border-2 border-transparent shadow-sm hover:border-stone-400 transition-all active:scale-90">
            <Search size={20} />
          </button>
        </Link>
      </div>

      {/* 🚌 Route Selection */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-blue-900/5 mb-6 border border-gray-50">
        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1 mb-2 block">
          Select Official Route
        </label>
        <select 
          className="w-full p-4 border-2 border-gray-50 rounded-2xl bg-gray-50 outline-none focus:border-blue-500 transition-all text-gray-700 font-bold disabled:opacity-50"
          onChange={(e) => setSelectedRouteId(e.target.value)}
          disabled={isTracking}
          value={selectedRouteId}
        >
          <option value="">-- Choose Route --</option>
          {BUS_ROUTES.map(r => (
            <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
          ))}
        </select>

        {/* 🕒 Time Limit Selector (WhatsApp Style) */}
        {!isTracking && (
          <div className="mt-6">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1 mb-3 block">
              Sharing Duration
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[30, 60, 480].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setDuration(mins)}
                  className={`py-3 rounded-xl font-bold text-[10px] uppercase transition-all border-2 ${
                    duration === mins 
                    ? 'bg-mist-300 border-2 border-transparent hover:border-slate-600 text-stone-600 shadow-xl' 
                    : 'bg-white border-gray-100 text-stone-400'
                  }`}
                >
                  {mins === 480 ? '8 Hours' : mins >= 60 ? `${mins/60} Hour` : `${mins} Mins`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 📡 Broadcast Card */}
      <div className={`p-10 rounded-[3rem] text-center transition-all duration-500 border-4 shadow-2xl ${
        isTracking ? 'bg-red-600 border-red-400 text-white' : 'bg-white border-blue-50'
      }`}>
        <div className="mb-6 flex justify-center">
            <div className={`p-5 rounded-full shadow-inner ${isTracking ? 'bg-red-500 animate-pulse' : 'bg-gray-100'}`}>
                {isTracking ? <Square className="text-white" size={28} fill="white"/> : <Play className="text-slate-400 ml-1" size={28} fill="currentColor"/>}
            </div>
        </div>

        <p className={`mb-6 font-black tracking-[0.2em] text-xs uppercase ${isTracking ? 'text-red-100' : 'text-stone-400'}`}>
          {isTracking ? "Broadcasting Live" : "Ready to Start"}
        </p>
        
        <button 
          onClick={toggleTracking}
          className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 text-sm ${
            isTracking 
            ? 'bg-white text-red-600 shadow-xl' 
            : 'bg-mist-400 text-white shadow-blue-200 shadow-xl'
          }`}
        >
          {isTracking ? "Stop Sharing" : "I'm on the Bus"}
        </button>
      </div>

      <p className="mt-8 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
        {isTracking 
          ? "Tracking will automatically stop when time expires." 
          : "Your location helps other commuters."}
      </p>
    </div>
  );
}