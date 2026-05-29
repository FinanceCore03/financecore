import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { PageTransition, AnimatedItem } from "@/components/PageTransition";
import { Tags, CreditCard, Plus, Trash2, Info, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { getCurrencySymbol } from "@/lib/currency";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/personalization")({
  head: () => ({
    meta: [
      { title: "Configurações — Finance Core" },
    ],
  }),
  component: () => <SettingsPage />,
});

function SettingsPage() {
  const { user } = useAuth();
  const { moeda } = useDashboardData();
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [paymentMethodName, setPaymentMethodName] = useState("");
  const [categoryUsage, setCategoryUsage] = useState("SAÍDA");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  // Novos estados para Dados do Cartão
  const [bestPurchaseDay, setBestPurchaseDay] = useState<string>("");
  const [dueDay, setDueDay] = useState<string>("");
  const [initialBestPurchaseDay, setInitialBestPurchaseDay] = useState<string>("");
  const [initialDueDay, setInitialDueDay] = useState<string>("");
  const [showCardInfo, setShowCardInfo] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      if (!user) return;
      const { data: usuario } = await supabase.from("Usuarios").select("*").eq("id_auth", user.id).maybeSingle() as any;
      if (usuario) {
        setUsuarioId(usuario.id);
        setBestPurchaseDay(usuario.Dia_otimo?.toString() || "");
        setDueDay(usuario.Dia_vencimento?.toString() || "");
        setInitialBestPurchaseDay(usuario.Dia_otimo?.toString() || "");
        setInitialDueDay(usuario.Dia_vencimento?.toString() || "");
        fetchOptions(usuario.id);
      }
    }
    fetchUserData();
  }, [user]);

  async function fetchOptions(uid: number) {
    setLoading(true);
    const { data } = await supabase.from("Opcoes").select("*").or(`id_usuario.eq.${uid},id_usuario.is.null`);
    if (data) {
      setCategories(data.filter(item => item.Tipo?.toLowerCase() === "categoria"));
      setPaymentMethods(data.filter(item => item.Tipo?.toLowerCase() === "metodo_pagamento"));
    }
    setLoading(false);
  }

  const handleAddCategory = async () => {
    if (!categoryName || !usuarioId) {
      toast.error("Preencha o nome da categoria.");
      return;
    }

    setIsSubmitting(true);
    try {
      const usageMap: Record<string, string> = {
        "ENTRADA": "entrada",
        "SAÍDA": "saida",
        "ENTRADA/SAÍDA": "entrada_saida"
      };

      const payload = {
        acao: "adicionar",
        tipo: "categoria",
        nome: categoryName,
        uso: usageMap[categoryUsage] || "saida",
        id_usuario: usuarioId.toString()
      };

      const response = await fetch("https://autowebhook.dudaclientes.site/webhook/Transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Erro ao salvar categoria");

      toast.success("Categoria enviada com sucesso!");
      setIsCategoryModalOpen(false);
      setCategoryName("");
      setCategoryUsage("SAÍDA");
      
      // Pequeno delay para garantir que a automação processou antes de recarregar
      setTimeout(() => fetchOptions(usuarioId), 1500);
    } catch (error) {
      console.error("Erro no webhook:", error);
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!paymentMethodName || !usuarioId) {
      toast.error("Preencha o nome do método.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        acao: "adicionar",
        tipo: "metodo_pagamento",
        nome: paymentMethodName,
        id_usuario: usuarioId.toString()
      };

      const response = await fetch("https://autowebhook.dudaclientes.site/webhook/Transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Erro ao salvar método");

      toast.success("Método de pagamento enviado!");
      setIsPaymentModalOpen(false);
      setPaymentMethodName("");
      
      // Pequeno delay para recarregar
      setTimeout(() => fetchOptions(usuarioId), 1500);
    } catch (error) {
      console.error("Erro no webhook:", error);
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete || !usuarioId) return;

    setIsSubmitting(true);
    try {
      const isCategory = itemToDelete.Tipo?.toLowerCase() === "categoria";
      
      // Validação de transações vinculadas para categorias
      if (isCategory) {
        const { count, error: countError } = await supabase
          .from("Transacoes")
          .select("*", { count: 'exact', head: true })
          .eq("categoria", itemToDelete.Nome);
        
        if (countError) throw countError;
        
        if (count && count > 0) {
          toast.error("Esta categoria possui transações vinculadas e não pode ser removida.");
          setItemToDelete(null);
          return;
        }
      }

      const payload: any = {
        acao: "remover",
        tipo: isCategory ? "categoria" : "metodo_pagamento",
        nome: itemToDelete.Nome,
        id_usuario: usuarioId.toString()
      };

      if (isCategory) {
        const usageMap: Record<string, string> = {
          "ENTRADA": "entrada",
          "SAÍDA": "saida",
          "ENTRADA/SAÍDA": "entrada_saida"
        };
        payload.uso = usageMap[itemToDelete.Uso?.toUpperCase()] || "saida";
      }

      const response = await fetch("https://autowebhook.dudaclientes.site/webhook/Transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Erro ao remover item");

      toast.success("Solicitação de remoção enviada com sucesso!");
      setItemToDelete(null);
      
      // Recarregar a lista após um delay
      setTimeout(() => fetchOptions(usuarioId), 1500);
    } catch (error) {
      console.error("Erro no webhook de remoção:", error);
      toast.error("Erro ao remover. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCardData = async () => {
    if (!dueDay || !usuarioId) {
      toast.error("O campo dia de vencimento da fatura é obrigatório.");
      return;
    }

    const bestDayNum = bestPurchaseDay ? parseInt(bestPurchaseDay) : null;
    const dueDayNum = parseInt(dueDay);

    if ((bestDayNum !== null && (bestDayNum < 1 || bestDayNum > 31)) || dueDayNum < 1 || dueDayNum > 31) {
      toast.error("Informe um dia válido entre 1 e 31.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        acao: "dados_pessoais",
        dia_otimo: bestPurchaseDay,
        dia_vencimento: dueDay,
        id_usuario: usuarioId.toString()
      };

      const response = await fetch("https://autowebhook.dudaclientes.site/webhook/Transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Erro ao atualizar dados do cartão");

      toast.success("Dados do cartão atualizados com sucesso!");
      setInitialBestPurchaseDay(bestPurchaseDay);
      setInitialDueDay(dueDay);
    } catch (error) {
      console.error("Erro no webhook de dados do cartão:", error);
      toast.error("Erro ao atualizar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCardDataChanged = bestPurchaseDay !== initialBestPurchaseDay || dueDay !== initialDueDay;
  const isUpdateButtonEnabled = isCardDataChanged && dueDay !== "" && !isSubmitting;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <PageTransition>
          <main className="flex-1 px-8 py-8 space-y-6">
            <AnimatedItem>
              <header>
                <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">Configurações</h1>
                <p className="text-sm text-muted-foreground mt-1">Gerencie suas categorias, métodos de pagamento e dados do cartão.</p>
              </header>
            </AnimatedItem>

            <AnimatedItem>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Card 1: Dados do Cartão */}
                <Card className="border-none shadow-sm bg-white overflow-hidden xl:col-span-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary" />
                      Dados do Cartão
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Gerencie as datas de vencimento e melhor dia de compra.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="best-purchase-day" className="text-sm font-medium">Melhor dia de compra</Label>
                        <Input 
                          id="best-purchase-day"
                          type="number"
                          min="1"
                          max="31"
                          placeholder="Ex: 9"
                          value={bestPurchaseDay}
                          onChange={(e) => setBestPurchaseDay(e.target.value)}
                          className="h-11"
                        />
                        <p id="best-purchase-day-desc" className="text-[11px] text-muted-foreground italic">Esse campo não é obrigatório.</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="due-day" className="text-sm font-medium">Dia de vencimento da fatura <span className="text-danger">*</span></Label>
                        <Input 
                          id="due-day"
                          type="number"
                          min="1"
                          max="31"
                          placeholder="Ex: 19"
                          value={dueDay}
                          onChange={(e) => setDueDay(e.target.value)}
                          className="h-11"
                        />
                        <p id="due-day-desc" className="text-[11px] text-muted-foreground italic">Esse campo deve ser obrigatório.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex gap-3 items-start">
                          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <p className="text-xs text-slate-600 leading-relaxed">
                            O melhor dia de compra é o dia em que novas compras entram apenas na próxima fatura, ajudando você a ter mais prazo para pagar. A data de vencimento é o dia em que sua fatura fecha para pagamento. Cada banco pode ter uma regra diferente.
                          </p>
                        </div>
                        
                        <button 
                          onClick={() => setShowCardInfo(!showCardInfo)}
                          className="text-[#2563EB] text-xs font-semibold hover:underline w-fit transition-all"
                        >
                          Como posso descobrir?
                        </button>

                        {showCardInfo && (
                          <div className="mt-2 p-4 bg-white border border-blue-100 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                            <p className="text-xs text-slate-600 leading-relaxed">
                              Você normalmente encontra essas informações no aplicativo do seu banco, na área de cartões. Procure pela data de vencimento da fatura e pelo melhor dia de compra. Se tiver dúvida, você também pode pesquisar no ChatGPT como descobrir essas informações no app do seu banco.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button 
                      onClick={handleUpdateCardData} 
                      disabled={!isUpdateButtonEnabled}
                      className={cn(
                        "w-full h-11 text-white font-medium transition-all duration-200",
                        isUpdateButtonEnabled ? "bg-[#2563EB] hover:bg-[#1D4ED8] shadow-md" : "bg-slate-200 text-slate-400"
                      )}
                    >
                      {isSubmitting ? "Atualizando..." : "Atualizar"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Card 2: Categorias */}
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Tags className="w-5 h-5 text-primary" />
                      Categorias
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Adicione ou remova categorias usadas nas suas transações.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 mb-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {loading ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : categories.length === 0 ? (
                        <p className="text-sm text-center text-muted-foreground py-8">Nenhuma categoria encontrada.</p>
                      ) : (
                        categories.map((cat) => {
                          const isDeletable = cat.id_usuario !== null && !cat.Padrao;
                          const usage = cat.Uso?.toUpperCase() || "SAÍDA";
                          
                          let dotColor = "bg-primary"; // ENTRADA/SAÍDA
                          if (usage === "ENTRADA") dotColor = "bg-[#10B981]";
                          if (usage === "SAÍDA") dotColor = "bg-[#EF4444]";

                          return (
                            <div 
                              key={cat.id} 
                              className="group flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-slate-800">{cat.Nome}</span>
                                  <span className="text-[10px] text-muted-foreground font-semibold bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider w-fit">
                                    {usage}
                                  </span>
                                </div>
                              </div>
                              {isDeletable && (
                                <button 
                                  onClick={() => setItemToDelete(cat)} 
                                  className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-lg transition-all"
                                  title="Excluir categoria"
                                >
                                  <Trash2 size={16}/>
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                    <Button 
                      onClick={() => setIsCategoryModalOpen(true)} 
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2 h-11"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Categoria
                    </Button>
                  </CardContent>
                </Card>

                {/* Card 3: Métodos de Pagamento */}
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      Métodos de Pagamento
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Adicione ou remova os métodos usados nas suas transações.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 mb-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {loading ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : paymentMethods.length === 0 ? (
                        <p className="text-sm text-center text-muted-foreground py-8">Nenhum método encontrado.</p>
                      ) : (
                        paymentMethods.map((method) => {
                          const isDeletable = method.id_usuario !== null && !method.Padrao;
                          const isDefault = method.Padrao === true;

                          return (
                            <div 
                              key={method.id} 
                              className="group flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                                  <CreditCard size={18} />
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-800">{method.Nome}</span>
                                    {isDefault && (
                                      <span className="text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                        PADRÃO
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {isDeletable && (
                                <button 
                                  onClick={() => setItemToDelete(method)} 
                                  className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-lg transition-all"
                                  title="Excluir método"
                                >
                                  <Trash2 size={16}/>
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                    <Button 
                      onClick={() => setIsPaymentModalOpen(true)} 
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2 h-11"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Método
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </AnimatedItem>

            <footer className="text-center text-xs text-muted-foreground pt-4 pb-2">
              Finance Core © 2025
            </footer>
          </main>
        </PageTransition>
      </div>

      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nome</Label>
              <Input 
                id="category-name"
                placeholder="Ex: Alimentação, Lazer..."
                value={categoryName} 
                onChange={(e) => setCategoryName(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Uso</Label>
              <div className="flex gap-2">
                {["ENTRADA", "SAÍDA", "ENTRADA/SAÍDA"].map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={categoryUsage === type ? "default" : "outline"}
                    className="flex-1 text-[10px] h-9"
                    onClick={() => setCategoryUsage(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCategoryModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddCategory} disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Método de Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="method-name">Nome</Label>
              <Input 
                id="method-name"
                placeholder="Ex: Cartão Inter, Nubank, Dinheiro..."
                value={paymentMethodName} 
                onChange={(e) => setPaymentMethodName(e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddPaymentMethod} disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader><AlertDialogTitle>Excluir?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-danger text-white">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}