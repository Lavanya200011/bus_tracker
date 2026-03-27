import { useState, useEffect, useRef } from 'react';
import { Play, Square, Search, Home } from 'lucide-react'; // Search आइकन इम्पोर्ट किया
import Link from 'next/link'; // Link इम्पोर्ट किया
import socket from '../utils/socket'; 
import { BUS_ROUTES } from '../utils/routes';

export default function ShareLocation() {
  const [isTracking, setIsTracking] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const watchId = useRef(null);

  useEffect(() => {
    const savedRouteId = localStorage.getItem('active_route_id');
    const wasTracking = localStorage.getItem('is_tracking') === 'true';

    if (wasTracking && savedRouteId) {
      setSelectedRouteId(savedRouteId);
      setIsTracking(true);
      if (watchId.current === null) {
        startTracking(savedRouteId);
      }
    }
  }, []);

  const toggleTracking = () => {
    if (!isTracking) {
      if (!selectedRouteId) {
        alert("Please select a route from the list first!");
        return;
      }
      startTracking(selectedRouteId);
    } else {
      stopTracking();
    }
  };

  const startTracking = (routeId) => {
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
          };
          socket.emit('update_location', data);
          console.log("📍 Broadcasting Route:", data.routeId);
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
    setIsTracking(false);
  };

  return (
    <div className="p-6 max-w-lg mx-auto font-sans">
      {/* 🔘 TOP NAVIGATION: Search Page पर जाने के लिए */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-stone-400 tracking-tighter italic">Share Journey</h2>
          <p className="text-gray-500 text-sm">Help others track this bus.</p>
        </div>
        <Link href="/search">
          <button className="p-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-blue-100 hover:border-blue-600 transition-all active:scale-90 shadow-sm border-2 border-gray-200">
            <Search size={24} />
          </button>
        </Link>
      </div>

       {/* 🏠 Home Button */}
<div className="absolute top-0 right-0 z-50">
  <Link href="/">
    <button className="bg-white mt-2 mr-2 p-3 rounded-2xl shadow-md text-stone-400  border-2 border-transparent hover:border-slate-400 transition-all active:scale-90 flex items-center justify-center">
      <Home size={20} />
      <span className="ml-2 font-black text-[10px] uppercase tracking-wider hidden sm:block">Home</span>
    </button>
  </Link>
</div>
      
      <div className="space-y-4 mb-8 text-left">
        <label className="text-[10px] font-black text-stone-600 uppercase tracking-widest ml-1">
          Active Route
        </label>
        <select 
          className="w-full p-4 border-2 border-gray-100 rounded-2xl bg-white shadow-sm outline-none hover:border-slate-500 transition-all text-gray-700 font-semibold cursor-pointer"
          onChange={(e) => setSelectedRouteId(e.target.value)}
          disabled={isTracking}
          value={selectedRouteId}
        >
          <option value="">-- Select Official Route --</option>
          {BUS_ROUTES.map(r => (
            <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
          ))}
        </select>
      </div>

      <div className={`p-8 rounded-[3rem] text-center transition-all duration-500 border-4 ${isTracking ? 'bg-red-50 border-red-100 shadow-red-50' : 'bg-blue-50 border-blue-100 shadow-blue-50'} shadow-2xl`}>
        <div className="mb-6 flex justify-center">
            <div className={`p-4 rounded-full shadow-lg ${isTracking ? 'bg-red-500 animate-pulse' : 'bg-neutral-300 text-white'}`}>
                {isTracking ? <Square className="text-white" size={24}/> : <Play className="text-white ml-1" size={24}/>}
            </div>
        </div>

        <p className={`mb-6 font-black tracking-widest text-sm ${isTracking ? 'text-red-600' : 'text-stone-400'}`}>
          {isTracking ? "📡 BROADCASTING LIVE" : "READY TO BROADCAST"}
        </p>
        
        <button 
          onClick={toggleTracking}
          className={`w-full py-4 rounded-2xl font-black text-slate-600 uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
            isTracking 
            ? 'bg-red-500 shadow-red-200 hover:bg-red-600' 
            : 'bg-mist-200 shadow-blue-200 hover:bg-mist-300'
          }`}
        >
          {isTracking ? "Stop Sharing" : "I'm on the Bus"}
        </button>
      </div>

      <p className="mt-8 text-center text-xs text-gray-400 italic font-medium">
        {isTracking 
          ? "Tracking will continue if you go to the search page." 
          : "Start sharing to help people."}
      </p>
    </div>
  );
}