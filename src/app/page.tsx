import dynamic from "next/dynamic";

const UploadForm = dynamic(() => import("@/components/upload-form"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-48">
      <p className="text-gray-400">Loading...</p>
    </div>
  ),
});

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">DocuSign</h1>
        <p className="text-gray-600 mt-2">
          Upload a document, place the signature area, and send it for signing.
        </p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <UploadForm />
      </div>
    </div>
  );
}
