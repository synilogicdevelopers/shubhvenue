import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Store, MapPin, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/admin/ui/Card';
import { dashboardAPI } from '../../../services/admin/api';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

// Helper function to check if user has permission
const hasPermission = (permission, userPermissions) => {
  if (!userPermissions || userPermissions.length === 0) return false;
  // Admin has all permissions (check for '*' or 'admin' role)
  if (userPermissions.includes('*') || userPermissions.includes('admin')) return true;
  // Check specific permission
  return userPermissions.includes(permission);
};

const COLORS = ['#8F61EF', '#F9A826', '#10B981', '#EF4444', '#3B82F6'];

const KPICard = ({ title, value, icon: Icon, color = 'primary' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</h3>
          </div>
          <div className={`p-3 rounded-lg ${
            color === 'primary' ? 'bg-primary/10' :
            color === 'blue' ? 'bg-blue-500/10' :
            color === 'green' ? 'bg-green-500/10' :
            color === 'purple' ? 'bg-purple-500/10' :
            color === 'yellow' ? 'bg-yellow-500/10' :
            'bg-orange-500/10'
          }`}>
            <Icon className={`w-6 h-6 ${
              color === 'primary' ? 'text-primary' :
              color === 'blue' ? 'text-blue-500' :
              color === 'green' ? 'text-green-500' :
              color === 'purple' ? 'text-purple-500' :
              color === 'yellow' ? 'text-yellow-500' :
              'text-orange-500'
            }`} />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export const Dashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    vendors: 0,
    venues: 0,
    bookings: 0,
    revenue: 0,
    commission: 0,
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [bookingStatus, setBookingStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get user permissions from localStorage
  const userPermissions = useMemo(() => {
    try {
      const permissionsStr = localStorage.getItem('admin_permissions');
      if (permissionsStr) {
        return JSON.parse(permissionsStr);
      }
    } catch (error) {
      console.error('Error parsing permissions:', error);
    }
    return [];
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getStats();
      const data = response.data;
      
      setStats({
        users: data.users || 0,
        vendors: data.vendors || 0,
        venues: data.venues || 0,
        bookings: data.bookings || 0,
        revenue: data.revenue || 0,
        commission: data.commission || 0,
      });

      setMonthlyRevenue(data.monthlyRevenue || []);
      setBookingStatus(data.bookingStatus || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Define all possible cards with their permissions
  const allCards = useMemo(() => [
    {
      id: 'users',
      title: 'Total Users',
      value: stats.users.toLocaleString(),
      icon: Users,
      color: 'primary',
      permission: 'view_users',
    },
    {
      id: 'vendors',
      title: 'Vendors',
      value: stats.vendors.toLocaleString(),
      icon: Store,
      color: 'blue',
      permission: 'view_vendors',
    },
    {
      id: 'venues',
      title: 'Venues',
      value: stats.venues.toLocaleString(),
      icon: MapPin,
      color: 'green',
      permission: 'view_venues',
    },
    {
      id: 'bookings',
      title: 'Bookings',
      value: stats.bookings.toLocaleString(),
      icon: Calendar,
      color: 'purple',
      permission: 'view_bookings',
    },
    {
      id: 'revenue',
      title: 'Revenue',
      value: `₹${stats.revenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'yellow',
      permission: 'view_revenue', // or view_analytics
    },
    {
      id: 'commission',
      title: 'Commission',
      value: `₹${stats.commission.toLocaleString()}`,
      icon: TrendingUp,
      color: 'orange',
      permission: 'view_payouts', // or view_analytics
    },
  ], [stats]);

  // Filter cards based on permissions
  const visibleCards = useMemo(() => {
    return allCards.filter((card) => {
      // Check if user has permission for this card
      if (hasPermission(card.permission, userPermissions)) return true;
      // Also check for view_analytics as fallback for revenue/commission
      if ((card.id === 'revenue' || card.id === 'commission') && hasPermission('view_analytics', userPermissions)) {
        return true;
      }
      return false;
    });
  }, [allCards, userPermissions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back! Here's your overview.</p>
      </div>

      {/* KPI Cards - Only show cards user has permission for */}
      {visibleCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleCards.map((card) => (
            <KPICard
              key={card.id}
              title={card.title}
              value={card.value}
              icon={card.icon}
              change={card.change}
              color={card.color}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">No dashboard cards available. Please contact admin for permissions.</p>
          </CardContent>
        </Card>
      )}

      {/* Charts - Only show if user has view_analytics permission */}
      {hasPermission('view_analytics', userPermissions) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue Chart */}
          {hasPermission('view_revenue', userPermissions) && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8F61EF" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Booking Status Chart */}
          {hasPermission('view_bookings', userPermissions) && (
            <Card>
              <CardHeader>
                <CardTitle>Bookings by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={bookingStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {bookingStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

