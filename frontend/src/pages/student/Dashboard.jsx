
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  Menu,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import StudentSidebar from "../../components/StudentSidebar";

const asList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getAttemptPercent = (attempt) => {
  const value = Number(attempt?.percentage);
  if (Number.isFinite(value)) return Math.max(0, Math.min(100, value));

  const score = Number(attempt?.score);
  const total = Number(attempt?.total_marks);

  if (Number.isFinite(score) && Number.isFinite(total) && total > 0) {
    return Math.max(0, Math.min(100, (score / total) * 100));
  }

  return null;
};

const isCompletedAttempt = (attempt) => {
  const status = String(attempt?.status || "").toUpperCase();

  return (
    Boolean(attempt?.submitted_at) ||
    ["SUBMITTED", "COMPLETED", "EVALUATED", "FINISHED", "AUTO_SUBMITTED"].includes(status)
  );
};

const formatDate = (value) => {
  if (!value) return "Schedule not specified";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Schedule not specified";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStudentFriendlyError = (error, fallback) => {
  const rawMessage =
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    "";

  const message = typeof rawMessage === "string" ? rawMessage : "";
  const normalized = message.toLowerCase();

  if (normalized.includes("only admin or teacher can perform this action")) {
    return "This information is not available to student accounts through this endpoint.";
  }

  if (error?.response?.status === 403) {
    return "You don't have permission to access this information.";
  }

  if (error?.response?.status >= 500) {
    return "The server could not load this information. Please try again later.";
  }

  return message || fallback;
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attempts, setAttempts] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const firstName = user?.full_name?.split(" ")?.[0] || "Student";

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [attemptResult, testResult] = await Promise.allSettled([
        api.get("/testsystem/attempts/my/"),
        api.get("/testsystem/available/"),
      ]);

      const errors = [];

      if (attemptResult.status === "fulfilled") {
        setAttempts(asList(attemptResult.value.data));
      } else {
        setAttempts([]);
        errors.push(
          getStudentFriendlyError(
            attemptResult.reason,
            "Test results could not be loaded."
          )
        );
      }

      if (testResult.status === "fulfilled") {
        setTests(asList(testResult.value.data));
      } else {
        setTests([]);
        errors.push(
          getStudentFriendlyError(
            testResult.reason,
            "Upcoming tests could not be loaded."
          )
        );
      }

      setError(errors.join(" "));
    } catch {
      setError("Dashboard information could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const completedAttempts = useMemo(
    () => attempts.filter(isCompletedAttempt),
    [attempts]
  );

  const averageScore = useMemo(() => {
    const percentages = completedAttempts
      .map(getAttemptPercent)
      .filter((value) => value !== null);

    if (!percentages.length) return 0;

    return (
      percentages.reduce((sum, value) => sum + value, 0) /
      percentages.length
    );
  }, [completedAttempts]);

  const upcomingTests = useMemo(() => {
    const now = Date.now();

    return tests
      .filter((test) => {
        const status = String(test?.status || "").toUpperCase();

        if (
          test?.is_active === false ||
          (status && status !== "PUBLISHED")
        ) {
          return false;
        }

        if (test?.end_date) {
          const end = new Date(test.end_date).getTime();
          if (!Number.isNaN(end) && end < now) return false;
        }

        if (test?.start_date) {
          const start = new Date(test.start_date).getTime();
          if (!Number.isNaN(start) && start > now) return true;
        }

        return true;
      })
      .sort((a, b) => {
        const aDate = a?.start_date
          ? new Date(a.start_date).getTime()
          : Infinity;
        const bDate = b?.start_date
          ? new Date(b.start_date).getTime()
          : Infinity;

        return aDate - bDate;
      })
      .slice(0, 4);
  }, [tests]);

  const stats = [
    {
      title: "Tests Attempted",
      value: String(attempts.length),
      subtitle: "All your test attempts",
      icon: ClipboardCheck,
      iconClass: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Tests Completed",
      value: String(completedAttempts.length),
      subtitle: "Submitted tests",
      icon: CheckCircle2,
      iconClass: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Average Score",
      value: `${Math.round(averageScore)}%`,
      subtitle: completedAttempts.length
        ? "Across completed tests"
        : "Complete a test to calculate",
      icon: Target,
      iconClass: "bg-amber-50 text-amber-600",
    },
    {
      title: "Performance",
      value: `${Math.round(averageScore)}%`,
      subtitle: completedAttempts.length
        ? "Based on your submitted tests"
        : "Your progress will appear here",
      icon: TrendingUp,
      iconClass: "bg-violet-50 text-violet-600",
    },
  ];

  const quickActions = [
    {
      title: "Browse Subjects",
      description: "Explore your available subjects",
      icon: BookOpen,
      path: "/student/subjects",
      className: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "View Notes",
      description: "Read your study materials",
      icon: FileText,
      path: "/student/notes",
      className: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Take a Test",
      description: "Attempt available tests",
      icon: ClipboardCheck,
      path: "/student/tests",
      className: "bg-violet-50 text-violet-600",
    },
    {
      title: "My Results",
      description: "Check your test results",
      icon: BarChart3,
      path: "/student/results",
      className: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-900">
      <StudentSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        logout={logout}
        navigate={navigate}
      />

      <main className="min-h-screen lg:ml-[270px]">
        <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <header className="mb-7 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 lg:hidden"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-500">
                  Student Portal
                </p>
                <h1 className="mt-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                  Dashboard
                </h1>
              </div>
            </div>

            <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 font-bold text-indigo-600">
                {user?.full_name?.charAt(0)?.toUpperCase() || "S"}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {user?.full_name || "Student"}
                </p>
                <p className="text-xs text-slate-400">Student</p>
              </div>
            </div>
          </header>

          {error && (
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={loadDashboard}
                className="inline-flex items-center gap-2 self-start rounded-lg bg-white px-3 py-2 font-bold text-rose-700 ring-1 ring-rose-200"
              >
                <RefreshCw size={15} /> Retry
              </button>
            </div>
          )}

          <section className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-6 text-white shadow-xl shadow-indigo-500/15 sm:p-8">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-violet-300/20 blur-3xl" />

            <div className="relative z-10 max-w-2xl">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <Sparkles size={22} />
              </div>
              <p className="text-sm font-medium text-indigo-100">
                Welcome back,
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                Hello, {firstName}! 👋
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
                Continue your learning journey, attempt tests and track your
                academic performance from one place.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/student/tests")}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-600 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50"
                >
                  <ClipboardCheck size={17} /> Explore Tests
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/student/subjects")}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15"
                >
                  <BookOpen size={17} /> Browse Subjects
                </button>
              </div>
            </div>
          </section>

          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        {stat.title}
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-slate-900">
                        {loading ? "—" : stat.value}
                      </h3>
                    </div>
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconClass}`}
                    >
                      <Icon size={20} />
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-medium text-slate-400">
                    {stat.subtitle}
                  </p>
                </div>
              );
            })}
          </section>

          <section className="mb-8">
            <div className="mb-4">
              <h2 className="text-lg font-black text-slate-900">Quick Actions</h2>
              <p className="mt-1 text-sm text-slate-400">
                Continue where you left off
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <button
                    key={action.title}
                    type="button"
                    onClick={() => navigate(action.path)}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${action.className} transition group-hover:scale-105`}
                    >
                      <Icon size={20} />
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-slate-900">
                      {action.title}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      {action.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <BarChart3 size={19} />
                </div>
                <div>
                  <h2 className="font-black text-slate-900">
                    Performance Overview
                  </h2>
                  <p className="text-xs text-slate-400">
                    Your completed test results
                  </p>
                </div>
              </div>

              {completedAttempts.length ? (
                <div className="mt-7 space-y-5">
                  {completedAttempts.slice(-5).reverse().map((attempt) => {
                    const pct = getAttemptPercent(attempt) ?? 0;

                    return (
                      <div key={attempt.id}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="truncate text-sm font-semibold text-slate-700">
                            {attempt.test_title ||
                              attempt.test?.title ||
                              `Test #${attempt.test}`}
                          </span>
                          <span className="shrink-0 text-sm font-bold text-indigo-600">
                            {Math.round(pct)}%
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-8 flex min-h-[190px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70">
                  <div className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-indigo-500 shadow-sm">
                      <TrendingUp size={24} />
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-slate-700">
                      {loading ? "Loading your results…" : "No performance data yet"}
                    </h3>
                    <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
                      Complete and submit a test to see your score here.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/student/tests")}
                      className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700"
                    >
                      Take a Test
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CalendarDays size={19} />
                </div>
                <div>
                  <h2 className="font-black text-slate-900">Upcoming Tests</h2>
                  <p className="text-xs text-slate-400">
                    Published tests available to you
                  </p>
                </div>
              </div>

              {upcomingTests.length ? (
                <div className="mt-5 space-y-3">
                  {upcomingTests.map((test) => (
                    <div
                      key={test.id}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <p className="font-bold text-slate-800">
                        {test.title || "Untitled test"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {test.subject_name || test.subject?.name || "Subject"}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                        <Clock3 size={14} />
                        {test.start_date
                          ? formatDate(test.start_date)
                          : `${test.duration_minutes ?? "—"} minutes`}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => navigate("/student/tests")}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
                  >
                    View All Tests
                  </button>
                </div>
              ) : (
                <div className="mt-6 flex min-h-[190px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70">
                  <div className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-500 shadow-sm">
                      <Clock3 size={24} />
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-slate-700">
                      {loading ? "Loading tests…" : "No upcoming tests"}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Published tests will appear here.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/student/tests")}
                      className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
                    >
                      Browse Tests
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <Award size={22} />
                </div>
                <div>
                  <h2 className="font-black text-slate-900">Keep Growing</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Practice regularly to improve your score and performance.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/student/results")}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-600"
              >
                View My Results
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
