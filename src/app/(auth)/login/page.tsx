import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "../_components/auth-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Entrar | Vertente" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/app");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse seu painel para gerenciar seus sites.</CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm mode="login" />
      </CardContent>
    </Card>
  );
}
