import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, Users, FileText, LogOut, Clock } from "lucide-react";

export function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const isAdmin = user.role === "admin";

  const links = [
    { href: "/", label: "Meu Ponto", icon: Clock },
    ...(isAdmin ? [
      { href: "/admin/users", label: "Funcionários", icon: Users },
      { href: "/admin/reports", label: "Relatórios", icon: FileText },
    ] : []),
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold font-display tracking-tight flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <span className="truncate">Olivium Sistemas</span>
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold ml-10">
            Gestão de Ponto
          </span>
        </h1>
      </div>

      <div className="flex-1 py-6 px-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          
          return (
            <Link key={link.href} href={link.href}>
              <div className={`
                flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200
                ${isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/20 font-medium" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"}
              `}>
                <Icon size={20} />
                <span>{link.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user.role}</p>
          </div>
        </div>
        
        <button 
          onClick={() => logout()}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
}
