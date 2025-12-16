import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Store, MapPin, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/admin/ui/Card';
import { dashboardAPI } from '../../../services/admin/api';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#8F61EF', '#F9A826', '#10B981', '#EF4444', '#3B82F6'];

const KPICard = ({ title, value, icon: Icon, change, color = 'primary' }) => (
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
            {change && (
              <p className={`text-sm mt-1 ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {change > 0 ? '+' : ''}{change}% from last month
              </p>
            )}
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard
          title="Total Users"
          value={stats.users.toLocaleString()}
          icon={Users}
          change={12}
          color="primary"
        />
        <KPICard
          title="Vendors"
          value={stats.vendors.toLocaleString()}
          icon={Store}
          change={8}
          color="blue"
        />
        <KPICard
          title="Venues"
          value={stats.venues.toLocaleString()}
          icon={MapPin}
          change={15}
          color="green"
        />
        <KPICard
          title="Bookings"
          value={stats.bookings.toLocaleString()}
          icon={Calendar}
          change={23}
          color="purple"
        />
        <KPICard
          title="Revenue"
          value={`₹${stats.revenue.toLocaleString()}`}
          icon={DollarSign}
          change={18}
          color="yellow"
        />
        <KPICard
          title="Commission"
          value={`₹${stats.commission.toLocaleString()}`}
          icon={TrendingUp}
          change={10}
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
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

        {/* Booking Status Chart */}
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
      </div>
    </div>
  );
};

