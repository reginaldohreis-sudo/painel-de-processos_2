import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Flame } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Por favor, insira um email válido.'),
  password: z.string().min(1, 'A senha é obrigatória.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, sendPasswordResetEmail } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    setResetMessage(null);
    const { error } = await login(data.email, data.password);
    if (error) {
      setError('Credenciais inválidas. Verifique seu email e senha.');
    } else {
      navigate('/');
    }
  };

  const handlePasswordReset = async () => {
      const email = getValues("email");
      if (!email || !z.string().email().safeParse(email).success) {
          setError("Por favor, insira um email válido no campo acima para recuperar a senha.");
          return;
      }
      setError(null);
      setResetMessage(null);
      const { error } = await sendPasswordResetEmail(email);
      if (error) {
          setResetMessage("Falha ao enviar email. Verifique se o email está correto.");
      } else {
          setResetMessage("Email de recuperação enviado! Verifique sua caixa de entrada.");
      }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Flame className="h-8 w-8 text-primary" />
            </div>
          <CardTitle className="text-2xl">Painel de Produção</CardTitle>
          <CardDescription>Faça login para acessar o sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" {...register('email')} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            {resetMessage && <p className="text-sm text-green-500 text-center">{resetMessage}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button onClick={handlePasswordReset} className="underline text-muted-foreground hover:text-primary">
              Esqueceu a senha?
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
