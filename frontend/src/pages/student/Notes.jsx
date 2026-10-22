import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Menu,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import StudentSidebar from "../../components/StudentSidebar";


export default function Notes() {

  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [searchParams] = useSearchParams();

  const initialSubject =
    searchParams.get("subject") || "";

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [notes, setNotes] = useState([]);

  const [subjects, setSubjects] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [subjectFilter, setSubjectFilter] =
    useState(initialSubject);


  const loadSubjects = async () => {

    try {

      const response = await api.get(
        "/admin/subjects/student/"
      );

      const data = response?.data;

      if (Array.isArray(data)) {

        setSubjects(data);

      } else if (
        Array.isArray(data?.results)
      ) {

        setSubjects(data.results);

      } else {

        setSubjects([]);

      }

    } catch (err) {

      console.error(
        "Unable to load subjects:",
        err
      );

    }
  };


  const loadNotes = async () => {

    try {

      setLoading(true);

      setError("");

      const response = await api.get(
        "/notes/student/",
        {
          params: {
            search:
              search.trim() || undefined,

            subject:
              subjectFilter || undefined,
          },
        }
      );

      const data = response?.data;

      if (Array.isArray(data)) {

        setNotes(data);

      } else if (
        Array.isArray(data?.results)
      ) {

        setNotes(data.results);

      } else {

        setNotes([]);

      }

    } catch (err) {

      console.error(
        "Student notes error:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to load notes."
      );

      setNotes([]);

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    loadSubjects();

  }, []);


  useEffect(() => {

    loadNotes();

  }, [search, subjectFilter]);


  const filteredNotes = useMemo(() => {

    return notes.filter(
      (note) =>
        note?.is_active !== false
    );

  }, [notes]);


  const getFileExtension = (file) => {

    if (!file) {
      return "FILE";
    }

    const cleanFile =
      file.split("?")[0];

    const parts =
      cleanFile.split(".");

    if (parts.length < 2) {
      return "FILE";
    }

    return parts[
      parts.length - 1
    ].toUpperCase();

  };


  const isPdf = (note) => {

    const file =
      note?.file ||
      note?.file_url ||
      "";

    return file
      .toLowerCase()
      .includes(".pdf");

  };


  const openFile = (note) => {

    const url =
      note?.file_url ||
      note?.file;

    if (!url) {
      return;
    }

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };


  const downloadFile = async (note) => {

    const url =
      note?.file_url ||
      note?.file;

    if (!url) {
      return;
    }

    try {

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          "Unable to download file."
        );
      }

      const blob =
        await response.blob();

      const blobUrl =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement("a");

      link.href = blobUrl;

      link.download =
        note?.title
          ? `${note.title}.${getFileExtension(
              url
            ).toLowerCase()}`
          : `note.${getFileExtension(
              url
            ).toLowerCase()}`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        blobUrl
      );

    } catch (err) {

      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );

    }
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
                  Notes
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  Access your study materials and
                  learning resources.
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

                <FileText size={24} />

              </div>


              <h2 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl">
                Study Smarter
              </h2>


              <p className="mt-2 text-sm leading-6 text-indigo-100 sm:text-base">
                Find notes by subject, read your study
                materials and download resources anytime.
              </p>

            </div>

          </section>


          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

            <div className="flex flex-col gap-4">

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

                <div className="relative flex-1">

                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search notes..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-indigo-500 focus:bg-white"
                  />

                </div>


                <div className="relative lg:w-64">

                  <Filter
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    value={subjectFilter}
                    onChange={(event) =>
                      setSubjectFilter(
                        event.target.value
                      )
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-semibold text-slate-600 outline-none transition focus:border-indigo-500 focus:bg-white"
                  >

                    <option value="">
                      All Subjects
                    </option>

                    {subjects.map(
                      (subject) => (

                        <option
                          key={subject.id}
                          value={subject.id}
                        >
                          {subject.name}
                        </option>

                      )
                    )}

                  </select>

                </div>


                {(search ||
                  subjectFilter) && (

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                  >

                    <X size={16} />

                    Clear

                  </button>

                )}

              </div>


              <div className="flex items-center justify-between border-t border-slate-100 pt-4">

                <div>

                  <p className="text-sm font-black text-slate-900">
                    Available Notes
                  </p>

                  <p className="mt-1 text-xs text-slate-400">

                    {filteredNotes.length} note
                    {filteredNotes.length !==
                    1
                      ? "s"
                      : ""}{" "}
                    available

                  </p>

                </div>


                <button
                  type="button"
                  onClick={loadNotes}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600"
                  title="Refresh"
                >

                  <RefreshCw
                    size={16}
                  />

                </button>

              </div>

            </div>

          </section>


          {loading ? (

            <section className="flex min-h-[360px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">

              <div className="flex flex-col items-center gap-3">

                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />

                <p className="text-sm font-semibold text-slate-400">
                  Loading notes...
                </p>

              </div>

            </section>

          ) : error ? (

            <section className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-red-100 bg-white px-6 text-center shadow-sm">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">

                <AlertCircle size={26} />

              </div>


              <h3 className="mt-4 text-lg font-black text-slate-800">
                Unable to load notes
              </h3>


              <p className="mt-2 max-w-md text-sm text-slate-400">
                {error}
              </p>


              <button
                type="button"
                onClick={loadNotes}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
              >

                <RefreshCw size={16} />

                Try Again

              </button>

            </section>

          ) : filteredNotes.length === 0 ? (

            <section className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 text-center shadow-sm">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                <FileText size={28} />

              </div>


              <h3 className="mt-4 text-lg font-black text-slate-800">
                No notes found
              </h3>


              <p className="mt-1 max-w-md text-sm leading-5 text-slate-400">

                {search ||
                subjectFilter
                  ? "Try changing your search or subject filter."
                  : "No study notes are currently available."}

              </p>


              {(search ||
                subjectFilter) && (

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
                >
                  Clear Filters
                </button>

              )}

            </section>

          ) : (

            <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

              {filteredNotes.map(
                (note) => (

                  <article
                    key={note.id}
                    className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"
                  >

                    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6">

                      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-100/60 blur-2xl" />


                      <div className="relative flex items-start justify-between">

                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">

                          <FileText
                            size={22}
                          />

                        </div>


                        <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-600 shadow-sm">

                          {getFileExtension(
                            note.file_url ||
                              note.file
                          )}

                        </span>

                      </div>

                    </div>


                    <div className="p-6">

                      <div className="mb-3 flex items-center gap-2">

                        <BookOpen
                          size={14}
                          className="text-indigo-500"
                        />

                        <span className="truncate text-xs font-bold text-indigo-600">

                          {note.subject_name ||
                            "Subject"}

                        </span>

                      </div>


                      <h3 className="line-clamp-2 text-lg font-black text-slate-900">

                        {note.title ||
                          "Untitled Note"}

                      </h3>


                      <p className="mt-2 min-h-[40px] line-clamp-2 text-sm leading-5 text-slate-400">

                        {note.description ||
                          "Study material for this subject."}

                      </p>


                      <div className="mt-5 grid grid-cols-2 gap-3">

                        <button
                          type="button"
                          onClick={() =>
                            openFile(note)
                          }
                          disabled={
                            !note.file_url &&
                            !note.file
                          }
                          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >

                          <ExternalLink
                            size={15}
                          />

                          Open

                        </button>


                        <button
                          type="button"
                          onClick={() =>
                            downloadFile(note)
                          }
                          disabled={
                            !note.file_url &&
                            !note.file
                          }
                          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-3 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >

                          <Download
                            size={15}
                          />

                          Download

                        </button>

                      </div>


                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">

                        <span className="text-[11px] font-medium text-slate-400">

                          {note.created_by_name ||
                            "EduNexa"}

                        </span>


                        <span className="text-[11px] font-medium text-slate-400">

                          {note.created_at
                            ? new Date(
                                note.created_at
                              ).toLocaleDateString(
                                "en-IN"
                              )
                            : ""}

                        </span>

                      </div>

                    </div>

                  </article>

                )
              )}

            </section>

          )}

        </div>

      </main>

    </div>
  );
}