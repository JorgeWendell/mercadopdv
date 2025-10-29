"use client";

import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUpdateUserRole } from "@/hooks/mutations/use-update-user-role";
import { useCurrentRole } from "@/hooks/queries/use-current-role";
import { useUsers } from "@/hooks/queries/use-users";

const roles = ["NENHUM", "OPERADOR", "ESTOQUE", "COMPRAS", "ADMINISTRATIVO"] as const;

export default function UsuariosPage() {
  const router = useRouter();
  const { data: roleData } = useCurrentRole();
  const currentRole = roleData?.role;
  useEffect(() => {
    if (currentRole && currentRole !== "ADMINISTRATIVO") {
      router.replace("/dashboard");
    }
  }, [currentRole, router]);
  const allowed = currentRole === "ADMINISTRATIVO";

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const { data, isLoading, error, refetch } = useUsers({ q, page, pageSize });
  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const mutation = useUpdateUserRole();

  const rows = useMemo(() => users, [users]);

  if (!allowed) return null;

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail"
            className="w-64 rounded-md border px-3 py-2 text-sm"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
          />
        </div>
      </div>

      <div className="rounded-lg border">
        {error ? (
          <div className="p-4 space-y-2 text-center">
            <p className="text-destructive text-sm">Erro ao carregar usuários.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Tentar novamente</Button>
          </div>
        ) : null}
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : rows.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Nível de acesso</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      onValueChange={(value) =>
                        mutation.mutate({ userId: u.id, role: value as (typeof roles)[number] })
                      }
                    >
                      <SelectTrigger className="w-56">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={mutation.isPending}
                      onClick={() =>
                        mutation.mutate({ userId: u.id, role: u.role as (typeof roles)[number] })
                      }
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      {mutation.isPending ? "Salvando..." : "Alterar"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-4">
            <p className="text-muted-foreground text-sm text-center">Nenhum usuário encontrado</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="text-sm text-muted-foreground">Página {page} de {totalPages} — {total} usuários</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(1)}>« Primeiro</Button>
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹ Anterior</Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Próxima ›</Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>Última »</Button>
        </div>
      </div>
    </div>
  );
}


