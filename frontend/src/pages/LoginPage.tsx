import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Sparkles, Shield } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { setAuth, getDashboardPath } from '@/lib/auth';
import Navbar from '@/components/Navbar';

interface LoginForm {
  email: string;
  password: string;
}

const formItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

const LoginPage = () => {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      const { access_token, role, user_id, full_name, unique_uid } = res.data;
      const user = {
        id: user_id,
        name: full_name,
        email: data.email,
        role: role as 'DOCTOR' | 'PATIENT' | 'VOLUNTEER',
        patient_id: unique_uid || undefined,
      };
      setAuth(access_token, user);
      toast.success('Welcome back!');
      navigate(getDashboardPath(user.role));
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background – floating gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-float-slow" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[100px] animate-float-slower" />
      {/* Subtle grid pattern using CSS gradient - safe, no parsing issues */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(79,140,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(79,140,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <Navbar />
      <div className="flex items-center justify-center px-4 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-md"
        >
          <div className="backdrop-blur-xl bg-card/30 border border-border/40 rounded-2xl p-8 shadow-2xl shadow-primary/5">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 mb-4">
                <Sparkles size={12} className="animate-pulse" />
                <span>Welcome back</span>
              </div>
              <h1 className="text-3xl font-bold text-foreground">Sign in</h1>
              <p className="text-sm text-muted-foreground mt-2">Access your CARENETRA account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <motion.div custom={0} variants={formItemVariants} initial="hidden" animate="visible">
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <div className="relative group">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    {...register('email', { required: 'Email is required' })}
                    type="email"
                    placeholder="abc@gmail.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
              </motion.div>

              <motion.div custom={1} variants={formItemVariants} initial="hidden" animate="visible">
                <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
                <div className="relative group">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    {...register('password', { required: 'Password is required' })}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
              </motion.div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <motion.div custom={2} variants={formItemVariants} initial="hidden" animate="visible">
                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
              </motion.div>
            </form>

            <motion.p
              custom={3}
              variants={formItemVariants}
              initial="hidden"
              animate="visible"
              className="text-center text-sm text-muted-foreground mt-6"
            >
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-medium hover:underline">Sign up</Link>
            </motion.p>

            <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield size={12} className="text-primary" />
              <span>HIPAA compliant • Secure & encrypted</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;