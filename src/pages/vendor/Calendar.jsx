import { useState, useEffect } from 'react'
import { vendorAPI } from '../../services/vendor/api'
import { 
  RefreshCw,
  X,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [venues, setVenues] = useState([])
  const [datesData, setDatesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDates, setSelectedDates] = useState([])
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadVenues()
  }, [])

  useEffect(() => {
    if (venues.length > 0) {
      loadDatesData()
    }
  }, [venues, selectedVenue])

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
      setLoading(true)
      const response = await vendorAPI.getBlockedDates(selectedVenue)
      const data = response.data?.data || []
      setDatesData(Array.isArray(data) ? data : [data])
    } catch (error) {
      console.error('Failed to load dates:', error)
      setDatesData([])
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const today = format(new Date(), 'yyyy-MM-dd')
    
    // Don't allow selecting past dates
    if (dateStr < today) {
      return
    }

    setSelectedDates(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr)
      }
      return [...prev, dateStr]
    })
  }

  const handleBlockDates = async () => {
    if (selectedDates.length === 0 || !selectedVenue) return

    try {
      setActionLoading(true)
      await vendorAPI.addBlockedDates(selectedVenue, selectedDates)
      alert('Dates blocked successfully!')
      setSelectedDates([])
      loadDatesData()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to block dates')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnblockDates = async () => {
    if (selectedDates.length === 0 || !selectedVenue) return

    try {
      setActionLoading(true)
      await vendorAPI.removeBlockedDates(selectedVenue, selectedDates)
      alert('Dates unblocked successfully!')
      setSelectedDates([])
      loadDatesData()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to unblock dates')
    } finally {
      setActionLoading(false)
    }
  }

  const getDateStatus = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const today = format(new Date(), 'yyyy-MM-dd')
    
    if (dateStr < today) {
      return 'past'
    }

    const venueData = datesData.find(d => 
      (d.venueId === selectedVenue) || 
      (d.venueId?._id === selectedVenue) || 
      (d.venueId?.toString() === selectedVenue)
    )

    if (!venueData) return 'available'

    const { blockedDates = [], bookedDates = [] } = venueData

    if (bookedDates.includes(dateStr)) {
      return 'booked'
    }
    if (blockedDates.includes(dateStr)) {
      return 'blocked'
    }
    if (selectedDates.includes(dateStr)) {
      return 'selected'
    }
    return 'available'
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const venueData = datesData.find(d => 
    (d.venueId === selectedVenue) || 
    (d.venueId?._id === selectedVenue) || 
    (d.venueId?.toString() === selectedVenue)
  )

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Calendar Management</h1>
          <p className="text-xs text-gray-600">Manage booked and blocked dates</p>
        </div>
        <button
          onClick={loadDatesData}
          className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Venue Selector */}
      <div className="bg-white rounded-lg shadow-sm p-3">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Select Venue
        </label>
        <select
          value={selectedVenue || ''}
          onChange={(e) => {
            setSelectedVenue(e.target.value)
            setSelectedDates([])
          }}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          {venues.map((venue) => (
            <option key={venue._id || venue.id} value={venue._id || venue.id}>
              {venue.name}
            </option>
          ))}
        </select>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-sm p-3">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-base font-bold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-green-100 border-2 border-green-500 rounded"></div>
            <span className="text-xs text-gray-700">Available</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-xs text-gray-700">Booked</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-xs text-gray-700">Blocked</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-xs text-gray-700">Selected</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-gray-300 rounded"></div>
            <span className="text-xs text-gray-700">Past</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center font-semibold text-gray-700 py-1 text-xs">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {days.map((day, idx) => {
            const status = getDateStatus(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, new Date())
            const isSelected = selectedDates.includes(format(day, 'yyyy-MM-dd'))

            const getDayClasses = () => {
              let classes = 'aspect-square flex items-center justify-center rounded-lg cursor-pointer transition-all '
              
              if (!isCurrentMonth) {
                classes += 'text-gray-300 '
              } else if (status === 'past') {
                classes += 'bg-gray-100 text-gray-400 cursor-not-allowed '
              } else if (status === 'booked') {
                classes += 'bg-red-500 text-white hover:bg-red-600 '
              } else if (status === 'blocked') {
                classes += 'bg-orange-500 text-white hover:bg-orange-600 '
              } else if (status === 'selected') {
                classes += 'bg-blue-500 text-white hover:bg-blue-600 '
              } else {
                classes += 'bg-green-50 text-gray-900 hover:bg-green-100 border-2 border-green-200 '
              }

              if (isToday && isCurrentMonth) {
                classes += 'ring-2 ring-primary-500 ring-offset-2 '
              }

              return classes
            }

            return (
              <div
                key={idx}
                onClick={() => handleDateClick(day)}
                className={getDayClasses()}
              >
                <span className="text-xs font-medium">{format(day, 'd')}</span>
              </div>
            )
          })}
        </div>

        {/* Action Buttons */}
        {selectedDates.length > 0 && (
          <div className="mt-3 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-700">
                {selectedDates.length} date(s) selected
              </p>
              <p className="text-xs text-gray-500">
                {selectedDates.slice(0, 3).join(', ')}
                {selectedDates.length > 3 && ` +${selectedDates.length - 3} more`}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBlockDates}
                disabled={actionLoading}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50 text-xs"
              >
                <X className="w-3.5 h-3.5" />
                <span>Block</span>
              </button>
              <button
                onClick={handleUnblockDates}
                disabled={actionLoading}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Unblock</span>
              </button>
              <button
                onClick={() => setSelectedDates([])}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-xs"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        {venueData && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-600">Available</p>
              <p className="text-lg font-bold text-green-600">
                {venueData.allUnavailableDates ? 
                  (365 - venueData.allUnavailableDates.length) : 
                  'N/A'}
              </p>
            </div>
            <div className="p-2 bg-red-50 rounded-lg">
              <p className="text-xs text-gray-600">Booked</p>
              <p className="text-lg font-bold text-red-600">
                {venueData.bookedDates?.length || 0}
              </p>
            </div>
            <div className="p-2 bg-orange-50 rounded-lg">
              <p className="text-xs text-gray-600">Blocked</p>
              <p className="text-lg font-bold text-orange-600">
                {venueData.blockedDates?.length || 0}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

