'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        console.error('Spotify OAuth error:', error);
        router.push(`/?error=${encodeURIComponent(error)}`);
        return;
      }

      if (code && state) {
        try {
          // Call our API route to handle the token exchange
          const response = await fetch('/api/auth/callback/spotify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, state }),
          });

          if (response.ok) {
            router.push('/');
          } else {
            router.push('/?error=token_exchange_failed');
          }
        } catch (error) {
          console.error('Callback handling error:', error);
          router.push('/?error=callback_error');
        }
      } else {
        router.push('/?error=missing_parameters');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing Spotify authentication...</p>
      </div>
    </div>
  );
}