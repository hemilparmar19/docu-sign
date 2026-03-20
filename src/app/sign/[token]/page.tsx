"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import SigningCanvas from "@/components/signing-canvas";

const PDF_BASE_WIDTH = 612;

const PdfViewer = dynamic(() => import("@/components/pdf-viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center aspect-[612/792] w-full max-w-[612px] bg-white border rounded-lg">
      <p className="text-gray-400">Loading PDF...</p>
    </div>
  ),
});

interface SigningRequest {
  id: string;
  token: string;
  senderEmail: string;
  recipientName: string;
  recipientEmail: string;
  pdfUrl: string;
  signatureX: number;
  signatureY: number;
  signatureWidth: number;
  signatureHeight: number;
  signaturePage: number;
  status: string;
}

export default function SignPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [request, setRequest] = useState<SigningRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pdfRenderWidth, setPdfRenderWidth] = useState(PDF_BASE_WIDTH);
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRequest() {
      try {
        const res = await fetch(`/api/signing-request/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Signing request not found");
          return;
        }

        if (data.status === "COMPLETED") {
          setError("This document has already been signed.");
          return;
        }

        setRequest(data);
      } catch {
        setError("Failed to load signing request");
      } finally {
        setLoading(false);
      }
    }

    fetchRequest();
  }, [token]);

  const handleSignatureCapture = useCallback((dataUrl: string) => {
    setSignatureDataUrl(dataUrl);
    setSignatureConfirmed(true);
  }, []);

  const handleSubmitSignature = useCallback(async () => {
    if (!signatureDataUrl) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: signatureDataUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sign document");
      }

      toast.success("Document signed successfully!");
      router.push("/success");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to sign document"
      );
    } finally {
      setSubmitting(false);
    }
  }, [token, router, signatureDataUrl]);

  const handleResetSignature = useCallback(() => {
    setSignatureConfirmed(false);
    setSignatureDataUrl(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Document
          </h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!request) return null;

  const isSignaturePage = currentPage === request.signaturePage + 1;
  const scale = pdfRenderWidth / PDF_BASE_WIDTH;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Sign Document</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Hi {request.recipientName}, please review the document and sign on
          page {request.signaturePage + 1}.
        </p>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Requested by {request.senderEmail}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 space-y-6">
        {/* Document Preview */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-medium text-gray-800">
              Document Preview
            </h2>
            {numPages > 1 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 min-w-[80px] text-center">
                  Page {currentPage} of {numPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(numPages, p + 1))
                  }
                  disabled={currentPage >= numPages}
                  className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Go to signature page shortcut */}
          {numPages > 1 && !isSignaturePage && (
            <button
              type="button"
              onClick={() => setCurrentPage(request.signaturePage + 1)}
              className="mb-3 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Jump to signature page (page {request.signaturePage + 1})
            </button>
          )}

          <div className="border rounded-lg overflow-hidden">
            <PdfViewer
              file={`/api/pdf/${token}`}
              pageNumber={currentPage}
              maxWidth={PDF_BASE_WIDTH}
              onLoadSuccess={setNumPages}
              onWidthChange={setPdfRenderWidth}
              overlay={
                isSignaturePage ? (
                  <div
                    className="absolute border-2 border-dashed border-orange-500 bg-orange-500/10 rounded flex items-center justify-center"
                    style={{
                      left: request.signatureX * scale,
                      top: request.signatureY * scale,
                      width: request.signatureWidth * scale,
                      height: request.signatureHeight * scale,
                    }}
                  >
                    <span className="text-orange-600 text-xs font-medium">
                      Sign Here
                    </span>
                  </div>
                ) : undefined
              }
            />
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-200" />

        {/* Signature Section */}
        <div>
          <h2 className="text-lg font-medium text-gray-800 mb-1">
            Your Signature
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Draw your signature below. It will be placed on page{" "}
            {request.signaturePage + 1} at the highlighted area.
          </p>

          {!signatureConfirmed ? (
            <SigningCanvas
              onSign={handleSignatureCapture}
              disabled={submitting}
            />
          ) : (
            <div className="space-y-4">
              {/* Signature preview */}
              <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
                <p className="text-sm text-green-700 font-medium mb-2">
                  Signature captured
                </p>
                <img
                  src={signatureDataUrl!}
                  alt="Your signature"
                  className="max-h-[100px] max-w-full bg-white rounded border p-2"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleResetSignature}
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Redo Signature
                </button>
                <button
                  type="button"
                  onClick={handleSubmitSignature}
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Signing...
                    </>
                  ) : (
                    "Sign & Submit Document"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
