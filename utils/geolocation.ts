
import type { Coordinates } from '../types';

/**
 * Calculates the distance between two geographical coordinates using the Haversine formula.
 * @param coord1 - The first coordinate (e.g., user's location).
 * @param coord2 - The second coordinate (e.g., school's location).
 * @returns The distance in meters.
 */
export function getDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3; // Earth's radius in meters
  const lat1Rad = coord1.latitude * Math.PI / 180;
  const lat2Rad = coord2.latitude * Math.PI / 180;
  const deltaLatRad = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const deltaLonRad = (coord2.longitude - coord1.longitude) * Math.PI / 180;

  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return distance;
}
