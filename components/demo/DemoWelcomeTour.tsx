"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2, Sparkles, BarChart3, Zap, Brain } from "lucide-react";

interface DemoWelcomeTourProps {
  onComplete: () => void;
}

export default function DemoWelcomeTour({ onComplete }: DemoWelcomeTourProps) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      // Capture UTM parameters and referrer
      const urlParams = new URLSearchParams(window.location.search);
      const captureData = {
        email: email.toLowerCase().trim(),
        utm_source: urlParams.get("utm_source") || null,
        utm_medium: urlParams.get("utm_medium") || null,
        utm_campaign: urlParams.get("utm_campaign") || null,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
      };

      // Send to backend API to store in master Supabase
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/demo/capture-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(captureData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to capture email");
      }

      // Store email in localStorage to skip this flow next time
      localStorage.setItem("demo_email_captured", email);

      // Complete the tour
      onComplete();
    } catch (err) {
      console.error("Email capture error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <>
        {/* Dark overlay */}
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50" />

        {/* Welcome modal - centered */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-xl w-full pointer-events-auto relative">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <Brain className="h-10 w-10 text-white" />
              </div>
            </div>

            {/* Content */}
            <h1 className="text-3xl font-bold text-center mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to HighForce
            </h1>
            <p className="text-center text-gray-600 mb-8 text-lg">
              Transform scattered communications into actionable business intelligence
            </p>

            {/* Features grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <Sparkles className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">AI Search</p>
                <p className="text-xs text-gray-600 mt-1">Natural language</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Auto Insights</p>
                <p className="text-xs text-gray-600 mt-1">Daily reports</p>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-xl">
                <Zap className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Real-Time</p>
                <p className="text-xs text-gray-600 mt-1">Instant alerts</p>
              </div>
            </div>

            {/* CTA */}
            <Button
              onClick={() => setStep(2)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg"
              size="lg"
            >
              Start Tour
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (step === 2) {
    return (
      <>
        {/* Dark overlay */}
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50" />

        {/* How it works modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-xl w-full pointer-events-auto relative">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur opacity-30 animate-pulse"></div>
              </div>
            </div>

            {/* Content */}
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
              How It Works
            </h2>

            <div className="space-y-5 mb-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-lg">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Connect Your Data</h3>
                  <p className="text-gray-600 text-sm">Gmail, Outlook, Google Drive, QuickBooks - all in one place</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-600 text-lg">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">AI Analyzes Everything</h3>
                  <p className="text-gray-600 text-sm">Our AI reads every email, document, and invoice to understand your business</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-lg">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Get Instant Answers</h3>
                  <p className="text-gray-600 text-sm">Ask "Which orders are stuck?" or "Who owes us money?" in plain English</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Button
              onClick={() => setStep(3)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg"
              size="lg"
            >
              Continue
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <button
              onClick={() => setStep(1)}
              className="block w-full text-center mt-4 text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back
            </button>
          </div>
        </div>
      </>
    );
  }

  if (step === 3) {
    return (
      <>
        {/* Dark overlay */}
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50" />

        {/* Email capture modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full pointer-events-auto relative">

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Brain className="h-8 w-8 text-white" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Enter the Demo
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Explore HighForce with real sample data from a manufacturing company
            </p>

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Work Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Start Exploring
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            {/* Privacy note */}
            <p className="text-xs text-center text-gray-500 mt-4">
              We'll never spam you. This is just to show you what HighForce can do.
            </p>
          </div>
        </div>
      </>
    );
  }

  return null;
}
