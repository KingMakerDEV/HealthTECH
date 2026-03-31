import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Camera, Save } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import { getUser } from '@/lib/auth';

const ProfilePage = () => {
  const user = getUser();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '+1 (555) 123-4567',
      address: '123 Health St, Medical City, MC 12345',
      bio: 'Healthcare professional dedicated to patient well-being.',
    },
  });

  const onSubmit = async () => {
    setSaving(true);
    setTimeout(() => {
      toast.success('Profile updated successfully!');
      setSaving(false);
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground mb-6">Profile Settings</h1>

          <div className="glass-card p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-foreground">
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </div>
                <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:opacity-90">
                  <Camera size={12} />
                </button>
              </div>
              <div>
                <p className="font-semibold text-foreground">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.role}</p>
                {user?.patient_id && <p className="text-xs text-primary font-mono mt-1">{user.patient_id}</p>}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                <input {...register('name')} className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-ring/30" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <input {...register('email')} type="email" className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-ring/30" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Phone</label>
                <input {...register('phone')} className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-ring/30" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Address</label>
                <input {...register('address')} className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-ring/30" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Bio</label>
              <textarea {...register('bio')} rows={3} className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-ring/30 resize-none" />
            </div>
            <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg gradient-primary text-primary-foreground font-medium text-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-50">
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
