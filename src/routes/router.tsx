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
