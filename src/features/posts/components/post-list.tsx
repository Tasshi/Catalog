import { usePosts } from '../api/use-posts';
import { PostCard } from './post-card';

export const PostList = () => {
  const { data: posts, isLoading, error } = usePosts();

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading posts…</p>;
  }

  if (error) {
    return <p className="text-destructive text-sm">Failed to load posts.</p>;
  }

  if (!posts || posts.length === 0) {
    return <p className="text-muted-foreground text-sm">No posts yet.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};
