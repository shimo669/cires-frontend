import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import { getReportHistory, submitFeedback } from '../../api/interactionApi';
import type { HistoryResponseDTO } from '../../types/interaction';

interface LocationState {
  reportStatus?: string;
  deadlineDate?: string;
}

const formatDateTime = (timestamp: string) => {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString();
};

const getCountdown = (deadline?: string) => {
  if (!deadline) {
    return { label: 'N/A', overdue: false };
  }

  const deadlineMs = new Date(deadline).getTime();
  if (Number.isNaN(deadlineMs)) {
    return { label: 'N/A', overdue: false };
  }

  const diff = deadlineMs - Date.now();
  const abs = Math.abs(diff);
  const hours = Math.floor(abs / (1000 * 60 * 60));
  const minutes = Math.floor((abs % (1000 * 60 * 60)) / (1000 * 60));

  if (diff < 0) {
    return { label: `OVERDUE by ${hours}h ${minutes}m`, overdue: true };
  }

  return { label: `${hours}h ${minutes}m remaining`, overdue: false };
};

const TicketDetails = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? null;

  const numericReportId = reportId ? Number(reportId) : NaN;

  const [history, setHistory] = useState<HistoryResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000 * 30);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!Number.isFinite(numericReportId)) {
      setLoading(false);
      setError('Invalid report ID.');
      return;
    }

    let isMounted = true;

    const fetchHistory = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getReportHistory(numericReportId);

        if (isMounted) {
          setHistory(data);
        }
      } catch {
        if (isMounted) {
          setError('Failed to load report history. Please try again.');
          setHistory([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [numericReportId]);

  const isResolved = useMemo(() => {
    if (state?.reportStatus?.toUpperCase() === 'RESOLVED') {
      return true;
    }

    return history.some((item) => item.action.toUpperCase().includes('RESOLVED'));
  }, [history, state?.reportStatus]);

  const countdown = useMemo(() => {
    void now;
    return getCountdown(state?.deadlineDate);
  }, [now, state?.deadlineDate]);

  const handleFeedbackSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!Number.isFinite(numericReportId)) {
      return;
    }

    setSubmittingFeedback(true);
    setFeedbackSuccess('');

    try {
      const message = await submitFeedback(numericReportId, { rating, comment });
      setFeedbackSuccess(message);
      setComment('');
      setRating(5);
    } catch {
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="mx-auto flex w-full max-w-[1400px]">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-2xl font-bold text-slate-900">Ticket Timeline</h1>
            <p className="mt-1 text-slate-500">Tracking history for Report #{reportId ?? 'N/A'}.</p>

            {state?.reportStatus && (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Current Status</p>
                  <p className="mt-1 font-semibold text-slate-900">{state.reportStatus.replace(/_/g, ' ')}</p>
                </div>
                <div className={`rounded-lg border px-4 py-3 text-sm ${countdown.overdue ? 'border-red-200 bg-red-50 text-red-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                  <p className="text-xs uppercase tracking-wider">SLA Countdown</p>
                  <p className="mt-1 font-semibold">{countdown.label}</p>
                </div>
              </div>
            )}

            {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {loading ? (
                <p className="text-slate-500">Loading timeline...</p>
              ) : history.length === 0 ? (
                <p className="text-slate-500">No timeline entries yet.</p>
              ) : (
                <ol className="relative border-s border-slate-200">
                  {history.map((entry, index) => (
                    <li key={`${entry.timestamp}-${index}`} className="ms-4 pb-8 last:pb-0">
                      <div className="absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-slate-900" />
                      <time className="mb-1 block text-xs font-medium text-slate-400">{formatDateTime(entry.timestamp)}</time>
                      <h3 className="text-sm font-semibold text-slate-800">{entry.action}</h3>
                      <p className="mt-1 text-sm text-slate-500">By {entry.actedBy}</p>
                      <p className="mt-2 text-sm text-slate-600">{entry.notes || 'No additional notes.'}</p>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {isResolved && (
              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-800">Submit Feedback</h2>
                <p className="mt-1 text-sm text-slate-500">Your report is resolved. Please rate the handling experience.</p>

                {feedbackSuccess && (
                  <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    {feedbackSuccess}
                  </div>
                )}

                <form onSubmit={handleFeedbackSubmit} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="rating" className="mb-1 block text-sm font-semibold text-slate-700">
                      Rating
                    </label>
                    <select
                      id="rating"
                      value={rating}
                      onChange={(event) => setRating(Number(event.target.value))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-900"
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="comment" className="mb-1 block text-sm font-semibold text-slate-700">
                      Comment
                    </label>
                    <textarea
                      id="comment"
                      rows={4}
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-900"
                      placeholder="Share your feedback..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </form>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TicketDetails;

