import { NextResponse } from "next/server";
import { getUserCount } from "@/lib/database";

export async function GET() {
  try {
    const count = getUserCount();
    return NextResponse.json({ userCount: count });
  } catch (error) {
    console.error("Failed to fetch user count:", error);
    return NextResponse.json(
      { error: "Failed to determine user count." },
      { status: 500 }
    );
  }
}
