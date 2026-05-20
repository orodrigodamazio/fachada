import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "../_components/auth-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Criar conta | Vertente" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/app");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>Crie sua conta para montar o site da sua empresa.</CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm mode="signup" />
      </CardContent>
    </Card>
  );
}
