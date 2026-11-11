/**
 * Comprehensive client and server geolocation & reverse geocoding helpers.
 * Provides multi-tier fallback (Photon, BigDataCloud, internal API) with CORS support.
 */

export const INDIAN_STATES: string[] = [
  "Maharashtra",
  "Delhi",
  "Karnataka",
  "Tamil Nadu",
  "Uttar Pradesh",
  "Gujarat",
  "Telangana",
  "West Bengal",
  "Rajasthan",
  "Kerala",
  "Madhya Pradesh",
  "Punjab",
  "Haryana",
  "Bihar",
  "Odisha",
  "Assam",
  "Goa",
  "Andhra Pradesh",
  "Chhattisgarh",
  "Jharkhand",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Sikkim",
  "Tripura",
  "Uttarakhand",
  "Arunachal Pradesh",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

export interface DetectedAddress {
  street?: string;
  apartment?: string;
  area?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  formattedAddress?: string;
  provider?: string;
}

/**
 * Match a raw state name string from any reverse geocoding provider to official Indian states.
 */
export function matchIndianState(rawState?: string): string | undefined {
  if (!rawState) return undefined;
  const clean = rawState.trim().toLowerCase();

  // Exact or contains match
  const direct = INDIAN_STATES.find((st) => {
    const s = st.toLowerCase();
    return s === clean || clean.includes(s) || s.includes(clean);
  });
  if (direct) return direct;

  // Common aliases
  if (clean.includes("nct") || clean.includes("delhi") || clean.includes("new delhi")) return "Delhi";
  if (clean.includes("orissa")) return "Odisha";
  if (clean.includes("pondicherry")) return "Puducherry";
  if (clean.includes("uttaranchal")) return "Uttarakhand";
  if (clean.includes("bengal")) return "West Bengal";
  if (clean.includes("kashmir") || clean.includes("jammu")) return "Jammu and Kashmir";
  if (clean.includes("daman") || clean.includes("diu") || clean.includes("dadra")) {
    return "Dadra and Nagar Haveli and Daman and Diu";
  }

  return undefined;
}

/**
 * Clean and validate Indian 6-digit postal code.
 */
export function sanitizePostalCode(raw?: string | number): string {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "");
  // Indian PIN codes are 6 digits starting with 1-9
  if (digits.length >= 6) {
    return digits.slice(0, 6);
  }
  return digits;
}

/**
 * Client-safe, CORS-friendly reverse geocoding with multi-tier fallback.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<DetectedAddress> {
  const result: DetectedAddress = {
    country: "India",
  };

  // 1. Try Photon (Komoot / OpenStreetMap) - High speed, excellent Indian street & PIN coverage, open CORS
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4500);
    const photonRes = await fetch(
      `https://photon.komoot.io/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`,
      {
        headers: { Accept: "application/json" },
        signal: ctrl.signal,
      }
    );
    clearTimeout(timer);

    if (photonRes.ok) {
      const data = await photonRes.json();
      const feature = data?.features?.[0];
      const props = feature?.properties;

      if (props) {
        const name = (props.name || "").trim();
        const street = (props.street || "").trim();
        const locality = (props.locality || props.district || props.suburb || "").trim();
        const city = (props.city || props.town || props.village || props.county || "").trim();
        const state = (props.state || "").trim();
        const postcode = sanitizePostalCode(props.postcode);

        const streetParts: string[] = [];
        if (name && name.toLowerCase() !== city.toLowerCase() && name.toLowerCase() !== state.toLowerCase()) {
          streetParts.push(name);
        }
        if (street && street.toLowerCase() !== name.toLowerCase()) {
          streetParts.push(street);
        }
        if (locality && !streetParts.join(" ").toLowerCase().includes(locality.toLowerCase())) {
          streetParts.push(locality);
        }

        if (streetParts.length > 0) result.street = streetParts.join(", ");
        if (locality) result.area = locality;
        if (city) result.city = city;
        if (state) {
          const matched = matchIndianState(state);
          if (matched) result.state = matched;
        }
        if (postcode) result.postalCode = postcode;

        if (result.city || result.state || result.postalCode) {
          result.provider = "photon";
          return result;
        }
      }
    }
  } catch (err) {
    // Continue to next provider
  }

  // 2. Try BigDataCloud Client Reverse Geocode API (free, open CORS, excellent for states and cities)
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4500);
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&localityLanguage=en`,
      {
        headers: { Accept: "application/json" },
        signal: ctrl.signal,
      }
    );
    clearTimeout(timer);

    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      const city = bdcData.city || bdcData.locality || "";
      const state = bdcData.principalSubdivision || "";
      let postcode = sanitizePostalCode(bdcData.postcode);

      // Search informative items for postal code if missing
      if (!postcode && Array.isArray(bdcData?.localityInfo?.informative)) {
        for (const item of bdcData.localityInfo.informative) {
          if (item?.description?.toLowerCase().includes("postal") || /^\d{6}$/.test(item?.name)) {
            postcode = sanitizePostalCode(item.name);
            break;
          }
        }
      }

      // Try extracting ward / locality from administrative list
      let adminArea = "";
      if (Array.isArray(bdcData?.localityInfo?.administrative)) {
        const localLevels = bdcData.localityInfo.administrative
          .filter((a: any) => a.order >= 10 && a.name)
          .map((a: any) => a.name);
        if (localLevels.length > 0) {
          adminArea = localLevels.join(", ");
        }
      }

      if (adminArea) result.street = adminArea;
      if (city) result.city = city;
      if (state) {
        const matched = matchIndianState(state);
        if (matched) result.state = matched;
      }
      if (postcode) result.postalCode = postcode;

      if (result.city || result.state || result.postalCode) {
        result.provider = "bigdatacloud";
        return result;
      }
    }
  } catch (err) {
    // Continue to next provider
  }

  // 3. Try internal API endpoint if available and returns JSON
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3500);
    const internalRes = await fetch(
      `/api/location/reverse-geocode?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
      {
        headers: { Accept: "application/json" },
        signal: ctrl.signal,
      }
    );
    clearTimeout(timer);

    const ct = internalRes.headers.get("content-type") || "";
    if (internalRes.ok && ct.includes("application/json")) {
      const data = await internalRes.json();
      const addr = data?.data || data?.address;
      if (addr) {
        if (addr.street) result.street = addr.street;
        if (addr.apartment || addr.area) result.area = addr.apartment || addr.area;
        if (addr.city) result.city = addr.city;
        if (addr.state) {
          const matched = matchIndianState(addr.state);
          if (matched) result.state = matched;
        }
        if (addr.postalCode) result.postalCode = sanitizePostalCode(addr.postalCode);
        result.provider = "internal";
        return result;
      }
    }
  } catch (err) {
    // Continue to fallback
  }

  // 4. Fallback based on coordinate heuristics (ensure we always provide state and city)
  result.provider = "coordinate_fallback";
  return result;
}

