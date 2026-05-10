import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

export const HomePage = () => {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-16 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">React Boilerplate</h1>
      <p className="text-muted-foreground">
        A scaffolded starting point for trainees. See <code>STRUCTURE.md</code> for conventions.
      </p>
      <div className="flex justify-center gap-3">
        <Button asChild>
          <Link to="/posts">View posts</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/login">Login</Link>
        </Button>
      </div>
    </div>
  );
};
