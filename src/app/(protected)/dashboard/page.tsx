"use client";

import { useExpiringProducts } from "@/hooks/queries/use-expiring-products";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const DashboardPage = () => {
  const router = useRouter();
  const { data } = useExpiringProducts(30);
  const products = data?.success ? data.data : [];

  const expired = products.filter((p) => p.isExpired);
  const critical = products.filter((p) => !p.isExpired && p.status === "CRITICAL");

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(expired.length > 0 || critical.length > 0) && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-600">⚠️ Alertas de Validade</CardTitle>
              <CardDescription>Produtos que requerem atenção imediata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {expired.length > 0 && (
                <div className="p-3 bg-red-100 rounded border border-red-200">
                  <div className="text-2xl font-bold text-red-700">{expired.length}</div>
                  <div className="text-sm text-red-600">Produto(s) vencido(s)</div>
                </div>
              )}
              {critical.length > 0 && (
                <div className="p-3 bg-orange-100 rounded border border-orange-200">
                  <div className="text-2xl font-bold text-orange-700">{critical.length}</div>
                  <div className="text-sm text-orange-600">Produto(s) vencem em até 7 dias</div>
                </div>
              )}
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => router.push("/estoque/validades")}
              >
                Ver Todos os Alertas
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo!</CardTitle>
            <CardDescription>Sistema de gerenciamento de mercado</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Utilize o menu lateral para acessar as funcionalidades do sistema.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;