import React, { useState } from 'react';
import { useBus } from '@/contexts/BusContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const { buses, addBus, removeBus, substituteBus } = useBus();
  const [form, setForm] = useState({
    busNumber: '',
    type: 'AC',
    totalSeats: 32,
    from: '',
    to: '',
    stops: '',
    driverName: '',
    driverPhone: '',
    conductorName: '',
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-3xl p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Admin — Manage Buses</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-muted">
            <X />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Label>Bus Number</Label>
            <Input value={form.busNumber} onChange={(e) => setForm({ ...form, busNumber: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded border bg-transparent px-3 py-2">
              <option value="AC">AC</option>
              <option value="Non-AC">Non-AC</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Total Seats</Label>
            <Input type="number" value={String(form.totalSeats)} onChange={(e) => setForm({ ...form, totalSeats: parseInt(e.target.value || '32') })} />
          </div>

          <div className="space-y-2">
            <Label>Stops (comma separated)</Label>
            <Input value={form.stops} onChange={(e) => setForm({ ...form, stops: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>From</Label>
            <Input value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>To</Label>
            <Input value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Driver Name</Label>
            <Input value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Driver Phone</Label>
            <Input value={form.driverPhone} onChange={(e) => setForm({ ...form, driverPhone: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Conductor</Label>
            <Input value={form.conductorName} onChange={(e) => setForm({ ...form, conductorName: e.target.value })} />
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <Button onClick={() => {
            if (!form.busNumber || !form.from || !form.to) return;
            addBus({
              busNumber: form.busNumber,
              type: form.type as any,
              route: {
                id: `route-${Date.now()}`,
                name: `${form.from} → ${form.to}`,
                from: form.from,
                to: form.to,
                stops: form.stops.split(',').map(s => s.trim()).filter(Boolean),
              },
              driver: { name: form.driverName || 'Driver', phone: form.driverPhone || '+91 90000 00000' },
              conductor: { name: form.conductorName || 'Conductor' },
              status: 'active',
              totalSeats: form.totalSeats,
            });

            // clear form
            setForm({
              busNumber: '',
              type: 'AC',
              totalSeats: 32,
              from: '',
              to: '',
              stops: '',
              driverName: '',
              driverPhone: '',
              conductorName: '',
            });
          }}>
            Add Bus
          </Button>

          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>

        <div>
          <h4 className="font-medium mb-2">Existing Buses</h4>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {buses.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded bg-muted/20">
                <div>
                  <div className="font-medium">{b.busNumber} — {b.route.name}</div>
                  <div className="text-xs text-muted-foreground">{b.type} • Seats: {b.totalSeats ?? '32'}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={() => removeBus(b.id)}>Remove</Button>
                  <Button onClick={() => {
                    const sub = window.prompt('Substitute bus number', `${b.busNumber}-SUB`);
                    if (!sub) return;
                    substituteBus(b.id, sub);
                  }}>Substitute</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
