import { useState, useEffect } from 'react'
import { vendorAPI } from '../../services/vendor/api'
import { 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Filter,
  Plus,
  Edit,
  Trash2,
  X
} from 'lucide-react'
import { format } from 'date-fns'
import { hasVendorPermission } from '../../utils/vendor/permissions'

export default function Ledger() {
  const [ledgerData, setLedgerData] = useState({
    transactions: [],
    summary: {
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
      pendingIncome: 0,
      pendingExpenses: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      monthlyNet: 0
    },
    counts: {
      totalTransactions: 0,
      incomeCount: 0,
      expenseCount: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, income, expense, unpaid-expenses
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [formData, setFormData] = useState({
    type: 'income',
    category: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    status: 'paid',
    reference: '',
    venueId: '',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [venues, setVenues] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState(null)
  const [feedbackModal, setFeedbackModal] = useState(null)

  useEffect(() => {
    loadLedger()
    loadVenues()
  }, [])

  const loadVenues = async () => {
    try {
      const response = await vendorAPI.getVenues()
      const venuesData = response.data?.venues || response.data?.data || response.data || []
      setVenues(Array.isArray(venuesData) ? venuesData : [])
    } catch (error) {
      console.error('Failed to load venues:', error)
      setVenues([])
    }
  }

  const loadLedger = async () => {
    try {
      setLoading(true)
      const response = await vendorAPI.getLedger()
      setLedgerData(response.data)
    } catch (error) {
      console.error('Failed to load ledger:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = (() => {
    if (filter === 'all') {
      return ledgerData.transactions
    } else if (filter === 'unpaid-expenses') {
      return ledgerData.transactions.filter(t => 
        t.type === 'expense' && 
        t.status !== 'paid' && 
        t.status !== 'cancelled'
      )
    } else {
      return ledgerData.transactions.filter(t => t.type === filter)
    }
  })()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? value : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.category || !formData.category.trim()) {
      setFeedbackModal({
        title: 'Missing Information',
        message: 'Category is required.',
        type: 'error'
      })
      return
    }

    if (!formData.description || !formData.description.trim()) {
      setFeedbackModal({
        title: 'Missing Information',
        message: 'Description is required.',
        type: 'error'
      })
      return
    }

    if (!formData.amount || formData.amount <= 0) {
      setFeedbackModal({
        title: 'Invalid Amount',
        message: 'Amount must be greater than 0.',
        type: 'error'
      })
      return
    }

    try {
      setSubmitting(true)
      const dataToSend = {
        type: formData.type,
        category: formData.category.trim(),
        description: formData.description.trim(),
        amount: Number(formData.amount),
        date: formData.date,
        status: formData.status,
        reference: formData.reference.trim(),
        venueId: formData.venueId || null,
        notes: formData.notes.trim()
      }

      if (editingEntry) {
        await vendorAPI.updateLedgerEntry(editingEntry.id, dataToSend)
        setFeedbackModal({
          title: 'Entry Updated',
          message: 'Ledger entry updated successfully.',
          type: 'success'
        })
      } else {
        await vendorAPI.addLedgerEntry(dataToSend)
        setFeedbackModal({
          title: 'Entry Added',
          message: 'Ledger entry added successfully.',
          type: 'success'
        })
      }

      setShowAddModal(false)
      setEditingEntry(null)
      resetForm()
      await loadLedger()
    } catch (error) {
      console.error('Failed to save ledger entry:', error)
      setFeedbackModal({
        title: 'Save Failed',
        message: error.response?.data?.error || 'Failed to save ledger entry.',
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (entry) => {
    if (!entry.isManual) {
      setFeedbackModal({
        title: 'Not Allowed',
        message: 'Only manual entries can be edited.',
        type: 'error'
      })
      return
    }
    setEditingEntry(entry)
    setFormData({
      type: entry.type,
      category: entry.category || '',
      description: entry.description || '',
      amount: entry.amount?.toString() || '',
      date: entry.date ? new Date(entry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: entry.status || 'paid',
      reference: entry.reference || '',
      venueId: entry.venueId?._id || entry.venueId?.id || entry.venueId || '',
      notes: entry.notes || ''
    })
    setShowAddModal(true)
  }

  const handleDeleteClick = (entry) => {
    if (!entry.isManual) {
      setFeedbackModal({
        title: 'Not Allowed',
        message: 'Only manual entries can be deleted.',
        type: 'error'
      })
      return
    }
    setEntryToDelete(entry)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return

    try {
      await vendorAPI.deleteLedgerEntry(entryToDelete.id)
      setShowDeleteModal(false)
      setEntryToDelete(null)
      setFeedbackModal({
        title: 'Entry Deleted',
        message: 'Ledger entry deleted successfully.',
        type: 'success'
      })
      await loadLedger()
    } catch (error) {
      console.error('Failed to delete ledger entry:', error)
      setFeedbackModal({
        title: 'Delete Failed',
        message: error.response?.data?.error || 'Failed to delete ledger entry.',
        type: 'error'
      })
      setShowDeleteModal(false)
      setEntryToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setEntryToDelete(null)
  }

  const resetForm = () => {
    setFormData({
      type: 'income',
      category: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      status: 'paid',
      reference: '',
      venueId: '',
      notes: ''
    })
    setEditingEntry(null)
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
          <h1 className="text-3xl font-bold text-gray-900">Ledger</h1>
          <p className="text-gray-600 mt-1">Complete financial transaction history</p>
        </div>
        <div className="flex items-center space-x-3">
          {hasVendorPermission('vendor_create_ledger') && (
            <button
              onClick={() => {
                resetForm()
                setShowAddModal(true)
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Entry</span>
            </button>
          )}
          <button
            onClick={loadLedger}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Income</span>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            ₹{ledgerData.summary.totalIncome.toLocaleString()}
          </p>
          {ledgerData.summary.pendingIncome > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Pending: ₹{ledgerData.summary.pendingIncome.toLocaleString()}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Expenses</span>
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">
            ₹{ledgerData.summary.totalExpenses.toLocaleString()}
          </p>
          {ledgerData.summary.pendingExpenses > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Pending: ₹{ledgerData.summary.pendingExpenses.toLocaleString()}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Net Balance</span>
            <span className="text-2xl font-bold text-primary-600">₹</span>
          </div>
          <p className={`text-2xl font-bold ${
            ledgerData.summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ₹{ledgerData.summary.netBalance.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">After all transactions</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">This Month</span>
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <p className={`text-2xl font-bold ${
            ledgerData.summary.monthlyNet >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ₹{ledgerData.summary.monthlyNet.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Income: ₹{ledgerData.summary.monthlyIncome.toLocaleString()} | 
            Expenses: ₹{ledgerData.summary.monthlyExpenses.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Transactions
          </button>
          <button
            onClick={() => setFilter('income')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'income'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Income Only
          </button>
          <button
            onClick={() => setFilter('expense')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'expense'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Expenses Only
          </button>
          <button
            onClick={() => setFilter('unpaid-expenses')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'unpaid-expenses'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unpaid Expenses
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Transaction History ({filteredTransactions.length})
          </h2>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-6xl text-gray-400 mx-auto mb-4 block">₹</span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Transactions</h3>
            <p className="text-gray-600">No transactions found for the selected filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(transaction.date), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(transaction.date), 'hh:mm a')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                        transaction.type === 'income'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        <span className="capitalize">{transaction.type}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </div>
                      {transaction.venueName && (
                        <div className="text-xs text-gray-500">
                          Venue: {transaction.venueName}
                        </div>
                      )}
                      {transaction.customerName && (
                        <div className="text-xs text-gray-500">
                          Customer: {transaction.customerName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {transaction.reference}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        transaction.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : transaction.status === 'pending'
                          ? 'bg-orange-100 text-orange-700'
                          : transaction.status === 'unpaid'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <div className={`text-sm font-bold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                        </div>
                        {transaction.isManual && (
                          <div className="flex items-center space-x-1">
                            {hasVendorPermission('vendor_edit_ledger') && (
                              <button
                                onClick={() => handleEdit(transaction)}
                                className="text-primary-600 hover:text-primary-800"
                                title="Edit entry"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {hasVendorPermission('vendor_delete_ledger') && (
                              <button
                                onClick={() => handleDeleteClick(transaction)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete entry"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingEntry ? 'Edit Ledger Entry' : 'Add Ledger Entry'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Maintenance, Utilities, Service Fee"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  placeholder="Enter transaction description..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue (Optional)
                </label>
                <select
                  name="venueId"
                  value={formData.venueId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">No Venue</option>
                  {venues.map((venue) => (
                    <option key={venue.id || venue._id} value={venue.id || venue._id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference (Optional)
                </label>
                <input
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleInputChange}
                  placeholder="e.g., Invoice #123, Receipt #456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Additional notes..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : editingEntry ? 'Update Entry' : 'Add Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && entryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Ledger Entry</h3>
              <p className="text-gray-700">
                Are you sure you want to delete this ledger entry?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={handleDeleteCancel}
                className="px-6 py-2 bg-orange-50 text-gray-900 rounded-lg hover:bg-orange-100 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-6 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {feedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {feedbackModal.title || 'Notice'}
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {feedbackModal.message}
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setFeedbackModal(null)}
                className={`px-4 py-2 rounded-lg ${
                  feedbackModal.type === 'error'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


