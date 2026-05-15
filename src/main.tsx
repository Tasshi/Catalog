// import { StrictMode } from 'react';
// import { createRoot } from 'react-dom/client';
// import { RouterProvider } from 'react-router-dom';  // ← react-router-dom, not react-router
// import { QueryClientProvider } from '@tanstack/react-query';
// import router from './routes/router';
// import { queryClient } from './lib/query-client';
// import { AuthProvider } from './providers/auth-provider';
// import './styles/globals.css';

// createRoot(document.getElementById('root')!).render(
//   <StrictMode>
//     <QueryClientProvider client={queryClient}>
//       <AuthProvider>
//         <RouterProvider router={router} />
//       </AuthProvider>
//     </QueryClientProvider>
//   </StrictMode>,
// );
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './routes/router';
import { queryClient } from './lib/query-client';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);