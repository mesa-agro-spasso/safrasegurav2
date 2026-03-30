import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldX, LogOut } from "lucide-react";

export default function BlockedAccessPage() {
  const { signOut, appUser } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardContent className="py-12 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mx-auto">
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-foreground">Acesso bloqueado</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              A conta <span className="font-medium text-foreground">{appUser?.email}</span> está desativada.
              <br />
              Entre em contato com o administrador do sistema para mais informações.
            </p>
          </div>
          <Button variant="outline" onClick={signOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
