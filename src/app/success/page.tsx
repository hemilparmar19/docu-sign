import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-md">
        <div className="text-green-500 text-6xl mb-4">&#10003;</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Document Signed Successfully!
        </h1>
        <p className="text-gray-600 mb-6">
          The signed document has been sent to both parties via email. You can
          safely close this page.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sign Another Document
        </Link>
      </div>
    </div>
  );
}
