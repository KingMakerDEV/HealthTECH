import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import Navbar from '@/components/Navbar';

interface RegisterForm {
  full_name:        string;
  email:            string;
  password:         string;
  role:             'DOCTOR' | 'PATIENT' | 'VOLUNTEER';
  phone?:           string;
  area_description?: string;
}

const ROLES = [
  { value: 'PATIENT',   label: 'Patient' },
  { value: 'DOCTOR',    label: 'Doctor'  },
  { value: 'VOLUNTEER', label: 'Volunteer' },
] as const;

const RegisterPage = () => {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();
  const {
    register, handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterForm>({ defaultValues: { role: 'PATIENT' } });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await api.post('/auth/register', {
        full_name:        data.full_name,
        email:            data.email,
        password:         data.password,
        role:             data.role,
        // Volunteer-specific fields (backend ignores them for other roles)
        phone:            data.phone            || undefined,
        area_description: data.area_description || undefined,
      });
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md glass-card p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-1">Join CARENETRA today</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Role selector — now 3 options */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-lg">
              {ROLES.map(r => (
                <label
                  key={r.value}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium cursor-pointer transition-all ${
                    selectedRole === r.value
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <input type="radio" value={r.value} {...register('role')} className="sr-only" />
                  {r.label}
                </label>
              ))}
            </div>

            {/* Volunteer description chip */}
            {selectedRole === 'VOLUNTEER' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2.5 leading-relaxed"
              >
                🏃 Volunteers receive SMS alerts when CARENETRA detects a nearby patient emergency.
                You can respond to confirm you're heading to help.
              </motion.div>
            )}

            {/* Full Name */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  {...register('full_name', { required: 'Name is required' })}
                  placeholder="Your full name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
              {errors.full_name && <p className="text-xs text-destructive mt-1">{errors.full_name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  {...register('email', { required: 'Email is required' })}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  {...register('password', {
                    required:  'Password is required',
                    minLength: { value: 8, message: 'Min 8 characters' },
                  })}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
            </div>

            {/* Volunteer-only fields */}
            {selectedRole === 'VOLUNTEER' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3"
              >
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Phone <span className="text-muted-foreground font-normal">(for SMS alerts)</span>
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      {...register('phone', {
                        required: selectedRole === 'VOLUNTEER' ? 'Phone is required for volunteers' : false,
                      })}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/30"
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Area <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      {...register('area_description')}
                      placeholder="e.g. Andheri West, Mumbai"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/30"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg gradient-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
