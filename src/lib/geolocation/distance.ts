/**
 * Geolocation Distance Utilities
 * Calculates distances between coordinates using various algorithms
 */

interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two coordinates using the Haversine formula
 * Returns distance in kilometers
 * 
 * @param coord1 - First set of coordinates (latitude, longitude)
 * @param coord2 - Second set of coordinates (latitude, longitude)
 * @returns Distance in kilometers
 */
export function haversineDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  
  const lat1 = toRadians(coord1.latitude);
  const lon1 = toRadians(coord1.longitude);
  const lat2 = toRadians(coord2.latitude);
  const lon2 = toRadians(coord2.longitude);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Calculate distance between two coordinates in miles
 * Uses the Haversine formula and converts result to miles
 * 
 * @param coord1 - First set of coordinates
 * @param coord2 - Second set of coordinates
 * @returns Distance in miles
 */
export function haversineDistanceMiles(coord1: Coordinates, coord2: Coordinates): number {
  const kmDistance = haversineDistance(coord1, coord2);
  return kmDistance * 0.621371; // 1 km = 0.621371 miles
}

/**
 * Calculate distance using simpler spherical law of cosines formula
 * Less accurate than Haversine for small distances, but faster
 * 
 * @param coord1 - First set of coordinates
 * @param coord2 - Second set of coordinates
 * @returns Distance in kilometers
 */
export function sphericalDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  
  const lat1 = toRadians(coord1.latitude);
  const lon1 = toRadians(coord1.longitude);
  const lat2 = toRadians(coord2.latitude);
  const lon2 = toRadians(coord2.longitude);

  const centralAngle = 
    Math.acos(
      Math.sin(lat1) * Math.sin(lat2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
    );

  return R * centralAngle;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians: number): number {
  return radians * 180 / Math.PI;
}

/**
 * Get distance between two coordinates with options for different units
 * 
 * @param coord1 - First set of coordinates
 * @param coord2 - Second set of coordinates
 * @param unit - Unit of measurement ('km', 'miles', 'meters', 'feet')
 * @returns Distance in specified unit
 */
export function getDistance(
  coord1: Coordinates,
  coord2: Coordinates,
  unit: 'km' | 'miles' | 'meters' | 'feet' = 'km'
): number {
  const baseDistance = haversineDistance(coord1, coord2);
  
  switch (unit) {
    case 'km':
      return baseDistance;
    case 'miles':
      return baseDistance * 0.621371;
    case 'meters':
      return baseDistance * 1000;
    case 'feet':
      return baseDistance * 3280.84; // 1 km = 3280.84 feet
    default:
      return baseDistance;
  }
}

/**
 * Format distance for display based on locale and unit preferences
 * 
 * @param distance - Distance in kilometers
 * @param locale - User's locale (e.g., 'en-US', 'fr-FR', 'es-ES', 'ar-SA')
 * @param unit - Unit preference ('metric' or 'imperial')
 * @returns Formatted distance string
 */
export function formatDistance(
  distance: number,
  locale: string = 'en-US',
  unit: 'metric' | 'imperial' = 'metric'
): string {
  if (unit === 'imperial') {
    const miles = distance * 0.621371;
    if (miles >= 1) {
      return `${miles.toFixed(1)} miles`;
    } else {
      const feet = miles * 5280;
      if (feet >= 100) {
        return `${Math.round(feet / 100) * 100} ft`;
      } else {
        return `${Math.round(feet)} ft`;
      }
    }
  } else {
    // Metric
    if (distance >= 1) {
      return `${distance.toFixed(1)} km`;
    } else {
      const meters = distance * 1000;
      if (meters >= 100) {
        return `${Math.round(meters / 100) * 100} m`;
      } else {
        return `${Math.round(meters)} m`;
      }
    }
  }
}

/**
 * Format distance for display in Arabic
 * 
 * @param distance - Distance in kilometers
 * @returns Formatted distance string in Arabic
 */
export function formatDistanceArabic(distance: number): string {
  if (distance >= 1) {
    return `${distance.toFixed(1)} كيلومتر`;
  } else {
    const meters = distance * 1000;
    if (meters >= 100) {
      return `${Math.round(meters / 100) * 100} متر`;
    } else {
      return `${Math.round(meters)} أمتار`;
    }
  }
}

/**
 * Check if two coordinates are within a certain radius
 * 
 * @param center - Center coordinates
 * @param point - Point coordinates to check
 * @param radius - Radius in kilometers
 * @returns True if point is within radius of center
 */
export function isWithinRadius(
  center: Coordinates,
  point: Coordinates,
  radius: number
): boolean {
  return haversineDistance(center, point) <= radius;
}

/**
 * Calculate bounding box around a center point at a given radius
 * Useful for showing nearby locations on a map
 * 
 * @param center - Center coordinates
 * @param radius - Radius in kilometers
 * @returns Bounding box coordinates (minLat, minLon, maxLat, maxLon)
 */
export function getBoundingBox(
  center: Coordinates,
  radius: number
): { minLat: number; minLon: number; maxLat: number; maxLon: number } {
  // Earth's radius in kilometers
  const R = 6371;
  
  // Angular distance in radians
  const angularDistance = radius / R;
  
  const latRad = toRadians(center.latitude);
  const lonRad = toRadians(center.longitude);
  
  // Calculate min/max latitude
  const minLat = toDegrees(latRad - angularDistance);
  const maxLat = toDegrees(latRad + angularDistance);
  
  // Calculate min/max longitude (more complex due to convergence at poles)
  const minLon = toDegrees(lonRad - angularDistance / Math.cos(latRad));
  const maxLon = toDegrees(lonRad + angularDistance / Math.cos(latRad));
  
  return { minLat, minLon, maxLat, maxLon };
}

/**
 * Calculate the midpoint between two coordinates
 * 
 * @param coord1 - First set of coordinates
 * @param coord2 - Second set of coordinates
 * @returns Midpoint coordinates
 */
export function getMidpoint(coord1: Coordinates, coord2: Coordinates): Coordinates {
  const lat1 = toRadians(coord1.latitude);
  const lon1 = toRadians(coord1.longitude);
  const lat2 = toRadians(coord2.latitude);
  const lon2 = toRadians(coord2.longitude);

  const bx = Math.cos(lat2) * Math.cos(lon2 - lon1);
  const by = Math.cos(lat2) * Math.sin(lon2 - lon1);
  const lat3 = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + bx) * (Math.cos(lat1) + bx) + by * by)
  );
  const lon3 = lon1 + Math.atan2(by, Math.cos(lat1) + bx);

  return {
    latitude: toDegrees(lat3),
    longitude: toDegrees(lon3)
  };
}

/**
 * Check if coordinates are valid
 */
export function isValidCoordinates(coords: Coordinates): boolean {
  return (
    coords.latitude >= -90 && coords.latitude <= 90 &&
    coords.longitude >= -180 && coords.longitude <= 180
  );
}

// Re-export types
export type { Coordinates };