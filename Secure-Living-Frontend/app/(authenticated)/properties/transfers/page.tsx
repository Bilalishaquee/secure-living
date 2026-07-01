"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { formatKes } from "@/lib/utils";

type PropertyTransfer = {
  id: string;
  propertyId: string;
  previousOwnerId: string;
  newOwnerId: string;
  transferDate: string;
  transferType: string;
  saleAmountKes: number | null;
  notes: string | null;
  createdBy: string;
};

export default function PropertyTransfersPage() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<PropertyTransfer[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("ALL");

  const authHeader = () => ({ Authorization: `Bearer ${user?.authToken ?? ""}` });

  async function loadProperties() {
    if (!user) return;
    const propRes = await fetch("/api/v1/properties", { headers: authHeader() });
    if (propRes.ok) {
      const j = (await propRes.json()) as { data: { id: string; name: string }[] };
      setProperties(j.data ?? []);
    }
  }

  async function loadTransfers() {
    if (!user) return;
    const params = selectedProperty !== "ALL" ? `?propertyId=${selectedProperty}` : "";
    const res = await fetch(`/api/v1/properties/transfers${params}`, { headers: authHeader() });
    if (res.ok) {
      const json = (await res.json()) as { data: PropertyTransfer[] };
      setTransfers(json.data ?? []);
    } else {
      setTransfers([]);
    }
  }

  useEffect(() => { void loadProperties(); }, [user]);
  useEffect(() => { void loadTransfers(); }, [user, selectedProperty]);

  const columns: Column<PropertyTransfer>[] = [
    { key: "propertyId", header: "Property", sortable: true, render: (r) => r.propertyId.slice(0, 8) },
    { key: "previousOwnerId", header: "Previous Owner", render: (r) => r.previousOwnerId.slice(0, 8) },
    { key: "newOwnerId", header: "New Owner", render: (r) => r.newOwnerId.slice(0, 8) },
    { key: "transferDate", header: "Date", render: (r) => new Date(r.transferDate).toLocaleDateString() },
    { key: "transferType", header: "Type" },
    { key: "saleAmountKes", header: "Sale Amount", render: (r) => r.saleAmountKes ? formatKes(r.saleAmountKes) : "—" },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Property Transfers</h1>
          <p className="app-page-lead">Record of property ownership transfers.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Transfer Records</CardTitle>
            <div className="flex items-center gap-2">
              <label className="text-sm text-[var(--text-secondary)]">Filter by property:</label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Properties</SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name || p.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable data={transfers} columns={columns} rowKey={(r) => r.id} />
        </CardContent>
      </Card>
    </div>
  );
}
