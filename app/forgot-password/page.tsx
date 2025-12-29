'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage(data.message || 'If that email exists, a reset link has been sent.');
      } else {
        setError(data.message || 'Unable to send reset email. Please try again.');
      }
    } catch (err) {
      setError('Unable to send reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 to-emerald-900/80" />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white/20 rounded-full"></div>
        <div className="absolute top-32 right-16 w-16 h-16 border-2 border-white/20 rounded-full"></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 border-2 border-white/20 rounded-full"></div>
        <div className="absolute bottom-32 right-10 w-24 h-24 border-2 border-white/20 rounded-full"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/95 backdrop-blur-sm border border-green-200 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-green-700 mb-2">Forgot Password</h1>
            <p className="text-sm text-gray-500">Enter your email to receive a password reset link.</p>
          </div>

          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
            >
              {isSubmitting ? 'Sending link...' : 'Send Reset Link'}
            </button>

            <div className="flex justify-between text-sm text-gray-600">
              <button type="button" onClick={() => router.push('/login')} className="hover:text-green-600 transition-colors">
                Back to Login
              </button>
              <button type="button" onClick={() => router.push('/register')} className="hover:text-green-600 transition-colors">
                Register
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
