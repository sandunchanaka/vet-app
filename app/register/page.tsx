'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RegistrationForm from '@/components/RegistrationForm';
import Navigation from '@/components/Navigation';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleRegistrationSuccess = (response: any) => {
    if (response.token && response.user) {
      // Store token and user data
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      document.cookie = `auth_token=${response.token}; path=/; SameSite=Lax`;
      
      // Redirect to dashboard
      router.push('/dashboard');
    }
  };

  const handleRegistrationError = (error: string) => {
    console.error('Registration error:', error);
  };

  return (
    <main>
      <Navigation />
      <RegistrationForm 
        onSuccess={handleRegistrationSuccess}
        onError={handleRegistrationError}
      />
    </main>
  );
}
