import { PDFDocument } from "pdf-lib";

interface OverlayOptions {
  pdfBytes: Uint8Array;
  signatureImageBytes: Uint8Array;
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
}

export async function overlaySignatureOnPdf({
  pdfBytes,
  signatureImageBytes,
  x,
  y,
  width,
  height,
  pageIndex,
}: OverlayOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

  const page = pdfDoc.getPages()[pageIndex];
  const { height: pageHeight } = page.getSize();

  // Convert from top-left origin (browser) to bottom-left origin (PDF)
  const pdfY = pageHeight - y - height;

  page.drawImage(signatureImage, {
    x,
    y: pdfY,
    width,
    height,
  });

  return pdfDoc.save();
}
