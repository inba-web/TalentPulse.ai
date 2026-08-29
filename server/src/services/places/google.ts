import axios from 'axios';
import { logger } from '../../utils/logger';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export interface PlaceCandidate {
  placeId: string;
  name: string;
  formattedAddress: string;
}

export interface PlaceDetails {
  exactAddress: string;
  latitude: number;
  longitude: number;
  mapsUrl: string;
}

export class GooglePlacesProvider {
  /**
   * Search for places based on query string.
   */
  public static async searchPlaces(query: string): Promise<PlaceCandidate[]> {
    if (!GOOGLE_MAPS_API_KEY) {
      logger.warn('GOOGLE_MAPS_API_KEY is not set. Falling back to local offline mock search.');
      return this.getMockCandidates(query);
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await axios.get(url);

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        logger.error({ responseData: response.data }, 'Google Places API search failure');
        return this.getMockCandidates(query);
      }

      const results = response.data.results || [];
      return results.map((item: any) => ({
        placeId: item.place_id,
        name: item.name,
        formattedAddress: item.formatted_address,
      }));
    } catch (error) {
      logger.error({ error }, 'Google Places API call exception. Falling back to mock.');
      return this.getMockCandidates(query);
    }
  }

  /**
   * Retrieve full details for a resolved placeId.
   */
  public static async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    if (placeId.startsWith('mock_')) {
      return this.getMockDetails(placeId);
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return this.getMockDetails(placeId);
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,geometry,url&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await axios.get(url);

      if (response.data.status !== 'OK') {
        logger.error({ responseData: response.data }, 'Google Places API details failure');
        return this.getMockDetails(placeId);
      }

      const result = response.data.result || {};
      return {
        exactAddress: result.formatted_address || '',
        latitude: result.geometry?.location?.lat || 0,
        longitude: result.geometry?.location?.lng || 0,
        mapsUrl: result.url || `https://www.google.com/maps/place/?q=place_id:${placeId}`,
      };
    } catch (error) {
      logger.error({ error }, 'Google Places details call exception. Falling back to mock.');
      return this.getMockDetails(placeId);
    }
  }

  private static getMockCandidates(query: string): PlaceCandidate[] {
    return [
      {
        placeId: 'mock_1',
        name: `${query} Office (MOCK Bangalore)`,
        formattedAddress: 'Outer Ring Rd, Marathahalli, Bengaluru, Karnataka 560103',
      },
      {
        placeId: 'mock_2',
        name: `${query} Corporate Hub (MOCK Chennai)`,
        formattedAddress: 'OMR Road, Karapakkam, Chennai, Tamil Nadu 600097',
      },
      {
        placeId: 'mock_3',
        name: `${query} Innovation Center (MOCK Hyderabad)`,
        formattedAddress: 'HITEC City, Madhapur, Hyderabad, Telangana 500081',
      },
    ];
  }

  private static getMockDetails(placeId: string): PlaceDetails {
    if (placeId === 'mock_1') {
      return {
        exactAddress: 'Outer Ring Rd, Marathahalli, Bengaluru, Karnataka 560103',
        latitude: 12.9345,
        longitude: 77.6912,
        mapsUrl: 'https://maps.google.com/?q=Marathahalli+Bangalore',
      };
    } else if (placeId === 'mock_2') {
      return {
        exactAddress: 'OMR Road, Karapakkam, Chennai, Tamil Nadu 600097',
        latitude: 12.9156,
        longitude: 80.2312,
        mapsUrl: 'https://maps.google.com/?q=OMR+Chennai',
      };
    } else {
      return {
        exactAddress: 'HITEC City, Madhapur, Hyderabad, Telangana 500081',
        latitude: 17.4435,
        longitude: 78.3812,
        mapsUrl: 'https://maps.google.com/?q=HITEC+City+Hyderabad',
      };
    }
  }
}
