import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  X,
  LayoutDashboard,
  FileText,
  Banknote,
  List,
  RefreshCw,
  Share2,
  CheckCircle,
  DollarSign,
  ShieldCheck,
  Ban,
  ChevronDown,
  ChevronRight,
  Settings as SettingsIcon,
  CreditCard
} from "lucide-react";
import useAuthStore from "../store/authStore";

interface SidebarProps {
  onClose?: () => void;
}

interface MenuItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
  subItems?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { logout, currentUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isSectionActive = (item: MenuItem, currentPath: string): boolean => {
    if (item.path === currentPath) return true;
    if (item.subItems) {
      return item.subItems.some(sub => isSectionActive(sub, currentPath));
    }
    return false;
  };

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const newOpenSections: Record<string, boolean> = {};

    const traverseAndOpen = (items: MenuItem[]) => {
      items.forEach(item => {
        if (item.subItems) {
          const hasActiveChild = item.subItems.some(sub => isSectionActive(sub, location.pathname + location.search));
          if (hasActiveChild || isSectionActive(item, location.pathname)) {
            newOpenSections[item.label] = true;
            traverseAndOpen(item.subItems);
          }
        }
      });
    };

    traverseAndOpen(allMenuItems);
    setOpenSections(newOpenSections);
  }, [location.pathname, location.search]);

  const allMenuItems: MenuItem[] = [
    {
      label: "Dashboard",
      path: "/",
      icon: <LayoutDashboard size={18} />,
    },
    {
      label: "Resource Manager",
      icon: <FileText size={18} />,
      subItems: [
        { label: "All Resources", path: "/resource-manager", icon: <List size={15} /> },
        {
          label: "Renewals",
          icon: <RefreshCw size={15} />,
          subItems: [
            { label: "Document Renewal", path: "/document/renewal", icon: <FileText size={15} /> },
            { label: "Subscription Renewal", path: "/subscription/renewal", icon: <CreditCard size={15} /> },
          ]
        },
        { label: "Document Shared", path: "/document/shared", icon: <Share2 size={15} /> },
        { label: "Subscription Approval", path: "/subscription/approval", icon: <CheckCircle size={15} /> },
        { label: "Subscription Payment", path: "/subscription/payment", icon: <DollarSign size={15} /> },
      ]
    },
    {
      label: "Loan",
      icon: <Banknote size={18} />,
      subItems: [
        { label: "All Loan", path: "/loan/all", icon: <List size={15} /> },
        { label: "Request Forecloser", path: "/loan/foreclosure", icon: <Ban size={15} /> },
        { label: "Collect NOC", path: "/loan/noc", icon: <ShieldCheck size={15} /> },
      ]
    },
    {
      label: "Settings",
      path: "/settings",
      icon: <SettingsIcon size={18} />,
    }
  ];

  const menuItems = allMenuItems.filter(item => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.permissions?.includes(item.label);
  });

  const toggleSection = (label: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenSections(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (onClose) onClose();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderMenuItem = (item: MenuItem, depth: number = 0) => {
    const hasChildren = item.subItems && item.subItems.length > 0;
    const isOpen = openSections[item.label];
    const isActiveLink = item.path && (location.pathname + location.search) === item.path;
    const isActiveSection = isSectionActive(item, location.pathname);

    // Dynamic padding calculation
    const basePadding = 0.75; // rem
    const depthPadding = depth * 1.25; // rem
    const paddingLeft = `${basePadding + depthPadding}rem`;

    if (hasChildren) {
      return (
        <div key={item.label} className="mb-0.5">
          <button
            onClick={(e) => toggleSection(item.label, e)}
            className={`w-full flex items-center justify-between py-2 pr-3 rounded-md transition-colors duration-200 group ${isOpen || isActiveSection
              ? 'text-blue-700 bg-blue-50'
              : 'text-slate-500 hover:text-blue-700 hover:bg-slate-50'
              }`}
            style={{ paddingLeft }}
          >
            <div className="flex items-center gap-3">
              <span className={`${isOpen || isActiveSection ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'}`}>
                {item.icon}
              </span>
              <span className="font-medium text-[13px]">{item.label}</span>
            </div>
            {isOpen ? <ChevronDown size={14} className="text-blue-400" /> : <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-300" />}
          </button>

          {isOpen && (
            <div className="mt-0.5 space-y-0.5 relative before:absolute before:left-[18px] before:top-0 before:bottom-0 before:w-px before:bg-blue-50">
              {/* Used a subtle line guide for hierarchy if needed, mostly handled by indentation */}
              {item.subItems!.map(sub => renderMenuItem(sub, depth + 1))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div key={item.path || item.label} className="mb-0.5">
          <button
            onClick={() => handleNavigation(item.path!)}
            className={`w-full flex items-center gap-3 py-2 pr-3 rounded-md transition-all duration-200 ${isActiveLink
              ? "bg-blue-50 text-blue-700"
              : "text-slate-500 hover:text-blue-700 hover:bg-slate-50"
              }`}
            style={{ paddingLeft }}
          >
            <span className={`${isActiveLink ? 'text-blue-600' : 'text-slate-400'}`}>
              {item.icon}
            </span>
            <span className={`text-[13px] ${isActiveLink ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
          </button>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg font-semibold text-sm">
            DS
          </div>
          <span className="font-semibold text-slate-800 text-sm tracking-tight">Documents &<br />Subscription</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-blue-600 transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2 px-3 no-scrollbar">
        {menuItems.map(item => renderMenuItem(item))}
      </div>

      {/* Footer / Logout */}
      <div className="p-3 mt-auto flex-shrink-0 border-t border-slate-50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
        >
          <LogOut size={18} />
          <span className="font-medium text-[13px]">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;