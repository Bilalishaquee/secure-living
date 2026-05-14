"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { formatKes } from "@/lib/utils";


const STATUS_COLORS: Record<string, string> = {
  CONFIRMED:   "bg-blue-100 text-blue-700",
  CHECKED_IN:  "bg-green-100 text-green-700",
  CHECKED_OUT: "bg-slate-100 text-slate-700",
  CANCELLED:   "bg-red-100 text-red-700",
  NO_SHOW:     "bg-orange-100 text-orange-700",
};

type Booking = {
  id: string;
  guestName: string;
  guestEmail: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  status: string;
  numberOfGuests: number;
  shortStay: { unit: { unitNumber: string } };
};

type ShortStay = { id: string; unit: { unitNumber: string } };

export default function ShortStayBookingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<ShortStay[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProp, setSelectedProp] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [saving, setSaving] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const pr = await fetch(`/api/v1/short-stay`, { headers: { Authorization: `Bearer ${user?.authToken}` } });
      if (!pr.ok) return;
      const props = (await pr.json()).data ?? [] as ShortStay[];
      setProperties(props);

      const all: Booking[] = [];
      await Promise.all(props.map(async (p: ShortStay) => {
        const br = await fetch(`/api/v1/short-stay/${p.id}/bookings`, { headers: { Authorization: `Bearer ${user?.authToken}` } });
        if (br.ok) {
          const bData = (await br.json()).data ?? [];
          bData.forEach((b: Booking) => {
            b.shortStay = p;
            all.push(b);
          });
        }
      }));

      all.sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());
      setBookings(all);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (user?.authToken) load(); }, [user?.authToken]);

  async function handleCheckIn(bookingId: string) {
    setSaving(bookingId);
    try {
      const res = await fetch(`/api/v1/short-stay/bookings/${bookingId}/check-in`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user?.authToken}` },
      });
      if (res.ok) { toast({ title: "Checked in", variant: "success" }); load(); }
      else { const j = await res.json(); toast({ title: j.error ?? "Failed", variant: "error" }); }
    } finally {
      setSaving(null);
    }
  }

  async function handleCheckOut(bookingId: string) {
    setSaving(bookingId);
    try {
      const res = await fetch(`/api/v1/short-stay/bookings/${bookingId}/check-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
        body: JSON.stringify({ stockUsage: [] }),
      });
      if (res.ok) { toast({ title: "Checked out", variant: "success" }); load(); }
      else { const j = await res.json(); toast({ title: j.error ?? "Failed", variant: "error" }); }
    } finally {
      setSaving(null);
    }
  }

  const filtered = bookings.filter((b) => {
    const propMatch = selectedProp === "ALL" || b.shortStay?.unit?.unitNumber === selectedProp;
    const statusMatch = statusFilter === "ALL" || b.status === statusFilter;
    return propMatch && statusMatch;
  });

  const todayStr = new Date().toDateString();
  const checkInsToday = bookings.filter((b) => new Date(b.checkInDate).toDateString() === todayStr && b.status === "CONFIRMED").length;
  const checkOutsToday = bookings.filter((b) => new Date(b.checkOutDate).toDateString() === todayStr && b.status === "CHECKED_IN").length;
  const activeBookings = bookings.filter((b) => b.status === "CHECKED_IN").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/short-stay" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Short Stay
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Bookings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage check-ins, check-outs, and booking status</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-xs text-slate-500">Check-ins Today</p><p className="text-2xl font-bold text-green-600">{checkInsToday}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-slate-500">Check-outs Due</p><p className="text-2xl font-bold text-orange-600">{checkOutsToday}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-slate-500">Currently Occupied</p><p className="text-2xl font-bold text-slate-900">{activeBookings}</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          value={selectedProp}
          onChange={(e) => setSelectedProp(e.target.value)}
        >
          <option value="ALL">All Units</option>
          {properties.map((p) => (
            <option key={p.id} value={p.unit.unitNumber}>Unit {p.unit.unitNumber}</option>
          ))}
        </select>
        <select
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CHECKED_IN">Checked In</option>
          <option value="CHECKED_OUT">Checked Out</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="NO_SHOW">No Show</option>
        </select>
        <span className="text-sm text-slate-500">{filtered.length} bookings</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <CalendarDays className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-medium text-slate-700">No bookings found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Guest</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Check-in</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Check-out</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Guests</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((b) => {
                  const sc = STATUS_COLORS[b.status] ?? "bg-slate-100 text-slate-700";
                  return (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{b.guestName}</p>
                        <p className="text-xs text-slate-500">{b.guestEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">Unit {b.shortStay?.unit?.unitNumber}</td>
                      <td className="px-4 py-3 text-slate-600">{new Date(b.checkInDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate-600">{new Date(b.checkOutDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate-600">{b.numberOfGuests}</td>
                      <td className="px-4 py-3 text-slate-600">{formatKes(b.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sc}`}>{b.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {b.status === "CONFIRMED" && (
                            <Button size="sm" onClick={() => handleCheckIn(b.id)} disabled={saving === b.id} className="gap-1">
                              <LogIn className="h-3 w-3" /> Check In
                            </Button>
                          )}
                          {b.status === "CHECKED_IN" && (
                            <Button size="sm" variant="ghost" onClick={() => handleCheckOut(b.id)} disabled={saving === b.id} className="gap-1">
                              <LogOut className="h-3 w-3" /> Check Out
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
