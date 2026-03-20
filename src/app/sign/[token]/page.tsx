"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import PdfViewer from "@/components/pdf-viewer";
import SigningCanvas from "@/components/signing-canvas";

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

  const handleSign = useCallback(
    async (signatureDataUrl: string) => {
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
    },
    [token, router]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Sign Document</h1>
        <p className="text-gray-600 mt-1">
          Hi {request.recipientName}, please review and sign the document below.
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Requested by {request.senderEmail}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        {/* PDF Preview with highlighted signature area */}
        <div>
          <h2 className="text-lg font-medium text-gray-800 mb-3">
            Document Preview
          </h2>
          <div className="border rounded-lg overflow-hidden inline-block relative">
            <PdfViewer
              file={request.pdfUrl}
              pageNumber={request.signaturePage + 1}
              width={612}
              overlay={
                <div
                  className="absolute border-2 border-dashed border-orange-500 bg-orange-500/10 rounded flex items-center justify-center"
                  style={{
                    left: request.signatureX,
                    top: request.signatureY,
                    width: request.signatureWidth,
                    height: request.signatureHeight,
                  }}
                >
                  <span className="text-orange-600 text-xs font-medium">
                    Sign Here
                  </span>
                </div>
              }
            />
          </div>
        </div>

        {/* Signature Canvas */}
        <div>
          <h2 className="text-lg font-medium text-gray-800 mb-3">
            Draw Your Signature
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            Draw your signature in the box below, then click &quot;Confirm
            Signature&quot; to sign the document.
          </p>
          <SigningCanvas
            width={Math.max(200, Math.round(request.signatureWidth * 2))}
            height={Math.max(80, Math.round(request.signatureHeight * 2))}
            onSign={handleSign}
            disabled={submitting}
          />
          {submitting && (
            <p className="text-sm text-blue-600 mt-2 flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              Signing document and sending emails...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
