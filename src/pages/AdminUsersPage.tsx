import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, Users, ShieldCheck, ShieldOff, Clock, Crown, CrownIcon } from "lucide-react";
import { LoadingState } from "@/components/shared/LoadingState";
import { format } from "date-fns";

interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  status: string;
  access_level: string;
  is_admin: boolean;
  created_at: string;
  approved_at: string | null;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Ativo", variant: "default" },
  pending: { label: "Pendente", variant: "outline" },
  disabled: { label: "Desativado", variant: "destructive" },
};

const accessConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  full: { label: "Completo", variant: "default" },
  limited: { label: "Limitado", variant: "secondary" },
};

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("app_users")
      .select("id, email, full_name, status, access_level, is_admin, created_at, approved_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar usuários", description: error.message, variant: "destructive" });
    } else {
      setUsers(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const callRpc = async (userId: string, status: string, accessLevel: string, isAdmin: boolean) => {
    setActing(userId);
    const { error } = await supabase.rpc("admin_set_user_access", {
      p_user_id: userId,
      p_status: status,
      p_access_level: accessLevel,
      p_is_admin: isAdmin,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Acesso atualizado." });
      await fetchUsers();
    }
    setActing(null);
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      const q = search.toLowerCase();
      const matchesSearch = !q || (u.full_name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [users, search, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingState message="Carregando usuários..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Gerenciar Usuários" description="Aprovar, desativar e configurar acessos dos usuários do sistema." />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="disabled">Desativados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary badges */}
      <div className="flex gap-3 text-sm">
        <Badge variant="outline" className="gap-1"><Users className="h-3 w-3" />{users.length} total</Badge>
        <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{users.filter(u => u.status === "pending").length} pendentes</Badge>
        <Badge variant="default" className="gap-1"><ShieldCheck className="h-3 w-3" />{users.filter(u => u.status === "active").length} ativos</Badge>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhum usuário encontrado.</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Acesso</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Aprovado em</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const sc = statusConfig[u.status] ?? { label: u.status, variant: "outline" as const };
                const ac = accessConfig[u.access_level] ?? { label: u.access_level, variant: "outline" as const };
                const busy = acting === u.id;
                return (
                  <TableRow key={u.id} className={busy ? "opacity-50 pointer-events-none" : ""}>
                    <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell><Badge variant={sc.variant}>{sc.label}</Badge></TableCell>
                    <TableCell><Badge variant={ac.variant}>{ac.label}</Badge></TableCell>
                    <TableCell>
                      {u.is_admin ? <Crown className="h-4 w-4 text-yellow-500" /> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{format(new Date(u.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{u.approved_at ? format(new Date(u.approved_at), "dd/MM/yyyy HH:mm") : "—"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {u.status !== "active" && (
                            <>
                              <DropdownMenuItem onClick={() => callRpc(u.id, "active", "limited", u.is_admin)}>
                                <ShieldCheck className="mr-2 h-4 w-4" /> Aprovar (Limitado)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => callRpc(u.id, "active", "full", u.is_admin)}>
                                <ShieldCheck className="mr-2 h-4 w-4" /> Aprovar (Completo)
                              </DropdownMenuItem>
                            </>
                          )}
                          {u.status === "active" && u.access_level === "limited" && (
                            <DropdownMenuItem onClick={() => callRpc(u.id, "active", "full", u.is_admin)}>
                              Alterar para Completo
                            </DropdownMenuItem>
                          )}
                          {u.status === "active" && u.access_level === "full" && (
                            <DropdownMenuItem onClick={() => callRpc(u.id, "active", "limited", u.is_admin)}>
                              Alterar para Limitado
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {u.status !== "pending" && (
                            <DropdownMenuItem onClick={() => callRpc(u.id, "pending", u.access_level, u.is_admin)}>
                              <Clock className="mr-2 h-4 w-4" /> Recolocar Pendente
                            </DropdownMenuItem>
                          )}
                          {u.status !== "disabled" && (
                            <DropdownMenuItem onClick={() => callRpc(u.id, "disabled", u.access_level, u.is_admin)} className="text-destructive">
                              <ShieldOff className="mr-2 h-4 w-4" /> Desativar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => callRpc(u.id, u.status, u.access_level, !u.is_admin)}>
                            <CrownIcon className="mr-2 h-4 w-4" /> {u.is_admin ? "Remover Admin" : "Tornar Admin"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
