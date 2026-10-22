import { useCallback, useEffect, useState } from "react";

import {

  Search,

  RefreshCw,

  Trophy,

  Users,

  CheckCircle2,

  XCircle,

  ClipboardList,

  AlertCircle,

  Eye,

  X,

  CalendarDays,

  Target,

} from "lucide-react";

import TeacherSidebar from "../../components/teacher/TeacherSidebar";

import api from "../../services/api";

export default function Results() {

  const [results, setResults] = useState([]);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [selectedResult, setSelectedResult] = useState(null);

  const fetchResults = useCallback(async () => {

    setLoading(true);

    setError("");

    try {

      const params = {};

      if (search.trim()) params.search = search.trim();

      if (status) params.status = status;

      const response = await api.get("/results/teacher/", { params });

      const data = response.data;

      setResults(

        Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []

      );

    } catch (err) {

      setError(

        err.response?.data?.detail ||

          err.response?.data?.message ||

          "Unable to load results. Please try again."

      );

      setResults([]);

    } finally {

      setLoading(false);

    }

  }, [search, status]);

  useEffect(() => {

    fetchResults();

  }, [fetchResults]);

  const totalResults = results.length;

  const passedResults = results.filter((result) => result.status === "PASS").length;

  const failedResults = results.filter((result) => result.status === "FAIL").length;

  const averagePercentage = totalResults

    ? (

        results.reduce(

          (sum, result) => sum + (Number(result.percentage) || 0),

          0

        ) / totalResults

      ).toFixed(1)

    : "0.0";

  const formatDate = (date) => {

    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleString("en-IN", {

      dateStyle: "medium",

      timeStyle: "short",

    });

  };

  const getPercentage = (result) => Number(result.percentage) || 0;

  const statCards = [

    {

      title: "Total Results",

      value: totalResults,

      icon: ClipboardList,

      color: "blue",

    },

    {

      title: "Students Passed",

      value: passedResults,

      icon: CheckCircle2,

      color: "green",

    },

    {

      title: "Students Failed",

      value: failedResults,

      icon: XCircle,

      color: "red",

    },

    {

      title: "Average Score",

      value: `${averagePercentage}%`,

      icon: Trophy,

      color: "purple",

    },

  ];

  const colorClasses = {

    blue: "bg-blue-50 text-blue-600 ",

    green: "bg-emerald-50 text-emerald-600 ",

    red: "bg-red-50 text-red-600 ",

    purple: "bg-purple-50 text-purple-600 ",

  };

  return (

    <div className="min-h-screen bg-slate-50 text-slate-800 ">

      <TeacherSidebar />

      <main className="min-w-0 p-4 sm:p-6 lg:p-8">

        <div className="mx-auto max-w-7xl">

          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>

              <p className="mb-2 text-sm font-semibold text-blue-600 ">

                TEACHER PORTAL

              </p>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">

                Student Results

              </h1>

              <p className="mt-2 text-sm text-slate-500 ">

                Review student performance in tests created by you.

              </p>

            </div>

            <button

              onClick={fetchResults}

              disabled={loading}

              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm transition hover:bg-slate-100 disabled:opacity-60 "

            >

              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />

              Refresh

            </button>

          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {statCards.map((card) => {

              const Icon = card.icon;

              return (

                <div

                  key={card.title}

                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md "

                >

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-sm text-slate-500 ">

                        {card.title}

                      </p>

                      <h2 className="mt-3 text-2xl font-bold">{card.value}</h2>

                    </div>

                    <div className={`rounded-xl p-3 ${colorClasses[card.color]}`}>

                      <Icon size={23} />

                    </div>

                  </div>

                </div>

              );

            })}

          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ">

            <div className="border-b border-slate-200 p-5 sm:p-6">

              <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">

                <div>

                  <h2 className="text-lg font-bold">Results Overview</h2>

                  <p className="mt-1 text-sm text-slate-500 ">

                    Search and review submitted test results.

                  </p>

                </div>

                <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 ">

                  {totalResults} results

                </span>

              </div>

              <div className="flex flex-col gap-3 md:flex-row">

                <div className="relative flex-1">

                  <Search

                    size={18}

                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"

                  />

                  <input

                    type="text"

                    value={search}

                    onChange={(event) => setSearch(event.target.value)}

                    placeholder="Search student or test..."

                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 "

                  />

                </div>

                <select

                  value={status}

                  onChange={(event) => setStatus(event.target.value)}

                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 "

                >

                  <option value="">All statuses</option>

                  <option value="PASS">Passed</option>

                  <option value="FAIL">Failed</option>

                </select>

              </div>

            </div>

            {error && (

              <div className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 ">

                <AlertCircle size={19} className="mt-0.5 shrink-0" />

                <div className="flex-1">{error}</div>

                <button

                  onClick={fetchResults}

                  className="font-semibold underline"

                >

                  Retry

                </button>

              </div>

            )}

            {loading ? (

              <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8">

                <RefreshCw size={28} className="animate-spin text-blue-600" />

                <p className="text-sm text-slate-500">Loading results...</p>

              </div>

            ) : !error && results.length === 0 ? (

              <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">

                <div className="mb-4 rounded-2xl bg-slate-100 p-4 ">

                  <Users size={32} className="text-slate-400" />

                </div>

                <h3 className="text-lg font-semibold">No results found</h3>

                <p className="mt-2 max-w-sm text-sm text-slate-500 ">

                  Results will appear here after students submit tests you have

                  created. Try changing your search or status filter.

                </p>

                {(search || status) && (

                  <button

                    onClick={() => {

                      setSearch("");

                      setStatus("");

                    }}

                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"

                  >

                    Clear filters

                  </button>

                )}

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full min-w-[850px] text-left">

                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 ">

                    <tr>

                      <th className="px-6 py-4 font-semibold">Student</th>

                      <th className="px-6 py-4 font-semibold">Test</th>

                      <th className="px-6 py-4 font-semibold">Score</th>

                      <th className="px-6 py-4 font-semibold">Percentage</th>

                      <th className="px-6 py-4 font-semibold">Status</th>

                      <th className="px-6 py-4 font-semibold">Submitted</th>

                      <th className="px-6 py-4 text-right font-semibold">Action</th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100 ">

                    {results.map((result) => (

                      <tr

                        key={result.id}

                        className="transition hover:bg-slate-50/80 "

                      >

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-600 ">

                              {(result.student_name || "S")

                                .trim()

                                .charAt(0)

                                .toUpperCase()}

                            </div>

                            <div>

                              <p className="font-semibold">

                                {result.student_name || `Student #${result.student}`}

                              </p>

                              <p className="mt-1 text-xs text-slate-500">

                                ID: {result.student ?? "—"}

                              </p>

                            </div>

                          </div>

                        </td>

                        <td className="px-6 py-4">

                          <p className="max-w-48 truncate text-sm font-medium">

                            {result.test_title || `Test #${result.test}`}

                          </p>

                          <p className="mt-1 text-xs text-slate-500">

                            Test ID: {result.test ?? "—"}

                          </p>

                        </td>

                        <td className="px-6 py-4">

                          <span className="font-semibold">

                            {result.obtained_marks ?? 0}

                          </span>

                          <span className="text-slate-500">

                            {" "}/ {result.total_marks ?? 0}

                          </span>

                        </td>

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-3">

                            <span className="w-12 font-semibold">

                              {getPercentage(result).toFixed(1)}%

                            </span>

                            <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100 ">

                              <div

                                className={`h-full rounded-full ${

                                  getPercentage(result) >= 50

                                    ? "bg-emerald-500"

                                    : "bg-red-500"

                                }`}

                                style={{

                                  width: `${Math.min(

                                    100,

                                    Math.max(0, getPercentage(result))

                                  )}%`,

                                }}

                              />

                            </div>

                          </div>

                        </td>

                        <td className="px-6 py-4">

                          <span

                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${

                              result.status === "PASS"

                                ? "bg-emerald-50 text-emerald-700 "

                                : "bg-red-50 text-red-700 "

                            }`}

                          >

                            {result.status === "PASS" ? (

                              <CheckCircle2 size={14} />

                            ) : (

                              <XCircle size={14} />

                            )}

                            {result.status || "UNKNOWN"}

                          </span>

                        </td>

                        <td className="px-6 py-4 text-sm text-slate-500 ">

                          {formatDate(result.submitted_at)}

                        </td>

                        <td className="px-6 py-4 text-right">

                          <button

                            onClick={() => setSelectedResult(result)}

                            title="View result details"

                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 "

                          >

                            <Eye size={16} />

                            Details

                          </button>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            )}

            {!loading && results.length > 0 && (

              <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500 sm:px-6">

                Showing {results.length} returned result

                {results.length !== 1 ? "s" : ""}.

              </div>

            )}

          </section>

        </div>

      </main>

      {selectedResult && (

        <div

          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"

          onClick={(event) => {

            if (event.target === event.currentTarget) {

              setSelectedResult(null);

            }

          }}

        >

          <section

            role="dialog"

            aria-modal="true"

            aria-labelledby="result-detail-title"

            className="my-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl "

          >

            <div className="flex items-start justify-between border-b border-slate-200 p-5 sm:p-6">

              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 ">

                  Result Details

                </p>

                <h2

                  id="result-detail-title"

                  className="mt-2 text-xl font-bold"

                >

                  {selectedResult.student_name ||

                    `Student #${selectedResult.student}`}

                </h2>

                <p className="mt-1 text-sm text-slate-500">

                  {selectedResult.test_title || `Test #${selectedResult.test}`}

                </p>

              </div>

              <button

                onClick={() => setSelectedResult(null)}

                aria-label="Close result details"

                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 "

              >

                <X size={20} />

              </button>

            </div>

            <div className="p-5 sm:p-6">

              <div className="rounded-2xl bg-slate-50 p-5 text-center ">

                <p className="text-sm text-slate-500 ">

                  Overall Score

                </p>

                <p className="mt-2 text-4xl font-bold">

                  {getPercentage(selectedResult).toFixed(1)}%

                </p>

                <p className="mt-2 text-sm text-slate-500">

                  {selectedResult.obtained_marks ?? 0} out of{" "}

                  {selectedResult.total_marks ?? 0} marks

                </p>

                <span

                  className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${

                    selectedResult.status === "PASS"

                      ? "bg-emerald-100 text-emerald-700 "

                      : "bg-red-100 text-red-700 "

                  }`}

                >

                  {selectedResult.status || "UNKNOWN"}

                </span>

              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">

                <DetailCard

                  icon={<CheckCircle2 size={18} />}

                  label="Correct Answers"

                  value={selectedResult.correct_answers ?? 0}

                  color="text-emerald-600"

                />

                <DetailCard

                  icon={<XCircle size={18} />}

                  label="Wrong Answers"

                  value={selectedResult.wrong_answers ?? 0}

                  color="text-red-600"

                />

                <DetailCard

                  icon={<ClipboardList size={18} />}

                  label="Unanswered"

                  value={selectedResult.unanswered ?? 0}

                  color="text-amber-600"

                />

                <DetailCard

                  icon={<Target size={18} />}

                  label="Passing Score"

                  value={`${selectedResult.passing_percentage ?? 0}%`}

                  color="text-blue-600"

                />

              </div>

              <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 p-4 ">

                <CalendarDays

                  size={20}

                  className="shrink-0 text-slate-400"

                />

                <div>

                  <p className="text-xs text-slate-500">Submitted At</p>

                  <p className="mt-1 text-sm font-semibold">

                    {formatDate(selectedResult.submitted_at)}

                  </p>

                </div>

              </div>

              <button

                onClick={() => setSelectedResult(null)}

                className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"

              >

                Close Details

              </button>

            </div>

          </section>

        </div>

      )}

    </div>

  );

}

function DetailCard({ icon, label, value, color }) {

  return (

    <div className="rounded-xl border border-slate-200 p-4 ">

      <div className={`mb-3 ${color}`}>{icon}</div>

      <p className="text-xs text-slate-500 ">{label}</p>

      <p className="mt-1 text-xl font-bold">{value}</p>

    </div>

  );

}