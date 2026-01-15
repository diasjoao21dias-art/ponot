import { useState, useEffect } from "react";
import { useUsers, useDeleteUser } from "@/hooks/use-users";
import { UserDialog } from "@/components/UserDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreVertical, Pencil, Trash2, Shield, User as UserIcon, Building2, CreditCard, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type Settings, updateSettingsSchema, type User } from "@shared/schema";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function UsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useUsers();
  const deleteUser = useDeleteUser();
  const [search, setSearch] = useState("");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);

  const { data: settings } = useQuery<Settings>({ 
    queryKey: [api.settings.get.path] 
  });

  const updateSettings = useMutation({
    mutationFn: async (data: { companyName: string; cnpj: string }) => {
      const res = await fetch(api.settings.update.path, {
        method: api.settings.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao atualizar configurações");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.settings.get.path] });
      toast({ title: "Sucesso", description: "Configurações atualizadas!" });
    }
  });

  const settingsForm = useForm({
    resolver: zodResolver(updateSettingsSchema),
    defaultValues: {
      companyName: "",
      cnpj: ""
    }
  });

  useEffect(() => {
    if (settings) {
      settingsForm.reset({
        companyName: settings.companyName,
        cnpj: settings.cnpj
      });
    }
  }, [settings, settingsForm]);

  const onSettingsSubmit = async (data: any) => {
    try {
      await updateSettings.mutateAsync(data);
      setIsSettingsDialogOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro", description: err.message });
    }
  };

  const filteredUsers = users?.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900">Funcionários</h1>
          <p className="text-slate-500 mt-1">Gerencie o acesso e cadastro dos colaboradores</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Building2 size={18} />
                Empresa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Configurações da Empresa</DialogTitle>
              </DialogHeader>
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={settingsForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Razão Social</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={settingsForm.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9" placeholder="00.000.000/0000-00" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={updateSettings.isPending}>
                    {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <UserDialog 
            open={isDialogOpen} 
            onOpenChange={setIsDialogOpen} 
            trigger={
              <Button className="gap-2 shadow-lg shadow-primary/20">
                <Plus size={18} />
                Novo Funcionário
              </Button>
            } 
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              placeholder="Buscar por nome ou usuário..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 w-12">Avatar</th>
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4">Usuário</th>
              <th className="px-6 py-4">Função</th>
              <th className="px-6 py-4">Documento</th>
              <th className="px-6 py-4">Cadastro</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">Carregando...</td>
              </tr>
            )}
            
            {filteredUsers?.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                <td className="px-6 py-4 text-slate-500">{user.username}</td>
                <td className="px-6 py-4">
                  {user.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                      <Shield size={12} /> Administrador
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      <UserIcon size={12} /> Funcionário
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-500 font-mono text-xs">{user.document || "-"}</td>
                <td className="px-6 py-4 text-slate-500">
                  {format(new Date(user.createdAt), "dd/MM/yyyy")}
                </td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setEditingUser(user)}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600"
                        onClick={() => setUserToDelete(user)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
      {editingUser && (
        <UserDialog 
          user={editingUser} 
          open={!!editingUser} 
          onOpenChange={(open) => !open && setEditingUser(null)} 
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o usuário 
              <span className="font-bold text-slate-900"> {userToDelete?.name} </span>
              e todo seu histórico de pontos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (userToDelete) deleteUser.mutate(userToDelete.id);
                setUserToDelete(null);
              }}
            >
              Excluir Usuário
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
