import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useClockIn, usePoints } from "@/hooks/use-points";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, LogIn, LogOut, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const clockIn = useClockIn();
  
  // Real-time clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch recent points for current user
  const { data: history, isLoading } = usePoints({ userId: String(user?.id) });

  const handleRegister = async (type: "entrada" | "saida") => {
    try {
      await clockIn.mutateAsync({ type });
      toast({
        title: "Ponto Registrado",
        description: `Sua ${type} foi registrada com sucesso às ${format(new Date(), "HH:mm")}.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.message || "Falha ao registrar ponto.",
      });
    }
  };

  const todayPoints = history?.filter(p => 
    format(new Date(p.timestamp), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  ) || [];

  const lastPoint = todayPoints[todayPoints.length - 1];
  const isWorking = lastPoint?.type === 'entrada';

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <div className="flex flex-col md:flex-row gap-8 items-stretch">
        {/* Clock Card */}
        <Card className="flex-1 bg-gradient-to-br from-primary to-blue-600 text-white border-none shadow-xl">
          <CardContent className="p-8 flex flex-col items-center justify-center h-full text-center space-y-2">
            <p className="text-blue-100 text-lg capitalize">
              {format(now, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
            <h2 className="text-6xl font-bold font-mono tracking-wider tabular-nums">
              {format(now, "HH:mm:ss")}
            </h2>
            <div className="pt-6 w-full grid grid-cols-2 gap-4">
              <Button 
                onClick={() => handleRegister("entrada")}
                disabled={clockIn.isPending} // Allow multiple entries for testing/flexibility, or condition on !isWorking
                className="bg-white/20 hover:bg-white/30 text-white border-0 h-14 text-lg font-semibold"
              >
                {clockIn.isPending ? <Loader2 className="animate-spin" /> : <LogIn className="mr-2" />}
                Entrada
              </Button>
              <Button 
                onClick={() => handleRegister("saida")}
                disabled={clockIn.isPending}
                className="bg-white/10 hover:bg-white/20 text-white border-0 h-14 text-lg font-semibold"
              >
                {clockIn.isPending ? <Loader2 className="animate-spin" /> : <LogOut className="mr-2" />}
                Saída
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card className="w-full md:w-80 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="relative flex items-center justify-center">
                <div className={`w-3 h-3 rounded-full ${isWorking ? 'bg-green-500' : 'bg-slate-300'}`} />
                {isWorking && (
                  <div className="absolute w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75" />
                )}
              </div>
              Status Atual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm text-slate-500">Último Registro</p>
              <p className="text-2xl font-semibold mt-1">
                {lastPoint ? format(new Date(lastPoint.timestamp), "HH:mm") : "--:--"}
              </p>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-2 ${
                lastPoint?.type === 'entrada' ? 'bg-green-100 text-green-700' : 
                lastPoint?.type === 'saida' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {lastPoint ? lastPoint.type.toUpperCase() : "SEM REGISTROS"}
              </span>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-500 mb-2">Registros de Hoje</p>
              <div className="space-y-2">
                {todayPoints.length === 0 && <p className="text-sm text-slate-400 italic">Nenhum registro hoje.</p>}
                {todayPoints.map((p) => (
                  <div key={p.id} className="flex justify-between items-center text-sm">
                    <span className="capitalize text-slate-700">{p.type}</span>
                    <span className="font-mono text-slate-500">{format(new Date(p.timestamp), "HH:mm")}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            Histórico Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Hora</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3 text-right">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Carregando histórico...
                    </td>
                  </tr>
                )}
                {history?.slice(0, 10).map((point) => (
                  <tr key={point.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {format(new Date(point.timestamp), "dd/MM/yyyy")}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono">
                      {format(new Date(point.timestamp), "HH:mm:ss")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        point.type === 'entrada' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-orange-50 text-orange-700 border border-orange-200'
                      }`}>
                        {point.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400 font-mono text-xs">
                      #{point.id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
