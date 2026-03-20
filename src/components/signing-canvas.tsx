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
    const dataUrl = sigCanvasRef.current?.toDataURL("image/png");
    if (dataUrl) {
      onSign(dataUrl);
    }
  }, [onSign]);

  return (
    <div className="space-y-3">
      <div
        className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white relative"
        style={{ width, height }}
      >
        <SignatureCanvas
          ref={sigCanvasRef}
          canvasProps={{
            width,
            height,
            className: "signature-canvas cursor-crosshair",
          }}
          backgroundColor="rgba(255, 255, 255, 0)"
          penColor="#1e3a5f"
        />
        <div className="absolute bottom-3 left-3 right-3 border-b border-gray-300 pointer-events-none" />
        <span className="absolute bottom-1 left-3 text-[10px] text-gray-300 pointer-events-none select-none">
          Draw your signature above this line
        </span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={disabled}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Confirm Signature
        </button>
      </div>
    </div>
  );
}
