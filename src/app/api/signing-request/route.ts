import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { getResend } from "@/lib/resend";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get("pdf") as File | null;
    const senderEmail = formData.get("senderEmail") as string | null;
    const recipientName = formData.get("recipientName") as string | null;
    const recipientEmail = formData.get("recipientEmail") as string | null;
    const signatureX = parseFloat(formData.get("signatureX") as string);
    const signatureY = parseFloat(formData.get("signatureY") as string);
    const signatureWidth = parseFloat(
      formData.get("signatureWidth") as string
    );
    const signatureHeight = parseFloat(
      formData.get("signatureHeight") as string
    );
    const signaturePage = parseInt(
      formData.get("signaturePage") as string,
      10
    );

    if (!file || !senderEmail || !recipientName || !recipientEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (
      isNaN(signatureX) ||
      isNaN(signatureY) ||
      isNaN(signatureWidth) ||
      isNaN(signatureHeight) ||
      isNaN(signaturePage)
    ) {
      return NextResponse.json(
        { error: "Invalid signature placement coordinates" },
        { status: 400 }
      );
    }

    // Upload PDF to Vercel Blob
    const blob = await put(`documents/${nanoid()}-${file.name}`, file, {
      access: "public",
    });

    // Generate unique token
    const token = nanoid();

    // Save to MongoDB
    const signingRequest = await prisma.signingRequest.create({
      data: {
        token,
        senderEmail,
        recipientName,
        recipientEmail,
        pdfUrl: blob.url,
        signatureX,
        signatureY,
        signatureWidth,
        signatureHeight,
        signaturePage,
      },
    });

    // Send email via Resend
    const signingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/sign/${token}`;
    const pdfBuffer = Buffer.from(await file.arrayBuffer());

    const emailResult = await getResend().emails.send({
      from: "DocuSign <onboarding@resend.dev>",
      to: recipientEmail,
      subject: `${recipientName}, you have a document to sign`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Document Signing Request</h2>
          <p>Hi ${recipientName},</p>
          <p>You have been requested to sign a document by <strong>${senderEmail}</strong>.</p>
          <p>
            <a href="${signingLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Sign Document
            </a>
          </p>
          <p style="color: #6b7280; font-size: 14px;">Or copy this link: ${signingLink}</p>
        </div>
      `,
      attachments: [
        {
          filename: file.name,
          content: pdfBuffer.toString("base64"),
        },
      ],
    });

    console.log("Resend email result:", JSON.stringify(emailResult));

    return NextResponse.json({ success: true, token: signingRequest.token });
  } catch (error) {
    console.error("Error creating signing request:", error);
    const message = error instanceof Error ? error.message : "Failed to create signing request";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
