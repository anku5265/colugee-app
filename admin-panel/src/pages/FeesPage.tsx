import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, DollarSign, Ticket } from 'lucide-react';

interface Booking {
  id: string;
  booking_date: string;
  booking_status: string;
  payment_status: string | null;
  total_amount: number;
  seats_booked: number;
  events: { title: string } | null;
}

export default function FeesPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, booking_date, booking_status, payment_status, total_amount, seats_booked,
          events:event_id (title)
        `)
        .order('booking_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setBookings(data || []);
      const revenue = (data || []).reduce((sum, b) => sum + (b.total_amount || 0), 0);
      setTotalRevenue(revenue);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string | null) => {
    if (status === 'paid' || status === 'confirmed') return 'bg-green-100 text-green-700';
    if (status === 'pending') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fees & Payments</h1>
        <p className="text-gray-500">Event bookings and payment records</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-100 rounded-xl p-5">
          <DollarSign className="h-6 w-6 text-green-600 mb-2" />
          <div className="text-3xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</div>
          <div className="text-sm text-green-700 mt-1">Total Revenue</div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
          <Ticket className="h-6 w-6 text-blue-600 mb-2" />
          <div className="text-3xl font-bold text-blue-600">{bookings.length}</div>
          <div className="text-sm text-blue-700 mt-1">Total Bookings</div>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-5">
          <Ticket className="h-6 w-6 text-purple-600 mb-2" />
          <div className="text-3xl font-bold text-purple-600">
            {bookings.reduce((sum, b) => sum + b.seats_booked, 0)}
          </div>
          <div className="text-sm text-purple-700 mt-1">Total Seats Booked</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No booking records found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Event</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Seats</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {(booking.events as any)?.title || 'Unknown Event'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(booking.booking_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{booking.seats_booked}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    ₹{booking.total_amount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(booking.payment_status)}`}>
                      {booking.payment_status || booking.booking_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
