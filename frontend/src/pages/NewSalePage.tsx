import React, { useState, useEffect } from "react";
import { MainLayout } from "../components/MainLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { saleService } from "../services/sale.service";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function NewSalePage() {
  const [salespersons, setSalespersons] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);

  const [salespersonId, setSalespersonId] = useState("");
  const [productId, setProductId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [amount, setAmount] = useState("");
  const [soldAt, setSoldAt] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [sp, pr, rg] = await Promise.all([
          api.get("/salespersons"),
          api.get("/products"),
          api.get("/regions")
        ]);
        setSalespersons(sp.data);
        setProducts(pr.data);
        setRegions(rg.data);
      } catch (e) {
        toast.error("Erro ao carregar dados do formulário");
      }
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saleService.create({
        salespersonId,
        productId,
        regionId,
        amount: Number(amount),
        currency: "BRL",
        soldAt: soldAt || new Date().toISOString()
      });
      toast.success("Venda criada com sucesso!");
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Erro ao criar venda");
    }
  };

  return (
    <MainLayout>
      <div className="flex h-full w-full flex-col p-6 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Nova Venda</h1>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Registrar Venda</CardTitle>
            <CardDescription>Preencha os dados da nova venda abaixo.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Vendedor</Label>
                <Select value={salespersonId} onValueChange={(val) => setSalespersonId(val || "")}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {salespersons.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Produto</Label>
                <Select value={productId} onValueChange={(val) => setProductId(val || "")}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Região</Label>
                <Select value={regionId} onValueChange={(val) => setRegionId(val || "")}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {regions.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Data da Venda</Label>
                <Input type="datetime-local" required value={soldAt} onChange={e => setSoldAt(e.target.value)} />
              </div>

              <Button type="submit" className="w-full">Salvar Venda</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
