
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  BookOpen,
  ChevronRight,
  FileQuestion,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navigation = [
  {
    title: "MAIN MENU",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/teacher/dashboard",
      },
      {
        label: "My Students",
        icon: Users,
        path: "/teacher/students",
      },
      {
        label: "Tests",
        icon: FileQuestion,
        path: "/teacher/tests",
      },
      {
        label: "Question Bank",
        icon: Activity,
        path: "/teacher/question-bank",
      },
      {
        label: "Notes",
        icon: FileText,
        path: "/teacher/notes",
      },
      {
        label: "Results",
        icon: BarChart3,
        path: "/teacher/results",
      },
    ],
  },
  {
    title: "TOOLS",
    items: [
      {
        label: "AI Question Generator",
        icon: Sparkles,
        path: "/teacher/ai-question-generator",
        badge: "AI",
      },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      {
        label: "Settings",
        icon: Settings,
        path: "/teacher/settings",
      },
    ],
  },
];

export default function TeacherSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const teacherName =
    user?.full_name ||
    user?.username ||
    "Teacher";

  const handleNavigate = (path) => {
    setMobileOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    setMobileOpen(false);
    navigate("/login", { replace: true });
    window.location.reload();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-xl border border-slate-200 bg-white p-3 text-slate-700 shadow-lg lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu size={21} />
      </button>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[82px] items-center justify-between border-b border-slate-100 px-5">
          <button
            type="button"
            onClick={() => handleNavigate("/teacher/dashboard")}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
              <GraduationCap size={24} />
            </div>

            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                EduNexa
              </h2>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Teacher Portal
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {navigation.map((section) => (
            <div key={section.title} className="mb-7">
              <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    location.pathname === item.path ||
                    (item.path !== "/teacher/dashboard" &&
                      location.pathname.startsWith(`${item.path}/`));

                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => handleNavigate(item.path)}
                      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
                        active
                          ? "bg-indigo-50 text-indigo-700 shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                          active
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "bg-slate-50 text-slate-500 group-hover:bg-white group-hover:text-indigo-600"
                        }`}
                      >
                        <Icon size={18} />
                      </span>

                      <span className="flex-1">{item.label}</span>

                      {item.badge && (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                          {item.badge}
                        </span>
                      )}

                      {active && (
                        <ChevronRight
                          size={15}
                          className="text-indigo-500"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-indigo-50/70 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white">
              {teacherName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {teacherName}
              </p>
              <p className="text-xs text-slate-500">Teacher</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
