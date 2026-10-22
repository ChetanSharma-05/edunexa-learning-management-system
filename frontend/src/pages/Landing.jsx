import {
  ArrowRight,
  Brain,
  BookOpen,
  FileQuestion,
  BarChart3,
  Sparkles,
  CheckCircle2,
  Play,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";

import { useNavigate } from "react-router-dom";


export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 overflow-hidden">

      {/* Navbar */}

      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">

        <div className="max-w-7xl mx-auto px-5 sm:px-8">

          <div className="h-20 flex items-center justify-between">

            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate("/")}
            >

              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                <GraduationCap size={23} />
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  EduNexa
                </h1>

                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  Smart Education
                </p>
              </div>

            </div>


            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">

              <a
                href="#features"
                className="hover:text-indigo-600 transition"
              >
                Features
              </a>

              <a
                href="#ai"
                className="hover:text-indigo-600 transition"
              >
                AI Question Generator
              </a>

              <a
                href="#how"
                className="hover:text-indigo-600 transition"
              >
                How It Works
              </a>

            </div>


            <button
              onClick={() => navigate("/login")}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-indigo-600 transition-all duration-300 shadow-lg shadow-slate-900/10"
            >
              Login

              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>

          </div>

        </div>

      </nav>


      {/* Hero */}

      <section className="relative pt-36 pb-20 lg:pt-44 lg:pb-28">

        {/* Background */}

        <div className="absolute inset-0 pointer-events-none">

          <div className="absolute top-20 left-[8%] w-72 h-72 bg-indigo-300/20 rounded-full blur-3xl" />

          <div className="absolute top-32 right-[5%] w-80 h-80 bg-violet-300/20 rounded-full blur-3xl" />

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-cyan-200/20 rounded-full blur-3xl" />

        </div>


        <div className="relative max-w-7xl mx-auto px-5 sm:px-8">

          <div className="grid lg:grid-cols-2 gap-14 items-center">


            {/* Left */}

            <div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-100 bg-indigo-50 text-indigo-700 text-sm font-medium mb-7">

                <Sparkles size={15} />

                Smart Learning Platform

              </div>


              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">

                Learn smarter.

                <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">
                  Test better.
                </span>

              </h1>


              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-500">

                EduNexa brings tests, notes, question banks,
                performance analytics and AI-powered question
                generation into one powerful learning platform.

              </p>


              <div className="mt-9 flex flex-col sm:flex-row gap-4">

                <button
                  onClick={() => navigate("/login")}
                  className="group h-13 px-7 rounded-2xl bg-indigo-600 text-white font-semibold flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/25 hover:bg-indigo-700 hover:-translate-y-1 transition-all duration-300"
                >

                  Get Started

                  <ArrowRight
                    size={19}
                    className="group-hover:translate-x-1 transition-transform"
                  />

                </button>


                <a
                  href="#features"
                  className="h-13 px-7 rounded-2xl border border-slate-200 bg-white text-slate-700 font-semibold flex items-center justify-center gap-3 hover:border-indigo-200 hover:text-indigo-600 hover:-translate-y-1 transition-all duration-300"
                >

                  <Play size={17} />

                  Explore Features

                </a>

              </div>


              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">

                <div className="flex items-center gap-2">
                  <CheckCircle2
                    size={17}
                    className="text-emerald-500"
                  />
                  Role-based access
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2
                    size={17}
                    className="text-emerald-500"
                  />
                  AI-powered tools
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2
                    size={17}
                    className="text-emerald-500"
                  />
                  Performance analytics
                </div>

              </div>

            </div>


            {/* 3D Hero Visual */}

            <div className="relative h-[520px] hidden sm:block">

              <div className="absolute inset-0 flex items-center justify-center">

                {/* Glow */}

                <div className="absolute w-80 h-80 rounded-full bg-indigo-400/20 blur-3xl" />


                {/* Main 3D Card */}

                <div className="hero-3d-card relative w-[360px] h-[430px] rounded-[32px] border border-white bg-white/80 backdrop-blur-xl shadow-[0_35px_80px_rgba(79,70,229,0.18)] p-6">

                  <div className="flex items-center justify-between mb-7">

                    <div>

                      <p className="text-xs text-slate-400">
                        Today's Progress
                      </p>

                      <h3 className="text-2xl font-bold mt-1">
                        82%
                      </h3>

                    </div>

                    <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <BarChart3 size={22} />
                    </div>

                  </div>


                  {/* Fake graph */}

                  <div className="h-40 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 p-5 relative overflow-hidden">

                    <div className="absolute left-5 right-5 bottom-8 h-px bg-indigo-100" />

                    <div className="absolute left-5 right-5 bottom-16 h-px bg-indigo-100" />

                    <svg
                      viewBox="0 0 300 120"
                      className="absolute inset-4 w-[calc(100%-32px)] h-[calc(100%-32px)]"
                    >

                      <path
                        d="M0 100 C30 80 40 90 65 65 C90 40 105 70 130 52 C155 35 175 60 195 35 C220 8 240 40 260 20 C275 8 290 14 300 2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="text-indigo-600"
                      />

                    </svg>

                  </div>


                  <div className="mt-6 space-y-3">

                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">

                      <div className="flex items-center gap-3">

                        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                          <BookOpen size={18} />
                        </div>

                        <div>
                          <p className="text-sm font-semibold">
                            Mathematics
                          </p>

                          <p className="text-xs text-slate-400">
                            24 questions
                          </p>
                        </div>

                      </div>

                      <span className="text-sm font-bold text-emerald-500">
                        92%
                      </span>

                    </div>


                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">

                      <div className="flex items-center gap-3">

                        <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                          <Brain size={18} />
                        </div>

                        <div>
                          <p className="text-sm font-semibold">
                            AI Practice
                          </p>

                          <p className="text-xs text-slate-400">
                            18 questions
                          </p>
                        </div>

                      </div>

                      <span className="text-sm font-bold text-indigo-600">
                        Active
                      </span>

                    </div>

                  </div>

                </div>


                {/* Floating Card 1 */}

                <div className="floating-card floating-one absolute top-8 right-0 w-44 p-4 bg-white rounded-2xl shadow-xl border border-slate-100">

                  <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 size={20} />
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Test Result
                      </p>

                      <p className="font-bold">
                        94 / 100
                      </p>
                    </div>

                  </div>

                </div>


                {/* Floating Card 2 */}

                <div className="floating-card floating-two absolute bottom-10 left-0 w-48 p-4 bg-white rounded-2xl shadow-xl border border-slate-100">

                  <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                      <FileQuestion size={20} />
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        AI Generated
                      </p>

                      <p className="font-bold">
                        120 MCQs
                      </p>
                    </div>

                  </div>

                </div>


                {/* Floating Card 3 */}

                <div className="floating-card floating-three absolute bottom-24 right-3 w-40 p-3 bg-slate-900 text-white rounded-2xl shadow-2xl">

                  <div className="flex items-center gap-3">

                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                      <Sparkles size={17} />
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400">
                        AI Powered
                      </p>

                      <p className="text-sm font-semibold">
                        PDF → MCQ
                      </p>
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* Feature Strip */}

      <section
        id="features"
        className="py-20 bg-white border-y border-slate-100"
      >

        <div className="max-w-7xl mx-auto px-5 sm:px-8">

          <div className="max-w-2xl mb-12">

            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
              Everything you need
            </p>

            <h2 className="text-3xl sm:text-4xl font-bold mt-3">
              One platform for smarter education
            </h2>

            <p className="text-slate-500 mt-4 leading-7">
              From creating questions to analyzing student
              performance, EduNexa connects the complete
              learning workflow.
            </p>

          </div>


          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">

            <FeatureCard
              icon={<BookOpen />}
              title="Smart Notes"
              text="Organize and share subject-wise learning material."
            />

            <FeatureCard
              icon={<FileQuestion />}
              title="Online Tests"
              text="Create engaging MCQ tests with automated evaluation."
            />

            <FeatureCard
              icon={<Brain />}
              title="AI Question Builder"
              text="Turn PDF study material into structured MCQs automatically."
            />

            <FeatureCard
              icon={<BarChart3 />}
              title="Analytics"
              text="Understand performance with powerful visual insights."
            />

          </div>

        </div>

      </section>


      {/* AI Section */}

      <section
        id="ai"
        className="py-24 bg-slate-50"
      >

        <div className="max-w-7xl mx-auto px-5 sm:px-8">

          <div className="grid lg:grid-cols-2 gap-14 items-center">

            <div>

              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 text-violet-700 text-sm font-semibold">
                <Sparkles size={16} />
                AI Powered
              </div>

              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mt-5">
                Turn your PDFs into
                <span className="text-indigo-600">
                  {" "}MCQs
                </span>
                {" "}in minutes.
              </h2>

              <p className="text-slate-500 leading-8 mt-5 max-w-xl">
                Teachers can upload question material and
                EduNexa can extract the content, generate
                questions and prepare them for review before
                adding them to the question bank.
              </p>


              <div className="mt-7 space-y-4">

                <Step
                  number="01"
                  title="Upload PDF"
                  text="Upload your study or question material."
                />

                <Step
                  number="02"
                  title="AI Processing"
                  text="EduNexa extracts and structures the content."
                />

                <Step
                  number="03"
                  title="Review & Publish"
                  text="Teacher reviews generated questions before publishing."
                />

              </div>

            </div>


            <div className="relative">

              <div className="ai-preview-card rounded-[32px] bg-white border border-slate-200 shadow-2xl p-6">

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div className="w-11 h-11 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                      <FileQuestion size={21} />
                    </div>

                    <div>
                      <p className="font-bold">
                        Generated Question
                      </p>

                      <p className="text-xs text-slate-400">
                        AI Question Builder
                      </p>
                    </div>

                  </div>

                  <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold">
                    Ready
                  </span>

                </div>


                <div className="mt-7">

                  <p className="font-semibold leading-7">
                    Which of the following is a
                    programming language?
                  </p>

                  <div className="mt-5 space-y-3">

                    <Option text="HTML" />

                    <Option
                      text="Python"
                      active
                    />

                    <Option text="CSS" />

                    <Option text="SQL" />

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* How it works */}

      <section
        id="how"
        className="py-24 bg-white"
      >

        <div className="max-w-7xl mx-auto px-5 sm:px-8 text-center">

          <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
            Simple workflow
          </p>

          <h2 className="text-4xl font-bold mt-3">
            Built for every role
          </h2>

          <p className="max-w-2xl mx-auto text-slate-500 mt-4">
            EduNexa gives administrators, teachers and
            students the tools they need without unnecessary
            complexity.
          </p>


          <div className="grid md:grid-cols-3 gap-6 mt-14">

            <RoleCard
              number="01"
              title="Admin"
              text="Manage teachers, students, subjects, tests and the complete platform."
            />

            <RoleCard
              number="02"
              title="Teacher"
              text="Create students, tests, notes and generate questions with AI."
            />

            <RoleCard
              number="03"
              title="Student"
              text="Study notes, attempt tests and track performance."
            />

          </div>

        </div>

      </section>


      {/* CTA */}

      <section className="py-24 bg-slate-950 text-white">

        <div className="max-w-5xl mx-auto px-5 text-center">

          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-600/30">

            <ShieldCheck size={28} />

          </div>

          <h2 className="text-4xl sm:text-5xl font-bold mt-7">
            Ready to make learning smarter?
          </h2>

          <p className="text-slate-400 max-w-xl mx-auto mt-5 leading-7">
            Enter the EduNexa platform and manage your
            learning experience from one intelligent workspace.
          </p>

          <button
            onClick={() => navigate("/login")}
            className="mt-8 px-7 py-3.5 rounded-2xl bg-white text-slate-900 font-bold hover:bg-indigo-50 hover:-translate-y-1 transition-all duration-300"
          >
            Go to Login
          </button>

        </div>

      </section>


      {/* Footer */}

      <footer className="bg-slate-950 border-t border-white/10 py-8">

        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">

          <div className="flex items-center gap-2 text-white font-semibold">

            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <GraduationCap size={17} />
            </div>

            EduNexa

          </div>

          <p className="text-sm text-slate-500">
            Smart Learning. Smarter Testing.
          </p>

        </div>

      </footer>

    </div>
  );
}


function FeatureCard({
  icon,
  title,
  text,
}) {
  return (
    <div className="group p-6 rounded-3xl border border-slate-200 bg-white hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500">

      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
        {icon}
      </div>

      <h3 className="font-bold text-lg mt-5">
        {title}
      </h3>

      <p className="text-sm text-slate-500 leading-6 mt-2">
        {text}
      </p>

    </div>
  );
}


function Step({
  number,
  title,
  text,
}) {
  return (
    <div className="flex gap-4">

      <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
        {number}
      </div>

      <div>

        <h3 className="font-bold">
          {title}
        </h3>

        <p className="text-sm text-slate-500 mt-1">
          {text}
        </p>

      </div>

    </div>
  );
}


function Option({
  text,
  active = false,
}) {
  return (
    <div
      className={`p-3.5 rounded-xl border text-sm font-medium ${
        active
          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
          : "border-slate-200 text-slate-600"
      }`}
    >
      {text}
    </div>
  );
}


function RoleCard({
  number,
  title,
  text,
}) {
  return (
    <div className="group p-8 rounded-3xl border border-slate-200 bg-white text-left hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500">

      <span className="text-sm font-bold text-indigo-600">
        {number}
      </span>

      <h3 className="text-2xl font-bold mt-4">
        {title}
      </h3>

      <p className="text-slate-500 leading-7 mt-3">
        {text}
      </p>

    </div>
  );
}