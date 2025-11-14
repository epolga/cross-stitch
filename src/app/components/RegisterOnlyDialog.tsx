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
  const [confirmEmail, setConfirmEmail] = useState('');
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
  const confirmEmailOk = isValidEmail(confirmEmail);
  const emailsMatch = email.length > 0 && confirmEmail.length > 0 && email === confirmEmail;
  const passwordOk = password.length >= PASSWORD_MIN_LENGTH;
  const passwordsMatch = password.length > 0 && password === password2;

  const formValid = useMemo(
    () =>
      firstNameOk &&
      emailOk &&
      confirmEmailOk &&
      emailsMatch &&
      passwordOk &&
      passwordsMatch,
    [firstNameOk, emailOk, confirmEmailOk, emailsMatch, passwordOk, passwordsMatch]
  );

  useEffect(() => {
    if (isOpen) {
      setFirstName('');
      setEmail('');
      setConfirmEmail('');
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
      const message = err instanceof Error ? err.message : 'Network error';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [email, firstName, password, formValid, submitting, onSuccess]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(17, 24, 39, 0.5)' }}
    >
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Register</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {!done ? (
          <>
            <p className="mb-4 text-sm text-gray-600">
              Enter your name, email, and password to continue.
            </p>

            {error && (
              <p className="mb-3 text-sm text-red-500 text-center" role="alert">
                {error}
              </p>
            )}

            <div className="space-y-4">

              {/* First name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Anna"
                  disabled={submitting}
                />
                {!firstNameOk && firstName.length > 0 && (
                  <p className="text-xs text-red-600 mt-1">First name is required.</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                  placeholder="you@example.com"
                  disabled={submitting}
                />
                {email.length > 0 && !emailOk && (
                  <p className="text-xs text-red-600 mt-1">Please enter a valid email.</p>
                )}
              </div>

              {/* Confirm email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm email
                </label>
                <input
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Repeat your email"
                  disabled={submitting}
                />
                {confirmEmail.length > 0 && !emailsMatch && (
                  <p className="text-xs text-red-600 mt-1">Emails do not match.</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                  placeholder="At least 6 characters"
                  disabled={submitting}
                />
                {password.length > 0 && !passwordOk && (
                  <p className="text-xs text-red-600 mt-1">
                    Password must be at least {PASSWORD_MIN_LENGTH} characters long.
                  </p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Repeat your password"
                  disabled={submitting}
                />
                {password2.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-red-600 mt-1">Passwords do not match.</p>
                )}
              </div>

            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!formValid || submitting}
                className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600 disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Register'}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-4 py-2 text-gray-700 hover:text-gray-900"
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 rounded-md bg-green-50 p-3 text-green-700">
              Registration completed. You can now download the PDF.
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
