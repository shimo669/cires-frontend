import { useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Send } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import GeographyDropdowns from '../../components/form/GeographyDropdowns';
import { createReport } from '../../api/reportApi';
import type { AddressHierarchySelectionWithNames } from '../../types/geo';

const CATEGORIES = [
  { id: 1, name: 'Water' },
  { id: 2, name: 'Electricity' },
  { id: 3, name: 'Roads' },
  { id: 4, name: 'Security' },
  { id: 5, name: 'Health' },
  { id: 6, name: 'Other' },
];

const SubmitReport = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [categoryName, setCategoryName] = useState(CATEGORIES[0].name);
  const [incidentVillageId, setIncidentVillageId] = useState<number | null>(null);
  const [locationSelection, setLocationSelection] = useState<AddressHierarchySelectionWithNames | null>(null);
  const [locationResetKey, setLocationResetKey] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!incidentVillageId) {
      setError('Please select the incident village.');
      return;
    }

    setLoading(true);

    try {
      const locationName = [
        locationSelection?.provinceName,
        locationSelection?.districtName,
        locationSelection?.sectorName,
        locationSelection?.cellName,
        locationSelection?.villageName,
      ]
        .filter((value): value is string => Boolean(value?.trim()))
        .join(', ');

      const requestPayload = {
        title,
        description,
        categoryId,
        categoryName,
        incidentLocationId: incidentVillageId,
        incidentLocationName: locationName || undefined,
        provinceId: locationSelection?.provinceId ?? undefined,
        districtId: locationSelection?.districtId ?? undefined,
        sectorId: locationSelection?.sectorId ?? undefined,
        cellId: locationSelection?.cellId ?? undefined,
        villageId: incidentVillageId,
      } as any;

      await createReport(requestPayload);

      setSuccess('Report created successfully. Your issue has been submitted for review.');
      setTitle('');
      setDescription('');
      setCategoryId(1);
      setCategoryName(CATEGORIES[0].name);
      setIncidentVillageId(null);
      setLocationSelection(null);
      setLocationResetKey((prev) => prev + 1);
    } catch {
      setError('Failed to create report. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="mx-auto flex w-full max-w-[1400px]">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-2xl font-bold text-slate-900">Report a New Issue</h1>
            <p className="mt-1 text-slate-500">Describe the issue and pin the exact village location for faster response.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4" />
                  <span>{success}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Input
                  label="Issue Title"
                  name="title"
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Broken Water Pipe"
                  className="bg-slate-50"
                />

                <div className="flex flex-col gap-1.5">
                  <label className="ml-1 text-sm font-bold text-slate-700">Category</label>
                  <select
                    name="categoryId"
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 outline-none transition focus:border-slate-900"
                    value={categoryId}
                    onChange={(event) => {
                      const nextCategoryId = Number(event.target.value);
                      const selectedCategory = CATEGORIES.find((category) => category.id === nextCategoryId);
                      setCategoryId(nextCategoryId);
                      setCategoryName(selectedCategory?.name ?? CATEGORIES[0].name);
                    }}
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="ml-1 text-sm font-bold text-slate-700">Description</label>
                <textarea
                  required
                  rows={5}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 outline-none transition focus:border-slate-900"
                  placeholder="Describe what happened, when it started, and any immediate risk."
                />
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-400">Incident Location</h3>
                <GeographyDropdowns
                  key={locationResetKey}
                  onVillageSelected={(villageId) => {
                    setIncidentVillageId(villageId);
                  }}
                  onSelectionChangeWithNames={(selection) => {
                    setLocationSelection(selection);
                    setIncidentVillageId(selection.villageId);
                  }}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="flex items-center gap-2 px-8" isLoading={loading}>
                  {!loading && <Send size={16} />}
                  Submit Report
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SubmitReport;

