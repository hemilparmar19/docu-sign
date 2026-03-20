"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PdfViewerProps {
  file: File | string;
  pageNumber?: number;
  width?: number;
  onLoadSuccess?: (numPages: number) => void;
  onPageRenderSuccess?: (page: { width: number; height: number }) => void;
  overlay?: React.ReactNode;
}

export default function PdfViewer({
  file,
  pageNumber = 1,
  width = 612,
  onLoadSuccess,
  onPageRenderSuccess,
  overlay,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);

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

  return (
    <div className="relative inline-block">
      <Document
        file={file}
        onLoadSuccess={handleLoadSuccess}
        loading={
          <div className="flex items-center justify-center h-[792px] w-[612px] bg-white border rounded-lg">
            <p className="text-gray-400">Loading PDF...</p>
          </div>
        }
      >
        <Page
          pageNumber={pageNumber}
          width={width}
          onRenderSuccess={handlePageRenderSuccess}
          renderTextLayer={true}
          renderAnnotationLayer={true}
        />
      </Document>
      {overlay && (
        <div className="absolute inset-0" style={{ width, height: "100%" }}>
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
