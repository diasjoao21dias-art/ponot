import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Building2, Save, Loader2, CreditCard, MapPin, Hash } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function SettingsPage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const { data: settings, isLoading } = useQuery<{ 
    companyName: string, 
    cnpj: string,
    cei: string,
    responsibleCpf: string,
    address: string
  }>({
    queryKey: ["/api/settings"],
  });

  const [formData, setFormData] = useState({
    companyName: "",
    cnpj: "",
    cei: "",
    responsibleCpf: "",
    address: ""
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        companyName: settings.companyName ?? "",
        cnpj: settings.cnpj ?? "",
        cei: settings.cei ?? "",
        responsibleCpf: settings.responsibleCpf ?? "",
        address: settings.address ?? ""
      });
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await apiRequest("POST", "/api/settings", formData);
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Sucesso",
        description: "Configurações do empregador atualizadas.",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground">Empregador</h1>
        <p className="text-muted-foreground mt-1">Configure os dados cadastrais da empresa conforme o padrão do sistema</p>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
          <CardTitle className="text-xl font-medium text-slate-700 flex items-center gap-2">
            <Building2 size={22} className="text-slate-400" />
            Dados Cadastrais
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSave} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Tipo</label>
                <div className="h-10 px-4 bg-primary text-white text-sm font-bold rounded flex items-center justify-center w-20">
                  CNPJ
                </div>
              </div>

              <div className="space-y-2 md:col-span-1">
                <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <Hash size={14} /> CNPJ do Empregador
                </label>
                <Input 
                  value={formData.cnpj}
                  onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                  placeholder="00000000000000"
                  className="bg-slate-50 border-slate-200 h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">CEI</label>
                <Input 
                  value={formData.cei}
                  onChange={(e) => setFormData(prev => ({ ...prev, cei: e.target.value }))}
                  placeholder="0000000000000"
                  className="bg-slate-50 border-slate-200 h-11"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <CreditCard size={14} /> CPF do Responsável
                </label>
                <Input 
                  value={formData.responsibleCpf}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsibleCpf: e.target.value }))}
                  placeholder="00000000000"
                  className="bg-slate-50 border-slate-200 h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Razão Social</label>
              <Input 
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="NOME COMPLETO DA EMPRESA LTDA"
                className="bg-slate-50 border-slate-200 h-11 uppercase"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <MapPin size={14} /> Endereço
              </label>
              <Input 
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="RUA, NÚMERO, BAIRRO, CIDADE - UF"
                className="bg-slate-50 border-slate-200 h-11 uppercase"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-8 h-11 gap-2" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
                Salvar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
