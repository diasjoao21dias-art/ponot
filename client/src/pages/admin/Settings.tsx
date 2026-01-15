import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Building2, Save, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function SettingsPage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const { data: settings, isLoading } = useQuery<{ companyName: string, cnpj: string }>({
    queryKey: ["/api/settings"],
  });

  const [formData, setFormData] = useState({
    companyName: "",
    cnpj: ""
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        companyName: settings.companyName,
        cnpj: settings.cnpj
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
        description: "Configurações da empresa atualizadas.",
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
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground">Empresa</h1>
        <p className="text-muted-foreground mt-1">Configure os dados da empresa para os relatórios e AFD</p>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 size={20} className="text-primary" />
            Dados Cadastrais
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Razão Social</label>
              <Input 
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Ex: Minha Empresa LTDA"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">CNPJ</label>
              <Input 
                value={formData.cnpj}
                onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                placeholder="00.000.000/0000-00"
                required
              />
              <p className="text-[10px] text-muted-foreground">O CNPJ será usado na geração do arquivo AFD.</p>
            </div>

            <Button type="submit" className="w-full gap-2" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
              Salvar Configurações
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
