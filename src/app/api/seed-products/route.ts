import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Sample data seeding is disabled. Create records through the admin workflows.",
      dataState: "disabled",
    },
    { status: 410 }
  );
}

export async function POST() {
  return GET();
}
