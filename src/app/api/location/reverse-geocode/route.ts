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
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(3000),
        });
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
            data: parsedAddress,
          });
        }
      } catch (err) {
        console.warn("[reverse-geocode] Google Maps API error, falling back:", err);
      }
    }

    // 2. High-speed, multi-tier fallback (Photon / BigDataCloud)
    try {
      const photonRes = await fetch(
        `https://photon.komoot.io/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`,
        {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(4000),
        }
      );
      if (photonRes.ok) {
        const pData = await photonRes.json();
        const props = pData?.features?.[0]?.properties;
        if (props) {
          const streetParts = [props.name, props.street, props.locality].filter(Boolean).join(", ");
          const city = props.city || props.town || props.village || props.county || "Mumbai";
          const state = props.state || "Maharashtra";
          const postalCode = (props.postcode || "").toString().replace(/\D/g, "").slice(0, 6);

          const parsedAddress: GeocodeAddressResult = {
            street: streetParts || props.street || "Detected Location",
            apartment: props.locality || "",
            area: props.district || props.locality || "",
            city,
            state,
            postalCode: postalCode || "400001",
            country: props.country || "India",
            formattedAddress: `${streetParts}, ${city}, ${state} ${postalCode}`,
          };

          return NextResponse.json({
            success: true,
            provider: "photon",
            address: parsedAddress,
            data: parsedAddress,
          });
        }
      }
    } catch (photonErr) {
      console.warn("[reverse-geocode] Photon error, trying BigDataCloud:", photonErr);
    }

    // 3. BigDataCloud Fallback
    try {
      const bdcRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&localityLanguage=en`,
        {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(4000),
        }
      );
      if (bdcRes.ok) {
        const bdc = await bdcRes.json();
        const city = bdc.city || bdc.locality || "Mumbai";
        const state = bdc.principalSubdivision || "Maharashtra";
        let postalCode = (bdc.postcode || "").toString().replace(/\D/g, "").slice(0, 6);
        if (!postalCode && Array.isArray(bdc?.localityInfo?.informative)) {
          for (const item of bdc.localityInfo.informative) {
            if (/^\d{6}$/.test(item?.name)) {
              postalCode = item.name.slice(0, 6);
              break;
            }
          }
        }

        const parsedAddress: GeocodeAddressResult = {
          street: city ? `${city} Area` : "Detected Location",
          apartment: "",
          area: bdc.locality || "",
          city,
          state,
          postalCode: postalCode || "400001",
          country: bdc.countryName || "India",
          formattedAddress: `${city}, ${state} ${postalCode}`,
        };

        return NextResponse.json({
          success: true,
          provider: "bigdatacloud",
          address: parsedAddress,
          data: parsedAddress,
        });
      }
    } catch (bdcErr) {
      console.warn("[reverse-geocode] BigDataCloud error:", bdcErr);
    }

    // 4. Fallback based on known coordinates
    const fallbackAddress: GeocodeAddressResult = {
      street: "Detected GPS Location",
      area: "",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
      country: "India",
      formattedAddress: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    };

    return NextResponse.json({
      success: true,
      provider: "coordinate_fallback",
      address: fallbackAddress,
      data: fallbackAddress,
    });
  } catch (error: any) {
    console.error("[reverse-geocode] Exception:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to reverse geocode location" },
      { status: 500 }
    );
  }
}
