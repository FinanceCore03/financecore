import { useState, useEffect } from "react";
import { Plus, ChevronRight, Tv, CreditCard, Calendar as CalendarIcon, Loader2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AddSubscriptionModal } from "./AddSubscriptionModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface SubscriptionsCardProps {
  usuarioId: number | null;
}

export function SubscriptionsCard({ usuarioId }: SubscriptionsCardProps) {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchSubscriptions = async () => {
    if (!usuarioId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("Assinaturas")
        .select("*")
        .eq("id_usuario", usuarioId)
        .order("status", { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
      console.log("Assinaturas encontradas:", data);
    } catch (error) {
      console.error("Erro ao carregar assinaturas:", error);
      toast.error("Erro ao carregar assinaturas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [usuarioId]);

  const handleCancelSubscription = async () => {
    if (!selectedSub || !usuarioId) return;
    setIsCancelling(true);

    const payload = {
      acao: "cancelar",
      tipo: "assinatura",
      id_assinatura: selectedSub.id,
      nome: selectedSub.nome || selectedSub.descricao || "Assinatura",
      categoria: "Assinatura",
      valor: selectedSub.valor,
      metodo_pagamento: selectedSub.metodo_pagamento,
      dia_cobranca: selectedSub.dia_cobranca,
      data_compra: selectedSub.data_compra,
      data_final: selectedSub.data_final,
      descricao: selectedSub.descricao,
      status: false,
      id_usuario: usuarioId,
    };

    console.log("Payload cancelamento assinatura:", payload);

    try {
      const response = await fetch("https://autowebhook.dudaclientes.site/webhook/Transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("Resposta webhook cancelamento assinatura:", response);

      if (!response.ok) throw new Error("Erro ao cancelar assinatura");

      toast.success("Solicitação de cancelamento enviada!");
      setIsCancelConfirmOpen(false);
      setSelectedSub(null);
      fetchSubscriptions();
    } catch (error) {
      console.log("Erro cancelamento assinatura:", error);
      toast.error("Erro ao processar cancelamento. Tente novamente.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold tracking-tight text-lg">Assinaturas</h3>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="size-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
          title="Adicionar Assinatura"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="size-8 animate-spin text-primary/30" />
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <Tv className="size-10 text-muted-foreground/20" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Nenhuma assinatura cadastrada.</p>
              <p className="text-xs text-muted-foreground max-w-[200px]">Adicione suas assinaturas para acompanhar cobranças recorrentes.</p>
            </div>
          </div>
        ) : (
          subscriptions.map((sub) => {
            const isActive = sub.status === true;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSub(sub)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl border border-transparent hover:border-border hover:bg-muted/30 transition-all group text-left ${!isActive ? 'opacity-60' : ''}`}
              >
                <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-primary-soft text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <Tv className="size-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm truncate ${!isActive ? 'text-muted-foreground' : ''}`}>
                    {sub.nome || sub.descricao || "Assinatura"}
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span>Cobrança: dia {sub.dia_cobranca}</span>
                    <span className="mx-1">•</span>
                    <span className={isActive ? 'text-success font-medium' : 'text-muted-foreground'}>
                      {isActive ? 'Ativa' : 'Cancelada'}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`font-bold text-sm tabular-nums ${!isActive ? 'text-muted-foreground' : ''}`}>
                    R$ {parseFloat(sub.valor || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground ml-auto mt-1 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })
        )}
      </div>

      <AddSubscriptionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchSubscriptions}
        usuarioId={usuarioId}
      />

      <Dialog open={!!selectedSub} onOpenChange={(open) => !open && setSelectedSub(null)}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-card border-none shadow-2xl">
          {selectedSub && (
            <div className="p-6 space-y-6">
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`size-12 rounded-2xl flex items-center justify-center ${selectedSub.status ? 'bg-primary-soft text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Tv className="size-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold tracking-tight">{selectedSub.nome || selectedSub.descricao}</DialogTitle>
                    <p className="text-xs text-muted-foreground">{selectedSub.categoria || "Assinatura"}</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4 py-2 border-y border-border/50">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CreditCard className="size-3" /> Valor
                  </p>
                  <p className="font-bold text-base tabular-nums">R$ {parseFloat(selectedSub.valor || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CalendarIcon className="size-3" /> Cobrança
                  </p>
                  <p className="font-bold text-base">Dia {selectedSub.dia_cobranca}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Método</p>
                  <p className="font-medium text-sm px-2 py-0.5 bg-muted rounded-md inline-block">{selectedSub.metodo_pagamento || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block ${selectedSub.status ? 'bg-success-soft text-success' : 'bg-muted text-muted-foreground'}`}>
                    {selectedSub.status ? 'Ativa' : 'Cancelada'}
                  </span>
                </div>
                {selectedSub.data_compra && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Data Início</p>
                    <p className="text-sm font-medium">{format(new Date(selectedSub.data_compra), "dd/MM/yyyy")}</p>
                  </div>
                )}
                {selectedSub.data_final && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Data Final</p>
                    <p className="text-sm font-medium">{format(new Date(selectedSub.data_final), "dd/MM/yyyy")}</p>
                  </div>
                )}
              </div>

              {selectedSub.descricao && (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Info className="size-3" /> Descrição
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedSub.descricao}</p>
                </div>
              )}

              <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedSub(null)}
                  className="w-full h-11 rounded-xl border-border hover:bg-muted"
                >
                  Fechar
                </Button>
                {selectedSub.status && (
                  <Button
                    variant="destructive"
                    onClick={() => setIsCancelConfirmOpen(true)}
                    className="w-full h-11 rounded-xl bg-danger/10 text-danger hover:bg-danger hover:text-danger-foreground border-none transition-colors"
                  >
                    Cancelar Assinatura
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Cancelar assinatura?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Essa assinatura deixará de ser considerada como ativa nos próximos meses, mas continuará no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isCancelling} className="rounded-xl h-11">Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancelSubscription();
              }}
              disabled={isCancelling}
              className="rounded-xl h-11 bg-danger text-danger-foreground hover:bg-danger/90"
            >
              {isCancelling ? <Loader2 className="size-4 animate-spin" /> : "Confirmar cancelamento"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
