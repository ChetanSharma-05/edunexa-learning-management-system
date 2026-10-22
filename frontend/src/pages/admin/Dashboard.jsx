import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Users,
  UserRoundCheck,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/AdminSidebar";

function StatCard({
  icon: Icon,
  title,
  value,
  description,
}) {
  return (
    <div className="group rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">
            {title}
          </p>

          <h3 className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </h3>

          <p className="mt-2 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-transform duration-300 group-hover:scale-110">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white">
        <Icon size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {description}
        </p>
      </div>

      <ArrowUpRight
        size={18}
        className="text-slate-300 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-indigo-600"
      />
    </button>
  );
}

function getListData(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [tests, setTests] = useState([]);
  const [questions, setQuestions] = useState([]);

  const [error, setError] = useState("");

  const [recentTests, setRecentTests] = useState([]);

  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    subjects: 0,
    tests: 0,
    questions: 0,
  });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        teachersResponse,
        studentsResponse,
        subjectsResponse,
        testsResponse,
        questionsResponse,
      ] = await Promise.allSettled([
        api.get("/admin/teachers/"),
        api.get("/students/"),
        api.get("/admin/subjects/"),
        api.get("/testsystem/"),
        api.get("/question-bank/"),
      ]);

      const teachersData =
        teachersResponse.status === "fulfilled"
          ? getListData(teachersResponse.value?.data)
          : [];

      const studentsData =
        studentsResponse.status === "fulfilled"
          ? getListData(studentsResponse.value?.data)
          : [];

      const subjectsData =
        subjectsResponse.status === "fulfilled"
          ? getListData(subjectsResponse.value?.data)
          : [];

      const testsData =
        testsResponse.status === "fulfilled"
          ? getListData(testsResponse.value?.data)
          : [];

      const questionsData =
        questionsResponse.status === "fulfilled"
          ? getListData(questionsResponse.value?.data)
          : [];

      setTeachers(teachersData);
      setStudents(studentsData);
      setSubjects(subjectsData);
      setTests(testsData);
      setQuestions(questionsData);

      setStats({
        teachers: teachersData.length,
        students: studentsData.length,
        subjects: subjectsData.length,
        tests: testsData.length,
        questions: questionsData.length,
      });

      setRecentTests(testsData.slice(0, 5));
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    }

    navigate("/login", {
      replace: true,
    });
  };

  const go = (path) => {
    setSidebarOpen(false);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-900">
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        logout={logout}
        navigate={navigate}
      />

      <main className="min-h-screen lg:ml-[270px]">
        <header className="sticky top-0 z-30 h-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between px-5 sm:px-7 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200 lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div>
                <p className="text-xs text-slate-400">
                  Overview
                </p>

                <h2 className="text-lg font-bold sm:text-xl">
                  Admin Dashboard
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold">
                  {user?.full_name || "Admin"}
                </p>

                <p className="text-xs text-slate-400">
                  Administrator
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 font-bold text-white shadow-md shadow-indigo-500/20">
                {user?.full_name
                  ?.charAt(0)
                  ?.toUpperCase() || "A"}
              </div>

              <ChevronDown
                size={16}
                className="hidden text-slate-400 sm:block"
              />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] p-5 sm:p-7 lg:p-8">
          <section className="relative mb-7 overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-indigo-500/15 sm:p-8">
            <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

            <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-violet-300/10 blur-3xl" />

            <div className="relative max-w-3xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
                <GraduationCap size={25} />
              </div>

              <p className="text-sm font-medium text-indigo-100">
                Welcome back
              </p>

              <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                {user?.full_name || "Administrator"}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
                Manage teachers, students, subjects, tests and
                your complete EduNexa learning ecosystem from
                one place.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => go("/admin/tests")}
                  className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-indigo-600 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Manage Tests
                </button>

                <button
                  type="button"
                  onClick={() =>
                    go("/admin/question-bank")
                  }
                  className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
                >
                  Question Bank
                </button>
              </div>
            </div>
          </section>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              icon={Users}
              title="Teachers"
              value={loading ? "..." : stats.teachers}
              description="Registered teachers"
            />

            <StatCard
              icon={UserRoundCheck}
              title="Students"
              value={loading ? "..." : stats.students}
              description="Registered students"
            />

            <StatCard
              icon={BookOpen}
              title="Subjects"
              value={loading ? "..." : stats.subjects}
              description="Available subjects"
            />

            <StatCard
              icon={BarChart3}
              title="Tests"
              value={loading ? "..." : stats.tests}
              description="Created tests"
            />

            <StatCard
              icon={Activity}
              title="Questions"
              value={loading ? "..." : stats.questions}
              description="Question bank"
            />
          </section>

          <section className="mt-7 grid gap-7 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Quick Access
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    Manage EduNexa
                  </h2>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <QuickAction
                  icon={Users}
                  title="Manage Teachers"
                  description="Add, edit and manage teachers"
                  onClick={() =>
                    go("/admin/teachers")
                  }
                />

                <QuickAction
                  icon={UserRoundCheck}
                  title="Manage Students"
                  description="View and manage students"
                  onClick={() =>
                    go("/admin/students")
                  }
                />

                <QuickAction
                  icon={BookOpen}
                  title="Manage Subjects"
                  description="Create and manage subjects"
                  onClick={() =>
                    go("/admin/subjects")
                  }
                />

                <QuickAction
                  icon={Activity}
                  title="Question Bank"
                  description="Manage examination questions"
                  onClick={() =>
                    go("/admin/question-bank")
                  }
                />
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Academic
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    Recent Tests
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => go("/admin/tests")}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  View all
                </button>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                {loading ? (
                  <div className="p-8 text-center text-sm text-slate-400">
                    Loading tests...
                  </div>
                ) : recentTests.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                      <BarChart3 size={22} />
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      No tests found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Create your first test to get started.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentTests.map((test) => (
                      <button
                        type="button"
                        key={test.id}
                        onClick={() =>
                          go("/admin/tests")
                        }
                        className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-50"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <BarChart3 size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {test.title ||
                              "Untitled Test"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {test.subject_name ||
                              test.subject?.name ||
                              "Subject not available"}
                          </p>
                        </div>

                        <ArrowUpRight
                          size={16}
                          className="shrink-0 text-slate-300"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="mt-7 grid gap-5 md:grid-cols-3">
            <button
              type="button"
              onClick={() => go("/admin/teachers")}
              className="group rounded-[24px] border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Users size={21} />
                </div>

                <ArrowUpRight
                  size={18}
                  className="text-slate-300 transition group-hover:text-indigo-600"
                />
              </div>

              <h3 className="mt-5 text-lg font-bold">
                Teachers
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Manage teacher accounts and information.
              </p>
            </button>

            <button
              type="button"
              onClick={() => go("/admin/students")}
              className="group rounded-[24px] border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <UserRoundCheck size={21} />
                </div>

                <ArrowUpRight
                  size={18}
                  className="text-slate-300 transition group-hover:text-violet-600"
                />
              </div>

              <h3 className="mt-5 text-lg font-bold">
                Students
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Manage student profiles and accounts.
              </p>
            </button>

            <button
              type="button"
              onClick={() => go("/admin/subjects")}
              className="group rounded-[24px] border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <BookOpen size={21} />
                </div>

                <ArrowUpRight
                  size={18}
                  className="text-slate-300 transition group-hover:text-emerald-600"
                />
              </div>

              <h3 className="mt-5 text-lg font-bold">
                Subjects
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Organize and manage academic subjects.
              </p>
            </button>
          </section>

          <footer className="mt-8 border-t border-slate-200 pt-5">
            <div className="flex flex-col justify-between gap-2 text-xs text-slate-400 sm:flex-row">
              <p>
                © {new Date().getFullYear()} EduNexa.
                All rights reserved.
              </p>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 font-semibold transition hover:text-red-500"
              >
                Logout
              </button>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}