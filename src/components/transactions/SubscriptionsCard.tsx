import { useState, useEffect, useMemo } from "react";
import { Plus, ChevronRight, Tv, CreditCard, Calendar as CalendarIcon, Loader2, Info, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AddSubscriptionModal } from "./AddSubscriptionModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

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
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;

  const fetchSubscriptions = async () => {
    if (!usuarioId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("Assinaturas")
        .select("*")
        .eq("id_usuario", usuarioId)
        .order("status", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
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

    try {
      const response = await fetch("https://autowebhook.dudaclientes.site/webhook/Transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

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

  const totalPages = Math.ceil(subscriptions.length / itemsPerPage);
  const paginatedSubscriptions = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return subscriptions.slice(start, start + itemsPerPage);
  }, [subscriptions, currentPage]);

  const nextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="bg-white border border-border/50 rounded-2xl p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-[#1A1A1A] text-lg tracking-tight">Assinaturas</h3>
        <div className="flex items-center gap-2">
          {totalPages > 1 && (
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 0}
                className="p-1 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages - 1}
                className="p-1 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="size-8 rounded-full bg-[#E9E4FF] text-[#7C3AED] flex items-center justify-center hover:bg-[#7C3AED] hover:text-white transition-all shadow-sm"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="size-8 animate-spin text-primary/30" />
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
            <div className="size-12 rounded-2xl bg-muted/30 flex items-center justify-center">
              <Tv className="size-6 text-muted-foreground/40" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#1A1A1A]">Nenhuma assinatura cadastrada.</p>
              <p className="text-xs text-muted-foreground max-w-[220px]">Adicione suas assinaturas para acompanhar seus pagamentos recorrentes.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {paginatedSubscriptions.map((sub) => {
              const isActive = sub.status === true;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSub(sub)}
                  className={`w-full flex items-center gap-3 py-4 first:pt-0 last:pb-0 group transition-all text-left ${!isActive ? 'opacity-70 grayscale-[0.5]' : ''}`}
                >
                  <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-[#F5F3FF] text-[#7C3AED]' : 'bg-muted text-muted-foreground'}`}>
                    {sub.nome ? (
                      <span className="font-bold text-sm uppercase">{sub.nome.charAt(0)}</span>
                    ) : (
                      <Tv className="size-5" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-sm leading-tight mb-0.5 ${!isActive ? 'text-[#666666]' : 'text-[#1A1A1A]'}`}>
                      {sub.nome || sub.descricao || "Assinatura"}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-medium">
                      {sub.expiracao_indefinida ? (
                        "Recorrente"
                      ) : (
                        sub.data_expiracao ? `Expira em ${format(new Date(sub.data_expiracao), "dd/MM/yyyy")}` : "Recorrente"
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1">
                      <div className={`font-bold text-sm tabular-nums ${!isActive ? 'text-[#666666]' : 'text-[#1A1A1A]'}`}>
                        R$ {parseFloat(sub.valor || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <ChevronRight className="size-3.5 text-muted-foreground/60 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`h-4.5 px-1.5 py-0 text-[9px] font-bold border-none ${isActive ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-muted text-muted-foreground'}`}
                    >
                      {isActive ? 'Ativa' : 'Cancelada'}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <AddSubscriptionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchSubscriptions}
        usuarioId={usuarioId}
      />

      <Dialog open={!!selectedSub} onOpenChange={(open) => !open && setSelectedSub(null)}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-3xl">
          {selectedSub && (
            <div className="p-8 space-y-8">
              <DialogHeader>
                <div className="flex items-center gap-4 mb-2">
                  <div className={`size-14 rounded-2xl flex items-center justify-center ${selectedSub.status ? 'bg-[#F5F3FF] text-[#7C3AED]' : 'bg-muted text-muted-foreground'}`}>
                    <Tv className="size-7" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold tracking-tight text-[#1A1A1A]">{selectedSub.nome || selectedSub.descricao}</DialogTitle>
                    <p className="text-sm font-medium text-muted-foreground">{selectedSub.categoria || "Assinatura"}</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-y-8 gap-x-6 py-2 border-y border-border/40">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <CreditCard className="size-3" /> Valor
                  </p>
                  <p className="font-bold text-lg tabular-nums text-[#1A1A1A]">R$ {parseFloat(selectedSub.valor || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <CalendarIcon className="size-3" /> Cobrança
                  </p>
                  <p className="font-bold text-lg text-[#1A1A1A]">Dia {selectedSub.dia_cobranca}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Método</p>
                  <p className="font-bold text-sm text-[#1A1A1A]">{selectedSub.metodo_pagamento || "N/A"}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</p>
                  <Badge 
                    className={`h-5 px-2 py-0 text-[10px] font-bold border-none ${selectedSub.status ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-muted text-muted-foreground'}`}
                  >
                    {selectedSub.status ? 'Ativa' : 'Cancelada'}
                  </Badge>
                </div>
                {selectedSub.data_pagamento && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Data Pagamento</p>
                    <p className="text-sm font-bold text-[#1A1A1A]">{format(new Date(selectedSub.data_pagamento), "dd/MM/yyyy")}</p>
                  </div>
                )}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Data Final</p>
                  <p className="text-sm font-bold text-[#1A1A1A]">
                    {selectedSub.expiracao_indefinida ? (
                      "Recorrente"
                    ) : (
                      selectedSub.data_expiracao ? format(new Date(selectedSub.data_expiracao), "dd/MM/yyyy") : "Recorrente"
                    )}
                  </p>
                </div>
              </div>

              {selectedSub.descricao && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Info className="size-3" /> Descrição
                  </p>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">{selectedSub.descricao}</p>
                </div>
              )}

              <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedSub(null)}
                  className="w-full h-12 rounded-2xl border-border hover:bg-muted font-bold"
                >
                  Fechar
                </Button>
                {selectedSub.status && (
                  <Button
                    variant="destructive"
                    onClick={() => setIsCancelConfirmOpen(true)}
                    className="w-full h-12 rounded-2xl bg-[#FEF2F2] text-[#EF4444] hover:bg-[#EF4444] hover:text-white border-none transition-colors font-bold"
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
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-[#1A1A1A]">Cancelar assinatura?</AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium">
              Essa assinatura deixará de ser considerada como ativa nos próximos meses, mas continuará no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-4">
            <AlertDialogCancel disabled={isCancelling} className="rounded-2xl h-12 font-bold flex-1">Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancelSubscription();
              }}
              disabled={isCancelling}
              className="rounded-2xl h-12 bg-[#EF4444] text-white hover:bg-[#DC2626] font-bold flex-1"
            >
              {isCancelling ? <Loader2 className="size-4 animate-spin" /> : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

