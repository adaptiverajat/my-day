// Pre-populated cities and states for India and USA for instant, zero-latency autocomplete
export const POPULAR_CITIES = {
  IN: [
    { city: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777 },
    { city: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.209 },
    { city: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.209 },
    { city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
    { city: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
    { city: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.4867 },
    { city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
    { city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
    { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
    { city: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311 },
    { city: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
    { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
    { city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
    { city: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319 },
    { city: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
    { city: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
    { city: 'Thane', state: 'Maharashtra', lat: 19.2183, lng: 72.9781 },
    { city: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
    { city: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
    { city: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376 },
    { city: 'Vadodara', state: 'Gujarat', lat: 22.3072, lng: 73.1812 },
    { city: 'Ghaziabad', state: 'Uttar Pradesh', lat: 28.6692, lng: 77.4538 },
    { city: 'Ludhiana', state: 'Punjab', lat: 30.901, lng: 75.8573 },
    { city: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081 },
    { city: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 73.7898 },
    { city: 'Faridabad', state: 'Haryana', lat: 28.4089, lng: 77.3178 },
    { city: 'Meerut', state: 'Uttar Pradesh', lat: 28.9845, lng: 77.7064 },
    { city: 'Rajkot', state: 'Gujarat', lat: 22.3039, lng: 70.8022 },
    { city: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739 },
    { city: 'Srinagar', state: 'Jammu and Kashmir', lat: 34.0837, lng: 74.7973 },
    { city: 'Aurangabad', state: 'Maharashtra', lat: 19.8762, lng: 75.3433 },
    { city: 'Chhatrapati Sambhajinagar', state: 'Maharashtra', lat: 19.8762, lng: 75.3433 },
    { city: 'Dhanbad', state: 'Jharkhand', lat: 23.7957, lng: 86.4304 },
    { city: 'Amritsar', state: 'Punjab', lat: 31.634, lng: 74.8723 },
    { city: 'Navi Mumbai', state: 'Maharashtra', lat: 19.033, lng: 73.0297 },
    { city: 'Prayagraj', state: 'Uttar Pradesh', lat: 25.4358, lng: 81.8463 },
    { city: 'Allahabad', state: 'Uttar Pradesh', lat: 25.4358, lng: 81.8463 },
    { city: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lng: 85.3096 },
    { city: 'Howrah', state: 'West Bengal', lat: 22.5958, lng: 88.2636 },
    { city: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558 },
    { city: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1815, lng: 79.9864 },
    { city: 'Gwalior', state: 'Madhya Pradesh', lat: 26.2183, lng: 78.1828 },
    { city: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lng: 80.648 },
    { city: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lng: 73.0243 },
    { city: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lng: 78.1198 },
    { city: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296 },
    { city: 'Kota', state: 'Rajasthan', lat: 25.2138, lng: 75.8648 },
    { city: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362 },
    { city: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
    { city: 'Mysuru', state: 'Karnataka', lat: 12.2958, lng: 76.6394 },
    { city: 'Mysore', state: 'Karnataka', lat: 12.2958, lng: 76.6394 },
    { city: 'Gurugram', state: 'Haryana', lat: 28.4595, lng: 77.0266 },
    { city: 'Gurgaon', state: 'Haryana', lat: 28.4595, lng: 77.0266 },
    { city: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.391 },
    { city: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lng: 85.8245 },
    { city: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
    { city: 'Cochin', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
    { city: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lng: 76.9366 },
    { city: 'Trivandrum', state: 'Kerala', lat: 8.5241, lng: 76.9366 },
    { city: 'Kozhikode', state: 'Kerala', lat: 11.2588, lng: 75.7804 },
    { city: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lng: 78.0322 },
    { city: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734 },
    { city: 'Jammu', state: 'Jammu and Kashmir', lat: 32.7266, lng: 74.857 },
    { city: 'Mangaluru', state: 'Karnataka', lat: 12.9141, lng: 74.856 },
    { city: 'Mangalore', state: 'Karnataka', lat: 12.9141, lng: 74.856 },
    { city: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lng: 73.7125 },
    { city: 'Puducherry', state: 'Puducherry', lat: 11.9416, lng: 79.8083 },
    { city: 'Panaji', state: 'Goa', lat: 15.4909, lng: 73.8278 },
    { city: 'Shillong', state: 'Meghalaya', lat: 25.5788, lng: 91.8933 },
    { city: 'Gangtok', state: 'Sikkim', lat: 27.3389, lng: 88.6065 }
  ],
  US: [
    { city: 'New York', state: 'New York', lat: 40.7128, lng: -74.006 },
    { city: 'Los Angeles', state: 'California', lat: 34.0522, lng: -118.2437 },
    { city: 'Chicago', state: 'Illinois', lat: 41.8781, lng: -87.6298 },
    { city: 'Houston', state: 'Texas', lat: 29.7604, lng: -95.3698 },
    { city: 'Phoenix', state: 'Arizona', lat: 33.4484, lng: -112.074 },
    { city: 'Philadelphia', state: 'Pennsylvania', lat: 39.9526, lng: -75.1652 },
    { city: 'San Antonio', state: 'Texas', lat: 29.4241, lng: -98.4936 },
    { city: 'San Diego', state: 'California', lat: 32.7157, lng: -117.1611 },
    { city: 'Dallas', state: 'Texas', lat: 32.7767, lng: -96.797 },
    { city: 'San Jose', state: 'California', lat: 37.3382, lng: -121.8863 },
    { city: 'Austin', state: 'Texas', lat: 30.2672, lng: -97.7431 },
    { city: 'Jacksonville', state: 'Florida', lat: 30.3322, lng: -81.6557 },
    { city: 'Fort Worth', state: 'Texas', lat: 32.7555, lng: -97.3308 },
    { city: 'Columbus', state: 'Ohio', lat: 39.9612, lng: -82.9988 },
    { city: 'Charlotte', state: 'North Carolina', lat: 35.2271, lng: -80.8431 },
    { city: 'San Francisco', state: 'California', lat: 37.7749, lng: -122.4194 },
    { city: 'Indianapolis', state: 'Indiana', lat: 39.7684, lng: -86.1581 },
    { city: 'Seattle', state: 'Washington', lat: 47.6062, lng: -122.3321 },
    { city: 'Denver', state: 'Colorado', lat: 39.7392, lng: -104.9903 },
    { city: 'Washington', state: 'District of Columbia', lat: 38.9072, lng: -77.0369 },
    { city: 'Boston', state: 'Massachusetts', lat: 42.3601, lng: -71.0589 },
    { city: 'El Paso', state: 'Texas', lat: 31.7619, lng: -106.485 },
    { city: 'Nashville', state: 'Tennessee', lat: 36.1627, lng: -86.7816 },
    { city: 'Detroit', state: 'Michigan', lat: 42.3314, lng: -83.0458 },
    { city: 'Oklahoma City', state: 'Oklahoma', lat: 35.4676, lng: -97.5164 },
    { city: 'Portland', state: 'Oregon', lat: 45.5152, lng: -122.6784 },
    { city: 'Las Vegas', state: 'Nevada', lat: 36.1699, lng: -115.1398 },
    { city: 'Memphis', state: 'Tennessee', lat: 35.1495, lng: -90.049 },
    { city: 'Louisville', state: 'Kentucky', lat: 38.2527, lng: -85.7585 },
    { city: 'Baltimore', state: 'Maryland', lat: 39.2904, lng: -76.6122 },
    { city: 'Milwaukee', state: 'Wisconsin', lat: 43.0389, lng: -87.9065 },
    { city: 'Albuquerque', state: 'New Mexico', lat: 35.0844, lng: -106.6504 },
    { city: 'Tucson', state: 'Arizona', lat: 32.2226, lng: -110.9747 },
    { city: 'Fresno', state: 'California', lat: 36.7468, lng: -119.7726 },
    { city: 'Sacramento', state: 'California', lat: 38.5816, lng: -121.4944 },
    { city: 'Kansas City', state: 'Missouri', lat: 39.0997, lng: -94.5786 },
    { city: 'Atlanta', state: 'Georgia', lat: 33.749, lng: -84.388 },
    { city: 'Omaha', state: 'Nebraska', lat: 41.2565, lng: -95.9345 },
    { city: 'Raleigh', state: 'North Carolina', lat: 35.7796, lng: -78.6382 },
    { city: 'Miami', state: 'Florida', lat: 25.7617, lng: -80.1918 },
    { city: 'Minneapolis', state: 'Minnesota', lat: 44.9778, lng: -93.265 },
    { city: 'Tampa', state: 'Florida', lat: 27.9506, lng: -82.4572 },
    { city: 'Cleveland', state: 'Ohio', lat: 41.4993, lng: -81.6944 },
    { city: 'Honolulu', state: 'Hawaii', lat: 21.3069, lng: -157.8583 },
    { city: 'Orlando', state: 'Florida', lat: 28.5383, lng: -81.3792 },
    { city: 'Pittsburgh', state: 'Pennsylvania', lat: 40.4406, lng: -79.9959 },
    { city: 'St. Louis', state: 'Missouri', lat: 38.627, lng: -90.1994 },
    { city: 'Newark', state: 'New Jersey', lat: 40.7357, lng: -74.1724 },
    { city: 'Salt Lake City', state: 'Utah', lat: 40.7608, lng: -111.891 }
  ]
}

// Search locally matched cities
export function searchLocalCities(query, country = 'IN') {
  if (!query || query.trim().length === 0) return []
  const clean = query.trim().toLowerCase()
  const list = POPULAR_CITIES[country] || []

  return list.filter(
    (item) =>
      item.city.toLowerCase().includes(clean) ||
      item.state.toLowerCase().includes(clean)
  ).slice(0, 8)
}

// Search remote OpenStreetMap / Nominatim for any other city/town
export async function fetchRemoteCities(query, country = 'IN', signal) {
  if (!query || query.trim().length < 2) return []
  try {
    const code = country === 'US' ? 'us' : 'in'
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query.trim()
    )}&countrycodes=${code}&format=json&addressdetails=1&limit=6`

    const res = await fetch(url, { signal })
    if (!res.ok) return []
    const data = await res.json()

    return data
      .map((item) => {
        const addr = item.address || {}
        const city =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.county ||
          item.name ||
          ''
        const state = addr.state || ''
        return {
          city,
          state,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        }
      })
      .filter((item) => item.city)
  } catch {
    return []
  }
}
