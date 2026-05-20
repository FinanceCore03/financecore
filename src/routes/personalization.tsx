import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { PageTransition, AnimatedItem } from "@/components/PageTransition";
import { Tags, CreditCard, Plus, Trash2 } from "lucide-react";
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

export const Route = createFileRoute("/personalization")({
  head: () => ({
    meta: [
      { title: "Personalização — Financeiro Core" },
    ],
  }),
  component: () => <PersonalizationPage />,
});

function PersonalizationPage() {
  const { user } = useAuth();
  const { moeda } = useDashboardData();
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  useEffect(() => {
    async function fetchUserData() {
      if (!user) return;
      const { data: usuario } = await supabase.from("Usuarios").select("id").eq("id_auth", user.id).maybeSingle();
      if (usuario) {
        setUsuarioId(usuario.id);
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
    setIsCategoryModalOpen(false);
    toast.success("Funcionalidade em desenvolvimento via Webhook.");
  };

  const handleDeleteItem = async () => {
    setItemToDelete(null);
    toast.success("Item removido.");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <PageTransition>
          <main className="flex-1 px-8 py-8 space-y-6">
            <AnimatedItem>
              <header>
                <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">Personalização</h1>
                <p className="text-sm text-muted-foreground mt-1">Gerencie suas preferências.</p>
              </header>
            </AnimatedItem>

            <AnimatedItem>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm bg-white">
                  <CardHeader><CardTitle>Categorias</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {categories.map(cat => (
                        <div key={cat.id} className="flex justify-between p-3 border rounded-xl">
                          <span>{cat.Nome}</span>
                          <button onClick={() => setItemToDelete(cat)} className="text-muted-foreground hover:text-danger"><Trash2 size={16}/></button>
                        </div>
                      ))}
                    </div>
                    <Button onClick={() => setIsCategoryModalOpen(true)} className="w-full">Adicionar Categoria</Button>
                  </CardContent>
                </Card>
              </div>
            </AnimatedItem>

            <footer className="text-center text-xs text-muted-foreground pt-4 pb-2">
              Financeiro Core © 2025
            </footer>
          </main>
        </PageTransition>
      </div>

      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Nova Categoria</DialogTitle></DialogHeader>
          <div className="py-4">
            <Label>Nome</Label>
            <Input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
          </div>
          <DialogFooter><Button onClick={handleAddCategory}>Salvar</Button></DialogFooter>
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