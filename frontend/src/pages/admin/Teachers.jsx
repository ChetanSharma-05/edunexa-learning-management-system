import {
  BookOpen,
  Check,
  CheckCircle2,
  Edit3,
  GraduationCap,
  Mail,
  Menu,
  Phone,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserRoundCheck,
  UserRoundX,
  Users,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/AdminSidebar";

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

function TeacherAvatar({ name }) {
  const letter = name?.charAt(0)?.toUpperCase() || "T";

  return (
    <div className="relative shrink-0">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-lg font-black text-white shadow-lg shadow-indigo-500/20">
        {letter}
      </div>

      <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white">
        <Check size={11} strokeWidth={3} />
      </div>
    </div>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  disabled = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
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
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/70 bg-white shadow-2xl">
        <div className="sticky top-0 z-20 flex items-start justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur-xl sm:px-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <GraduationCap size={18} />
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

          <p className="mt-1 font-semibold text-slate-700">
            {title}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Teachers() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [deleteTeacher, setDeleteTeacher] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    username: "",
    password: "",
    full_name: "",
    email: "",
    employee_id: "",
    phone: "",
    qualification: "",
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

    const values = Object.values(data).flat();

    const first = values.find(
      (item) =>
        typeof item === "string" && item.trim()
    );

    return first || fallback;
  };

  const loadTeachers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/admin/teachers/"
      );

      const data = response?.data;

      if (Array.isArray(data)) {
        setTeachers(data);
      } else if (Array.isArray(data?.results)) {
        setTeachers(data.results);
      } else {
        setTeachers([]);
      }
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to load teachers."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const activeTeachers = teachers.filter(
    (teacher) => teacher.is_active
  ).length;

  const inactiveTeachers = teachers.filter(
    (teacher) => !teacher.is_active
  ).length;

  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return teachers.filter((teacher) => {
      const matchesSearch =
        !query ||
        String(teacher.full_name || "")
          .toLowerCase()
          .includes(query) ||
        String(teacher.username || "")
          .toLowerCase()
          .includes(query) ||
        String(teacher.email || "")
          .toLowerCase()
          .includes(query) ||
        String(teacher.employee_id || "")
          .toLowerCase()
          .includes(query) ||
        String(teacher.qualification || "")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" &&
          teacher.is_active) ||
        (statusFilter === "INACTIVE" &&
          !teacher.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [teachers, search, statusFilter]);

  const resetForm = () => {
    setForm({
      username: "",
      password: "",
      full_name: "",
      email: "",
      employee_id: "",
      phone: "",
      qualification: "",
    });
  };

  const openCreate = () => {
    resetForm();
    setEditingTeacher(null);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEdit = (teacher) => {
    setForm({
      username: teacher.username || "",
      password: "",
      full_name: teacher.full_name || "",
      email: teacher.email || "",
      employee_id: teacher.employee_id || "",
      phone: teacher.phone || "",
      qualification: teacher.qualification || "",
    });

    setEditingTeacher(teacher);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingTeacher(null);
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.username.trim()) {
      setError("Username is required.");
      return;
    }

    if (!editingTeacher && !form.password.trim()) {
      setError("Password is required.");
      return;
    }

    if (!form.full_name.trim()) {
      setError("Full name is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        username: form.username.trim(),
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        employee_id: form.employee_id.trim(),
        phone: form.phone.trim(),
        qualification: form.qualification.trim(),
      };

      if (!editingTeacher) {
        payload.password = form.password;
      }

      if (editingTeacher) {
        await api.patch(
          `/admin/teachers/${editingTeacher.id}/`,
          payload
        );

        setSuccess(
          "Teacher updated successfully."
        );
      } else {
        await api.post(
          "/admin/teachers/",
          payload
        );

        setSuccess(
          "Teacher created successfully."
        );
      }

      await loadTeachers();

      setShowModal(false);
      setEditingTeacher(null);
      resetForm();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to save teacher."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (teacher) => {
    try {
      setError("");

      await api.patch(
        `/admin/teachers/${teacher.id}/`,
        {
          is_active: !teacher.is_active,
        }
      );

      await loadTeachers();

      setSuccess(
        teacher.is_active
          ? "Teacher deactivated successfully."
          : "Teacher activated successfully."
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to update teacher status."
        )
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTeacher) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/admin/teachers/${deleteTeacher.id}/`
      );

      setDeleteTeacher(null);

      await loadTeachers();

      setSuccess(
        "Teacher deleted successfully."
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to delete teacher."
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
                  Teachers
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
                Teachers
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage teachers, qualifications,
                contact information and account status.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700"
            >
              <Plus size={18} />
              Add Teacher
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              icon={Users}
              title="Total Teachers"
              value={teachers.length}
              subtitle="All registered teachers"
              iconClass="bg-indigo-50 text-indigo-600"
            />

            <StatCard
              icon={UserRoundCheck}
              title="Active Teachers"
              value={activeTeachers}
              subtitle="Currently active"
              iconClass="bg-emerald-50 text-emerald-600"
            />

            <StatCard
              icon={UserRoundX}
              title="Inactive Teachers"
              value={inactiveTeachers}
              subtitle="Currently inactive"
              iconClass="bg-rose-50 text-rose-600"
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Teacher Directory
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Search and manage all teachers.
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
                      placeholder="Search teachers..."
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
                    Loading teachers...
                  </p>
                </div>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Users size={28} />
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-800">
                  No teachers found
                </h3>

                <p className="mt-1 max-w-md text-sm text-slate-400">
                  Try changing your search or status
                  filter, or add a new teacher.
                </p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">
                          Teacher
                        </th>

                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">
                          Employee ID
                        </th>

                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">
                          Contact
                        </th>

                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">
                          Qualification
                        </th>

                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">
                          Status
                        </th>

                        <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-wider text-slate-400">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredTeachers.map(
                        (teacher) => (
                          <tr
                            key={teacher.id}
                            className="transition hover:bg-slate-50/70"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <TeacherAvatar
                                  name={
                                    teacher.full_name
                                  }
                                />

                                <div className="min-w-0">
                                  <p className="truncate font-bold text-slate-900">
                                    {teacher.full_name ||
                                      "Unnamed Teacher"}
                                  </p>

                                  <p className="mt-1 truncate text-xs text-slate-400">
                                    @
                                    {teacher.username ||
                                      "username"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                                {teacher.employee_id ||
                                  "—"}
                              </span>
                            </td>

                            <td className="px-6 py-5">
                              <div className="space-y-1">
                                <p className="flex items-center gap-2 text-xs text-slate-600">
                                  <Mail size={13} />
                                  {teacher.email || "—"}
                                </p>

                                <p className="flex items-center gap-2 text-xs text-slate-400">
                                  <Phone size={13} />
                                  {teacher.phone || "—"}
                                </p>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <span className="text-sm font-medium text-slate-600">
                                {teacher.qualification ||
                                  "Not specified"}
                              </span>
                            </td>

                            <td className="px-6 py-5">
                              <StatusBadge
                                active={
                                  teacher.is_active
                                }
                              />
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleStatus(
                                      teacher
                                    )
                                  }
                                  className={`rounded-xl p-2.5 transition ${
                                    teacher.is_active
                                      ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                                      : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                  }`}
                                  title={
                                    teacher.is_active
                                      ? "Deactivate"
                                      : "Activate"
                                  }
                                >
                                  {teacher.is_active ? (
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
                                    openEdit(teacher)
                                  }
                                  className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 transition hover:bg-indigo-100"
                                  title="Edit"
                                >
                                  <Edit3 size={17} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteTeacher(
                                      teacher
                                    )
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
                  {filteredTeachers.map(
                    (teacher) => (
                      <div
                        key={teacher.id}
                        className="p-5"
                      >
                        <div className="flex items-start gap-3">
                          <TeacherAvatar
                            name={teacher.full_name}
                          />

                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900">
                              {teacher.full_name ||
                                "Unnamed Teacher"}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              @
                              {teacher.username ||
                                "username"}
                            </p>

                            <div className="mt-3">
                              <StatusBadge
                                active={
                                  teacher.is_active
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-4 text-xs">
                          <p className="flex items-center gap-2 text-slate-600">
                            <Mail size={14} />
                            {teacher.email || "—"}
                          </p>

                          <p className="flex items-center gap-2 text-slate-600">
                            <Phone size={14} />
                            {teacher.phone || "—"}
                          </p>

                          <p className="text-slate-500">
                            Employee ID:{" "}
                            <span className="font-semibold text-slate-700">
                              {teacher.employee_id ||
                                "—"}
                            </span>
                          </p>

                          <p className="text-slate-500">
                            Qualification:{" "}
                            <span className="font-semibold text-slate-700">
                              {teacher.qualification ||
                                "Not specified"}
                            </span>
                          </p>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              toggleStatus(teacher)
                            }
                            className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-600"
                          >
                            {teacher.is_active
                              ? "Disable"
                              : "Enable"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEdit(teacher)
                            }
                            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-50 px-3 py-2.5 text-xs font-bold text-indigo-600"
                          >
                            <Edit3 size={14} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTeacher(teacher)
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
            editingTeacher
              ? "Edit Teacher"
              : "Add New Teacher"
          }
          subtitle={
            editingTeacher
              ? "Update teacher information."
              : "Create a new teacher account."
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
                label="Username"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="teacher01"
                required
                disabled={Boolean(editingTeacher)}
              />

              <InputField
                label="Password"
                name="password"
                value={form.password}
                onChange={handleChange}
                type="password"
                placeholder={
                  editingTeacher
                    ? "Leave blank to keep current password"
                    : "Enter password"
                }
                required={!editingTeacher}
              />

              <InputField
                label="Full Name"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Dr. Rahul Kumar"
                required
              />

              <InputField
                label="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                placeholder="teacher@example.com"
              />

              <InputField
                label="Employee ID"
                name="employee_id"
                value={form.employee_id}
                onChange={handleChange}
                placeholder="EMP-001"
              />

              <InputField
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 9876543210"
              />

              <div className="md:col-span-2">
                <InputField
                  label="Qualification"
                  name="qualification"
                  value={form.qualification}
                  onChange={handleChange}
                  placeholder="MCA, M.Tech, PhD..."
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
                  : editingTeacher
                    ? "Update Teacher"
                    : "Create Teacher"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTeacher && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <Trash2 size={24} />
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-900">
              Delete Teacher?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to delete{" "}
              <span className="font-bold text-slate-800">
                {deleteTeacher.full_name ||
                  deleteTeacher.username}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setDeleteTeacher(null)
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
                Delete Teacher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}