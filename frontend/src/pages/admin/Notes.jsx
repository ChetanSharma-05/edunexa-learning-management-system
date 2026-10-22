import { useEffect, useState } from "react";
import {
  BookOpen,
  Download,
  Edit,
  Eye,
  FileText,
  Menu,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import AdminSidebar from "../../components/AdminSidebar";

const emptyForm = {
  title: "",
  description: "",
  subject: "",
  file: null,
  is_active: true,
};

export default function Notes() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [deleteNote, setDeleteNote] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [notesResponse, subjectsResponse] =
        await Promise.all([
          api.get("/notes/", {
            params: {
              search: search.trim() || undefined,
              subject: subjectFilter || undefined,
            },
          }),
          api.get("/admin/subjects/"),
        ]);

      const notesData = notesResponse.data;
      const subjectsData = subjectsResponse.data;

      setNotes(
        Array.isArray(notesData)
          ? notesData
          : notesData?.results || []
      );

      setSubjects(
        Array.isArray(subjectsData)
          ? subjectsData
          : subjectsData?.results || []
      );
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Unable to load notes. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, subjectFilter]);

  const updateForm = (event) => {
    const { name, value, files, type, checked } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : type === "file"
            ? files?.[0] || null
            : value,
    }));
  };

  const openCreateModal = () => {
    setEditingNote(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (note) => {
    setEditingNote(note);
    setForm({
      title: note.title || "",
      description: note.description || "",
      subject: String(note.subject || ""),
      file: null,
      is_active: note.is_active,
    });
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNote(null);
    setForm(emptyForm);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = new FormData();
      payload.append("title", form.title.trim());
      payload.append(
        "description",
        form.description.trim()
      );
      payload.append("subject", form.subject);
      payload.append(
        "is_active",
        String(form.is_active)
      );

      if (form.file) {
        payload.append("file", form.file);
      }

      if (!editingNote && !form.file) {
        setError("Please select a file to upload.");
        return;
      }

      if (editingNote) {
        await api.patch(
          `/notes/${editingNote.id}/`,
          payload
        );
      } else {
        await api.post("/notes/", payload);
      }

      setSuccess(
        editingNote
          ? "Note updated successfully."
          : "Note uploaded successfully."
      );

      closeModal();
      await loadData();
    } catch (err) {
      const data = err?.response?.data;

      setError(
        data?.detail ||
          data?.file?.[0] ||
          data?.title?.[0] ||
          data?.subject?.[0] ||
          "Unable to save note. Check the form and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (note) => {
    try {
      setError("");
      setSuccess("");

      await api.patch(`/notes/${note.id}/`, {
        is_active: !note.is_active,
      });

      setSuccess(
        note.is_active
          ? "Note deactivated successfully."
          : "Note activated successfully."
      );

      await loadData();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Unable to update note status."
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteNote) return;

    try {
      setError("");

      await api.delete(`/notes/${deleteNote.id}/`);

      setDeleteNote(null);
      setSuccess("Note deleted successfully.");

      await loadData();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Unable to delete note."
      );
    }
  };

  const openFile = (note) => {
    const url = note.file_url || note.file;

    if (url) {
      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const downloadFile = (note) => {
    const url = note.file_url || note.file;

    if (!url) return;

    const link = document.createElement("a");
    link.href = url;
    link.download = note.title || "study-note";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
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
                  Academic Resources
                </p>
                <h1 className="mt-1 text-xl font-black sm:text-2xl">
                  Notes Management
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  Upload and manage study materials.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700"
            >
              <Plus size={17} />
              <span className="hidden sm:inline">
                Upload Note
              </span>
              <span className="sm:hidden">Add</span>
            </button>
          </header>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              <p>{error}</p>
              <button
                type="button"
                onClick={() => setError("")}
                className="ml-auto"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              <CheckCircle2 size={18} />
              <p>{success}</p>
              <button
                type="button"
                onClick={() => setSuccess("")}
                className="ml-auto"
              >
                <X size={17} />
              </button>
            </div>
          )}

          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Total Notes"
              value={notes.length}
              icon={<FileText size={21} />}
              color="indigo"
            />
            <StatCard
              label="Active Notes"
              value={
                notes.filter((note) => note.is_active).length
              }
              icon={<BookOpen size={21} />}
              color="emerald"
            />
            <StatCard
              label="Subjects"
              value={subjects.length}
              icon={<BookOpen size={21} />}
              color="violet"
            />
          </section>

          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_260px_auto]">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search notes..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <select
                value={subjectFilter}
                onChange={(event) =>
                  setSubjectFilter(event.target.value)
                }
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500"
              >
                <option value="">All subjects</option>
                {subjects.map((subject) => (
                  <option
                    key={subject.id}
                    value={subject.id}
                  >
                    {subject.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={loadData}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </section>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
                <p className="text-sm text-slate-400">
                  Loading notes...
                </p>
              </div>
            </div>
          ) : notes.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <FileText size={28} />
              </div>
              <h2 className="mt-4 text-lg font-black">
                No notes found
              </h2>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                Upload your first study note or change the search filters.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
              >
                <Upload size={17} />
                Upload Note
              </button>
            </div>
          ) : (
            <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {notes.map((note) => (
                <article
                  key={note.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between bg-gradient-to-br from-indigo-50 to-violet-50 p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                      <FileText size={22} />
                    </div>
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                        note.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {note.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-bold text-indigo-600">
                      {note.subject_name || "Subject"}
                    </p>
                    <h2 className="mt-2 line-clamp-2 text-lg font-black">
                      {note.title}
                    </h2>
                    <p className="mt-2 min-h-10 line-clamp-2 text-sm leading-5 text-slate-400">
                      {note.description || "No description provided."}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => openFile(note)}
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                      >
                        <Eye size={15} />
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadFile(note)}
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                      >
                        <Download size={15} />
                        Download
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() => openEditModal(note)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-50 px-3 py-2.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100"
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleStatus(note)}
                        className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-100"
                      >
                        {note.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteNote(note)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100"
                        title="Delete note"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
              <div>
                <h2 className="text-xl font-black">
                  {editingNote ? "Edit Note" : "Upload New Note"}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Add study material for students.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5 sm:p-6"
            >
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Note Title *
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={updateForm}
                  required
                  maxLength={200}
                  placeholder="e.g. Python Programming Notes"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Subject *
                </label>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={updateForm}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option
                      key={subject.id}
                      value={subject.id}
                    >
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateForm}
                  rows={3}
                  placeholder="Describe these study notes..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Upload File {!editingNote && "*"}
                </label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-6 text-center transition hover:bg-indigo-50">
                  <Upload size={25} className="text-indigo-600" />
                  <span className="mt-3 text-sm font-bold text-slate-700">
                    {form.file?.name ||
                      (editingNote
                        ? "Choose a replacement file (optional)"
                        : "Choose a PDF or document")}
                  </span>
                  <span className="mt-1 text-xs text-slate-400">
                    Select a file from your device
                  </span>
                  <input
                    type="file"
                    name="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    onChange={updateForm}
                    className="hidden"
                  />
                </label>
                {editingNote && (
                  <p className="mt-2 text-xs text-slate-400">
                    Leave empty to keep the existing file.
                  </p>
                )}
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={updateForm}
                  className="h-4 w-4 accent-indigo-600"
                />
                <span>
                  <span className="block text-sm font-bold">
                    Publish note
                  </span>
                  <span className="mt-1 block text-xs text-slate-400">
                    Active notes are visible to students.
                  </span>
                </span>
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingNote
                      ? "Save Changes"
                      : "Upload Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteNote && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 size={22} />
            </div>
            <h2 className="mt-4 text-lg font-black">
              Delete this note?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to delete{" "}
              <strong>{deleteNote.title}</strong>? This action cannot
              be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteNote(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  const styles = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500">
          {label}
        </p>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles[color]}`}>
          {icon}
        </div>
      </div>
      <p className="mt-4 text-3xl font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}