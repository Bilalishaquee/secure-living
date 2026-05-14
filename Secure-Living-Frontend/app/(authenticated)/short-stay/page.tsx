"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BedDouble, Plus, CalendarDays, Package } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { formatKes } from "@/lib/utils";


const STATUS_COLORS: Record<string, string> = {
  CONFIRMED:   "bg-blue-100 text-blue-700",
  CHECKED_IN:  "bg-green-100 text-green-700",
  CHECKED_OUT: "bg-slate-100 text-slate-700",
  CANCELLED:   "bg-red-100 text-red-700",
  NO_SHOW:     "bg-orange-100 text-orange-700",
};

type ShortStay = {
  id: string;
  nightlyRate: number;
  currency: string;
  _count: { bookings: number };
  unit: { unitNumber: string; propertyId: string };
};

type Booking = {
  id: string;
  guestName: string;
  guestEmail: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  status: string;
  shortStayId: string;
};

export default function ShortStayPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [properties, setProperties] = useState<ShortStay[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedSspId, setSelectedSspId] = useState("");
  const [form, setForm] = useState({ unitId: "", nightlyRate: "", checkInTime: "14:00", checkOutTime: "11:00", cleaningFee: "" });
  const [bookForm, setBookForm] = useState({ guestName: "", guestEmail: "", guestPhone: "", checkInDate: "", checkOutDate: "", numberOfGuests: "1" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/short-stay`, { headers: { Authorization: `Bearer ${user?.authToken}` } });
      if (res.ok) {
        const j = await res.json();
        setProperties(j.data ?? []);
        // Load recent bookings from first property
        if (j.data?.length > 0) {
          const br = await fetch(`/api/v1/short-stay/${j.data[0].id}/bookings`, { headers: { Authorization: `Bearer ${user?.authToken}` } });
          if (br.ok) setRecentBookings(((await br.json()).data ?? []).slice(0, 5));
        }
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (user?.authToken) load(); }, [user?.authToken]);

  async function handleAddProperty() {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/short-stay`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
        body: JSON.stringify({
          unitId: form.unitId,
          nightlyRate: parseFloat(form.nightlyRate),
          checkInTime: form.checkInTime,
          checkOutTime: form.checkOutTime,
          cleaningFee: form.cleaningFee ? parseFloat(form.cleaningFee) : 0,
        }),
      });
      if (res.ok) {
        toast({ title: "Short-stay property added", variant: "success" });
        setAddOpen(false);
        load();
      } else {
        const j = await res.json();
        toast({ title: j.error ?? "Failed", variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleBook() {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/short-stay/${selectedSspId}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
        body: JSON.stringify({ ...bookForm, numberOfGuests: parseInt(bookForm.numberOfGuests) }),
      });
      if (res.ok) {
        toast({ title: "Booking created", variant: "success" });
        setBookingOpen(false);
        load();
      } else {
        const j = await res.json();
        toast({ title: j.error ?? "Failed", variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  }

  const today = new Date();
  const todayStr = today.toDateString();
  const checkInsToday = recentBookings.filter((b) => new Date(b.checkInDate).toDateString() === todayStr);
  const checkOutsToday = recentBookings.filter((b) => new Date(b.checkOutDate).toDateString() === todayStr);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Short Stay</h1>
          <p className="mt-1 text-sm text-slate-500">Manage Airbnb-style short-stay units and bookings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.push("/short-stay/stock")} className="gap-2">
            <Package className="h-4 w-4" /> Stock
          </Button>
          <Button variant="ghost" onClick={() => router.push("/short-stay/bookings")} className="gap-2">
            <CalendarDays className="h-4 w-4" /> All Bookings
          </Button>
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Property
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500">Properties</p>
            <p className="text-2xl font-bold text-slate-900">{properties.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500">Check-ins Today</p>
            <p className="text-2xl font-bold text-green-600">{checkInsToday.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500">Check-outs Today</p>
            <p className="text-2xl font-bold text-orange-600">{checkOutsToday.length}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <BedDouble className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-medium text-slate-700">No short-stay properties</p>
            <Button onClick={() => setAddOpen(true)} className="mt-4 gap-2"><Plus className="h-4 w-4" /> Add Property</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {properties.map((p) => (
            <Card key={p.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => router.push(`/short-stay/${p.id}`)}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">Unit {p.unit.unitNumber}</p>
                    <p className="text-sm text-slate-500">{formatKes(p.nightlyRate)}/night</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setSelectedSspId(p.id); setBookingOpen(true); }}
                  >
                    New Booking
                  </Button>
                </div>
                <p className="mt-3 text-xs text-slate-400">{p._count.bookings} total bookings</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent bookings */}
      {recentBookings.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Bookings</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Guest</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Check-in</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Check-out</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentBookings.map((b) => {
                  const sc = STATUS_COLORS[b.status] ?? "bg-slate-100 text-slate-700";
                  return (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{b.guestName}</td>
                      <td className="px-4 py-3 text-slate-600">{new Date(b.checkInDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate-600">{new Date(b.checkOutDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate-600">{formatKes(b.totalAmount)}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sc}`}>{b.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Add Property Modal */}
      <Modal open={addOpen} onOpenChange={setAddOpen} title="Add Short-Stay Property">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Unit ID *</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Unit ID from your properties"
              value={form.unitId}
              onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nightly Rate (KES) *</label>
              <input type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" value={form.nightlyRate} onChange={(e) => setForm((f) => ({ ...f, nightlyRate: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Cleaning Fee</label>
              <input type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" value={form.cleaningFee} onChange={(e) => setForm((f) => ({ ...f, cleaningFee: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Check-in Time</label>
              <input type="time" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" value={form.checkInTime} onChange={(e) => setForm((f) => ({ ...f, checkInTime: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Check-out Time</label>
              <input type="time" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" value={form.checkOutTime} onChange={(e) => setForm((f) => ({ ...f, checkOutTime: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleAddProperty} disabled={!form.unitId || !form.nightlyRate || saving} className="flex-1">{saving ? "Adding…" : "Add Property"}</Button>
          </div>
        </div>
      </Modal>

      {/* New Booking Modal */}
      <Modal open={bookingOpen} onOpenChange={setBookingOpen} title="New Booking">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Guest Name *</label>
              <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" value={bookForm.guestName} onChange={(e) => setBookForm((f) => ({ ...f, guestName: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Guest Email *</label>
              <input type="email" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" value={bookForm.guestEmail} onChange={(e) => setBookForm((f) => ({ ...f, guestEmail: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Check-in Date *</label>
              <input type="date" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" value={bookForm.checkInDate} onChange={(e) => setBookForm((f) => ({ ...f, checkInDate: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Check-out Date *</label>
              <input type="date" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" value={bookForm.checkOutDate} onChange={(e) => setBookForm((f) => ({ ...f, checkOutDate: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
              <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" value={bookForm.guestPhone} onChange={(e) => setBookForm((f) => ({ ...f, guestPhone: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Guests</label>
              <input type="number" min="1" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" value={bookForm.numberOfGuests} onChange={(e) => setBookForm((f) => ({ ...f, numberOfGuests: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setBookingOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleBook} disabled={!bookForm.guestName || !bookForm.guestEmail || !bookForm.checkInDate || !bookForm.checkOutDate || saving} className="flex-1">{saving ? "Creating…" : "Create Booking"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
