import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, FileText, ArrowRight } from "lucide-react";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const setAuthenticatedUser = useAuthStore((state) => state.setAuthenticatedUser);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error("Please enter both username and password");
      return;
    }

    try {
      setIsLoading(true);
      const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || "";
      if (!GOOGLE_SCRIPT_URL) {
        toast.error("Google Script URL is missing");
        return;
      }

      const url = new URL(GOOGLE_SCRIPT_URL);
      url.searchParams.set("sheet", "Pass");
      url.searchParams.set("_t", Date.now().toString());

      const response = await fetch(url.toString());
      const json = await response.json();

      if (!json.success || !Array.isArray(json.data)) {
        throw new Error("Failed to fetch login data");
      }

      const rows: any[][] = json.data.slice(1);
      const foundRow = rows.find(row =>
        String(row[1] || "").trim() === username.trim() &&
        String(row[2] || "").trim() === password.trim()
      );

      if (foundRow) {
        const deletionStatus = (foundRow[5] || "").toString().trim();
        if (deletionStatus === 'Deleted') {
          toast.error("User Does not exist");
          return;
        }

        const role = (foundRow[3] || "user").toLowerCase() as 'admin' | 'user';
        let permissions: string[] = [];

        if (role === 'admin') {
          permissions = ['Dashboard', 'Document', 'Subscription', 'Loan', 'Calendar', 'Master', 'Settings'];
        } else {
          const rawPermissions = (foundRow[4] || "").toString();
          permissions = rawPermissions.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
        }

        setAuthenticatedUser({
          id: foundRow[1],
          name: (foundRow[0] || "").toString().trim(),
          role: role,
          permissions: permissions
        });

        toast.success(`Welcome back, ${foundRow[0] || foundRow[1]}!`);
        navigate("/", { replace: true });
      } else {
        toast.error("Invalid username or password");
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.error("An error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 sm:p-10 relative overflow-hidden">

        {/* Decorative background element */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex justify-center mb-8">
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <FileText className="w-8 h-8 text-indigo-600" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Welcome Back</h1>
            <p className="text-gray-500 text-sm">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                placeholder="Enter your username"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all duration-200 ${isLoading
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]"
                }`}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Sign in <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              Powered by{' '}
              <a
                href="https://www.botivate.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-indigo-600 font-medium transition-colors"
              >
                Botivate
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
