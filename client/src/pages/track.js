import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import socket from '../utils/socket';

const Map = dynamic(() => import('../components/Map'), { 
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100">Loading Map...</div>
});

export default function TrackBus() {
  const router = useRouter();
  const { route } = router.query; 
  const [busLocation, setBusLocation] = useState(null);

  useEffect(() => {
    if (!router.isReady || !route) return;

    socket.connect();

    // CORRECTED INITIAL LIST HANDLER
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
       }
    });

    return () => {
      socket.off('bus_moved');
      socket.off('initial_bus_list');
      socket.disconnect();
    };
  }, [router.isReady, route]);

  return (
    <div className="h-screen flex flex-col overflow-hidden font-sans">
      <div className="p-4 bg-white border-b flex justify-between items-center shadow-sm z-10">
        <div>
          <h1 className="text-xl font-bold text-blue-600 uppercase tracking-tight">
            {route ? `Route: ${route}` : 'Loading Route...'}
          </h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Live Tracker</p>
        </div>
        <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-full border">
            <span className={`h-2.5 w-2.5 rounded-full ${busLocation ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
            <span className="text-xs font-bold text-gray-600 italic">
                {busLocation ? 'LIVE' : 'SIGNAL SEARCHING'}
            </span>
        </div>
      </div>
      
      <div className="flex-1 relative">
        <Map busLocation={busLocation} />
        {!busLocation && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm border border-gray-100 text-gray-800 px-6 py-3 rounded-2xl shadow-xl z-[1000] text-center">
              <p className="text-sm font-semibold">Waiting for GPS...</p>
          </div>
        )}
      </div>

      {busLocation && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white p-5 rounded-3xl shadow-2xl border border-blue-50 z-[1000]">
            <div className="flex items-center space-x-4">
                <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg">🚌</div>
                <div>
                    <p className="text-xs text-gray-400 font-bold">Bus Status</p>
                    <p className="font-bold text-gray-800">Tracking Active</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}