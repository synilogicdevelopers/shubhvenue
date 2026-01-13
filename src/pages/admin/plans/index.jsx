import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/admin/ui/Table';
import { Card } from '../../../components/admin/ui/Card';
import { Button } from '../../../components/admin/ui/Button';
import { Badge } from '../../../components/admin/ui/Badge';
import { Modal } from '../../../components/admin/ui/Modal';
import { Input } from '../../../components/admin/ui/Input';
import { plansAPI } from '../../../services/admin/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';

export const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    durationUnit: 'months',
    features: '',
    isActive: true,
    maxVenues: 1,
    priority: 0
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await plansAPI.getAll();
      setPlans(response.data?.plans || []);
    } catch (error) {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '',
      durationUnit: 'months',
      features: '',
      isActive: true,
      maxVenues: 1,
      priority: 0
    });
    setSelectedPlan(null);
    setCreateOpen(true);
  };

  const handleEdit = (plan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      price: plan.price || '',
      duration: plan.duration || '',
      durationUnit: plan.durationUnit || 'months',
      features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
      isActive: plan.isActive !== undefined ? plan.isActive : true,
      maxVenues: plan.maxVenues || 1,
      priority: plan.priority || 0
    });
    setEditOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const featuresArray = formData.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        maxVenues: parseInt(formData.maxVenues),
        priority: parseInt(formData.priority),
        features: featuresArray
      };

      if (selectedPlan) {
        await plansAPI.update(selectedPlan._id, payload);
        toast.success('Plan updated successfully');
        setEditOpen(false);
      } else {
        await plansAPI.create(payload);
        toast.success('Plan created successfully');
        setCreateOpen(false);
      }
      fetchPlans();
      setFormData({
        name: '',
        description: '',
        price: '',
        duration: '',
        durationUnit: 'months',
        features: '',
        isActive: true,
        maxVenues: 1,
        priority: 0
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save plan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setActionLoading(true);
    try {
      await plansAPI.delete(deleteConfirm._id);
      toast.success('Plan deleted successfully');
      setDeleteConfirm(null);
      fetchPlans();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete plan');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Listing Plans</h1>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Plan
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Max Venues</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No plans found. Create your first plan.
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan._id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>₹{plan.price?.toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    {plan.duration} {plan.durationUnit}
                  </TableCell>
                  <TableCell>{plan.maxVenues}</TableCell>
                  <TableCell>{plan.priority}</TableCell>
                  <TableCell>
                    <Badge variant={plan.isActive ? 'success' : 'secondary'}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(plan)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm(plan)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={createOpen || editOpen}
        onClose={() => {
          setCreateOpen(false);
          setEditOpen(false);
          setSelectedPlan(null);
        }}
        title={selectedPlan ? 'Edit Plan' : 'Create Plan'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Plan Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Premium Listing"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows="3"
              placeholder="Plan description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price (₹) *</label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Duration *</label>
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Duration Unit *</label>
              <select
                value={formData.durationUnit}
                onChange={(e) => setFormData({ ...formData, durationUnit: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Max Venues *</label>
              <Input
                type="number"
                value={formData.maxVenues}
                onChange={(e) => setFormData({ ...formData, maxVenues: e.target.value })}
                required
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <Input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                min="0"
                placeholder="Higher = appears first"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value={true}>Active</option>
                <option value={false}>Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Features (one per line)</label>
            <textarea
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows="4"
              placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                setEditOpen(false);
                setSelectedPlan(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={actionLoading}>
              {actionLoading ? 'Saving...' : selectedPlan ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Plan"
      >
        <p className="mb-4">
          Are you sure you want to delete plan "{deleteConfirm?.name}"? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
            {actionLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};




