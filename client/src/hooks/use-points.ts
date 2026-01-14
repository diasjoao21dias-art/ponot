import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type CreateTimeEntryRequest } from "@shared/routes";
import { z } from "zod";

export function useClockIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTimeEntryRequest) => {
      const validated = api.points.clockIn.input.parse(data);
      const res = await fetch(api.points.clockIn.path, {
        method: api.points.clockIn.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) throw new Error("Erro ao registrar ponto");
      return api.points.clockIn.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.points.list.path] });
    },
  });
}

export function usePoints(filters?: { startDate?: string; endDate?: string; userId?: string }) {
  // Serialize filters to use as query key dependency
  const filterKey = JSON.stringify(filters);
  
  return useQuery({
    queryKey: [api.points.list.path, filterKey],
    queryFn: async () => {
      const url = new URL(api.points.list.path, window.location.origin);
      if (filters?.startDate) url.searchParams.set("startDate", filters.startDate);
      if (filters?.endDate) url.searchParams.set("endDate", filters.endDate);
      if (filters?.userId) url.searchParams.set("userId", filters.userId);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Falha ao buscar registros de ponto");
      return api.points.list.responses[200].parse(await res.json());
    },
  });
}

export function useExportAfd() {
  return async (filters?: { startDate?: string; endDate?: string; userId?: string }) => {
    const url = new URL(api.points.exportAfd.path, window.location.origin);
    if (filters?.startDate) url.searchParams.set("startDate", filters.startDate);
    if (filters?.endDate) url.searchParams.set("endDate", filters.endDate);
    if (filters?.userId) url.searchParams.set("userId", filters.userId);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("Falha ao exportar AFD");
    
    // Trigger download
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `afd_export_${filters?.startDate || 'all'}_${filters?.endDate || 'all'}.txt`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
}
