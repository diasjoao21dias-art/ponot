import { useState, useEffect } from "react";
import { useCreateUser, useUpdateUser } from "@/hooks/use-users";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface UserDialogProps {
  user?: User;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UserDialog({ user, trigger, open, onOpenChange }: UserDialogProps) {
  const isEditing = !!user;
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  // Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [role, setRole] = useState<"admin" | "employee">("employee");

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  // Reset form when opening/changing user
  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setName(user.name);
      setDocument(user.document || "");
      setRole(user.role as "admin" | "employee");
      setPassword(""); // Don't prefill password
    } else {
      setUsername("");
      setName("");
      setDocument("");
      setRole("employee");
      setPassword("");
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing) {
        await updateUser.mutateAsync({
          id: user.id,
          username,
          name,
          document,
          role,
          ...(password ? { password } : {}) // Only send password if provided
        });
        toast({ title: "Sucesso", description: "Usuário atualizado com sucesso." });
      } else {
        await createUser.mutateAsync({
          username,
          password, // Required for new users
          name,
          document,
          role
        });
        toast({ title: "Sucesso", description: "Usuário criado com sucesso." });
      }
      handleOpenChange(false);
    } catch (err: any) {
      toast({ 
        title: "Erro", 
        description: err.message || "Ocorreu um erro ao salvar.", 
        variant: "destructive" 
      });
    }
  };

  const handleOpenChange = (val: boolean) => {
    setIsOpen(val);
    onOpenChange?.(val);
  };

  const isPending = createUser.isPending || updateUser.isPending;

  return (
    <Dialog open={open ?? isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Funcionário" : "Novo Funcionário"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              placeholder="João da Silva"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input 
                id="username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                placeholder="joao.silva"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Funcionário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="document">CPF/PIS (Para AFD)</Label>
            <Input 
              id="document" 
              value={document} 
              onChange={(e) => setDocument(e.target.value)} 
              placeholder="000.000.000-00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {isEditing ? "Nova Senha (opcional)" : "Senha"}
            </Label>
            <Input 
              id="password" 
              type="password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required={!isEditing} 
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Salvar Alterações" : "Criar Funcionário"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
