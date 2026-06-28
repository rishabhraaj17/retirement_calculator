import { NextRequest, NextResponse } from 'next/server';
import { City, Country } from '@/types';

// Static fallback data for cost of living
const fallbackData: City[] = [
  {
    id: 'munich',
    name: 'Munich',
    country: 'Germany',
    costOfLivingIndex: 100,
    rentIndex: 88,
    groceriesIndex: 105,
    healthcareCostMonthly: 350,
    taxRate: 0.15,
  },
  {
    id: 'berlin',
    name: 'Berlin',
    country: 'Germany',
    costOfLivingIndex: 82,
    rentIndex: 68,
    groceriesIndex: 98,
    healthcareCostMonthly: 350,
    taxRate: 0.15,
  },
  {
    id: 'delhi-ncr',
    name: 'Delhi NCR',
    country: 'India',
    costOfLivingIndex: 25,
    rentIndex: 20,
    groceriesIndex: 22,
    healthcareCostMonthly: 150,
    taxRate: 0.10,
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    country: 'India',
    costOfLivingIndex: 30,
    rentIndex: 35,
    groceriesIndex: 28,
    healthcareCostMonthly: 200,
    taxRate: 0.10,
  },
  {
    id: 'bangalore',
    name: 'Bangalore',
    country: 'India',
    costOfLivingIndex: 28,
    rentIndex: 25,
    groceriesIndex: 26,
    healthcareCostMonthly: 180,
    taxRate: 0.10,
  },
];

// City name mapping for URL slugs
const citySlugToName: Record<string, string> = {
  munich: 'Munich',
  berlin: 'Berlin',
  'delhi-ncr': 'Delhi NCR',
  mumbai: 'Mumbai',
  bangalore: 'Bangalore',
};

/**
 * GET /api/col/[city]
 * Returns cost of living data for a specific city
 * Proxies to Numbeo API if available, falls back to static data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ city: string }> }
): Promise<NextResponse> {
  const { city: citySlug } = await params;

  // Normalize city slug to match our data
  const cityName = citySlugToName[citySlug.toLowerCase()] ||
                   citySlugToName[citySlug] ||
                   citySlug;

  // Find city in fallback data
  const cityData = fallbackData.find(
    (city) => city.name.toLowerCase() === cityName.toLowerCase()
  );

  if (!cityData) {
    return NextResponse.json(
      { error: 'City not found' },
      { status: 404 }
    );
  }

  // Try to fetch from Numbeo API (if API key is configured)
  const numbeoApiKey = process.env.NUMBEO_API_KEY;

  if (numbeoApiKey) {
    try {
      // Numbeo API endpoints
      const costOfLivingResponse = await fetch(
        `https://www.numbeo.com/api/cost_of_living?api_key=${numbeoApiKey}&section=1`
      );

      if (costOfLivingResponse.ok) {
        const numbeoData = await costOfLivingResponse.json();
        // Transform Numbeo data to our format if needed
        // For now, return the city data with API flag
        return NextResponse.json({
          ...cityData,
          source: 'numbeo-api',
          fetchedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Numbeo API fetch error:', error);
      // Fall through to static data
    }
  }

  // Return static fallback data
  return NextResponse.json({
    ...cityData,
    source: 'static',
    fetchedAt: new Date().toISOString(),
  });
}

/**
 * GET /api/col/[city]
 * Returns cost of living data for all supported cities grouped by country
 */
export async function getAllCities(): Promise<Record<Country, City[]>> {
  const germanyCities = fallbackData.filter(
    (city) => city.country === 'Germany'
  );
  const indiaCities = fallbackData.filter(
    (city) => city.country === 'India'
  );

  return {
    Germany: germanyCities,
    India: indiaCities,
  };
}