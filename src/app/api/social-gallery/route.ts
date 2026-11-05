import { NextResponse } from "next/server";
import { storeReadDocument } from "@/lib/firebase/firestore-store";
import { DEFAULT_SOCIAL_GALLERY } from "@/constants/social-gallery";
import type { AdminAppSettings } from "@/types/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const raw = await storeReadDocument<AdminAppSettings>("settings", "global");
    const socialGallery = raw?.socialGallery && raw.socialGallery.photos && raw.socialGallery.photos.length > 0
      ? raw.socialGallery
      : DEFAULT_SOCIAL_GALLERY;

    return NextResponse.json(
      { success: true, socialGallery },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("[api/social-gallery] Error fetching settings:", error);
    return NextResponse.json({ success: true, socialGallery: DEFAULT_SOCIAL_GALLERY });
  }
}
