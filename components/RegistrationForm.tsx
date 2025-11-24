'use client';

import React, { useState } from 'react';

interface RegistrationFormProps {
  onSuccess?: (response: any) => void;
  onError?: (error: string) => void;
}

export default function RegistrationForm({ onSuccess, onError }: RegistrationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    business_name: '',
    website: '',
    password: '',
    confirm_password: '',
    user_type: 4 // Default to student
  });

  const [userTypes, setUserTypes] = useState([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Load user types on component mount
  React.useEffect(() => {
    const fetchUserTypes = async () => {
      try {
        const response = await fetch('/api/user-types');
        const result = await response.json();
        if (result.success) {
          setUserTypes(result.data);
        }
      } catch (error) {
        console.error('Error fetching user types:', error);
      }
    };
    fetchUserTypes();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.password !== formData.confirm_password) {
      setError("Passwords don't match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-blue-900/80"></div>
      
      <div className="relative z-10 w-full max-w-2xl mx-4">
        <div className="bg-slate-800/95 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              The NetStripes Customer Platform
            </h1>
            <p className="text-white/80 text-lg mb-1">
              Helping you on your journey to digital transformation
            </p>
            <p className="text-white/70">
              Sign up for free and get instant access to our digital solutions
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  First Name <span className="text-red-400">*</span>
                </label>
                <input
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-teal-400"
                  placeholder="Enter your first name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Last Name <span className="text-red-400">*</span>
                </label>
                <input
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-teal-400"
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                E-mail Address <span className="text-red-400">*</span>
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-teal-400"
                placeholder="info@kandoconsult.com.au"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Phone <span className="text-red-400">*</span>
              </label>
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-teal-400"
                placeholder="Enter your phone number"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Business Name
              </label>
              <input
                name="business_name"
                type="text"
                value={formData.business_name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-teal-400"
                placeholder="Enter your business name"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Website
              </label>
              <input
                name="website"
                type="url"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-teal-400"
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                User Type <span className="text-red-400">*</span>
              </label>
              <select
                name="user_type"
                value={formData.user_type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-teal-400"
                required
              >
                {userTypes.map((type: any) => (
                  <option key={type.user_type_id} value={type.user_type_id} className="bg-slate-800">
                    {type.user_type_name.charAt(0).toUpperCase() + type.user_type_name.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Password <span className="text-red-400">*</span>
                </label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-teal-400"
                  placeholder="••••••••••"
                  required
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <input
                  name="confirm_password"
                  type="password"
                  value={formData.confirm_password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-teal-400"
                  placeholder="••••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-teal-600 hover:to-teal-700 transition-all"
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>

            <div className="text-center">
              <p className="text-white/70">
                Already have an account?{' '}
                <a href="/" className="text-teal-400 hover:text-teal-300 transition-colors font-medium">
                  Login
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}