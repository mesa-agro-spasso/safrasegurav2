import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, LogOut } from "lucide-react";

export default function WaitingApprovalPage() {
  const { signOut, appUser } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardContent className="py-12 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warning/10 mx-auto">
            <Clock className="w-8 h-8 text-warning" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-foreground">Aguardando aprovação</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Sua conta <span className="font-medium text-foreground">{appUser?.email}</span> foi criada com sucesso.
              <br />
              Um administrador precisa aprovar seu acesso antes que você possa utilizar o sistema.
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
