import { useState, useEffect } from 'react';
import { Search, ArrowRight, Bus, XCircle, Share2 } from 'lucide-react'; // Share2 आइकॉन जोड़ा
import Link from 'next/link';
import socket from '../utils/socket';
import { BUS_ROUTES } from '../utils/routes';

export default function SearchBus() {
  const [query, setQuery] = useState('');
  const [activeBuses, setActiveBuses] = useState({});
  const [isUserSharing, setIsUserSharing] = useState(false);
  const [userRouteId, setUserRouteId] = useState('');

  useEffect(() => {
    const savedSharing = localStorage.getItem('is_tracking') === 'true';
    const savedRoute = localStorage.getItem('active_route_id');
    
    if (savedSharing && savedRoute) {
      setIsUserSharing(true);
      setUserRouteId(savedRoute);
    }

    if (!socket.connected) {
        socket.connect();
    }

    const handleData = (data) => {
      setActiveBuses({ ...data }); 
    };

    socket.on('initial_bus_list', handleData);
    socket.on('update_bus_list', handleData);

    if (socket.connected) {
      socket.emit('request_initial_data');
    } else {
      socket.on('connect', () => {
        socket.emit('request_initial_data');
      });
    }

    return () => {
      socket.off('initial_bus_list', handleData);
      socket.off('update_bus_list', handleData);
    };
  }, []);

  const handleStopSharing = () => {
    socket.emit('manual_disconnect');
    socket.disconnect();
    localStorage.removeItem('is_tracking');
    localStorage.removeItem('active_route_id');
    setIsUserSharing(false);
  };

  const liveBusesArray = Object.keys(activeBuses).map(routeId => {
    const routeGroup = activeBuses[routeId];
    const socketIds = Object.keys(routeGroup);
    return socketIds.length > 0 ? routeGroup[socketIds[0]] : null;
  }).filter(Boolean);

  const filteredBuses = liveBusesArray.filter(bus => 
    bus.routeId?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-32 font-sans">
      <div className="max-w-md mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-black text-blue-600 tracking-tighter italic">GovBus Live</h1>
          <p className="text-gray-400 text-[10px] font-bold mt-1 uppercase tracking-[0.3em]">Nagpur Transport Division</p>
        </header>

        {/* 🔘 Navigation Button to Share Page */}
        <div className="mb-6">
          <Link href="/share">
            <button className="w-full flex items-center justify-center space-x-3 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-200 active:scale-95 transition-all">
              <Share2 size={20} />
              <span>I'm on a Bus (Share)</span>
            </button>
          </Link>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
          <input 
            type="text"
            placeholder="Search Route ID..."
            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-xl shadow-blue-900/5 outline-none border-2 border-transparent focus:border-blue-500 transition-all text-gray-700 font-semibold"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Active Now</h3>
          
          {filteredBuses.length > 0 ? (
            filteredBuses.map((bus) => (
              <Link key={bus.routeId} href={`/track?route=${bus.routeId}`}>
                <div className="flex items-center justify-between p-5 bg-white rounded-[2rem] border-2 border-blue-50 shadow-md hover:border-blue-400 transition-all cursor-pointer active:scale-95">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-100">
                      <Bus size={24} />
                    </div>
                    <div>
                      <p className="font-black text-gray-800 uppercase leading-none mb-1">{bus.routeId}</p>
                      <div className="flex items-center space-x-1.5 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[9px] font-black text-green-600 tracking-tighter">LIVE</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-full text-blue-500">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-20 bg-gray-100/50 rounded-[2rem] border-2 border-dashed border-gray-200">
              <p className="text-gray-400 text-sm font-bold italic">No active buses found</p>
            </div>
          )}
        </div>

        {/* 🚨 Floating Stop Sharing Bar */}
        {isUserSharing && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-red-600 text-white p-4 rounded-[2.5rem] shadow-2xl flex items-center justify-between z-[2000] border-4 border-white animate-in slide-in-from-bottom duration-700">
            <div className="flex items-center space-x-3 px-2">
              <div className="h-2.5 w-2.5 bg-white rounded-full animate-ping"></div>
              <div>
                <p className="text-[8px] font-black uppercase opacity-70 tracking-widest leading-none mb-1">Broadcasting</p>
                <p className="text-xs font-black truncate max-w-[130px]">{userRouteId}</p>
              </div>
            </div>
            {/* ✅ Stop Button */}
            <button 
              onClick={handleStopSharing}
              className="bg-white text-red-600 px-5 py-2.5 rounded-2xl flex items-center space-x-2 transition-all active:scale-90 font-black text-[10px] uppercase shadow-lg shadow-red-900/20"
            >
              <XCircle size={14} />
              <span>Stop Sharing</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}