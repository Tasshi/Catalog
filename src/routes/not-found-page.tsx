import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

export const NotFoundPage = () => {
  return (
    <div className="mx-auto max-w-md space-y-4 px-6 py-24 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">404</h1>
      <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
      <Button asChild>
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
};
