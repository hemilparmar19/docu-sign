"use client";

import { useRef, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";

interface SigningCanvasProps {
  width: number;
  height: number;
  onSign: (signatureDataUrl: string) => void;
  disabled?: boolean;
}

export default function SigningCanvas({
  width,
  height,
  onSign,
  disabled = false,
}: SigningCanvasProps) {
  const sigCanvasRef = useRef<SignatureCanvas>(null);

  const handleClear = useCallback(() => {
    sigCanvasRef.current?.clear();
  }, []);

  const handleConfirm = useCallback(() => {
    if (sigCanvasRef.current?.isEmpty()) {
      return;
    }
    const dataUrl = sigCanvasRef.current
      ?.getTrimmedCanvas()
      .toDataURL("image/png");
    if (dataUrl) {
      onSign(dataUrl);
    }
  }, [onSign]);

  return (
    <div className="space-y-3">
      <div
        className="border-2 border-blue-500 rounded-lg overflow-hidden bg-white"
        style={{ width, height }}
      >
        <SignatureCanvas
          ref={sigCanvasRef}
          canvasProps={{
            width,
            height,
            className: "signature-canvas",
          }}
          backgroundColor="rgba(255, 255, 255, 0)"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={disabled}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Confirm Signature
        </button>
      </div>
    </div>
  );
}
