import { Sidebar } from '../../components/admin/sidebar/Sidebar';
import { Navbar } from '../../components/admin/navbar/Navbar';

export const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex w-full">
      <Sidebar />
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen w-full">
        <Navbar />
        <main className="flex-1 p-4 lg:p-6 overflow-auto w-full">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

