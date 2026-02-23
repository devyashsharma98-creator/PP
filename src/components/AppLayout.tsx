import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { Navbar } from '@/components/Navbar';

export function AppLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
