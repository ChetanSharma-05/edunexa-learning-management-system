import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  Download,
  FileText,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
  Sparkles,
  Layers3,
  GraduationCap,
  CheckCircle2,
  FileUp,
  ArrowUpRight,
} from "lucide-react";
import api from "../../services/api";
import TeacherSidebar from "../../components/teacher/TeacherSidebar";

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    subject: "",
    file: null,
    is_active: true,
  });

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/notes/");
      const data = response.data;
      setNotes(Array.isArray(data) ? data : data.results || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to load notes.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSubjects = useCallback(async () => {
    try {
      const response = await api.get("/admin/subjects/");
      const data = response.data;
      setSubjects(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error("SUBJECT ERROR:", err.response?.data || err);
    }
  }, []);

  useEffect(() => {
    loadNotes();
    loadSubjects();
  }, [loadNotes, loadSubjects]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.subject || !form.file) {
      setError("Title, subject and file are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const data = new FormData();
      data.append("title", form.title.trim());
      data.append("description", form.description.trim());
      data.append("subject", form.subject);
      data.append("file", form.file);
      data.append("is_active", String(form.is_active));

      await api.post("/notes/", data);

      setSuccess("Notes uploaded successfully!");
      setForm({
        title: "",
        description: "",
        subject: "",
        file: null,
        is_active: true,
      });
      setShowForm(false);

      const fileInput = document.getElementById("notes-file");
      if (fileInput) fileInput.value = "";

      await loadNotes();
    } catch (err) {
      const responseData = err.response?.data;

      setError(
        responseData?.detail ||
          Object.entries(responseData || {})
            .map(([key, value]) => {
              const message = Array.isArray(value)
                ? value.join(", ")
                : typeof value === "object"
                  ? JSON.stringify(value)
                  : value;
              return `${key}: ${message}`;
            })
            .join(" | ") ||
          "Unable to upload notes."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (note) => {
    if (!window.confirm(`Delete "${note.title}"?`)) return;

    try {
      setError("");
      setSuccess("");
      await api.delete(`/notes/${note.id}/`);
      setSuccess("Notes deleted successfully.");
      await loadNotes();
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to delete notes.");
    }
  };

  const filteredNotes = notes.filter((note) => {
    const query = search.trim().toLowerCase();

    return (
      note.title?.toLowerCase().includes(query) ||
      note.description?.toLowerCase().includes(query) ||
      note.subject_name?.toLowerCase().includes(query)
    );
  });

  const activeNotes = notes.filter((note) => note.is_active).length;
  const subjectCount = new Set(
    notes.map((note) => note.subject).filter(Boolean)
  ).size;

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6f7fb] text-slate-800">
      <TeacherSidebar />

      <main className="relative min-h-screen lg:ml-[270px]">
        <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-violet-200/30 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 top-64 h-64 w-64 rounded-full bg-cyan-100/40 blur-3xl" />

        <header className="relative border-b border-white/70 bg-white/80 px-4 py-5 backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-lg shadow-violet-200">
                <BookOpen size={23} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                    Study Notes
                  </h1>
                  <span className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-violet-700">
                    Teacher Workspace
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Organize resources and share knowledge with your students.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
                setShowForm((previous) => !previous);
              }}
              className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-200 active:scale-95"
            >
              {showForm ? <X size={18} /> : <Plus size={18} />}
              {showForm ? "Cancel Upload" : "Upload New Notes"}
            </button>
          </div>
        </header>

        <div className="relative mx-auto max-w-[1600px] space-y-7 p-4 sm:p-7 lg:p-10">
          {error && (
            <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError("")}
                className="rounded-lg p-1 hover:bg-red-100"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {success && (
            <div className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 shadow-sm">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={18} />
                {success}
              </span>
              <button
                type="button"
                onClick={() => setSuccess("")}
                className="rounded-lg p-1 hover:bg-emerald-100"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#20134d] via-[#4c35a5] to-[#7558e8] p-6 text-white shadow-2xl shadow-violet-200/60 sm:p-9">
            <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10 bg-white/5 [transform:rotateX(55deg)_rotateZ(-25deg)]" />
            <div className="pointer-events-none absolute -bottom-28 right-36 h-64 w-64 rounded-full border border-white/10 bg-white/5 [transform:rotateX(55deg)_rotateZ(25deg)]" />
            <div className="pointer-events-none absolute right-20 top-10 h-24 w-24 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md [transform:rotateY(-20deg)_rotateX(15deg)_rotateZ(12deg)] transition-transform duration-700 hover:[transform:rotateY(0deg)_rotateX(0deg)_rotateZ(0deg)]" />

            <div className="relative z-10 grid items-center gap-7 md:grid-cols-[1fr_auto]">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-violet-100 backdrop-blur-md">
                  <Sparkles size={14} />
                  YOUR DIGITAL CLASSROOM
                </div>

                <h2 className="max-w-xl text-2xl font-black leading-tight tracking-tight sm:text-4xl">
                  Great resources create
                  <span className="block bg-gradient-to-r from-cyan-200 to-violet-100 bg-clip-text text-transparent">
                    better learning.
                  </span>
                </h2>

                <p className="mt-3 max-w-lg text-sm leading-6 text-violet-100 sm:text-base">
                  Keep your study materials organized, upload class notes, and
                  make learning resources accessible to your students.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setShowForm(true);
                  }}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-violet-800 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-95"
                >
                  <Upload size={17} />
                  Add Study Material
                  <ArrowUpRight size={16} />
                </button>
              </div>

              <div className="hidden h-36 w-36 items-center justify-center rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl [transform:perspective(700px)_rotateY(-12deg)_rotateX(8deg)] transition-transform duration-500 hover:[transform:perspective(700px)_rotateY(0deg)_rotateX(0deg)] sm:flex lg:mr-8 lg:h-44 lg:w-44">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-white to-violet-100 text-violet-700 shadow-xl lg:h-28 lg:w-28">
                  <GraduationCap size={58} strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              icon={BookOpen}
              label="Total Resources"
              value={notes.length}
              detail="All uploaded study notes"
              gradient="from-violet-500 to-indigo-600"
              shadow="shadow-violet-200/60"
            />
            <StatCard
              icon={CheckCircle2}
              label="Active Resources"
              value={activeNotes}
              detail="Visible to students"
              gradient="from-emerald-400 to-teal-600"
              shadow="shadow-emerald-100"
            />
            <StatCard
              icon={Layers3}
              label="Subjects Covered"
              value={subjectCount}
              detail="Subjects with uploaded notes"
              gradient="from-sky-400 to-blue-600"
              shadow="shadow-blue-100"
            />
          </section>

          {showForm && (
            <section className="animate-[fadeInUp_0.35s_ease-out] overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-xl shadow-violet-100/50">
              <div className="flex items-center gap-4 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-white p-5 sm:p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200">
                  <FileUp size={23} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 sm:text-xl">
                    Upload Study Material
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Add a title, select a subject, and attach your document.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-7">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Notes Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      value={form.title}
                      onChange={(event) =>
                        setForm({ ...form, title: event.target.value })
                      }
                      placeholder="e.g. Introduction to Python"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={form.subject}
                      onChange={(event) =>
                        setForm({ ...form, subject: event.target.value })
                      }
                      className={inputClass}
                    >
                      <option value="">Select a subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(event) =>
                      setForm({ ...form, description: event.target.value })
                    }
                    placeholder="What will students learn from these notes?"
                    className={`${inputClass} resize-y`}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Study Document <span className="text-red-500">*</span>
                  </label>
                  <label
                    htmlFor="notes-file"
                    className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/50 px-5 py-8 text-center transition-all duration-300 hover:border-violet-400 hover:bg-violet-50"
                  >
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-md transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-3">
                      <Upload size={25} />
                    </div>
                    <span className="break-all text-sm font-bold text-slate-800">
                      {form.file
                        ? form.file.name
                        : "Click to choose your document"}
                    </span>
                    <span className="mt-2 text-xs text-slate-500">
                      PDF, DOC, DOCX, PPT or PPTX
                    </span>
                    <input
                      id="notes-file"
                      required
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                      className="hidden"
                      onChange={(event) =>
                        setForm({
                          ...form,
                          file: event.target.files?.[0] || null,
                        })
                      }
                    />
                  </label>
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:bg-violet-50/60">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      setForm({ ...form, is_active: event.target.checked })
                    }
                    className="h-5 w-5 accent-violet-600"
                  />
                  <span>
                    <span className="block text-sm font-bold text-slate-800">
                      Publish for students
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Students can access this material when it is active.
                    </span>
                  </span>
                </label>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={saving}
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Upload size={18} />
                    )}
                    {saving ? "Uploading..." : "Upload Notes"}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">
                  Your Study Resources
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Manage your uploaded documents in one place.
                </p>
              </div>

              <div className="relative w-full lg:max-w-sm">
                <Search
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search title or subject..."
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 px-5 py-3 sm:px-7">
              <span className="text-sm font-semibold text-slate-500">
                Showing{" "}
                <span className="font-black text-slate-900">
                  {filteredNotes.length}
                </span>{" "}
                resources
              </span>
              <span className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {activeNotes} active
              </span>
            </div>

            {loading ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3">
                <Loader2
                  className="animate-spin text-violet-600"
                  size={34}
                />
                <p className="text-sm font-semibold text-slate-500">
                  Loading your resources...
                </p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center px-5 py-16 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-50 text-violet-400">
                  <FileText size={38} strokeWidth={1.5} />
                </div>
                <h3 className="mt-5 text-lg font-black text-slate-800">
                  {search ? "No matching notes" : "No study notes yet"}
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  {search
                    ? "Try another title or subject name."
                    : "Upload your first resource to start building your digital classroom."}
                </p>
                {!search && (
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700"
                  >
                    <Plus size={17} />
                    Upload First Note
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7 xl:grid-cols-3">
                {filteredNotes.map((note, index) => (
                  <article
                    key={note.id}
                    style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
                    className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-300 hover:-translate-y-2 hover:border-violet-200 hover:shadow-[0_20px_45px_-20px_rgba(109,40,217,0.25)]"
                  >
                    <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-gradient-to-bl from-violet-50 to-transparent transition-transform duration-500 group-hover:scale-150" />

                    <div className="relative flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-700 shadow-sm transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-110">
                        <FileText size={23} />
                      </div>

                      <span
                        className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide ${
                          note.is_active
                            ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                            : "border border-slate-200 bg-slate-100 text-slate-500"
                        }`}
                      >
                        {note.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="relative mt-5 flex-1">
                      <p className="mb-2 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">
                        <BookOpen size={13} />
                        <span className="truncate">
                          {note.subject_name || "Subject"}
                        </span>
                      </p>

                      <h3 className="break-words text-lg font-black leading-snug text-slate-900 transition-colors group-hover:text-violet-700">
                        {note.title}
                      </h3>

                      <p className="mt-2 break-words text-sm leading-6 text-slate-500 [overflow-wrap:anywhere]">
                        {note.description || "No description provided."}
                      </p>
                    </div>

                    <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                      {note.file_url ? (
                        <a
                          href={note.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-50 px-3 py-3 text-sm font-extrabold text-violet-700 transition-all duration-300 hover:bg-violet-600 hover:text-white"
                        >
                          <Download size={16} />
                          Open Document
                          <ArrowUpRight size={14} />
                        </a>
                      ) : (
                        <span className="flex flex-1 items-center justify-center rounded-xl bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-400">
                          File unavailable
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(note)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 transition-all duration-300 hover:rotate-3 hover:scale-105 hover:bg-red-500 hover:text-white"
                        title="Delete notes"
                        aria-label={`Delete ${note.title}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <footer className="flex flex-col items-center justify-between gap-2 pb-3 text-center text-xs text-slate-400 sm:flex-row sm:text-left">
            <span>Study Notes · Teacher Workspace</span>
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-violet-400" />
              Built for better learning
            </span>
          </footer>
        </div>
      </main>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, detail, gradient, shadow }) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-100 hover:shadow-xl hover:shadow-violet-100/60 sm:p-6">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-slate-50 transition-transform duration-500 group-hover:scale-150" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            {value}
          </p>
          <p className="mt-2 text-xs font-medium text-slate-400">{detail}</p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg ${shadow} transition-all duration-500 group-hover:rotate-[-8deg] group-hover:scale-110 group-hover:[transform:perspective(400px)_rotateY(-15deg)_rotateX(10deg)]`}
        >
          <Icon size={23} />
        </div>
      </div>
    </article>
  );
}