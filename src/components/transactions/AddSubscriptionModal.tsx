import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  usuarioId: number | null;
}

const paymentMethods = ["Crédito", "Débito", "Pix", "Dinheiro", "Parcelado", "Boleto", "Transferência"];

export function AddSubscriptionModal({ isOpen, onClose, onSuccess, usuarioId }: AddSubscriptionModalProps) {
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [metodo, setMetodo] = useState("");
  const [diaCobranca, setDiaCobranca] = useState("");
  const [dataPagamento, setDataPagamento] = useState<Date | undefined>(new Date());
  const [dataExpiracao, setDataExpiracao] = useState<Date | undefined>(undefined);
  const [expiracaoIndefinida, setExpiracaoIndefinida] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);

  const isFormValid = !!(nome && valor && metodo && diaCobranca && dataPagamento && (expiracaoIndefinida || dataExpiracao));

  const resetForm = () => {
    setNome("");
    setValor("");
    setMetodo("");
    setDiaCobranca("");
    setDataPagamento(new Date());
    setDataExpiracao(undefined);
    setDescricao("");
  };

  const handleSave = async () => {
    if (!isFormValid || !usuarioId) return;

    setLoading(true);

    const payload: any = {
      acao: "adicionar",
      nome,
      categoria: "Assinatura",
      valor: valor.replace(/\./g, "").replace(",", "."),
      metodo_pagamento: metodo,
      dia_cobranca: diaCobranca,
      data_pagamento: dataPagamento ? format(dataPagamento, "yyyy-MM-dd") : "",
      data_expiracao: dataExpiracao ? format(dataExpiracao, "yyyy-MM-dd") : "",
      descricao,
      status: true,
      id_usuario: usuarioId,
    };


    console.log("Payload assinatura:", payload);

    try {
      const response = await fetch("https://autowebhook.dudaclientes.site/webhook/Transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("Resposta webhook assinatura:", response);

      if (!response.ok) throw new Error("Erro ao salvar assinatura");

      toast.success("Assinatura adicionada com sucesso!");
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.log("Erro assinatura:", error);
      toast.error("Erro ao adicionar assinatura. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-card border-none shadow-2xl">
        <div className="p-6 space-y-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Adicionar Assinatura</DialogTitle>
          </DialogHeader>

          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="nome" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome da assinatura</Label>
              <Input
                id="nome"
                placeholder="Ex: Netflix, Spotify"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="h-11 rounded-xl border-border bg-muted/30 focus:ring-primary/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="valor" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valor Mensal</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
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
                <Input
                  id="categoria"
                  value="Assinatura"
                  disabled
                  className="h-11 rounded-xl border-border bg-muted/10 text-muted-foreground font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="metodo" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Método de Pagamento</Label>
                <Select value={metodo} onValueChange={setMetodo}>
                  <SelectTrigger id="metodo" className="h-11 rounded-xl border-border bg-muted/30 focus:ring-primary/20">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {paymentMethods.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dia" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dia de cobrança</Label>
                <Input
                  id="dia"
                  type="number"
                  placeholder="Ex: 10"
                  value={diaCobranca}
                  onChange={(e) => setDiaCobranca(e.target.value)}
                  className="h-11 rounded-xl border-border bg-muted/30 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Data de pagamento
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-11 w-full justify-start text-left font-normal rounded-xl border-border bg-muted/30 hover:bg-muted/50 focus:ring-primary/20"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {dataPagamento ? format(dataPagamento, "dd/MM/yyyy") : <span>Selecione</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0 rounded-2xl border-border shadow-xl">
                    <Calendar mode="single" selected={dataPagamento} onSelect={setDataPagamento} locale={ptBR} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data de expiração</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-11 w-full justify-start text-left font-normal rounded-xl border-border bg-muted/30 hover:bg-muted/50 focus:ring-primary/20"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {dataExpiracao ? format(dataExpiracao, "dd/MM/yyyy") : <span>Selecione</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0 rounded-2xl border-border shadow-xl">
                    <Calendar mode="single" selected={dataExpiracao} onSelect={setDataExpiracao} locale={ptBR} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descricao" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição (opcional)</Label>
              <Input
                id="descricao"
                placeholder="Ex: Plano familiar"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="h-11 rounded-xl border-border bg-muted/30 focus:ring-primary/20"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border-border hover:bg-muted transition-colors"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!isFormValid || loading}
              onClick={handleSave}
              className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Salvar Assinatura"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
