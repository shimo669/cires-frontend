import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { AlertCircle, CheckCircle2, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import GeographyDropdowns from '../../components/form/GeographyDropdowns';
import { useAuth } from '../../contexts/AuthContext';
import type { AddressHierarchySelection } from '../../types/geo';

const Register = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    nationalId: '',
    password: '',
    confirmPassword: '',
  });
  const [addressSelection, setAddressSelection] = useState<AddressHierarchySelection>({
    provinceId: null,
    districtId: null,
    sectorId: null,
    cellId: null,
    villageId: null,
  });
  const [locationResetKey, setLocationResetKey] = useState(0);
  const [error, setError] = useState('');

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const nextValue = name === 'nationalId' ? value.replace(/\D/g, '').slice(0, 16) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const hasCompleteAddress = Object.values(addressSelection).every((value) => value !== null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.nationalId.length !== 16) {
      setError('National ID must contain exactly 16 digits.');
      return;
    }

    if (!hasCompleteAddress) {
      setError('Please select your full residential address down to village level.');
      return;
    }

    try {
      await register({
        username: formData.username,
        email: formData.email,
        nationalId: formData.nationalId,
        password: formData.password,
        provinceId: addressSelection.provinceId as number,
        districtId: addressSelection.districtId as number,
        sectorId: addressSelection.sectorId as number,
        cellId: addressSelection.cellId as number,
        villageId: addressSelection.villageId as number,
      });

      setLocationResetKey((prev) => prev + 1);

      navigate('/login', {
        replace: true,
        state: {
          successMessage: 'Registration successful. Please login with your new account.',
        },
      });
    } catch (caughtError) {
      const axiosError = caughtError as AxiosError<{ message?: string }>;
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message ?? 'Registration failed. Please try again.';
      setError(status ? `${message} (HTTP ${status})` : message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 py-12">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-lg md:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <UserPlus className="h-8 w-8 text-slate-700" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Your CIRES Account</h1>
          <p className="mt-1 text-sm text-slate-500">Register to report and track community issues.</p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4" />
            <p>
              Registration now captures your residential province, district, sector, cell, and village so the backend can store the related location IDs.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              label="Username"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              className="bg-slate-50"
            />

            <Input
              label="Email Address"
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="bg-slate-50"
            />
          </div>

          <Input
            label="National ID"
            name="nationalId"
            required
            maxLength={16}
            inputMode="numeric"
            value={formData.nationalId}
            onChange={handleChange}
            placeholder="16-digit national ID"
            className="bg-slate-50 font-mono tracking-widest"
          />

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Residential Address</h3>
                <p className="mt-1 text-sm text-slate-500">Choose each level so the selected IDs can be submitted with your account.</p>
              </div>
            </div>

            <GeographyDropdowns
              key={locationResetKey}
              onSelectionChange={(selection) => {
                setAddressSelection(selection);
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              label="Password"
              type="password"
              name="password"
              required
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              className="bg-slate-50"
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              required
              minLength={6}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              className="bg-slate-50"
            />
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-slate-900 hover:text-slate-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;