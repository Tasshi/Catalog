import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCreatePost } from '../api/use-create-post';
import { createPostSchema, type CreatePostValues } from '../schemas/post-schema';

type PostFormProps = {
  onCreated?: () => void;
};

export const PostForm = ({ onCreated }: PostFormProps) => {
  const createPost = useCreatePost();
  const form = useForm<CreatePostValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { title: '', body: '', userId: 1 },
  });

  const onSubmit = (values: CreatePostValues) => {
    createPost.mutate(values, {
      onSuccess: () => {
        form.reset({ title: '', body: '', userId: 1 });
        onCreated?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Post title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Body</FormLabel>
              <FormControl>
                <Input placeholder="Post body" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={createPost.isPending}>
          {createPost.isPending ? 'Creating…' : 'Create post'}
        </Button>
        {createPost.isError ? (
          <p className="text-destructive text-sm">{createPost.error.message}</p>
        ) : null}
      </form>
    </Form>
  );
};
