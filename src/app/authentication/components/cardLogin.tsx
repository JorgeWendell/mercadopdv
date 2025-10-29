"use client";

import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import LoginForm from "./login-form";
import SigupForm from "./sigup-form";

const CardLogin = () => {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="hidden">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Criar conta</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <LoginForm setActiveTab={setActiveTab} />
        </TabsContent>
        <TabsContent value="register">
          <SigupForm setActiveTab={setActiveTab} />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default CardLogin;
