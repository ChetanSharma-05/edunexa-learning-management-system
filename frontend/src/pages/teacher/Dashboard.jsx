

import { useEffect, useState } from "react";

import {
  BarChart3,

  Bell,

  BookOpen,

  ChevronRight,

  FileQuestion,

  FileText,
  Plus,
  Sparkles,

  Trophy,
  Users,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import TeacherSidebar from "../../components/teacher/TeacherSidebar";



const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");

const DASHBOARD_API_URL = `${API_BASE_URL}/testsystem/teacher/dashboard/`;



function StatCard({ icon, title, value, subtitle }) {

  return (

    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-50 transition group-hover:scale-150" />



      <div className="relative flex items-start justify-between gap-3">

        <div>

          <p className="text-sm font-medium text-slate-500">{title}</p>

          <h3 className="mt-2 text-3xl font-bold text-slate-900">{value}</h3>

          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>

        </div>



        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">

          {icon}

        </div>

      </div>

    </div>

  );

}



function SectionHeader({ title, subtitle, action, onAction }) {

  return (

    <div className="mb-5 flex items-center justify-between gap-4">

      <div>

        <h2 className="text-lg font-bold text-slate-900">{title}</h2>

        {subtitle && (

          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>

        )}

      </div>



      {action && (

        <button

          type="button"

          onClick={onAction}

          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"

        >

          {action}

          <ChevronRight size={16} />

        </button>

      )}

    </div>

  );

}



function EmptyState({ message }) {

  return (

    <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">

      {message}

    </div>

  );

}



function StudentRow({ student }) {

  const name = student.name || "Student";

  const score = Number(student.score || 0);



  const status =

    student.status ||

    (score >= 85 ? "Excellent" : score >= 70 ? "Good" : "Needs Focus");



  return (

    <div className="flex items-center gap-4 rounded-xl border border-slate-100 p-3 transition hover:border-indigo-100 hover:bg-indigo-50/40">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white">

        {name

          .split(" ")

          .map((part) => part[0])

          .join("")

          .slice(0, 2)

          .toUpperCase()}

      </div>



      <div className="min-w-0 flex-1">

        <p className="truncate text-sm font-semibold text-slate-900">

          {name}

        </p>

        <p className="mt-0.5 truncate text-xs text-slate-500">

          {student.subject || student.test || "Recent test submission"}

        </p>

      </div>



      <div className="text-right">

        <p className="text-sm font-bold text-slate-900">{score}%</p>

        <span

          className={`text-[11px] font-medium ${

            score >= 85

              ? "text-emerald-600"

              : score >= 70

                ? "text-blue-600"

                : "text-amber-600"

          }`}

        >

          {status}

        </span>

      </div>

    </div>

  );

}



function TestRow({ test }) {

  const isActive = test.status === "Active";



  const date = test.created_at

    ? new Date(test.created_at).toLocaleDateString()

    : "Date unavailable";



  return (

    <div className="flex items-center gap-4 rounded-xl border border-slate-100 p-4 transition hover:border-indigo-100 hover:bg-indigo-50/30">

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">

        <FileQuestion size={20} />

      </div>



      <div className="min-w-0 flex-1">

        <p className="truncate text-sm font-semibold text-slate-900">

          {test.title || "Untitled test"}

        </p>

        <p className="mt-1 text-xs text-slate-500">

          {test.subject || "No subject"} · {date}

        </p>

      </div>



      <div className="hidden text-right sm:block">

        <p className="text-sm font-semibold text-slate-800">

          {test.attempts ?? 0}

        </p>

        <p className="text-[11px] text-slate-500">Attempts</p>

      </div>



      <span

        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${

          isActive

            ? "bg-emerald-50 text-emerald-700"

            : "bg-slate-100 text-slate-600"

        }`}

      >

        {test.status || "Unknown"}

      </span>

    </div>

  );

}



export default function TeacherDashboard() {

  const navigate = useNavigate();

  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");



  const [dashboardData, setDashboardData] = useState({

    stats: {

      students: 0,

      tests: 0,

      active_tests: 0,

      subjects: 0,

      average_performance: 0,

      total_attempts: 0,

    },

    recent_tests: [],

    recent_students: [],

  });



  const teacherName =

    user?.full_name || user?.name || user?.username || "Teacher";
  const handleNavigation = (path) => navigate(path);
  useEffect(() => {

    const controller = new AbortController();



    async function loadDashboard() {

      setLoading(true);

      setError("");



      try {

        const token = localStorage.getItem("access_token");



        const response = await fetch(DASHBOARD_API_URL, {

          method: "GET",

          headers: {

            Accept: "application/json",

            ...(token ? { Authorization: `Bearer ${token}` } : {}),

          },

          signal: controller.signal,

        });



        const data = await response.json().catch(() => ({}));



        if (!response.ok) {

          throw new Error(

            data.detail ||

              data.message ||

              `Dashboard request failed (${response.status}).`,

          );

        }



        setDashboardData({

          stats: {

            students: data.stats?.students ?? 0,

            tests: data.stats?.tests ?? 0,

            active_tests: data.stats?.active_tests ?? 0,

            subjects: data.stats?.subjects ?? 0,

            average_performance: Number(

              data.stats?.average_performance ?? 0,

            ),

            total_attempts: data.stats?.total_attempts ?? 0,

          },

          recent_tests: Array.isArray(data.recent_tests)

            ? data.recent_tests

            : [],

          recent_students: Array.isArray(data.recent_students)

            ? data.recent_students

            : [],

        });

      } catch (err) {

        if (err.name !== "AbortError") {

          setError(err.message || "Unable to load dashboard data.");

        }

      } finally {

        if (!controller.signal.aborted) {

          setLoading(false);

        }

      }

    }



    loadDashboard();



    return () => controller.abort();

  }, []);



  const stats = dashboardData.stats;

  const average = Math.min(

    100,

    Math.max(0, Number(stats.average_performance || 0)),

  );



  const quickActions = [

    {

      title: "Create Test",

      description: "Create a new assessment for students.",

      icon: <Plus size={20} />,

      path: "/teacher/tests",

    },

    {

      title: "Question Bank",

      description: "Create and manage exam questions.",

      icon: <FileQuestion size={20} />,

      path: "/teacher/question-bank",

    },

    {

      title: "PDF → MCQ",

      description: "Generate MCQs from study material.",

      icon: <Sparkles size={20} />,

      path: "/teacher/pdf-to-mcq",

    },

    {

      title: "View Results",

      description: "Review student performance.",

      icon: <BarChart3 size={20} />,

      path: "/teacher/results",

    },

  ];



  return (

    <div className="min-h-screen bg-slate-50 text-slate-900">

      <TeacherSidebar />

      <main className="min-h-screen lg:pl-[270px]">

        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">

          <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">

            <div className="flex items-center gap-3">



              <div>

                <p className="text-sm font-medium text-slate-500">

                  Teacher Dashboard

                </p>

                <h1 className="text-xl font-bold sm:text-2xl">

                  Good day, {teacherName.split(" ")[0]} 👋

                </h1>

              </div>

            </div>



            <button

              type="button"

              aria-label="Notifications"

              className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm"

            >

              <Bell size={19} />

            </button>

          </div>

        </header>



        <div className="space-y-8 p-4 sm:p-6 lg:p-8">

          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 p-6 text-white shadow-xl sm:p-8">

            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" />

            <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-violet-400/20 blur-3xl" />



            <div className="relative max-w-3xl">

              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/15 px-3 py-1.5 text-xs font-semibold">

                <Sparkles size={14} />

                Smart Learning. Smarter Testing.

              </div>



              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">

                Manage your classroom with confidence.

              </h2>



              <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">

                Create tests, manage questions, track student performance and

                organize learning content from one place.

              </p>



              <div className="mt-6 flex flex-wrap gap-3">

                <button

                  type="button"

                  onClick={() => handleNavigation("/teacher/tests")}

                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50"

                >

                  <Plus size={17} />

                  Create Test

                </button>



                <button

                  type="button"

                  onClick={() => handleNavigation("/teacher/question-bank")}

                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/15 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"

                >

                  <FileQuestion size={17} />

                  Question Bank

                </button>

              </div>

            </div>

          </section>



          {error && (

            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

              <p className="font-semibold">

                Dashboard data could not be loaded.

              </p>

              <p className="mt-1">{error}</p>

              <p className="mt-1 break-all text-xs">

                API: {DASHBOARD_API_URL}

              </p>

              <button

                type="button"

                onClick={() => window.location.reload()}

                className="mt-3 rounded-lg bg-red-600 px-3 py-2 font-semibold text-white hover:bg-red-700"

              >

                Retry

              </button>

            </div>

          )}



          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard

              icon={<Users size={21} />}

              title="My Students"

              value={loading ? "..." : stats.students}

              subtitle="Students with submitted attempts"

            />



            <StatCard

              icon={<FileQuestion size={21} />}

              title="Total Tests"

              value={loading ? "..." : stats.tests}

              subtitle={`${stats.active_tests} published and active`}

            />



            <StatCard

              icon={<BookOpen size={21} />}

              title="Subjects"

              value={loading ? "..." : stats.subjects}

              subtitle="Subjects used in your tests"

            />



            <StatCard

              icon={<Trophy size={21} />}

              title="Avg. Performance"

              value={loading ? "..." : `${average.toFixed(1)}%`}

              subtitle={`${stats.total_attempts} submitted attempts`}

            />

          </section>



          <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <SectionHeader

                title="Student Performance"

                subtitle="Latest submitted test attempts"

                action="View Results"

                onAction={() => handleNavigation("/teacher/results")}

              />



              {loading ? (

                <EmptyState message="Loading student performance..." />

              ) : dashboardData.recent_students.length > 0 ? (

                <div className="space-y-3">

                  {dashboardData.recent_students.map((student, index) => (

                    <StudentRow

                      key={`${student.id}-${student.submitted_at || index}`}

                      student={student}

                    />

                  ))}

                </div>

              ) : (

                <EmptyState message="No submitted student attempts yet." />

              )}

            </div>



            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <SectionHeader

                title="Performance Overview"

                subtitle="Average score across submitted attempts"

              />



              <div className="flex min-h-[280px] flex-col items-center justify-center">

                <div

                  className="relative flex h-44 w-44 items-center justify-center rounded-full"

                  style={{

                    background: `conic-gradient(#4f46e5 ${average}%, #eef2ff ${average}% 100%)`,

                  }}

                >

                  <div className="flex h-36 w-36 items-center justify-center rounded-full bg-white">

                    <div className="text-center">

                      <p className="text-4xl font-extrabold text-slate-900">

                        {loading ? "..." : `${average.toFixed(1)}%`}

                      </p>

                      <p className="mt-1 text-xs font-medium text-slate-500">

                        Average Score

                      </p>

                    </div>

                  </div>

                </div>



                <div className="mt-6 flex items-center gap-6 text-xs">

                  <div className="flex items-center gap-2">

                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />

                    <span className="text-slate-500">Average score</span>

                  </div>

                  <div className="flex items-center gap-2">

                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-100" />

                    <span className="text-slate-500">Remaining</span>

                  </div>

                </div>

              </div>

            </div>

          </section>



          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            <SectionHeader

              title="Recent Tests"

              subtitle="Your latest tests and assessments"

              action="View All"

              onAction={() => handleNavigation("/teacher/tests")}

            />



            {loading ? (

              <EmptyState message="Loading tests..." />

            ) : dashboardData.recent_tests.length > 0 ? (

              <div className="space-y-3">

                {dashboardData.recent_tests.map((test) => (

                  <TestRow key={test.id} test={test} />

                ))}

              </div>

            ) : (

              <EmptyState message="You have not created any tests yet." />

            )}

          </section>



          <section>

            <SectionHeader

              title="Quick Actions"

              subtitle="Frequently used teacher tools"

            />



            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {quickActions.map((action) => (

                <button

                  key={action.title}

                  type="button"

                  onClick={() => handleNavigation(action.path)}

                  className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"

                >

                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md">

                    {action.icon}

                  </div>



                  <h3 className="font-bold text-slate-900">{action.title}</h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">

                    {action.description}

                  </p>

                </button>

              ))}

            </div>

          </section>



          <footer className="border-t border-slate-200 py-5 text-center text-xs text-slate-400">

            © {new Date().getFullYear()} EduNexa. Smart Learning. Smarter

            Testing.

          </footer>

        </div>

      </main>

    </div>

  );

}
