import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useSignInWithPassword } from '@/features/auth/api/use-sign-in-with-password';
import { useSignInWithGoogle } from '@/features/auth/api/use-sign-in-with-google';
import { signInSchema, type SignInValues } from '@/features/auth/schemas/sign-in-schema';

export const LoginPage = () => {
  const navigate = useNavigate();
  const signIn = useSignInWithPassword();
  const signInWithGoogle = useSignInWithGoogle();

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: SignInValues) => {
    signIn.mutate(values, {
      onSuccess: () => navigate('/'),
    });
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={signIn.isPending}>
                {signIn.isPending ? 'Signing in…' : 'Sign in'}
              </Button>
              {signIn.isError ? (
                <p className="text-destructive text-sm">{signIn.error.message}</p>
              ) : null}
            </form>
          </Form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card text-muted-foreground px-2">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={signInWithGoogle.isPending}
            onClick={() => signInWithGoogle.mutate()}
          >
            {signInWithGoogle.isPending ? 'Redirecting…' : 'Continue with Google'}
          </Button>
          {signInWithGoogle.isError ? (
            <p className="text-destructive text-sm">{signInWithGoogle.error.message}</p>
          ) : null}

          <p className="text-muted-foreground text-center text-sm">
            <Link to="/" className="underline">
              Back to home
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
