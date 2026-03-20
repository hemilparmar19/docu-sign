"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import SignaturePlacer from "./signature-placer";

const PdfViewer = dynamic(() => import("./pdf-viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[792px] w-[612px] bg-white border rounded-lg">
      <p className="text-gray-400">Loading PDF viewer...</p>
    </div>
  ),
});

interface SignaturePlacement {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [senderEmail, setSenderEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pageDimensions, setPageDimensions] = useState({
    width: 612,
    height: 792,
  });
  const [placement, setPlacement] = useState<SignaturePlacement>({
    x: 50,
    y: 600,
    width: 200,
    height: 60,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile && selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setCurrentPage(1);
      } else {
        toast.error("Please select a valid PDF file");
      }
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please upload a PDF file");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("senderEmail", senderEmail);
      formData.append("recipientName", recipientName);
      formData.append("recipientEmail", recipientEmail);
      formData.append("signatureX", placement.x.toString());
      formData.append("signatureY", placement.y.toString());
      formData.append("signatureWidth", placement.width.toString());
      formData.append("signatureHeight", placement.height.toString());
      formData.append("signaturePage", (currentPage - 1).toString());

      const response = await fetch("/api/signing-request", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      toast.success("Signing request sent successfully!");
      setFile(null);
      setSenderEmail("");
      setRecipientName("");
      setRecipientEmail("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send signing request"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Sender & Recipient Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Email
          </label>
          <input
            type="email"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="sender@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Name
          </label>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Email
          </label>
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="recipient@example.com"
          />
        </div>
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Upload PDF Document
        </label>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* PDF Preview with Signature Placer */}
      {file && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Drag and resize the blue box to set where the recipient should sign:
          </p>

          {/* Page Navigation */}
          {numPages > 1 && (
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {numPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((p) => Math.min(numPages, p + 1))
                }
                disabled={currentPage >= numPages}
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}

          <div
            className="border rounded-lg inline-block relative bg-white shadow-sm"
            style={{
              width: pageDimensions.width,
              height: pageDimensions.height,
            }}
          >
            <PdfViewer
              file={file}
              pageNumber={currentPage}
              width={612}
              onLoadSuccess={setNumPages}
              onPageRenderSuccess={(dims) => setPageDimensions(dims)}
              overlay={
                <SignaturePlacer
                  placement={placement}
                  onPlacementChange={setPlacement}
                />
              }
            />
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Signature position: ({Math.round(placement.x)},{" "}
            {Math.round(placement.y)}) — Size: {Math.round(placement.width)} x{" "}
            {Math.round(placement.height)} — Page: {currentPage}
          </p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || !file}
        className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? "Sending..." : "Send Signing Request"}
      </button>
    </form>
  );
}
