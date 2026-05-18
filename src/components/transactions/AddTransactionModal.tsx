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
import { useAuth } from "@/contexts/AuthContext";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const defaultCategories = [
  "Salário",
  "Alimentação",
  "Transporte",
  "Moradia",
  "Lazer",
  "Assinaturas",
  "Saúde",
  "Outros",
];

const defaultPaymentMethods = [
  "Pix",
  "Cartão de Crédito",
  "Cartão de Débito",
  "Dinheiro",
  "Transferência",
  "Boleto",
];

export function AddTransactionModal({ isOpen, onClose, onSuccess }: AddTransactionModalProps) {
  const { user } = useAuth();
  const [tipo, setTipo] = useState<string>("saida");
  const [categoria, setCategoria] = useState<string>("");
  const [data, setData] = useState<Date>(new Date());
  const [dataFinal, setDataFinal] = useState<Date>(new Date());
  const [quantia, setQuantia] = useState<string>("");
  const [metodo, setMetodo] = useState<string>("");
  const [descricao, setDescricao] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(defaultPaymentMethods);

  useEffect(() => {
    async function fetchCustomData() {
      if (!user) return;
      
      try {
        const { data: usuario } = await supabase
          .from("Usuarios")
          .select("id")
          .eq("id_auth", user.id)
          .maybeSingle();

        if (usuario) {
          const { data: customOptions } = await supabase
            .from("Opcoes")
            .select("Nome, Tipo, Uso")
            .eq("id_usuario", usuario.id);

          if (customOptions) {
            const customCats = customOptions
              .filter(opt => opt.Tipo === "categoria" && opt.Nome !== null)
              .map(opt => opt.Nome as string);
            if (customCats.length > 0) setCategories(customCats);

            const customMethods = customOptions
              .filter(opt => opt.Tipo === "metodo_pagamento" && opt.Nome !== null)
              .map(opt => opt.Nome as string);
            if (customMethods.length > 0) setPaymentMethods(customMethods);
          }
        }
      } catch (error) {
        console.error("Error fetching custom data:", error);
      }
    }
    
    if (isOpen) {
      fetchCustomData();
    }
  }, [isOpen, user]);

  const isPeriodMethod = metodo === "Crédito" || metodo === "Parcelado";

  const isFormValid = 
    tipo !== "" && 
    categoria !== "" && 
    quantia !== "" && 
    metodo !== "" && 
    (isPeriodMethod ? (data !== null && dataFinal !== null) : data !== null);

  const isFormDirty = tipo !== "saida" || categoria !== "" || quantia !== "" || metodo !== "" || descricao !== "";

  const resetForm = () => {
    setTipo("saida");
    setCategoria("");
    setData(new Date());
    setDataFinal(new Date());
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

    setLoading(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Usuário não autenticado no sistema.");

      const { data: usuario, error: erroUsuario } = await supabase
        .from("Usuarios")
        .select("id")
        .eq("id_auth", user.id)
        .maybeSingle();

      if (erroUsuario || !usuario) throw new Error("Seu usuário não foi encontrado.");
      
      let payload: any = {
        tipo,
        quantia: quantia.replace(/\./g, "").replace(",", "."),
        categoria,
        metodo_pagamento: metodo,
        descricao: descricao || "",
        id_usuario: usuario.id,
      };

      if (isPeriodMethod) {
        payload.data_inicial = format(data, "yyyy-MM-dd");
        payload.data_final = format(dataFinal, "yyyy-MM-dd");
      } else {
        payload.data = format(data, "yyyy-MM-dd");
      }

      const response = await fetch("https://autowebhook.dudaclientes.site/webhook/Transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Erro no webhook: ${response.statusText}`);

      toast.success("Transação salva com sucesso!");
      resetForm();
      onSuccess();
      onClose();

    } catch (error: any) {
      toast.error(`Falha ao salvar: ${error.message || "Erro desconhecido"}`);
    } finally {
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

              {isPeriodMethod ? (
                <>
                  <div className="grid gap-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data Inicial</Label>
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
                      <PopoverContent align="start" side="left" className="w-auto p-0 rounded-2xl border-border shadow-xl">
                        <Calendar mode="single" selected={data} onSelect={(date) => date && setData(date)} locale={ptBR} initialFocus className="rounded-2xl" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data Final</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`h-11 w-full justify-start text-left font-normal rounded-xl border-border bg-muted/30 hover:bg-muted/50 focus:ring-primary/20 ${!dataFinal && "text-muted-foreground"}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dataFinal ? format(dataFinal, "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" side="left" className="w-auto p-0 rounded-2xl border-border shadow-xl">
                        <Calendar mode="single" selected={dataFinal} onSelect={(date) => date && setDataFinal(date)} locale={ptBR} initialFocus className="rounded-2xl" />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              ) : (
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
                    <PopoverContent align="start" side="left" className="w-auto p-0 rounded-2xl border-border shadow-xl">
                      <Calendar mode="single" selected={data} onSelect={(date) => date && setData(date)} locale={ptBR} initialFocus className="rounded-2xl" />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

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
