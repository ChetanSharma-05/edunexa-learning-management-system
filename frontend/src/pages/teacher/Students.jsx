import {
  Activity,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  Edit3,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Phone,
  Plus,
  Search,
  Settings,
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
import TeacherSidebar from "../../components/teacher/TeacherSidebar";
import { useAuth } from "../../context/AuthContext";



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

function StudentAvatar({ name }) {
  const letter = name?.charAt(0)?.toUpperCase() || "S";

  return (
    <div className="relative shrink-0">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-indigo-500 to-violet-600 text-lg font-black text-white shadow-lg shadow-indigo-500/20">
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
        disabled={disabled}
        required={required}
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
  large = false,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-md">
      <div
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-[2rem] border border-white/70 bg-white shadow-2xl ${
          large ? "max-w-4xl" : "max-w-3xl"
        }`}
      >
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

        <div className="p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Students() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);

  const [editingStudent, setEditingStudent] = useState(null);

  const [deleteStudent, setDeleteStudent] = useState(null);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    username: "",
    password: "",
    full_name: "",
    email: "",
    admission_id: "",
    roll_number: "",
    phone: "",
    course: "",
    class_name: "",
    date_of_birth: "",
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

    const messages = Object.values(data)
      .flat()
      .filter(
        (item) =>
          typeof item === "string" &&
          item.trim()
      );

    return messages[0] || fallback;
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/students/");

      const data = response?.data;

      if (Array.isArray(data)) {
        setStudents(data);
      } else if (Array.isArray(data?.results)) {
        setStudents(data.results);
      } else {
        setStudents([]);
      }
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to load students."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const activeStudents = students.filter(
    (student) => student.is_active
  ).length;

  const inactiveStudents = students.filter(
    (student) => !student.is_active
  ).length;

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !query ||
        String(student.full_name || "")
          .toLowerCase()
          .includes(query) ||
        String(student.username || "")
          .toLowerCase()
          .includes(query) ||
        String(student.email || "")
          .toLowerCase()
          .includes(query) ||
        String(student.admission_id || "")
          .toLowerCase()
          .includes(query) ||
        String(student.roll_number || "")
          .toLowerCase()
          .includes(query) ||
        String(student.course || "")
          .toLowerCase()
          .includes(query) ||
        String(student.class_name || "")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" &&
          student.is_active) ||
        (statusFilter === "INACTIVE" &&
          !student.is_active);

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    students,
    search,
    statusFilter,
  ]);

  const resetForm = () => {
    setForm({
      username: "",
      password: "",
      full_name: "",
      email: "",
      admission_id: "",
      roll_number: "",
      phone: "",
      course: "",
      class_name: "",
      date_of_birth: "",
    });
  };

  const openCreate = () => {
    resetForm();
    setEditingStudent(null);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEdit = (student) => {
    setForm({
      username: student.username || "",
      password: "",
      full_name: student.full_name || "",
      email: student.email || "",
      admission_id:
        student.admission_id || "",
      roll_number:
        student.roll_number || "",
      phone: student.phone || "",
      course: student.course || "",
      class_name:
        student.class_name || "",
      date_of_birth:
        student.date_of_birth || "",
    });

    setEditingStudent(student);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingStudent(null);
    resetForm();
    setError("");
  };

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

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

    if (
      !editingStudent &&
      !form.password.trim()
    ) {
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
        admission_id:
          form.admission_id.trim(),
        roll_number:
          form.roll_number.trim(),
        phone: form.phone.trim(),
        course: form.course.trim(),
        class_name:
          form.class_name.trim(),
        date_of_birth:
          form.date_of_birth || null,
      };

      if (!editingStudent) {
        payload.password = form.password;
      }

      if (editingStudent) {
        await api.patch(
          `/students/${editingStudent.id}/`,
          payload
        );

        setSuccess(
          "Student updated successfully."
        );
      } else {
        await api.post(
          "/students/",
          payload
        );

        setSuccess(
          "Student created successfully."
        );
      }

      await loadStudents();

      setShowModal(false);
      setEditingStudent(null);
      resetForm();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to save student."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (student) => {
    try {
      setError("");

      await api.patch(
        `/students/${student.id}/`,
        {
          is_active: !student.is_active,
        }
      );

      await loadStudents();

      setSuccess(
        student.is_active
          ? "Student deactivated successfully."
          : "Student activated successfully."
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to update student status."
        )
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteStudent) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/students/${deleteStudent.id}/`
      );

      setDeleteStudent(null);

      await loadStudents();

      setSuccess(
        "Student deleted successfully."
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to delete student."
        )
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-900">
      <TeacherSidebar
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
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div>
                <p className="text-xs text-slate-400">
                  Teacher Management
                </p>

                <h2 className="text-lg font-bold sm:text-xl">
                  Students
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
                  {user?.role || "TEACHER"}
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

                <p className="mt-1">
                  {error}
                </p>
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
                Students
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage student accounts, academic
                details and account status.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700"
            >
              <Plus size={18} />
              Add Student
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              icon={Users}
              title="Total Students"
              value={students.length}
              subtitle="All registered students"
              iconClass="bg-indigo-50 text-indigo-600"
            />

            <StatCard
              icon={UserRoundCheck}
              title="Active Students"
              value={activeStudents}
              subtitle="Currently active"
              iconClass="bg-emerald-50 text-emerald-600"
            />

            <StatCard
              icon={UserRoundX}
              title="Inactive Students"
              value={inactiveStudents}
              subtitle="Currently inactive"
              iconClass="bg-rose-50 text-rose-600"
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Student Directory
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Search and manage all students.
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
                        setSearch(
                          event.target.value
                        )
                      }
                      placeholder="Search students..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white sm:w-64"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value
                      )
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
                    Loading students...
                  </p>
                </div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Users size={28} />
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-800">
                  No students found
                </h3>

                <p className="mt-1 max-w-md text-sm text-slate-400">
                  Try changing your search or
                  status filter, or add a new
                  student.
                </p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">
                          Student
                        </th>

                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">
                          Admission / Roll
                        </th>

                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">
                          Contact
                        </th>

                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">
                          Course
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
                      {filteredStudents.map(
                        (student) => (
                          <tr
                            key={student.id}
                            className="transition hover:bg-slate-50/70"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <StudentAvatar
                                  name={
                                    student.full_name
                                  }
                                />

                                <div className="min-w-0">
                                  <p className="truncate font-bold text-slate-900">
                                    {student.full_name ||
                                      "Unnamed Student"}
                                  </p>

                                  <p className="mt-1 truncate text-xs text-slate-400">
                                    @
                                    {student.username ||
                                      "username"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-700">
                                  {student.admission_id ||
                                    "—"}
                                </p>

                                <p className="text-xs text-slate-400">
                                  Roll:{" "}
                                  {student.roll_number ||
                                    "—"}
                                </p>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="space-y-1">
                                <p className="flex items-center gap-2 text-xs text-slate-600">
                                  <Mail size={13} />
                                  {student.email ||
                                    "—"}
                                </p>

                                <p className="flex items-center gap-2 text-xs text-slate-400">
                                  <Phone size={13} />
                                  {student.phone ||
                                    "—"}
                                </p>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div>
                                <p className="text-sm font-semibold text-slate-700">
                                  {student.course ||
                                    "—"}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {student.class_name ||
                                    "Class not specified"}
                                </p>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <StatusBadge
                                active={
                                  student.is_active
                                }
                              />
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleStatus(
                                      student
                                    )
                                  }
                                  className={`rounded-xl p-2.5 transition ${
                                    student.is_active
                                      ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                                      : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                  }`}
                                  title={
                                    student.is_active
                                      ? "Deactivate"
                                      : "Activate"
                                  }
                                >
                                  {student.is_active ? (
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
                                    openEdit(
                                      student
                                    )
                                  }
                                  className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 transition hover:bg-indigo-100"
                                  title="Edit"
                                >
                                  <Edit3 size={17} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteStudent(
                                      student
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
                  {filteredStudents.map(
                    (student) => (
                      <div
                        key={student.id}
                        className="p-5"
                      >
                        <div className="flex items-start gap-3">
                          <StudentAvatar
                            name={
                              student.full_name
                            }
                          />

                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900">
                              {student.full_name ||
                                "Unnamed Student"}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              @
                              {student.username ||
                                "username"}
                            </p>

                            <div className="mt-3">
                              <StatusBadge
                                active={
                                  student.is_active
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-4 text-xs">
                          <p className="text-slate-500">
                            Admission ID:{" "}
                            <span className="font-semibold text-slate-700">
                              {student.admission_id ||
                                "—"}
                            </span>
                          </p>

                          <p className="text-slate-500">
                            Roll Number:{" "}
                            <span className="font-semibold text-slate-700">
                              {student.roll_number ||
                                "—"}
                            </span>
                          </p>

                          <p className="flex items-center gap-2 text-slate-600">
                            <Mail size={14} />
                            {student.email || "—"}
                          </p>

                          <p className="flex items-center gap-2 text-slate-600">
                            <Phone size={14} />
                            {student.phone || "—"}
                          </p>

                          <p className="text-slate-500">
                            Course:{" "}
                            <span className="font-semibold text-slate-700">
                              {student.course ||
                                "—"}
                            </span>
                          </p>

                          <p className="text-slate-500">
                            Class:{" "}
                            <span className="font-semibold text-slate-700">
                              {student.class_name ||
                                "—"}
                            </span>
                          </p>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              toggleStatus(
                                student
                              )
                            }
                            className="rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-600"
                          >
                            {student.is_active
                              ? "Disable"
                              : "Enable"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEdit(
                                student
                              )
                            }
                            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-50 px-3 py-2.5 text-xs font-bold text-indigo-600"
                          >
                            <Edit3 size={14} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteStudent(
                                student
                              )
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
            editingStudent
              ? "Edit Student"
              : "Add New Student"
          }
          subtitle={
            editingStudent
              ? "Update student information."
              : "Create a new student account."
          }
          onClose={closeModal}
          large
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
                placeholder="student01"
                required
                disabled={Boolean(
                  editingStudent
                )}
              />

              <InputField
                label="Password"
                name="password"
                value={form.password}
                onChange={handleChange}
                type="password"
                placeholder={
                  editingStudent
                    ? "Leave blank to keep current password"
                    : "Enter password"
                }
                required={!editingStudent}
              />

              <InputField
                label="Full Name"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Rahul Kumar"
                required
              />

              <InputField
                label="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                placeholder="student@example.com"
              />

              <InputField
                label="Admission ID"
                name="admission_id"
                value={form.admission_id}
                onChange={handleChange}
                placeholder="ADM-2026-001"
              />

              <InputField
                label="Roll Number"
                name="roll_number"
                value={form.roll_number}
                onChange={handleChange}
                placeholder="01"
              />

              <InputField
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 9876543210"
              />

              <InputField
                label="Course"
                name="course"
                value={form.course}
                onChange={handleChange}
                placeholder="MCA"
              />

              <InputField
                label="Class"
                name="class_name"
                value={form.class_name}
                onChange={handleChange}
                placeholder="MCA Final Year"
              />

              <InputField
                label="Date of Birth"
                name="date_of_birth"
                value={form.date_of_birth}
                onChange={handleChange}
                type="date"
              />
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
                  : editingStudent
                  ? "Update Student"
                  : "Create Student"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteStudent && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <Trash2 size={24} />
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-900">
              Delete Student?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to delete{" "}
              <span className="font-bold text-slate-800">
                {deleteStudent.full_name ||
                  deleteStudent.username}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setDeleteStudent(null)
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
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}