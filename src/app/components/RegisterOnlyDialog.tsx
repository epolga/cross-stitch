'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';

type RegisterOnlyDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (payload: { email: string; firstName: string }) => void;
};

export function RegisterOnlyDialog({
  isOpen,
  onClose,
  onSuccess,
}: RegisterOnlyDialogProps) {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState(''); // ← added
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const isValidEmail = useCallback((value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }, []);

  const PASSWORD_MIN_LENGTH = 6;

  const firstNameOk = firstName.trim().length > 0;
  const emailOk = isValidEmail(email);
  const confirmEmailOk = isValidEmail(confirmEmail); // ← added
  const emailsMatch =
    email.length > 0 && confirmEmail.length > 0 && email === confirmEmail; // ← added
  const passwordOk = password.length >= PASSWORD_MIN_LENGTH;
  const passwordsMatch =
    password.length > 0 && password === password2;

  const formValid = useMemo(
    () =>
      firstNameOk &&
      emailOk &&
      confirmEmailOk &&   // ← added
      emailsMatch &&      // ← added
      passwordOk &&
      passwordsMatch,
    [
      firstNameOk,
      emailOk,
      confirmEmailOk, // ← added
      emailsMatch,     // ← added
      passwordOk,
      passwordsMatch
    ],
  );

  useEffect(() => {
    if (isOpen) {
      setFirstName('');
      setEmail('');
      setConfirmEmail(''); // ← added
      setPassword('');
      setPassword2('');
      setSubmitting(false);
      setError(null);
      setDone(false);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!formValid || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/register-only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName,
          password,
        }),
      });

      if (response.status === 409) {
        setError('This email is already registered.');
        setSubmitting(false);
        return;
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Server error');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('isLoggedIn', 'true');
        window.dispatchEvent(new Event('authStateChange'));
      }

      setDone(true);
      onSuccess?.({ email, firstName });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Network error';
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
          <div
            className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {!done ? (
          <>
            {/* First Name */}
            <label className="mb-1 block text-sm font-medium" htmlFor="reg-firstname">
              First name
            </label>
            <input
              id="reg-firstname"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
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
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              className="w-full rounded-md border px-3 py-2"
              placeholder="you@example.com"
              aria-invalid={email.length > 0 && !emailOk}
            />
            {email.length > 0 && !emailOk && (
              <p className="mt-1 text-xs text-red-600">
                Please enter a valid email address.
              </p>
            )}

            {/* Confirm Email — added */}
            <label className="mt-4 mb-1 block text-sm font-medium" htmlFor="reg-email2">
              Confirm email
            </label>
            <input
              id="reg-email2"
              value={confirmEmail}
              onChange={(event) => setConfirmEmail(event.target.value)}
              type="email"
              className="w-full rounded-md border px-3 py-2"
              placeholder="Re-enter your email"
              aria-invalid={confirmEmail.length > 0 && !emailsMatch}
            />
            {confirmEmail.length > 0 && !emailsMatch && (
              <p className="mt-1 text-xs text-red-600">
                Emails do not match.
              </p>
            )}

            {/* Password */}
            <label className="mt-4 mb-1 block text-sm font-medium" htmlFor="reg-password">
              Password
            </label>
            <input
              id="reg-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              className="w-full rounded-md border px-3 py-2"
              placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
              aria-invalid={password.length > 0 && !passwordOk}
            />
            {password.length > 0 && !passwordOk && (
              <p className="mt-1 text-xs text-red-600">
                Password must be at least {PASSWORD_MIN_LENGTH} characters long.
              </p>
            )}

            {/* Confirm Password */}
            <label className="mt-4 mb-1 block text-sm font-medium" htmlFor="reg-password2">
              Re-enter password
            </label>
            <input
              id="reg-password2"
              value={password2}
              onChange={(event) => setPassword2(event.target.value)}
              type="password"
              className="w-full rounded-md border px-3 py-2"
              placeholder="Re-enter your password"
              aria-invalid={password2.length > 0 && !passwordsMatch}
            />
            {password2.length > 0 && !passwordsMatch && (
              <p className="mt-1 text-xs text-red-600">
                Passwords do not match.
              </p>
            )}

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!formValid || submitting}
                className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                aria-disabled={!formValid || submitting}
              >
                {submitting ? 'Saving…' : 'Register'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-4 py-2 text-gray-700"
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
              type="button"
              onClick={onClose}
              className="rounded-md bg-blue-600 px-4 py-2 text-white"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
