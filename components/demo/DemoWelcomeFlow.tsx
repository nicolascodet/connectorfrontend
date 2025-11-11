"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, ChevronRight, Loader2, Sparkles, BarChart3, Zap } from "lucide-react";

interface DemoWelcomeFlowProps {
  onComplete: () => void;
}

export default function DemoWelcomeFlow({ onComplete }: DemoWelcomeFlowProps) {
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

      // Complete the flow
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
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 z-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl">
              <Brain className="h-12 w-12 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-gray-900">
              Welcome to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">HighForce</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-xl mx-auto leading-relaxed">
              The AI-powered business intelligence platform that transforms your scattered communications into actionable insights
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-gray-200 shadow-sm">
              <Sparkles className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">AI Search</h3>
              <p className="text-sm text-gray-600">Ask questions in plain English</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-gray-200 shadow-sm">
              <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Auto Insights</h3>
              <p className="text-sm text-gray-600">Daily intelligence reports</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-gray-200 shadow-sm">
              <Zap className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Real-Time</h3>
              <p className="text-sm text-gray-600">Instant alerts on critical issues</p>
            </div>
          </div>

          {/* Next Button */}
          <Button
            onClick={() => setStep(2)}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg shadow-lg"
          >
            Get Started
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 z-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Animated Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl">
                <Sparkles className="h-12 w-12 text-white animate-pulse" />
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-gray-900">
              How <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">HighForce</span> Works
            </h2>

            <div className="space-y-6 max-w-xl mx-auto text-left">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Connect Your Data</h3>
                  <p className="text-gray-600">Gmail, Outlook, Google Drive, QuickBooks - all in one place</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-600">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">AI Analyzes Everything</h3>
                  <p className="text-gray-600">Our AI reads every email, document, and invoice to understand your business</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Get Instant Answers</h3>
                  <p className="text-gray-600">Ask questions like "Which orders are stuck?" or "Who owes us money?"</p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Button */}
          <Button
            onClick={() => setStep(3)}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg shadow-lg"
          >
            Continue to Demo
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>

          <button
            onClick={() => setStep(1)}
            className="block mx-auto text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 z-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6 border border-gray-200">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Brain className="h-10 w-10 text-white" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Enter the Demo
              </h2>
              <p className="text-gray-600">
                Explore HighForce with real sample data from a manufacturing company
              </p>
            </div>

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
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg shadow-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading Demo...
                  </>
                ) : (
                  <>
                    Start Exploring
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            {/* Privacy Note */}
            <p className="text-xs text-center text-gray-500">
              We'll never spam you. This is just to show you what HighForce can do.
            </p>

            <button
              onClick={() => setStep(2)}
              className="block mx-auto text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
