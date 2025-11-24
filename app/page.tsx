'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import Navigation from '@/components/Navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLoginSuccess = (response: any) => {
    if (response.token && response.user) {
      // Redirect to dashboard
      router.push('/dashboard');
    }
  };

  const handleLoginError = (error: string) => {
    console.error('Login error:', error);
  };

  return (
    <main>
      <Navigation />
      <LoginForm 
        onSuccess={handleLoginSuccess}
        onError={handleLoginError}
      />
    </main>
  );
}
