'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import { AuthResponse } from '@/types/user';

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSuccess = (response: AuthResponse) => {
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
      <LoginForm 
        onSuccess={handleLoginSuccess}
        onError={handleLoginError}
      />
    </main>
  );
}

