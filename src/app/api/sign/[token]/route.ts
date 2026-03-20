import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { getResend } from "@/lib/resend";
import { overlaySignatureOnPdf } from "@/lib/pdf";

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { signature } = await request.json();

    if (!signature) {
      return NextResponse.json(
        { error: "Signature is required" },
        { status: 400 }
      );
    }

    // Fetch signing request
    const signingRequest = await prisma.signingRequest.findUnique({
      where: { token: params.token },
    });

    if (!signingRequest) {
      return NextResponse.json(
        { error: "Signing request not found" },
        { status: 404 }
      );
    }

    if (signingRequest.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Document has already been signed" },
        { status: 400 }
      );
    }

    // Download original PDF from Vercel Blob
    const pdfResponse = await fetch(signingRequest.pdfUrl);
    const pdfBytes = new Uint8Array(await pdfResponse.arrayBuffer());

    // Decode base64 signature to bytes
    const signatureBase64 = signature.replace(
      /^data:image\/png;base64,/,
      ""
    );
    const signatureBytes = Uint8Array.from(atob(signatureBase64), (c) =>
      c.charCodeAt(0)
    );

    // Overlay signature on PDF
    const signedPdfBytes = await overlaySignatureOnPdf({
      pdfBytes,
      signatureImageBytes: signatureBytes,
      x: signingRequest.signatureX,
      y: signingRequest.signatureY,
      width: signingRequest.signatureWidth,
      height: signingRequest.signatureHeight,
      pageIndex: signingRequest.signaturePage,
    });

    // Upload signed PDF to Vercel Blob
    const signedPdfBuffer = Buffer.from(signedPdfBytes);
    const signedBlob = await put(
      `signed/${nanoid()}-signed.pdf`,
      signedPdfBuffer,
      { access: "public" }
    );

    // Update database
    await prisma.signingRequest.update({
      where: { token: params.token },
      data: {
        signedPdfUrl: signedBlob.url,
        status: "COMPLETED",
      },
    });

    await getResend().emails.send({
      from: "DocuSign <onboarding@resend.dev>",
      to: [signingRequest.senderEmail, signingRequest.recipientEmail],
      subject: "Signed Document - Completed",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Document Signed Successfully</h2>
          <p>The document has been signed by <strong>${signingRequest.recipientName}</strong>.</p>
          <p>The signed PDF is attached to this email.</p>
          <p style="color: #6b7280; font-size: 14px;">You can also <a href="${signedBlob.url}">download it here</a>.</p>
        </div>
      `,
      attachments: [
        {
          filename: "signed-document.pdf",
          content: signedPdfBuffer,
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error signing document:", error);
    return NextResponse.json(
      { error: "Failed to sign document" },
      { status: 500 }
    );
  }
}
