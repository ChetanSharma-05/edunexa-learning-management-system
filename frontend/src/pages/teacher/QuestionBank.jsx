import {
  Activity,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Edit3,
  FileQuestion,
  Filter,
  Loader2,
  Menu,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import TeacherSidebar from "../../components/teacher/TeacherSidebar";

const createEmptyForm = () => ({
  subject: "",
  question_text: "",
  question_type: "MCQ",
  difficulty: "MEDIUM",
  marks: "1",
  explanation: "",
  is_active: true,
  options: [
    {
      option_text: "",
      is_correct: true,
      order: 1,
    },
    {
      option_text: "",
      is_correct: false,
      order: 2,
    },
    {
      option_text: "",
      is_correct: false,
      order: 3,
    },
    {
      option_text: "",
      is_correct: false,
      order: 4,
    },
  ],
});

function getErrorMessage(
  error,
  fallback = "Something went wrong."
) {
  const data = error?.response?.data;

  if (!data) {
    return error?.message || fallback;
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

      if (
        value &&
        typeof value === "object"
      ) {
        return `${key}: ${Object.values(
          value
        )
          .flat()
          .join(", ")}`;
      }

      return `${key}: ${String(value)}`;
    })
    .filter(Boolean);

  return messages.length
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

function getSubjectName(
  question,
  subjects
) {
  if (question?.subject_name) {
    return question.subject_name;
  }

  if (
    question?.subject &&
    typeof question.subject ===
      "object"
  ) {
    return (
      question.subject.name ||
      "Unknown Subject"
    );
  }

  const subject = subjects.find(
    (item) =>
      String(item.id) ===
      String(question?.subject)
  );

  return (
    subject?.name ||
    "Unknown Subject"
  );
}

function TypeBadge({ type }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
        type === "WRITTEN"
          ? "bg-violet-50 text-violet-600"
          : "bg-indigo-50 text-indigo-600"
      }`}
    >
      {type === "WRITTEN"
        ? "Written"
        : "MCQ"}
    </span>
  );
}

function DifficultyBadge({
  difficulty,
}) {
  const classes = {
    EASY: "bg-emerald-50 text-emerald-600",
    MEDIUM:
      "bg-amber-50 text-amber-600",
    HARD: "bg-rose-50 text-rose-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${
        classes[difficulty] ||
        "bg-slate-100 text-slate-600"
      }`}
    >
      {difficulty || "MEDIUM"}
    </span>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
        active
          ? "bg-emerald-50 text-emerald-600"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active
            ? "bg-emerald-500"
            : "bg-slate-400"
        }`}
      />

      {active ? "Active" : "Inactive"}
    </span>
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
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-slate-100/70 transition-transform duration-500 group-hover:scale-150" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass} shadow-sm transition duration-300 group-hover:rotate-6 group-hover:scale-110`}
          >
            <Icon size={22} />
          </div>

          <BarChart3
            size={18}
            className="text-slate-200"
          />
        </div>

        <p className="mt-5 text-sm font-semibold text-slate-400">
          {title}
        </p>

        <p className="mt-1 text-3xl font-black text-slate-900">
          {value}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
  maxWidth = "max-w-5xl",
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-md">
      <div
        className={`max-h-[94vh] w-full ${maxWidth} overflow-hidden rounded-[2rem] bg-white shadow-2xl`}
      >
        <div className="flex items-start justify-between border-b border-slate-100 bg-white px-6 py-5 sm:px-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <FileQuestion size={19} />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {title}
                </h2>

                {subtitle && (
                  <p className="mt-1 text-xs text-slate-400">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-red-50 hover:text-red-500"
          >
            <X size={19} />
          </button>
        </div>

        <div className="max-h-[calc(94vh-90px)] overflow-y-auto p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

function BarGraph({
  easy,
  medium,
  hard,
}) {
  const data = [
    {
      label: "Easy",
      value: easy,
      gradient:
        "from-emerald-500 to-teal-400",
    },
    {
      label: "Medium",
      value: medium,
      gradient:
        "from-amber-500 to-orange-400",
    },
    {
      label: "Hard",
      value: hard,
      gradient:
        "from-rose-500 to-pink-400",
    },
  ];

  const max = Math.max(
    easy,
    medium,
    hard,
    1
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">
            Difficulty Overview
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            Question distribution
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <BarChart3 size={19} />
        </div>
      </div>

      <div className="flex h-52 items-end gap-7 border-b border-slate-100 px-4">
        {data.map((item) => {
          const height =
            item.value > 0
              ? Math.max(
                  (item.value / max) * 100,
                  8
                )
              : 3;

          return (
            <div
              key={item.label}
              className="group flex h-full flex-1 flex-col items-center justify-end"
            >
              <span className="mb-2 text-sm font-black text-slate-700">
                {item.value}
              </span>

              <div className="flex h-[78%] w-full items-end justify-center">
                <div
                  className={`w-full max-w-[55px] rounded-t-2xl bg-gradient-to-t ${item.gradient} shadow-lg transition-all duration-700 group-hover:-translate-y-2 group-hover:scale-105`}
                  style={{
                    height: `${height}%`,
                  }}
                />
              </div>

              <span className="mt-3 pb-3 text-xs font-bold text-slate-400">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function QuestionBank() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [questions, setQuestions] =
    useState([]);

  const [subjects, setSubjects] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [subjectsLoading, setSubjectsLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [generatingOptions, setGeneratingOptions] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [subjectFilter, setSubjectFilter] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState("");

  const [difficultyFilter, setDifficultyFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [showPreview, setShowPreview] =
    useState(false);

  const [showDelete, setShowDelete] =
    useState(false);

  const [editingQuestion, setEditingQuestion] =
    useState(null);

  const [selectedQuestion, setSelectedQuestion] =
    useState(null);

  const [form, setForm] =
    useState(createEmptyForm());

  const loadQuestions =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/question-bank/"
        );

        setQuestions(
          normalizeList(response?.data)
        );
      } catch (err) {
        console.error(
          "QUESTION BANK ERROR:",
          err?.response?.data || err
        );

        setQuestions([]);

        setError(
          getErrorMessage(
            err,
            "Unable to load questions."
          )
        );
      } finally {
        setLoading(false);
      }
    }, []);

  const loadSubjects =
    useCallback(async () => {
      try {
        setSubjectsLoading(true);

        const response = await api.get(
          "/admin/subjects/"
        );

        setSubjects(
          normalizeList(response?.data)
        );
      } catch (err) {
        console.error(
          "SUBJECT ERROR:",
          err?.response?.data || err
        );

        setError(
          getErrorMessage(
            err,
            "Unable to load subjects."
          )
        );
      } finally {
        setSubjectsLoading(false);
      }
    }, []);

  useEffect(() => {
    loadQuestions();
    loadSubjects();
  }, [
    loadQuestions,
    loadSubjects,
  ]);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [success]);

  const statistics = useMemo(() => {
    const total = questions.length;

    const active = questions.filter(
      (question) =>
        question.is_active
    ).length;

    const inactive = total - active;

    const mcq = questions.filter(
      (question) =>
        question.question_type ===
        "MCQ"
    ).length;

    const written = questions.filter(
      (question) =>
        question.question_type ===
        "WRITTEN"
    ).length;

    const easy = questions.filter(
      (question) =>
        question.difficulty === "EASY"
    ).length;

    const medium = questions.filter(
      (question) =>
        question.difficulty === "MEDIUM"
    ).length;

    const hard = questions.filter(
      (question) =>
        question.difficulty === "HARD"
    ).length;

    return {
      total,
      active,
      inactive,
      mcq,
      written,
      easy,
      medium,
      hard,
    };
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return questions.filter(
      (question) => {
        const subjectName =
          getSubjectName(
            question,
            subjects
          );

        const text = String(
          question.question_text ||
            ""
        ).toLowerCase();

        const matchesSearch =
          !query ||
          text.includes(query) ||
          subjectName
            .toLowerCase()
            .includes(query);

        const questionSubject =
          typeof question.subject ===
          "object"
            ? question.subject?.id
            : question.subject;

        const matchesSubject =
          !subjectFilter ||
          String(
            questionSubject
          ) === String(subjectFilter);

        const matchesType =
          !typeFilter ||
          question.question_type ===
            typeFilter;

        const matchesDifficulty =
          !difficultyFilter ||
          question.difficulty ===
            difficultyFilter;

        const matchesStatus =
          !statusFilter ||
          (statusFilter === "ACTIVE" &&
            question.is_active) ||
          (statusFilter ===
            "INACTIVE" &&
            !question.is_active);

        return (
          matchesSearch &&
          matchesSubject &&
          matchesType &&
          matchesDifficulty &&
          matchesStatus
        );
      }
    );
  }, [
    questions,
    subjects,
    search,
    subjectFilter,
    typeFilter,
    difficultyFilter,
    statusFilter,
  ]);

  const openCreate = () => {
    setEditingQuestion(null);
    setForm(createEmptyForm());
    setError("");
    setShowForm(true);
  };

  const openEdit = (question) => {
    const sourceOptions =
      Array.isArray(question.options) &&
      question.options.length
        ? [...question.options]
            .sort(
              (a, b) =>
                Number(a.order || 0) -
                Number(b.order || 0)
            )
            .map(
              (
                option,
                index
              ) => ({
                option_text:
                  option.option_text ||
                  "",
                is_correct:
                  Boolean(
                    option.is_correct
                  ),
                order: index + 1,
              })
            )
        : createEmptyForm()
            .options;

    setEditingQuestion(question);

    setForm({
      subject:
        typeof question.subject ===
        "object"
          ? question.subject?.id ||
            ""
          : question.subject || "",

      question_text:
        question.question_text || "",

      question_type:
        question.question_type ||
        "MCQ",

      difficulty:
        question.difficulty ||
        "MEDIUM",

      marks:
        question.marks !== undefined &&
        question.marks !== null
          ? String(question.marks)
          : "1",

      explanation:
        question.explanation || "",

      is_active:
        question.is_active !== false,

      options: sourceOptions,
    });

    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving || generatingOptions) {
      return;
    }

    setShowForm(false);
    setEditingQuestion(null);
    setForm(createEmptyForm());
  };

  const updateForm = (
    field,
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateOption = (
    index,
    field,
    value
  ) => {
    setForm((previous) => ({
      ...previous,

      options:
        previous.options.map(
          (option, optionIndex) =>
            optionIndex === index
              ? {
                  ...option,
                  [field]: value,
                }
              : option
        ),
    }));
  };

  const selectCorrectOption = (
    index
  ) => {
    setForm((previous) => ({
      ...previous,

      options:
        previous.options.map(
          (option, optionIndex) => ({
            ...option,
            is_correct:
              optionIndex === index,
          })
        ),
    }));
  };

  const addOption = () => {
    setForm((previous) => ({
      ...previous,

      options: [
        ...previous.options,
        {
          option_text: "",
          is_correct: false,
          order:
            previous.options.length +
            1,
        },
      ],
    }));
  };

  const removeOption = (
    index
  ) => {
    if (form.options.length <= 2) {
      return;
    }

    setForm((previous) => ({
      ...previous,

      options:
        previous.options
          .filter(
            (_, optionIndex) =>
              optionIndex !== index
          )
          .map(
            (option, optionIndex) => ({
              ...option,
              order:
                optionIndex + 1,
            })
          ),
    }));
  };

  const validateForm = () => {
    if (!form.subject) {
      return "Please select a subject.";
    }

    if (!form.question_text.trim()) {
      return "Question text is required.";
    }

    if (
      !form.marks ||
      Number(form.marks) <= 0
    ) {
      return "Marks must be greater than 0.";
    }

    if (
      form.question_type ===
      "MCQ"
    ) {
      const validOptions =
        form.options.filter(
          (option) =>
            option.option_text.trim()
        );

      if (validOptions.length < 2) {
        return "MCQ must have at least 2 options.";
      }

      const correctOptions =
        validOptions.filter(
          (option) =>
            option.is_correct
        );

      if (
        correctOptions.length !== 1
      ) {
        return "MCQ must have exactly one correct answer.";
      }
    }

    return "";
  };

  const handleGenerateIncorrectOptions = async () => {
    setError("");
    setSuccess("");

    if (form.question_type !== "MCQ") {
      setError("AI options can only be generated for MCQ questions.");
      return;
    }

    const correctIndex = form.options.findIndex(
      (option) => option.is_correct
    );
    const correctAnswer = form.options[correctIndex]?.option_text?.trim();

    if (!form.question_text.trim()) {
      setError("Please enter the question first.");
      return;
    }

    if (!correctAnswer) {
      setError("Please enter the correct answer in the selected correct option.");
      return;
    }

    try {
      setGeneratingOptions(true);

      const response = await api.post(
        "/question-bank/generate-options/",
        {
          question_text: form.question_text.trim(),
          correct_answer: correctAnswer,
        }
      );

      const generatedOptions = response?.data?.options;

      if (!Array.isArray(generatedOptions) || generatedOptions.length !== 3) {
        throw new Error("AI did not return exactly three incorrect options.");
      }

      const normalizedCorrect = correctAnswer.toLowerCase().replace(/\s+/g, " ").trim();
      const uniqueOptions = [];
      const seen = new Set([normalizedCorrect]);

      for (const item of generatedOptions) {
        if (typeof item !== "string" || !item.trim()) {
          throw new Error("AI returned an invalid option. Please try again.");
        }

        const option = item.trim();
        const normalized = option.toLowerCase().replace(/\s+/g, " ").trim();

        if (seen.has(normalized)) {
          throw new Error("AI returned duplicate options or repeated the correct answer. Please try again.");
        }

        seen.add(normalized);
        uniqueOptions.push(option);
      }

      setForm((previous) => {
        const options = [...previous.options];
        const currentCorrectIndex = options.findIndex(
          (option) => option.is_correct
        );

        while (options.length < 4) {
          options.push({
            option_text: "",
            is_correct: false,
            order: options.length + 1,
          });
        }

        let generatedIndex = 0;

        for (let index = 0; index < options.length && generatedIndex < 3; index += 1) {
          if (index === currentCorrectIndex) continue;

          options[index] = {
            ...options[index],
            option_text: uniqueOptions[generatedIndex],
            is_correct: false,
            order: index + 1,
          };
          generatedIndex += 1;
        }

        return { ...previous, options };
      });

      setSuccess("Three incorrect options generated successfully. Review them before saving.");
    } catch (err) {
      console.error("GENERATE INCORRECT OPTIONS ERROR:", err?.response?.data || err);
      setError(
        getErrorMessage(err, "Unable to generate incorrect options.")
      );
    } finally {
      setGeneratingOptions(false);
    }
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        subject:
          Number(form.subject),

        question_text:
          form.question_text.trim(),

        question_type:
          form.question_type,

        difficulty:
          form.difficulty,

        marks: form.marks,

        explanation:
          form.explanation.trim(),

        is_active:
          form.is_active,

        options:
          form.question_type ===
          "MCQ"
            ? form.options
                .filter(
                  (option) =>
                    option.option_text.trim()
                )
                .map(
                  (
                    option,
                    index
                  ) => ({
                    option_text:
                      option.option_text.trim(),
                    is_correct:
                      Boolean(
                        option.is_correct
                      ),
                    order:
                      index + 1,
                  })
                )
            : [],
      };

      if (editingQuestion) {
        await api.patch(
          `/question-bank/${editingQuestion.id}/`,
          payload
        );

        setSuccess(
          "Question updated successfully."
        );
      } else {
        await api.post(
          "/question-bank/",
          payload
        );

        setSuccess(
          "Question created successfully."
        );
      }

      closeForm();

      await loadQuestions();
    } catch (err) {
      console.error(
        "SAVE QUESTION ERROR:",
        err?.response?.data || err
      );

      setError(
        getErrorMessage(
          err,
          "Unable to save question."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (
    question
  ) => {
    try {
      setError("");

      await api.patch(
        `/question-bank/${question.id}/`,
        {
          is_active:
            !question.is_active,
        }
      );

      setSuccess(
        question.is_active
          ? "Question deactivated successfully."
          : "Question activated successfully."
      );

      await loadQuestions();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to update question."
        )
      );
    }
  };

  const openDelete = (
    question
  ) => {
    setSelectedQuestion(question);
    setShowDelete(true);
  };

  const handleDelete = async () => {
    if (!selectedQuestion) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await api.delete(
        `/question-bank/${selectedQuestion.id}/`
      );

      setShowDelete(false);
      setSelectedQuestion(null);

      setSuccess(
        "Question deleted successfully."
      );

      await loadQuestions();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to delete question."
        )
      );
    } finally {
      setDeleting(false);
    }
  };

  const openPreview = (
    question
  ) => {
    setSelectedQuestion(question);
    setShowPreview(true);
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
    <div className="min-h-screen bg-[#f6f8fc]">
      <TeacherSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        logout={logout}
        navigate={navigate}
      />

      <main className="min-h-screen lg:ml-[270px]">
        <header className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-100/60 blur-3xl" />

          <div className="relative flex items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
            <div className="flex items-start gap-4">
              <button
                type="button"
                onClick={() =>
                  setSidebarOpen(true)
                }
                className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                  <Sparkles size={14} />
                  Question Management
                </div>

                <h1 className="text-3xl font-black tracking-tight text-slate-900">
                  Question Bank
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Create, manage and organize
                  questions for your tests.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <Plus size={18} />

              <span className="hidden sm:inline">
                Add Question
              </span>
            </button>
          </div>
        </header>

        <div className="space-y-6 p-5 sm:p-8 lg:p-10">
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <CircleHelp
                size={19}
                className="mt-0.5 shrink-0"
              />

              <div className="min-w-0 flex-1">
                <p className="font-black">
                  Something went wrong
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
              >
                <X size={18} />
              </button>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              <CheckCircle2 size={19} />

              {success}

              <button
                type="button"
                onClick={() =>
                  setSuccess("")
                }
                className="ml-auto"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={FileQuestion}
              title="Total Questions"
              value={statistics.total}
              subtitle="All questions"
              iconClass="bg-indigo-50 text-indigo-600"
            />

            <StatCard
              icon={CheckCircle2}
              title="Active"
              value={statistics.active}
              subtitle="Available for tests"
              iconClass="bg-emerald-50 text-emerald-600"
            />

            <StatCard
              icon={CircleHelp}
              title="MCQ"
              value={statistics.mcq}
              subtitle="Multiple choice"
              iconClass="bg-violet-50 text-violet-600"
            />

            <StatCard
              icon={BookOpen}
              title="Written"
              value={statistics.written}
              subtitle="Written questions"
              iconClass="bg-amber-50 text-amber-600"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <BarGraph
              easy={statistics.easy}
              medium={statistics.medium}
              hard={statistics.hard}
            />

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 text-white shadow-xl shadow-indigo-500/20">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10" />

              <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                    <Trophy size={22} />
                  </div>

                  <Activity
                    size={22}
                    className="animate-pulse text-indigo-100"
                  />
                </div>

                <p className="mt-6 text-sm font-bold text-indigo-100">
                  Question Bank Health
                </p>

                <p className="mt-2 text-4xl font-black">
                  {statistics.total
                    ? Math.round(
                        (statistics.active /
                          statistics.total) *
                          100
                      )
                    : 0}
                  %
                </p>

                <p className="mt-2 text-sm leading-6 text-indigo-100">
                  Questions are currently active
                  and ready to be used in
                  assessments.
                </p>

                <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-700"
                    style={{
                      width: `${
                        statistics.total
                          ? Math.round(
                              (statistics.active /
                                statistics.total) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <div className="mt-5 flex items-center justify-between text-xs font-bold text-indigo-100">
                  <span>
                    Active: {statistics.active}
                  </span>

                  <span>
                    Inactive:{" "}
                    {statistics.inactive}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
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
                  placeholder="Search questions..."
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
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
                  className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-9 text-sm font-medium outline-none focus:border-indigo-400"
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

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <div className="relative">
                <Filter
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(
                      event.target.value
                    )
                  }
                  className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-9 text-sm font-medium outline-none focus:border-indigo-400"
                >
                  <option value="">
                    All Types
                  </option>

                  <option value="MCQ">
                    MCQ
                  </option>

                  <option value="WRITTEN">
                    Written
                  </option>
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <div className="relative">
                <select
                  value={difficultyFilter}
                  onChange={(event) =>
                    setDifficultyFilter(
                      event.target.value
                    )
                  }
                  className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-9 text-sm font-medium outline-none focus:border-indigo-400"
                >
                  <option value="">
                    All Difficulty
                  </option>

                  <option value="EASY">
                    Easy
                  </option>

                  <option value="MEDIUM">
                    Medium
                  </option>

                  <option value="HARD">
                    Hard
                  </option>
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                  className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-9 text-sm font-medium outline-none focus:border-indigo-400"
                >
                  <option value="">
                    All Status
                  </option>

                  <option value="ACTIVE">
                    Active
                  </option>

                  <option value="INACTIVE">
                    Inactive
                  </option>
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Questions
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Showing{" "}
                  {
                    filteredQuestions.length
                  }{" "}
                  of {statistics.total}{" "}
                  questions
                </p>
              </div>

              <button
                type="button"
                onClick={openCreate}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                <Plus size={17} />
                New Question
              </button>
            </div>

            {loading ? (
              <div className="flex min-h-[350px] flex-col items-center justify-center">
                <Loader2
                  size={34}
                  className="animate-spin text-indigo-600"
                />

                <p className="mt-4 text-sm font-medium text-slate-400">
                  Loading questions...
                </p>
              </div>
            ) : filteredQuestions.length ===
              0 ? (
              <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
                  <FileQuestion size={34} />
                </div>

                <h3 className="mt-5 text-lg font-black text-slate-900">
                  No questions found
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                  No questions match your
                  current filters. Create a
                  new question or change the
                  filters.
                </p>

                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-5 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200"
                >
                  <Plus size={17} />
                  Add Question
                </button>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[1100px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70">
                        <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Question
                        </th>

                        <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Subject
                        </th>

                        <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Type
                        </th>

                        <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Difficulty
                        </th>

                        <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Marks
                        </th>

                        <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Status
                        </th>

                        <th className="px-5 py-4 text-right text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredQuestions.map(
                        (question) => (
                          <tr
                            key={question.id}
                            className="group transition hover:bg-indigo-50/20"
                          >
                            <td className="max-w-[400px] px-6 py-5">
                              <button
                                type="button"
                                onClick={() =>
                                  openPreview(
                                    question
                                  )
                                }
                                className="text-left"
                              >
                                <p className="line-clamp-2 text-sm font-bold leading-6 text-slate-800 transition group-hover:text-indigo-600">
                                  {
                                    question.question_text
                                  }
                                </p>

                                {question.explanation && (
                                  <p className="mt-1 text-xs text-slate-400">
                                    Explanation
                                    available
                                  </p>
                                )}
                              </button>
                            </td>

                            <td className="px-5 py-5">
                              <span className="text-sm font-semibold text-slate-600">
                                {getSubjectName(
                                  question,
                                  subjects
                                )}
                              </span>
                            </td>

                            <td className="px-5 py-5">
                              <TypeBadge
                                type={
                                  question.question_type
                                }
                              />
                            </td>

                            <td className="px-5 py-5">
                              <DifficultyBadge
                                difficulty={
                                  question.difficulty
                                }
                              />
                            </td>

                            <td className="px-5 py-5">
                              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                                {question.marks ??
                                  1}{" "}
                                Marks
                              </span>
                            </td>

                            <td className="px-5 py-5">
                              <StatusBadge
                                active={
                                  question.is_active
                                }
                              />
                            </td>

                            <td className="px-5 py-5">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openPreview(
                                      question
                                    )
                                  }
                                  className="rounded-xl bg-slate-100 p-2.5 text-slate-500 transition hover:-translate-y-0.5 hover:bg-indigo-50 hover:text-indigo-600"
                                  title="Preview"
                                >
                                  <FileQuestion
                                    size={16}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleStatus(
                                      question
                                    )
                                  }
                                  className={`rounded-xl p-2.5 transition hover:-translate-y-0.5 ${
                                    question.is_active
                                      ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                                      : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                  }`}
                                  title={
                                    question.is_active
                                      ? "Deactivate"
                                      : "Activate"
                                  }
                                >
                                  {question.is_active ? (
                                    <X
                                      size={16}
                                    />
                                  ) : (
                                    <Check
                                      size={16}
                                    />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openEdit(
                                      question
                                    )
                                  }
                                  className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 transition hover:-translate-y-0.5 hover:bg-indigo-100"
                                  title="Edit"
                                >
                                  <Edit3
                                    size={16}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openDelete(
                                      question
                                    )
                                  }
                                  className="rounded-xl bg-red-50 p-2.5 text-red-500 transition hover:-translate-y-0.5 hover:bg-red-100"
                                  title="Delete"
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
                  {filteredQuestions.map(
                    (question) => (
                      <div
                        key={question.id}
                        className="rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-1 hover:shadow-xl"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              openPreview(
                                question
                              )
                            }
                            className="min-w-0 text-left"
                          >
                            <p className="font-bold leading-6 text-slate-800">
                              {
                                question.question_text
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {getSubjectName(
                                question,
                                subjects
                              )}
                            </p>
                          </button>

                          <StatusBadge
                            active={
                              question.is_active
                            }
                          />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <TypeBadge
                            type={
                              question.question_type
                            }
                          />

                          <DifficultyBadge
                            difficulty={
                              question.difficulty
                            }
                          />

                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                            {question.marks ??
                              1}{" "}
                            Marks
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-4 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openPreview(
                                question
                              )
                            }
                            className="flex items-center justify-center rounded-xl bg-slate-100 p-3 text-slate-600"
                          >
                            <FileQuestion
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleStatus(
                                question
                              )
                            }
                            className="flex items-center justify-center rounded-xl bg-amber-50 p-3 text-amber-600"
                          >
                            <Activity
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEdit(
                                question
                              )
                            }
                            className="flex items-center justify-center rounded-xl bg-indigo-50 p-3 text-indigo-600"
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openDelete(
                                question
                              )
                            }
                            className="flex items-center justify-center rounded-xl bg-red-50 p-3 text-red-500"
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

      {showForm && (
        <Modal
          title={
            editingQuestion
              ? "Edit Question"
              : "Create Question"
          }
          subtitle="Add question details and answer options."
          onClose={closeForm}
        >
          <form
            onSubmit={handleSubmit}
            className="space-y-7"
          >
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Subject
                </label>

                <select
                  value={form.subject}
                  onChange={(event) =>
                    updateForm(
                      "subject",
                      event.target.value
                    )
                  }
                  disabled={
                    subjectsLoading
                  }
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="">
                    {subjectsLoading
                      ? "Loading subjects..."
                      : "Select Subject"}
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

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Question Type
                </label>

                <select
                  value={
                    form.question_type
                  }
                  onChange={(event) =>
                    updateForm(
                      "question_type",
                      event.target.value
                    )
                  }
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="MCQ">
                    MCQ
                  </option>

                  <option value="WRITTEN">
                    Written
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Difficulty
                </label>

                <select
                  value={
                    form.difficulty
                  }
                  onChange={(event) =>
                    updateForm(
                      "difficulty",
                      event.target.value
                    )
                  }
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="EASY">
                    Easy
                  </option>

                  <option value="MEDIUM">
                    Medium
                  </option>

                  <option value="HARD">
                    Hard
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Marks
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.marks}
                  onChange={(event) =>
                    updateForm(
                      "marks",
                      event.target.value
                    )
                  }
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Question
              </label>

              <textarea
                rows={5}
                value={
                  form.question_text
                }
                onChange={(event) =>
                  updateForm(
                    "question_text",
                    event.target.value
                  )
                }
                placeholder="Enter your question..."
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            {form.question_type ===
              "MCQ" && (
              <div className="rounded-3xl border border-indigo-100 bg-indigo-50/40 p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-black text-slate-900">
                      Answer Options
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Select exactly one correct
                      answer.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateIncorrectOptions}
                      disabled={generatingOptions || saving}
                      className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {generatingOptions ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Sparkles size={15} />
                      )}
                      {generatingOptions ? "Generating..." : "Generate Incorrect Options"}
                    </button>

                    <button
                      type="button"
                      onClick={addOption}
                      disabled={generatingOptions || saving}
                      className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-indigo-600 shadow-sm ring-1 ring-indigo-100 transition hover:-translate-y-0.5 disabled:opacity-60"
                    >
                      <Plus size={15} />
                      Add Option
                    </button>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {form.options.map(
                    (
                      option,
                      index
                    ) => (
                      <div
                        key={index}
                        className={`rounded-2xl border bg-white p-4 transition ${
                          option.is_correct
                            ? "border-emerald-300 shadow-sm"
                            : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              selectCorrectOption(
                                index
                              )
                            }
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
                              option.is_correct
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-slate-300 bg-white text-transparent"
                            }`}
                            title="Mark as correct"
                          >
                            <Check
                              size={17}
                            />
                          </button>

                          <input
                            type="text"
                            value={
                              option.option_text
                            }
                            onChange={(
                              event
                            ) =>
                              updateOption(
                                index,
                                "option_text",
                                event.target
                                  .value
                              )
                            }
                            placeholder={`Option ${String.fromCharCode(
                              65 + index
                            )}`}
                            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                          />

                          {form.options
                            .length >
                            2 && (
                            <button
                              type="button"
                              onClick={() =>
                                removeOption(
                                  index
                                )
                              }
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100"
                            >
                              <Trash2
                                size={15}
                              />
                            </button>
                          )}
                        </div>

                        {option.is_correct && (
                          <p className="mt-2 ml-12 text-[11px] font-black text-emerald-600">
                            Correct Answer
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Explanation
              </label>

              <textarea
                rows={4}
                value={
                  form.explanation
                }
                onChange={(event) =>
                  updateForm(
                    "explanation",
                    event.target.value
                  )
                }
                placeholder="Explain why the answer is correct..."
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                updateForm(
                  "is_active",
                  !form.is_active
                )
              }
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left"
            >
              <div>
                <p className="text-sm font-bold text-slate-700">
                  Question Active
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Active questions can be added to
                  tests.
                </p>
              </div>

              <div
                className={`relative h-7 w-12 rounded-full transition ${
                  form.is_active
                    ? "bg-indigo-600"
                    : "bg-slate-300"
                }`}
              >
                <div
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                    form.is_active
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </div>
            </button>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-200 disabled:opacity-60"
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

                    {editingQuestion
                      ? "Update Question"
                      : "Create Question"}
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showPreview &&
        selectedQuestion && (
          <Modal
            title="Question Preview"
            subtitle="Preview question before using it in a test."
            onClose={() => {
              setShowPreview(false);
              setSelectedQuestion(null);
            }}
            maxWidth="max-w-3xl"
          >
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <TypeBadge
                  type={
                    selectedQuestion.question_type
                  }
                />

                <DifficultyBadge
                  difficulty={
                    selectedQuestion.difficulty
                  }
                />

                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                  {selectedQuestion.marks ??
                    1}{" "}
                  Marks
                </span>

                <StatusBadge
                  active={
                    selectedQuestion.is_active
                  }
                />
              </div>

              <div className="rounded-3xl bg-slate-50 p-6">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Question
                </p>

                <h3 className="mt-3 text-lg font-black leading-8 text-slate-900">
                  {
                    selectedQuestion.question_text
                  }
                </h3>
              </div>

              {selectedQuestion.question_type ===
                "MCQ" &&
                Array.isArray(
                  selectedQuestion.options
                ) && (
                  <div>
                    <p className="mb-3 text-sm font-black text-slate-700">
                      Answer Options
                    </p>

                    <div className="space-y-3">
                      {selectedQuestion.options
                        .slice()
                        .sort(
                          (a, b) =>
                            Number(
                              a.order || 0
                            ) -
                            Number(
                              b.order || 0
                            )
                        )
                        .map(
                          (
                            option,
                            index
                          ) => (
                            <div
                              key={
                                option.id ||
                                index
                              }
                              className={`flex items-center gap-3 rounded-2xl border p-4 ${
                                option.is_correct
                                  ? "border-emerald-300 bg-emerald-50"
                                  : "border-slate-200 bg-white"
                              }`}
                            >
                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black ${
                                  option.is_correct
                                    ? "bg-emerald-500 text-white"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {String.fromCharCode(
                                  65 +
                                    index
                                )}
                              </div>

                              <p className="flex-1 text-sm font-semibold text-slate-700">
                                {
                                  option.option_text
                                }
                              </p>

                              {option.is_correct && (
                                <CheckCircle2
                                  size={20}
                                  className="text-emerald-500"
                                />
                              )}
                            </div>
                          )
                        )}
                    </div>
                  </div>
                )}

              {selectedQuestion.explanation && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                  <p className="text-xs font-black uppercase tracking-wider text-indigo-500">
                    Explanation
                  </p>

                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {
                      selectedQuestion.explanation
                    }
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                <div>
                  <p className="text-xs text-slate-400">
                    Subject
                  </p>

                  <p className="mt-1 text-sm font-black text-slate-700">
                    {getSubjectName(
                      selectedQuestion,
                      subjects
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowPreview(false);
                    openEdit(
                      selectedQuestion
                    );
                  }}
                  className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-600"
                >
                  <Edit3 size={16} />
                  Edit
                </button>
              </div>
            </div>
          </Modal>
        )}

      {showDelete &&
        selectedQuestion && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-md">
            <div className="w-full max-w-md rounded-[2rem] bg-white p-7 shadow-2xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <Trash2 size={24} />
              </div>

              <h2 className="mt-5 text-xl font-black text-slate-900">
                Delete Question?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Are you sure you want to delete
                this question? This action cannot
                be undone.
              </p>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <p className="line-clamp-3 text-sm font-semibold leading-6 text-slate-700">
                  {
                    selectedQuestion.question_text
                  }
                </p>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowDelete(false);
                    setSelectedQuestion(
                      null
                    );
                  }}
                  disabled={deleting}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-200 disabled:opacity-60"
                >
                  {deleting && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  Delete Question
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}