import { useState } from "react";
import { usePoints, useExportAfd } from "@/hooks/use-points";
import { useUsers } from "@/hooks/use-users";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Filter, FileText, Loader2, FileSpreadsheet, FileJson } from "lucide-react";
import { type TimeEntry } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

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
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleExportAFD = async () => {
    try {
      setIsExporting("afd");
      await exportAfd({ 
        startDate, 
        endDate,
        userId: selectedUser !== "all" ? selectedUser : undefined
      });
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPDF = () => {
    if (!points) return;
    const doc = new jsPDF();
    
    // Header styling
    doc.setFillColor(37, 99, 235); // Primary color
    doc.rect(0, 0, 210, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Olivium Sistemas", 14, 20);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Gestão de Ponto", 14, 30);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`Período: ${format(new Date(startDate), "dd/MM/yyyy")} - ${format(new Date(endDate), "dd/MM/yyyy")}`, 140, 25);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 140, 32);

    const tableData = points.map(p => [
      format(new Date(p.timestamp), "dd/MM/yyyy HH:mm:ss"),
      p.user?.name || "N/A",
      p.user?.document || "N/A",
      p.type.toUpperCase(),
      `#${p.id}`
    ]);

    autoTable(doc, {
      head: [["Data/Hora", "Funcionário", "CPF/Doc", "Tipo", "ID"]],
      body: tableData,
      startY: 50,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        3: { fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const val = String(data.cell.raw).toLowerCase();
          if (val === 'entrada') {
            data.cell.styles.textColor = [22, 163, 74];
          } else if (val === 'saída' || val === 'saida') {
            data.cell.styles.textColor = [220, 38, 38];
          }
        }
      }
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount} - Olivium Sistemas Gestão de Ponto`, 105, 285, { align: "center" });
    }

    doc.save(`relatorio_ponto_${startDate}_${endDate}.pdf`);
  };

  const handleExportExcel = () => {
    if (!points) return;
    const data = points.map(p => ({
      "Data": format(new Date(p.timestamp), "dd/MM/yyyy"),
      "Hora": format(new Date(p.timestamp), "HH:mm:ss"),
      "Funcionário": p.user?.name || "N/A",
      "Documento": p.user?.document || "N/A",
      "Tipo de Registro": p.type.toUpperCase(),
      "ID Sistema": p.id
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Set column widths
    const wscols = [
      { wch: 12 }, // Data
      { wch: 10 }, // Hora
      { wch: 30 }, // Funcionário
      { wch: 15 }, // Documento
      { wch: 15 }, // Tipo
      { wch: 10 }, // ID
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registros de Ponto");
    XLSX.writeFile(workbook, `relatorio_ponto_${startDate}_${endDate}.xlsx`);
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
          <h1 className="text-3xl font-bold font-display text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-1">Visualize e exporte o histórico de registros</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={handleExportAFD} 
            disabled={!!isExporting}
            variant="outline"
            className="gap-2"
          >
            {isExporting === "afd" ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
            AFD
          </Button>
          <Button 
            onClick={handleExportPDF} 
            disabled={!!isExporting || !points?.length}
            variant="outline"
            className="gap-2"
          >
            <Download size={18} />
            PDF
          </Button>
          <Button 
            onClick={handleExportExcel} 
            disabled={!!isExporting || !points?.length}
            variant="outline"
            className="gap-2"
          >
            <FileSpreadsheet size={18} />
            Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm bg-card/50 backdrop-blur relative z-30">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-foreground">Funcionário</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="bg-background border-border w-full">
                  <SelectValue placeholder="Todos os funcionários" />
                </SelectTrigger>
                <SelectContent 
                  position="popper" 
                  sideOffset={4}
                  className="z-[100] bg-popover text-popover-foreground shadow-md border rounded-md min-w-[var(--radix-select-trigger-width)]"
                >
                  <SelectItem value="all">Todos os funcionários</SelectItem>
                  {users?.map(u => (
                    <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Data Início</label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="bg-background border-border"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Data Fim</label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="bg-background border-border"
              />
            </div>

            <Button variant="outline" className="gap-2 border-border hover:bg-muted">
              <Filter size={16} /> Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-0">
        {/* Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50">
            <CardTitle className="text-lg">Registros por Dia</CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderRadius: '8px', 
                    border: '1px solid hsl(var(--border))',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="space-y-4">
          <Card className="bg-primary/5 border-primary/10 shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-primary mb-1">Total de Registros</p>
              <p className="text-4xl font-bold text-foreground">{points?.length || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-card">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground mb-1">Funcionários Ativos</p>
              <p className="text-4xl font-bold text-foreground">
                {new Set(points?.map(p => p.userId)).size}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Table */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle className="text-lg">Detalhamento</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border/50">
                <tr>
                  <th className="px-6 py-4">Data/Hora</th>
                  <th className="px-6 py-4">Funcionário</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4 text-right">ID Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr><td colSpan={4} className="p-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Carregando registros...
                  </td></tr>
                ) : points?.length === 0 ? (
                  <tr><td colSpan={4} className="p-12 text-center text-muted-foreground italic">Nenhum registro encontrado no período.</td></tr>
                ) : (
                  points?.map((point) => (
                    <tr key={point.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-muted-foreground">
                        {format(new Date(point.timestamp), "dd/MM/yyyy HH:mm:ss")}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {point.user?.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          point.type === 'entrada' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                        }`}>
                          {point.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground/50 text-xs">#{point.id}</td>
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
