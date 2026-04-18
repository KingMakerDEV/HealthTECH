import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, AlertTriangle, Search, Activity, TrendingUp, Clock, Pill,
  Loader2, Send, Plus, X, ChevronRight, UserSearch, BookOpen, Check,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import EmergencyBanner from '@/components/EmergencyBanner';
import { toast } from 'sonner';
import api from '@/lib/api';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0, 0, 0.2, 1] as const },
  }),
};

const tierColor: Record<string, string> = {
  'Doing Well':                   'bg-emerald-500/10 text-emerald-400',
  'Needs Attention':              'bg-yellow-500/10 text-yellow-400',
  'Monitor Closely':              'bg-orange-500/10 text-orange-400',
  'Doctor Has Been Notified':     'bg-red-500/10 text-red-400',
  'Emergency':                    'bg-red-600/10 text-red-500',
  'Emergency — Help Is On The Way':'bg-red-600/10 text-red-500',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface PatientSummary {
  patient_id: string;
  full_name: string;
  unique_uid: string;
  course_name: string;
  condition_type: string;
  total_score: number | null;
  tier: string | null;
  health_status: string;
  last_check_in: string | null;
  symptom_summary: string | null;
}

interface AlertItem {
  alert_id: string;
  alert_type: string;
  patient_name: string;
  patient_id: string;
  message: string;
  risk_score: number | null;
  created_at: string;
}

interface PatientDetail {
  patient_id: string;
  full_name: string;
  unique_uid: string;
  email: string;
  date_of_birth: string | null;
  blood_group: string | null;
  emergency_contact: { name: string | null; phone: string | null; email: string | null };
  course: {
    course_id: string;
    course_name: string;
    condition: string;
    status: string;
    start_date: string;
    end_date: string;
    notes: string | null;
  } | null;
  latest_risk_score: {
    total_score: number | null;
    tier: string | null;
    breakdown: any;
    created_at: string | null;
  };
  score_history: Array<{ score: number; tier: string; created_at: string }>;
  recent_check_ins: Array<{
    check_in_id: string;
    created_at: string;
    input_type: string;
    symptom_summary: string | null;
    total_score: number | null;
    tier: string | null;
  }>;
  medications: Array<{
    id: string; name: string; dosage: string;
    frequency: string; time_of_day: string | null; instructions: string | null;
  }>;
  recent_wounds: Array<{
    id: string; severity: string; summary: string;
    wound_score: number; image_url: string | null; created_at: string;
  }>;
  condition_metrics: Record<string, { value: string; status: string; note?: string }>;
}

interface DashboardResponse {
  total_patients: number;
  critical_count: number;
  high_risk_count: number;
  stable_count: number;
  patients: PatientSummary[];
  active_alerts: AlertItem[];
}

interface FoundPatient {
  patient_id: string;
  full_name: string;
  email: string;
  unique_uid: string;
}

interface CourseItem {
  course_id: string;
  course_name: string;
  condition_type: string;
  status: string;
  assigned: boolean;
  patient_name: string | null;
  medication_count: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

const DoctorDashboard = () => {
  const navigate = useNavigate();

  // Main dashboard state
  const [dashData, setDashData]               = useState<DashboardResponse | null>(null);
  const [loading, setLoading]                 = useState(true);
  const [alerts, setAlerts]                   = useState<AlertItem[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [detail, setDetail]                   = useState<PatientDetail | null>(null);
  const [detailLoading, setDetailLoading]     = useState(false);
  const [search, setSearch]                   = useState('');
  const [messageText, setMessageText]         = useState('');
  const [sendingMsg, setSendingMsg]           = useState(false);

  // Add Patient panel state
  const [showAddPanel, setShowAddPanel]       = useState(false);
  const [addPanelStep, setAddPanelStep]       = useState<'search' | 'pick-course' | 'done'>('search');
  const [uidInput, setUidInput]               = useState('');
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [foundPatient, setFoundPatient]       = useState<FoundPatient | null>(null);
  const [unassignedCourses, setUnassignedCourses] = useState<CourseItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [assigning, setAssigning]             = useState(false);

  useEffect(() => { fetchDashboard(); }, []);

  // ── Dashboard fetch ─────────────────────────────────────────────────────────

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/doctor/dashboard');
      setDashData(res.data);
      setAlerts(res.data.active_alerts || []);
      if (res.data.patients?.length > 0 && !selectedPatientId) {
        const firstId = res.data.patients[0].patient_id;
        setSelectedPatientId(firstId);
        fetchPatientDetail(firstId);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientDetail = async (patientId: string) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/doctor/patient/${patientId}`);
      setDetail(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load patient detail');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    fetchPatientDetail(patientId);
  };

  // ── Alert actions ────────────────────────────────────────────────────────────

  const handleDismissAlert = async (alertId: string) => {
    try {
      await api.post(`/doctor/dismiss-alert/${alertId}`);
      setAlerts(a => a.filter(x => x.alert_id !== alertId));
      toast.info('Alert dismissed');
    } catch { toast.error('Failed to dismiss alert'); }
  };

  const handleDispatchAlert = async (alertId: string) => {
    try {
      await api.post(`/doctor/confirm-dispatch/${alertId}`);
      setAlerts(a => a.filter(x => x.alert_id !== alertId));
      toast.success('Emergency dispatch confirmed');
    } catch { toast.error('Failed to dispatch'); }
  };

  // ── Send message ─────────────────────────────────────────────────────────────

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedPatientId) return;
    setSendingMsg(true);
    try {
      await api.post('/doctor/message', { patient_id: selectedPatientId, message: messageText });
      toast.success('Message sent');
      setMessageText('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to send message');
    } finally { setSendingMsg(false); }
  };

  // ── Add Patient flow ─────────────────────────────────────────────────────────

  const openAddPanel = async () => {
    setShowAddPanel(true);
    setAddPanelStep('search');
    setFoundPatient(null);
    setUidInput('');
    setSelectedCourseId(null);

    // Pre-fetch unassigned courses so they're ready
    try {
      const res = await api.get('/doctor/courses');
      setUnassignedCourses((res.data.courses || []).filter((c: CourseItem) => !c.assigned));
    } catch { /* silent */ }
  };

  const closeAddPanel = () => {
    setShowAddPanel(false);
    setAddPanelStep('search');
    setFoundPatient(null);
    setUidInput('');
    setSelectedCourseId(null);
  };

  const searchByUid = async () => {
    if (!uidInput.trim()) return;
    setSearchingPatient(true);
    setFoundPatient(null);
    try {
      const res = await api.get(`/doctor/find-patient?uid=${encodeURIComponent(uidInput.trim().toUpperCase())}`);
      setFoundPatient(res.data);
      setAddPanelStep('pick-course');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Patient not found. Check the ID and try again.');
    } finally { setSearchingPatient(false); }
  };

  const assignCourseToPatient = async () => {
    if (!foundPatient || !selectedCourseId) return;
    setAssigning(true);
    try {
      await api.post(`/doctor/courses/${selectedCourseId}/assign`, {
        patient_unique_uid: foundPatient.unique_uid,
      });
      toast.success(`Course assigned to ${foundPatient.full_name}!`);
      setAddPanelStep('done');
      // Refresh dashboard after short delay
      setTimeout(() => {
        fetchDashboard();
        closeAddPanel();
      }, 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Assignment failed');
    } finally { setAssigning(false); }
  };

  // ── Derived ──────────────────────────────────────────────────────────────────

  const filteredPatients = dashData?.patients?.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.unique_uid.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const chartData = detail?.score_history?.map(s => ({
    date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    riskScore: s.score,
  })) || [];

  // ── Loading / error states ────────────────────────────────────────────────────

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  if (!dashData) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-muted-foreground">Could not load dashboard data.</p>
          <button
            onClick={() => { setLoading(true); fetchDashboard(); }}
            className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      <EmergencyBanner
        alerts={alerts.map(a => ({
          id:         a.alert_id,
          patient:    a.patient_name,
          patient_id: a.patient_id,
          message:    a.message,
          time:       new Date(a.created_at).toLocaleTimeString(),
        }))}
        onDismiss={handleDismissAlert}
        onDispatch={handleDispatchAlert}
      />

      <DashboardLayout>
        <motion.div initial="hidden" animate="visible" className="space-y-6">

          {/* ── Page header ──────────────────────────────────────────────────── */}
          <motion.div custom={0} variants={fadeUp} className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">Patient Overview</h1>
              <p className="text-sm text-muted-foreground">{dashData.total_patients} patients monitored</p>
            </div>
            {/* Primary CTA — always visible */}
            <button
              onClick={() => navigate('/doctor/create-course')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-md"
            >
              <Plus size={15} /> New Course
            </button>
          </motion.div>

          {/* ── Stats ────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Patients', value: dashData.total_patients, icon: Users,         color: 'text-primary' },
              { label: 'Critical',       value: dashData.critical_count, icon: AlertTriangle, color: 'text-red-400' },
              { label: 'High Risk',      value: dashData.high_risk_count,icon: Activity,      color: 'text-orange-400' },
              { label: 'Stable',         value: dashData.stable_count,   icon: TrendingUp,    color: 'text-emerald-400' },
            ].map((stat, i) => (
              <motion.div key={stat.label} custom={i + 1} variants={fadeUp} className="glass-card p-4">
                <div className="flex items-center justify-between mb-1">
                  <stat.icon size={16} className={stat.color} />
                  <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                </div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-5 gap-6">

            {/* ── Patient list ──────────────────────────────────────────────── */}
            <motion.div custom={5} variants={fadeUp} className="lg:col-span-2 glass-card p-4 flex flex-col">

              {/* List header */}
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-semibold text-foreground text-sm flex-1">Patients</h2>
                {/* Add Patient button */}
                <button
                  onClick={openAddPanel}
                  title="Assign a course to a new patient by CNT-XXXXX ID"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/5 text-primary hover:bg-primary/15 transition-colors"
                >
                  <UserSearch size={13} /> Add Patient
                </button>
              </div>

              {/* ── Add Patient slide-in panel ─────────────────────────────── */}
              <AnimatePresence>
                {showAddPanel && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-3"
                  >
                    <div className="border border-primary/20 rounded-xl bg-primary/5 p-4 space-y-3">

                      {/* Panel header */}
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-foreground">
                          {addPanelStep === 'search'      ? 'Find patient by ID'
                           : addPanelStep === 'pick-course' ? 'Select a course to assign'
                           : '✓ Assignment complete'}
                        </p>
                        <button onClick={closeAddPanel} className="text-muted-foreground hover:text-foreground">
                          <X size={13} />
                        </button>
                      </div>

                      {/* Step 1 — search by CNT-XXXXX */}
                      {addPanelStep === 'search' && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              value={uidInput}
                              onChange={e => setUidInput(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && searchByUid()}
                              placeholder="CNT-XXXXX"
                              className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-foreground text-xs placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/30 font-mono"
                            />
                            <button
                              onClick={searchByUid}
                              disabled={searchingPatient || !uidInput.trim()}
                              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                            >
                              {searchingPatient ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                              Find
                            </button>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Ask the patient to share their ID from their dashboard.
                          </p>
                          <button
                            onClick={() => navigate('/doctor/create-course')}
                            className="w-full text-xs text-primary hover:underline flex items-center justify-center gap-1 py-1"
                          >
                            <Plus size={11} /> Create a new course instead
                          </button>
                        </div>
                      )}

                      {/* Step 2 — pick course */}
                      {addPanelStep === 'pick-course' && foundPatient && (
                        <div className="space-y-3">
                          {/* Confirmed patient */}
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                              {foundPatient.full_name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{foundPatient.full_name}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{foundPatient.unique_uid}</p>
                            </div>
                            <Check size={13} className="text-emerald-400 shrink-0" />
                          </div>

                          {/* Unassigned courses */}
                          {unassignedCourses.length > 0 ? (
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                                Your unassigned courses
                              </p>
                              {unassignedCourses.map(course => (
                                <button
                                  key={course.course_id}
                                  onClick={() => setSelectedCourseId(
                                    selectedCourseId === course.course_id ? null : course.course_id
                                  )}
                                  className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs ${
                                    selectedCourseId === course.course_id
                                      ? 'border-primary bg-primary/10 text-foreground'
                                      : 'border-border bg-background hover:bg-muted text-foreground'
                                  }`}
                                >
                                  <div className="font-medium truncate">{course.course_name}</div>
                                  <div className="text-muted-foreground text-[10px] mt-0.5">
                                    {course.condition_type.replace(/_/g, ' ')} · {course.medication_count} med{course.medication_count !== 1 ? 's' : ''}
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-2">
                              <p className="text-xs text-muted-foreground">No unassigned courses.</p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate('/doctor/create-course')}
                              className="flex-1 py-2 rounded-lg border border-border text-xs text-foreground hover:bg-muted flex items-center justify-center gap-1"
                            >
                              <BookOpen size={11} /> New Course
                            </button>
                            <button
                              onClick={assignCourseToPatient}
                              disabled={!selectedCourseId || assigning}
                              className="flex-1 py-2 rounded-lg gradient-primary text-primary-foreground text-xs font-medium disabled:opacity-40 flex items-center justify-center gap-1"
                            >
                              {assigning
                                ? <Loader2 size={11} className="animate-spin" />
                                : <ChevronRight size={11} />
                              }
                              {assigning ? 'Assigning...' : 'Assign'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Step 3 — done */}
                      {addPanelStep === 'done' && (
                        <div className="flex items-center gap-2 py-1">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <Check size={12} className="text-emerald-400" />
                          </div>
                          <p className="text-xs text-foreground">
                            Course assigned to <strong>{foundPatient?.full_name}</strong>. Dashboard refreshing...
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Search existing patients */}
              <div className="relative mb-3">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search assigned patients..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-muted border border-border text-foreground text-xs placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>

              {/* Patient list */}
              <div className="flex-1 space-y-1 overflow-y-auto max-h-[calc(100vh-400px)]">
                {filteredPatients.length > 0 ? filteredPatients.map(p => (
                  <button
                    key={p.patient_id}
                    onClick={() => handleSelectPatient(p.patient_id)}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      selectedPatientId === p.patient_id
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground shrink-0">
                      {p.full_name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.full_name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {p.condition_type?.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        tierColor[p.health_status] || 'bg-muted text-muted-foreground'
                      }`}>
                        {p.health_status}
                      </span>
                      {p.last_check_in && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(p.last_check_in).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </button>
                )) : (
                  <div className="text-center py-8 space-y-2">
                    <p className="text-sm text-muted-foreground">No patients assigned yet.</p>
                    <button
                      onClick={() => navigate('/doctor/create-course')}
                      className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto"
                    >
                      <Plus size={11} /> Create your first course
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── Patient detail ────────────────────────────────────────────── */}
            <motion.div custom={6} variants={fadeUp} className="lg:col-span-3 space-y-4">
              {detailLoading ? (
                <div className="glass-card p-5 flex items-center justify-center h-64">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              ) : detail ? (
                <>
                  {/* Patient header */}
                  <div className="glass-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-foreground">{detail.full_name}</h2>
                        <p className="text-sm text-muted-foreground">
                          {detail.course?.condition?.replace(/_/g, ' ')} · <span className="font-mono">{detail.unique_uid}</span>
                        </p>
                        {detail.course && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {detail.course.course_name} · {detail.course.start_date} → {detail.course.end_date}
                          </p>
                        )}
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg text-sm font-bold shrink-0 ${
                        (detail.latest_risk_score?.total_score ?? 0) >= 76 ? 'bg-red-500/10 text-red-400' :
                        (detail.latest_risk_score?.total_score ?? 0) >= 51 ? 'bg-orange-500/10 text-orange-400' :
                        (detail.latest_risk_score?.total_score ?? 0) >= 26 ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {detail.latest_risk_score?.total_score != null
                          ? `${detail.latest_risk_score.total_score.toFixed(1)} / 100`
                          : 'No data'}
                      </div>
                    </div>
                  </div>

                  {/* Risk score trend chart */}
                  {chartData.length > 0 && (
                    <div className="glass-card p-5">
                      <h3 className="text-sm font-semibold text-foreground mb-4">Risk Score Trend</h3>
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 100]} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                fontSize: 12,
                              }}
                            />
                            <Line
                              type="monotone" dataKey="riskScore"
                              stroke="hsl(var(--primary))" strokeWidth={2}
                              dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                              name="Risk Score"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Condition metrics + recent check-ins */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="glass-card p-5">
                      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Activity size={14} className="text-primary" /> Condition Metrics
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(detail.condition_metrics || {}).map(([key, metric]) => (
                          <div key={key} className="flex items-center justify-between py-0.5">
                            <span className="text-xs text-muted-foreground capitalize">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              metric.status === 'critical' ? 'bg-red-500/10 text-red-400' :
                              metric.status === 'warning'  ? 'bg-orange-500/10 text-orange-400' :
                              'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {metric.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="glass-card p-5">
                      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Clock size={14} className="text-primary" /> Recent Check-ins
                      </h3>
                      <div className="space-y-2.5">
                        {detail.recent_check_ins?.slice(0, 5).map(c => (
                          <div key={c.check_in_id} className="flex gap-2.5 items-start">
                            <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                              c.tier === 'RED' || c.tier === 'EMERGENCY' ? 'bg-red-400' :
                              c.tier === 'ORANGE' || c.tier === 'YELLOW' ? 'bg-orange-400' :
                              'bg-emerald-400'
                            }`} />
                            <div className="min-w-0">
                              <p className="text-xs text-foreground line-clamp-2">
                                {c.symptom_summary || `${c.input_type} check-in`}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(c.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        {(!detail.recent_check_ins || detail.recent_check_ins.length === 0) && (
                          <p className="text-xs text-muted-foreground">No check-ins yet.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Medications */}
                  {detail.medications?.length > 0 && (
                    <div className="glass-card p-5">
                      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Pill size={14} className="text-primary" /> Medications
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {detail.medications.map(m => (
                          <div key={m.id} className="p-2.5 rounded-lg bg-muted/50">
                            <p className="text-sm font-medium text-foreground">{m.name} — {m.dosage}</p>
                            <p className="text-xs text-muted-foreground">
                              {m.frequency}{m.time_of_day ? ` · ${m.time_of_day}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Send message */}
                  <div className="glass-card p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Send Message to Patient</h3>
                    <div className="flex gap-2">
                      <input
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message for the patient..."
                        className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/30"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={sendingMsg || !messageText.trim()}
                        className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {sendingMsg ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="glass-card p-5 text-center py-16 space-y-3">
                  <Users size={32} className="text-muted-foreground/30 mx-auto" />
                  <p className="text-muted-foreground text-sm">Select a patient to view their details</p>
                  {dashData.total_patients === 0 && (
                    <button
                      onClick={() => navigate('/doctor/create-course')}
                      className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto"
                    >
                      <Plus size={11} /> Create your first course to get started
                    </button>
                  )}
                </div>
              )}
            </motion.div>

          </div>
        </motion.div>
      </DashboardLayout>
    </>
  );
};

export default DoctorDashboard;