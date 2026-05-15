import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const categories = [
  "Salário",
  "Alimentação",
  "Transporte",
  "Moradia",
  "Lazer",
  "Assinaturas",
  "Saúde",
  "Outros",
];

const paymentMethods = [
  "Pix",
  "Cartão de Crédito",
  "Cartão de Débito",
  "Dinheiro",
  "Transferência",
  "Boleto",
];

export function AddTransactionModal({ isOpen, onClose, onSuccess }: AddTransactionModalProps) {
  const [tipo, setTipo] = useState<string>("saida");
  const [categoria, setCategoria] = useState<string>("");
  const [data, setData] = useState<Date>(new Date());
  const [quantia, setQuantia] = useState<string>("");
  const [metodo, setMetodo] = useState<string>("");
  const [descricao, setDescricao] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);

  const isFormValid = tipo !== "" && categoria !== "" && quantia !== "" && metodo !== "" && data !== null;
  const isFormDirty = tipo !== "saida" || categoria !== "" || quantia !== "" || metodo !== "" || descricao !== "";

  const resetForm = () => {
    setTipo("saida");
    setCategoria("");
    setData(new Date());
    setQuantia("");
    setMetodo("");
    setDescricao("");
  };

  const handleClose = () => {
    if (isFormDirty) {
      setShowConfirmDiscard(true);
    } else {
      onClose();
    }
  };

  const confirmDiscard = () => {
    setShowConfirmDiscard(false);
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!isFormValid) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    console.log("Iniciando salvamento da transação...");
    setLoading(true);

    try {
      // 1. Pegar o usuário autenticado atual
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      console.log("Auth user completo:", user);
      console.log("Auth user id:", user?.id);
      console.log("Auth user email:", user?.email);

      if (authError || !user) throw new Error("Usuário não autenticado no sistema.");

      // 2. Buscar na tabela Usuarios com o nome exato da tabela
      const { data: usuarioPorAuth, error: erroAuth } = await supabase
        .from("Usuarios")
        .select("id, id_auth, Email, Nome")
        .eq("id_auth", user.id)
        .maybeSingle();

      console.log("Usuário encontrado por id_auth:", usuarioPorAuth);
      console.log("Erro ao buscar por id_auth:", erroAuth);

      // 3. Busca auxiliar pelo e-mail para diagnóstico
      const { data: usuarioPorEmail, error: erroEmail } = await supabase
        .from("Usuarios")
        .select("id, id_auth, Email, Nome")
        .eq("Email", user.email)
        .maybeSingle();

      console.log("Usuário encontrado por Email:", usuarioPorEmail);
      console.log("Erro ao buscar por Email:", erroEmail);

      // 4. Verificações de diagnóstico
      if (usuarioPorEmail && !usuarioPorAuth) {
        console.log("O Email existe na tabela Usuarios, mas o id_auth não corresponde ao user.id do Supabase Auth.");
      }

      if (!usuarioPorAuth && !usuarioPorEmail) {
        console.log("Não existe registro na tabela Usuarios para este usuário autenticado.");
      }

      if (erroAuth) throw new Error(`Erro ao consultar tabela Usuarios: ${erroAuth.message}`);
      if (!usuarioPorAuth) throw new Error("Seu usuário não foi encontrado na tabela 'Usuarios'.");
      
      const userData = usuarioPorAuth;
      console.log("ID interno do usuário encontrado:", userData.id);

      // 3. Preparar Payload
      const payload = {
        tipo,
        quantia: quantia.replace(/\./g, "").replace(",", "."),
        categoria,
        metodo_pagamento: metodo,
        data: format(data, "yyyy-MM-dd"),
        descricao: descricao || "",
        id_usuario: userData.id,
      };

      console.log("Payload preparado para o webhook:", payload);

      // 4. Enviar Webhook
      console.log("Chamando webhook...");
      const response = await fetch("https://autowebhook.dudaclientes.site/webhook/Transacoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("Resposta do webhook recebida. Status:", response.status);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Resposta de erro do servidor:", errorBody);
        throw new Error(`O servidor do webhook retornou erro (${response.status}): ${response.statusText}`);
      }

      console.log("Webhook executado com sucesso!");
      
      // 5. Sucesso
      toast.success("Transação salva com sucesso!");
      resetForm();
      onSuccess();
      onClose();

    } catch (error: any) {
      console.error("FALHA NO PROCESSO DE SALVAMENTO:", error);
      const msg = error.message || "Erro desconhecido";
      toast.error(`Falha ao salvar: ${msg}`);
      alert(`Erro crítico: ${msg}\n\nVerifique o console para mais detalhes.`);
    } finally {
      console.log("Finalizando processo (loading: false)");
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-card border-none shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className="p-8 space-y-8">
            <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <DialogTitle className="text-2xl font-bold tracking-tight">Adicionar Transação</DialogTitle>
              <button 
                onClick={handleClose}
                className="rounded-full p-2 hover:bg-muted transition-colors"
              >
                <X className="size-5 text-muted-foreground" />
              </button>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
              {/* Linha 1 */}
              <div className="grid gap-2">
                <Label htmlFor="tipo" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger id="tipo" className="h-11 rounded-xl border-border bg-muted/30 focus:ring-primary/20">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="entrada" className="text-success font-medium">Entrada</SelectItem>
                    <SelectItem value="saida" className="text-danger font-medium">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="quantia" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quantia</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
                  <Input
                    id="quantia"
                    placeholder="0,00"
                    value={quantia}
                    onChange={(e) => setQuantia(e.target.value)}
                    className="h-11 pl-9 rounded-xl border-border bg-muted/30 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Linha 2 */}
              <div className="grid gap-2">
                <Label htmlFor="categoria" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger id="categoria" className="h-11 rounded-xl border-border bg-muted/30 focus:ring-primary/20">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="metodo" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Método de Pagamento</Label>
                <Select value={metodo} onValueChange={setMetodo}>
                  <SelectTrigger id="metodo" className="h-11 rounded-xl border-border bg-muted/30 focus:ring-primary/20">
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {paymentMethods.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Linha 3 */}
              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`h-11 w-full justify-start text-left font-normal rounded-xl border-border bg-muted/30 hover:bg-muted/50 focus:ring-primary/20 ${!data && "text-muted-foreground"}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {data ? format(data, "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    align="start" 
                    side="left" 
                    className="w-auto p-0 rounded-2xl border-border shadow-xl animate-in fade-in slide-in-from-right-2 duration-200"
                  >
                    <Calendar
                      mode="single"
                      selected={data}
                      onSelect={(date) => date && setData(date)}
                      initialFocus
                      locale={ptBR}
                      className="rounded-2xl"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="descricao" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição</Label>
                <Input
                  id="descricao"
                  placeholder="Ex: Compra do mês"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="h-11 rounded-xl border-border bg-muted/30 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-12 rounded-xl border-border text-muted-foreground hover:bg-muted font-bold transition-all"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading || !isFormValid}
                className={`flex-1 h-12 rounded-xl font-bold shadow-lg transition-all active:scale-[0.98] ${
                  !isFormValid 
                    ? "bg-white border border-border text-muted-foreground/50 cursor-not-allowed opacity-50" 
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
                }`}
              >
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDiscard} onOpenChange={setShowConfirmDiscard}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar transação?</AlertDialogTitle>
            <AlertDialogDescription>
              Você começou a preencher esta transação. Deseja realmente descartar as informações?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard} className="rounded-xl bg-danger text-danger-foreground hover:bg-danger/90">
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
