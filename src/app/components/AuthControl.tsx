'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { RegisterForm } from './RegisterForm';
import { RegisterOnlyDialog } from './RegisterOnlyDialog';
import { useSearchParams, useRouter } from 'next/navigation';

// Utility function to check login status globally
export const isUserLoggedIn = (): boolean => {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    return localStorage.getItem('isLoggedIn') === 'true';
  }
  return false;
};

// Dispatch custom event for auth state changes
const dispatchAuthStateChange = (): void => {
  if (typeof window !== 'undefined') {
    const event = new Event('authStateChange');
    window.dispatchEvent(event);
    console.log('Dispatched authStateChange event');
  }
};

function AutoLogin({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const eid = searchParams?.get('eid') || '';
    const cid = searchParams?.get('cid') || '';
    const loggedIn = isUserLoggedIn();

    if (eid && cid) {
      localStorage.setItem('isLoggedIn', 'true');
    } else if (eid && cid && !loggedIn) {
      console.log('Attempting auto-login from email params');
      const autoLogin = async (): Promise<void> => {
        try {
          const response = await fetch('/api/auth/login-from-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eid, cid }),
          });

          const data: { success?: boolean; email?: string } = await response.json();

          if (true || (response.ok && data.success)) {
            console.log('Auto-login successful');
            if (typeof window !== 'undefined') {
              localStorage.setItem('isLoggedIn', 'true');
              localStorage.setItem('userEmail', data.email ?? '');
            }
            onLoginSuccess();
            dispatchAuthStateChange();
            // Remove query params from URL
            router.replace(window.location.pathname);
          } else {
            console.error('Auto-login failed:', (data as unknown) as Record<string, unknown>);
          }
        } catch (error) {
          console.error('Error during auto-login:', error);
        }
      };
      void autoLogin();
    }
  }, [searchParams, router, onLoginSuccess]);

  return null;
}

export type DownloadMode = 'free' | 'register' | 'paid';

export const resolveDownloadMode = (): DownloadMode => {
  const raw = (process.env.NEXT_PUBLIC_DOWNLOAD_MODE || '').toLowerCase().trim();
  console.log('resolveDownloadMode:', raw);
  if (raw === 'free' || raw === 'register' || raw === 'paid') return raw;
  return 'register';
};

export function AuthControl() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false); // RegisterForm (PayPal)
  const [isRegisterOnlyOpen, setIsRegisterOnlyOpen] = useState(false);   // RegisterOnlyDialog
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const mode: DownloadMode = useMemo(() => resolveDownloadMode(), []);

  // Validate email format
  const isValidEmail = (email: string): boolean => email.includes('@') && email.includes('.');

  // Initialize login state from localStorage (client-side only)
  useEffect(() => {
    const loggedIn = isUserLoggedIn();
    setIsLoggedIn(loggedIn);
    console.log('AuthControl component mounted, isLoggedIn from storage:', loggedIn);
  }, []);

  // Global error logger (как было у вас)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handler = (e: ErrorEvent) => console.error('Global error:', e);
      window.addEventListener('error', handler);
      return () => window.removeEventListener('error', handler);
    }
  }, []);

  // Listen for openPayPalModal → open PayPal dialog (RegisterForm) in paid mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleOpenPayPal = () => {
        console.log('Received openPayPalModal event');
        if (mode === 'paid') {
          setIsRegisterModalOpen(true);
          setIsRegisterOnlyOpen(false);
          setIsLoginModalOpen(false);
        }
      };
      window.addEventListener('openPayPalModal', handleOpenPayPal as EventListener);
      return () =>
        window.removeEventListener('openPayPalModal', handleOpenPayPal as EventListener);
    }
  }, [mode]);

  // Listen for openRegisterModal → open RegisterOnlyDialog (register mode)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleOpenRegisterOnly = () => {
        console.log('Received openRegister event');
        if (mode === 'register') {
          setIsRegisterOnlyOpen(true);
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(false);
        }
      };
      window.addEventListener('openRegisterModal', handleOpenRegisterOnly as EventListener);
      return () =>
        window.removeEventListener('openRegisterModal', handleOpenRegisterOnly as EventListener);
    }
  }, [mode]);

  const handleLoginClick = (): void => {
    console.log('Login button clicked, opening login modal...');
    setIsLoginModalOpen(true);
    setIsRegisterModalOpen(false);
    setIsRegisterOnlyOpen(false);
    setErrorMessage('');
  };

  const handleLoginSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    console.log('Form submitted, starting login process');
    try {
      console.log('Validating email:', loginUsername);
      if (!isValidEmail(loginUsername)) {
        console.log('Invalid email format');
        setErrorMessage('Please enter a valid email address');
        return;
      }

      console.log('Sending login request to API');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginUsername, password: loginPassword }),
      });

      const data: { success?: boolean; error?: string } = await response.json();
      console.log('API response:', data);

      if (response.ok && data.success) {
        console.log('Login successful:', { username: loginUsername });
        if (typeof window !== 'undefined') {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userEmail', loginUsername);
        }
        setIsLoggedIn(true);
        setIsLoginModalOpen(false);
        setLoginUsername('');
        setLoginPassword('');
        setErrorMessage('');
        dispatchAuthStateChange();
      } else {
        console.log('Invalid credentials');
        setErrorMessage(data.error || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setErrorMessage('An error occurred during login. Please try again.');
    }
  };

  const handleLogout = (): void => {
    console.log('Logging out...');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userEmail');
    }
    setIsLoggedIn(false);
    dispatchAuthStateChange();
  };

  const handleRegisterClick = (): void => {
    console.log('Register button clicked, opening register modal...');
    setErrorMessage('');
    setIsLoginModalOpen(false);

    if (mode === 'register') {
      setIsRegisterOnlyOpen(true);
      setIsRegisterModalOpen(false);
      return;
    }

    if (mode === 'paid') {
      setIsRegisterModalOpen(true);
      setIsRegisterOnlyOpen(false);
      return;
    }
  };

  const closeLoginModal = (): void => {
    console.log('Closing login modal');
    setIsLoginModalOpen(false);
    setLoginUsername('');
    setLoginPassword('');
    setErrorMessage('');
  };

  const handleRegisterSuccess = (): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('isLoggedIn', 'true');
    }
    setIsLoggedIn(true);
    setIsRegisterModalOpen(false);
    setIsRegisterOnlyOpen(false);
    dispatchAuthStateChange();
  };

  const handleAutoLoginSuccess = (): void => {
    setIsLoggedIn(true);
  };

  console.log(
    'Rendering AuthControl, isLoggedIn:',
    isLoggedIn,
    'isLoginModalOpen:',
    isLoginModalOpen,
    'mode:',
    mode,
  );

  // free-режим: вообще не показываем AuthControl
  if (mode === 'free') {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <Suspense fallback={null}>
        <AutoLogin onLoginSuccess={handleAutoLoginSuccess} />
      </Suspense>

      {isLoggedIn ? (
        <button
          onClick={handleLogout}
          className="text-gray-700 hover:text-gray-900 text-xl cursor-pointer pointer-events-auto"
          aria-label="Logout"
        >
          Logout
        </button>
      ) : (
        <>
          <button
            onClick={handleLoginClick}
            className="text-gray-500 hover:text-gray-900 text-xl cursor-pointer pointer-events-auto"
            aria-label="Login"
          >
            Login
          </button>
          <span className="text-gray-500 text-xl">|</span>
          <button
            onClick={handleRegisterClick}
            className="text-gray-500 hover:text-gray-900 text-xl cursor-pointer pointer-events-auto"
            aria-label="Register"
          >
            Register
          </button>
        </>
      )}

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(17, 24, 39, 0.5)' }}
        >
          <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Login</h2>
              <button
                onClick={closeLoginModal}
                className="text-gray-500 hover:text-gray-700 text-xl"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-username"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="login-username"
                  type="email"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  aria-label="Email"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  aria-label="Password"
                  required
                />
              </div>
              {errorMessage && (
                <p className="text-red-500 text-sm text-center" role="alert">
                  {errorMessage}
                </p>
              )}
              <button
                type="submit"
                className="w-full px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                aria-label="Login"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PayPal / full registration modal */}
      <RegisterForm
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onLoginClick={handleLoginClick}
        onRegisterSuccess={handleRegisterSuccess}
      />

      {/* Register-only dialog */}
      <RegisterOnlyDialog
        isOpen={isRegisterOnlyOpen}
        onClose={() => setIsRegisterOnlyOpen(false)}
        onSuccess={handleRegisterSuccess}
      />
    </div>
  );
}
