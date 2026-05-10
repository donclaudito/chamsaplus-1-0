import React from 'react';
import { base44 } from '@/api/base44Client';
import { Clock, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PendingApproval() {
  const handleLogout = () => {
    base44.auth.logout('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
          <Clock className="w-10 h-10 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Conta Aguardando Aprovação</h1>
          <p className="text-muted-foreground leading-relaxed">
            Seu cadastro foi recebido com sucesso. Um administrador irá revisar e aprovar sua conta em breve.
            Você receberá acesso assim que for aprovado.
          </p>
        </div>
        <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
          Se precisar de acesso urgente, entre em contato com o administrador do sistema.
        </div>
        <Button variant="outline" onClick={handleLogout} className="gap-2">
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}