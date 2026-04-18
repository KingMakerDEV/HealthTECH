import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Mic, Send, Upload, MessageSquare, Pill, Camera, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import { demoPatientDashboard } from '@/lib/demo-data';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4, ease: [0, 0, 0.2, 1] as const } }),
};

const PatientDashboard = () => {
  const data = demoPatientDashboard;
  const [copied, setCopied] = useState(false);
  const [checkinText, setCheckinText] = useState('');
  const [recording, setRecording] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(data.user.patient_id || '');
    setCopied(true);
    toast.success('Patient ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const submitCheckin = () => {
    if (!checkinText.trim()) return;
    toast.success('Check-in submitted!');
    setCheckinText('');
  };

  return (
    <DashboardLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        {/* Welcome */}
        <motion.div custom={0} variants={fadeUp} className="glass-card p-6 gradient-primary rounded-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-primary-foreground">Good morning, {data.user.name.split(' ')[0]}! 👋</h1>
              <p className="text-primary-foreground/80 text-sm mt-1">Here's your health summary for today</p>
            </div>
            <button onClick={copyId} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/20 text-primary-foreground text-sm font-mono hover:bg-background/30 transition-colors">
              {data.user.patient_id} {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Active Course */}
          <motion.div custom={1} variants={fadeUp} className="lg:col-span-2 glass-card p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity size={18} className="text-primary" /> Active Course
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-foreground">{data.course.name}</p>
                  <p className="text-sm text-muted-foreground">by {data.course.doctor}</p>
                </div>
                <span className="text-sm font-medium text-primary">{data.course.progress}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${data.course.progress}%` }}
                  transition={{ duration: 1, ease: [0, 0, 0.2, 1] }}
                  className="h-full gradient-primary rounded-full"
                />
              </div>
              <p className="text-xs text-muted-foreground">{data.course.startDate} → {data.course.endDate}</p>
            </div>
          </motion.div>

          {/* Medication Tracker */}
          <motion.div custom={2} variants={fadeUp} className="glass-card p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Pill size={18} className="text-secondary" /> Medications
            </h2>
            <div className="space-y-3">
              {data.course.medications.map((med) => (
                <div key={med.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-foreground">{med.name}</p>
                    <p className="text-xs text-muted-foreground">{med.dosage} · {med.frequency}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${med.taken ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                    {med.taken ? <Check size={12} /> : <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Daily Check-in */}
        <motion.div custom={3} variants={fadeUp} className="glass-card p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare size={18} className="text-primary" /> Daily Check-in
          </h2>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-2">
              {data.checkinQuestions.map((q) => (
                <button key={q} onClick={() => setCheckinText(q)} className="text-left text-sm p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-foreground flex items-center gap-2">
                  <ChevronRight size={14} className="text-primary shrink-0" /> {q}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRecording(!recording)}
                className={`p-3 rounded-lg transition-colors relative ${recording ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                <Mic size={18} />
                {recording && <span className="absolute inset-0 rounded-lg animate-pulse-ring bg-destructive/20" />}
              </button>
              <input
                value={checkinText}
                onChange={(e) => setCheckinText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitCheckin()}
                placeholder="Describe how you're feeling..."
                className="flex-1 px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/30"
              />
              <button onClick={submitCheckin} className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity">
                <Send size={18} />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Wound Upload */}
          <motion.div custom={4} variants={fadeUp} className="glass-card p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Camera size={18} className="text-warning" /> Wound Upload
            </h2>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Click or drag to upload wound photo</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 10MB</p>
            </div>
          </motion.div>

          {/* Messages */}
          <motion.div custom={5} variants={fadeUp} className="glass-card p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare size={18} className="text-primary" /> Doctor Messages
            </h2>
            <div className="space-y-3">
              {data.messages.map((msg) => (
                <div key={msg.id} className={`p-3 rounded-lg border ${msg.read ? 'border-border' : 'border-primary/30 bg-primary/5'}`}>
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-foreground">{msg.from}</p>
                    <span className="text-xs text-muted-foreground">{msg.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{msg.text}</p>
                  {!msg.read && <span className="inline-block mt-2 text-[10px] font-medium text-primary">New</span>}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

// Need to import Activity separately since it's used inline
import { Activity } from 'lucide-react';

export default PatientDashboard;
