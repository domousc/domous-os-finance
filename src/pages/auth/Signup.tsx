import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Mail, Lock, User, Building, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, preencha seu nome completo",
      });
      return;
    }

    if (!formData.company.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, preencha o nome da empresa",
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, preencha seu e-mail",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        variant: "destructive",
        title: "Senha muito curta",
        description: "A senha deve ter no mínimo 8 caracteres",
      });
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Senhas não conferem",
        description: "As senhas digitadas não são iguais",
      });
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await signUp(
      formData.email,
      formData.password,
      formData.name,
      formData.company
    );
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: error.message === "User already registered"
          ? "Este e-mail já está cadastrado"
          : error.message,
      });
      setIsLoading(false);
    } else {
      toast({
        title: "Conta criada com sucesso!",
        description: "Redirecionando...",
      });
      // Navigation will happen via useEffect
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  return (
    <AuthLayout
      title="Crie sua conta"
      subtitle="Comece a gerenciar suas finanças de forma inteligente"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Nome completo
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={formData.name}
                onChange={handleChange}
                className="pl-10 h-12 bg-card border-border focus:border-primary transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="text-sm font-medium">
              Empresa
            </Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="company"
                type="text"
                placeholder="Nome da empresa"
                value={formData.company}
                onChange={handleChange}
                className="pl-10 h-12 bg-card border-border focus:border-primary transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              E-mail
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleChange}
                className="pl-10 h-12 bg-card border-border focus:border-primary transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="pl-10 h-12 bg-card border-border focus:border-primary transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirmar senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="pl-10 h-12 bg-card border-border focus:border-primary transition-colors"
                required
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium group transition-all duration-300"
        >
          {isLoading ? (
            "Criando conta..."
          ) : (
            <>
              Criar conta
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Já tem uma conta? </span>
          <Link
            to="/login"
            className="text-primary hover:text-primary/80 transition-colors font-medium"
          >
            Fazer login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Signup;
