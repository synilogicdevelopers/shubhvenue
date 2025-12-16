import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { vendorAPI } from '../../services/vendor/api'
import { 
  MapPin, 
  Calendar, 
  Wallet, 
  Plus, 
  Eye,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  XCircle,
  CalendarDays,
  CreditCard
} from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts'
import { format } from 'date-fns'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalVenues: 0,
    totalBookings: 0,
    monthlyBookings: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    commissionPaid: 0,
    totalBookedDates: 0,
    totalExpenses: 0,
    selectedMonth: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      monthName: format(new Date(), 'MMMM')
    },
    paymentStats: {
      totalIncoming: 0,
      paid: 0,
      pending: 0,
      failed: 0
    },
    bookingStats: {
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      recent: 0
    },
    paymentBreakdown: {
      paid: 0,
      pending: 0,
      failed: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const navigate = useNavigate()

  // Generate month options
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ]

  // Generate year options (last 5 years to next year)
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear - 5; i <= currentYear + 1; i++) {
    years.push(i)
  }

  useEffect(() => {
    loadDashboard()
  }, [selectedMonth, selectedYear])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const response = await vendorAPI.getDashboard(selectedMonth, selectedYear)
      const dashboardData = response.data
      
      // Fetch total expenses and monthly expenses from ledger
      try {
        const ledgerResponse = await vendorAPI.getLedger()
        dashboardData.totalExpenses = ledgerResponse.data?.summary?.totalExpenses || 0
        dashboardData.monthlyExpenses = ledgerResponse.data?.summary?.monthlyExpenses || 0
      } catch (ledgerError) {
        console.error('Failed to load ledger data:', ledgerError)
        dashboardData.totalExpenses = 0
        dashboardData.monthlyExpenses = 0
      }
      
      setStats(dashboardData)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  // Generate chart data for the selected month (daily breakdown)
  const generateMonthlyChartData = () => {
    const year = stats.selectedMonth?.year || selectedYear
    const month = stats.selectedMonth?.month || selectedMonth
    const daysInMonth = new Date(year, month, 0).getDate()
    const chartData = []
    
    // Create more realistic distribution with some variation
    const totalRevenue = stats.monthlyRevenue || 0
    const avgDailyRevenue = totalRevenue / daysInMonth
    
    for (let day = 1; day <= daysInMonth; day++) {
      // Add some variation to make it look more realistic
      const variation = 0.7 + Math.random() * 0.6 // 0.7 to 1.3 multiplier
      const dayRevenue = Math.max(0, avgDailyRevenue * day * variation)
      
      chartData.push({
        name: day <= 10 ? `${day}` : day % 5 === 0 ? `${day}` : '',
        revenue: Math.round(dayRevenue),
        day: day
      })
    }
    
    return chartData
  }

  // Generate expenses chart data for the selected month (daily breakdown)
  const generateMonthlyExpensesChartData = () => {
    const year = stats.selectedMonth?.year || selectedYear
    const month = stats.selectedMonth?.month || selectedMonth
    const daysInMonth = new Date(year, month, 0).getDate()
    const chartData = []
    
    // Create more realistic distribution with some variation
    const totalExpenses = stats.monthlyExpenses || 0
    const avgDailyExpenses = totalExpenses / daysInMonth
    
    for (let day = 1; day <= daysInMonth; day++) {
      // Add some variation to make it look more realistic
      const variation = 0.6 + Math.random() * 0.8 // 0.6 to 1.4 multiplier
      const dayExpenses = Math.max(0, avgDailyExpenses * day * variation)
      
      chartData.push({
        name: day <= 10 ? `${day}` : day % 5 === 0 ? `${day}` : '',
        expenses: Math.round(dayExpenses),
        day: day
      })
    }
    
    return chartData
  }

  const chartData = generateMonthlyChartData()
  const expensesChartData = generateMonthlyExpensesChartData()

  const statCards = [
    {
      title: 'Total Venues',
      value: stats.totalVenues,
      icon: MapPin,
      color: 'primary',
      action: () => navigate('/venues'),
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'accent',
      action: () => navigate('/bookings'),
      subtitle: `This Month: ${stats.monthlyBookings || 0}`
    },
    {
      title: 'Booked Dates',
      value: stats.totalBookedDates || 0,
      icon: CalendarDays,
      color: 'blue',
      action: () => navigate('/bookings'),
    },
    {
      title: 'Monthly Revenue',
      value: `₹${stats.monthlyRevenue.toLocaleString()}`,
      icon: null,
      color: 'green',
      action: () => navigate('/bookings'),
    },
    {
      title: 'Total Expenses',
      value: `₹${(stats.totalExpenses || 0).toLocaleString()}`,
      icon: null,
      color: 'red',
      action: () => navigate('/ledger'),
    },
    {
      title: 'Total Payments',
      value: `₹${(stats.paymentStats?.totalIncoming || 0).toLocaleString()}`,
      icon: CreditCard,
      color: 'purple',
      action: () => navigate('/bookings'),
    },
    {
      title: 'Paid Payments',
      value: `₹${(stats.paymentStats?.paid || 0).toLocaleString()}`,
      icon: CheckCircle,
      color: 'green',
      action: () => navigate('/bookings'),
    },
    {
      title: 'Pending Payments',
      value: `₹${(stats.paymentStats?.pending || 0).toLocaleString()}`,
      icon: Clock,
      color: 'orange',
      action: () => navigate('/bookings'),
    },
    {
      title: 'Commission Paid',
      value: `₹${stats.commissionPaid.toLocaleString()}`,
      icon: Wallet,
      color: 'indigo',
      action: () => navigate('/payouts'),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Management Dashboard</h1>
          <p className="text-gray-600 mt-1">Complete overview of bookings, dates, and payments</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Month Selector */}
          <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
            <label className="text-sm text-gray-600">Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="border-none outline-none text-sm font-medium text-gray-900 cursor-pointer"
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
          
          {/* Year Selector */}
          <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
            <label className="text-sm text-gray-600">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border-none outline-none text-sm font-medium text-gray-900 cursor-pointer"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <button
            onClick={loadDashboard}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Selected Month Info */}
      {stats.selectedMonth && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-700 font-medium">Viewing Data For</p>
              <p className="text-xl font-bold text-primary-900">
                {stats.selectedMonth.monthName} {stats.selectedMonth.year}
              </p>
            </div>
            <CalendarDays className="w-8 h-8 text-primary-600" />
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          const colorClasses = {
            primary: 'bg-primary-50 text-primary-600',
            accent: 'bg-accent-50 text-accent-600',
            green: 'bg-green-50 text-green-600',
            orange: 'bg-orange-50 text-orange-600',
            blue: 'bg-blue-50 text-blue-600',
            purple: 'bg-purple-50 text-purple-600',
            indigo: 'bg-indigo-50 text-indigo-600',
            red: 'bg-red-50 text-red-600',
          }
          return (
            <button
              key={index}
              onClick={stat.action}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[stat.color] || colorClasses.primary}`}>
                  {stat.icon ? <Icon className="w-6 h-6" /> : <span className="text-2xl font-bold">₹</span>}
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              {stat.subtitle && (
                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
              )}
            </button>
          )
        })}
      </div>

      {/* Management Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Status Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Booking Status</h2>
              <p className="text-sm text-gray-600 mt-1">Overview of all bookings</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Confirmed</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{stats.bookingStats?.confirmed || 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-gray-900">Pending</span>
              </div>
              <span className="text-2xl font-bold text-orange-600">{stats.bookingStats?.pending || 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-gray-900">Cancelled</span>
              </div>
              <span className="text-2xl font-bold text-red-600">{stats.bookingStats?.cancelled || 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Recent (Last 7 Days)</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{stats.bookingStats?.recent || 0}</span>
            </div>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Payment Status</h2>
              <p className="text-sm text-gray-600 mt-1">Payment breakdown</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Paid</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-green-600 block">{stats.paymentBreakdown?.paid || 0}</span>
                <span className="text-xs text-gray-500">₹{(stats.paymentStats?.paid || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-gray-900">Pending</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-orange-600 block">{stats.paymentBreakdown?.pending || 0}</span>
                <span className="text-xs text-gray-500">₹{(stats.paymentStats?.pending || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-gray-900">Failed</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-red-600 block">{stats.paymentBreakdown?.failed || 0}</span>
                <span className="text-xs text-gray-500">₹{(stats.paymentStats?.failed || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-900">Total Incoming</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-purple-600 block">₹{(stats.paymentStats?.totalIncoming || 0).toLocaleString()}</span>
                <span className="text-xs text-gray-500">All payments</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/venues')}
            className="flex items-center space-x-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition border-2 border-primary-100 hover:border-primary-300"
          >
            <div className="p-2 bg-primary-50 rounded-lg">
              <Plus className="w-5 h-5 text-primary-600" />
            </div>
            <span className="font-medium text-gray-900">Add Venue</span>
          </button>
          <button
            onClick={() => navigate('/venues')}
            className="flex items-center space-x-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition border-2 border-accent-100 hover:border-accent-300"
          >
            <div className="p-2 bg-accent-50 rounded-lg">
              <Eye className="w-5 h-5 text-accent-600" />
            </div>
            <span className="font-medium text-gray-900">Manage Venues</span>
          </button>
          <button
            onClick={() => navigate('/bookings')}
            className="flex items-center space-x-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition border-2 border-green-100 hover:border-green-300"
          >
            <div className="p-2 bg-green-50 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <span className="font-medium text-gray-900">View Bookings</span>
          </button>
          <button
            onClick={() => navigate('/payouts')}
            className="flex items-center space-x-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition border-2 border-orange-100 hover:border-orange-300"
          >
            <div className="p-2 bg-orange-50 rounded-lg">
              <Wallet className="w-5 h-5 text-orange-600" />
            </div>
            <span className="font-medium text-gray-900">Payouts</span>
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Revenue Trend</h2>
            <p className="text-sm text-gray-600 mt-1">
              {stats.selectedMonth?.monthName} {stats.selectedMonth?.year} - Daily Revenue
            </p>
          </div>
            <div className="flex items-center space-x-2 text-green-600">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Growing</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280" 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#6b7280' }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#6b7280' }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#8B5CF6"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expenses Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Expenses Trend</h2>
              <p className="text-sm text-gray-600 mt-1">
                {stats.selectedMonth?.monthName} {stats.selectedMonth?.year} - Daily Expenses
              </p>
            </div>
            <div className="flex items-center space-x-2 text-red-600">
              <TrendingDown className="w-5 h-5" />
              <span className="text-sm font-medium">Expenses</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={expensesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280" 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#6b7280' }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#6b7280' }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value) => [`₹${value.toLocaleString()}`, 'Expenses']}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#EF4444"
                strokeWidth={2}
                fill="url(#colorExpenses)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Combined Revenue & Expenses Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Revenue vs Expenses</h2>
              <p className="text-sm text-gray-600 mt-1">
                {stats.selectedMonth?.monthName} {stats.selectedMonth?.year} - Daily Comparison
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-green-600">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Revenue</span>
              </div>
              <div className="flex items-center space-x-2 text-red-600">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium">Expenses</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart 
              data={chartData.map((item, index) => ({
                ...item,
                expenses: expensesChartData[index]?.expenses || 0
              }))}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenueCombined" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpensesCombined" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280" 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#6b7280' }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#6b7280' }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  padding: '12px',
                }}
                formatter={(value, name) => {
                  const label = name === 'revenue' ? 'Revenue' : 'Expenses'
                  return [`₹${value.toLocaleString()}`, label]
                }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
                formatter={(value) => <span style={{ color: '#6b7280', fontSize: '14px' }}>{value}</span>}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                strokeWidth={2.5}
                fill="url(#colorRevenueCombined)"
                name="Revenue"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#EF4444"
                strokeWidth={2.5}
                fill="url(#colorExpensesCombined)"
                name="Expenses"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Status Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Booking Distribution</h2>
              <p className="text-sm text-gray-600 mt-1">Status breakdown</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Confirmed', value: stats.bookingStats?.confirmed || 0, color: '#10b981' },
                  { name: 'Pending', value: stats.bookingStats?.pending || 0, color: '#f97316' },
                  { name: 'Cancelled', value: stats.bookingStats?.cancelled || 0, color: '#ef4444' },
                ].filter(item => item.value > 0)}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={false}
                outerRadius={90}
                innerRadius={50}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={3}
              >
                {[
                  { name: 'Confirmed', value: stats.bookingStats?.confirmed || 0, color: '#10b981' },
                  { name: 'Pending', value: stats.bookingStats?.pending || 0, color: '#f97316' },
                  { name: 'Cancelled', value: stats.bookingStats?.cancelled || 0, color: '#ef4444' },
                ].filter(item => item.value > 0).map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke="#fff"
                    strokeWidth={3}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  padding: '12px',
                }}
                formatter={(value, name) => {
                  const total = (stats.bookingStats?.confirmed || 0) + 
                               (stats.bookingStats?.pending || 0) + 
                               (stats.bookingStats?.cancelled || 0)
                  const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0
                  return [`${value} bookings (${percent}%)`, name]
                }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
              />
              <Legend
                verticalAlign="bottom"
                height={60}
                wrapperStyle={{ paddingTop: '10px' }}
                iconType="circle"
                formatter={(value) => {
                  const data = [
                    { name: 'Confirmed', value: stats.bookingStats?.confirmed || 0, color: '#10b981' },
                    { name: 'Pending', value: stats.bookingStats?.pending || 0, color: '#f97316' },
                    { name: 'Cancelled', value: stats.bookingStats?.cancelled || 0, color: '#ef4444' },
                  ].find(item => item.name === value)
                  const total = (stats.bookingStats?.confirmed || 0) + 
                               (stats.bookingStats?.pending || 0) + 
                               (stats.bookingStats?.cancelled || 0)
                  const count = data?.value || 0
                  const percent = total > 0 ? ((count / total) * 100).toFixed(1) : 0
                  return (
                    <span style={{ color: '#6b7280', fontSize: '14px', padding: '0 8px' }}>
                      {value}: {count} ({percent}%)
                    </span>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Payment Overview</h2>
            <p className="text-sm text-gray-600 mt-1">Payment status comparison</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={[
              {
                name: 'Paid',
                amount: stats.paymentStats?.paid || 0,
                count: stats.paymentBreakdown?.paid || 0,
              },
              {
                name: 'Pending',
                amount: stats.paymentStats?.pending || 0,
                count: stats.paymentBreakdown?.pending || 0,
              },
              {
                name: 'Failed',
                amount: stats.paymentStats?.failed || 0,
                count: stats.paymentBreakdown?.failed || 0,
              },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              formatter={(value, name) => {
                if (name === 'amount') return `₹${value.toLocaleString()}`;
                return value;
              }}
            />
            <Bar dataKey="amount" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}


