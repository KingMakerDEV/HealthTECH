import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Copy, Check, Pill, ChevronRight, Activity,
  Loader2, MessageSquare, Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import { getUser } from '@/lib/auth';
import api from '@/lib/api';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0, 0, 0.2, 1] as const },
  }),
};

interface DashboardData {
  patient_id: string;
  full_name: string;
  unique_uid: string;
  health_status: string;
  active_course: {
    course_id: string;
    course_name: string;
    condition: string;
    doctor_name: string;
    start_date: string;
    end_date: string;
    progress_pct: number;
    notes: string | null;
  } | null;
  medications_today: Array<{
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    time_of_day: string | null;
    instructions: string | null;
  }>;
  last_check_in: string | null;
  unread_messages: number;
  pending_question: {
    session_id: string;
    question: string;
    options: string[] | null;
    trigger: string;
  } | null;
}

interface Message {
  id: string;
  message: string;
  doctor_name: string;
  created_at: string;
  is_read: boolean;
}

const PatientDashboard = () => {
  const user = getUser();
  const [data, setData]         = useState<DashboardData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading]   = useState(true);
  const [copied, setCopied]     = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchMessages();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/patient/dashboard');
      setData(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get('/patient/messages');
      setMessages(res.data.messages || []);
    } catch { /* silent */ }
  };

  const copyId = () => {
    navigator.clipboard.writeText(data?.unique_uid || '');
    setCopied(true);
    toast.success('Patient ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  /** Opens AgentChat from anywhere on the dashboard */
  const openAgentChat = () => {
    window.dispatchEvent(new Event('carenetra:open-agent-chat'));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
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

  const greeting = new Date().getHours() < 12 ? 'Good morning' :
                   new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <DashboardLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6">

        {/* ── Welcome banner ──────────────────────────────────────────────────── */}
        <motion.div custom={0} variants={fadeUp} className="glass-card p-6 gradient-primary rounded-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-primary-foreground">
                {greeting}, {data.full_name.split(' ')[0]}! 👋
              </h1>
              <p className="text-primary-foreground/80 text-sm mt-1">
                Health status: <span className="font-medium">{data.health_status}</span>
              </p>
              {data.last_check_in && (
                <p className="text-primary-foreground/60 text-xs mt-0.5">
                  Last check-in: {new Date(data.last_check_in).toLocaleDateString()}
                </p>
              )}
            </div>
            <button
              onClick={copyId}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/20 text-primary-foreground text-sm font-mono hover:bg-background/30 transition-colors"
            >
              {data.unique_uid} {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </motion.div>

        {/* ── Scheduler-triggered nudge (from APScheduler) ────────────────────── */}
        {data.pending_question && (
          <motion.div
            custom={0.5}
            variants={fadeUp}
            className="glass-card p-5 border-l-4 border-primary bg-primary/5"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shrink-0 mt-0.5">
                <Bell size={14} className="text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground mb-0.5">
                  CARA has a check-in waiting for you
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {data.pending_question.question}
                </p>
                <button
                  onClick={openAgentChat}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  Open check-in <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Start daily check-in CTA (shown when no pending question) ────────── */}
        {!data.pending_question && (
          <motion.div custom={1} variants={fadeUp}>
            <button
              onClick={openAgentChat}
              className="w-full glass-card p-5 flex items-center justify-between hover:border-primary/40 transition-colors group rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                  <MessageSquare size={16} className="text-primary-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Start today's check-in</p>
                  <p className="text-xs text-muted-foreground">CARA will ask about your symptoms, medication and recovery</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </button>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Active Course ───────────────────────────────────────────────── */}
          <motion.div custom={2} variants={fadeUp} className="lg:col-span-2 glass-card p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity size={18} className="text-primary" /> Active Course
            </h2>
            {data.active_course ? (
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-foreground">{data.active_course.course_name}</p>
                    <p className="text-sm text-muted-foreground">by {data.active_course.doctor_name}</p>
                  </div>
                  <span className="text-sm font-medium text-primary">{data.active_course.progress_pct}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${data.active_course.progress_pct}%` }}
                    transition={{ duration: 1, ease: [0, 0, 0.2, 1] }}
                    className="h-full gradient-primary rounded-full"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.active_course.start_date} → {data.active_course.end_date}
                </p>
                {data.active_course.notes && (
                  <p className="text-xs text-muted-foreground italic">{data.active_course.notes}</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <p className="text-sm text-muted-foreground text-center">
                  No active course assigned yet.
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  Share your Patient ID (<span className="font-mono text-foreground">{data.unique_uid}</span>) with your doctor.
                </p>
              </div>
            )}
          </motion.div>

          {/* ── Medications today ────────────────────────────────────────────── */}
          <motion.div custom={3} variants={fadeUp} className="glass-card p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Pill size={18} className="text-secondary" /> Medications
            </h2>
            <div className="space-y-3">
              {data.medications_today.length > 0 ? (
                data.medications_today.map((med) => (
                  <div key={med.id} className="p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                    <p className="text-sm font-medium text-foreground">{med.name}</p>
                    <p className="text-xs text-muted-foreground">{med.dosage} · {med.frequency}</p>
                    {med.time_of_day && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5">{med.time_of_day}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No medications prescribed yet.</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Doctor Messages ────────────────────────────────────────────────── */}
        <motion.div custom={4} variants={fadeUp} className="glass-card p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare size={18} className="text-primary" /> Doctor Messages
            {data.unread_messages > 0 && (
              <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                {data.unread_messages} new
              </span>
            )}
          </h2>
          <div className="space-y-3">
            {messages.length > 0 ? (
              messages.map((msg) => (
                <div key={msg.id} className="p-3 rounded-lg border border-border">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-medium text-foreground">{msg.doctor_name}</p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{msg.message}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            )}
          </div>
        </motion.div>

      </motion.div>
    </DashboardLayout>
  );
};

export default PatientDashboard;