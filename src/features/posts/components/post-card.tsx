import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Post } from '../types';

type PostCardProps = {
  post: Post;
};

export const PostCard = ({ post }: PostCardProps) => {
  return (
    <Link to={`/posts/${post.id}`} className="block">
      <Card className="hover:bg-accent/40 h-full transition-colors">
        <CardHeader>
          <CardTitle className="line-clamp-2 capitalize">{post.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground line-clamp-3 text-sm">{post.body}</p>
        </CardContent>
      </Card>
    </Link>
  );
};
