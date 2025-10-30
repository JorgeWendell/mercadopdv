"use client";

import type { LucideIcon } from "lucide-react";
import { Archive, LogOut, NotebookPenIcon, Receipt, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { useCurrentRole } from "@/hooks/queries/use-current-role";

import { NavMain } from "./nav-main";

// This is sample data.

type Role = "NENHUM" | "OPERADOR" | "ESTOQUE" | "COMPRAS" | "ADMINISTRATIVO";
type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  items?: NavItem[];
  roles?: Role[];
};
type NavGroup = { label: string; items: NavItem[] };

const data: { navMain: NavGroup[] } = {
  navMain: [
    {
      label: "Menu",
      items: [
        {
          title: "PDV",
          url: "/pdv",
          icon: ShoppingCart,
          roles: ["OPERADOR", "ADMINISTRATIVO"] as Role[],
        },
        {
          title: "Estoque",
          url: "#",
          icon: Archive,
          items: [
            {
              title: "Entrada de Mercadorias",
              url: "/estoque/entrada",
              roles: ["COMPRAS", "ADMINISTRATIVO"] as Role[],
            },
            {
              title: "Produtos",
              url: "/produtos",
              roles: ["ESTOQUE", "COMPRAS", "ADMINISTRATIVO"] as Role[],
            },
            {
              title: "Etiquetas",
              url: "/etiquetas",
              roles: ["ESTOQUE", "COMPRAS", "ADMINISTRATIVO"] as Role[],
            },
          ],
          roles: ["ESTOQUE", "COMPRAS", "ADMINISTRATIVO"] as Role[],
        },
        {
          title: "Cadastros",
          url: "#",
          icon: NotebookPenIcon,
          items: [
            {
              title: "Categorias",
              url: "/categorias",
              roles: ["ADMINISTRATIVO"] as Role[],
            },
            {
              title: "Fornecedores",
              url: "/fornecedores",
              roles: ["ADMINISTRATIVO"] as Role[],
            },
            {
              title: "Clientes",
              url: "/clientes",
              roles: ["ADMINISTRATIVO"] as Role[],
            },
            {
              title: "Usuários",
              url: "/usuarios",
              roles: ["ADMINISTRATIVO"] as Role[],
            },
          ],
          roles: ["ADMINISTRATIVO"] as Role[],
        },
        {
          title: "Vendas",
          url: "#",
          icon: Receipt,
          items: [
            {
              title: "Caixa",
              url: "/caixa",
              roles: ["OPERADOR", "ADMINISTRATIVO"] as Role[],
            },
            {
              title: "Histórico",
              url: "/vendas/historico",
              roles: ["ADMINISTRATIVO"] as Role[],
            },
            {
              title: "Dashboard",
              url: "/vendas/dashboard",
              roles: ["ADMINISTRATIVO"] as Role[],
            },
          ],
          roles: ["ADMINISTRATIVO"] as Role[],
        },
       
      ],
    },
  ],
}; 

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();

  const session = authClient.useSession();
  const { data: roleData } = useCurrentRole();
  const role = roleData?.role as Role | undefined;
  const currentRole: Role = role ?? "OPERADOR";

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/authentication");
        },
      },
    });
  };
  return (
    <Sidebar collapsible="icon" {...props}>
      <h1 className="text-2xl font-bold text-center pt-6">Mercado</h1>
      <SidebarContent>
        <NavMain
          groups={data.navMain.map((group) => ({
            ...group,
            items: group.items
              .filter((it) => !it.roles || it.roles.includes(currentRole))
              .map((it) =>
                it.items
                  ? {
                      ...it,
                      items: it.items.filter((sub) => !sub.roles || sub.roles.includes(currentRole)),
                    }
                  : it
              )
              .filter((it) => (it.items ? it.items.length > 0 : true)),
          }))}
        />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar>
                    <AvatarFallback>
                      {session.data?.user.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm">{session.data?.user.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {session.data?.user.email}
                    </p>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
