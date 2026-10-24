"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TempPasswordDialogProps = {
  credentials: { email: string; password: string } | null;
  onClose: () => void;
};

/** Exibe uma única vez a senha temporária gerada para um usuário. */
export function TempPasswordDialog({ credentials, onClose }: TempPasswordDialogProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!credentials) return;
    await navigator.clipboard.writeText(`E-mail: ${credentials.email}\nSenha temporária: ${credentials.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={credentials !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Senha temporária</DialogTitle>
          <DialogDescription>
            Envie estes dados ao usuário. A senha não será exibida novamente; peça que ele a altere em Configurações
            após o primeiro acesso.
          </DialogDescription>
        </DialogHeader>
        {credentials && (
          <div className="grid gap-2 rounded-lg border bg-muted/50 p-3 text-sm">
            <div>
              <span className="text-muted-foreground">E-mail: </span>
              <span className="font-medium">{credentials.email}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Senha: </span>
              <code className="font-mono text-base font-semibold select-all">{credentials.password}</code>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={copy}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
          <Button onClick={onClose}>Concluir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
