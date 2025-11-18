
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Coordinates } from '../types';

interface GeolocationState {
  location: Coordinates | null;
  error: string | null;
  loading: boolean;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: true,
  });

  const watcherRef = useRef<number | null>(null);

  const startWatching = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      setState({
        location: null,
        error: 'Geolocation is not supported by your browser.',
        loading: false,
      });
      return;
    }

    // Clear existing watcher if any to avoid duplicates or stale watchers
    if (watcherRef.current !== null) {
        navigator.geolocation.clearWatch(watcherRef.current);
        watcherRef.current = null;
    }

    watcherRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          error: null,
          loading: false,
        });
      },
      (err) => {
        let errorMessage = 'An unknown error occurred.';
        switch(err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = "Geolocation permission denied. Please enable it in your browser settings.";
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable. Please check your GPS signal.";
            break;
          case err.TIMEOUT:
            errorMessage = "The request to get user location timed out. Please ensure you are in an open area.";
            break;
        }
        setState((prevState) => ({
          ...prevState,
          error: errorMessage,
          loading: false,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 30000, // Increased timeout to 30s
        maximumAge: 10000, // Accept cached positions up to 10s old for faster initial load
      }
    );
  }, []);

  useEffect(() => {
    startWatching();

    return () => {
      if (watcherRef.current !== null) {
        navigator.geolocation.clearWatch(watcherRef.current);
      }
    };
  }, [startWatching]);

  const retry = () => {
      startWatching();
  };

  return { ...state, retry };
};
