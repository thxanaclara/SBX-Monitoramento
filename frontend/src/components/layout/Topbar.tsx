import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { LogOut } from "lucide-react";

export function Topbar({ title }: { title: string }) {
  const { signOut } = useAuth();
  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-surface/60 backdrop-blur">
      <h1 className="font-display font-bold text-lg">{title}</h1>
      <Button variant="ghost" size="sm" onClick={signOut}>
        <LogOut size={14} /> Sair
      </Button>
    </header>
  );
}
