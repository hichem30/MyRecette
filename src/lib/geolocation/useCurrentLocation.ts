import { useState, useEffect, useCallback } from "react";

interface LocationError {
  message: string;
  code: number;
}

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface UseCurrentLocationReturn {
  location: Location | null;
  error: LocationError | null;
  isLoading: boolean;
  getCurrentLocation: () => Promise<Location | null>;
  hasPermission: boolean;
  permissionError: string | null;
}

/**
 * useCurrentLocation - Hook to get user's current location using browser geolocation API
 * Returns location data, error states, and methods to manually request location
 */
export function useCurrentLocation(options?: PositionOptions): UseCurrentLocationReturn {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Check if geolocation is supported
  const isGeolocationSupported = (): boolean => {
    return "geolocation" in navigator;
  };

  // Get current location
  const getCurrentLocation = useCallback(async (): Promise<Location | null> => {
    if (!isGeolocationSupported()) {
      setError({
        message: "Geolocation is not supported by your browser",
        code: 0,
      });
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000, // 10 seconds
            maximumAge: 0, // Don't use cached positions
            ...options,
          }
        );
      });

      const newLocation: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };

      setLocation(newLocation);
      setHasPermission(true);
      setPermissionError(null);
      setIsLoading(false);

      return newLocation;
    } catch (err) {
      const geolocationError = err as GeolocationPositionError;
      
      const errorData: LocationError = {
        message: geolocationError.message || "Failed to retrieve location",
        code: geolocationError.code,
      };

      setError(errorData);
      setIsLoading(false);

      // Check if it's a permission error
      if (geolocationError.code === geolocationError.PERMISSION_DENIED) {
        setHasPermission(false);
        setPermissionError("Location permission was denied. Please enable location services for this site.");
      }

      return null;
    }
  }, []);

  // Request permission on mount if not already checked
  useEffect(() => {
    if (!isGeolocationSupported()) {
      setPermissionError("Geolocation is not supported by your browser");
      return;
    }

    // Check current permission state
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" } as any).then((result) => {
        if (result.state === "granted") {
          setHasPermission(true);
        } else if (result.state === "denied") {
          setHasPermission(false);
          setPermissionError("Location permission was previously denied. Please enable it in your browser settings.");
        }
      }).catch(() => {
        // Permissions API not available or failed
        // We'll check when we try to get location
      });
    }
  }, []);

  // Auto-request location on mount (optional)
  // Uncomment this if you want to automatically request location when the hook is used
  // useEffect(() => {
  //   getCurrentLocation();
  // }, []);

  return {
    location,
    error,
    isLoading,
    getCurrentLocation,
    hasPermission: hasPermission ?? true, // Default to true if not checked yet
    permissionError,
  };
}

/**
 * watchCurrentLocation - Hook to watch for location changes
 * Returns location data that updates when the user moves
 */
export function useWatchLocation(options?: PositionOptions): UseCurrentLocationReturn {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const isGeolocationSupported = (): boolean => {
    return "geolocation" in navigator;
  };

  const getCurrentLocation = useCallback(async (): Promise<Location | null> => {
    if (!isGeolocationSupported()) {
      setError({
        message: "Geolocation is not supported by your browser",
        code: 0,
      });
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (watchId) {
          navigator.geolocation.clearWatch(watchId);
        }
        
        const newWatchId = navigator.geolocation.watchPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
            ...options,
          }
        );
        
        setWatchId(newWatchId);
      });

      const newLocation: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };

      setLocation(newLocation);
      setHasPermission(true);
      setPermissionError(null);
      setIsLoading(false);

      return newLocation;
    } catch (err) {
      const geolocationError = err as GeolocationPositionError;
      
      const errorData: LocationError = {
        message: geolocationError.message || "Failed to retrieve location",
        code: geolocationError.code,
      };

      setError(errorData);
      setIsLoading(false);

      if (geolocationError.code === geolocationError.PERMISSION_DENIED) {
        setHasPermission(false);
        setPermissionError("Location permission was denied. Please enable location services for this site.");
      }

      return null;
    }
  }, [watchId]);

  // Clean up watch on unmount
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    location,
    error,
    isLoading,
    getCurrentLocation,
    hasPermission: hasPermission ?? true,
    permissionError,
  };
}

// Type definitions
export interface GeolocationPositionError extends Error {
  code: number;
  PERMISSION_DENIED: number;
  POSITION_UNAVAILABLE: number;
  TIMEOUT: number;
}

// Polyfill for browsers that don't have these constants
declare global {
  interface GeolocationPositionError {
    PERMISSION_DENIED: number;
    POSITION_UNAVAILABLE: number;
    TIMEOUT: number;
  }
}