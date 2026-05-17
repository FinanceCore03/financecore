import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Tags, CreditCard, Plus, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/personalization")({
  head: () => ({
    meta: [
      { title: "Personalização — Financeiro Core" },
    ],
  }),
  component: () => <PersonalizationPage />,
});

function PersonalizationPage() {
  const [categories, setCategories] = useState([
    { id: 1, name: "Alimentação", type: "Saída" },
    { id: 2, name: "Transporte", type: "Saída" },
    { id: 3, name: "Moradia", type: "Saída" },
    { id: 4, name: "Lazer", type: "Saída" },
    { id: 5, name: "Saúde", type: "Saída" },
    { id: 6, name: "Assinaturas", type: "Saída" },
    { id: 7, name: "Salário", type: "Entrada" },
    { id: 8, name: "Outros", type: "Saída" },
  ]);

  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, name: "Pix" },
    { id: 2, name: "Cartão de Crédito" },
    { id: 3, name: "Cartão de Débito" },
    { id: 4, name: "Dinheiro" },
    { id: 5, name: "Transferência" },
    { id: 6, name: "Boleto" },
  ]);

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
                      <CardDescription>Adicione, edite ou remova categorias usadas nas suas transações.</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={`size-2 rounded-full ${cat.type === 'Entrada' ? 'bg-success' : 'bg-danger'}`} />
                        <span className="font-medium text-sm text-[#1A1A1A]">{cat.name}</span>
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                          {cat.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-primary">
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-danger">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-6 flex items-center gap-2">
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
                      <CardDescription>Adicione, ou remova os métodos usados nas suas transações.</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                          <CreditCard className="size-4" />
                        </div>
                        <span className="font-medium text-sm text-[#1A1A1A]">{method.name}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-primary">
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-danger">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-6 flex items-center gap-2">
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
    </div>
  );
}
