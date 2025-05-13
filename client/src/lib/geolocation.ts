/**
 * Gets the user's current geolocation
 * @returns Promise with coordinates
 */
export async function getCurrentLocation(): Promise<{ 
  latitude: number; 
  longitude: number;
  accuracy: number;
} | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported by this browser');
      resolve(null);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        resolve({ latitude, longitude, accuracy });
      },
      (error) => {
        console.error('Geolocation error:', error);
        resolve(null);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0 
      }
    );
  });
}

/**
 * Gets the location name based on coordinates
 * @param latitude - The latitude coordinate
 * @param longitude - The longitude coordinate
 * @returns Promise with location details
 */
export async function getLocationName(
  latitude: number, 
  longitude: number
): Promise<{ 
  city?: string; 
  region?: string;
  country?: string;
} | null> {
  try {
    // Use OpenStreetMap's Nominatim service for reverse geocoding
    // This service doesn't require an API key and is free to use
    const headers = {
      'User-Agent': 'ECC Security Auth App',
      'Accept-Language': 'en'
    };
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      { headers }
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding service returned status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Geocoding data:', JSON.stringify(data, null, 2));
    
    // Extract location information from the response
    const address = data.address || {};
    
    return {
      city: address.city || address.town || address.village || address.hamlet || 'Unknown City',
      region: address.state || address.county || 'Unknown Region',
      country: address.country || 'Unknown Country'
    };
  } catch (error) {
    console.error('Error getting location name:', error);
    
    // Default to Dhemaji, Assam, India if there's an error
    return {
      city: 'Dhemaji',
      region: 'Assam',
      country: 'India'
    };
  }
}
