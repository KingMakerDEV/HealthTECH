import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { ChevronRight, ChevronLeft, Check, Search, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
}

const CreateCourse = () => {
  const [step, setStep] = useState(1);
  const [medications, setMedications] = useState<Medication[]>([{ name: '', dosage: '', frequency: 'Once daily' }]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const addMed = () => setMedications([...medications, { name: '', dosage: '', frequency: 'Once daily' }]);
  const removeMed = (i: number) => setMedications(medications.filter((_, idx) => idx !== i));

  const demoPatients = [
    { id: 'p1', name: 'Sarah Johnson', patient_id: 'CN-2024-0847' },
    { id: 'p2', name: 'James Wilson', patient_id: 'CN-2024-0623' },
    { id: 'p3', name: 'Emily Davis', patient_id: 'CN-2024-1102' },
  ];

  const filteredPatients = demoPatients.filter(p =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) || p.patient_id.includes(patientSearch)
  );

  const onSubmit = () => {
    if (step < 3) { setStep(step + 1); return; }
    toast.success('Medical course created successfully!');
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step >= s ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {step > s ? <Check size={14} /> : s}
              </div>
              <span className={`text-sm hidden sm:block ${step >= s ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {s === 1 ? 'Details' : s === 2 ? 'Medications' : 'Assign'}
              </span>
              {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6"
        >
          {step === 1 && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Course Details</h2>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Course Name</label>
                <input {...register('name', { required: true })} placeholder="e.g. Post-Surgery Recovery" className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/30" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
                <textarea {...register('description')} rows={3} placeholder="Describe the course..." className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/30 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Start Date</label>
                  <input type="date" {...register('startDate')} className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-ring/30" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">End Date</label>
                  <input type="date" {...register('endDate')} className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-ring/30" />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-lg gradient-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2">
                Next <ChevronRight size={16} />
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Medications</h2>
              {medications.map((med, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    {i === 0 && <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>}
                    <input placeholder="Medication name" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/30" />
                  </div>
                  <div className="col-span-3">
                    {i === 0 && <label className="text-xs font-medium text-muted-foreground mb-1 block">Dosage</label>}
                    <input placeholder="500mg" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/30" />
                  </div>
                  <div className="col-span-3">
                    {i === 0 && <label className="text-xs font-medium text-muted-foreground mb-1 block">Frequency</label>}
                    <select className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-ring/30">
                      <option>Once daily</option>
                      <option>Twice daily</option>
                      <option>As needed</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    {medications.length > 1 && (
                      <button onClick={() => removeMed(i)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
                    )}
                  </div>
                </div>
              ))}
              <button onClick={addMed} className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                <Plus size={14} /> Add Medication
              </button>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium flex items-center justify-center gap-2">
                  <ChevronLeft size={16} /> Back
                </button>
                <button onClick={() => setStep(3)} className="flex-1 py-2.5 rounded-lg gradient-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2">
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Assign Patient</h2>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search by name or ID..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPatient(p.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center gap-3 ${
                      selectedPatient === p.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground">
                      {p.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{p.patient_id}</p>
                    </div>
                    {selectedPatient === p.id && <Check size={16} className="ml-auto text-primary" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium flex items-center justify-center gap-2">
                  <ChevronLeft size={16} /> Back
                </button>
                <button onClick={onSubmit} disabled={!selectedPatient} className="flex-1 py-2.5 rounded-lg gradient-primary text-primary-foreground font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  Create Course <Check size={16} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default CreateCourse;
