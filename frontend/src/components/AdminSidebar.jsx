import {
  Activity,
  BarChart3,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Sparkles,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const navigationItems = [
  {
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Teachers",
    path: "/admin/teachers",
    icon: Users,
  },
  {
    label: "Students",
    path: "/admin/students",
    icon: UserRoundCheck,
  },
  {
    label: "Subjects",
    path: "/admin/subjects",
    icon: BookOpen,
  },
  {
    label: "Tests",
    path: "/admin/tests",
    icon: BarChart3,
  },
  {
    label: "Question Bank",
    path: "/admin/question-bank",
    icon: Activity,
  },
  {
    label: "AI Question Generator",
    path: "/admin/ai-question-generator",
    icon: Sparkles,
  },
];

function SidebarItem({ item, onNavigate }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-all duration-200 ${
          isActive
            ? "bg-indigo-50 text-indigo-600 shadow-sm"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
              isActive
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-400 group-hover:bg-white group-hover:text-slate-700"
            }`}
          >
            <Icon size={18} />
          </span>

          <span className="truncate">{item.label}</span>

          {isActive && (
            <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
          )}
        </>
      )}
    </NavLink>
  );
}

export default function AdminSidebar({
  sidebarOpen,
  setSidebarOpen,
  user,
  logout,
  navigate,
}) {
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    }

    setSidebarOpen(false);

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-[270px] border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center justify-between border-b border-slate-100 px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
                <GraduationCap size={21} />
              </div>

              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900">
                  EduNexa
                </h1>

                <p className="text-[9px] uppercase tracking-[0.18em] text-slate-400">
                  Administration
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeSidebar}
              className="text-slate-400 transition hover:text-slate-700 lg:hidden"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Main Navigation
            </p>

            <nav className="space-y-1">
              {navigationItems.slice(0, 6).map((item) => (
                <SidebarItem
                  key={item.path}
                  item={item}
                  onNavigate={closeSidebar}
                />
              ))}
            </nav>

            <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Tools
            </p>

            <nav className="space-y-1">
              {navigationItems.slice(6).map((item) => (
                <SidebarItem
                  key={item.path}
                  item={item}
                  onNavigate={closeSidebar}
                />
              ))}
            </nav>
          </div>

          <div className="border-t border-slate-100 p-4">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 font-bold text-indigo-600">
                {user?.full_name?.charAt(0)?.toUpperCase() || "A"}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user?.full_name || "Admin"}
                </p>

                <p className="text-xs text-slate-400">
                  Administrator
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="text-slate-400 transition hover:text-red-500"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}