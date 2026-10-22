import {
  BookOpen,
  CheckCircle2,
  Edit3,
  Menu,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserRoundCheck,
  UserRoundX,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/AdminSidebar";

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  iconClass,
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-slate-100/70 transition duration-500 group-hover:scale-150" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass}`}
          >
            <Icon size={21} />
          </div>

          <span className="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-bold tracking-widest text-slate-400">
            EDU
          </span>
        </div>

        <div className="mt-5">
          <p className="text-3xl font-black tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 font-semibold text-slate-700">{title}</p>

          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />

      {active ? "Active" : "Inactive"}
    </span>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
      />
    </div>
  );
}

function Modal({
  title,
  subtitle,
  children,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-md">
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/70 bg-white shadow-2xl">
        <div className="sticky top-0 z-20 flex items-start justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur-xl sm:px-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <BookOpen size={18} />
              </div>

              <h2 className="text-lg font-black text-slate-900 sm:text-xl">
                {title}
              </h2>
            </div>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}

export default function Subjects() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [deleteSubject, setDeleteSubject] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  const getErrorMessage = (
    err,
    fallback = "Something went wrong."
  ) => {
    const data = err?.response?.data;

    if (!data) {
      return fallback;
    }

    if (typeof data === "string") {
      return data;
    }

    if (data.detail) {
      return String(data.detail);
    }

    if (data.message) {
      return String(data.message);
    }

    const firstError = Object.values(data)
      .flat()
      .find(
        (item) =>
          typeof item === "string" && item.trim()
      );

    return firstError || fallback;
  };

  const loadSubjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/subjects/");
      const data = response?.data;

      if (Array.isArray(data)) {
        setSubjects(data);
      } else if (Array.isArray(data?.results)) {
        setSubjects(data.results);
      } else {
        setSubjects([]);
      }
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to load subjects."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const activeSubjects = subjects.filter(
    (subject) => subject.is_active
  ).length;

  const inactiveSubjects = subjects.filter(
    (subject) => !subject.is_active
  ).length;

  const filteredSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return subjects.filter((subject) => {
      const matchesSearch =
        !query ||
        String(subject.name || "")
          .toLowerCase()
          .includes(query) ||
        String(subject.code || "")
          .toLowerCase()
          .includes(query) ||
        String(subject.description || "")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" &&
          subject.is_active) ||
        (statusFilter === "INACTIVE" &&
          !subject.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [subjects, search, statusFilter]);

  const resetForm = () => {
    setForm({
      name: "",
      code: "",
      description: "",
    });
  };

  const openCreate = () => {
    resetForm();
    setEditingSubject(null);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEdit = (subject) => {
    setForm({
      name: subject.name || "",
      code: subject.code || "",
      description: subject.description || "",
    });

    setEditingSubject(subject);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingSubject(null);
    resetForm();
    setError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const showSuccess = (message) => {
    setSuccess(message);

    window.setTimeout(() => {
      setSuccess("");
    }, 3000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.name.trim()) {
      setError("Subject name is required.");
      return;
    }

    if (!form.code.trim()) {
      setError("Subject code is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim(),
      };

      if (editingSubject) {
        await api.patch(
          `/admin/subjects/${editingSubject.id}/`,
          payload
        );

        showSuccess(
          "Subject updated successfully."
        );
      } else {
        await api.post(
          "/admin/subjects/",
          payload
        );

        showSuccess(
          "Subject created successfully."
        );
      }

      await loadSubjects();

      setShowModal(false);
      setEditingSubject(null);
      resetForm();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to save subject."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (subject) => {
    try {
      setError("");

      await api.patch(
        `/admin/subjects/${subject.id}/`,
        {
          is_active: !subject.is_active,
        }
      );

      await loadSubjects();

      showSuccess(
        subject.is_active
          ? "Subject deactivated successfully."
          : "Subject activated successfully."
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to update subject status."
        )
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteSubject) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/admin/subjects/${deleteSubject.id}/`
      );

      const deletedName = deleteSubject.name;

      setDeleteSubject(null);

      await loadSubjects();

      showSuccess(
        `${deletedName} deleted successfully.`
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to delete subject."
        )
      );
    }
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
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div>
                <p className="text-xs text-slate-400">
                  Admin Management
                </p>

                <h2 className="text-lg font-bold sm:text-xl">
                  Subjects
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold">
                  {user?.full_name ||
                    user?.username ||
                    "Admin"}
                </p>

                <p className="text-xs text-slate-400">
                  {user?.role || "ADMIN"}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 font-bold text-white shadow-md">
                {user?.full_name
                  ?.charAt(0)
                  ?.toUpperCase() || "A"}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] p-5 sm:p-7 lg:p-8">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
              <X
                size={18}
                className="mt-0.5 shrink-0"
              />

              <div className="flex-1">
                <p className="font-semibold">
                  Something went wrong
                </p>

                <p className="mt-1">{error}</p>
              </div>

              <button
                type="button"
                onClick={() => setError("")}
                className="rounded-lg p-1 hover:bg-rose-100"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <CheckCircle2 size={18} />

              <span className="font-semibold">
                {success}
              </span>

              <button
                type="button"
                onClick={() => setSuccess("")}
                className="ml-auto"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-indigo-500">
                <Sparkles size={16} />
                Smart Learning. Smarter Testing.
              </div>

              <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
                Subjects
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage academic subjects, subject codes
                and descriptions.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700"
            >
              <Plus size={18} />
              Add Subject
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              icon={BookOpen}
              title="Total Subjects"
              value={subjects.length}
              subtitle="All registered subjects"
              iconClass="bg-indigo-50 text-indigo-600"
            />

            <StatCard
              icon={CheckCircle2}
              title="Active Subjects"
              value={activeSubjects}
              subtitle="Currently active"
              iconClass="bg-emerald-50 text-emerald-600"
            />

            <StatCard
              icon={UserRoundX}
              title="Inactive Subjects"
              value={inactiveSubjects}
              subtitle="Currently inactive"
              iconClass="bg-rose-50 text-rose-600"
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Subject Directory
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Search and manage all subjects.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                      placeholder="Search subjects..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white sm:w-64"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value)
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">
                      All Status
                    </option>

                    <option value="ACTIVE">
                      Active
                    </option>

                    <option value="INACTIVE">
                      Inactive
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />

                  <p className="text-sm font-medium text-slate-400">
                    Loading subjects...
                  </p>
                </div>
              </div>
            ) : filteredSubjects.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <BookOpen size={28} />
                </div>

                <h3 className="mt-5 text-lg font-black text-slate-800">
                  No subjects found
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                  No subjects match your current search
                  or status filter.
                </p>

                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-5 flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
                >
                  <Plus size={16} />
                  Add Subject
                </button>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70">
                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                          Subject
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                          Code
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                          Description
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">
                          Status
                        </th>

                        <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-wider text-slate-400">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredSubjects.map(
                        (subject) => (
                          <tr
                            key={subject.id}
                            className="transition hover:bg-slate-50/70"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md">
                                  <BookOpen size={19} />
                                </div>

                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900">
                                    {subject.name ||
                                      "Unnamed Subject"}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-400">
                                    Subject ID:{" "}
                                    {subject.id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-600">
                                {subject.code || "—"}
                              </span>
                            </td>

                            <td className="max-w-md px-6 py-5">
                              <p className="line-clamp-2 text-sm leading-6 text-slate-500">
                                {subject.description ||
                                  "No description available."}
                              </p>
                            </td>

                            <td className="px-6 py-5">
                              <StatusBadge
                                active={subject.is_active}
                              />
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleStatus(subject)
                                  }
                                  className={`rounded-xl p-2.5 transition ${
                                    subject.is_active
                                      ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                                      : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                  }`}
                                  title={
                                    subject.is_active
                                      ? "Deactivate"
                                      : "Activate"
                                  }
                                >
                                  {subject.is_active ? (
                                    <UserRoundX
                                      size={17}
                                    />
                                  ) : (
                                    <UserRoundCheck
                                      size={17}
                                    />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openEdit(subject)
                                  }
                                  className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 transition hover:bg-indigo-100"
                                  title="Edit"
                                >
                                  <Edit3 size={17} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteSubject(subject)
                                  }
                                  className="rounded-xl bg-rose-50 p-2.5 text-rose-500 transition hover:bg-rose-100"
                                  title="Delete"
                                >
                                  <Trash2 size={17} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-slate-100 lg:hidden">
                  {filteredSubjects.map(
                    (subject) => (
                      <div
                        key={subject.id}
                        className="p-5"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                            <BookOpen size={19} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900">
                              {subject.name ||
                                "Unnamed Subject"}
                            </p>

                            <p className="mt-1 text-xs font-bold text-indigo-500">
                              {subject.code ||
                                "No Code"}
                            </p>

                            <div className="mt-3">
                              <StatusBadge
                                active={
                                  subject.is_active
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs leading-6 text-slate-500">
                            {subject.description ||
                              "No description available."}
                          </p>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              toggleStatus(subject)
                            }
                            className="rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-600"
                          >
                            {subject.is_active
                              ? "Disable"
                              : "Enable"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEdit(subject)
                            }
                            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-50 px-3 py-2.5 text-xs font-bold text-indigo-600"
                          >
                            <Edit3 size={14} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteSubject(subject)
                            }
                            className="flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-500"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <Modal
          title={
            editingSubject
              ? "Edit Subject"
              : "Add New Subject"
          }
          subtitle={
            editingSubject
              ? "Update subject information."
              : "Create a new academic subject."
          }
          onClose={closeModal}
        >
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
                {error}
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <InputField
                label="Subject Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Data Structures"
                required
              />

              <InputField
                label="Subject Code"
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="DSA101"
                required
              />

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter subject description..."
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingSubject
                    ? "Update Subject"
                    : "Create Subject"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteSubject && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <Trash2 size={24} />
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-900">
              Delete Subject?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to delete{" "}
              <span className="font-bold text-slate-800">
                {deleteSubject.name}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setDeleteSubject(null)
                }
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-200 hover:bg-rose-700"
              >
                Delete Subject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}