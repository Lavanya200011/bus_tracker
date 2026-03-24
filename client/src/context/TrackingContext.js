import { createContext, useContext, useState, useEffect } from 'react';

const TrackingContext = createContext();

export function TrackingProvider({ children }) {
  const [isLive, setIsLive] = useState(false);
  const [routeId, setRouteId] = useState(null);

  useEffect(() => {
    // Check localStorage on boot
    const saved = localStorage.getItem('is_tracking') === 'true';
    const savedRoute = localStorage.getItem('active_route_id');
    if (saved && savedRoute) {
      setIsLive(true);
      setRouteId(savedRoute);
    }
  }, []);

  return (
    <TrackingContext.Provider value={{ isLive, setIsLive, routeId, setRouteId }}>
      {children}
    </TrackingContext.Provider>
  );
}

export const useTracking = () => useContext(TrackingContext);