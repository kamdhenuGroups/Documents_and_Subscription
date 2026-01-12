import React from "react";
import { User } from "lucide-react";
import useAuthStore from "../store/authStore";
import useHeaderStore from "../store/headerStore";

interface HeaderProps {
  children?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ children }) => {
  const { currentUser } = useAuthStore();
  const { title } = useHeaderStore();

  return (
    <header className="bg-white border-b border-slate-100 relative z-10">
      <div className="flex justify-between items-center px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          {children}

          {/* Mobile Title / Dynamic Title */}
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {title || (
                <>
                  Document & Subscription <span className="text-blue-500">Manager</span>
                </>
              )}
            </h1>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 pl-4 w-full justify-end">
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-slate-700">{currentUser?.name || currentUser?.id || "Guest"}</p>
              <p className="text-xs text-slate-500 capitalize">
                {currentUser?.role || "User"}
              </p>
            </div>
            <div className="flex justify-center items-center w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg">
              <User size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;