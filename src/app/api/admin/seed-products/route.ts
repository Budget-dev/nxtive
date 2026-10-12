import { NextResponse } from "next/server";

const disabledResponse = () =>
  NextResponse.json(
    {
      success: false,
      error: "Sample data seeding is disabled. Create records through the admin workflows.",
      dataState: "disabled",
    },
    { status: 410 }
  );

export async function GET() {
  return disabledResponse();
}

export async function POST() {
  return disabledResponse();
}
