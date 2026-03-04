import { cn } from "@/lib/utils";
import {
  Boxes,
  Factory,
  LayoutDashboard,
  Package,
  Scissors,
  ShoppingBag,
  Users,
  Wrench,
} from "lucide-react";
import type { AppPage } from "../App";

interface SidebarProps {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
}

const navItems: { label: string; page: AppPage; icon: React.ReactNode }[] = [
  {
    label: "Dashboard",
    page: "dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  { label: "Orders", page: "orders", icon: <ShoppingBag size={18} /> },
  { label: "Products", page: "products", icon: <Package size={18} /> },
  { label: "Inventory", page: "inventory", icon: <Boxes size={18} /> },
  { label: "Production", page: "production", icon: <Factory size={18} /> },
  { label: "Job Work", page: "jobwork", icon: <Wrench size={18} /> },
  { label: "Job Workers", page: "jobworkers", icon: <Users size={18} /> },
];

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-full bg-sidebar sidebar-texture">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center">
            <Scissors size={14} className="text-sidebar-primary-foreground" />
          </div>
          <div>
            <p className="text-sidebar-foreground font-display text-sm font-semibold leading-tight">
              Neetika Chopra
            </p>
            <p className="text-sidebar-foreground/50 text-xs">ERP System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest text-sidebar-foreground/40">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = activePage === item.page;
          return (
            <button
              type="button"
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 text-left nav-item",
                isActive
                  ? "nav-item-active text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <span
                className={cn(
                  isActive
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/50",
                )}
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-sidebar-border">
        <p className="text-sidebar-foreground/30 text-xs text-center">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-sidebar-foreground/60 transition-colors"
          >
            Built with caffeine.ai
          </a>
        </p>
      </div>
    </aside>
  );
}
