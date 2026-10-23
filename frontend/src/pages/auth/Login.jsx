import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Eye,
  EyeOff,
  FileQuestion,
  GraduationCap,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";


export default function Login() {
  const navigate = useNavigate();

  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);


  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const user = await login(
        username,
        password
      );

      if (user.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (user.role === "TEACHER") {
        navigate("/teacher/dashboard");
      } else if (user.role === "STUDENT") {
        navigate("/student/dashboard");
      }

    } catch (error) {
      setError(
        error.response?.data?.detail ||
        "Invalid username or password."
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen min-h-[100svh] bg-[#f6f8fc] relative overflow-x-hidden">

      {/* Background */}

      <div className="login-bg-orb login-orb-one" />

      <div className="login-bg-orb login-orb-two" />

      <div className="login-bg-orb login-orb-three" />


      {/* Top Navigation */}

      <header className="relative z-20 px-4 py-3 sm:px-8 sm:py-6">

        <div className="max-w-7xl mx-auto flex items-center justify-between">

          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 group"
          >

            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">

              <GraduationCap size={22} />

            </div>

            <div className="text-left">

              <p className="font-bold text-slate-900 leading-none">
                EduNexa
              </p>

              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 mt-1">
                Smart Education
              </p>

            </div>

          </button>


          <button
            onClick={() => navigate("/")}
            className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition"
          >

            <ArrowLeft size={16} />

            Back to Home

          </button>

        </div>

      </header>


      {/* Main */}

      <main className="relative z-10 flex items-center px-4 py-2 sm:px-8 sm:py-8 lg:min-h-[calc(100vh-96px)]">

        <div className="max-w-7xl w-full mx-auto">

          <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">


            {/* LEFT SIDE */}

            <section className="hidden lg:block">

              <div className="max-w-xl">

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-semibold text-indigo-600">

                  <Sparkles size={15} />

                  Welcome back to EduNexa

                </div>


                <h1 className="mt-7 text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.08] text-slate-900">

                  Your learning journey

                  <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">
                    starts here.
                  </span>

                </h1>


                <p className="mt-6 text-lg text-slate-500 leading-8 max-w-lg">

                  Access your personalized learning workspace,
                  online tests, notes, AI-powered questions and
                  performance insights.

                </p>


                {/* 3D Visual */}

                <div className="relative h-[350px] mt-8">

                  {/* Glow */}

                  <div className="absolute left-24 top-12 w-72 h-72 rounded-full bg-indigo-400/20 blur-3xl" />


                  {/* Main Card */}

                  <div className="login-3d-card absolute left-12 top-8 w-[390px] h-[250px] rounded-[30px] bg-white/85 backdrop-blur-xl border border-white shadow-[0_35px_80px_rgba(79,70,229,0.18)] p-6">

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="text-xs text-slate-400">
                          Learning Overview
                        </p>

                        <h3 className="text-2xl font-bold mt-1">
                          Your Progress
                        </h3>

                      </div>

                      <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Brain size={22} />
                      </div>

                    </div>


                    {/* Progress */}

                    <div className="mt-7">

                      <div className="flex justify-between text-sm mb-2">

                        <span className="text-slate-500">
                          Weekly progress
                        </span>

                        <span className="font-bold text-indigo-600">
                          82%
                        </span>

                      </div>

                      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">

                        <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-indigo-600 to-violet-500" />

                      </div>

                    </div>


                    {/* Stats */}

                    <div className="grid grid-cols-3 gap-3 mt-7">

                      <MiniStat
                        value="24"
                        label="Tests"
                      />

                      <MiniStat
                        value="186"
                        label="Questions"
                      />

                      <MiniStat
                        value="92%"
                        label="Score"
                      />

                    </div>

                  </div>


                  {/* Floating AI Card */}

                  <div className="login-floating-card login-float-one absolute right-0 top-2 w-48 p-4 bg-white rounded-2xl border border-slate-100 shadow-xl">

                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                        <FileQuestion size={19} />
                      </div>

                      <div>

                        <p className="text-[10px] text-slate-400">
                          AI Generated
                        </p>

                        <p className="font-bold text-sm">
                          120 MCQs
                        </p>

                      </div>

                    </div>

                  </div>


                  {/* Floating Security Card */}

                  <div className="login-floating-card login-float-two absolute left-0 bottom-3 w-48 p-4 bg-slate-900 rounded-2xl shadow-2xl text-white">

                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <ShieldCheck size={19} />
                      </div>

                      <div>

                        <p className="text-[10px] text-slate-400">
                          Secure Access
                        </p>

                        <p className="font-semibold text-sm">
                          Role Protected
                        </p>

                      </div>

                    </div>

                  </div>


                  {/* Floating Score Card */}

                  <div className="login-floating-card login-float-three absolute right-6 bottom-1 w-40 p-3 bg-white rounded-2xl shadow-xl border border-slate-100">

                    <div className="flex items-center gap-3">

                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
                        A+
                      </div>

                      <div>

                        <p className="text-[10px] text-slate-400">
                          Latest Test
                        </p>

                        <p className="font-bold text-sm">
                          94 / 100
                        </p>

                      </div>

                    </div>

                  </div>

                </div>


                {/* Bottom Features */}

                <div className="flex items-center gap-7 text-sm text-slate-500">

                  <div className="flex items-center gap-2">

                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      ✓
                    </div>

                    Secure

                  </div>


                  <div className="flex items-center gap-2">

                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      ✓
                    </div>

                    AI Powered

                  </div>


                  <div className="flex items-center gap-2">

                    <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                      ✓
                    </div>

                    Analytics

                  </div>

                </div>

              </div>

            </section>


            {/* LOGIN PANEL */}

            <section className="w-full max-w-md mx-auto lg:ml-auto">

              <div className="login-panel bg-white/80 backdrop-blur-2xl border border-white rounded-[24px] sm:rounded-[32px] shadow-[0_30px_90px_rgba(15,23,42,0.12)] p-5 sm:p-9">

                {/* Mobile Brand */}

                <div className="lg:hidden text-center mb-4 sm:mb-8">

                  <div className="inline-flex w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white items-center justify-center shadow-lg shadow-indigo-500/25">

                    <GraduationCap size={26} />

                  </div>

                  <h1 className="text-xl sm:text-2xl font-bold mt-2 sm:mt-3">
                    EduNexa
                  </h1>

                </div>


                <div className="mb-5 sm:mb-8">

                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 sm:mb-5">

                    <LockKeyhole size={21} />

                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                    Welcome back
                  </h2>

                  <p className="text-sm sm:text-base text-slate-500 mt-1.5 sm:mt-2 leading-5 sm:leading-6">
                    Sign in to continue to your EduNexa workspace.
                  </p>

                </div>


                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 sm:space-y-5"
                >

                  {/* Username */}

                  <div>

                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Username
                    </label>

                    <div className="relative">

                      <UserRound
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="text"
                        value={username}
                        onChange={(event) =>
                          setUsername(event.target.value)
                        }
                        placeholder="Enter your username"
                        required
                        autoComplete="username"
                        className="w-full h-12 sm:h-13 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/80 pl-11 pr-4 text-base text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                      />

                    </div>

                  </div>


                  {/* Password */}

                  <div>

                    <div className="flex items-center justify-between mb-2">

                      <label className="block text-sm font-semibold text-slate-700">
                        Password
                      </label>


                      <button
                         type="button"
                         onClick={() => navigate("/forgot-password")}
                         className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
                      >
                        Forgot Password?
                      </button>


                    </div>


                    <div className="relative">

                      <LockKeyhole
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        value={password}
                        onChange={(event) =>
                          setPassword(event.target.value)
                        }
                        placeholder="Enter your password"
                        required
                        autoComplete="current-password"
                        className="w-full h-12 sm:h-13 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/80 pl-11 pr-12 text-base text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                      />


                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition"
                      >

                        {showPassword ? (
                          <EyeOff size={19} />
                        ) : (
                          <Eye size={19} />
                        )}

                      </button>

                    </div>

                  </div>


                  {/* Error */}

                  {error && (

                    <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm text-red-600">

                      <span className="mt-0.5">
                        ⚠
                      </span>

                      <span>
                        {error}
                      </span>

                    </div>

                  )}


                  {/* Login Button */}

                  <button
                    type="submit"
                    disabled={loading}
                    className="login-button group relative w-full h-12 sm:h-13 rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 text-white font-bold shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed overflow-hidden"
                  >

                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                    <span className="relative flex items-center justify-center gap-2">

                      {loading
                        ? "Signing in..."
                        : "Sign In"}

                      {!loading && (
                        <ArrowRight
                          size={18}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      )}

                    </span>

                  </button>

                </form>


                {/* Security */}

                <div className="mt-4 pt-4 sm:mt-7 sm:pt-6 border-t border-slate-100">

                  <div className="flex items-center justify-center gap-2 text-xs text-slate-400">

                    <ShieldCheck size={15} />

                    Secure role-based authentication

                  </div>

                </div>

              </div>


              <p className="text-center text-xs text-slate-400 mt-3 sm:mt-5">
                Authorized EduNexa users only
              </p>

            </section>

          </div>

        </div>

      </main>

    </div>
  );
}


function MiniStat({
  value,
  label,
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">

      <p className="font-bold text-slate-900">
        {value}
      </p>

      <p className="text-[10px] text-slate-400 mt-1">
        {label}
      </p>

    </div>
  );
}