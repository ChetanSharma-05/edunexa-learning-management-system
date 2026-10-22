import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Menu,
  RefreshCw,
  Search,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import StudentSidebar from "../../components/StudentSidebar";


export default function Subjects() {

  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [subjects, setSubjects] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");


  const loadSubjects = async () => {

    try {

      setLoading(true);

      setError("");

      const response = await api.get(
        "/admin/subjects/student/",
        {
          params: {
            search: search.trim() || undefined,
          },
        }
      );

      const data = response?.data;

      if (Array.isArray(data)) {

        setSubjects(data);

      } else if (Array.isArray(data?.results)) {

        setSubjects(data.results);

      } else {

        setSubjects([]);

      }

    } catch (err) {

      console.error(
        "Student subjects error:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to load subjects."
      );

      setSubjects([]);

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    loadSubjects();

  }, [search]);


  const filteredSubjects = useMemo(() => {

    return subjects.filter(
      (subject) =>
        subject?.is_active !== false
    );

  }, [subjects]);


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

          <header className="mb-7 flex items-center justify-between">

            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={() =>
                  setSidebarOpen(true)
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 lg:hidden"
              >
                <Menu size={20} />
              </button>


              <div>

                <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-500">
                  Learning
                </p>

                <h1 className="mt-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                  Subjects
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  Explore your available subjects and
                  learning materials.
                </p>

              </div>

            </div>


            <div className="hidden h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 font-bold text-indigo-600 sm:flex">

              {user?.full_name
                ?.charAt(0)
                ?.toUpperCase() || "S"}

            </div>

          </header>


          <section className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-6 text-white shadow-xl shadow-indigo-500/15 sm:p-8">

            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />

            <div className="absolute -bottom-24 right-20 h-48 w-48 rounded-full bg-violet-300/20 blur-3xl" />


            <div className="relative z-10 max-w-2xl">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">

                <GraduationCap size={24} />

              </div>


              <h2 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl">
                Learn. Practice. Improve.
              </h2>


              <p className="mt-2 text-sm leading-6 text-indigo-100 sm:text-base">
                Select a subject to explore your academic
                content, notes and tests.
              </p>

            </div>

          </section>


          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="font-black text-slate-900">
                  Available Subjects
                </h2>

                <p className="mt-1 text-xs text-slate-400">

                  {filteredSubjects.length} subject
                  {filteredSubjects.length !== 1
                    ? "s"
                    : ""}{" "}
                  available

                </p>

              </div>


              <div className="relative w-full sm:w-72">

                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search subjects..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-indigo-500 focus:bg-white"
                />

              </div>

            </div>

          </section>


          {loading ? (

            <section className="flex min-h-[360px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">

              <div className="flex flex-col items-center gap-3">

                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />

                <p className="text-sm font-semibold text-slate-400">
                  Loading subjects...
                </p>

              </div>

            </section>

          ) : error ? (

            <section className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-red-100 bg-white px-6 text-center shadow-sm">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">

                <AlertCircle size={26} />

              </div>


              <h3 className="mt-4 text-lg font-black text-slate-800">
                Unable to load subjects
              </h3>


              <p className="mt-2 max-w-md text-sm text-slate-400">
                {error}
              </p>


              <button
                type="button"
                onClick={loadSubjects}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
              >

                <RefreshCw size={16} />

                Try Again

              </button>

            </section>

          ) : filteredSubjects.length === 0 ? (

            <section className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 text-center shadow-sm">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                <BookOpen size={28} />

              </div>


              <h3 className="mt-4 text-lg font-black text-slate-800">
                No subjects found
              </h3>


              <p className="mt-1 max-w-md text-sm text-slate-400">

                {search
                  ? "Try searching with another subject name or code."
                  : "No active subjects are currently available."}

              </p>

            </section>

          ) : (

            <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

              {filteredSubjects.map(
                (subject, index) => (

                  <div
                    key={subject.id}
                    className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"
                  >

                    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6">

                      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-100/60 blur-2xl" />


                      <div className="relative flex items-start justify-between">

                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">

                          <BookOpen size={22} />

                        </div>


                        <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-600 shadow-sm">

                          {subject.code ||
                            `SUB-${index + 1}`}

                        </span>

                      </div>

                    </div>


                    <div className="p-6">

                      <h3 className="line-clamp-1 text-lg font-black text-slate-900">

                        {subject.name ||
                          "Untitled Subject"}

                      </h3>


                      <p className="mt-2 min-h-[40px] line-clamp-2 text-sm leading-5 text-slate-400">

                        {subject.description ||
                          "Explore learning resources, notes and tests for this subject."}

                      </p>


                      <div className="mt-5 grid grid-cols-2 gap-3">

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/student/notes?subject=${subject.id}`
                            )
                          }
                          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                        >

                          <FileText size={15} />

                          Notes

                        </button>


                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/student/tests?subject=${subject.id}`
                            )
                          }
                          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-3 text-xs font-bold text-white transition hover:bg-indigo-700"
                        >

                          <ClipboardCheck size={15} />

                          Tests

                        </button>

                      </div>


                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/student/tests?subject=${subject.id}`
                          )
                        }
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-xs font-bold text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600"
                      >

                        Explore Subject

                        <ArrowRight
                          size={15}
                          className="transition-transform group-hover:translate-x-1"
                        />

                      </button>

                    </div>

                  </div>

                )
              )}

            </section>

          )}

        </div>

      </main>

    </div>
  );
}