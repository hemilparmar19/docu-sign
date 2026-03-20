"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

interface PdfViewerProps {
  file: File | string;
  pageNumber?: number;
  maxWidth?: number;
  onLoadSuccess?: (numPages: number) => void;
  onPageRenderSuccess?: (page: { width: number; height: number }) => void;
  onWidthChange?: (width: number) => void;
  overlay?: React.ReactNode;
}

export default function PdfViewer({
  file,
  pageNumber = 1,
  maxWidth = 612,
  onLoadSuccess,
  onPageRenderSuccess,
  onWidthChange,
  overlay,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderWidth, setRenderWidth] = useState(maxWidth);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const w = Math.min(el.clientWidth, maxWidth);
      if (w > 0) {
        setRenderWidth(w);
        onWidthChange?.(w);
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [maxWidth, onWidthChange]);

  const handleLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      onLoadSuccess?.(numPages);
    },
    [onLoadSuccess]
  );

  const handlePageRenderSuccess = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (page: any) => {
      onPageRenderSuccess?.({
        width: page.width,
        height: page.height,
      });
    },
    [onPageRenderSuccess]
  );

  const aspectRatio = 792 / 612;
  const placeholderHeight = Math.round(renderWidth * aspectRatio);

  return (
    <div ref={containerRef} className="relative w-full" style={{ maxWidth }}>
      <Document
        file={file}
        onLoadSuccess={handleLoadSuccess}
        onLoadError={(error) => console.error("PDF load error:", error)}
        loading={
          <div
            className="flex items-center justify-center bg-white border rounded-lg w-full"
            style={{ height: placeholderHeight }}
          >
            <p className="text-gray-400">Loading PDF...</p>
          </div>
        }
        error={
          <div
            className="flex items-center justify-center bg-white border rounded-lg w-full"
            style={{ height: placeholderHeight }}
          >
            <p className="text-red-500">Failed to load PDF file.</p>
          </div>
        }
      >
        <Page
          pageNumber={pageNumber}
          width={renderWidth}
          onRenderSuccess={handlePageRenderSuccess}
          renderTextLayer={true}
          renderAnnotationLayer={true}
        />
      </Document>
      {overlay && (
        <div className="absolute inset-0">
          {overlay}
        </div>
      )}
      {numPages > 1 && (
        <p className="text-center text-sm text-gray-500 mt-2">
          Page {pageNumber} of {numPages}
        </p>
      )}
    </div>
  );
}
