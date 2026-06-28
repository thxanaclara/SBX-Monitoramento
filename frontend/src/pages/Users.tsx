import { useEffect, useState, type FormEvent } from "react";
import { Plus, ShieldCheck, User as UserIcon } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Table, Thead, Tr, Th, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { api } from "@/lib/api";
import type { Profile, UserRole } from "@/types";
import { formatDateBR } from "@/lib/utils";

export default function Users() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("staff");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    const data = await api.getUsers();
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const created = await api.createUser({ full_name: fullName, email, role });
      setSuccess(
        `Usuário criado. Senha temporária: "${created.temp_password}" — envie para ${email} por um canal seguro (ainda não há e-mail automático configurado).`
      );
      setFullName("");
      setEmail("");
      setRole("staff");
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar o usuário.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout title="Usuários">
      <Card>
        <CardHeader>
          <div>
            <h2 className="font-display font-bold text-sm">Admins e staffs da sua conta</h2>
            <p className="text-xs text-muted mt-0.5">Apenas administradores podem cadastrar novos usuários.</p>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus size={14} /> Adicionar usuário
          </Button>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted">Carregando…</p>}
          {!loading && (
            <Table>
              <Thead>
                <tr>
                  <Th>Nome</Th>
                  <Th>E-mail</Th>
                  <Th>Função</Th>
                  <Th>Criado em</Th>
                </tr>
              </Thead>
              <tbody>
                {users.map((u) => (
                  <Tr key={u.id}>
                    <Td className="font-medium">{u.full_name}</Td>
                    <Td className="text-muted">{u.email}</Td>
                    <Td>
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        {u.role === "admin" ? (
                          <ShieldCheck size={14} className="text-accent" />
                        ) : (
                          <UserIcon size={14} className="text-muted" />
                        )}
                        {u.role === "admin" ? "Admin" : "Staff"}
                      </span>
                    </Td>
                    <Td className="text-muted font-mono-data text-xs">{formatDateBR(u.created_at)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Adicionar novo usuário">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nome completo</Label>
            <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new_email">E-mail</Label>
            <Input id="new_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Função</Label>
            <Select id="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
          {error && <p className="text-sm text-signal-red">{error}</p>}
          {success && <p className="text-sm text-signal-green">{success}</p>}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Criando…" : "Criar usuário"}
          </Button>
        </form>
      </Dialog>
    </AppLayout>
  );
}
