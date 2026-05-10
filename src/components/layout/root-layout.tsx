import { Outlet } from 'react-router';

export const RootLayout = () => {
  return (
    <div className="min-h-screen">
      {/* Trainees: add navbar/sidebar here */}
      <Outlet />
    </div>
  );
};
