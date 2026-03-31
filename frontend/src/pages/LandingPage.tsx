import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Activity, Brain, Clock, ArrowRight, Heart, Users, Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';
import HeroScene from '@/components/HeroScene';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: [0, 0, 0.2, 1] as const } }),
};

const features = [
  { icon: Brain, title: 'AI-Powered Monitoring', desc: 'Intelligent agents track patient health 24/7 and flag concerns automatically.' },
  { icon: Activity, title: 'Real-Time Vitals', desc: 'Live dashboards with health metrics, risk scores, and trend analysis.' },
  { icon: Shield, title: 'Emergency Alerts', desc: 'Instant notifications when critical thresholds are breached.' },
  { icon: Clock, title: 'Medication Tracking', desc: 'Automated reminders and adherence monitoring for every patient.' },
  { icon: Heart, title: 'Daily Check-ins', desc: 'Voice and text-based check-ins to capture patient well-being.' },
  { icon: Users, title: 'Doctor-Patient Connect', desc: 'Seamless communication between care teams and patients.' },
];

const steps = [
  { num: '01', title: 'Patient Enrolls', desc: 'Patients register and receive a unique ID for their care journey.' },
  { num: '02', title: 'Doctor Creates Course', desc: 'Doctors set up personalized medical courses with medications and schedules.' },
  { num: '03', title: 'AI Monitors Daily', desc: 'Our agent conducts daily check-ins and monitors all health data.' },
  { num: '04', title: 'Alerts & Action', desc: 'Critical changes trigger instant alerts for immediate medical response.' },
];

const LandingPage = () => {
  useEffect(() => {
    // Lenis smooth scroll
    let lenis: any;
    import('@studio-freight/lenis').then((mod) => {
      lenis = new mod.default({ duration: 1.2, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
      const raf = (time: number) => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    });
    return () => lenis?.destroy();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden section-padding min-h-[85vh] flex items-center">
        <div className="container mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial="hidden" animate="visible" className="space-y-6">
            <motion.div custom={0} variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Zap size={14} /> Intelligent Healthcare Platform
            </motion.div>
            <motion.h1 custom={1} variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Healthcare that <span className="gradient-text">watches over</span> your patients
            </motion.h1>
            <motion.p custom={2} variants={fadeUp} className="text-lg text-muted-foreground max-w-lg">
              CARENETRA uses AI agents to monitor patients 24/7, enabling proactive care, timely alerts, and better outcomes.
            </motion.p>
            <motion.div custom={3} variants={fadeUp} className="flex flex-wrap gap-3">
              <Link to="/register" className="px-6 py-3 rounded-lg gradient-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
                Start Free <ArrowRight size={16} />
              </Link>
              <Link to="/#features" className="px-6 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition-colors">
                Learn More
              </Link>
            </motion.div>
            <motion.div custom={4} variants={fadeUp} className="flex items-center gap-6 pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">10k+</p>
                <p className="text-xs text-muted-foreground">Patients</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">500+</p>
                <p className="text-xs text-muted-foreground">Doctors</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">99.9%</p>
                <p className="text-xs text-muted-foreground">Uptime</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="h-[400px] lg:h-[500px] hidden lg:block"
          >
            <HeroScene />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="section-padding bg-muted/50">
        <div className="container mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="text-center mb-16">
            <motion.p custom={0} variants={fadeUp} className="text-sm font-medium text-primary mb-2">Features</motion.p>
            <motion.h2 custom={1} variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-foreground">Everything you need for modern care</motion.h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                className="glass-card p-6 hover-lift group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon size={22} className="text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="section-padding">
        <div className="container mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="text-center mb-16">
            <motion.p custom={0} variants={fadeUp} className="text-sm font-medium text-primary mb-2">How It Works</motion.p>
            <motion.h2 custom={1} variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-foreground">Simple, effective care in 4 steps</motion.h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                className="text-center"
              >
                <div className="text-5xl font-bold gradient-text mb-4">{s.num}</div>
                <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="glass-card p-12 text-center gradient-primary rounded-2xl"
          >
            <motion.h2 custom={0} variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">Ready to transform patient care?</motion.h2>
            <motion.p custom={1} variants={fadeUp} className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">Join thousands of healthcare providers using CARENETRA to deliver proactive, AI-powered care.</motion.p>
            <motion.div custom={2} variants={fadeUp}>
              <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-background text-foreground font-medium hover:opacity-90 transition-opacity">
                Get Started Free <ArrowRight size={16} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">C</span>
            </div>
            <span className="font-semibold text-foreground">CARENETRA</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2025 CARENETRA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
