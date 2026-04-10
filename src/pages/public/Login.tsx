import { useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle, Shield } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';

interface LoginLocationState {
  successMessage?: string;
}

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();

  const locationState = (location.state as LoginLocationState | null) ?? null;

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    try {
      const user = await login(formData);

      if (user.role === 'CITIZEN') {
        navigate('/citizen/dashboard', { replace: true });
        return;
      }

      if (user.role === 'LEADER' || user.role === 'ADMIN') {
        navigate('/leader/dashboard', { replace: true });
        return;
      }

      navigate('/dashboard', { replace: true });
    } catch (caughtError) {
      const axiosError = caughtError as AxiosError<{ message?: string }>;
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message ?? 'Login failed. Please verify your credentials.';
      setError(status ? `${message} (HTTP ${status})` : message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg md:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Shield className="h-8 w-8 text-slate-700" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome Back</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to continue to CIRES</p>
        </div>

        {locationState?.successMessage && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {locationState.successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input
            label="Username"
            name="username"
            required
            autoComplete="username"
            value={formData.username}
            onChange={(event) => setFormData((prev) => ({ ...prev, username: event.target.value }))}
            placeholder="Enter your username"
            className="bg-slate-50"
          />

          <Input
            label="Password"
            type="password"
            name="password"
            required
            autoComplete="current-password"
            value={formData.password}
            onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
            placeholder="Enter your password"
            className="bg-slate-50"
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Do not have an account?{' '}
          <Link to="/register" className="font-semibold text-slate-900 hover:text-slate-700">
            Create one now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
