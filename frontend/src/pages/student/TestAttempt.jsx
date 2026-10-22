import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LoaderCircle,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

function getErrorMessage(error, fallback) {
  const data = error?.response?.data;

  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.error === "string") return data.error;

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([key, value]) => {
        const message = Array.isArray(value) ? value.join(", ") : String(value);
        return `${key}: ${message}`;
      })
      .join(" | ") || fallback;
  }

  if (error?.message === "Network Error") {
    return "Backend se connection nahi ho raha. Django server check karo.";
  }

  return fallback;
}

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.questions)) return data.questions;
  return [];
}

function formatTime(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remaining = safe % 60;

  return [hours, minutes, remaining]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export default function TestAttempt() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [error, setError] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const submittingRef = useRef(false);
  const answerQueueRef = useRef(Promise.resolve());

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion
    ? answers[currentQuestion.id]
    : null;

  const answeredCount = questions.filter((question) => {
    const answer = answers[question.id];

    return Boolean(
      answer?.selected_option_id ||
      answer?.written_answer?.trim()
    );
  }).length;

  const unansweredCount = Math.max(0, questions.length - answeredCount);

  const startAttempt = useCallback(async () => {
    setLoading(true);
    setError("");
    setAttempt(null);
    setQuestions([]);
    setAnswers({});
    setCurrentIndex(0);
    setRemainingSeconds(0);
    submittingRef.current = false;

    if (!testId || !Number.isFinite(Number(testId))) {
      setError("Invalid test ID.");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/testsystem/attempts/start/", {
        test_id: Number(testId),
      });

      const data = response.data;
      const attemptData = data?.attempt || data?.data?.attempt;
      const questionData = getList(data?.questions ?? data?.data?.questions);

      if (!attemptData?.id) {
        throw new Error(
          "The backend response did not contain a valid attempt ID. Check StartTestAttemptView response."
        );
      }

      setAttempt(attemptData);
      setQuestions(questionData);

      const seconds =
        data?.remaining_seconds ??
        attemptData?.remaining_seconds ??
        (Number(attemptData?.duration_minutes || 0) * 60);

      setRemainingSeconds(Math.max(0, Number(seconds) || 0));

      if (data?.answers && Array.isArray(data.answers)) {
        const savedAnswers = {};

        data.answers.forEach((item) => {
          const questionId = item.question_id ?? item.question;

          if (questionId) {
            savedAnswers[questionId] = {
              question_id: Number(questionId),
              selected_option_id:
                item.selected_option_id ?? item.selected_option ?? null,
              written_answer: item.written_answer || "",
            };
          }
        });

        setAnswers(savedAnswers);
      }
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to start this test.")
      );
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    startAttempt();
  }, [startAttempt]);

  const saveAnswer = useCallback(
    async (question, selectedOptionId = null, writtenAnswer = "") => {
      if (!attempt?.id || !question?.id || submittingRef.current) {
        return false;
      }

      const answerData = {
        question_id: Number(question.id),
        selected_option_id: selectedOptionId
          ? Number(selectedOptionId)
          : null,
        written_answer: writtenAnswer,
      };

      setAnswers((previous) => ({
        ...previous,
        [question.id]: answerData,
      }));

      setSavingAnswer(true);
      setError("");

      const saveOperation = answerQueueRef.current.then(async () => {
        await api.post(
          `/testsystem/attempts/${attempt.id}/answer/`,
          {
            question_id: answerData.question_id,
            selected_option: answerData.selected_option_id,
            selected_option_id: answerData.selected_option_id,
            written_answer: answerData.written_answer,
          }
        );
      });

      answerQueueRef.current = saveOperation.catch(() => {});

      try {
        await saveOperation;
        return true;
      } catch (err) {
        setError(getErrorMessage(err, "Unable to save answer."));
        return false;
      } finally {
        setSavingAnswer(false);
      }
    },
    [attempt]
  );

  const handleOptionSelect = (question, optionId) => {
    saveAnswer(question, optionId, "");
  };

  const handleWrittenAnswer = (question, value) => {
    setAnswers((previous) => ({
      ...previous,
      [question.id]: {
        question_id: Number(question.id),
        selected_option_id: null,
        written_answer: value,
      },
    }));
  };

  const submitWrittenAnswer = async (question) => {
    const answer = answers[question.id];

    await saveAnswer(question, null, answer?.written_answer || "");
  };

  const submitAttempt = useCallback(async () => {
    if (!attempt?.id || submittingRef.current) return;

    submittingRef.current = true;
    setSubmitting(true);
    setError("");

    try {
      await answerQueueRef.current;

      const response = await api.post(
        `/testsystem/attempts/${attempt.id}/submit/`
      );

      navigate("/student/results", {
        replace: true,
        state: { result: response.data },
      });
    } catch (err) {
      submittingRef.current = false;
      setSubmitting(false);
      setError(getErrorMessage(err, "Unable to submit test."));
    }
  }, [attempt, navigate]);

  useEffect(() => {
    if (!attempt || remainingSeconds <= 0 || submitting) return;

    const timer = setTimeout(() => {
      setRemainingSeconds((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [attempt, remainingSeconds, submitting]);

  useEffect(() => {
    if (
      attempt &&
      remainingSeconds === 0 &&
      attempt.status === "IN_PROGRESS" &&
      !submittingRef.current
    ) {
      submitAttempt();
    }
  }, [attempt, remainingSeconds, submitAttempt]);

  const goNext = () => {
    setCurrentIndex((index) =>
      Math.min(index + 1, questions.length - 1)
    );
  };

  const goPrevious = () => {
    setCurrentIndex((index) => Math.max(index - 1, 0));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoaderCircle
            size={40}
            className="mx-auto animate-spin text-indigo-600"
          />
          <p className="mt-4 text-sm font-medium text-slate-500">
            Preparing your test...
          </p>
        </div>
      </div>
    );
  }

  if (error && !attempt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-xl rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <AlertCircle size={28} />
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Unable to Start Test
          </h1>

          <p className="mt-3 break-words text-sm leading-6 text-red-600">
            {error}
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={startAttempt}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Try Again
            </button>

            <button
              type="button"
              onClick={() => navigate("/student/tests")}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Back to Tests
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <AlertCircle size={32} className="mx-auto text-amber-500" />
          <h1 className="mt-4 text-xl font-bold">No Questions Available</h1>
          <p className="mt-2 text-sm text-slate-500">
            This test has no questions or the backend did not return them.
          </p>
          <button
            type="button"
            onClick={() => navigate("/student/tests")}
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  const isLastQuestion = currentIndex === questions.length - 1;
  const timerDanger = remainingSeconds <= 300;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 font-bold text-white">
              E
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-slate-900 md:text-base">
                {attempt?.test_title || attempt?.test_name || "Test"}
              </h1>
              <p className="text-xs text-slate-400">
                EduNexa Assessment
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${
              timerDanger
                ? "bg-red-50 text-red-600"
                : "bg-indigo-50 text-indigo-600"
            }`}
          >
            <Clock3 size={17} />
            <span className="hidden sm:inline">Time Left</span>
            {formatTime(remainingSeconds)}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <ShieldCheck size={17} className="text-emerald-500" />
            <span className="text-xs font-medium text-slate-500">
              Secure Test
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] p-4 md:p-6">
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5 md:p-7">
              <p className="text-sm font-semibold text-indigo-600">
                Question {currentIndex + 1} of {questions.length}
              </p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-bold text-slate-900 md:text-2xl">
                  Answer the following question
                </h2>
                <span className="w-fit rounded-xl bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-500">
                  {currentQuestion.marks ?? 1} Marks
                </span>
              </div>
            </div>

            <div className="p-5 md:p-7">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600">
                  {currentQuestion.question_type || "Question"}
                </span>
                {currentQuestion.difficulty && (
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                    {currentQuestion.difficulty}
                  </span>
                )}
              </div>

              <p className="mt-7 whitespace-pre-wrap text-lg font-semibold leading-8 text-slate-800 md:text-xl">
                {currentQuestion.question_text || currentQuestion.text}
              </p>

              {currentQuestion.question_type === "MCQ" ? (
                <div className="mt-8 space-y-3">
                  {(currentQuestion.options || []).map((option, index) => {
                    const selected =
                      Number(currentAnswer?.selected_option_id) ===
                      Number(option.id);

                    return (
                      <button
                        type="button"
                        key={option.id}
                        onClick={() =>
                          handleOptionSelect(currentQuestion, option.id)
                        }
                        disabled={savingAnswer || submitting}
                        className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition disabled:opacity-70 ${
                          selected
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                            selected
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </span>

                        <span className="text-sm font-medium leading-6 text-slate-700">
                          {option.option_text || option.text}
                        </span>

                        {selected && (
                          <CheckCircle2
                            size={20}
                            className="ml-auto shrink-0 text-indigo-600"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-8">
                  <textarea
                    value={currentAnswer?.written_answer || ""}
                    onChange={(event) =>
                      handleWrittenAnswer(currentQuestion, event.target.value)
                    }
                    onBlur={() => submitWrittenAnswer(currentQuestion)}
                    rows={10}
                    disabled={submitting}
                    placeholder="Write your answer here..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    Your written answer is saved when you leave this field.
                  </p>
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  disabled={currentIndex === 0 || submitting}
                  onClick={() => {
                    if (currentQuestion.question_type !== "MCQ") {
                      submitWrittenAnswer(currentQuestion);
                    }
                    goPrevious();
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft size={17} />
                  Previous
                </button>

                <span className="text-center text-xs text-slate-400">
                  {savingAnswer ? "Saving answer..." : "Answer status updated"}
                </span>

                {!isLastQuestion ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (currentQuestion.question_type !== "MCQ") {
                        submitWrittenAnswer(currentQuestion);
                      }
                      goNext();
                    }}
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Next
                    <ChevronRight size={17} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Submit Test
                    <Send size={16} />
                  </button>
                )}
              </div>
            </div>
          </section>

          <aside className="h-fit space-y-5 lg:sticky lg:top-24">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">
                  Question Navigator
                </h3>
                <span className="text-xs text-slate-400">
                  {answeredCount}/{questions.length}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-5 gap-2">
                {questions.map((question, index) => {
                  const answer = answers[question.id];
                  const answered = Boolean(
                    answer?.selected_option_id ||
                    answer?.written_answer?.trim()
                  );

                  return (
                    <button
                      type="button"
                      key={question.id}
                      onClick={() => setCurrentIndex(index)}
                      className={`flex h-10 items-center justify-center rounded-xl text-xs font-bold ${
                        index === currentIndex
                          ? "bg-indigo-600 text-white"
                          : answered
                            ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                            : "bg-slate-100 text-slate-500 hover:bg-indigo-50"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <Legend color="bg-indigo-600" label="Current" />
                <Legend color="bg-emerald-100 ring-1 ring-emerald-200" label="Answered" />
                <Legend color="bg-slate-100" label="Not Answered" />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-slate-900">Test Progress</h3>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all"
                  style={{
                    width: `${
                      questions.length
                        ? (answeredCount / questions.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="mt-3 flex justify-between text-xs">
                <span className="text-slate-500">
                  {answeredCount} answered
                </span>
                <span className="font-semibold text-slate-700">
                  {unansweredCount} remaining
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                disabled={submitting}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                <Send size={17} />
                Submit Test
              </button>
            </div>
          </aside>
        </div>
      </main>

      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Send size={25} />
            </div>

            <h2 className="mt-5 text-center text-xl font-bold text-slate-900">
              Submit Test?
            </h2>

            <p className="mt-2 text-center text-sm leading-6 text-slate-500">
              You have answered <strong>{answeredCount}</strong> out of{" "}
              <strong>{questions.length}</strong> questions.
            </p>

            {unansweredCount > 0 && (
              <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-center text-sm font-medium text-amber-700">
                {unansweredCount} question
                {unansweredCount > 1 ? "s are" : " is"} still unanswered.
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 disabled:opacity-50"
              >
                Continue Test
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  if (currentQuestion.question_type !== "MCQ") {
                    const saved = await submitWrittenAnswer(currentQuestion);
                    if (!saved && error) return;
                  }

                  await submitAttempt();
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitting && (
                  <LoaderCircle size={16} className="animate-spin" />
                )}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <span className={`h-3 w-3 rounded ${color}`} />
      {label}
    </div>
  );
}