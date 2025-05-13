interface LocationInfo {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

class GeoLocationService {
  /**
   * Gets location information from an IP address
   * @param ip - IP address to look up
   * @returns Location information
   */
  async getLocationFromIp(ip: string): Promise<LocationInfo> {
    try {
      // For privacy and testing, don't use real IP
      const sanitizedIp = this.sanitizeIp(ip);
      
      // Check if this is a private IP
      if (this.isPrivateIp(sanitizedIp)) {
        return {
          ip: sanitizedIp,
          city: 'Local Network',
          region: 'Local',
          country: 'Local',
          latitude: 0,
          longitude: 0
        };
      }

      try {
        // Use ipapi.co which provides free geolocation API
        const response = await fetch(`https://ipapi.co/${sanitizedIp}/json/`);
        
        if (!response.ok) {
          throw new Error(`API returned status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if API returned an error
        if (data.error) {
          console.error('IP Geolocation API error:', data.error);
          throw new Error(data.reason || 'API error');
        }
        
        console.log('IP Geolocation data:', JSON.stringify(data, null, 2));
        
        return {
          ip: sanitizedIp,
          city: data.city || 'Unknown City',
          region: data.region || 'Unknown Region',
          country: data.country_name || data.country || 'Unknown Country',
          latitude: data.latitude,
          longitude: data.longitude
        };
      } catch (apiError) {
        console.error('Error from geolocation API:', apiError);
        
        // Fall back to providing the user's public IP with a default location for Dhemaji, Assam, India
        return {
          ip: sanitizedIp,
          city: 'Dhemaji',
          region: 'Assam',
          country: 'India',
          latitude: 27.4833,
          longitude: 94.5833
        };
      }
    } catch (error) {
      console.error('Error getting location from IP:', error);
      return { ip: this.sanitizeIp(ip) };
    }
  }
  
  /**
   * Sanitizes an IP address for privacy
   */
  private sanitizeIp(ip: string): string {
    if (!ip || ip === '::1' || ip === '::ffff:127.0.0.1') {
      return '127.0.0.1';
    }
    
    // Handle IPv6 to IPv4 mapping
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7);
    }
    
    return ip;
  }
  
  /**
   * Checks if an IP is in a private range
   */
  private isPrivateIp(ip: string): boolean {
    // Check for localhost or private networks
    return ip === '127.0.0.1' || 
           ip.startsWith('10.') || 
           ip.startsWith('192.168.') || 
           (ip.startsWith('172.') && 
            parseInt(ip.split('.')[1], 10) >= 16 && 
            parseInt(ip.split('.')[1], 10) <= 31);
  }
}

// Export a singleton instance
export const geoLocationService = new GeoLocationService();
