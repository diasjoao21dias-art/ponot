import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import loginBg from "@assets/stock_images/modern_office_busine_8f7d9ebf.jpg";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoggingIn, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(
      { username, password },
      {
        onSuccess: () => setLocation("/"),
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Erro de acesso",
            description: err.message,
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background Image with Blur */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${loginBg})`,
          filter: "blur(8px) brightness(0.7)",
          transform: "scale(1.1)" // Prevent white edges from blur
        }}
      />
      
      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 z-1 bg-black/20" />

      <div className="max-w-md w-full bg-card/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-border/50 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <KeyRound size={32} />
          </div>
          <h1 className="text-2xl font-bold text-foreground font-display">Olivium Sistemas</h1>
          <p className="text-muted-foreground mt-2">Gestão de Ponto</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Usuário</label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-12 bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus:bg-background"
              placeholder="seu.usuario"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Senha</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus:bg-background"
              placeholder="••••••••"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base mt-2 font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg" 
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar no Sistema"
            )}
          </Button>
        </form>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Olivium Sistemas</p>
        </div>
      </div>
    </div>
  );
}
