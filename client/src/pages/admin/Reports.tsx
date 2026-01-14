import { useState } from "react";
import { usePoints, useExportAfd } from "@/hooks/use-points";
import { useUsers } from "@/hooks/use-users";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Filter, FileText, Loader2 } from "lucide-react";
import { type TimeEntry } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [selectedUser, setSelectedUser] = useState<string>("all");

  const { data: users } = useUsers();
  const { data: points, isLoading } = usePoints({ 
    startDate, 
    endDate, 
    userId: selectedUser !== "all" ? selectedUser : undefined 
  });
  
  const exportAfd = useExportAfd();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportAfd({ startDate, endDate });
    } finally {
      setIsExporting(false);
    }
  };

  // Process data for chart
  const chartData = points?.reduce((acc: any[], point) => {
    const date = format(new Date(point.timestamp), "dd/MM");
    const existing = acc.find(p => p.date === date);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ date, count: 1 });
    }
    return acc;
  }, []).sort((a: any, b: any) => a.date.localeCompare(b.date)) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900">Relatórios</h1>
          <p className="text-slate-500 mt-1">Visualize e exporte o histórico de registros</p>
        </div>
        <Button 
          onClick={handleExport} 
          disabled={isExporting}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isExporting ? <Loader2 className="animate-spin" /> : <Download size={18} />}
          Exportar AFD
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium text-slate-700">Funcionário</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os funcionários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os funcionários</SelectItem>
                  {users?.map(u => (
                    <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Data Início</label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Data Fim</label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
              />
            </div>

            <Button variant="outline" className="gap-2">
              <Filter size={16} /> Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Registros por Dia</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="space-y-4">
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-blue-600 mb-1">Total de Registros</p>
              <p className="text-3xl font-bold text-blue-900">{points?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-500 mb-1">Funcionários Ativos</p>
              <p className="text-3xl font-bold text-slate-900">
                {new Set(points?.map(p => p.userId)).size}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Data/Hora</th>
                  <th className="px-6 py-4">Funcionário</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4 text-right">ID Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-500">Carregando...</td></tr>
                ) : points?.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-500">Nenhum registro encontrado no período.</td></tr>
                ) : (
                  points?.map((point) => (
                    <tr key={point.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-mono text-slate-600">
                        {format(new Date(point.timestamp), "dd/MM/yyyy HH:mm:ss")}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {point.user?.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          point.type === 'entrada' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                        }`}>
                          {point.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-400 text-xs">#{point.id}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
