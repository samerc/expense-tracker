import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.forgotPassword(email);
      // TEMPORARY: capture the temporary password from response
      if (response.data.temporaryPassword) {
        setTempPassword(response.data.temporaryPassword);
      }
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="card max-w-md w-full text-center">
          <div className="text-5xl mb-4">🔑</div>
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Password Reset</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your password has been reset. Your new temporary password is:
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
            <code className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 select-all">
              {tempPassword}
            </code>
          </div>
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-6">
            Please copy this password and change it after logging in.
          </p>
          <Link to="/login" className="btn btn-primary w-full">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
      <div className="card max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">
          Forgot Password
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          Enter your email to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-blue-600 hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
