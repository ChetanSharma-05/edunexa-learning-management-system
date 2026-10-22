import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  LoaderCircle,
  RefreshCw,
  Search,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";
import api from "../../services/api";
import StudentSidebar from "../../components/StudentSidebar";

const formatDate = (value) => {
  if (!value) return "Not submitted";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMarks = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number)
    ? Number(number.toFixed(2)).toString()
    : "0";
};

function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>

        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default function Results() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }, [navigate]);

  const loadResults = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/testsystem/attempts/my/");
      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];

      setAttempts(list);

      const savedUser = localStorage.getItem("user");

      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          setUser(null);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Results load nahi ho sake. Please dobara try karein."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const submittedAttempts = useMemo(
    () =>
      attempts.filter(
        (attempt) =>
          attempt.status === "SUBMITTED" ||
          attempt.status === "AUTO_SUBMITTED"
      ),
    [attempts]
  );

  const stats = useMemo(() => {
    const total = submittedAttempts.length;

    const passed = submittedAttempts.filter(
      (attempt) => attempt.is_passed
    ).length;

    const average = total
      ? submittedAttempts.reduce(
          (sum, attempt) => sum + Number(attempt.percentage || 0),
          0
        ) / total
      : 0;

    const best = total
      ? Math.max(
          ...submittedAttempts.map((attempt) =>
            Number(attempt.percentage || 0)
          )
        )
      : 0;

    return {
      total,
      passed,
      failed: total - passed,
      average,
      best,
    };
  }, [submittedAttempts]);

  const filteredAttempts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return submittedAttempts.filter((attempt) => {
      const title = String(attempt.test_title || "").toLowerCase();
      const subject = String(attempt.subject_name || "").toLowerCase();

      const matchesSearch =
        !term || title.includes(term) || subject.includes(term);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PASS" && attempt.is_passed) ||
        (statusFilter === "FAIL" && !attempt.is_passed);

      return matchesSearch && matchesStatus;
    });
  }, [submittedAttempts, search, statusFilter]);

  const openDetails = async (attempt) => {
    setSelectedAttempt(null);
    setDetailsLoading(true);

    try {
      const response = await api.get(
        `/testsystem/attempts/${attempt.id}/`
      );

      setSelectedAttempt(response.data?.attempt || response.data);
    } catch {
      setSelectedAttempt(attempt);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        logout={logout}
        navigate={navigate}
      />

      <main className="min-h-screen px-4 py-6 sm:px-6 lg:ml-[270px] lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="mb-2 text-sm font-semibold text-indigo-600">
                STUDENT PORTAL
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                My Results
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Track your test scores and learning progress.
              </p>
            </div>

            <button
              onClick={loadResults}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              Refresh results
            </button>
          </div>

          {error && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <span>{error}</span>
              <button
                onClick={loadResults}
                className="shrink-0 font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Tests Completed"
              value={stats.total}
              subtitle="Submitted attempts"
              icon={FileText}
            />

            <StatCard
              title="Tests Passed"
              value={stats.passed}
              subtitle={`${stats.failed} failed`}
              icon={CheckCircle2}
            />

            <StatCard
              title="Average Score"
              value={`${stats.average.toFixed(1)}%`}
              subtitle="Across submitted attempts"
              icon={TrendingUp}
            />

            <StatCard
              title="Best Score"
              value={`${stats.best.toFixed(1)}%`}
              subtitle="Highest percentage"
              icon={Award}
            />
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">
                Test History
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                View your submitted tests and marks.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search test or subject..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All results</option>
                  <option value="PASS">Passed</option>
                  <option value="FAIL">Failed</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-64 items-center justify-center">
                <LoaderCircle
                  size={32}
                  className="animate-spin text-indigo-600"
                />
              </div>
            ) : filteredAttempts.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                <div className="rounded-2xl bg-slate-100 p-4">
                  <BookOpen size={30} className="text-slate-400" />
                </div>

                <h3 className="mt-4 font-semibold text-slate-900">
                  {submittedAttempts.length === 0
                    ? "No results yet"
                    : "No matching results"}
                </h3>

                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  {submittedAttempts.length === 0
                    ? "Complete and submit a test to see your score here."
                    : "Try changing your search or result filter."}
                </p>

                {submittedAttempts.length === 0 && (
                  <button
                    onClick={() => navigate("/student/tests")}
                    className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Explore tests
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Test</th>
                        <th className="px-6 py-4 font-semibold">Score</th>
                        <th className="px-6 py-4 font-semibold">Percentage</th>
                        <th className="px-6 py-4 font-semibold">Result</th>
                        <th className="px-6 py-4 font-semibold">Submitted</th>
                        <th className="px-6 py-4 text-right font-semibold">
                          Details
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredAttempts.map((attempt) => (
                        <tr
                          key={attempt.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-900">
                              {attempt.test_title || `Test #${attempt.test}`}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {attempt.subject_name || "General"}
                              {" · "}Attempt {attempt.attempt_number || 1}
                            </p>
                          </td>

                          <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                            {formatMarks(attempt.score)} /{" "}
                            {formatMarks(attempt.total_marks)}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="w-12 text-sm font-semibold text-slate-800">
                                {Number(attempt.percentage || 0).toFixed(1)}%
                              </span>
                              <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-indigo-500"
                                  style={{
                                    width: `${Math.max(
                                      0,
                                      Math.min(
                                        100,
                                        Number(attempt.percentage || 0)
                                      )
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                                attempt.is_passed
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {attempt.is_passed ? (
                                <CheckCircle2 size={14} />
                              ) : (
                                <XCircle size={14} />
                              )}
                              {attempt.is_passed ? "Passed" : "Failed"}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-500">
                            {formatDate(attempt.submitted_at)}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => openDetails(attempt)}
                              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
                            >
                              <Eye size={16} />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-4 p-4 md:hidden">
                  {filteredAttempts.map((attempt) => (
                    <article
                      key={attempt.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {attempt.test_title || `Test #${attempt.test}`}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {attempt.subject_name || "General"}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            attempt.is_passed
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {attempt.is_passed ? "Passed" : "Failed"}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500">Score</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {formatMarks(attempt.score)} /{" "}
                            {formatMarks(attempt.total_marks)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">Percentage</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {Number(attempt.percentage || 0).toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                        <CalendarDays size={14} />
                        {formatDate(attempt.submitted_at)}
                      </p>

                      <button
                        onClick={() => openDetails(attempt)}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
                      >
                        <Eye size={16} />
                        View details
                      </button>
                    </article>
                  ))}
                </div>
              </>
            )}

            {!loading && filteredAttempts.length > 0 && (
              <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
                Showing {filteredAttempts.length} of {submittedAttempts.length} submitted attempts
              </div>
            )}
          </section>
        </div>
      </main>

      {(detailsLoading || selectedAttempt) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onClick={() => {
            if (!detailsLoading) setSelectedAttempt(null);
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {detailsLoading ? (
              <div className="flex min-h-48 items-center justify-center">
                <LoaderCircle
                  size={32}
                  className="animate-spin text-indigo-600"
                />
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-indigo-600">
                      RESULT DETAILS
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      {selectedAttempt.test_title ||
                        `Test #${selectedAttempt.test}`}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedAttempt.subject_name || "General"}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedAttempt(null)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                    aria-label="Close result details"
                  >
                    <XCircle size={21} />
                  </button>
                </div>

                <div className="mt-6 rounded-2xl bg-indigo-50 p-5 text-center">
                  <p className="text-sm font-medium text-indigo-700">
                    Your score
                  </p>
                  <p className="mt-2 text-4xl font-bold text-indigo-900">
                    {Number(selectedAttempt.percentage || 0).toFixed(1)}%
                  </p>
                  <p className="mt-2 text-sm text-indigo-700">
                    {formatMarks(selectedAttempt.score)} out of{" "}
                    {formatMarks(selectedAttempt.total_marks)} marks
                  </p>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-sm text-slate-500">Status</span>
                    <span
                      className={`font-semibold ${
                        selectedAttempt.is_passed
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {selectedAttempt.is_passed ? "Passed" : "Failed"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-sm text-slate-500">Attempt</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedAttempt.attempt_number || 1}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-sm text-slate-500">Submitted</span>
                    <span className="text-right text-sm font-semibold text-slate-900">
                      {formatDate(selectedAttempt.submitted_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Attempt status</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {String(selectedAttempt.status || "UNKNOWN").replaceAll(
                        "_",
                        " "
                      )}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAttempt(null)}
                  className="mt-6 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}