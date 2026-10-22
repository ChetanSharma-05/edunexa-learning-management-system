import {

  useCallback,

  useEffect,

  useMemo,

  useRef,

  useState,

} from "react";

import {

  AlertCircle,

  ArrowRight,

  BookOpen,

  Check,

  CheckCircle2,

  ChevronDown,

  CircleHelp,

  CloudUpload,

  FileText,

  LoaderCircle,

  Menu,

  RefreshCw,

  Save,

  ScanText,

  Sparkles,

  Trash2,

  Upload,

  WandSparkles,

  X,

} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/AdminSidebar";
import TeacherSidebar from "../../components/teacher/TeacherSidebar";

import api from "../../services/api";

const initialSettings = {

  subject: "",

  question_type: "MCQ",

  difficulty: "MEDIUM",

  question_count: 10,

  marks: 1,

};

function getErrorMessage(error, fallback = "Something went wrong.") {

  const data = error?.response?.data;

  if (typeof data === "string") {

    return data;

  }

  if (typeof data?.detail === "string") {

    return data.detail;

  }

  if (typeof data?.error === "string") {

    return data.error;

  }

  if (typeof data?.message === "string") {

    return data.message;

  }

  if (data && typeof data === "object") {

    for (const [key, value] of Object.entries(data)) {

      if (typeof value === "string") {

        return `${key}: ${value}`;

      }

      if (Array.isArray(value) && value.length > 0) {

        return `${key}: ${value.join(", ")}`;

      }

    }

  }

  return error?.message || fallback;

}

function normalizeQuestion(question, index) {

  return {

    ...question,

    id: question.id ?? `generated-${index}-${Date.now()}`,

    question_text: question.question_text || question.question || "",

    question_type: question.question_type || "MCQ",

    difficulty: question.difficulty || "MEDIUM",

    marks: Number(question.marks ?? 1),

    explanation: question.explanation || "",

    options: Array.isArray(question.options)

      ? question.options.map((option, optionIndex) => ({

          option_text:

            typeof option === "string"

              ? option

              : option.option_text || option.text || "",

          is_correct:

            typeof option === "object" &&

            option !== null &&

            Boolean(option.is_correct),

          order: option.order || optionIndex + 1,

        }))

      : [],

    selected: question.selected !== false,

  };

}

function normalizeSubjects(responseData) {

  let list = [];

  if (Array.isArray(responseData)) {

    list = responseData;

  } else if (Array.isArray(responseData?.results)) {

    list = responseData.results;

  } else if (Array.isArray(responseData?.subjects)) {

    list = responseData.subjects;

  } else if (Array.isArray(responseData?.data)) {

    list = responseData.data;

  }

  return list.filter(

    (subject) =>

      subject &&

      subject.id !== undefined &&

      subject.id !== null &&

      typeof subject.name === "string"

  );

}

export default function AIQuestionGenerator() {

  const auth = useAuth();
  const { user } = auth;
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleAdminLogout = async () => {
    if (typeof auth.logout === "function") {
      await auth.logout();
    } else {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    }
  };

  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);

  const [settings, setSettings] = useState(initialSettings);

  const [subjects, setSubjects] = useState([]);

  const [questions, setQuestions] = useState([]);

  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const [generating, setGenerating] = useState(false);

  const [saving, setSaving] = useState(false);

  const [dragging, setDragging] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [editingIndex, setEditingIndex] = useState(null);

  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const role = String(user?.role || "").toUpperCase();

  const isTeacher = role === "TEACHER";

  const selectedQuestions = useMemo(

    () => questions.filter((question) => question.selected),

    [questions]

  );

  const updateSetting = (name, value) => {

    setSettings((previous) => ({

      ...previous,

      [name]: value,

    }));

  };

  const loadSubjects = useCallback(async () => {

    setLoadingSubjects(true);

    try {

      const response = await api.get("/admin/subjects/");

      const subjectList = normalizeSubjects(response.data);

      setSubjects(subjectList);

      if (subjectList.length === 0) {

        console.warn(

          "The subjects API returned an empty list:",

          response.data

        );

      }

    } catch (err) {

      console.error(

        "Subject API error:",

        err.response?.status,

        err.response?.data || err.message

      );

      setSubjects([]);

      setError(

        `Unable to load subjects. ${getErrorMessage(

          err,

          "Check the API URL and your login permissions."

        )}`

      );

    } finally {

      setLoadingSubjects(false);

    }

  }, []);

  useEffect(() => {

    loadSubjects();

  }, [loadSubjects]);

  const validateFile = (selectedFile) => {

    if (!selectedFile) {

      return "Please select a PDF file.";

    }

    if (

      selectedFile.type !== "application/pdf" &&

      !selectedFile.name.toLowerCase().endsWith(".pdf")

    ) {

      return "Only PDF files are supported.";

    }

    if (selectedFile.size > 20 * 1024 * 1024) {

      return "PDF size must be 20 MB or less.";

    }

    return "";

  };

  const selectFile = (selectedFile) => {

    if (!selectedFile) return;

    const validationError = validateFile(selectedFile);

    setError("");

    setSuccess("");

    setQuestions([]);

    if (validationError) {

      setFile(null);

      setError(validationError);

      return;

    }

    setFile(selectedFile);

  };

  const handleDrop = (event) => {

    event.preventDefault();

    setDragging(false);

    selectFile(event.dataTransfer.files?.[0]);

  };

  const handleGenerate = async (event) => {

    event.preventDefault();

    setError("");

    setSuccess("");

    if (!file) {

      setError("Please upload a PDF first.");

      return;

    }

    if (!settings.subject) {

      setError("Please select a subject.");

      return;

    }

    setGenerating(true);

    try {

      const formData = new FormData();

      formData.append("file", file);

      formData.append("subject", settings.subject);

      formData.append("question_type", settings.question_type);

      formData.append("difficulty", settings.difficulty);

      formData.append(

        "question_count",

        String(settings.question_count)

      );

      formData.append("marks", String(settings.marks));

      const response = await api.post(

        "/question-bank/ai-pdf/preview/",

        formData

      );

      const generated = response.data?.questions;

      if (!Array.isArray(generated) || generated.length === 0) {

        throw new Error(

          "No questions were returned. Check the PDF and backend response."

        );

      }

      setQuestions(generated.map((question, index) => normalizeQuestion(question, index)));

      setEditingIndex(null);

      setSuccess(`${generated.length} questions generated successfully.`);

    } catch (err) {

      setError(

        getErrorMessage(

          err,

          "Unable to generate questions. Check the backend API and Gemini configuration."

        )

      );

    } finally {

      setGenerating(false);

    }

  };

  const updateQuestion = (index, field, value) => {

    setQuestions((previous) =>

      previous.map((question, questionIndex) =>

        questionIndex === index

          ? { ...question, [field]: value }

          : question

      )

    );

  };

  const updateOption = (

    questionIndex,

    optionIndex,

    field,

    value

  ) => {

    setQuestions((previous) =>

      previous.map((question, index) => {

        if (index !== questionIndex) return question;

        const options = question.options.map((option, index2) => {

          if (index2 === optionIndex) {

            return { ...option, [field]: value };

          }

          if (field === "is_correct" && value) {

            return { ...option, is_correct: false };

          }

          return option;

        });

        return { ...question, options };

      })

    );

  };

  const addOption = (questionIndex) => {

    setQuestions((previous) =>

      previous.map((question, index) => {

        if (index !== questionIndex) return question;

        return {

          ...question,

          options: [

            ...question.options,

            {

              option_text: "",

              is_correct: false,

              order: question.options.length + 1,

            },

          ],

        };

      })

    );

  };

  const removeOption = (questionIndex, optionIndex) => {

    setQuestions((previous) =>

      previous.map((question, index) => {

        if (index !== questionIndex) return question;

        return {

          ...question,

          options: question.options

            .filter((_, index2) => index2 !== optionIndex)

            .map((option, index2) => ({

              ...option,

              order: index2 + 1,

            })),

        };

      })

    );

  };

  const deleteQuestion = (index) => {

    setQuestions((previous) =>

      previous.filter((_, questionIndex) => questionIndex !== index)

    );

  };

  const handleSaveQuestions = async () => {

    setError("");

    setSuccess("");

    if (selectedQuestions.length === 0) {

      setError("Select at least one question to save.");

      return;

    }

    const invalidQuestion = selectedQuestions.find((question) => {

      if (!question.question_text.trim()) {

        return true;

      }

      if (question.question_type === "MCQ") {

        return (

          question.options.length < 2 ||

          question.options.some(

            (option) => !option.option_text.trim()

          ) ||

          question.options.filter((option) => option.is_correct)

            .length !== 1

        );

      }

      return false;

    });

    if (invalidQuestion) {

      setError(

        "Each MCQ needs at least two options and exactly one correct answer."

      );

      return;

    }

    setSaving(true);

    try {

      const payload = {
        subject_id: Number(settings.subject),
        questions: selectedQuestions.map((question) => ({
          question_text: question.question_text.trim(),
          question_type: question.question_type,
          difficulty: question.difficulty,
          marks: Number(question.marks || settings.marks),
          explanation: question.explanation || "",
          options:
            question.question_type === "MCQ"
              ? question.options.map((option, index) => ({
                  option_text: option.option_text.trim(),
                  is_correct: Boolean(option.is_correct),
                  order: index + 1,
                }))
              : [],
        })),
      };

      const response = await api.post(
        "/question-bank/ai-pdf/save/",
        payload
      );

      const savedCount =
        response.data?.created_count ?? selectedQuestions.length;

      setSuccess(

        `${savedCount} questions saved to the Question Bank.`

      );

      setQuestions((previous) =>

        previous.map((question) =>

          question.selected

            ? { ...question, saved: true }

            : question

        )

      );

      setShowSaveConfirm(false);

    } catch (err) {

      setError(

        getErrorMessage(

          err,

          "Some questions could not be saved. Check the Question Bank API."

        )

      );

    } finally {

      setSaving(false);

    }

  };

  const handleReset = () => {

    setFile(null);

    setQuestions([]);

    setSettings(initialSettings);

    setError("");

    setSuccess("");

    setEditingIndex(null);

    setShowSaveConfirm(false);

    if (fileInputRef.current) {

      fileInputRef.current.value = "";

    }

  };

  const formatFileSize = (bytes) => {

    if (bytes < 1024 * 1024) {

      return `${(bytes / 1024).toFixed(0)} KB`;

    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  };

  return (

    <div className="min-h-screen bg-[#f6f8fc] text-slate-900">

      {isTeacher ? (
        <TeacherSidebar />
      ) : (
        <AdminSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          user={user}
          logout={handleAdminLogout}
          navigate={navigate}
        />
      )}

      <main className="min-h-screen lg:ml-[270px]">

        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">

          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              {!isTeacher && (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open admin sidebar"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
                >
                  <Menu size={20} />
                </button>
              )}
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">

                <Sparkles size={24} />

              </div>

              <div>

                <h1 className="text-xl font-black sm:text-2xl">

                  AI Question Generator

                </h1>

                <p className="text-sm text-slate-500">

                  Convert study PDFs into reviewable questions.

                </p>

              </div>

            </div>

            <button

              type="button"

              onClick={handleReset}

              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"

            >

              <RefreshCw size={16} />

              Start Over

            </button>

          </div>

        </header>

        <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">

          <section className="rounded-3xl bg-gradient-to-br from-[#25104d] via-[#5124a6] to-[#7544e8] p-6 text-white shadow-xl sm:p-9">

            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">

              <WandSparkles size={15} />

              Gemini AI

            </span>

            <h2 className="mt-5 text-3xl font-black sm:text-4xl">

              Turn your PDF into exam-ready questions.

            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100">

              Upload study material, choose a subject, generate questions,

              review answers and save only the questions you approve.

            </p>

            <div className="mt-5 flex flex-wrap gap-2">

              {[

                "PDF text extraction",

                "OCR-ready workflow",

                "Teacher review",

              ].map((label) => (

                <span

                  key={label}

                  className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs"

                >

                  <Check size={13} className="mr-1 inline" />

                  {label}

                </span>

              ))}

            </div>

          </section>

          {(error || success) && (

            <div

              role="alert"

              className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${

                error

                  ? "border-rose-200 bg-rose-50 text-rose-700"

                  : "border-emerald-200 bg-emerald-50 text-emerald-700"

              }`}

            >

              {error ? (

                <AlertCircle size={20} className="shrink-0" />

              ) : (

                <CheckCircle2 size={20} className="shrink-0" />

              )}

              <p className="flex-1">{error || success}</p>

              <button

                type="button"

                onClick={() => {

                  setError("");

                  setSuccess("");

                }}

                aria-label="Dismiss message"

              >

                <X size={18} />

              </button>

            </div>

          )}

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.4fr)]">

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-100 p-5">

                <h3 className="font-black">Upload & Configure</h3>

                <p className="mt-1 text-xs text-slate-500">

                  Upload your PDF and configure the questions.

                </p>

              </div>

              <form

                onSubmit={handleGenerate}

                className="space-y-6 p-5"

              >

                <input

                  ref={fileInputRef}

                  type="file"

                  accept=".pdf,application/pdf"

                  className="hidden"

                  onChange={(event) =>

                    selectFile(event.target.files?.[0])

                  }

                />

                <button

                  type="button"

                  onClick={() => fileInputRef.current?.click()}

                  onDragOver={(event) => {

                    event.preventDefault();

                    setDragging(true);

                  }}

                  onDragLeave={() => setDragging(false)}

                  onDrop={handleDrop}

                  className={`w-full rounded-2xl border-2 border-dashed p-6 text-center transition ${

                    dragging

                      ? "border-violet-500 bg-violet-50"

                      : file

                        ? "border-emerald-300 bg-emerald-50"

                        : "border-slate-200 bg-slate-50 hover:border-violet-400"

                  }`}

                >

                  {file ? (

                    <FileText

                      size={32}

                      className="mx-auto text-emerald-600"

                    />

                  ) : (

                    <CloudUpload

                      size={32}

                      className="mx-auto text-violet-600"

                    />

                  )}

                  <p className="mt-3 break-words text-sm font-bold">

                    {file ? file.name : "Drop your PDF here"}

                  </p>

                  <p className="mt-2 text-xs text-slate-500">

                    {file

                      ? `${formatFileSize(file.size)} · Click to change`

                      : "or click to browse · Maximum 20 MB"}

                  </p>

                  {!file && (

                    <span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white">

                      <Upload size={14} />

                      Choose PDF

                    </span>

                  )}

                </button>

                <div>

                  <div className="mb-2 flex items-center justify-between gap-3">

                    <label

                      htmlFor="subject"

                      className="text-sm font-bold text-slate-700"

                    >

                      Subject

                    </label>

                    <button

                      type="button"

                      onClick={loadSubjects}

                      disabled={loadingSubjects}

                      className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 disabled:opacity-50"

                    >

                      <RefreshCw

                        size={13}

                        className={

                          loadingSubjects ? "animate-spin" : ""

                        }

                      />

                      Refresh

                    </button>

                  </div>

                  <div className="relative">

                    <BookOpen

                      size={17}

                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"

                    />

                    <select

                      id="subject"

                      name="subject"

                      required

                      value={settings.subject}

                      disabled={loadingSubjects}

                      onChange={(event) => {

                        updateSetting("subject", event.target.value);

                        setError("");

                      }}

                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:bg-slate-100"

                    >

                      <option value="">

                        {loadingSubjects

                          ? "Loading subjects..."

                          : subjects.length === 0

                            ? "No subjects available"

                            : "Select a subject"}

                      </option>

                      {subjects.map((subject) => (

                        <option

                          key={subject.id}

                          value={String(subject.id)}

                        >

                          {subject.name}

                        </option>

                      ))}

                    </select>

                    <ChevronDown

                      size={16}

                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"

                    />

                  </div>

                  <p className="mt-2 text-xs text-slate-500">

                    {loadingSubjects

                      ? "Fetching subjects from the server..."

                      : `${subjects.length} subjects available`}

                  </p>

                </div>

                <div>

                  <label

                    htmlFor="question-type"

                    className="mb-2 block text-sm font-bold text-slate-700"

                  >

                    Question Type

                  </label>

                  <select

                    id="question-type"

                    value={settings.question_type}

                    onChange={(event) =>

                      updateSetting(

                        "question_type",

                        event.target.value

                      )

                    }

                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"

                  >

                    <option value="MCQ">Multiple Choice (MCQ)</option>

                    <option value="WRITTEN">Written Questions</option>

                  </select>

                </div>

                <div className="grid grid-cols-2 gap-3">

                  <div>

                    <label

                      htmlFor="difficulty"

                      className="mb-2 block text-sm font-bold text-slate-700"

                    >

                      Difficulty

                    </label>

                    <select

                      id="difficulty"

                      value={settings.difficulty}

                      onChange={(event) =>

                        updateSetting("difficulty", event.target.value)

                      }

                      className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"

                    >

                      <option value="EASY">Easy</option>

                      <option value="MEDIUM">Medium</option>

                      <option value="HARD">Hard</option>

                    </select>

                  </div>

                  <div>

                    <label

                      htmlFor="question-count"

                      className="mb-2 block text-sm font-bold text-slate-700"

                    >

                      Number of Questions

                    </label>

                    <select

                      id="question-count"

                      value={settings.question_count}

                      onChange={(event) =>

                        updateSetting(

                          "question_count",

                          Number(event.target.value)

                        )

                      }

                      className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"

                    >

                      {[5, 10, 15, 20, 25, 30].map((count) => (

                        <option key={count} value={count}>

                          {count} questions

                        </option>

                      ))}

                    </select>

                  </div>

                </div>

                <div>

                  <label

                    htmlFor="marks"

                    className="mb-2 block text-sm font-bold text-slate-700"

                  >

                    Marks per Question

                  </label>

                  <input

                    id="marks"

                    type="number"

                    min="0.5"

                    max="100"

                    step="0.5"

                    required

                    value={settings.marks}

                    onChange={(event) =>

                      updateSetting("marks", event.target.value)

                    }

                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"

                  />

                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                  <div className="flex items-start gap-3">

                    <ScanText

                      size={19}

                      className="shrink-0 text-blue-600"

                    />

                    <div>

                      <p className="text-sm font-bold text-blue-900">

                        Text PDF & scanned PDF

                      </p>

                      <p className="mt-1 text-xs leading-5 text-blue-700">

                        Scanned PDFs require OCR on the backend. Review

                        generated questions before saving.

                      </p>

                    </div>

                  </div>

                </div>

                <button

                  type="submit"

                  disabled={generating || saving || loadingSubjects}

                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60"

                >

                  {generating ? (

                    <>

                      <LoaderCircle

                        size={18}

                        className="animate-spin"

                      />

                      Generating Questions...

                    </>

                  ) : (

                    <>

                      <Sparkles size={18} />

                      Generate Questions

                      <ArrowRight size={17} />

                    </>

                  )}

                </button>

              </form>

            </section>

            <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">

                <div>

                  <h3 className="font-black">Question Preview</h3>

                  <p className="mt-1 text-xs text-slate-500">

                    Review and edit before saving.

                  </p>

                </div>

                {questions.length > 0 && (

                  <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">

                    {selectedQuestions.length} of {questions.length} selected

                  </span>

                )}

              </div>

              {questions.length === 0 ? (

                <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">

                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-100 text-violet-700">

                    <FileText size={36} />

                  </div>

                  <h4 className="mt-5 font-black text-slate-800">

                    Your questions will appear here

                  </h4>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">

                    Upload a PDF, select a subject and generate questions

                    for review.

                  </p>

                </div>

              ) : (

                <>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 p-4">

                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">

                      <input

                        type="checkbox"

                        checked={questions.every(

                          (question) => question.selected

                        )}

                        onChange={(event) =>

                          setQuestions((previous) =>

                            previous.map((question) => ({

                              ...question,

                              selected: event.target.checked,

                            }))

                          )

                        }

                        className="h-4 w-4 accent-violet-600"

                      />

                      Select all

                    </label>

                    <span className="text-xs text-slate-500">

                      {questions.length} questions

                    </span>

                  </div>

                  <div className="max-h-[1000px] space-y-4 overflow-y-auto p-4">

                    {questions.map((question, index) => (

                      <article

                        key={question.id}

                        className={`rounded-2xl border p-4 ${

                          question.selected

                            ? "border-violet-200 bg-white"

                            : "border-slate-200 bg-slate-50 opacity-75"

                        }`}

                      >

                        <div className="flex items-start gap-3">

                          <input

                            type="checkbox"

                            aria-label={`Select question ${index + 1}`}

                            checked={question.selected}

                            onChange={(event) =>

                              updateQuestion(

                                index,

                                "selected",

                                event.target.checked

                              )

                            }

                            className="mt-1 h-4 w-4 accent-violet-600"

                          />

                          <div className="min-w-0 flex-1">

                            <div className="flex flex-wrap items-center gap-2">

                              <span className="rounded-lg bg-violet-100 px-2 py-1 text-[10px] font-black text-violet-700">

                                Question {index + 1}

                              </span>

                              <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">

                                {question.question_type}

                              </span>

                              <span className="text-xs text-slate-500">

                                {question.difficulty} · {question.marks} mark(s)

                              </span>

                            </div>

                            {editingIndex === index ? (

                              <div className="mt-4 space-y-4">

                                <textarea

                                  value={question.question_text}

                                  onChange={(event) =>

                                    updateQuestion(

                                      index,

                                      "question_text",

                                      event.target.value

                                    )

                                  }

                                  rows={3}

                                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"

                                />

                                {question.question_type === "MCQ" && (

                                  <div className="space-y-2">

                                    {question.options.map(

                                      (option, optionIndex) => (

                                        <div

                                          key={optionIndex}

                                          className="flex items-center gap-2"

                                        >

                                          <input

                                            type="radio"

                                            name={`correct-${question.id}`}

                                            checked={option.is_correct}

                                            onChange={() =>

                                              updateOption(

                                                index,

                                                optionIndex,

                                                "is_correct",

                                                true

                                              )

                                            }

                                            aria-label="Correct answer"

                                          />

                                          <input

                                            value={option.option_text}

                                            onChange={(event) =>

                                              updateOption(

                                                index,

                                                optionIndex,

                                                "option_text",

                                                event.target.value

                                              )

                                            }

                                            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"

                                          />

                                          <button

                                            type="button"

                                            onClick={() =>

                                              removeOption(index, optionIndex)

                                            }

                                            aria-label="Remove option"

                                            className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"

                                          >

                                            <Trash2 size={15} />

                                          </button>

                                        </div>

                                      )

                                    )}

                                    <button

                                      type="button"

                                      onClick={() => addOption(index)}

                                      className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700"

                                    >

                                      + Add option

                                    </button>

                                  </div>

                                )}

                                <div>

                                  <label className="mb-1 block text-xs font-bold text-slate-600">

                                    Explanation

                                  </label>

                                  <textarea

                                    value={question.explanation}

                                    onChange={(event) =>

                                      updateQuestion(

                                        index,

                                        "explanation",

                                        event.target.value

                                      )

                                    }

                                    rows={2}

                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"

                                  />

                                </div>

                                <div className="grid grid-cols-2 gap-3">

                                  <select

                                    value={question.difficulty}

                                    onChange={(event) =>

                                      updateQuestion(

                                        index,

                                        "difficulty",

                                        event.target.value

                                      )

                                    }

                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"

                                  >

                                    <option value="EASY">Easy</option>

                                    <option value="MEDIUM">Medium</option>

                                    <option value="HARD">Hard</option>

                                  </select>

                                  <input

                                    type="number"

                                    min="0.5"

                                    step="0.5"

                                    value={question.marks}

                                    onChange={(event) =>

                                      updateQuestion(

                                        index,

                                        "marks",

                                        Number(event.target.value)

                                      )

                                    }

                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"

                                  />

                                </div>

                                <button

                                  type="button"

                                  onClick={() => setEditingIndex(null)}

                                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white"

                                >

                                  <Check size={14} className="mr-1 inline" />

                                  Done Editing

                                </button>

                              </div>

                            ) : (

                              <>

                                <p className="mt-3 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-800">

                                  {question.question_text}

                                </p>

                                {question.question_type === "MCQ" && (

                                  <div className="mt-4 space-y-2">

                                    {question.options.map(

                                      (option, optionIndex) => (

                                        <div

                                          key={optionIndex}

                                          className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${

                                            option.is_correct

                                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"

                                              : "border-slate-100 bg-slate-50 text-slate-600"

                                          }`}

                                        >

                                          <span className="font-bold">

                                            {String.fromCharCode(

                                              65 + optionIndex

                                            )}

                                            .

                                          </span>

                                          <span className="min-w-0 flex-1 break-words">

                                            {option.option_text}

                                          </span>

                                          {option.is_correct && (

                                            <CheckCircle2

                                              size={16}

                                              className="shrink-0 text-emerald-600"

                                            />

                                          )}

                                        </div>

                                      )

                                    )}

                                  </div>

                                )}

                                {question.explanation && (

                                  <div className="mt-3 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800">

                                    <strong>Explanation: </strong>

                                    {question.explanation}

                                  </div>

                                )}

                              </>

                            )}

                          </div>

                          <div className="flex shrink-0 flex-col gap-1">

                            <button

                              type="button"

                              onClick={() =>

                                setEditingIndex(

                                  editingIndex === index ? null : index

                                )

                              }

                              title="Edit question"

                              className="rounded-lg p-2 text-slate-500 hover:bg-violet-50 hover:text-violet-700"

                            >

                              {editingIndex === index ? (

                                <X size={17} />

                              ) : (

                                <FileText size={17} />

                              )}

                            </button>

                            <button

                              type="button"

                              onClick={() => deleteQuestion(index)}

                              title="Delete question"

                              className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"

                            >

                              <Trash2 size={17} />

                            </button>

                          </div>

                        </div>

                      </article>

                    ))}

                  </div>

                  <div className="sticky bottom-0 border-t border-slate-100 bg-white p-4">

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                      <p className="text-xs font-semibold text-slate-500">

                        {selectedQuestions.length} selected ·{" "}

                        {selectedQuestions.reduce(

                          (total, question) =>

                            total + Number(question.marks || 0),

                          0

                        )}{" "}

                        total marks

                      </p>

                      <button

                        type="button"

                        disabled={

                          saving || selectedQuestions.length === 0

                        }

                        onClick={() => setShowSaveConfirm(true)}

                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"

                      >

                        <Save size={17} />

                        Save to Question Bank

                      </button>

                    </div>

                  </div>

                </>

              )}

            </section>

          </div>

          <footer className="border-t border-slate-200 py-5 text-center text-xs text-slate-400">

            EduNexa · AI-assisted question creation · Review before publishing

          </footer>

        </div>

      </main>

      {showSaveConfirm && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">

              <Save size={25} />

            </div>

            <h3 className="mt-5 text-xl font-black text-slate-900">

              Save selected questions?

            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">

              {selectedQuestions.length} questions will be added to the

              Question Bank. Please verify their answers before saving.

            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">

              <button

                type="button"

                disabled={saving}

                onClick={() => setShowSaveConfirm(false)}

                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 disabled:opacity-50"

              >

                Cancel

              </button>

              <button

                type="button"

                disabled={saving}

                onClick={handleSaveQuestions}

                className="flex-1 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"

              >

                {saving ? (

                  <>

                    <LoaderCircle

                      size={16}

                      className="mr-2 inline animate-spin"

                    />

                    Saving...

                  </>

                ) : (

                  <>

                    <Check size={16} className="mr-2 inline" />

                    Confirm Save

                  </>

                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}