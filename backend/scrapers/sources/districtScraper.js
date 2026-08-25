import axios from 'axios';
import { writeFileSync } from 'fs';

const CITIES = [
  { name: 'Delhi',     city_id: 1, lat: 28.6139,            lng: 77.209 },
  { name: 'Mumbai',    city_id: 3, lat: 19.128567073099326, lng: 72.87749886851958 },
  { name: 'Bengaluru', city_id: 4, lat: 12.999581446760843, lng: 77.63576701984482 },
  { name: 'Hyderabad', city_id: 6, lat: 17.39784178559756,  lng: 78.47682085228203 },
  { name: 'Pune',      city_id: 5, lat: 18.525186644572884, lng: 73.85291481807889 },
];

const CITY_META = {
  1: { key: 'new-delhi', pName: 'New Delhi', pState: 'delhi',       placeId: 'ChIJJ2Y8jc3jDDkR67es_mNuAqw', subzone: '111',  pCityId: '58' },
  3: { key: 'mumbai',    pName: 'Mumbai',    pState: 'maharashtra', placeId: 'ChIJLRxpsh_I5zsR-oxj6sW1ZmM', subzone: '2117', pCityId: '20' },
  4: { key: 'bengaluru', pName: 'Bengaluru', pState: 'karnataka',   placeId: 'ChIJ0yIIfcQWrjsR5lDZQOy0ZCM', subzone: '5405', pCityId: '4' },
  6: { key: 'hyderabad', pName: 'Hyderabad', pState: 'telangana',   placeId: 'ChIJY9_EyNiZyzsRSgkedoAUinI', subzone: '7001', pCityId: '12' },
  5: { key: 'pune',      pName: 'Pune',      pState: 'maharashtra', placeId: 'ChIJsz3nt3zAwjsRoIMu5FN1Cco', subzone: '3009', pCityId: '23' },
};

async function fetchDistrictCity(city) {
  const meta = CITY_META[city.city_id];

  const headers = {
    'content-type': 'application/json',
    'origin': 'https://www.district.in',
    'referer': 'https://www.district.in/events/',
    'x-app-type': 'ed_web',
    'x-app-version': '11.11.1',
    'x-client-id': 'district-web',
    'x-city-id': String(city.city_id),
    'x-city-key': meta.key,
    'x-city-name': city.name,
    'x-country-id': '1',
    'x-gps-lat': String(city.lat),
    'x-gps-lng': String(city.lng),
    'x-user-lat': String(city.lat),
    'x-user-lng': String(city.lng),
    'x-is-events-supported': 'true',
    'x-is-movies-supported': 'true',
    'x-available-tabs': 'movies,events,dining,shopping,attraction,play,comedy',
    'x-place-id': meta.placeId,
    'x-place-type': 'GOOGLE_PLACE',
    'x-pcity-id': meta.pCityId,
    'x-pcity-key': meta.key,
    'x-pcity-name': meta.pName,
    'x-pstate-key': meta.pState,
    'x-subzone-id': meta.subzone,
    'x-device-id': '1212', // required — omitting causes 401 "Access token not found"
    'x-guest-token': '1212', // required — same as above
  };

  const body = {
    layout_type: 'events_home_v2',
    location: {
      city_id: city.city_id,
      user_lat: city.lat,
      user_lng: city.lng,
      gps_lat: city.lat,
      gps_lng: city.lng,
    },
    request_type: 'tab_switch',
  };

 try {
    const res = await axios.post(
      'https://www.district.in/gw/web/get_discovery_results',
      body,
      { headers, timeout: 10000, validateStatus: () => true }
    );
    console.log(`District / ${city.name}: HTTP ${res.status}`);
    if (city.name === 'Delhi' && res.status === 200) {
      writeFileSync('district_sample.json', JSON.stringify(res.data, null, 2));
    }
    if (res.status !== 200) {
      console.log(`  -> response snippet:`, JSON.stringify(res.data).slice(0, 300));
    }
    return { city: city.name, status: res.status, data: res.data };
  } catch (err) {
    console.log(`District / ${city.name}: ERROR - ${err.message}`);
    return { city: city.name, status: null, error: err.message };
  }
}

async function testAllCities() {
  const results = [];
  for (const city of CITIES) {
    const r = await fetchDistrictCity(city);
    results.push(r);
    await new Promise(r => setTimeout(r, 800));
  }
  return results;
}

testAllCities().then(results => {
  console.log('\n=== SUMMARY ===');
  results.forEach(r => console.log(`${r.city}: ${r.status ?? 'ERROR'}`));
});

export { fetchDistrictCity, testAllCities, CITIES };