'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (payload: { email: string; firstName: string }) => void;
};

export function RegisterOnlyDialog({ isOpen, onClose, onSuccess }: Props) {
  // Form state
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Simple email validation (good-enough for UI; server should also validate)
  const isValidEmail = useCallback((v: string): boolean => {
    // Intentionally simple: prevents obvious mistakes; do stricter checks server-side
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }, []);

  // Password policy (adjust as needed)
  const PASSWORD_MIN = 6;
  const passwordOk = password.length >= PASSWORD_MIN;
  const passwordsMatch = password.length > 0 && password === password2;

  // Derived validity
  const firstNameOk = firstName.trim().length > 0;
  const emailOk = isValidEmail(email);
  const formValid = useMemo(
    () => firstNameOk && emailOk && passwordOk && passwordsMatch,
    [firstNameOk, emailOk, passwordOk, passwordsMatch]
  );

  // Reset dialog state whenever it (re)opens
  useEffect(() => {
    if (isOpen) {
      setFirstName('');
      setEmail('');
      setPassword('');
      setPassword2('');
      setSubmitting(false);
      setError(null);
      setDone(false);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!formValid || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/register-only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send password along with firstName + email
        body: JSON.stringify({ email, firstName, password }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Request failed');
      }

      // Mark user as logged in locally so download becomes available immediately
      localStorage.setItem('isLoggedIn', 'true');
      window.dispatchEvent(new Event('authStateChange'));

      setDone(true);
      onSuccess?.({ email, firstName });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [email, firstName, password, formValid, submitting, onSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[90%] max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-xl font-semibold">Register to download</h2>
        <p className="mb-4 text-sm text-gray-600">
          Enter your first name, email, and choose a password to continue.
        </p>

        {error && (
          <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {!done ? (
          <>
            {/* First name */}
            <label className="mb-1 block text-sm font-medium" htmlFor="reg-firstname">
              First name
            </label>
            <input
              id="reg-firstname"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              type="text"
              className="mb-3 w-full rounded-md border px-3 py-2"
              placeholder="Anna"
              aria-invalid={!firstNameOk}
            />

            {/* Email */}
            <label className="mb-1 block text-sm font-medium" htmlFor="reg-email">
              Email
            </label>
            <input
              id="reg-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full rounded-md border px-3 py-2"
              placeholder="you@example.com"
              aria-invalid={email.length > 0 && !emailOk}
            />
            {email.length > 0 && !emailOk && (
              <p className="mt-1 text-xs text-red-600">Please enter a valid email address.</p>
            )}

            {/* Password */}
            <label className="mt-4 mb-1 block text-sm font-medium" htmlFor="reg-password">
              Password
            </label>
            <input
              id="reg-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full rounded-md border px-3 py-2"
              placeholder={`At least ${PASSWORD_MIN} characters`}
              aria-invalid={password.length > 0 && !passwordOk}
            />
            {password.length > 0 && !passwordOk && (
              <p className="mt-1 text-xs text-red-600">
                Password must be at least {PASSWORD_MIN} characters long.
              </p>
            )}

            {/* Confirm password */}
            <label className="mt-4 mb-1 block text-sm font-medium" htmlFor="reg-password2">
              Re-enter password
            </label>
            <input
              id="reg-password2"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              type="password"
              className="w-full rounded-md border px-3 py-2"
              placeholder="Re-enter your password"
              aria-invalid={password2.length > 0 && !passwordsMatch}
            />
            {password2.length > 0 && !passwordsMatch && (
              <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
            )}

            {/* Actions */}
            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={!formValid || submitting}
                className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                type="button"
                aria-disabled={!formValid || submitting}
              >
                {submitting ? 'Saving…' : 'Register'}
              </button>
              <button
                onClick={onClose}
                className="rounded-md px-4 py-2 text-gray-700"
                type="button"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 rounded-md bg-green-50 p-3 text-green-700">
              Registration saved. You can now download the PDF.
            </div>
            <button
              onClick={onClose}
              className="rounded-md bg-blue-600 px-4 py-2 text-white"
              type="button"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
