'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Reset link is missing or invalid.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage(data.message || 'Password has been reset. You can now log in.');
      } else {
        setError(data.message || 'Unable to reset password. Please try again.');
      }
    } catch (err) {
      setError('Unable to reset password. Please try again.');
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
            <h1 className="text-3xl font-bold text-green-700 mb-2">Reset Password</h1>
            <p className="text-sm text-gray-500">Set a new password for your account.</p>
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
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                placeholder="Enter new password"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                placeholder="Re-enter new password"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !token}
              className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="flex justify-between text-sm text-gray-600">
              <button type="button" onClick={() => router.push('/login')} className="hover:text-green-600 transition-colors">
                Back to Login
              </button>
              <button type="button" onClick={() => router.push('/forgot-password')} className="hover:text-green-600 transition-colors">
                Resend Link
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
