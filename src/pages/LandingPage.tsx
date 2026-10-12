import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { HowItWorksCarousel } from '../components/HowItWorksCarousel';
import {
  FileTextIcon,
  ArrowRightLeftIcon,
  ActivityIcon,
  BellRingIcon,
  ArrowRightIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  MessageSquareIcon,
  SendIcon,
  UserPlusIcon,
  LogInIcon,
  LayoutDashboardIcon,
  FileEditIcon,
  SearchIcon,
  CheckCircle2Icon,
  StarIcon,
  CopyIcon,
  CheckIcon,
  Loader2Icon
} from 'lucide-react';
import { toast } from 'sonner';
import { apiJson } from '../lib/api';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

const HOW_IT_WORKS_STEPS = [
  {
    number: 1,
    title: 'Create Your Account',
    quote: 'A must-have for anyone looking to save time and streamline campus concerns.',
    description:
      'Register using your Student ID and set up your password in under a minute.',
    tag: 'STUDENT REGISTRATION',
    icon: UserPlusIcon,
    color: 'sky',
    bgGradient: 'from-sky-500/20 to-blue-600/10',
    iconBg: 'bg-sky-500/15',
    iconColor: 'text-sky-400',
    borderHover: 'hover:border-sky-500/40'
  },
  {
    number: 2,
    title: 'Log In Securely',
    quote: 'This tech has completely streamlined our daily tasks and sign-in verification.',
    description:
      'Role-based access ensures students, staff, and admins see exactly what they need.',
    tag: 'ROLE AUTHENTICATION',
    icon: LogInIcon,
    color: 'cyan',
    bgGradient: 'from-cyan-500/20 to-cyan-600/10',
    iconBg: 'bg-cyan-500/15',
    iconColor: 'text-cyan-400',
    borderHover: 'hover:border-cyan-500/40'
  },
  {
    number: 3,
    title: 'Access Your Dashboard',
    quote: 'Real-time dashboard provides complete clarity on all active reports and actions.',
    description:
      'View your personalized dashboard with all your concerns, notifications, and quick actions.',
    tag: 'SMART DASHBOARD',
    icon: LayoutDashboardIcon,
    color: 'blue',
    bgGradient: 'from-blue-500/20 to-blue-600/10',
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    borderHover: 'hover:border-blue-500/40'
  },
  {
    number: 4,
    title: 'Submit a Concern',
    quote: 'It makes filing requests so much easier. Smart templates eliminate guesswork!',
    description:
      'Fill out a smart template form tailored to your concern type with evidence verification.',
    tag: 'FORM SUBMISSION',
    icon: FileEditIcon,
    color: 'indigo',
    bgGradient: 'from-indigo-500/20 to-indigo-600/10',
    iconBg: 'bg-indigo-500/15',
    iconColor: 'text-indigo-400',
    borderHover: 'hover:border-indigo-500/40'
  },
  {
    number: 5,
    title: 'Auto-Routed to Office',
    quote: 'Fast, reliable routing directly to the right department. Exactly what I needed.',
    description:
      'Your concern is automatically sent to the right department — no guesswork, no delays.',
    tag: 'CAMPUS ROUTING',
    icon: SearchIcon,
    color: 'emerald',
    bgGradient: 'from-emerald-500/20 to-emerald-600/10',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    borderHover: 'hover:border-emerald-500/40'
  },
  {
    number: 6,
    title: 'Track Live Progress',
    quote: "I can't imagine my workflow without it now. Transparent and simply amazing!",
    description:
      'Monitor real-time status updates and track review stages with immediate notifications.',
    tag: 'LIVE RESOLUTION',
    icon: CheckCircle2Icon,
    color: 'teal',
    bgGradient: 'from-teal-500/20 to-teal-600/10',
    iconBg: 'bg-teal-500/15',
    iconColor: 'text-teal-400',
    borderHover: 'hover:border-teal-500/40'
  },
  {
    number: 7,
    title: 'Official Resolution',
    quote: 'Service is a game changer! Quick official closures and verified department feedback.',
    description:
      'Receive official sign-offs, closure summaries, and service ratings once your issue is resolved.',
    tag: 'CLOSURE & FEEDBACK',
    icon: BellRingIcon,
    color: 'sky',
    bgGradient: 'from-sky-500/20 to-blue-600/10',
    iconBg: 'bg-sky-500/15',
    iconColor: 'text-sky-400',
    borderHover: 'hover:border-sky-500/40'
  }
];

const MARQUEE = [
  'Registrar',
  'OSA',
  'CITE',
  'Guidance',
  'Library',
  'Academic Affairs',
  'Cashier',
  'Clinic',
  'Registrar',
  'OSA',
  'CITE',
  'Guidance',
  'Library',
  'Academic Affairs',
  'Cashier',
  'Clinic'
];

function HeroCards() {
  return (
    <div className="relative mt-auto flex-1 min-h-[240px] sm:min-h-[300px] lg:min-h-[340px] perspective-[1200px]">
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-center gap-2 sm:gap-3 lg:gap-4 px-2">
        <div
          className="landing-float-card hidden sm:block w-[110px] lg:w-[140px] p-3 lg:p-4 shrink-0"
          style={{ transform: 'rotate(-16deg) translateY(18px)' }}
        >
          <p className="text-[10px] font-semibold mb-2" style={{ color: 'var(--landing-card-muted)' }}>Templates</p>
          <div className="h-16 lg:h-20 rounded-lg overflow-hidden flex items-end gap-1 px-2 pb-2" style={{ background: 'color-mix(in srgb, var(--landing-accent) 12%, var(--landing-card))' }}>
            {[40, 70, 55, 88, 62].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-sky-400/80"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <p className="mt-2 text-[11px] font-semibold">Smart forms</p>
        </div>

        <div
          className="landing-float-card w-[130px] sm:w-[150px] lg:w-[180px] shrink-0"
          style={{ transform: 'rotate(-8deg) translateY(12px)' }}
        >
          <img
            src="/pasted-image.jpg"
            alt="CITE students"
            className="h-28 sm:h-36 lg:h-40 w-full object-cover"
          />
          <div className="px-3 py-2">
            <p className="text-[11px] font-semibold leading-tight">Heard in every decision</p>
          </div>
        </div>

        <div
          className="landing-float-card w-[140px] sm:w-[170px] lg:w-[200px] p-3 lg:p-4 shrink-0"
          style={{ transform: 'rotate(-2deg) translateY(0)' }}
        >
          <p className="text-[10px] font-semibold" style={{ color: 'var(--landing-card-muted)' }}>Resolution</p>
          <p className="text-xl lg:text-2xl font-bold mt-1">↑ 2,670</p>
          <p className="text-[10px]" style={{ color: 'var(--landing-card-muted)' }}>concerns tracked</p>
          <div className="mt-3 h-12 flex items-end gap-1">
            {[30, 45, 38, 72, 60, 90, 78].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-sky-500"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        <div
          className="landing-float-card landing-float-card--dark hidden md:block w-[160px] lg:w-[190px] p-4 shrink-0"
          style={{ transform: 'rotate(4deg) translateY(6px)' }}
        >
          <p className="text-[10px] font-semibold text-sky-200/80 mb-2">Auto routing</p>
          <p className="text-sm font-bold leading-snug">
            Expertise that combines process, data, and campus care.
          </p>
        </div>

        <div
          className="landing-float-card landing-float-card--lime hidden sm:block w-[130px] lg:w-[160px] p-4 shrink-0"
          style={{ transform: 'rotate(10deg) translateY(18px)' }}
        >
          <p className="text-[10px] font-semibold mb-1">Departments</p>
          <p className="text-2xl font-extrabold">12+</p>
          <p className="text-[11px] mt-1 leading-snug">Ready to receive the right concern.</p>
        </div>

        <div
          className="landing-float-card hidden lg:block w-[140px] p-4 shrink-0"
          style={{ transform: 'rotate(16deg) translateY(20px)' }}
        >
          <p className="text-[10px] font-semibold" style={{ color: 'var(--landing-card-muted)' }}>Resolved</p>
          <p className="text-2xl font-extrabold mt-1">92%</p>
          <div className="mt-3 h-2 rounded-full" style={{ background: 'color-mix(in srgb, var(--landing-card-muted) 25%, transparent)' }}>
            <div className="h-2 w-[92%] rounded-full bg-sky-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !contactForm.name.trim() ||
      !contactForm.email.trim() ||
      !contactForm.subject.trim() ||
      !contactForm.message.trim()
    ) {
      toast.error('Please fill in all contact fields.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactForm.email.trim())) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiJson('/api/contact', {
        method: 'POST',
        body: JSON.stringify(contactForm)
      });
      setSubmittedSuccess(true);
      toast.success('Your message has been sent to CITE Administration!');
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      toast.error(
        err?.message || 'Failed to send message. Please try again or email us directly.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText('rcllanto@nemsu.edu.ph');
    setCopiedEmail(true);
    toast.success('Copied rcllanto@nemsu.edu.ph to clipboard!');
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="landing-page min-h-screen selection:bg-sky-500/30">
      <Navbar user={null} onNavigate={onNavigate} />

      <main>
        <section id="home" className="relative h-[100dvh] w-full overflow-hidden p-0 m-0">
          <div className="landing-sky px-5 sm:px-10 lg:px-16 pt-24 sm:pt-28 lg:pt-32 pb-6 sm:pb-8">
            <div className="relative z-10 text-center landing-sky-fg shrink-0">
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-semibold tracking-tight mb-4 sm:mb-5 leading-[1.12]">
                Simplifying Student
                <br />
                Concerns with{' '}
                <span className="italic font-normal">one click</span>
              </h1>
              <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg mb-7 sm:mb-9 leading-relaxed px-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Eliminate the traditional "pasa-pasahan" process. Submit
                complaints, requests, and suggestions digitally with smart routing
                and real-time tracking.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4 sm:px-0">
                <a
                  href="#how-it-works"
                  className="landing-cta-ghost w-full sm:w-auto px-6 py-2.5 text-sm inline-flex items-center justify-center"
                >
                  View how it works
                </a>
                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  className="landing-cta-lime w-full sm:w-auto px-6 py-2.5 text-sm inline-flex items-center justify-center gap-2"
                >
                  Get Started
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <HeroCards />
            <div className="landing-sky-fg relative z-10 mt-3 sm:mt-4 flex items-center justify-center gap-2 text-xs sm:text-sm shrink-0">
              <span>Built for NEMSU CITE</span>
              <span className="flex">
                {[0, 1, 2, 3, 4].map((i) => (
                  <StarIcon key={i} className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                ))}
              </span>
            </div>
          </div>
        </section>

        <div className="landing-marquee py-6 sm:py-8">
          <div className="landing-marquee-track">
            {MARQUEE.map((item, i) => (
              <span key={`${item}-${i}`} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400/70" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <section id="about" className="py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center mb-10 sm:mb-14">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--text-muted)] mb-4">
              About us
            </p>
            <h2 className="text-2xl sm:text-4xl md:text-[2.6rem] font-semibold text-[var(--text-primary)] leading-tight tracking-tight">
              A campus platform dedicated to building
              <span className="landing-dot-blue" />
              smarter routing and
              <span className="landing-dot-lime" />
              more transparent concern resolution
            </h2>
          </div>

          <div
            id="features"
            className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4"
          >
            <div className="landing-bento md:col-span-1 min-h-[280px] relative bg-[#1d6db8]">
              <img
                src="/pasted-image.jpg"
                alt="CITE community"
                className="absolute inset-0 w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f3868]/90 via-transparent to-transparent" />
              <div className="landing-on-media relative z-10 h-full flex flex-col justify-between p-5 sm:p-6">
                <p className="text-xs font-semibold tracking-wide uppercase opacity-90">CITE</p>
                <div>
                  <p className="text-4xl font-semibold">1 campus</p>
                  <p className="text-sm mt-1 opacity-90">
                    Bridging students and administration at NEMSU Tandag.
                  </p>
                </div>
              </div>
            </div>

            <div className="landing-bento bg-[var(--bg-tertiary)] p-6 sm:p-8 flex flex-col justify-between min-h-[280px]">
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                Commitment to measurable routing
              </p>
              <div>
                <p className="text-6xl sm:text-7xl font-semibold text-[var(--text-primary)] tracking-tight">
                  100%
                </p>
                <p className="text-sm text-[var(--text-secondary)] mt-3">
                  Every concern is sent to the right department — no more
                  pasa-pasahan.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="landing-bento landing-bento-lime p-6 flex-1">
                <p className="text-sm font-medium">Smart templates</p>
                <p className="text-4xl font-semibold mt-3">4+</p>
                <p className="text-sm mt-2 opacity-80">
                  Digital forms tailored so you never guess what to attach.
                </p>
              </div>
              <div className="landing-bento landing-bento-ink landing-on-media p-6 flex items-end justify-between">
                <div>
                  <p className="text-sm opacity-70">Live tracking</p>
                  <p className="text-lg font-semibold mt-1">Pending → Resolved</p>
                </div>
                <ActivityIcon className="h-6 w-6" style={{ color: 'var(--landing-cta-bg)' }} />
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 pb-6">
          <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                icon: FileTextIcon,
                title: 'Smart Templates',
                body: 'Pre-made digital forms for specific concerns.'
              },
              {
                icon: ArrowRightLeftIcon,
                title: 'Auto Routing',
                body: 'Sent to the correct department automatically.'
              },
              {
                icon: ActivityIcon,
                title: 'Real-time Tracking',
                body: 'Follow status from pending to resolved.'
              },
              {
                icon: BellRingIcon,
                title: 'Instant Notifications',
                body: 'Alerts on updates, comments, and resolution.'
              }
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--glass-bg)] p-5 sm:p-6"
              >
                <item.icon className="h-5 w-5 mb-3" style={{ color: 'var(--landing-accent)' }} />
                <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="how-it-works"
          className="w-full py-16 sm:py-24 relative overflow-hidden px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto w-full relative z-10">
            <HowItWorksCarousel steps={HOW_IT_WORKS_STEPS} />
          </div>
        </section>

        <section id="contact" className="py-12 sm:py-16 lg:py-24 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16 max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[var(--text-primary)] mb-3 sm:mb-4 tracking-tight">
                Get in Touch
              </h2>
              <p className="text-[var(--text-secondary)] text-base sm:text-lg px-1 leading-relaxed">
                Have questions or need assistance? Our support team is here to
                help.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-stretch">
              {/* Left Contact Methods */}
              <div className="space-y-3 sm:space-y-4 order-2 lg:order-1">
                {/* Visit Us - Google Maps */}
                <a
                  href="https://www.google.com/maps/search/?api=1&query=NEMSU+Tandag+Campus"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-[var(--border-color)] bg-[var(--glass-bg)] p-5 sm:p-6 flex items-start gap-3 sm:gap-4 hover:border-sky-500/50 hover:shadow-md transition-all group cursor-pointer block"
                >
                  <div
                    className="p-2.5 rounded-xl shrink-0 group-hover:scale-105 transition-transform"
                    style={{
                      background: 'color-mix(in srgb, var(--landing-accent) 14%, transparent)',
                      color: 'var(--landing-accent)'
                    }}
                  >
                    <MapPinIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">
                        Visit Us
                      </h3>
                      <span className="text-[11px] font-medium text-sky-500 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        View Map <ArrowRightIcon className="h-3 w-3" />
                      </span>
                    </div>
                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                      NEMSU Tandag Campus
                      <br />
                      CITE Building Office
                    </p>
                  </div>
                </a>

                {/* Email Us - Mailto & Copy */}
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--glass-bg)] p-5 sm:p-6 flex items-start gap-3 sm:gap-4 hover:border-sky-500/50 hover:shadow-md transition-all group">
                  <a
                    href="mailto:rcllanto@nemsu.edu.ph?subject=CITEzen%20Inquiry"
                    className="p-2.5 rounded-xl shrink-0 group-hover:scale-105 transition-transform cursor-pointer"
                    style={{
                      background: 'color-mix(in srgb, var(--landing-accent) 14%, transparent)',
                      color: 'var(--landing-accent)'
                    }}
                    title="Send Email"
                  >
                    <MailIcon className="h-5 w-5" />
                  </a>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">
                        Email Us
                      </h3>
                      <button
                        type="button"
                        onClick={handleCopyEmail}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-lg border border-[var(--border-color)] hover:border-sky-500/60 text-[var(--text-secondary)] hover:text-sky-500 transition-all flex items-center gap-1 active:scale-95"
                        title="Copy to clipboard"
                      >
                        {copiedEmail ? (
                          <>
                            <CheckIcon className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-500 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <CopyIcon className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <a
                      href="mailto:rcllanto@nemsu.edu.ph?subject=CITEzen%20Inquiry"
                      className="text-[var(--text-secondary)] hover:text-sky-500 text-sm break-all transition-colors inline-block"
                    >
                      rcllanto@nemsu.edu.ph
                    </a>
                  </div>
                </div>

                {/* Call Us - Dial Link */}
                <a
                  href="tel:+639453477555"
                  className="rounded-2xl border border-[var(--border-color)] bg-[var(--glass-bg)] p-5 sm:p-6 flex items-start gap-3 sm:gap-4 hover:border-sky-500/50 hover:shadow-md transition-all group cursor-pointer block"
                >
                  <div
                    className="p-2.5 rounded-xl shrink-0 group-hover:scale-105 transition-transform"
                    style={{
                      background: 'color-mix(in srgb, var(--landing-accent) 14%, transparent)',
                      color: 'var(--landing-accent)'
                    }}
                  >
                    <PhoneIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">
                        Call Us
                      </h3>
                      <span className="text-[11px] font-medium text-sky-500 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        Call Now <ArrowRightIcon className="h-3 w-3" />
                      </span>
                    </div>
                    <p className="text-[var(--text-secondary)] text-sm">
                      (945) 347-7555
                      <br />
                      Mon-Fri, 7:30 AM - 5:00 PM
                    </p>
                  </div>
                </a>
              </div>

              {/* Right Send Message Form */}
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--glass-bg)] p-5 sm:p-7 order-1 lg:order-2 h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-5 flex items-center gap-2.5">
                    <span
                      className="flex h-10 w-10 rounded-xl items-center justify-center"
                      style={{
                        background: 'color-mix(in srgb, var(--landing-accent) 14%, transparent)',
                        color: 'var(--landing-accent)'
                      }}
                    >
                      <MessageSquareIcon className="h-5 w-5" />
                    </span>
                    Send a Message
                  </h3>

                  {submittedSuccess ? (
                    <div className="py-8 px-4 text-center space-y-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 my-auto">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                        <CheckCircle2Icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base sm:text-lg font-bold text-emerald-950 dark:text-white">
                          Message Sent Successfully!
                        </h4>
                        <p className="text-xs sm:text-sm text-emerald-900/80 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
                          Thank you for reaching out. Your inquiry has been routed to the CITE Administration, and we will get back to you shortly.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSubmittedSuccess(false)}
                        className="landing-cta-lime px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <SendIcon className="h-3.5 w-3.5" />
                        <span>Send Another Message</span>
                      </button>
                    </div>
                  ) : (
                    <form
                      className="space-y-4 flex-1 flex flex-col"
                      onSubmit={handleContactSubmit}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="citezen-label" htmlFor="contact-name">
                            Your Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="contact-name"
                            type="text"
                            required
                            autoComplete="name"
                            value={contactForm.name}
                            onChange={(e) =>
                              setContactForm((prev) => ({ ...prev, name: e.target.value }))
                            }
                            className="citezen-input"
                            placeholder="Enter your name"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="citezen-label" htmlFor="contact-email">
                            Email Address <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="contact-email"
                            type="email"
                            required
                            autoComplete="email"
                            value={contactForm.email}
                            onChange={(e) =>
                              setContactForm((prev) => ({ ...prev, email: e.target.value }))
                            }
                            className="citezen-input"
                            placeholder="example@nemsu.edu.ph"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="citezen-label" htmlFor="contact-subject">
                          Subject <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="contact-subject"
                          type="text"
                          required
                          value={contactForm.subject}
                          onChange={(e) =>
                            setContactForm((prev) => ({ ...prev, subject: e.target.value }))
                          }
                          className="citezen-input"
                          placeholder="How can we help?"
                        />
                      </div>
                      <div className="space-y-1.5 flex-1 flex flex-col">
                        <label className="citezen-label" htmlFor="contact-message">
                          Message <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          id="contact-message"
                          required
                          rows={5}
                          value={contactForm.message}
                          onChange={(e) =>
                            setContactForm((prev) => ({ ...prev, message: e.target.value }))
                          }
                          className="citezen-input citezen-textarea flex-1 min-h-[140px]"
                          placeholder="Write your message here..."
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="landing-cta-lime w-full min-h-[48px] py-3 px-4 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60 transition-all cursor-pointer active:scale-[0.99]"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2Icon className="h-4 w-4 animate-spin" />
                            <span>Sending Message...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Message</span>
                            <SendIcon className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border-color)] pt-8 sm:pt-12 pb-6 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 sm:gap-6 mb-6 sm:mb-8 md:flex-row md:justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/citezen.png?v=2"
                alt="CITEzen Logo"
                className="h-8 w-8 object-cover rounded-full"
              />
              <span className="text-xl font-bold text-[var(--text-primary)]">
                CITE<span className="text-gradient">zen</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-[var(--text-secondary)]">
              <a href="#home" className="hover:text-sky-500 transition-colors">
                Home
              </a>
              <a href="#features" className="hover:text-sky-500 transition-colors">
                Features
              </a>
              <a href="#about" className="hover:text-sky-500 transition-colors">
                About
              </a>
              <a href="#contact" className="hover:text-sky-500 transition-colors">
                Contact
              </a>
            </div>
          </div>
          <div className="pt-4 sm:pt-6 border-t border-[var(--border-color)] flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-xs sm:text-sm text-[var(--text-muted)] text-center">
              © {new Date().getFullYear()} CITEzen Student Concern Management
              System. All rights reserved.
            </p>
            <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm text-[var(--text-muted)]">
              <a href="#" className="hover:text-[var(--text-primary)] transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-[var(--text-primary)] transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
