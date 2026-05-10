import { Link, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePost } from '@/features/posts/api/use-post';

export const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);
  const { data: post, isLoading, error } = usePost(postId);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-12">
      <Button variant="outline" size="sm" asChild>
        <Link to="/posts">← Back to posts</Link>
      </Button>

      {isLoading ? <p className="text-muted-foreground text-sm">Loading…</p> : null}
      {error ? <p className="text-destructive text-sm">Failed to load post.</p> : null}

      {post ? (
        <Card>
          <CardHeader>
            <CardTitle className="capitalize">{post.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{post.body}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};
