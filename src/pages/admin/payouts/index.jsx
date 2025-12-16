import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/admin/ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/admin/ui/Card';
import { Button } from '../../../components/admin/ui/Button';
import { Badge } from '../../../components/admin/ui/Badge';
import { payoutsAPI } from '../../../services/admin/api';
import toast from 'react-hot-toast';
import { Check, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const Payouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      const response = await payoutsAPI.getAll();
      setPayouts(response.data || []);
    } catch (error) {
      toast.error('Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async (id) => {
    if (!window.confirm('Mark this payout as completed?')) return;
    try {
      await payoutsAPI.markCompleted(id);
      toast.success('Payout marked as completed');
      fetchPayouts();
    } catch (error) {
      toast.error('Failed to update payout');
    }
  };

  const chartData = payouts.map(payout => ({
    vendor: payout.vendorId?.name?.slice(0, 10) || 'N/A',
    commission: payout.commission || 0,
    payout: payout.amount || 0,
  }));

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Payouts</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage vendor payouts</p>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Commission vs Payout</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="vendor" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="commission" fill="#8F61EF" name="Commission" />
              <Bar dataKey="payout" fill="#F9A826" name="Payout" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No payouts found
                  </TableCell>
                </TableRow>
              ) : (
                payouts.map((payout) => (
                  <TableRow key={payout._id}>
                    <TableCell className="font-medium">
                      {payout.vendorId?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        ₹{payout.amount?.toLocaleString() || 0}
                      </div>
                    </TableCell>
                    <TableCell>₹{payout.commission?.toLocaleString() || 0}</TableCell>
                    <TableCell>
                      <Badge variant={
                        payout.payment_status === 'completed' ? 'success' :
                        payout.payment_status === 'pending' ? 'warning' : 'default'
                      }>
                        {payout.payment_status || 'pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(payout.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {payout.payment_status !== 'completed' && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkCompleted(payout._id)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Mark Complete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};







