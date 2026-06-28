import { NavLink } from "react-router-dom";
import { LayoutDashboard, PackageSearch, Megaphone, Users, Radar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Visão geral", icon: LayoutDashboard, adminOnly: false },
  { to: "/produtos", label: "Produtos monitorados", icon: PackageSearch, adminOnly: false },
  { to: "/anuncios", label: "Gerador de anúncios", icon: Megaphone, adminOnly: false },
  { to: "/usuarios", label: "Usuários", icon: Users, adminOnly: true },
];

export function Sidebar() {
  const { isAdmin, profile } = useAuth();
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-border">
        <Radar size={20} className="text-accent" />
        <span className="font-display font-extrabold tracking-tight">SBX Monitoramento</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-accent/15 text-accent" : "text-muted hover:text-white hover:bg-elevated"
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
      </nav>
      <div className="px-4 py-4 border-t border-border">
        <p className="text-xs text-muted">Conectado como</p>
        <p className="text-sm font-medium truncate">{profile?.full_name ?? profile?.email}</p>
        <p className="text-xs text-accent font-mono-data uppercase">{profile?.role}</p>
      </div>
    </aside>
  );
}
