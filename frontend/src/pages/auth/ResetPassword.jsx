import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, LockKeyhole } from "lucide-react";
import api from "../../services/api";

export default function ResetPassword() {
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        "/auth/password-reset/confirm/",
        {
          uid,
          token,
          new_password: password,
          confirm_password: confirmPassword,
        }
      );

      setMessage(
        response.data.detail ||
          "Password reset successful. You can now sign in."
      );

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      const data = err.response?.data;

      if (data?.new_password) {
        setError(
          Array.isArray(data.new_password)
            ? data.new_password.join(" ")
            : data.new_password
        );
      } else if (data?.confirm_password) {
        setError(
          Array.isArray(data.confirm_password)
            ? data.confirm_password.join(" ")
            : data.confirm_password
        );
      } else if (data?.detail) {
        setError(data.detail);
      } else {
        setError(
          "This reset link is invalid or expired. Please request a new one."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <LockKeyhole size={26} />
        </div>

        <h1 className="text-3xl font-bold text-slate-900">
          Reset password
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Create a new password for your EduNexa account.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              New password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Confirm new password
            </label>

            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              autoComplete="new-password"
              minLength={8}
              required
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          {message && (
            <div
              role="status"
              className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
            >
              <CheckCircle2 size={18} className="shrink-0" />
              {message}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !uid || !token}
            className="h-12 w-full rounded-xl bg-indigo-600 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Updating password..." : "Update password"}
          </button>
        </form>

        <Link
          to="/login"
          className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>
      </section>
    </main>
  );
}