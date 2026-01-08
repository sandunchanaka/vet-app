'use client';

import React, { useState } from 'react';

interface RegistrationFormProps {
  onSuccess?: (response: any) => void;
  onError?: (error: string) => void;
}

interface UserType {
  user_type_id: number;
  user_type_name: string;
}

export default function RegistrationForm({ onSuccess, onError }: RegistrationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    user_type: 4,
    password: ''
  });

  const [userTypes, setUserTypes] = useState<UserType[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'user_type' ? Number(value) : value
    }));
  };

  React.useEffect(() => {
    const fetchUserTypes = async () => {
      try {
        const response = await fetch('/api/user-types');
        const result = await response.json();
        if (result.success) {
          setUserTypes(result.data);
        }
      } catch (fetchError) {
        console.error('Error fetching user types:', fetchError);
      }
    };
    fetchUserTypes();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        phone: formData.phone_number,
        confirm_password: formData.password
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        onSuccess?.(result);
      } else {
        setError(result.message);
        onError?.(result.message);
      }
    } catch (err) {
      const errorMessage = 'An error occurred during registration. Please try again.';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6">
            <p className="text-sm text-green-50 uppercase tracking-widest font-semibold">Staff Management</p>
            <h1 className="text-3xl font-bold text-white">Create Staff Account</h1>
            <p className="text-green-50 mt-2">
              Use the same details as the dashboard staff onboarding form to create a new team member.
            </p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="name@clinic.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Phone Number
                </label>
                <input
                  name="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g. +1 555 123 4567"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    User Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="user_type"
                    value={formData.user_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    {userTypes.map((type) => (
                      <option key={type.user_type_id} value={type.user_type_id}>
                        {type.user_type_name.charAt(0).toUpperCase() + type.user_type_name.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="At least 8 characters"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-lg bg-green-600 text-white font-semibold text-lg disabled:opacity-60 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
              >
                {isLoading ? 'Creating account...' : 'Register Staff Member'}
              </button>

              <p className="text-center text-gray-600">
                Already have access?{' '}
                <a href="/" className="text-green-700 font-semibold hover:underline">
                  Return to login
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
