import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import socket from '../utils/socket';
import { Home, Clock } from 'lucide-react'; 
import Link from 'next/link';

const Map = dynamic(() => import('../components/Map'), { 
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100">Loading Map...</div>
});

export default function TrackBus() {
  const router = useRouter();
  const { route } = router.query; 
  const [busLocation, setBusLocation] = useState(null);
  const [lastUpdatedText, setLastUpdatedText] = useState('Just now');

  // 🕒 समय को "2m ago" फॉर्मेट में बदलने वाला फंक्शन
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 30) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  // हर 10 सेकंड में "Updated time" को रिफ्रेश करने के लिए
  useEffect(() => {
    const timer = setInterval(() => {
      if (busLocation?.timestamp) {
        setLastUpdatedText(getRelativeTime(busLocation.timestamp));
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [busLocation]);

  useEffect(() => {
    if (!router.isReady || !route) return;

    socket.connect();

    socket.on('initial_bus_list', (allBuses) => {
      const routeData = allBuses[route];
      if (routeData) {
        const socketIds = Object.keys(routeData);
        if (socketIds.length > 0) {
          setBusLocation(routeData[socketIds[0]]); 
        }
      }
    });

    socket.emit('request_current_bus_location', route);

    socket.on('bus_moved', (data) => {
       if (data.routeId === route) {
           setBusLocation(data);
           setLastUpdatedText('Just now');
       }
    });

    return () => {
      socket.off('bus_moved');
      socket.off('initial_bus_list');
      socket.disconnect();
    };
  }, [router.isReady, route]);

  return (
    <div className="h-screen flex flex-col overflow-hidden font-sans bg-gray-50">
      {/* Top Header */}
      <div className="p-4 bg-white border-b flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-black text-stone-400 uppercase italic tracking-tight">
              {route ? `Route: ${route}` : 'Loading Route...'}
            </h1>
            <div className="flex items-center space-x-2">
                <span className={`h-2 w-2 rounded-full ${busLocation ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Live Tracker</p>
            </div>
          </div>
        </div>
        <Link href="/">
          <button className="bg-slate-600 p-3 rounded-2xl shadow-md text-white border-2 border-transparent hover:border-slate-400 transition-all active:scale-90 flex items-center justify-center">
            <Home size={18} />
            <span className="ml-2 font-black text-[10px] uppercase tracking-wider hidden sm:block">Home</span>
          </button>
        </Link>
      </div>
      
      {/* Map Area */}
      <div className="flex-1 relative">
        <Map busLocation={busLocation} />
        {!busLocation && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm border border-gray-100 text-gray-800 px-6 py-3 rounded-2xl shadow-xl z-[1000] text-center">
              <p className="text-sm font-black italic tracking-tight text-stone-500">Waiting for GPS Signal...</p>
          </div>
        )}
      </div>

      {/* 🚌 Floating Status Card (Updated) */}
      {busLocation && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-white p-4 rounded-[2.5rem] shadow-2xl border border-blue-50 z-[1000] flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <div className="bg-blue-600 p-3.5 rounded-2xl text-white shadow-lg shadow-blue-200">
                    <Clock size={20} />
                </div>
                <div>
                    <div className="flex items-center space-x-2">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Last Updated</p>
                        <span className="h-1 w-1 bg-green-500 rounded-full animate-ping"></span>
                    </div>
                    <p className="font-black text-gray-800 text-lg leading-none">{lastUpdatedText}</p>
                </div>
            </div>

            <Link href="/">
                <button className="bg-gray-100 p-3 rounded-2xl text-stone-500 hover:bg-red-50 hover:text-red-600 transition-all font-black text-[10px] uppercase tracking-widest">
                    Exit
                </button>
            </Link>
        </div>
      )}
    </div>
  );
}