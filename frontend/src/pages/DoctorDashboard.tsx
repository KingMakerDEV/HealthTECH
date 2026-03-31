import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, AlertTriangle, Search, Activity, TrendingUp, Clock, Pill, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import DashboardLayout from '@/components/DashboardLayout';
import EmergencyBanner from '@/components/EmergencyBanner';
import { demoDoctorDashboard } from '@/lib/demo-data';
import { toast } from 'sonner';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4, ease: [0, 0, 0.2, 1] as const } }),
};

const statusColor = {
  stable: 'bg-success/10 text-success',
  attention: 'bg-warning/10 text-warning',
  critical: 'bg-destructive/10 text-destructive',
};

const DoctorDashboard = () => {
  const [alerts, setAlerts] = useState(demoDoctorDashboard.alerts);
  const [selectedPatient, setSelectedPatient] = useState(demoDoctorDashboard.patients[1]);
  const [search, setSearch] = useState('');
  const detail = demoDoctorDashboard.patientDetail;

  const chartData = detail.metrics.dates.map((d, i) => ({
    date: d,
    bloodSugar: detail.metrics.bloodSugar[i],
    bloodPressure: detail.metrics.bloodPressure[i],
    heartRate: detail.metrics.heartRate[i],
  }));

  const filteredPatients = demoDoctorDashboard.patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.patient_id.includes(search)
  );

  return (
    <>
      <EmergencyBanner
        alerts={alerts}
        onDismiss={(id) => { setAlerts(a => a.filter(x => x.id !== id)); toast.info('Alert dismissed'); }}
        onDispatch={(id) => { setAlerts(a => a.filter(x => x.id !== id)); }}
      />
      <DashboardLayout>
        <motion.div initial="hidden" animate="visible" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Patients', value: '24', icon: Users, color: 'text-primary' },
              { label: 'Critical', value: '3', icon: AlertTriangle, color: 'text-destructive' },
              { label: 'Check-ins Today', value: '18', icon: Activity, color: 'text-success' },
              { label: 'Avg Risk Score', value: '4.2', icon: TrendingUp, color: 'text-warning' },
            ].map((stat, i) => (
              <motion.div key={stat.label} custom={i} variants={fadeUp} className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon size={18} className={stat.color} />
                  <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                </div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* Patient List */}
            <motion.div custom={4} variants={fadeUp} className="lg:col-span-2 glass-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-semibold text-foreground flex-1">Patients</h2>
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-muted border border-border text-foreground text-xs placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/30"
                  />
                </div>
              </div>
              <div className="space-y-1 max-h-[calc(100vh-320px)] overflow-y-auto">
                {filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPatient(p)}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      selectedPatient?.id === p.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground">
                      {p.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.condition}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor[p.status]}`}>
                        {p.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{p.lastCheckin}</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Patient Detail */}
            <motion.div custom={5} variants={fadeUp} className="lg:col-span-3 space-y-4">
              {/* Header */}
              <div className="glass-card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{detail.name}</h2>
                    <p className="text-sm text-muted-foreground">{detail.condition} · Age {detail.age} · {detail.patient_id}</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                    detail.riskScore >= 7 ? 'bg-destructive/10 text-destructive' : detail.riskScore >= 4 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                  }`}>
                    Risk: {detail.riskScore}/10
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Health Metrics (7 days)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }}
                      />
                      <Line type="monotone" dataKey="bloodSugar" stroke="#4A90E2" strokeWidth={2} dot={{ r: 3 }} name="Blood Sugar" />
                      <Line type="monotone" dataKey="bloodPressure" stroke="#00C896" strokeWidth={2} dot={{ r: 3 }} name="Blood Pressure" />
                      <Line type="monotone" dataKey="heartRate" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} name="Heart Rate" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Medication Adherence */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="glass-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Pill size={14} className="text-primary" /> Medication Adherence
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray={`${detail.medicationAdherence} ${100 - detail.medicationAdherence}`} strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">{detail.medicationAdherence}%</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Adherence rate</p>
                      <p className="text-xs text-warning font-medium">Below target (85%)</p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="glass-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Clock size={14} className="text-primary" /> Recent Activity
                  </h3>
                  <div className="space-y-2.5">
                    {detail.timeline.map((t, i) => (
                      <div key={i} className="flex gap-2.5 items-start">
                        <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                          t.type === 'warning' ? 'bg-warning' : t.type === 'success' ? 'bg-success' : t.type === 'danger' ? 'bg-destructive' : 'bg-primary'
                        }`} />
                        <div>
                          <p className="text-xs text-foreground">{t.event}</p>
                          <p className="text-[10px] text-muted-foreground">{t.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </DashboardLayout>
    </>
  );
};

export default DoctorDashboard;
