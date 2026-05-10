import { PostList } from '@/features/posts/components/post-list';
import { PostForm } from '@/features/posts/components/post-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const PostsListPage = () => {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Posts</h1>
        <p className="text-muted-foreground text-sm">
          Reference feature using the JSONPlaceholder API.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create a post</CardTitle>
        </CardHeader>
        <CardContent>
          <PostForm />
        </CardContent>
      </Card>

      <PostList />
    </div>
  );
};
