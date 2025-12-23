import { useState, useEffect } from 'react'
import { vendorAPI } from '../../services/vendor/api'
import { 
  Calendar, 
  Users, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  Plus,
  X
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Pagination } from '../../components/admin/ui/Pagination'

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedBookings, setExpandedBookings] = useState(new Set())
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const [venues, setVenues] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    venueId: '',
    date: '',
    dateFrom: '',
    dateTo: '',
    name: '',
    phone: '',
    email: '',
    marriageFor: 'boy',
    personName: '',
    guests: '',
    foodPreference: 'both',
    totalAmount: ''
  })
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [bookingToUpdate, setBookingToUpdate] = useState(null)
  const [newStatus, setNewStatus] = useState(null)

  useEffect(() => {
    loadBookings()
    loadVenues()
  }, [])

  useEffect(() => {
    loadBookings()
  }, [pagination.page])

  const loadVenues = async () => {
    try {
      const response = await vendorAPI.getVenues()
      const venuesData = response.data?.data || response.data || []
      setVenues(venuesData)
      if (venuesData.length > 0 && !formData.venueId) {
        setFormData(prev => ({ ...prev, venueId: venuesData[0]._id || venuesData[0].id }))
      }
    } catch (error) {
      console.error('Failed to load venues:', error)
    }
  }

  const loadBookings = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.page,
        limit: pagination.limit
      }
      const response = await vendorAPI.getBookings(params)
      const bookingsData = response.data?.bookings || response.data?.data || response.data || []
      // Ensure it's always an array
      setBookings(Array.isArray(bookingsData) ? bookingsData : [])
      
      // Update pagination from response
      if (response.data?.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || response.data.totalCount || bookingsData.length,
          pages: response.data.pagination.pages || response.data.totalPages || 1
        }))
      } else if (response.data?.totalCount) {
        setPagination(prev => ({
          ...prev,
          total: response.data.totalCount,
          pages: Math.ceil(response.data.totalCount / pagination.limit)
        }))
      }
    } catch (error) {
      console.error('Failed to load bookings:', error)
      setBookings([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdateClick = (bookingId, status) => {
    setBookingToUpdate(bookingId)
    setNewStatus(status)
    setShowStatusModal(true)
  }

  const handleStatusUpdateConfirm = async () => {
    if (!bookingToUpdate || !newStatus) return

    try {
      await vendorAPI.updateBookingStatus(bookingToUpdate, newStatus)
      // Close modal first
      setShowStatusModal(false)
      setBookingToUpdate(null)
      setNewStatus(null)
      // Then show toast and refresh
      setTimeout(() => {
        toast.success(`Booking ${newStatus} successfully!`)
      }, 100)
      loadBookings()
    } catch (error) {
      // Close modal first
      setShowStatusModal(false)
      setBookingToUpdate(null)
      setNewStatus(null)
      // Then show error toast
      setTimeout(() => {
        toast.error(error.response?.data?.error || 'Failed to update booking status')
      }, 100)
    }
  }

  const handleStatusUpdateCancel = () => {
    setShowStatusModal(false)
    setBookingToUpdate(null)
    setNewStatus(null)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAddBooking = async (e) => {
    e.preventDefault()
    
    if (!formData.venueId || !formData.date || !formData.name || !formData.phone || !formData.guests) {
      toast.error('Please fill all required fields')
      return
    }

    if (parseInt(formData.guests) <= 0) {
      toast.error('Number of guests must be greater than 0')
      return
    }

    try {
      setSubmitting(true)
      const bookingData = {
        venueId: formData.venueId,
        date: formData.date,
        dateFrom: formData.dateFrom || null,
        dateTo: formData.dateTo || null,
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        marriageFor: formData.marriageFor,
        personName: formData.personName || null,
        guests: parseInt(formData.guests),
        foodPreference: formData.foodPreference,
        totalAmount: formData.totalAmount ? parseFloat(formData.totalAmount) : 0
      }

      await vendorAPI.createBooking(bookingData)
      toast.success('Booking added successfully!')
      setShowAddForm(false)
      setFormData({
        venueId: venues.length > 0 ? (venues[0]._id || venues[0].id) : '',
        date: '',
        dateFrom: '',
        dateTo: '',
        name: '',
        phone: '',
        email: '',
        marriageFor: 'boy',
        personName: '',
        guests: '',
        foodPreference: 'both',
        totalAmount: ''
      })
      loadBookings()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add booking')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleExpanded = (bookingId) => {
    const newExpanded = new Set(expandedBookings)
    if (newExpanded.has(bookingId)) {
      newExpanded.delete(bookingId)
    } else {
      newExpanded.add(bookingId)
    }
    setExpandedBookings(newExpanded)
  }

  // Helper function to format location (handles both string and object)
  const formatLocation = (location) => {
    if (!location) return 'N/A'
    if (typeof location === 'string') return location
    if (typeof location === 'object') {
      const parts = []
      if (location.address) parts.push(location.address)
      if (location.city) parts.push(location.city)
      if (location.state) parts.push(location.state)
      if (location.pincode) parts.push(location.pincode)
      return parts.length > 0 ? parts.join(', ') : 'N/A'
    }
    return 'N/A'
  }

  // Helper function to format capacity/guests (handles both number and object)
  const formatGuests = (guests) => {
    if (!guests && guests !== 0) return '0'
    if (typeof guests === 'number') return guests.toString()
    if (typeof guests === 'object') {
      if (guests.minGuests && guests.maxGuests) {
        return `${guests.minGuests} - ${guests.maxGuests}`
      }
      if (guests.minGuests) return guests.minGuests.toString()
      if (guests.maxGuests) return guests.maxGuests.toString()
      return '0'
    }
    return guests.toString()
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { icon: CheckCircle, color: 'green', text: 'Confirmed' },
      pending: { icon: Clock, color: 'orange', text: 'Pending' },
      cancelled: { icon: XCircle, color: 'red', text: 'Cancelled' },
    }
    const config = statusConfig[status] || { icon: Clock, color: 'gray', text: status }
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-700`}>
        <Icon className="w-4 h-4" />
        <span>{config.text}</span>
      </span>
    )
  }

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      paid: { color: 'green', text: 'Paid' },
      pending: { color: 'orange', text: 'Pending' },
      failed: { color: 'red', text: 'Failed' },
    }
    const config = statusConfig[status] || { color: 'gray', text: status }
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium bg-${config.color}-100 text-${config.color}-700`}>
        {config.text}
      </span>
    )
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-600 mt-1">Manage your venue bookings</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Booking</span>
          </button>
          <button
            onClick={loadBookings}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Add Booking Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">Add New Booking</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
            <form onSubmit={handleAddBooking} className="p-6 space-y-4">
              {/* Venue Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue <span className="text-red-500">*</span>
                </label>
                <select
                  name="venueId"
                  value={formData.venueId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Venue</option>
                  {venues.map((venue) => (
                    <option key={venue._id || venue.id} value={venue._id || venue.id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Date Range (Optional) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Date (Optional)
                  </label>
                  <input
                    type="date"
                    name="dateFrom"
                    value={formData.dateFrom}
                    onChange={handleInputChange}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Date (Optional)
                  </label>
                  <input
                    type="date"
                    name="dateTo"
                    value={formData.dateTo}
                    onChange={handleInputChange}
                    min={formData.dateFrom || format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Marriage For */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marriage For
                </label>
                <select
                  name="marriageFor"
                  value={formData.marriageFor}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="boy">Boy</option>
                  <option value="girl">Girl</option>
                </select>
              </div>

              {/* Person Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Person Name (Optional)
                </label>
                <input
                  type="text"
                  name="personName"
                  value={formData.personName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Guests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Guests <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="guests"
                  value={formData.guests}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Food Preference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Food Preference
                </label>
                <select
                  name="foodPreference"
                  value={formData.foodPreference}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="veg">Vegetarian</option>
                  <option value="non-veg">Non-Vegetarian</option>
                  <option value="both">Both</option>
                </select>
              </div>

              {/* Total Amount (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Amount (Optional)
                </label>
                <input
                  type="number"
                  name="totalAmount"
                  value={formData.totalAmount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Adding...' : 'Add Booking'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Bookings Yet</h3>
          <p className="text-gray-600">You don't have any bookings at the moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isExpanded = expandedBookings.has(booking.id || booking._id)
            const venue = booking.venue || booking.venueId
            const customer = booking.customer || booking.customerId
            const customerName = booking.name || customer?.name || 'Customer'
            const customerPhone = booking.phone || customer?.phone || 'N/A'
            const customerEmail = customer?.email || 'N/A'
            const eventDate = booking.eventDate || booking.date || booking.createdAt

            return (
              <div key={booking.id || booking._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {venue?.name || 'Venue'}
                      </h3>
                      <p className="text-gray-600">{customerName}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(booking.status)}
                      <button
                        onClick={() => toggleExpanded(booking.id || booking._id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Event Date</p>
                      <div className="flex items-center text-sm font-semibold">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        {eventDate ? format(new Date(eventDate), 'MMM dd, yyyy') : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Guests</p>
                      <div className="flex items-center text-sm font-semibold">
                        <Users className="w-4 h-4 mr-1 text-gray-400" />
                        {formatGuests(booking.guests || booking.capacity || 0)}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Amount</p>
                      <div className="flex items-center text-sm font-semibold text-primary-600">
                        <span className="text-lg font-bold mr-1">₹</span>
                        {booking.totalAmount?.toLocaleString() || booking.amount?.toLocaleString() || 0}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="pt-4 border-t border-gray-200 space-y-4">
                      {/* Customer Details */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Customer Details</h4>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <span className="text-gray-600 w-24">Name:</span>
                            <span className="font-medium">{customerName}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-gray-600 w-24">Phone:</span>
                            <span className="font-medium">{customerPhone}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-gray-600 w-24">Email:</span>
                            <span className="font-medium">{customerEmail}</span>
                          </div>
                        </div>
                      </div>

                      {/* Event Details */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Event Details</h4>
                        <div className="space-y-2 text-sm">
                          {venue?.location && (
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="text-gray-600 w-24">Location:</span>
                              <span className="font-medium">{formatLocation(venue.location)}</span>
                            </div>
                          )}
                          {eventDate && (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="text-gray-600 w-24">Event Date:</span>
                              <span className="font-medium">
                                {format(new Date(eventDate), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          )}
                          {booking.dateFrom && booking.dateTo && (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="text-gray-600 w-24">Date Range:</span>
                              <span className="font-medium">
                                {format(new Date(booking.dateFrom), 'MMM dd')} - {format(new Date(booking.dateTo), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          )}
                          {booking.eventType && (
                            <div className="flex items-center">
                              <span className="text-gray-600 w-24">Event Type:</span>
                              <span className="font-medium capitalize">{booking.eventType}</span>
                            </div>
                          )}
                          {booking.personName && (
                            <div className="flex items-center">
                              <span className="text-gray-600 w-24">Person Name:</span>
                              <span className="font-medium">{booking.personName}</span>
                            </div>
                          )}
                          {booking.foodPreference && (
                            <div className="flex items-center">
                              <span className="text-gray-600 w-24">Food:</span>
                              <span className="font-medium capitalize">{booking.foodPreference}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payment Details */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Payment Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <span className="text-gray-600 w-24">Status:</span>
                            {getPaymentStatusBadge(booking.paymentStatus || 'pending')}
                          </div>
                          {booking.paymentId && (
                            <div className="flex items-center">
                              <span className="text-gray-600 w-24">Payment ID:</span>
                              <span className="font-medium">{booking.paymentId}</span>
                            </div>
                          )}
                          {booking.createdAt && (
                            <div className="flex items-center">
                              <span className="text-gray-600 w-24">Booked On:</span>
                              <span className="font-medium">
                                {format(new Date(booking.createdAt), 'MMM dd, yyyy hh:mm a')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {booking.status === 'pending' && (
                        <div className="pt-4 border-t border-gray-200 flex items-center space-x-3">
                          <button
                            onClick={() => handleStatusUpdateClick(booking.id || booking._id, 'confirmed')}
                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Confirm</span>
                          </button>
                          <button
                            onClick={() => handleStatusUpdateClick(booking.id || booking._id, 'cancelled')}
                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          />
        </div>
      )}

      {/* Status Update Confirmation Modal */}
      {showStatusModal && newStatus && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {newStatus === 'confirmed' ? 'Confirm Booking' : 'Cancel Booking'}
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to {newStatus === 'confirmed' ? 'confirm' : 'cancel'} this booking?
              </p>
              {newStatus === 'cancelled' && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-4">
                  This action cannot be undone.
                </p>
              )}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={handleStatusUpdateCancel}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdateConfirm}
                  className={`px-6 py-2.5 rounded-lg hover:opacity-90 transition font-medium ${
                    newStatus === 'confirmed'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {newStatus === 'confirmed' ? 'Confirm' : 'Cancel Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

