import React from 'react';
import { base44 } from '@/api/base44Client';
import { MailCheck, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PendingEmailVerification() {
  const handleLogout = () => {
    base44.auth.logout('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-lg">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <MailCheck className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-xl font-bold text-foreground mb-2">Verifique seu e-mail</h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Enviamos um código de verificação para o seu e-mail. Por favor, verifique sua caixa de entrada (e a pasta de spam) e conclua a verificação antes de acessar o sistema.
        </p>

        <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left space-y-2">
          <p className="text-xs font-semibold text-foreground">O que fazer:</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Acesse seu e-mail e localize a mensagem de verificação</li>
            <li>Clique no link ou insira o código fornecido</li>
            <li>Após verificar, faça login novamente</li>
          </ul>
        </div>

        <Button variant="outline" onClick={handleLogout} className="w-full gap-2">
          <LogOut className="w-4 h-4" />
          Sair e fazer login novamente
        </Button>
      </div>
    </div>
  );
}