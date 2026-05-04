import type { LocationObject } from 'expo-location';

export interface GeoPhoto {
  uri: string;
  width: number;
  height: number;
  exif?: Record<string, unknown>;
  capturedAt: Date;
  location: LocationObject;
  address: string;
}
