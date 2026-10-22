import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  Menu,
  RefreshCw,
  Search,
  Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import StudentSidebar from "../../components/StudentSidebar";

export default function Tests() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tests, setTests] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [startingTest, setStartingTest] = useState(null);

  const loadTests = useCallback(async () => {
    setLoading(true);
    setError("");

    const [testResult, subjectResult] = await Promise.allSettled([
      api.get("/testsystem/available/"),
      api.get("/admin/subjects/student/"),
    ]);

    const errors = [];

    if (testResult.status === "fulfilled") {
      const data = testResult.value.data;
      setTests(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : []
      );
    } else {
      setTests([]);
      errors.push(
        testResult.reason?.response?.data?.detail ||
          "Unable to load available tests."
      );
    }

    if (subjectResult.status === "fulfilled") {
      const data = subjectResult.value.data;
      setSubjects(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : []
      );
    } else {
      setSubjects([]);
      errors.push(
        subjectResult.reason?.response?.data?.detail ||
          "Unable to load subjects."
      );
    }

    if (errors.length) {
      setError(errors.join(" "));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const getSubjectId = (test) => {
    if (typeof test.subject === "object" && test.subject !== null) {
      return String(test.subject.id || "");
    }

    return String(test.subject || "");
  };

  const getSubjectName = (test) => {
    if (test.subject_name) return test.subject_name;

    if (typeof test.subject === "object" && test.subject !== null) {
      return test.subject.name || "Subject";
    }

    const subject = subjects.find(
      (item) => String(item.id) === getSubjectId(test)
    );

    return subject?.name || "Subject";
  };

  const filteredTests = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return tests.filter((test) => {
      const title = String(test.title || "").toLowerCase();
      const description = String(test.description || "").toLowerCase();
      const subjectName = getSubjectName(test).toLowerCase();

      const matchesSearch =
        !keyword ||
        title.includes(keyword) ||
        description.includes(keyword) ||
        subjectName.includes(keyword);

      const matchesSubject =
        !subjectFilter || getSubjectId(test) === subjectFilter;

      return matchesSearch && matchesSubject;
    });
  }, [tests, search, subjectFilter, subjects]);

  const startTest = (test) => {
    if (!test.id) {
      setError("This test does not have a valid ID.");
      return;
    }

    setStartingTest(test.id);
    navigate(`/student/test/${test.id}`);
  };

  const clearFilters = () => {
    setSearch("");
    setSubjectFilter("");
  };

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
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200 lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-500">
                  Assessments
                </p>
                <h1 className="mt-1 text-xl font-black sm:text-2xl">
                  Available Tests
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  Practice your knowledge and track your progress.
                </p>
              </div>
            </div>

            <div className="hidden h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 font-bold text-indigo-600 sm:flex">
              {user?.full_name?.charAt(0)?.toUpperCase() || "S"}
            </div>
          </header>

          <section className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-6 text-white shadow-xl sm:p-8">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-24 right-20 h-48 w-48 rounded-full bg-violet-300/20 blur-3xl" />

            <div className="relative z-10 max-w-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <ClipboardCheck size={24} />
              </div>
              <h2 className="mt-5 text-2xl font-black sm:text-3xl">
                Prepare. Attempt. Achieve.
              </h2>
              <p className="mt-2 text-sm leading-6 text-indigo-100 sm:text-base">
                Find available tests, review their details and start when
                you're ready.
              </p>
            </div>
          </section>

          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Available Tests"
              value={filteredTests.length}
              icon={<ClipboardCheck size={21} />}
              color="indigo"
            />
            <StatCard
              label="Subjects"
              value={subjects.length}
              icon={<BookOpen size={21} />}
              color="emerald"
            />
            <StatCard
              label="Your Results"
              value="View results"
              icon={<Target size={21} />}
              color="violet"
              onClick={() => navigate("/student/results")}
            />
          </section>

          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search tests or subjects..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <select
                value={subjectFilter}
                onChange={(event) => setSubjectFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 lg:w-64"
              >
                <option value="">All subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={loadTests}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </section>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              <div>
                <p>{error}</p>
                <button
                  type="button"
                  onClick={loadTests}
                  className="mt-2 font-bold underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
                <p className="text-sm text-slate-400">Loading tests...</p>
              </div>
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <ClipboardCheck size={28} />
              </div>
              <h2 className="mt-4 text-lg font-black">No tests found</h2>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                {search || subjectFilter
                  ? "Try changing your search or subject filter."
                  : "There are no published tests available right now."}
              </p>

              {(search || subjectFilter) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredTests.map((test) => {
                const duration = test.duration_minutes;
                const totalMarks = test.total_marks;

                return (
                  <article
                    key={test.id}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"
                  >
                    <div className="flex items-center justify-between bg-gradient-to-br from-indigo-50 to-violet-50 p-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
                        <ClipboardCheck size={22} />
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
                        Available
                      </span>
                    </div>

                    <div className="p-5">
                      <p className="text-xs font-bold text-indigo-600">
                        {getSubjectName(test)}
                      </p>
                      <h2 className="mt-2 line-clamp-2 text-lg font-black">
                        {test.title || "Untitled Test"}
                      </h2>
                      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-400">
                        {test.description ||
                          "Attempt this assessment to evaluate your knowledge."}
                      </p>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <InfoItem
                          icon={<Clock3 size={16} />}
                          label="Duration"
                          value={
                            duration != null
                              ? `${duration} min`
                              : "Not specified"
                          }
                        />
                        <InfoItem
                          icon={<Target size={16} />}
                          label="Total marks"
                          value={
                            totalMarks != null ? totalMarks : "Not specified"
                          }
                        />
                      </div>

                      {test.start_date && (
                        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                          <CalendarDays size={14} />
                          Starts{" "}
                          {new Date(test.start_date).toLocaleDateString("en-IN")}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => startTest(test)}
                        disabled={startingTest === test.id}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {startingTest === test.id
                          ? "Opening test..."
                          : "Start Test"}
                        <ArrowRight size={17} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, color, onClick }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
  };

  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}
        >
          {icon}
        </div>
      </div>
      <p className="mt-4 text-2xl font-black text-slate-900">{value}</p>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {content}
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-sm font-black text-slate-800">{value}</p>
    </div>
  );
}