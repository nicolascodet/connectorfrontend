"use client";

import { Suspense } from "react";
import CompleteSignupForm from "./CompleteSignupForm";

export default function CompleteSignupPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </main>
    }>
      <CompleteSignupForm />
    </Suspense>
  );
}
