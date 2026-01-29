import { NextRequest, NextResponse } from "next/server";
import { getClearviewStoryById, isDBAvailable } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing story id" },
        { status: 400 }
      );
    }

    const dbAvailable = await isDBAvailable();
    if (!dbAvailable) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    const result = await getClearviewStoryById(id);

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Story not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      story: result.story,
      generatedAt: result.generatedAt,
    });
  } catch (error) {
    console.error("Story API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load story" },
      { status: 500 }
    );
  }
}
