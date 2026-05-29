import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrencySymbol } from "@/lib/currency";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  moeda: string;
}

export function AddTransactionModal({ isOpen, onClose, onSuccess, moeda }: AddTransactionModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tipo, setTipo] = useState<string>("saida");
  const [categoria, setCategoria] = useState<string>("");
  const [data, setData] = useState<Date>(new Date());
  const [valor, setValor] = useState<string>("");
  const [metodo, setMetodo] = useState<string>("");
  const [descricao, setDescricao] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [numParcelas, setNumParcelas] = useState<string>("1");
  const [jurosParcela, setJurosParcela] = useState<string>("");
  const [semJuros, setSemJuros] = useState(true);

  // Sub-modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [showVencimentoWarning, setShowVencimentoWarning] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryUsage, setNewCategoryUsage] = useState("saida");
  const [newMethodName, setNewMethodName] = useState("");
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);
  const [internalUsuarioId, setInternalUsuarioId] = useState<number | null>(null);
  const [diaVencimento, setDiaVencimento] = useState<string | null>(null);

  const fetchCustomData = async () => {
    if (!user) return;
    
    try {
      const { data: usuario } = await supabase
        .from("Usuarios")
        .select("id, Dia_vencimento")
        .eq("id_auth", user.id)
        .maybeSingle();

      if (usuario) {
        setInternalUsuarioId(usuario.id);
        setDiaVencimento(usuario.Dia_vencimento);
        const { data: customOptions } = await supabase
          .from("Opcoes")
          .select("*")
          .or(`id_usuario.eq.${usuario.id},id_usuario.is.null`);

        if (customOptions) {
          const cats = customOptions
            .filter(opt => (opt.Tipo || "").toLowerCase() === "categoria" && (opt.id_usuario !== null || opt.Padrao === true));
          setCategories(cats);

          const standardMethods = customOptions
            .filter(opt => (opt.Tipo || "").toLowerCase() === "metodo_pagamento" && opt.id_usuario === null);
          const customMethods = customOptions
            .filter(opt => (opt.Tipo || "").toLowerCase() === "metodo_pagamento" && opt.id_usuario !== null);
          
          setPaymentMethods([...standardMethods, ...customMethods]);
        }
      }
    } catch (error) {
      console.error("Error fetching custom data:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCustomData();
    }
  }, [isOpen, user]);

  const handleQuickAddCategory = async () => {
    if (!newCategoryName || !internalUsuarioId) return;
    setIsSubmittingQuick(true);

    const payload = {
      acao: "adicionar",
      tipo: "categoria",
      nome: newCategoryName,
      uso: newCategoryUsage,
      id_usuario: internalUsuarioId
    };

    try {
      const response = await fetch("https://autowebhook.dudaclientes.site/webhook/Transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Erro no webhook");

      toast.success("Categoria adicionada!");
      
      const normalizedUso = newCategoryUsage.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (normalizedUso === "saida" || normalizedUso === "entrada/saida") {
        await supabase
          .from("Planejamento")
          .insert({
            id_usuario: internalUsuarioId,
            Categoria: newCategoryName,
            Valor: "0",
            "Período": new Date().toISOString().split('T')[0]
          } as any);
      }

      await fetchCustomData();
      setCategoria(newCategoryName);
      setIsCategoryModalOpen(false);
      setNewCategoryName("");
    } catch (error) {
      toast.error("Erro ao adicionar categoria.");
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  const handleQuickAddMethod = async () => {
    if (!newMethodName || !internalUsuarioId) return;
    setIsSubmittingQuick(true);

    const payload = {
      acao: "adicionar",
      tipo: "metodo_pagamento",
      nome: newMethodName,
      id_usuario: internalUsuarioId
    };

    try {
      const response = await fetch("https://autowebhook.dudaclientes.site/webhook/Transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Erro no webhook");

      toast.success("Método adicionado!");
      await fetchCustomData();
      setMetodo(newMethodName);
      setIsMethodModalOpen(false);
      setNewMethodName("");
    } catch (error) {
      toast.error("Erro ao adicionar método.");
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  const isCreditoVista = metodo === "Crédito à vista" || metodo === "Crédito";
  const isCreditoParcelado = metodo.toLowerCase().includes("parcelado");
  const isCredito = isCreditoVista || isCreditoParcelado;

  const isFormValid = 
    tipo !== "" && 
    categoria !== "" && 
    valor !== "" && 
    metodo !== "" && 
    data !== null &&
    (isCreditoParcelado ? (parseInt(numParcelas) > 0) : true) &&
    (!semJuros ? jurosParcela !== "" : true);

  const isFormDirty = tipo !== "saida" || categoria !== "" || valor !== "" || metodo !== "" || descricao !== "" || (isCreditoParcelado && numParcelas !== "1") || jurosParcela !== "" || !semJuros;

  const resetForm = () => {
    setTipo("saida");
    setCategoria("");
    setData(new Date());
    setValor("");
    setMetodo("");
    setDescricao("");
    setNumParcelas("1");
    setJurosParcela("");
    setSemJuros(true);
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

    if (isCredito && (!diaVencimento || diaVencimento === "indefinido")) {
      setShowVencimentoWarning(true);
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
        acao: "adicionar",
        tipo,
        valor: valor.replace(/\./g, "").replace(",", "."),
        categoria,
        metodo_pagamento: metodo,
        descricao: descricao || "",
        id_usuario: usuario.id,
        data_inicio: format(data, "yyyy-MM-dd")
      };

      if (isCreditoParcelado) {
        payload.metodo_pagamento = "Crédito Parcelado";
        payload.numero_parcelas = parseInt(numParcelas);
        payload.juros = semJuros ? 0 : (jurosParcela ? parseFloat(jurosParcela.replace(",", ".")) : 0);
      } else if (isCreditoVista) {
        payload.metodo_pagamento = "Crédito à vista";
        payload.juros = semJuros ? 0 : (jurosParcela ? parseFloat(jurosParcela.replace(",", ".")) : 0);
      }

      const response = await fetch("https://autowebhook.dudaclientes.site/webhook/Transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      const isError = 
        responseText.includes("success: false") || 
        responseText.includes("DIA_VENCIMENTO_NAO_CADASTRADO") || 
        responseText.includes("Dia vencimento não cadastrado");

      if (isError && isCredito) {
        setShowVencimentoWarning(true);
        return;
      }

      if (isError) {
        throw new Error(responseText || "Erro ao processar transação");
      }

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
        <DialogContent hideClose className="sm:max-w-[600px] p-0 overflow-hidden bg-card border-none shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className="p-8 space-y-8">
            <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <DialogTitle className="text-2xl font-bold tracking-tight">Adicionar Transação</DialogTitle>
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
                <Label htmlFor="valor" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {isCreditoParcelado ? "Valor da parcela" : "Valor"}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">{getCurrencySymbol(moeda)}</span>
                  <Input
                    id="valor"
                    placeholder="0,00"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    className="h-11 pl-9 rounded-xl border-border bg-muted/30 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="categoria" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categoria</Label>
                <Select value={categoria} onValueChange={(val) => {
                  if (val === "ADD_NEW_CAT") {
                    setIsCategoryModalOpen(true);
                  } else {
                    setCategoria(val);
                  }
                }}>
                  <SelectTrigger id="categoria" className="h-11 rounded-xl border-border bg-muted/30 focus:ring-primary/20">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {categories
                      .filter(cat => {
                        const usage = (cat.Uso || "").toLowerCase();
                        if (usage === "entrada/saída" || usage === "entrada/saida") return true;
                        return usage === tipo.toLowerCase();
                      })
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.Nome}>{cat.Nome}</SelectItem>
                      ))}
                    <SelectItem value="ADD_NEW_CAT" className="text-primary font-bold border-t border-border mt-1 pt-2">
                      + Adicionar Categoria
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="metodo" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Método de Pagamento</Label>
                <Select value={metodo} onValueChange={(val) => {
                  if (val === "ADD_NEW_METHOD") {
                    setIsMethodModalOpen(true);
                  } else {
                    setMetodo(val);
                  }
                }}>
                  <SelectTrigger id="metodo" className="h-11 rounded-xl border-border bg-muted/30 focus:ring-primary/20">
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Crédito à vista">Crédito à vista</SelectItem>
                    <SelectItem value="Crédito Parcelado">Crédito Parcelado</SelectItem>
                    {paymentMethods
                      .filter(m => m.Nome !== "Crédito" && m.Nome !== "Parcelado" && m.Nome !== "Crédito à vista" && m.Nome !== "Crédito Parcelado")
                      .map((m) => (
                        <SelectItem key={m.id} value={m.Nome}>{m.Nome}</SelectItem>
                      ))}
                    <SelectItem value="ADD_NEW_METHOD" className="text-primary font-bold border-t border-border mt-1 pt-2">
                      + Adicionar Método
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isCreditoParcelado && (
                <div className="grid gap-2">
                  <Label htmlFor="numParcelas" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Número de parcelas</Label>
                  <Input
                    id="numParcelas"
                    type="number"
                    min="1"
                    placeholder="Ex: 12"
                    value={numParcelas}
                    onChange={(e) => setNumParcelas(e.target.value)}
                    className="h-11 rounded-xl border-border bg-muted/30 focus:ring-primary/20"
                  />
                </div>
              )}

              {isCredito && (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="jurosParcela" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Juros</Label>
                    <button
                      type="button"
                      onClick={() => {
                        setSemJuros(!semJuros);
                        if (!semJuros) setJurosParcela("");
                      }}
                      className={`text-[10px] px-2 py-1 rounded-md transition-colors ${
                        semJuros 
                          ? "bg-primary/10 text-primary font-bold" 
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {semJuros ? "✓ Sem juros" : "Com juros"}
                    </button>
                  </div>
                  {!semJuros && (
                    <Input
                      id="jurosParcela"
                      placeholder="0,00"
                      value={jurosParcela}
                      onChange={(e) => setJurosParcela(e.target.value)}
                      className="h-11 rounded-xl border-border bg-muted/30 focus:ring-primary/20 animate-in fade-in slide-in-from-top-1"
                    />
                  )}
                  <p className="text-[10px] text-muted-foreground italic">
                    {semJuros ? "A transação não possui juros." : "Informe o valor total de juros."}
                  </p>
                </div>
              )}

              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {isCreditoParcelado ? "Data inicial da compra" : isCreditoVista ? "Data da transação" : "Data"}
                </Label>
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

      {/* Mini Modal Adicionar Categoria */}
      <Dialog open={isCategoryModalOpen} onOpenChange={(open) => {
        if (!isSubmittingQuick) setIsCategoryModalOpen(open);
      }}>
        <DialogContent hideClose className="sm:max-w-[425px] rounded-2xl p-6 gap-6 shadow-2xl border-none bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Adicionar Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-cat-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome da Categoria</Label>
              <Input
                id="new-cat-name"
                placeholder="Ex: Alimentação"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="h-11 rounded-xl border-border bg-muted/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-cat-usage" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo de uso</Label>
              <Select value={newCategoryUsage} onValueChange={setNewCategoryUsage}>
                <SelectTrigger id="new-cat-usage" className="h-11 rounded-xl border-border bg-muted/30">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="entrada/saida">Entrada/Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-4 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setIsCategoryModalOpen(false)}
              className="flex-1 h-12 rounded-xl border-border text-muted-foreground hover:bg-muted font-bold transition-all"
              disabled={isSubmittingQuick}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleQuickAddCategory}
              disabled={!newCategoryName || isSubmittingQuick}
              className={`flex-1 h-12 rounded-xl font-bold transition-all ${
                !newCategoryName 
                  ? "bg-white border border-border text-muted-foreground/50 cursor-not-allowed" 
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {isSubmittingQuick ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mini Modal Adicionar Método */}
      <Dialog open={isMethodModalOpen} onOpenChange={(open) => {
        if (!isSubmittingQuick) setIsMethodModalOpen(open);
      }}>
        <DialogContent hideClose className="sm:max-w-[425px] rounded-2xl p-6 gap-6 shadow-2xl border-none bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Adicionar Método de Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-method-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome do Método</Label>
              <Input
                id="new-method-name"
                placeholder="Ex: Pix Personalizado"
                value={newMethodName}
                onChange={(e) => setNewMethodName(e.target.value)}
                className="h-11 rounded-xl border-border bg-muted/30"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setIsMethodModalOpen(false)}
              className="flex-1 h-12 rounded-xl border-border text-muted-foreground hover:bg-muted font-bold transition-all"
              disabled={isSubmittingQuick}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleQuickAddMethod}
              disabled={!newMethodName || isSubmittingQuick}
              className={`flex-1 h-12 rounded-xl font-bold transition-all ${
                !newMethodName 
                  ? "bg-white border border-border text-muted-foreground/50 cursor-not-allowed" 
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {isSubmittingQuick ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alerta de Vencimento Faltando */}
      <AlertDialog open={showVencimentoWarning} onOpenChange={setShowVencimentoWarning}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Configure o vencimento da fatura</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground pt-2">
              Para cadastrar compras no crédito corretamente, você precisa informar ao menos o dia de vencimento da sua fatura. Isso ajuda o sistema a calcular em qual mês a compra será cobrada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel className="h-11 rounded-xl font-semibold">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowVencimentoWarning(false);
                onClose();
                navigate({ to: "/personalization" });
              }} 

              className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              Ir para Configurações
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
