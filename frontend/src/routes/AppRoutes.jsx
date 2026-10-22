import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Landing from "../pages/Landing";
import Login from "../pages/auth/Login";

import AdminDashboard from "../pages/admin/Dashboard";
import Teachers from "../pages/admin/Teachers";
import Students from "../pages/admin/Students";
import Subjects from "../pages/admin/Subjects";
import QuestionBank from "../pages/admin/QuestionBank";
import Tests from "../pages/admin/Tests";

import TeacherDashboard from "../pages/teacher/Dashboard";
import StudentDashboard from "../pages/student/Dashboard";

import { useAuth } from "../context/AuthContext";
import TestAttempt from "../pages/student/TestAttempt";

import StudentSubjects from "../pages/student/Subjects";

import StudentNotes from "../pages/student/Notes";

import AdminNotes from "../pages/admin/Notes";

import StudentTests from "../pages/student/Tests";

import StudentResults from "../pages/student/Results";

import TeacherTests from "../pages/teacher/Tests";

import TeacherStudents from "../pages/teacher/Students";

import TeacherQuestionBank from "../pages/teacher/QuestionBank";

import TeacherNotes from "../pages/teacher/Notes";
import Results from "../pages/teacher/Results";

import AIQuestionGenerator from "../pages/admin/AIQuestionGenerator";

import ForgotPassword from "../pages/auth/ForgotPassword";

import ResetPassword from "../pages/auth/ResetPassword";






function ProtectedRoute({
  children,
  allowedRoles,
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const userRole = String(
    user?.role || ""
  ).toUpperCase();

  const normalizedRoles = (
    allowedRoles || []
  ).map((role) =>
    String(role).toUpperCase()
  );

  if (
    normalizedRoles.length > 0 &&
    !normalizedRoles.includes(userRole)
  ) {
    if (userRole === "ADMIN") {
      return (
        <Navigate
          to="/admin/dashboard"
          replace
        />
      );
    }

    if (userRole === "TEACHER") {
      return (
        <Navigate
          to="/teacher/dashboard"
          replace
        />
      );
    }

    if (userRole === "STUDENT") {
      return (
        <Navigate
          to="/student/dashboard"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

function ComingSoon({ title }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
          🚀
        </div>

        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          {title}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          This module is coming soon.
        </p>

        <button
          type="button"
          onClick={() =>
            window.history.back()
          }
          className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

function RoleRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const role = String(
    user?.role || ""
  ).toUpperCase();

  if (role === "ADMIN") {
    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    );
  }

  if (role === "TEACHER") {
    return (
      <Navigate
        to="/teacher/dashboard"
        replace
      />
    );
  }

  if (role === "STUDENT") {
    return (
      <Navigate
        to="/student/dashboard"
        replace
      />
    );
  }

  return (
    <Navigate
      to="/login"
      replace
    />
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Landing />}
        />

        <Route
          path="/landing"
          element={<Landing />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
  path="/forgot-password"
  element={<ForgotPassword />}
/>

<Route
  path="/reset-password/:uid/:token"
  element={<ResetPassword />}
/>

        <Route
          path="/dashboard"
          element={<RoleRedirect />}
        />

        {/* =========================
            ADMIN
        ========================= */}

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN"]}
            >
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/teachers"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN"]}
            >
              <Teachers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/students"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN"]}
            >
              <Students />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/subjects"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN"]}
            >
              <Subjects />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/question-bank"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "TEACHER",
              ]}
            >
              <QuestionBank />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/tests"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN"]}
            >
              <Tests />
            </ProtectedRoute>
          }
        />

       <Route
  path="/admin/ai-question-generator"
  element={
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AIQuestionGenerator />
    </ProtectedRoute>
  }
/>

        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN"]}
            >
              <ComingSoon
                title="Settings"
              />
            </ProtectedRoute>
          }
        />

        <Route
  path="/admin/notes"
  element={
    <ProtectedRoute allowedRoles={["ADMIN", "TEACHER"]}>
      <AdminNotes />
    </ProtectedRoute>
  }
/>


<Route
  path="/ai-question-generator"
  element={
    <ProtectedRoute allowedRoles={["ADMIN", "TEACHER"]}>
      <AIQuestionGenerator />
    </ProtectedRoute>
  }
/>

        {/* =========================
            TEACHER
        ========================= */}

        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={["TEACHER"]}
            >
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />


<Route
  path="/teacher/subjects"
  element={
    <ProtectedRoute allowedRoles={["TEACHER"]}>
      <Subjects />
    </ProtectedRoute>
  }
/>


<Route
  path="/teacher/tests"
  element={
    <ProtectedRoute allowedRoles={["TEACHER"]}>
      <TeacherTests />
    </ProtectedRoute>
  }
/>

<Route path="/teacher/notes" element={<TeacherNotes />} />

<Route
  path="/teacher/results"
  element={
    <ProtectedRoute allowedRoles={["TEACHER"]}>
      <Results />
    </ProtectedRoute>
  }
/>



<Route
  path="/teacher/ai-question-generator"
  element={
    <ProtectedRoute allowedRoles={["ADMIN", "TEACHER"]}>
      <AIQuestionGenerator />
    </ProtectedRoute>
  }
/>

<Route
  path="/teacher/ai-question-generator"
  element={
    <ProtectedRoute allowedRoles={["ADMIN", "TEACHER"]}>
      <AIQuestionGenerator />
    </ProtectedRoute>
  }
/>

<Route
  path="/teacher/settings"
  element={
    <ProtectedRoute allowedRoles={["TEACHER"]}>
      <ComingSoon title="Teacher Settings" />
    </ProtectedRoute>
  }
/>


<Route
  path="/teacher/students"
  element={
    <ProtectedRoute allowedRoles={["TEACHER"]}>
      <TeacherStudents />
    </ProtectedRoute>
  }
/>

<Route
  path="/teacher/question-bank"
  element={
    <ProtectedRoute allowedRoles={["TEACHER"]}>
      <TeacherQuestionBank />
    </ProtectedRoute>
  }
/>



        {/* =========================
            STUDENT
        ========================= */}

        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={["STUDENT"]}
            >
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
  path="/student/subjects"
  element={
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <StudentSubjects />
    </ProtectedRoute>
  }
/>

        <Route
  path="/student/test/:testId"
  element={
    <ProtectedRoute
      allowedRoles={["STUDENT"]}
    >
      <TestAttempt />
    </ProtectedRoute>
  }
/>

<Route path="/student/notes" element={<StudentNotes />} />

<Route
  path="/student/tests"
  element={
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <StudentTests />
    </ProtectedRoute>
  }
/>

<Route
  path="/student/results"
  element={
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <StudentResults />
    </ProtectedRoute>
  }
/>

        {/* =========================
            FALLBACK
        ========================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}