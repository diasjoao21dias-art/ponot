import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateUserRequest, type UpdateUserRequest } from "@shared/routes";
import { z } from "zod";

export function useUsers() {
  return useQuery({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.users.list.path);
      if (!res.ok) throw new Error("Falha ao buscar usuários");
      return api.users.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateUserRequest) => {
      const validated = api.users.create.input.parse(data);
      const res = await fetch(api.users.create.path, {
        method: api.users.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Dados inválidos");
        }
        throw new Error("Erro ao criar usuário");
      }
      return api.users.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateUserRequest & { id: number }) => {
      const validated = api.users.update.input.parse(data);
      const url = buildUrl(api.users.update.path, { id });
      
      const res = await fetch(url, {
        method: api.users.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) throw new Error("Erro ao atualizar usuário");
      return api.users.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.users.delete.path, { id });
      const res = await fetch(url, { method: api.users.delete.method });
      if (!res.ok) throw new Error("Erro ao excluir usuário");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
    },
  });
}
