import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Mail, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, preencha seu e-mail",
      });
      return;
    }

    setIsLoading(true);
    
    const { error } = await resetPassword(email);
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar e-mail",
        description: error.message,
      });
      setIsLoading(false);
    } else {
      setIsEmailSent(true);
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <AuthLayout
        title="E-mail enviado"
        subtitle="Verifique sua caixa de entrada"
      >
        <div className="space-y-6 text-center animate-fade-in">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Enviamos um link de recuperação para
            </p>
            <p className="font-medium text-foreground">{email}</p>
          </div>

          <p className="text-sm text-muted-foreground">
            Caso não encontre o e-mail, verifique sua pasta de spam.
          </p>

          <div className="space-y-3 pt-4">
            <Button
              onClick={() => setIsEmailSent(false)}
              variant="outline"
              className="w-full h-12 border-border hover:bg-muted transition-colors"
            >
              Enviar novamente
            </Button>

            <Link to="/login">
              <Button
                variant="ghost"
                className="w-full h-12 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Voltar ao login
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Digite seu e-mail para receber o link de recuperação"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 bg-card border-border focus:border-primary transition-colors"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium group transition-all duration-300"
        >
          {isLoading ? (
            "Enviando..."
          ) : (
            <>
              Enviar link
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>

        <Link to="/login">
          <Button
            variant="ghost"
            className="w-full h-12 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Voltar ao login
          </Button>
        </Link>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
