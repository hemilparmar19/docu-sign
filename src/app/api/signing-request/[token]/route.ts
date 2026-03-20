import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const signingRequest = await prisma.signingRequest.findUnique({
      where: { token: params.token },
    });

    if (!signingRequest) {
      return NextResponse.json(
        { error: "Signing request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(signingRequest);
  } catch (error) {
    console.error("Error fetching signing request:", error);
    return NextResponse.json(
      { error: "Failed to fetch signing request" },
      { status: 500 }
    );
  }
}
