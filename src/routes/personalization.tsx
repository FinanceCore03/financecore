import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Tags, CreditCard, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/personalization")({
  head: () => ({
    meta: [
      { title: "Personalização — Financeiro Core" },
    ],
  }),
  component: () => <PersonalizationPage />,
});

const WEBHOOK_URL = "https://autowebhook.dudaclientes.site/webhook/Transacoes";

function PersonalizationPage() {
  const { user } = useAuth();
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryUsage, setCategoryUsage] = useState("saida");
  const [methodName, setMethodName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation state
  const [itemToDelete, setItemToDelete] = useState<{ id: number; name: string; type: string; usage?: string } | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      if (!user) return;
      
      const { data: usuario, error } = await supabase
        .from("Usuarios")
        .select("id")
        .eq("id_auth", user.id)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar usuário:", error);
        return;
      }

      if (usuario) {
        setUsuarioId(usuario.id);
        fetchOptions(usuario.id);
      }
    }

    fetchUserData();
  }, [user]);

  async function fetchOptions(uid: number) {
    setLoading(true);
    const { data, error } = await supabase
      .from("Opcoes")
      .select("*")
      .eq("id_usuario", uid);

    if (error) {
      console.error("Erro ao buscar opções:", error);
      toast.error("Erro ao carregar dados.");
    } else if (data) {
      // Filter based on our local structure but matching DB columns (Nome, Tipo)
      // Note: The DB schema showed "Nome" and "Tipo" but the instruction asked for specific structure.
      // We'll map them carefully.
      const cats = data.filter(item => (item.Tipo || "").toLowerCase() === "categoria");
      const methods = data.filter(item => (item.Tipo || "").toLowerCase() === "metodo_pagamento");
      
      setCategories(cats);
      setPaymentMethods(methods);
    }
    setLoading(false);
  }

  const handleAddCategory = async () => {
    if (!categoryName || !usuarioId) return;
    setIsSubmitting(true);

    const payload = {
      acao: "adicionar",
      tipo: "categoria",
      nome: categoryName,
      uso: categoryUsage,
      id_usuario: usuarioId
    };

    console.log("Iniciando adição de categoria. Payload:", payload);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.text();
      console.log("Resposta do webhook (categoria):", result);

      if (!response.ok) {
        throw new Error(`Erro no webhook: ${response.status} ${result}`);
      }

      toast.success("Categoria adicionada com sucesso!");
      // Atualiza a lista para refletir a mudança feita pela automação
      await fetchOptions(usuarioId);
      
      setCategoryName("");
      setCategoryUsage("saida");
      setIsCategoryModalOpen(false);
    } catch (error) {
      console.error("Erro ao processar webhook de categoria:", error);
      toast.error("Erro ao salvar categoria através da automação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMethod = async () => {
    if (!methodName || !usuarioId) return;
    setIsSubmitting(true);

    const payload = {
      acao: "adicionar",
      tipo: "metodo_pagamento",
      nome: methodName,
      id_usuario: usuarioId
    };

    console.log("Iniciando adição de método. Payload:", payload);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.text();
      console.log("Resposta do webhook (método):", result);

      if (!response.ok) {
        throw new Error(`Erro no webhook: ${response.status} ${result}`);
      }

      toast.success("Método de pagamento adicionado!");
      // Atualiza a lista para refletir a mudança feita pela automação
      await fetchOptions(usuarioId);
      
      setMethodName("");
      setIsMethodModalOpen(false);
    } catch (error) {
      console.error("Erro ao processar webhook de método:", error);
      toast.error("Erro ao salvar método através da automação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete || !usuarioId) return;
    setIsSubmitting(true);

    const payload: any = {
      acao: "remover",
      tipo: itemToDelete.type,
      nome: itemToDelete.name,
      id_usuario: usuarioId
    };
    if (itemToDelete.type === "categoria") {
      payload.uso = itemToDelete.usage;
    }

    console.log("Iniciando remoção de item. Payload:", payload);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.text();
      console.log("Resposta do webhook (remoção):", result);

      if (!response.ok) {
        throw new Error(`Erro no webhook: ${response.status} ${result}`);
      }

      toast.success("Item removido com sucesso!");
      // Atualiza a lista para refletir a mudança feita pela automação
      await fetchOptions(usuarioId);
    } catch (error) {
      console.error("Erro ao processar webhook de remoção:", error);
      toast.error("Erro ao remover item através da automação.");
    } finally {
      setIsSubmitting(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main className="flex-1 px-8 py-6 space-y-6">
          <header>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">Personalização</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie suas categorias e métodos de pagamento personalizados.</p>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Card Categorias */}
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Tags className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Categorias</CardTitle>
                      <CardDescription>Adicione ou remova categorias usadas nas suas transações.</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 min-h-[100px]">
                  {loading ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">Carregando categorias...</div>
                  ) : categories.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">Nenhuma categoria encontrada.</div>
                  ) : (
                    categories.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className={`size-2 rounded-full ${cat.uso === 'entrada' ? 'bg-success' : cat.uso === 'saida' ? 'bg-danger' : 'bg-primary'}`} />
                          <span className="font-medium text-sm text-[#1A1A1A]">{cat.Nome}</span>
                          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                            {cat.uso === 'entrada_saida' ? 'Entrada/Saída' : cat.uso === 'entrada' ? 'Entrada' : 'Saída'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8 text-muted-foreground hover:text-danger"
                            onClick={() => setItemToDelete({ id: cat.id, name: cat.Nome, type: "categoria", usage: cat.uso })}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Button 
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-6 flex items-center gap-2"
                >
                  <Plus className="size-4" />
                  <span>Adicionar Categoria</span>
                </Button>
              </CardContent>
            </Card>

            {/* Card Métodos de Pagamento */}
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <CreditCard className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Métodos de Pagamento</CardTitle>
                      <CardDescription>Adicione ou remova os métodos usados nas suas transações.</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 min-h-[100px]">
                  {loading ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">Carregando métodos...</div>
                  ) : paymentMethods.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">Nenhum método encontrado.</div>
                  ) : (
                    paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                            <CreditCard className="size-4" />
                          </div>
                          <span className="font-medium text-sm text-[#1A1A1A]">{method.Nome}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8 text-muted-foreground hover:text-danger"
                            onClick={() => setItemToDelete({ id: method.id, name: method.Nome, type: "metodo_pagamento" })}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Button 
                  onClick={() => setIsMethodModalOpen(true)}
                  className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-6 flex items-center gap-2"
                >
                  <Plus className="size-4" />
                  <span>Adicionar Método</span>
                </Button>
              </CardContent>
            </Card>
          </div>

          <footer className="text-center text-xs text-muted-foreground pt-4 pb-2">
            Financeiro Core © 2025
          </footer>
        </main>
      </div>

      {/* Modal Adicionar Categoria */}
      <Dialog open={isCategoryModalOpen} onOpenChange={(open) => {
        if (!isSubmitting) {
          setIsCategoryModalOpen(open);
          if (!open) {
            setCategoryName("");
            setCategoryUsage("saida");
          }
        }
      }}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl p-6 gap-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Adicionar Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nome da Categoria</Label>
              <Input
                id="cat-name"
                placeholder="Ex: Alimentação"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-usage">Tipo de uso</Label>
              <Select value={categoryUsage} onValueChange={setCategoryUsage}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="entrada_saida">Entrada/Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-row gap-3 sm:justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsCategoryModalOpen(false)}
              className="rounded-xl flex-1 sm:flex-none"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddCategory}
              disabled={!categoryName || isSubmitting}
              className={`rounded-xl flex-1 sm:flex-none ${!categoryName ? 'bg-white text-muted-foreground border hover:bg-white' : 'bg-primary text-white hover:bg-primary/90'}`}
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Adicionar Método */}
      <Dialog open={isMethodModalOpen} onOpenChange={(open) => {
        if (!isSubmitting) {
          setIsMethodModalOpen(open);
          if (!open) setMethodName("");
        }
      }}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl p-6 gap-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Adicionar Método de Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="method-name">Nome do Método</Label>
              <Input
                id="method-name"
                placeholder="Ex: Pix"
                value={methodName}
                onChange={(e) => setMethodName(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="flex-row gap-3 sm:justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsMethodModalOpen(false)}
              className="rounded-xl flex-1 sm:flex-none"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddMethod}
              disabled={!methodName || isSubmitting}
              className={`rounded-xl flex-1 sm:flex-none ${!methodName ? 'bg-white text-muted-foreground border hover:bg-white' : 'bg-primary text-white hover:bg-primary/90'}`}
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alerta de Confirmação de Exclusão */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Deseja excluir {itemToDelete?.type === "categoria" ? "esta categoria" : "este método de pagamento"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. {itemToDelete?.name} será removido(a) permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteItem}
              disabled={isSubmitting}
              className="rounded-xl bg-danger text-white hover:bg-danger/90"
            >
              {isSubmitting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
