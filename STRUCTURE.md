# Frontend Project Structure

A scalable folder structure for **React + Vite + TypeScript** projects using **TailwindCSS, shadcn/ui, TanStack Query, React Hook Form, Zod, React Router, and Supabase**.

The guiding rule: **organize by feature, not by file type**. Most code lives inside a feature folder. Only truly shared code lives at the top level.

---

## Stack & prerequisites

| Tool            | Version / Choice           |
| --------------- | -------------------------- |
| Node.js         | Latest LTS                 |
| Package manager | npm                        |
| Build tool      | Vite                       |
| Language        | TypeScript                 |
| Styling         | TailwindCSS + shadcn/ui    |
| Routing         | React Router (v7)          |
| Server state    | TanStack Query             |
| Forms           | React Hook Form + Zod      |
| Backend         | Supabase (auth + database) |
| Linting         | ESLint (flat config)       |
| Formatting      | Prettier                   |
| Git hooks       | Husky + lint-staged        |

---

## Bootstrapping a new project

```bash
# 1. Scaffold Vite + React + TS
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install

# 2. Core libraries
npm install react-router @tanstack/react-query
npm install react-hook-form @hookform/resolvers zod
npm install @supabase/supabase-js
npm install clsx tailwind-merge

# 3. Tailwind
npm install -D tailwindcss @tailwindcss/vite

# 4. shadcn/ui (interactive — pick defaults; uses lib/utils.ts and components/ui/)
npx shadcn@latest init

# 5. Tooling
npm install -D prettier prettier-plugin-tailwindcss
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh
npm install -D husky lint-staged
npx husky init
```

After `shadcn init`, add components as needed:

```bash
npx shadcn@latest add button input form card label
```

---

## Top-level structure

```
src/
├── assets/                    # Static files (images, fonts, svgs)
├── components/                # Shared, reusable components
│   ├── ui/                    # shadcn/ui primitives (auto-generated)
│   └── layout/                # App shell pieces (root-layout, protected-route)
├── features/                  # ⭐ Feature modules — most of your code lives here
│   ├── auth/                  # Supabase auth (provided)
│   ├── posts/                 # Reference feature using JSONPlaceholder (provided)
│   └── ...                    # Trainees add their own here
├── hooks/                     # Shared custom hooks (used in 2+ features)
├── lib/                       # Third-party client setup & low-level config
│   ├── supabase.ts
│   ├── query-client.ts
│   └── utils.ts               # cn() helper, etc.
├── routes/                    # Route definitions and page components
│   ├── router.tsx             # Route tree (createBrowserRouter)
│   ├── home-page.tsx
│   ├── login-page.tsx         # Trainees build this UI
│   ├── posts-list-page.tsx
│   ├── post-detail-page.tsx
│   └── not-found-page.tsx
├── providers/                 # App-wide context providers
│   └── auth-provider.tsx
├── schemas/                   # Shared Zod schemas (used in 2+ features)
├── types/                     # Shared TypeScript types
│   └── database.ts            # Supabase-generated types
├── constants/                 # App-wide constants & enums
├── styles/                    # globals.css, Tailwind directives
├── App.tsx
├── main.tsx
└── vite-env.d.ts
```

---

## The "where does this go?" cheat sheet

| What you're writing                       | Where it goes                                             |
| ----------------------------------------- | --------------------------------------------------------- |
| A button used in 5 places                 | `components/ui/button.tsx` (shadcn)                       |
| A navbar / sidebar                        | `components/layout/navbar.tsx`                            |
| The login form                            | `routes/login-page.tsx` (page) + `features/auth/` (logic) |
| A hook for fetching posts                 | `features/posts/api/use-posts.ts`                         |
| A Zod schema for the login form           | `features/auth/schemas/sign-in-schema.ts`                 |
| A Zod schema for a User (used everywhere) | `schemas/user.ts`                                         |
| `formatCurrency()` helper used everywhere | `lib/utils.ts`                                            |
| `calculatePostStats()` used only in posts | `features/posts/utils/calculate-stats.ts`                 |
| The Supabase client                       | `lib/supabase.ts`                                         |
| The route definition for `/posts/:id`     | `routes/router.tsx`                                       |
| The page component for `/posts/:id`       | `routes/post-detail-page.tsx`                             |
| `<AuthProvider />` wrapping the app       | `providers/auth-provider.tsx`                             |
| `useDebounce` used in search and filters  | `hooks/use-debounce.ts`                                   |
| A type for a Supabase table               | `types/database.ts` (auto-generated)                      |

**Rule of thumb:** If something is used in **only one feature** → put it inside that feature. If it's used in **two or more features** → promote it to the top-level shared folder.

---

## Anatomy of a feature module

Each feature is self-contained. This is the pattern trainees should follow when adding a new feature:

```
features/posts/
├── api/                          # TanStack Query hooks + data calls
│   ├── use-posts.ts              # query: list posts
│   ├── use-post.ts               # query: single post
│   └── use-create-post.ts        # mutation: create
├── components/                   # Components only used in this feature
│   ├── post-card.tsx
│   ├── post-list.tsx
│   └── post-form.tsx
├── hooks/                        # Non-API hooks specific to this feature
│   └── use-post-filters.ts
├── schemas/                      # Zod schemas for this feature
│   └── post-schema.ts
├── types/                        # Types specific to this feature
│   └── index.ts
└── utils/                        # Helpers used only in this feature
    └── format-post-date.ts
```

### No barrel files — use direct imports

We deliberately **do not** use `index.ts` barrel files. Reasons:

- They cause subtle tree-shaking failures that bloat the production bundle.
- They slow down the Vite dev server (HMR has to crawl the whole feature folder).
- They make circular dependencies easy to introduce and hard to debug.
- They slow down TypeScript autocomplete and go-to-definition in larger projects.
- They add maintenance overhead (every new file needs to be added to the barrel).

**Always import directly from the file:**

```ts
// ✅ Good
import { PostList } from '@/features/posts/components/post-list';
import { usePosts } from '@/features/posts/api/use-posts';

// ❌ Bad — no barrel exists, this won't resolve
import { PostList, usePosts } from '@/features/posts';
```

Modern editors auto-import these paths correctly, so trainees almost never type them by hand.

### Enforcing feature boundaries without barrels

The boundary rule: **a feature can import from `lib/`, `hooks/`, `components/`, `schemas/`, `types/`, `constants/` — but not from another feature's deep internals.** If two features need to share something, promote it to the top level.

This is enforced by an ESLint `no-restricted-imports` rule (see Tooling section below).

---

## Library setup

### Supabase (`lib/supabase.ts`)

Single shared client. Never instantiate Supabase elsewhere.

```ts
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
```

Generate `types/database.ts` from your Supabase schema once you've defined tables:

```bash
npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
```

### TanStack Query (`lib/query-client.ts`)

```ts
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

**Convention:** every query and mutation gets its own file in a feature's `api/` folder. Never call `useQuery` directly inside a component — always wrap it in a custom hook.

### React Hook Form + Zod

Schema and inferred type live together. The form component imports both.

```ts
// features/auth/schemas/sign-in-schema.ts
import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export type SignInValues = z.infer<typeof signInSchema>;
```

```tsx
// In the page that uses it (e.g. routes/login-page.tsx)
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, type SignInValues } from '@/features/auth/schemas/sign-in-schema';

const form = useForm<SignInValues>({
  resolver: zodResolver(signInSchema),
  defaultValues: { email: '', password: '' },
});
```

### Tailwind + shadcn/ui

shadcn/ui is **not** an installed package — it copies components into `components/ui/` so you own them and can edit them. Add components with the CLI as you need them:

```bash
npx shadcn@latest add button input form card
```

The `cn()` helper that shadcn relies on lives in `lib/utils.ts`:

```ts
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

Global styles in `styles/globals.css` (the shadcn init creates this for you, including the CSS variables for the theme).

### React Router (`routes/router.tsx`)

We use `createBrowserRouter` with a flat route table. Pages live in `routes/` and stay thin — they compose feature components, they don't contain business logic.

```tsx
// routes/router.tsx
import { createBrowserRouter } from 'react-router';
import { RootLayout } from '@/components/layout/root-layout';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { HomePage } from './home-page';
import { LoginPage } from './login-page';
import { PostsListPage } from './posts-list-page';
import { PostDetailPage } from './post-detail-page';
import { NotFoundPage } from './not-found-page';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/posts', element: <PostsListPage /> },
      { path: '/posts/:id', element: <PostDetailPage /> },

      // Routes that require an authenticated user go inside this block
      {
        element: <ProtectedRoute />,
        children: [
          // e.g. { path: '/dashboard', element: <DashboardPage /> },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
```

```tsx
// components/layout/root-layout.tsx
import { Outlet } from 'react-router';

export const RootLayout = () => {
  return (
    <div className="min-h-screen">
      {/* Trainees: add navbar/sidebar here */}
      <Outlet />
    </div>
  );
};
```

```tsx
// components/layout/protected-route.tsx
import { Navigate, Outlet } from 'react-router';
import { useSession } from '@/features/auth/api/use-session';

export const ProtectedRoute = () => {
  const { data: session, isLoading } = useSession();

  if (isLoading) return null; // replace with a loading spinner once you have one
  if (!session) return <Navigate to="/login" replace />;

  return <Outlet />;
};
```

If a page component is more than ~50 lines, the logic probably belongs inside a feature.

---

## Authentication (Supabase) — implementation only, no UI

The `features/auth/` module is fully implemented as hooks. **Trainees build the UI themselves** (login form, signup form, social-login buttons) and call these hooks from their pages.

### File layout

```
features/auth/
├── api/
│   ├── use-session.ts                  # current session (query)
│   ├── use-current-user.ts             # current user (derived)
│   ├── use-sign-in-with-password.ts    # email + password
│   ├── use-sign-up.ts                  # email + password sign up
│   ├── use-sign-in-with-google.ts      # Google OAuth
│   └── use-sign-out.ts
└── schemas/
    ├── sign-in-schema.ts
    └── sign-up-schema.ts

providers/
└── auth-provider.tsx                   # subscribes to auth state changes
```

### Schemas

```ts
// features/auth/schemas/sign-in-schema.ts
import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export type SignInValues = z.infer<typeof signInSchema>;
```

```ts
// features/auth/schemas/sign-up-schema.ts
import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type SignUpValues = z.infer<typeof signUpSchema>;
```

### Session query

```ts
// features/auth/api/use-session.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const sessionKeys = {
  current: ['session'] as const,
};

export const useSession = () => {
  return useQuery({
    queryKey: sessionKeys.current,
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
  });
};
```

```ts
// features/auth/api/use-current-user.ts
import { useSession } from './use-session';

export const useCurrentUser = () => {
  const { data: session, ...rest } = useSession();
  return { user: session?.user ?? null, ...rest };
};
```

### Mutations

```ts
// features/auth/api/use-sign-in-with-password.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { sessionKeys } from './use-session';
import type { SignInValues } from '../schemas/sign-in-schema';

export const useSignInWithPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: SignInValues) => {
      const { data, error } = await supabase.auth.signInWithPassword(values);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.current });
    },
  });
};
```

```ts
// features/auth/api/use-sign-up.ts
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { SignUpValues } from '../schemas/sign-up-schema';

export const useSignUp = () => {
  return useMutation({
    mutationFn: async (values: SignUpValues) => {
      const { data, error } = await supabase.auth.signUp(values);
      if (error) throw error;
      return data;
    },
  });
};
```

```ts
// features/auth/api/use-sign-in-with-google.ts
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useSignInWithGoogle = () => {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      return data;
    },
  });
};
```

```ts
// features/auth/api/use-sign-out.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { sessionKeys } from './use-session';

export const useSignOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.current });
    },
  });
};
```

### Auth provider

Subscribes to Supabase's `onAuthStateChange` and invalidates the session query whenever the user signs in or out. This keeps every component using `useSession` / `useCurrentUser` in sync automatically.

```tsx
// providers/auth-provider.tsx
import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { sessionKeys } from '@/features/auth/api/use-session';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.current });
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  return <>{children}</>;
};
```

### How trainees use this

In a login page they're building:

```tsx
const signIn = useSignInWithPassword();
const signInWithGoogle = useSignInWithGoogle();

const onSubmit = (values: SignInValues) => {
  signIn.mutate(values, {
    onSuccess: () => navigate('/'),
    onError: (err) => toast.error(err.message),
  });
};
```

### Configuration trainees must provide

1. Create a Supabase project and put the URL + anon key in `.env` (see `.env.example`).
2. In the Supabase dashboard, enable **Authentication > Providers > Google**, paste in your Google OAuth Client ID + Secret, and add the redirect URL (`https://<your-project-ref>.supabase.co/auth/v1/callback`).
3. Set the **Site URL** in Supabase Auth settings to match where your app runs (`http://localhost:5173` for local dev).

---

## Reference feature: Posts (JSONPlaceholder)

A complete example feature using the free public API at `https://jsonplaceholder.typicode.com`. No backend setup required — works out of the box. Trainees should mirror this structure when building their own features.

### File layout

```
features/posts/
├── api/
│   ├── use-posts.ts             # GET /posts
│   ├── use-post.ts              # GET /posts/:id
│   └── use-create-post.ts       # POST /posts
├── components/
│   ├── post-card.tsx
│   ├── post-list.tsx
│   └── post-form.tsx
├── schemas/
│   └── post-schema.ts
└── types/
    └── index.ts
```

### Types and schemas

```ts
// features/posts/types/index.ts
export type Post = {
  id: number;
  userId: number;
  title: string;
  body: string;
};
```

```ts
// features/posts/schemas/post-schema.ts
import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  userId: z.number().int().positive(),
});

export type CreatePostValues = z.infer<typeof createPostSchema>;
```

### Queries

```ts
// features/posts/api/use-posts.ts
import { useQuery } from '@tanstack/react-query';
import type { Post } from '../types';

const API_URL = 'https://jsonplaceholder.typicode.com';

export const postsKeys = {
  all: ['posts'] as const,
  lists: () => [...postsKeys.all, 'list'] as const,
  detail: (id: number) => [...postsKeys.all, 'detail', id] as const,
};

export const usePosts = () => {
  return useQuery({
    queryKey: postsKeys.lists(),
    queryFn: async (): Promise<Post[]> => {
      const res = await fetch(`${API_URL}/posts`);
      if (!res.ok) throw new Error('Failed to fetch posts');
      return res.json();
    },
  });
};
```

```ts
// features/posts/api/use-post.ts
import { useQuery } from '@tanstack/react-query';
import { postsKeys } from './use-posts';
import type { Post } from '../types';

const API_URL = 'https://jsonplaceholder.typicode.com';

export const usePost = (id: number) => {
  return useQuery({
    queryKey: postsKeys.detail(id),
    queryFn: async (): Promise<Post> => {
      const res = await fetch(`${API_URL}/posts/${id}`);
      if (!res.ok) throw new Error('Failed to fetch post');
      return res.json();
    },
    enabled: Number.isFinite(id),
  });
};
```

### Mutation

```ts
// features/posts/api/use-create-post.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postsKeys } from './use-posts';
import type { CreatePostValues } from '../schemas/post-schema';
import type { Post } from '../types';

const API_URL = 'https://jsonplaceholder.typicode.com';

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: CreatePostValues): Promise<Post> => {
      const res = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error('Failed to create post');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsKeys.lists() });
    },
  });
};
```

The components (`post-card`, `post-list`, `post-form`) and pages (`posts-list-page`, `post-detail-page`) are simple consumers of these hooks — Claude Code can scaffold them following standard shadcn/ui patterns.

---

## App entry point

```tsx
// main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from './routes/router';
import { queryClient } from './lib/query-client';
import { AuthProvider } from './providers/auth-provider';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
```

The provider order matters: `QueryClientProvider` must wrap `AuthProvider` because the auth provider uses `useQueryClient()`.

---

## Path aliases

Configure `@/*` to point at `src/*`. This avoids `../../../../` in imports.

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

```json
// tsconfig.json (compilerOptions excerpt)
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

---

## Tooling

### `.env.example`

```
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google OAuth is configured inside the Supabase dashboard:
#   Authentication > Providers > Google
# Paste your Google Client ID + Secret there. No additional env vars needed.
```

### `.gitignore`

```
node_modules
dist
dist-ssr
*.local

# Editor
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store

# Env
.env
.env.local
.env.*.local

# Logs
logs
*.log
npm-debug.log*
```

### `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### `eslint.config.js` (flat config)

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/!(api|components|hooks|schemas|types|utils)/**'],
              message:
                "Don't reach into another feature's deep internals. Promote shared code to the top level.",
            },
          ],
        },
      ],
    },
  },
);
```

### Husky + lint-staged

After running `npx husky init`, edit `.husky/pre-commit`:

```bash
npx lint-staged
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

### `package.json` scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "format": "prettier --write .",
    "prepare": "husky"
  }
}
```

---

## Naming conventions

| Type                                                 | Convention                            | Example                                                                |
| ---------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| All files (components, hooks, schemas, utils, types) | kebab-case                            | `post-card.tsx`, `use-posts.ts`, `sign-in-schema.ts`, `format-date.ts` |
| All folders                                          | kebab-case                            | `features/user-profile`, `components/ui`                               |
| Hook files                                           | kebab-case, `use-` prefix             | `use-posts.ts`, `use-debounce.ts`                                      |
| Schema files                                         | kebab-case, `-schema` suffix          | `sign-in-schema.ts`, `post-schema.ts`                                  |
| Constants                                            | SCREAMING_SNAKE_CASE inside files     | `MAX_FILE_SIZE`                                                        |
| Component / hook / function names (inside files)     | PascalCase / camelCase as usual in JS | `export const PostCard`, `export const usePosts`                       |

> **Note:** The file is `post-card.tsx`, but the component it exports is still `PostCard`. Kebab-case applies to file and folder names on disk — it does **not** change how you name React components, hooks, or functions in code.

---

## Decision flow for trainees

When adding new code, ask in order:

1. **Is it a new feature?** → create `features/<name>/` with the standard subfolders.
2. **Does it belong to an existing feature?** → put it in that feature's matching subfolder (`api/`, `components/`, `schemas/`, etc.).
3. **Is it used by 2+ features?** → promote it to the matching top-level folder (`components/ui/`, `hooks/`, `schemas/`, etc.).
4. **Is it a third-party client or low-level config?** → `lib/`.
5. **Is it a route/page?** → `routes/`, register it in `router.tsx`, and keep it thin.

If unsure, **start inside the feature**. Promoting later is easier than cleaning up cross-feature imports.

---

## Anti-patterns to avoid

- ❌ A giant `components/` folder with 80+ files at the same level.
- ❌ Calling `supabase.from(...)` or `fetch(...)` directly inside a React component — wrap it in a TanStack Query hook in `features/*/api/`.
- ❌ Defining Zod schemas inline inside form components — put them in `schemas/`.
- ❌ Importing from another feature's deep internal utilities (e.g. `@/features/posts/utils/foo` from inside `features/auth/`) — if it needs to be shared, promote it to the top level.
- ❌ Creating an `index.ts` barrel file inside a feature — we use direct imports instead.
- ❌ Putting business logic in route/page components.
- ❌ Calling `useQuery` / `useMutation` directly inside a component instead of behind a custom hook in `api/`.
- ❌ A `utils/` folder that becomes a dumping ground. If something is feature-specific, it belongs in the feature.
- ❌ Instantiating multiple Supabase clients. There's exactly one in `lib/supabase.ts`.
