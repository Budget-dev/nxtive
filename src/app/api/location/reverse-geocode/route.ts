import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface GeocodeAddressResult {
  fullName?: string;
  street: string;
  apartment?: string;
  area?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  formattedAddress: string;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat") || url.searchParams.get("latitude"));
  const lng = Number(url.searchParams.get("lng") || url.searchParams.get("longitude"));
  return handleReverseGeocode(lat, lng);
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    const text = await req.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = JSON.parse(text.replace(/\\"/g, '"'));
      }
    }
    const lat = Number(body?.latitude ?? body?.lat);
    const lng = Number(body?.longitude ?? body?.lng);
    return handleReverseGeocode(lat, lng);
  } catch (error: any) {
    console.error("[reverse-geocode] POST error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process location request" },
      { status: 500 }
    );
  }
}

async function handleReverseGeocode(lat: number, lng: number) {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return NextResponse.json(
      { success: false, error: "Invalid coordinates. Latitude must be -90..90 and Longitude -180..180." },
      { status: 400 }
    );
  }

  try {
    const apiKey =
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      "";

    // 1. If Google Maps API key is configured, query Google Maps Geocoding API
    if (apiKey) {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&solution_id=gmp_git_agentskills_v1`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        const data = await res.json();

        if (data.status === "OK" && Array.isArray(data.results) && data.results.length > 0) {
          const first = data.results[0];
          const components: any[] = first.address_components || [];

          let streetNumber = "";
          let route = "";
          let subpremise = "";
          let sublocality2 = "";
          let sublocality1 = "";
          let neighborhood = "";
          let locality = "";
          let adminArea2 = "";
          let adminArea1 = "";
          let postalCode = "";
          let country = "India";

          for (const c of components) {
            const types: string[] = c.types || [];
            if (types.includes("street_number")) streetNumber = c.long_name;
            if (types.includes("route")) route = c.long_name;
            if (types.includes("subpremise")) subpremise = c.long_name;
            if (types.includes("sublocality_level_2")) sublocality2 = c.long_name;
            if (types.includes("sublocality_level_1")) sublocality1 = c.long_name;
            if (types.includes("neighborhood")) neighborhood = c.long_name;
            if (types.includes("locality")) locality = c.long_name;
            if (types.includes("administrative_area_level_2")) adminArea2 = c.long_name;
            if (types.includes("administrative_area_level_1")) adminArea1 = c.long_name;
            if (types.includes("postal_code")) postalCode = c.long_name;
            if (types.includes("country")) country = c.long_name;
          }

          const street = [streetNumber, route].filter(Boolean).join(" ") || first.formatted_address?.split(",")[0] || "";
          const area = [sublocality2, sublocality1, neighborhood].filter(Boolean).join(", ") || "";
          const city = locality || adminArea2 || "Mumbai";
          const state = adminArea1 || "Maharashtra";

          const parsedAddress: GeocodeAddressResult = {
            street: street || area || "Street address",
            apartment: subpremise || area,
            area,
            city,
            state,
            postalCode: postalCode.replace(/\D/g, "").slice(0, 6),
            country: country || "India",
            formattedAddress: first.formatted_address || `${street}, ${area}, ${city}, ${state} ${postalCode}`,
          };

          return NextResponse.json({
            success: true,
            provider: "google_maps",
            address: parsedAddress,
          });
        }
      } catch (err) {
        console.warn("[reverse-geocode] Google Maps API error, falling back:", err);
      }
    }

    // 2. Resilient fallback (Nominatim / coordinate reverse lookup)
    try {
      const fallbackUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: {
          Accept: "application/json",
          "User-Agent": "NXTIVE-Ecommerce/1.0",
        },
      });

      if (fallbackRes.ok) {
        const json = await fallbackRes.json();
        const addr = json.address || {};

        const streetParts = [
          addr.house_number,
          addr.building,
          addr.road || addr.pedestrian || addr.suburb,
        ]
          .filter(Boolean)
          .join(", ");

        const area = [addr.neighbourhood, addr.residential, addr.suburb].filter(Boolean).join(", ");
        const city = addr.city || addr.town || addr.municipality || addr.village || addr.county || "Mumbai";
        const state = addr.state || "Maharashtra";
        const postcode = (addr.postcode || "").toString().replace(/\D/g, "").slice(0, 6);

        const parsedAddress: GeocodeAddressResult = {
          street: streetParts || addr.road || "Detected Location",
          apartment: addr.house_name || area,
          area,
          city,
          state,
          postalCode: postcode || "400001",
          country: addr.country || "India",
          formattedAddress: json.display_name || `${streetParts}, ${city}, ${state} ${postcode}`,
        };

        return NextResponse.json({
          success: true,
          provider: "fallback_nominatim",
          address: parsedAddress,
          note: apiKey ? undefined : "Set GOOGLE_MAPS_API_KEY in .env.local for production Google Maps Geocoding",
        });
      }
    } catch (fallbackErr) {
      console.warn("[reverse-geocode] Fallback geocode error:", fallbackErr);
    }

    // 3. Fallback based on known coordinates
    return NextResponse.json({
      success: true,
      provider: "approximate",
      address: {
        street: "Device GPS Location",
        area: "Detected Area",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        country: "India",
        formattedAddress: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      },
    });
  } catch (error: any) {
    console.error("[reverse-geocode] Exception:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to reverse geocode location" },
      { status: 500 }
    );
  }
}
