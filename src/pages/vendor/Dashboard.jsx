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
  CreditCard,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import './Dashboard.css'

// Custom Tooltip Component for better value display
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // Debug log to see payload structure
    if (payload[0]?.value !== undefined) {
      console.log('Tooltip Payload:', { label, payload: payload.map(p => ({ dataKey: p.dataKey, value: p.value, payload: p.payload })) });
    }
    
    return (
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <p style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
          Day {label || 'N/A'}
        </p>
        {payload.map((entry, index) => {
          // Recharts passes value in entry.value, but also check payload
          let value = entry.value;
          
          // If value is undefined/null/0, try getting from payload using dataKey
          if (value === undefined || value === null || (value === 0 && entry.payload)) {
            const dataKey = entry.dataKey || '';
            value = entry.payload?.[dataKey];
          }
          
          // Final fallback - try payload directly
          if (value === undefined || value === null) {
            value = entry.payload?.revenue || entry.payload?.expenses || entry.value || 0;
          }
          
          const numValue = Number(value) || 0;
          const dataKey = entry.dataKey || '';
          const name = dataKey === 'revenue' ? 'Revenue' : dataKey === 'expenses' ? 'Expenses' : entry.name || 'Value';
          const color = dataKey === 'revenue' ? '#10B981' : dataKey === 'expenses' ? '#EF4444' : '#6b7280';
          
          return (
            <p key={index} style={{ color, margin: '4px 0', fontSize: '13px' }}>
              {name}: ₹{numValue.toLocaleString('en-IN')}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

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
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [venues, setVenues] = useState([])
  const [datesData, setDatesData] = useState([])
  const [calendarEvents, setCalendarEvents] = useState([])
  const [bookings, setBookings] = useState([])
  const [calendarLoading, setCalendarLoading] = useState(true)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showEventsListModal, setShowEventsListModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [eventTitle, setEventTitle] = useState('')
  const [eventType, setEventType] = useState('task')
  const [eventDate, setEventDate] = useState(null)
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
    loadVenues()
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    if (venues.length > 0) {
      loadDatesData()
      loadCalendarEvents()
      loadBookings()
    }
  }, [venues, selectedVenue])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const response = await vendorAPI.getDashboard(selectedMonth, selectedYear)
      const dashboardData = response.data
      
      // Log for debugging - COMPREHENSIVE DATA CHECK
      console.log('=== DASHBOARD API RESPONSE ===');
      console.log('Monthly Revenue:', dashboardData.monthlyRevenue);
      console.log('Monthly Expenses:', dashboardData.monthlyExpenses);
      console.log('Daily Revenue Object:', dashboardData.dailyRevenue);
      console.log('Daily Expenses Object:', dashboardData.dailyExpenses);
      console.log('Daily Revenue Type:', typeof dashboardData.dailyRevenue);
      console.log('Daily Expenses Type:', typeof dashboardData.dailyExpenses);
      console.log('Daily Revenue Keys:', dashboardData.dailyRevenue ? Object.keys(dashboardData.dailyRevenue) : 'N/A');
      console.log('Daily Expenses Keys:', dashboardData.dailyExpenses ? Object.keys(dashboardData.dailyExpenses) : 'N/A');
      
      // Check sample values
      if (dashboardData.dailyRevenue) {
        console.log('Sample Revenue Values:', {
          day1: dashboardData.dailyRevenue[1],
          day15: dashboardData.dailyRevenue[15],
          day28: dashboardData.dailyRevenue[28],
          day1String: dashboardData.dailyRevenue['1'],
          day15String: dashboardData.dailyRevenue['15'],
          day28String: dashboardData.dailyRevenue['28']
        });
      }
      
      if (dashboardData.dailyExpenses) {
        console.log('Sample Expense Values:', {
          day1: dashboardData.dailyExpenses[1],
          day15: dashboardData.dailyExpenses[15],
          day28: dashboardData.dailyExpenses[28],
          day1String: dashboardData.dailyExpenses['1'],
          day15String: dashboardData.dailyExpenses['15'],
          day28String: dashboardData.dailyExpenses['28']
        });
      }
      
      console.log('=== END DASHBOARD API RESPONSE ===');
      
      // Fetch total expenses from ledger (for total across all time)
      try {
        const ledgerResponse = await vendorAPI.getLedger()
        dashboardData.totalExpenses = ledgerResponse.data?.summary?.totalExpenses || 0
        // monthlyExpenses should come from dashboard API, but use ledger as fallback
        if (!dashboardData.monthlyExpenses && dashboardData.monthlyExpenses !== 0) {
        dashboardData.monthlyExpenses = ledgerResponse.data?.summary?.monthlyExpenses || 0
        }
      } catch (ledgerError) {
        console.error('Failed to load ledger data:', ledgerError)
        dashboardData.totalExpenses = dashboardData.totalExpenses || 0
        // Only set to 0 if it's undefined, not if it's already 0 from API
        if (dashboardData.monthlyExpenses === undefined) {
        dashboardData.monthlyExpenses = 0
        }
      }
      
      setStats(dashboardData)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadVenues = async () => {
    try {
      const response = await vendorAPI.getVenues()
      const venuesData = response.data?.data || response.data || []
      setVenues(venuesData)
      if (venuesData.length > 0 && !selectedVenue) {
        setSelectedVenue(venuesData[0]._id || venuesData[0].id)
      }
    } catch (error) {
      console.error('Failed to load venues:', error)
    }
  }

  const loadDatesData = async () => {
    try {
      setCalendarLoading(true)
      // Load for all venues if no venue selected, otherwise for selected venue
      const response = await vendorAPI.getBlockedDates(selectedVenue || null)
      const data = response.data?.data || []
      setDatesData(Array.isArray(data) ? data : [data])
    } catch (error) {
      console.error('Failed to load dates:', error)
      setDatesData([])
    } finally {
      setCalendarLoading(false)
    }
  }

  const loadCalendarEvents = async () => {
    try {
      // Load for all venues if no venue selected, otherwise for selected venue
      const response = await vendorAPI.getCalendarEvents(selectedVenue || null)
      const data = response.data?.data || response.data || []
      setCalendarEvents(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load calendar events:', error)
      setCalendarEvents([])
    }
  }

  const loadBookings = async () => {
    try {
      // Load for all venues if no venue selected, otherwise for selected venue
      const response = await vendorAPI.getBookings(selectedVenue ? { venueId: selectedVenue } : {})
      const data = response.data?.bookings || response.data?.data || []
      setBookings(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load bookings:', error)
      setBookings([])
    }
  }


  const getDateStatus = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const today = format(new Date(), 'yyyy-MM-dd')
    
    if (dateStr < today) {
      return 'past'
    }

    // Check actual bookings for this date (most accurate - uses real-time data)
    const dateBookings = getDateBookings(date)
    if (dateBookings.length > 0) {
      return 'booked'
    }

    // Fallback to datesData from backend (check all venues if no venue selected)
    if (selectedVenue) {
      const venueData = datesData.find(d => 
        (d.venueId === selectedVenue) || 
        (d.venueId?._id === selectedVenue) || 
        (d.venueId?.toString() === selectedVenue)
      )

      const { bookedDates = [] } = venueData || {}

      // Double check - only mark as booked if it's actually in the bookings array
      if (bookedDates.includes(dateStr)) {
        // Verify it's actually a booking (not just in the list)
        const hasActualBooking = bookings.some(booking => {
          const bookingVenueId = booking.venueId?._id || booking.venueId || booking.venue?._id || booking.venue
          if (bookingVenueId?.toString() !== selectedVenue) return false
          
          if (booking.dateFrom && booking.dateTo) {
            const dateFrom = format(new Date(booking.dateFrom), 'yyyy-MM-dd')
            const dateTo = format(new Date(booking.dateTo), 'yyyy-MM-dd')
            return dateStr >= dateFrom && dateStr <= dateTo
          }
          const bookingDate = booking.date || booking.eventDate
          if (!bookingDate) return false
          return format(new Date(bookingDate), 'yyyy-MM-dd') === dateStr
        })
        
        if (hasActualBooking) {
          return 'booked'
        }
      }
    } else {
      // Check all venues' booked dates
      const allBookedDates = datesData.flatMap(d => d.bookedDates || [])
      if (allBookedDates.includes(dateStr)) {
        // Verify it's actually a booking
        const hasActualBooking = bookings.some(booking => {
          if (booking.dateFrom && booking.dateTo) {
            const dateFrom = format(new Date(booking.dateFrom), 'yyyy-MM-dd')
            const dateTo = format(new Date(booking.dateTo), 'yyyy-MM-dd')
            return dateStr >= dateFrom && dateStr <= dateTo
          }
          const bookingDate = booking.date || booking.eventDate
          if (!bookingDate) return false
          return format(new Date(bookingDate), 'yyyy-MM-dd') === dateStr
        })
        
        if (hasActualBooking) {
          return 'booked'
        }
      }
    }
    
    return 'available'
  }

  const getDateEvents = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return calendarEvents.filter(event => {
      // If venue is selected, filter by venue
      if (selectedVenue) {
        const eventVenueId = event.venueId?._id || event.venueId
        if (eventVenueId?.toString() !== selectedVenue) {
          return false
        }
      }
      
      const eventDate = format(new Date(event.date), 'yyyy-MM-dd')
      return eventDate === dateStr
    })
  }

  const getDateBookings = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const currentDate = new Date(date)
    currentDate.setHours(0, 0, 0, 0)
    
    return bookings.filter(booking => {
      // If venue is selected, filter by venue
      if (selectedVenue) {
        const bookingVenueId = booking.venueId?._id || booking.venueId || booking.venue?._id || booking.venue
        if (bookingVenueId?.toString() !== selectedVenue) {
          return false
        }
      }
      
      // Check if booking has dateFrom and dateTo (date range)
      if (booking.dateFrom && booking.dateTo) {
        const dateFrom = new Date(booking.dateFrom)
        const dateTo = new Date(booking.dateTo)
        dateFrom.setHours(0, 0, 0, 0)
        dateTo.setHours(0, 0, 0, 0)
        
        // Check if current date falls within the range
        return currentDate >= dateFrom && currentDate <= dateTo
      }
      
      // Fallback to single date check
      const bookingDate = booking.date || booking.eventDate
      if (!bookingDate) return false
      const bookingDateObj = new Date(bookingDate)
      bookingDateObj.setHours(0, 0, 0, 0)
      return bookingDateObj.getTime() === currentDate.getTime()
    })
  }

  const handleDateClick = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const today = format(new Date(), 'yyyy-MM-dd')
    
    // Don't allow editing past dates
    if (dateStr < today) return

    const events = getDateEvents(date)
    const dateBookings = getDateBookings(date)
    setSelectedDate(date)
    
    // Show events/bookings list if there are any, otherwise show add modal
    if (events.length > 0 || dateBookings.length > 0) {
      setShowEventsListModal(true)
    } else {
      // Open add modal for new event
      setSelectedEvent(null)
      setEventTitle('')
      setEventType('task')
      setEventDate(date)
      setShowEventModal(true)
    }
  }

  const handleAddNewEvent = () => {
    setSelectedEvent(null)
    setEventTitle('')
    setEventType('task')
    setEventDate(selectedDate)
    setShowEventsListModal(false)
    setShowEventModal(true)
  }

  const handleEditEvent = (event) => {
    setSelectedEvent(event)
    setEventTitle(event.title || '')
    setEventType(event.type || 'task')
    setEventDate(new Date(event.date))
    setShowEventsListModal(false)
    setShowEventModal(true)
  }

  const handleSaveEvent = async () => {
    if (!eventDate || !eventTitle.trim()) return

    try {
      const dateStr = format(eventDate, 'yyyy-MM-dd')
      const eventData = {
        venueId: selectedVenue,
        date: dateStr,
        title: eventTitle.trim(),
        type: eventType
      }

      if (selectedEvent) {
        // Update existing event - also update date if changed
        const updateData = {
          ...eventData,
          date: dateStr
        }
        await vendorAPI.updateCalendarEvent(selectedEvent._id || selectedEvent.id, updateData)
      } else {
        // Create new event
        await vendorAPI.createCalendarEvent(eventData)
      }

      await loadCalendarEvents()
      setShowEventModal(false)
      setSelectedDate(null)
      setSelectedEvent(null)
      setEventTitle('')
      setEventType('task')
      setEventDate(null)
    } catch (error) {
      console.error('Failed to save event:', error)
      alert('Failed to save event. Please try again.')
    }
  }

  const handleDeleteEvent = async (eventToDelete = null) => {
    const event = eventToDelete || selectedEvent
    if (!event) return

    if (!window.confirm('Are you sure you want to delete this event?')) return

    try {
      await vendorAPI.deleteCalendarEvent(event._id || event.id)
      await loadCalendarEvents()
      
      if (eventToDelete) {
        // If deleting from list, refresh the list
        const events = getDateEvents(selectedDate)
        if (events.length <= 1) {
          setShowEventsListModal(false)
        }
      } else {
        setShowEventModal(false)
      }
      
      setSelectedDate(null)
      setSelectedEvent(null)
      setEventTitle('')
      setEventType('task')
      setEventDate(null)
    } catch (error) {
      console.error('Failed to delete event:', error)
      alert('Failed to delete event. Please try again.')
    }
  }

  // Generate chart data for the selected month (daily breakdown) - Using REAL data
  const generateMonthlyChartData = () => {
    const year = stats.selectedMonth?.year || selectedYear
    // Backend returns month as 1-indexed (1-12), convert to 0-indexed for Date constructor
    const month = (stats.selectedMonth?.month || selectedMonth) - 1
    // Get last day of the month: new Date(year, month + 1, 0) where month is 0-indexed
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const chartData = []
    
    // Use real daily revenue data from backend
    const dailyRevenue = stats.dailyRevenue || {}
    
    console.log('=== REVENUE CHART DATA GENERATION ===');
    console.log('Stats.dailyRevenue:', dailyRevenue);
    console.log('Daily Revenue Type:', typeof dailyRevenue);
    console.log('Daily Revenue Keys:', Object.keys(dailyRevenue));
    console.log('Daily Revenue Length:', Object.keys(dailyRevenue).length);
    
    // Log first few chart data points for debugging
    const sampleChartData = [];
    for (let day = 1; day <= Math.min(10, daysInMonth); day++) {
      const dayRevenueValue = dailyRevenue[day] || dailyRevenue[String(day)] || dailyRevenue[`${day}`] || 0;
      const numValue = Number(dayRevenueValue) || 0;
      sampleChartData.push({ day, revenue: numValue, rawValue: dayRevenueValue });
      
      if (numValue > 0) {
        console.log(`Day ${day} Revenue:`, {
          numberKey: dailyRevenue[day],
          stringKey: dailyRevenue[String(day)],
          templateKey: dailyRevenue[`${day}`],
          finalValue: numValue
        });
      }
    }
    
    // Check specific days 25-30 for date range bookings
    const days25to30 = {};
    for (let day = 25; day <= 30; day++) {
      const dayValue = dailyRevenue[day] || dailyRevenue[String(day)] || dailyRevenue[`${day}`] || 0;
      days25to30[`day${day}`] = Number(dayValue) || 0;
    }
    
    console.log('Revenue Chart Summary:', {
      year,
      month: month + 1,
      daysInMonth,
      totalKeys: Object.keys(dailyRevenue).length,
      sampleChartData,
      days25to30,
      totalRevenue: Object.values(dailyRevenue).reduce((sum, val) => sum + (Number(val) || 0), 0),
      allValues: Object.entries(dailyRevenue).slice(0, 10)
    });
    console.log('=== END REVENUE CHART DATA ===');
    
    for (let day = 1; day <= daysInMonth; day++) {
      // Get real revenue for this day - check both string and number keys
      // Backend might return day as string key, so check both
      const dayRevenue = dailyRevenue[day] || dailyRevenue[String(day)] || dailyRevenue[`${day}`] || 0
      
      const revenueValue = Number(dayRevenue) || 0;
      const chartItem = {
        name: day <= 10 ? `${day}` : day % 5 === 0 ? `${day}` : '',
        revenue: revenueValue,
        day: day
      };
      chartData.push(chartItem);
      
      // Debug log for days with revenue or first few days
      if (revenueValue > 0 || day <= 3) {
        console.log(`Revenue Day ${day}:`, {
          dayRevenue,
          revenueValue,
          chartItem,
          keys: Object.keys(dailyRevenue),
          hasKey: dailyRevenue.hasOwnProperty(day) || dailyRevenue.hasOwnProperty(String(day))
        });
      }
    }
    
    return chartData
  }

  // Generate expenses chart data for the selected month (daily breakdown) - Using REAL data
  const generateMonthlyExpensesChartData = () => {
    const year = stats.selectedMonth?.year || selectedYear
    // Backend returns month as 1-indexed (1-12), convert to 0-indexed for Date constructor
    const month = (stats.selectedMonth?.month || selectedMonth) - 1
    // Get last day of the month: new Date(year, month + 1, 0) where month is 0-indexed
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const chartData = []
    
    // Use real daily expenses data from backend
    const dailyExpenses = stats.dailyExpenses || {}
    
    console.log('=== EXPENSES CHART DATA GENERATION ===');
    console.log('Stats.dailyExpenses:', dailyExpenses);
    console.log('Daily Expenses Type:', typeof dailyExpenses);
    console.log('Daily Expenses Keys:', Object.keys(dailyExpenses));
    console.log('Daily Expenses Length:', Object.keys(dailyExpenses).length);
    
    // Log first few chart data points for debugging
    const sampleExpensesData = [];
    for (let day = 1; day <= Math.min(10, daysInMonth); day++) {
      const dayExpensesValue = dailyExpenses[day] || dailyExpenses[String(day)] || dailyExpenses[`${day}`] || 0;
      const numValue = Number(dayExpensesValue) || 0;
      sampleExpensesData.push({ day, expenses: numValue, rawValue: dayExpensesValue });
      
      if (numValue > 0) {
        console.log(`Day ${day} Expenses:`, {
          numberKey: dailyExpenses[day],
          stringKey: dailyExpenses[String(day)],
          templateKey: dailyExpenses[`${day}`],
          finalValue: numValue
        });
      }
    }
    
    console.log('Expenses Chart Summary:', {
      year,
      month: month + 1,
      daysInMonth,
      totalKeys: Object.keys(dailyExpenses).length,
      sampleExpensesData,
      totalExpenses: Object.values(dailyExpenses).reduce((sum, val) => sum + (Number(val) || 0), 0),
      allValues: Object.entries(dailyExpenses).slice(0, 10)
    });
    console.log('=== END EXPENSES CHART DATA ===');
    
    for (let day = 1; day <= daysInMonth; day++) {
      // Get real expenses for this day - check both string and number keys
      // Backend might return day as string key, so check both
      const dayExpenses = dailyExpenses[day] || dailyExpenses[String(day)] || dailyExpenses[`${day}`] || 0
      
      const expensesValue = Number(dayExpenses) || 0;
      const chartItem = {
        name: day <= 10 ? `${day}` : day % 5 === 0 ? `${day}` : '',
        expenses: expensesValue,
        day: day
      };
      chartData.push(chartItem);
      
      // Debug log for days with expenses or first few days
      if (expensesValue > 0 || day <= 3) {
        console.log(`Expenses Day ${day}:`, {
          dayExpenses,
          expensesValue,
          chartItem,
          keys: Object.keys(dailyExpenses),
          hasKey: dailyExpenses.hasOwnProperty(day) || dailyExpenses.hasOwnProperty(String(day))
        });
      }
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
          <h1 className="text-3xl font-bold text-gray-900">Calendar Management</h1>
          <p className="text-gray-600 mt-1">Manage booked and blocked dates for your venues</p>
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

      {/* Calendar Section - Moved to Top */}
      <div className="calendar-section">
        <div className="calendar-container">
          <div className="calendar-header">
            <div className="calendar-title-section">
              <h2 className="calendar-title">Calendar View</h2>
              <p className="calendar-subtitle">View booked and blocked dates</p>
            </div>
            {venues.length > 0 && (
              <select
                value={selectedVenue || 'all'}
                onChange={(e) => {
                  const value = e.target.value
                  setSelectedVenue(value === 'all' ? null : value)
                }}
                className="calendar-venue-select"
              >
                <option value="all">All Venues</option>
                {venues.map((venue) => (
                  <option key={venue._id || venue.id} value={venue._id || venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {venues.length === 0 ? (
            <div className="empty-calendar">
              <CalendarDays className="empty-calendar-icon" />
              <p className="empty-calendar-text">No venues found. Add a venue to see calendar.</p>
        </div>
          ) : (
            <>
              {/* Calendar Header */}
              <div className="calendar-nav">
                <button
                  onClick={() => setCalendarDate(subMonths(calendarDate, 1))}
                  className="calendar-nav-button"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="calendar-month">
                  {format(calendarDate, 'MMMM yyyy')}
                </h3>
                <button
                  onClick={() => setCalendarDate(addMonths(calendarDate, 1))}
                  className="calendar-nav-button"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Legend */}
              <div className="calendar-legend">
                <div className="calendar-legend-item">
                  <div className="calendar-legend-color" style={{ backgroundColor: '#dcfce7', border: '2px solid #16a34a' }}></div>
                  <span className="calendar-legend-text">Available</span>
                </div>
                <div className="calendar-legend-item">
                  <div className="calendar-legend-color" style={{ backgroundColor: '#ef4444' }}></div>
                  <span className="calendar-legend-text">Booked</span>
                </div>
                <div className="calendar-legend-item">
                  <div className="calendar-legend-color" style={{ backgroundColor: '#d1d5db' }}></div>
                  <span className="calendar-legend-text">Past</span>
                </div>
              </div>

              {/* Calendar Grid - Using Flexbox */}
              <div className="calendar-grid">
                {/* Day Headers */}
                <div className="calendar-week">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="calendar-day-header">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                {(() => {
                  const monthStart = startOfMonth(calendarDate)
                  const monthEnd = endOfMonth(calendarDate)
                  const calendarStart = startOfWeek(monthStart)
                  const calendarEnd = endOfWeek(monthEnd)
                  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
                  
                  // Group days into weeks
                  const weeks = []
                  for (let i = 0; i < days.length; i += 7) {
                    weeks.push(days.slice(i, i + 7))
                  }

                  return weeks.map((week, weekIdx) => (
                    <div key={weekIdx} className="calendar-week">
                      {week.map((day, dayIdx) => {
                        const status = getDateStatus(day)
                        const isCurrentMonth = isSameMonth(day, calendarDate)
                        const isToday = isSameDay(day, new Date())
                        const events = getDateEvents(day)

                        let dayClass = 'calendar-day '
                        if (!isCurrentMonth) {
                          dayClass += 'other-month '
                        } else if (status === 'past') {
                          dayClass += 'past '
                        } else if (status === 'booked') {
                          dayClass += 'booked '
                        } else {
                          dayClass += 'available '
                        }

                        if (isToday && isCurrentMonth) {
                          dayClass += 'today '
                        }

                        const dateBookings = getDateBookings(day)
                        const totalItems = events.length + dateBookings.length
                        const hasTasks = events.filter(e => e.type === 'task').length > 0
                        const hasBookEvents = events.filter(e => e.type === 'book').length > 0
                        const hasBookings = dateBookings.length > 0

                        if (totalItems > 0 && isCurrentMonth) {
                          dayClass += 'has-event '
                        }

                        return (
                          <div
                            key={dayIdx}
                            className={dayClass}
                            onClick={() => isCurrentMonth && handleDateClick(day)}
                            style={{ cursor: isCurrentMonth && status !== 'past' ? 'pointer' : 'default' }}
                          >
                            <span className="calendar-day-number">{format(day, 'd')}</span>
                            {/* Show type indicators below date number */}
                            {isCurrentMonth && totalItems > 0 && (
                              <div className="calendar-type-indicators">
                                {/* Show Booking badge only for actual bookings */}
                                {hasBookings && (
                                  <span className="calendar-type-badge booking-badge" title="Booking">
                                    Booking
                                  </span>
                                )}
                                {/* Show Task badge for task events */}
                                {hasTasks && (
                                  <span className="calendar-type-badge task-badge" title="Task">
                                    Task
                                  </span>
                                )}
                                {/* Show Book badge for book type events (only if no actual booking) */}
                                {hasBookEvents && !hasBookings && (
                                  <span className="calendar-type-badge book-event-badge" title="Book Event">
                                    Book
                                  </span>
                                )}
                              </div>
                            )}
                            {totalItems > 0 && isCurrentMonth && (
                              <div className="calendar-events-container">
                                {/* Show bookings first */}
                                {dateBookings.slice(0, 1).map((booking, idx) => {
                                  const customerName = booking.name || booking.customer?.name || booking.customerId?.name || 'Booking'
                                  return (
                                    <div 
                                      key={`booking-${idx}`}
                                      className="calendar-event-indicator" 
                                      style={{
                                        backgroundColor: '#ef4444'
                                      }}
                                      title={`Booking: ${customerName}`}
                                    >
                                      <span className="calendar-event-title">📅 {customerName}</span>
                                    </div>
                                  )
                                })}
                                {/* Show events */}
                                {events.slice(0, dateBookings.length > 0 ? 1 : 2).map((event, idx) => (
                                  <div 
                                    key={`event-${idx}`}
                                    className="calendar-event-indicator" 
                                    style={{
                                      backgroundColor: event.type === 'book' ? '#f97316' : '#8b5cf6'
                                    }}
                                  >
                                    <span className="calendar-event-title">{event.title}</span>
                                  </div>
                                ))}
                                {totalItems > 2 && (
                                  <div className="calendar-event-more">
                                    +{totalItems - 2}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))
                })()}
              </div>

            </>
          )}
        </div>

        {/* Events List Modal */}
        {showEventsListModal && selectedDate && (
          <div className="event-modal-overlay" onClick={() => setShowEventsListModal(false)}>
            <div className="event-modal events-list-modal" onClick={(e) => e.stopPropagation()}>
              <div className="event-modal-header">
                <h3>Events - {format(selectedDate, 'dd MMMM yyyy')}</h3>
                <button 
                  className="event-modal-close"
                  onClick={() => setShowEventsListModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="events-list-body">
                {/* Show Bookings First */}
                {getDateBookings(selectedDate).map((booking) => {
                  const customerName = booking.name || booking.customer?.name || booking.customerId?.name || 'Customer'
                  const customerPhone = booking.phone || booking.customer?.phone || booking.customerId?.phone || 'N/A'
                  const venue = booking.venue || booking.venueId
                  const venueName = venue?.name || 'Venue'
                  return (
                    <div key={booking._id || booking.id} className="event-list-item booking-item">
                      <div className="event-list-item-content">
                        <div className="event-list-item-type" style={{
                          backgroundColor: '#ef4444'
                        }}>
                          📅 Booking
                        </div>
                        <div className="event-list-item-details">
                          <div className="event-list-item-title">{customerName}</div>
                          <div className="event-list-item-subtitle">
                            <span>Phone: {customerPhone}</span>
                            {!selectedVenue && <span>Venue: {venueName}</span>}
                            {booking.guests && <span>Guests: {booking.guests}</span>}
                            {booking.totalAmount && <span>Amount: ₹{booking.totalAmount.toLocaleString()}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="event-list-item-actions">
                        <button
                          className="event-list-view-btn"
                          onClick={() => navigate('/vendor/bookings')}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  )
                })}
                {/* Show Events */}
                {getDateEvents(selectedDate).map((event) => {
                  const eventVenue = event.venueId
                  const eventVenueName = eventVenue?.name || 'Venue'
                  return (
                    <div key={event._id || event.id} className="event-list-item">
                      <div className="event-list-item-content">
                        <div className="event-list-item-type" style={{
                          backgroundColor: event.type === 'book' ? '#f97316' : '#8b5cf6'
                        }}>
                          {event.type === 'book' ? 'Book' : 'Task'}
                        </div>
                        <div className="event-list-item-details">
                          <div className="event-list-item-title">{event.title}</div>
                          {!selectedVenue && (
                            <div className="event-list-item-subtitle">
                              <span>Venue: {eventVenueName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="event-list-item-actions">
                        <button
                          className="event-list-edit-btn"
                          onClick={() => handleEditEvent(event)}
                        >
                          Edit
                        </button>
                        <button
                          className="event-list-delete-btn"
                          onClick={() => handleDeleteEvent(event)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
                {getDateEvents(selectedDate).length === 0 && getDateBookings(selectedDate).length === 0 && (
                  <div className="events-list-empty">
                    <p>No events or bookings for this date</p>
                  </div>
                )}
              </div>
              <div className="event-modal-footer">
                <button
                  className="event-modal-save"
                  onClick={handleAddNewEvent}
                >
                  + Add New Event
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Event Modal */}
        {showEventModal && (
          <div className="event-modal-overlay" onClick={() => setShowEventModal(false)}>
            <div className="event-modal" onClick={(e) => e.stopPropagation()}>
              <div className="event-modal-header">
                <h3>{selectedEvent ? 'Edit Event' : 'Add Event'}</h3>
                <button 
                  className="event-modal-close"
                  onClick={() => setShowEventModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="event-modal-body">
                <div className="event-modal-field">
                  <label>Date</label>
                  <input
                    type="date"
                    value={eventDate ? format(eventDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value)
                      if (!isNaN(newDate.getTime())) {
                        setEventDate(newDate)
                      }
                    }}
                    className="event-modal-input"
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
                <div className="event-modal-field">
                  <label>Title</label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Enter event title"
                    className="event-modal-input"
                    autoFocus
                  />
                </div>
                <div className="event-modal-field">
                  <label>Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="event-modal-select"
                  >
                    <option value="task">Task</option>
                    <option value="book">Book</option>
                  </select>
                </div>
              </div>
              <div className="event-modal-footer">
                {selectedEvent && (
                  <button
                    className="event-modal-delete"
                    onClick={handleDeleteEvent}
                  >
                    Delete
                  </button>
                )}
                <div style={{ flex: 1 }}></div>
                <button
                  className="event-modal-cancel"
                  onClick={() => setShowEventModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="event-modal-save"
                  onClick={handleSaveEvent}
                  disabled={!eventTitle.trim()}
                >
                  {selectedEvent ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Right Side - Stats Cards */}
        <div className="calendar-right-side">
          <div className="stats-section">
            <h2 className="stats-title">Overview</h2>
            <div className="stats-grid">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <button
              key={index}
              onClick={stat.action}
                    className="stat-card"
                  >
                    <div className="stat-icon-container">
                      <div className={`stat-icon-wrapper ${stat.color || 'primary'}`}>
                        {stat.icon ? <Icon className="w-4 h-4" /> : <span style={{ fontSize: '18px', fontWeight: 'bold' }}>₹</span>}
                </div>
              </div>
                    <h3 className="stat-title">{stat.title}</h3>
                    <p className="stat-value">{stat.value}</p>
              {stat.subtitle && (
                      <p className="stat-subtitle">{stat.subtitle}</p>
              )}
            </button>
          )
        })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-section">
            <h2 className="quick-actions-title">Quick Actions</h2>
            <button
              onClick={() => navigate('/vendor/venues')}
              className="quick-action-button"
            >
              <div className="quick-action-icon-wrapper primary">
                <Plus className="w-4 h-4" style={{ color: '#8b5cf6' }} />
              </div>
              <span className="quick-action-text">Add Venue</span>
            </button>
            <button
              onClick={() => navigate('/vendor/venues')}
              className="quick-action-button"
            >
              <div className="quick-action-icon-wrapper accent">
                <Eye className="w-4 h-4" style={{ color: '#ec4899' }} />
              </div>
              <span className="quick-action-text">Manage Venues</span>
            </button>
            <button
              onClick={() => navigate('/vendor/bookings')}
              className="quick-action-button"
            >
              <div className="quick-action-icon-wrapper green">
                <Calendar className="w-4 h-4" style={{ color: '#16a34a' }} />
              </div>
              <span className="quick-action-text">View Bookings</span>
            </button>
            <button
              onClick={() => navigate('/vendor/payouts')}
              className="quick-action-button"
            >
              <div className="quick-action-icon-wrapper orange">
                <Wallet className="w-4 h-4" style={{ color: '#ea580c' }} />
              </div>
              <span className="quick-action-text">Payouts</span>
            </button>
          </div>
        </div>
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6">
        {/* Combined Revenue & Expenses Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
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
              data={chartData.map((item, index) => {
                const expenseValue = expensesChartData[index]?.expenses || 0;
                const revenueValue = item.revenue || 0;
                const combinedData = {
                  name: item.name || '',
                  day: item.day || index + 1,
                  revenue: Number(revenueValue) || 0,
                  expenses: Number(expenseValue) || 0
                };
                
                // Debug items with data, especially days 25-30
                const day = item.day || index + 1;
                if ((index < 5 || (day >= 25 && day <= 30)) && (Number(revenueValue) > 0 || Number(expenseValue) > 0)) {
                  console.log(`Combined Chart Data Day ${day} [${index}]:`, {
                    ...combinedData,
                    day,
                    revenueValue,
                    expenseValue
                  });
                }
                
                return combinedData;
              })}
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
              <Tooltip content={<CustomTooltip />} />
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


