import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  AlertCircle,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Edit3,
  Eye,
  FileQuestion,
  Filter,
  Loader2,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/AdminSidebar";

const initialForm = {
  title: "",
  description: "",
  subject: "",
  duration_minutes: 30,
  passing_marks: "",
  start_date: "",
  end_date: "",
  status: "DRAFT",
  shuffle_questions: false,
  show_result_immediately: true,
  allow_retake: false,
  max_attempts: 1,
  is_active: true,
  questions: [],
};

function getErrorMessage(error, fallback = "Something went wrong.") {
  const data = error?.response?.data;

  if (!data) {
    if (error?.message) {
      return error.message;
    }

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

  const messages = Object.entries(data)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: ${value.join(", ")}`;
      }

      return `${key}: ${String(value)}`;
    })
    .filter(Boolean);

  return messages.length > 0
    ? messages.join(" | ")
    : fallback;
}

function normalizeList(data) {
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

function formatDateTimeLocal(value) {
  if (!value) {
    return "";
  }

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const offset = date.getTimezoneOffset();

    const localDate = new Date(
      date.getTime() - offset * 60 * 1000
    );

    return localDate
      .toISOString()
      .slice(0, 16);
  } catch {
    return "";
  }
}

function getSubjectName(test, subjects) {
  if (test?.subject_name) {
    return test.subject_name;
  }

  if (test?.subject?.name) {
    return test.subject.name;
  }

  const subjectId =
    typeof test?.subject === "object"
      ? test.subject?.id
      : test?.subject;

  const subject = subjects.find(
    (item) =>
      Number(item.id) === Number(subjectId)
  );

  return subject?.name || "No Subject";
}

function StatusBadge({ status }) {
  const styles = {
    PUBLISHED:
      "bg-emerald-50 text-emerald-700 border-emerald-200",
    DRAFT:
      "bg-amber-50 text-amber-700 border-amber-200",
    CLOSED:
      "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${
        styles[status] ||
        "bg-slate-100 text-slate-600 border-slate-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "PUBLISHED"
            ? "bg-emerald-500"
            : status === "DRAFT"
              ? "bg-amber-500"
              : "bg-slate-400"
        }`}
      />

      {status || "UNKNOWN"}
    </span>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  iconClass,
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:rotate-[0.4deg] hover:shadow-2xl">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-50 opacity-70 transition-transform duration-500 group-hover:scale-150" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-2 text-xs font-medium text-slate-400">
            {description}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${iconClass}`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function BarChart({ stats }) {
  const items = [
    {
      label: "Published",
      value: stats.published,
      className: "from-emerald-500 to-teal-400",
    },
    {
      label: "Draft",
      value: stats.draft,
      className: "from-amber-500 to-orange-400",
    },
    {
      label: "Closed",
      value: stats.closed,
      className: "from-slate-500 to-slate-400",
    },
  ];

  const maxValue = Math.max(
    stats.total,
    ...items.map((item) => item.value),
    1
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-lg font-black text-slate-900">
            Test Overview
          </p>

          <p className="mt-1 text-sm text-slate-400">
            Distribution of your assessments
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <BarChart3 size={20} />
        </div>
      </div>

      <div className="flex h-56 items-end gap-6 border-b border-slate-100 px-2 pb-0">
        {items.map((item) => {
          const height =
            (item.value / maxValue) * 100;

          return (
            <div
              key={item.label}
              className="group flex h-full flex-1 flex-col items-center justify-end"
            >
              <div className="mb-2 text-sm font-black text-slate-700">
                {item.value}
              </div>

              <div className="flex h-[78%] w-full items-end justify-center">
                <div
                  className={`w-full max-w-[58px] rounded-t-2xl bg-gradient-to-t ${item.className} shadow-lg transition-all duration-700 ease-out group-hover:-translate-y-2 group-hover:scale-105`}
                  style={{
                    height: `${Math.max(
                      height,
                      item.value > 0 ? 8 : 3
                    )}%`,
                  }}
                >
                  <div className="h-full w-full rounded-t-2xl bg-white/10" />
                </div>
              </div>

              <p className="mt-3 pb-3 text-xs font-bold text-slate-500">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
        >
          {children}
        </select>

        <ChevronDown
          size={17}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/40"
    >
      <span>
        <span className="block text-sm font-bold text-slate-700">
          {label}
        </span>

        <span className="mt-1 block text-xs text-slate-400">
          {checked ? "Enabled" : "Disabled"}
        </span>
      </span>

      <span
        className={`relative h-7 w-12 rounded-full transition ${
          checked
            ? "bg-indigo-600"
            : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </span>
    </button>
  );
}

export default function Tests() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [tests, setTests] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [questions, setQuestions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingMeta, setLoadingMeta] =
    useState(true);

  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] =
    useState("");
  const [statusFilter, setStatusFilter] =
    useState("");
  const [activeFilter, setActiveFilter] =
    useState("");

  const [modal, setModal] = useState(null);
  const [selectedTest, setSelectedTest] =
    useState(null);

  const [form, setForm] =
    useState(initialForm);

  const [questionSearch, setQuestionSearch] =
    useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getAllSubjects = async () => {
    try {
      const response = await api.get(
        "/admin/subjects/"
      );

      setSubjects(
        normalizeList(response?.data)
      );
    } catch (err) {
      console.error(
        "SUBJECT API ERROR:",
        err?.response?.data || err
      );
    }
  };

  const getAllQuestions = async () => {
    try {
      const response = await api.get(
        "/question-bank/"
      );

      setQuestions(
        normalizeList(response?.data)
      );
    } catch (err) {
      console.error(
        "QUESTION API ERROR:",
        err?.response?.data || err
      );
    }
  };

  const fetchTests = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        "/testsystem/"
      );

      console.log(
        "TEST API STATUS:",
        response?.status
      );

      console.log(
        "TEST API DATA:",
        response?.data
      );

      const data = normalizeList(
        response?.data
      );

      setTests(data);
    } catch (err) {
      console.error(
        "TEST API ERROR:",
        err
      );

      console.error(
        "TEST API STATUS:",
        err?.response?.status
      );

      console.error(
        "TEST API DATA:",
        err?.response?.data
      );

      setTests([]);

      setError(
        getErrorMessage(
          err,
          "Unable to load tests."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingMeta(true);

      await Promise.allSettled([
        getAllSubjects(),
        getAllQuestions(),
      ]);

      setLoadingMeta(false);
    };

    loadInitialData();
    fetchTests();
  }, []);

  const filteredTests = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return tests.filter((test) => {
      const title = String(
        test?.title || ""
      ).toLowerCase();

      const description = String(
        test?.description || ""
      ).toLowerCase();

      const subjectName =
        getSubjectName(
          test,
          subjects
        ).toLowerCase();

      const matchesSearch =
        !query ||
        title.includes(query) ||
        description.includes(query) ||
        subjectName.includes(query);

      const subjectId =
        typeof test?.subject === "object"
          ? test.subject?.id
          : test?.subject;

      const matchesSubject =
        !subjectFilter ||
        Number(subjectId) ===
          Number(subjectFilter);

      const matchesStatus =
        !statusFilter ||
        test?.status === statusFilter;

      const matchesActive =
        !activeFilter ||
        String(
          Boolean(test?.is_active)
        ) === activeFilter;

      return (
        matchesSearch &&
        matchesSubject &&
        matchesStatus &&
        matchesActive
      );
    });
  }, [
    tests,
    subjects,
    search,
    subjectFilter,
    statusFilter,
    activeFilter,
  ]);

  const stats = useMemo(() => {
    return {
      total: tests.length,

      published: tests.filter(
        (item) =>
          item?.status === "PUBLISHED"
      ).length,

      draft: tests.filter(
        (item) =>
          item?.status === "DRAFT"
      ).length,

      closed: tests.filter(
        (item) =>
          item?.status === "CLOSED"
      ).length,

      active: tests.filter(
        (item) => item?.is_active
      ).length,
    };
  }, [tests]);

  const totalQuestions = useMemo(() => {
    return form.questions.reduce(
      (total, item) =>
        total + Number(item.marks || 0),
      0
    );
  }, [form.questions]);

  const filteredQuestions = useMemo(() => {
    const query =
      questionSearch
        .trim()
        .toLowerCase();

    return questions.filter((question) => {
      const text = String(
        question?.question_text ||
          question?.text ||
          question?.question ||
          ""
      ).toLowerCase();

      return !query || text.includes(query);
    });
  }, [questions, questionSearch]);

  const openCreate = () => {
    setError("");
    setSuccess("");

    setSelectedTest(null);

    setForm({
      ...initialForm,
      questions: [],
    });

    setQuestionSearch("");
    setModal("form");
  };

  const openEdit = async (test) => {
    setError("");
    setSuccess("");

    setSelectedTest(test);

    try {
      const response = await api.get(
        `/testsystem/${test.id}/`
      );

      const data = response?.data || {};

      setForm({
        title: data.title || "",
        description:
          data.description || "",
        subject:
          typeof data.subject === "object"
            ? data.subject?.id || ""
            : data.subject || "",

        duration_minutes:
          data.duration_minutes || 30,

        passing_marks:
          data.passing_marks ?? "",

        start_date:
          formatDateTimeLocal(
            data.start_date
          ),

        end_date:
          formatDateTimeLocal(
            data.end_date
          ),

        status:
          data.status || "DRAFT",

        shuffle_questions:
          Boolean(
            data.shuffle_questions
          ),

        show_result_immediately:
          Boolean(
            data.show_result_immediately
          ),

        allow_retake:
          Boolean(data.allow_retake),

        max_attempts:
          data.max_attempts || 1,

        is_active:
          Boolean(data.is_active),

        questions:
          Array.isArray(data.questions)
            ? data.questions.map(
                (item, index) => ({
                  question_id:
                    item.question_id ??
                    item.question ??
                    item.id,

                  order:
                    item.order ??
                    index + 1,

                  marks:
                    item.marks ?? 1,

                  negative_marks:
                    item.negative_marks ?? 0,
                })
              )
            : [],
      });

      setQuestionSearch("");
      setModal("form");
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to load test details."
        )
      );
    }
  };

  const openView = async (test) => {
    setError("");

    try {
      const response = await api.get(
        `/testsystem/${test.id}/`
      );

      setSelectedTest(
        response?.data || test
      );

      setModal("view");
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to load test details."
        )
      );
    }
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModal(null);
    setSelectedTest(null);

    setForm({
      ...initialForm,
      questions: [],
    });

    setQuestionSearch("");
  };

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const toggleQuestion = (question) => {
    const questionId = Number(
      question.id
    );

    const exists =
      form.questions.some(
        (item) =>
          Number(item.question_id) ===
          questionId
      );

    if (exists) {
      setForm((previous) => ({
        ...previous,

        questions:
          previous.questions
            .filter(
              (item) =>
                Number(
                  item.question_id
                ) !== questionId
            )
            .map((item, index) => ({
              ...item,
              order: index + 1,
            })),
      }));

      return;
    }

    setForm((previous) => ({
      ...previous,

      questions: [
        ...previous.questions,
        {
          question_id: question.id,
          order:
            previous.questions.length + 1,
          marks:
            question.marks || 1,
          negative_marks: 0,
        },
      ],
    }));
  };

  const updateQuestion = (
    questionId,
    field,
    value
  ) => {
    setForm((previous) => ({
      ...previous,

      questions:
        previous.questions.map((item) =>
          Number(item.question_id) ===
          Number(questionId)
            ? {
                ...item,
                [field]: value,
              }
            : item
        ),
    }));
  };

  const removeQuestion = (
    questionId
  ) => {
    setForm((previous) => ({
      ...previous,

      questions:
        previous.questions
          .filter(
            (item) =>
              Number(item.question_id) !==
              Number(questionId)
          )
          .map((item, index) => ({
            ...item,
            order: index + 1,
          })),
    }));
  };

  const saveTest = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.title.trim()) {
      setError(
        "Test title is required."
      );
      return;
    }

    if (!form.subject) {
      setError(
        "Please select a subject."
      );
      return;
    }

    if (
      !form.duration_minutes ||
      Number(form.duration_minutes) <= 0
    ) {
      setError(
        "Valid duration is required."
      );
      return;
    }

    if (
      form.passing_marks === "" ||
      Number(form.passing_marks) < 0
    ) {
      setError(
        "Valid passing marks are required."
      );
      return;
    }

    if (form.questions.length === 0) {
      setError(
        "Please select at least one question."
      );
      return;
    }

    const payload = {
      title: form.title.trim(),

      description:
        form.description.trim(),

      subject: Number(form.subject),

      duration_minutes:
        Number(form.duration_minutes),

      passing_marks:
        Number(form.passing_marks),

      start_date: form.start_date
        ? new Date(
            form.start_date
          ).toISOString()
        : null,

      end_date: form.end_date
        ? new Date(
            form.end_date
          ).toISOString()
        : null,

      status: form.status,

      shuffle_questions:
        Boolean(form.shuffle_questions),

      show_result_immediately:
        Boolean(
          form.show_result_immediately
        ),

      allow_retake:
        Boolean(form.allow_retake),

      max_attempts:
        Number(form.max_attempts || 1),

      is_active:
        Boolean(form.is_active),

      questions:
        form.questions.map(
          (item, index) => ({
            question_id:
              Number(item.question_id),

            order: index + 1,

            marks:
              Number(item.marks || 1),

            negative_marks:
              Number(
                item.negative_marks || 0
              ),
          })
        ),
    };

    setSaving(true);

    try {
      if (selectedTest) {
        await api.put(
          `/testsystem/${selectedTest.id}/`,
          payload
        );

        setSuccess(
          "Test updated successfully."
        );
      } else {
        await api.post(
          "/testsystem/",
          payload
        );

        setSuccess(
          "Test created successfully."
        );
      }

      setModal(null);

      setForm({
        ...initialForm,
        questions: [],
      });

      await fetchTests();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to save test."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (
    test,
    status
  ) => {
    setError("");

    try {
      await api.patch(
        `/testsystem/${test.id}/status/`,
        {
          status,
        }
      );

      setSuccess(
        `Test ${status.toLowerCase()} successfully.`
      );

      await fetchTests();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to update test status."
        )
      );
    }
  };

  const toggleActive = async (
    test
  ) => {
    setError("");

    try {
      await api.patch(
        `/testsystem/${test.id}/toggle-active/`
      );

      setSuccess(
        test.is_active
          ? "Test deactivated successfully."
          : "Test activated successfully."
      );

      await fetchTests();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to update test."
        )
      );
    }
  };

  const deleteTest = async (test) => {
    const confirmed =
      window.confirm(
        `Delete "${test.title}"?`
      );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await api.delete(
        `/testsystem/${test.id}/`
      );

      setSuccess(
        "Test deleted successfully."
      );

      await fetchTests();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to delete test."
        )
      );
    }
  };

  const handleRefresh = async () => {
    setError("");
    await fetchTests();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", {
        replace: true,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        logout={logout}
        navigate={navigate}
      />

      <main className="min-h-screen lg:ml-[270px]">
        <div className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-100/60 blur-3xl" />

          <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-violet-100/50 blur-3xl" />

          <div className="relative px-5 py-6 sm:px-8 lg:px-10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setSidebarOpen(true)
                  }
                  className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-600 lg:hidden"
                >
                  <Menu size={20} />
                </button>

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-indigo-500" />

                    <span className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                      Test Management
                    </span>
                  </div>

                  <h1 className="text-3xl font-black tracking-tight text-slate-900">
                    Tests
                  </h1>

                  <p className="mt-1 max-w-xl text-sm text-slate-500">
                    Create, manage, publish and
                    monitor assessments.
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-50"
                >
                  <RefreshCw
                    size={17}
                    className={
                      loading
                        ? "animate-spin"
                        : ""
                    }
                  />

                  <span className="hidden sm:inline">
                    Refresh
                  </span>
                </button>

                <button
                  type="button"
                  onClick={openCreate}
                  className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/30"
                >
                  <Plus size={18} />

                  <span className="hidden sm:inline">
                    Create Test
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-8 lg:p-10">
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700 shadow-sm">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0"
              />

              <div className="min-w-0 flex-1">
                <p className="font-black">
                  Unable to load tests
                </p>

                <p className="mt-1 break-words text-xs font-medium">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
                className="text-red-400 transition hover:text-red-700"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700 shadow-sm">
              <CheckCircle2 size={19} />

              <span>{success}</span>

              <button
                type="button"
                onClick={() =>
                  setSuccess("")
                }
                className="ml-auto text-emerald-500 hover:text-emerald-800"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Tests"
              value={stats.total}
              description="All assessments"
              icon={FileQuestion}
              iconClass="bg-indigo-50 text-indigo-600"
            />

            <StatCard
              title="Published"
              value={stats.published}
              description="Currently published"
              icon={CheckCircle2}
              iconClass="bg-emerald-50 text-emerald-600"
            />

            <StatCard
              title="Draft"
              value={stats.draft}
              description="Waiting for publishing"
              icon={Edit3}
              iconClass="bg-amber-50 text-amber-600"
            />

            <StatCard
              title="Closed"
              value={stats.closed}
              description="Completed assessments"
              icon={Clock3}
              iconClass="bg-slate-100 text-slate-600"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <BarChart stats={stats} />

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 text-white shadow-xl shadow-indigo-500/20">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10" />

              <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

              <div className="relative">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                    <Trophy size={22} />
                  </div>

                  <Zap
                    size={22}
                    className="animate-pulse text-yellow-200"
                  />
                </div>

                <p className="text-sm font-bold text-indigo-100">
                  Active Tests
                </p>

                <p className="mt-2 text-5xl font-black">
                  {stats.active}
                </p>

                <p className="mt-4 text-sm leading-6 text-indigo-100">
                  Keep your assessments updated
                  and publish tests when they are
                  ready for students.
                </p>

                <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-700"
                    style={{
                      width: `${
                        stats.total
                          ? Math.min(
                              100,
                              Math.round(
                                (stats.active /
                                  stats.total) *
                                  100
                              )
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search tests..."
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div className="relative">
                <BookOpen
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={subjectFilter}
                  onChange={(event) =>
                    setSubjectFilter(
                      event.target.value
                    )
                  }
                  className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="">
                    All Subjects
                  </option>

                  {subjects.map((subject) => (
                    <option
                      key={subject.id}
                      value={subject.id}
                    >
                      {subject.name}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <div className="relative">
                <Filter
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                  className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="">
                    All Status
                  </option>

                  <option value="DRAFT">
                    Draft
                  </option>

                  <option value="PUBLISHED">
                    Published
                  </option>

                  <option value="CLOSED">
                    Closed
                  </option>
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <div className="relative">
                <Activity
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={activeFilter}
                  onChange={(event) =>
                    setActiveFilter(
                      event.target.value
                    )
                  }
                  className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="">
                    All Active Status
                  </option>

                  <option value="true">
                    Active
                  </option>

                  <option value="false">
                    Inactive
                  </option>
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  All Tests
                </h2>

                <p className="mt-1 text-xs font-medium text-slate-400">
                  {filteredTests.length} test
                  {filteredTests.length !== 1
                    ? "s"
                    : ""}{" "}
                  found
                </p>
              </div>

              <div className="flex h-10 items-center gap-2 rounded-xl bg-indigo-50 px-3 text-xs font-bold text-indigo-600">
                <FileQuestion size={15} />

                {tests.length} Total
              </div>
            </div>

            {loading ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="animate-pulse rounded-2xl border border-slate-100 p-5"
                  >
                    <div className="h-5 w-1/3 rounded bg-slate-100" />

                    <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />

                    <div className="mt-5 h-10 w-full rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : filteredTests.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-500 shadow-inner">
                  <FileQuestion size={34} />
                </div>

                <h3 className="mt-5 text-lg font-black text-slate-900">
                  No tests found
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                  {tests.length === 0
                    ? "No tests are available yet. Create your first test to get started."
                    : "Try changing your search or filters."}
                </p>

                {tests.length === 0 && (
                  <button
                    type="button"
                    onClick={openCreate}
                    className="mt-6 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-1 hover:bg-indigo-700"
                  >
                    <Plus size={17} />
                    Create First Test
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[1050px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70">
                        <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Test
                        </th>

                        <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Subject
                        </th>

                        <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Duration
                        </th>

                        <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Status
                        </th>

                        <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Active
                        </th>

                        <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredTests.map(
                        (test) => (
                          <tr
                            key={test.id}
                            className="group border-b border-slate-100 last:border-0 transition hover:bg-indigo-50/30"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-600 shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:rotate-3">
                                  <FileQuestion
                                    size={20}
                                  />
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-black text-slate-800">
                                    {test.title ||
                                      "Untitled Test"}
                                  </p>

                                  <p className="mt-1 max-w-[300px] truncate text-xs text-slate-400">
                                    {test.description ||
                                      "No description"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                                {getSubjectName(
                                  test,
                                  subjects
                                )}
                              </span>
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                <Clock3
                                  size={15}
                                  className="text-indigo-500"
                                />

                                {test.duration_minutes ||
                                  0}{" "}
                                min
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <StatusBadge
                                status={
                                  test.status
                                }
                              />
                            </td>

                            <td className="px-6 py-5">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleActive(
                                    test
                                  )
                                }
                                className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                                  test.is_active
                                    ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                }`}
                              >
                                {test.is_active
                                  ? "Active"
                                  : "Inactive"}
                              </button>
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openView(
                                      test
                                    )
                                  }
                                  title="View"
                                  className="rounded-xl bg-slate-100 p-2.5 text-slate-500 transition hover:-translate-y-0.5 hover:bg-indigo-50 hover:text-indigo-600"
                                >
                                  <Eye
                                    size={16}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openEdit(
                                      test
                                    )
                                  }
                                  title="Edit"
                                  className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 transition hover:-translate-y-0.5 hover:bg-indigo-100"
                                >
                                  <Edit3
                                    size={16}
                                  />
                                </button>

                                {test.status ===
                                  "DRAFT" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateStatus(
                                        test,
                                        "PUBLISHED"
                                      )
                                    }
                                    title="Publish"
                                    className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 transition hover:-translate-y-0.5 hover:bg-emerald-100"
                                  >
                                    <Check
                                      size={16}
                                    />
                                  </button>
                                )}

                                {test.status ===
                                  "PUBLISHED" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateStatus(
                                        test,
                                        "CLOSED"
                                      )
                                    }
                                    title="Close"
                                    className="rounded-xl bg-amber-50 p-2.5 text-amber-600 transition hover:-translate-y-0.5 hover:bg-amber-100"
                                  >
                                    <Clock3
                                      size={16}
                                    />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteTest(
                                      test
                                    )
                                  }
                                  title="Delete"
                                  className="rounded-xl bg-red-50 p-2.5 text-red-500 transition hover:-translate-y-0.5 hover:bg-red-100"
                                >
                                  <Trash2
                                    size={16}
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-4 p-4 lg:hidden">
                  {filteredTests.map(
                    (test) => (
                      <div
                        key={test.id}
                        className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                              <FileQuestion
                                size={19}
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-slate-800">
                                {test.title}
                              </p>

                              <p className="mt-1 truncate text-xs text-slate-400">
                                {getSubjectName(
                                  test,
                                  subjects
                                )}
                              </p>
                            </div>
                          </div>

                          <StatusBadge
                            status={test.status}
                          />
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              Duration
                            </p>

                            <p className="mt-1 text-sm font-black text-slate-700">
                              {test.duration_minutes ||
                                0}{" "}
                              min
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              Active
                            </p>

                            <p
                              className={`mt-1 text-sm font-black ${
                                test.is_active
                                  ? "text-emerald-600"
                                  : "text-slate-500"
                              }`}
                            >
                              {test.is_active
                                ? "Yes"
                                : "No"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-4 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openView(
                                test
                              )
                            }
                            className="flex items-center justify-center rounded-xl bg-slate-100 p-3 text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEdit(
                                test
                              )
                            }
                            className="flex items-center justify-center rounded-xl bg-indigo-50 p-3 text-indigo-600 transition hover:bg-indigo-100"
                          >
                            <Edit3
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleActive(
                                test
                              )
                            }
                            className="flex items-center justify-center rounded-xl bg-amber-50 p-3 text-amber-600 transition hover:bg-amber-100"
                          >
                            <Activity
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteTest(
                                test
                              )
                            }
                            className="flex items-center justify-center rounded-xl bg-red-50 p-3 text-red-500 transition hover:bg-red-100"
                          >
                            <Trash2
                              size={16}
                            />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {modal === "form" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[94vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                  Test Management
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-900">
                  {selectedTest
                    ? "Edit Test"
                    : "Create New Test"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-red-50 hover:text-red-500"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={saveTest}
              className="max-h-[calc(94vh-90px)] overflow-y-auto"
            >
              <div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[1fr_1fr]">
                <div className="space-y-6">
                  {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <InputField
                        label="Test Title"
                        value={form.title}
                        onChange={(event) =>
                          updateForm(
                            "title",
                            event.target
                              .value
                          )
                        }
                        placeholder="e.g. Python Fundamentals Assessment"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Description
                      </label>

                      <textarea
                        value={
                          form.description
                        }
                        onChange={(event) =>
                          updateForm(
                            "description",
                            event.target
                              .value
                          )
                        }
                        rows={4}
                        placeholder="Describe this assessment..."
                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                      />
                    </div>

                    <SelectField
                      label="Subject"
                      value={form.subject}
                      onChange={(event) =>
                        updateForm(
                          "subject",
                          event.target
                            .value
                        )
                      }
                    >
                      <option value="">
                        Select Subject
                      </option>

                      {subjects.map(
                        (subject) => (
                          <option
                            key={subject.id}
                            value={
                              subject.id
                            }
                          >
                            {subject.name}
                          </option>
                        )
                      )}
                    </SelectField>

                    <InputField
                      label="Duration (minutes)"
                      type="number"
                      value={
                        form.duration_minutes
                      }
                      onChange={(event) =>
                        updateForm(
                          "duration_minutes",
                          event.target
                            .value
                        )
                      }
                      placeholder="30"
                    />

                    <InputField
                      label="Passing Marks"
                      type="number"
                      value={
                        form.passing_marks
                      }
                      onChange={(event) =>
                        updateForm(
                          "passing_marks",
                          event.target
                            .value
                        )
                      }
                      placeholder="40"
                    />

                    <InputField
                      label="Maximum Attempts"
                      type="number"
                      value={
                        form.max_attempts
                      }
                      onChange={(event) =>
                        updateForm(
                          "max_attempts",
                          event.target
                            .value
                        )
                      }
                      placeholder="1"
                    />

                    <InputField
                      label="Start Date"
                      type="datetime-local"
                      value={
                        form.start_date
                      }
                      onChange={(event) =>
                        updateForm(
                          "start_date",
                          event.target
                            .value
                        )
                      }
                    />

                    <InputField
                      label="End Date"
                      type="datetime-local"
                      value={
                        form.end_date
                      }
                      onChange={(event) =>
                        updateForm(
                          "end_date",
                          event.target
                            .value
                        )
                      }
                    />

                    <SelectField
                      label="Status"
                      value={form.status}
                      onChange={(event) =>
                        updateForm(
                          "status",
                          event.target
                            .value
                        )
                      }
                    >
                      <option value="DRAFT">
                        Draft
                      </option>

                      <option value="PUBLISHED">
                        Published
                      </option>

                      <option value="CLOSED">
                        Closed
                      </option>
                    </SelectField>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Toggle
                      label="Shuffle Questions"
                      checked={
                        form.shuffle_questions
                      }
                      onChange={(value) =>
                        updateForm(
                          "shuffle_questions",
                          value
                        )
                      }
                    />

                    <Toggle
                      label="Show Result Immediately"
                      checked={
                        form.show_result_immediately
                      }
                      onChange={(value) =>
                        updateForm(
                          "show_result_immediately",
                          value
                        )
                      }
                    />

                    <Toggle
                      label="Allow Retake"
                      checked={
                        form.allow_retake
                      }
                      onChange={(value) =>
                        updateForm(
                          "allow_retake",
                          value
                        )
                      }
                    />

                    <Toggle
                      label="Test Active"
                      checked={
                        form.is_active
                      }
                      onChange={(value) =>
                        updateForm(
                          "is_active",
                          value
                        )
                      }
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        Select Questions
                      </h3>

                      <p className="mt-1 text-xs font-medium text-slate-400">
                        Choose questions for this
                        test.
                      </p>
                    </div>

                    <div className="rounded-xl bg-indigo-100 px-3 py-2 text-xs font-black text-indigo-600">
                      {form.questions.length}{" "}
                      Selected
                    </div>
                  </div>

                  <div className="relative mb-4">
                    <Search
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={
                        questionSearch
                      }
                      onChange={(event) =>
                        setQuestionSearch(
                          event.target
                            .value
                        )
                      }
                      placeholder="Search questions..."
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>

                  <div className="max-h-[430px] space-y-3 overflow-y-auto pr-1">
                    {loadingMeta ? (
                      <div className="flex items-center justify-center py-12 text-slate-400">
                        <Loader2
                          size={24}
                          className="animate-spin"
                        />
                      </div>
                    ) : filteredQuestions.length ===
                      0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                        <FileQuestion
                          size={28}
                          className="mx-auto text-slate-300"
                        />

                        <p className="mt-3 text-sm font-bold text-slate-500">
                          No questions found
                        </p>
                      </div>
                    ) : (
                      filteredQuestions.map(
                        (question) => {
                          const selected =
                            form.questions.some(
                              (item) =>
                                Number(
                                  item.question_id
                                ) ===
                                Number(
                                  question.id
                                )
                            );

                          const text =
                            question.question_text ||
                            question.text ||
                            question.question ||
                            "Question";

                          return (
                            <div
                              key={
                                question.id
                              }
                              className={`rounded-2xl border bg-white p-4 transition ${
                                selected
                                  ? "border-indigo-300 bg-indigo-50/50 shadow-sm"
                                  : "border-slate-200 hover:border-indigo-200 hover:-translate-y-0.5 hover:shadow-sm"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  toggleQuestion(
                                    question
                                  )
                                }
                                className="flex w-full items-start gap-3 text-left"
                              >
                                <span
                                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                    selected
                                      ? "border-indigo-600 bg-indigo-600 text-white"
                                      : "border-slate-300 bg-white text-transparent"
                                  }`}
                                >
                                  <Check
                                    size={13}
                                  />
                                </span>

                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-bold leading-6 text-slate-700">
                                    {text}
                                  </span>

                                  <span className="mt-2 flex flex-wrap items-center gap-2">
                                    {question.question_type && (
                                      <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">
                                        {
                                          question.question_type
                                        }
                                      </span>
                                    )}

                                    <span className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-600">
                                      {question.marks ||
                                        1}{" "}
                                      Marks
                                    </span>
                                  </span>
                                </span>
                              </button>

                              {selected && (
                                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-indigo-100 pt-4">
                                  <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                      Marks
                                    </label>

                                    <input
                                      type="number"
                                      min="0.01"
                                      step="0.01"
                                      value={
                                        form.questions.find(
                                          (
                                            item
                                          ) =>
                                            Number(
                                              item.question_id
                                            ) ===
                                            Number(
                                              question.id
                                            )
                                        )?.marks ??
                                        1
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        updateQuestion(
                                          question.id,
                                          "marks",
                                          event
                                            .target
                                            .value
                                        )
                                      }
                                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-indigo-400"
                                    />
                                  </div>

                                  <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                      Negative
                                    </label>

                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={
                                        form.questions.find(
                                          (
                                            item
                                          ) =>
                                            Number(
                                              item.question_id
                                            ) ===
                                            Number(
                                              question.id
                                            )
                                        )?.negative_marks ??
                                        0
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        updateQuestion(
                                          question.id,
                                          "negative_marks",
                                          event
                                            .target
                                            .value
                                        )
                                      }
                                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-indigo-400"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                      )
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                    <div>
                      <p className="text-xs font-bold text-slate-400">
                        Total Marks
                      </p>

                      <p className="mt-1 text-2xl font-black text-indigo-600">
                        {totalQuestions}
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Trophy size={20} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-5 sm:flex-row sm:justify-end sm:px-7">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={17} />

                      {selectedTest
                        ? "Update Test"
                        : "Create Test"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "view" &&
        selectedTest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-6 py-7 text-white">
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />

                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                        <FileQuestion
                          size={20}
                        />
                      </div>

                      <span className="text-xs font-black uppercase tracking-[0.15em] text-indigo-100">
                        Assessment
                      </span>
                    </div>

                    <h2 className="text-2xl font-black">
                      {selectedTest.title}
                    </h2>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100">
                      {selectedTest.description ||
                        "No description available."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
                  >
                    <X size={19} />
                  </button>
                </div>
              </div>

              <div className="max-h-[calc(90vh-190px)] overflow-y-auto p-6">
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Subject
                    </p>

                    <p className="mt-2 truncate text-sm font-black text-slate-700">
                      {getSubjectName(
                        selectedTest,
                        subjects
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Duration
                    </p>

                    <p className="mt-2 text-sm font-black text-slate-700">
                      {selectedTest.duration_minutes ||
                        0}{" "}
                      minutes
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Passing
                    </p>

                    <p className="mt-2 text-sm font-black text-slate-700">
                      {selectedTest.passing_marks ??
                        0}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Status
                    </p>

                    <div className="mt-2">
                      <StatusBadge
                        status={
                          selectedTest.status
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        Questions
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        Questions included in this
                        assessment
                      </p>
                    </div>

                    <span className="rounded-xl bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-600">
                      {Array.isArray(
                        selectedTest.questions
                      )
                        ? selectedTest.questions
                            .length
                        : 0}{" "}
                      Questions
                    </span>
                  </div>

                  <div className="space-y-3">
                    {Array.isArray(
                      selectedTest.questions
                    ) &&
                    selectedTest.questions.length >
                      0 ? (
                      selectedTest.questions.map(
                        (
                          question,
                          index
                        ) => (
                          <div
                            key={
                              question.id ||
                              question.question_id ||
                              index
                            }
                            className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-black text-indigo-600">
                                {index + 1}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold leading-6 text-slate-700">
                                  {question.question_text ||
                                    question.text ||
                                    question.question ||
                                    `Question ${
                                      index +
                                      1
                                    }`}
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-600">
                                    Marks:{" "}
                                    {question.marks ??
                                      1}
                                  </span>

                                  <span className="rounded-lg bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-500">
                                    Negative:{" "}
                                    {question.negative_marks ??
                                      0}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-medium text-slate-400">
                        No question details
                        available.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}