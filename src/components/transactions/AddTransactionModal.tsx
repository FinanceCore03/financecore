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
    if (!categoria || !quantia || !metodo || !descricao) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: userData, error: userError } = await supabase
        .from("Usuarios")
        .select("id")
        .eq("id_auth", user.id)
        .single();

      if (userError || !userData) throw new Error("Usuário não encontrado");

      const { error } = await supabase.from("Transacoes").insert({
        id_usuario: userData.id,
        tipo,
        categoria,
        data: data.toISOString(),
        valor: quantia.replace(",", "."),
        metodo_pagamento: metodo,
        descricao,
      });

      if (error) throw error;

      toast.success("Transação adicionada com sucesso!");
      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error("Erro ao salvar transação: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-card border-none shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className="p-6 space-y-6">
            <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <DialogTitle className="text-xl font-bold">Adicionar Transação</DialogTitle>
              <button 
                onClick={handleClose}
                className="rounded-full p-1 hover:bg-muted transition-colors"
              >
                <X className="size-5 text-muted-foreground" />
              </button>
            </DialogHeader>

            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="tipo" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger id="tipo" className="rounded-xl border-border bg-muted/30 focus:ring-primary/20">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="entrada" className="text-success font-medium">Entrada</SelectItem>
                    <SelectItem value="saida" className="text-danger font-medium">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="categoria" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger id="categoria" className="rounded-xl border-border bg-muted/30 focus:ring-primary/20">
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
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal rounded-xl border-border bg-muted/30 hover:bg-muted/50 focus:ring-primary/20 ${!data && "text-muted-foreground"}`}
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
                <Label htmlFor="quantia" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quantia</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
                  <Input
                    id="quantia"
                    placeholder="0,00"
                    value={quantia}
                    onChange={(e) => setQuantia(e.target.value)}
                    className="pl-9 rounded-xl border-border bg-muted/30 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="metodo" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Método de Pagamento</Label>
                <Select value={metodo} onValueChange={setMetodo}>
                  <SelectTrigger id="metodo" className="rounded-xl border-border bg-muted/30 focus:ring-primary/20">
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {paymentMethods.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="descricao" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição</Label>
                <Input
                  id="descricao"
                  placeholder="Ex: Compra do mês"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="rounded-xl border-border bg-muted/30 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="flex-1 rounded-xl text-muted-foreground hover:bg-muted font-semibold"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-md shadow-primary/20"
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
