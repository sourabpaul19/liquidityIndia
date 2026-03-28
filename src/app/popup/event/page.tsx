'use client';
import Link from 'next/link';

export default function EventPopup() {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-white p-6">
      <h1 className="text-2xl font-semibold mb-4">Contact Popup</h1>
      <Link href="/" className="bg-gray-800 text-white px-4 py-2 rounded">
        Close Popup
      </Link>
    </div>
  );
}
