import { Navbar } from '../components/Navbar';
import { HowItWorksCarousel } from '../components/HowItWorksCarousel';
import { FeatureCard } from '../components/FeatureCard';
import {
  FileTextIcon,
  ArrowRightLeftIcon,
  ActivityIcon,
  BellRingIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  UsersIcon,
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
  CheckCircle2Icon } from
'lucide-react';
interface LandingPageProps {
  onNavigate: (page: string) => void;
}
const HOW_IT_WORKS_STEPS = [
{
  number: 1,
  title: 'Create Your Account',
  description:
  'Register using your Student ID and set up your password. Quick and easy — takes less than a minute.',
  icon: UserPlusIcon,
  color: 'purple',
  bgGradient: 'from-purple-500/20 to-purple-600/10',
  iconBg: 'bg-purple-500/15',
  iconColor: 'text-purple-400',
  borderHover: 'hover:border-purple-500/40'
},
{
  number: 2,
  title: 'Log In Securely',
  description:
  'Sign in with your credentials. Role-based access ensures you see exactly what you need.',
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
  description:
  'View your personalized dashboard with all your concerns, notifications, and quick actions.',
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
  description:
  'Fill out a smart template form tailored to your concern type. Attach files if needed.',
  icon: FileEditIcon,
  color: 'indigo',
  bgGradient: 'from-indigo-500/20 to-indigo-600/10',
  iconBg: 'bg-indigo-500/15',
  iconColor: 'text-indigo-400',
  borderHover: 'hover:border-indigo-500/40'
},
{
  number: 5,
  title: 'Auto-Routed to Department',
  description:
  'Your concern is automatically sent to the right department. No guesswork, no delays.',
  icon: SearchIcon,
  color: 'emerald',
  bgGradient: 'from-emerald-500/20 to-emerald-600/10',
  iconBg: 'bg-emerald-500/15',
  iconColor: 'text-emerald-400',
  borderHover: 'hover:border-emerald-500/40'
},
{
  number: 6,
  title: 'Track & Resolve',
  description:
  'Monitor real-time status updates and get notified when your concern is resolved.',
  icon: CheckCircle2Icon,
  color: 'teal',
  bgGradient: 'from-teal-500/20 to-teal-600/10',
  iconBg: 'bg-teal-500/15',
  iconColor: 'text-teal-400',
  borderHover: 'hover:border-teal-500/40'
}];

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-dark-900 text-gray-200 selection:bg-purple-500/30 pt-16">
      <Navbar user={null} onNavigate={onNavigate} />

      <main>
        {/* ===== HERO SECTION (Static, Clean) ===== */}
        <section
          id="home"
          className="relative pt-16 pb-20 sm:pt-20 sm:pb-28 lg:pt-36 lg:pb-48 overflow-hidden">
          
          {/* Background Effects */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[1000px] h-[300px] sm:h-[500px] opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500 to-transparent blur-[100px] rounded-full" />
          </div>
          <div className="absolute top-1/4 -left-32 sm:-left-64 w-48 sm:w-96 h-48 sm:h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 -right-32 sm:-right-64 w-48 sm:w-96 h-48 sm:h-96 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-4 sm:mb-6 animate-slide-up leading-tight">
              Simplifying Student
              <br className="hidden sm:block" />
              Concerns <span className="text-gradient">One Click Away</span>
            </h1>

            <p className="mt-3 sm:mt-4 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-gray-400 mb-8 sm:mb-12 animate-slide-up delay-100 leading-relaxed px-2">
              Eliminate the traditional "pasa-pasahan" process. Submit
              complaints, requests, and suggestions digitally with smart routing
              and real-time tracking.
            </p>

            <div className="flex items-center justify-center animate-slide-up delay-200 px-4 sm:px-0">
              <button
                onClick={() => onNavigate('register')}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-base sm:text-lg shadow-[0_0_40px_rgba(139,92,246,0.3)] hover:shadow-[0_0_60px_rgba(139,92,246,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2">
                
                Get Started <ArrowRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        </section>

        {/* ===== FEATURES SECTION ===== */}
        <section
          id="features"
          className="py-16 sm:py-20 lg:py-24 bg-dark-800/50 relative border-y border-white/5">
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                Everything you need to be heard
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-base sm:text-lg px-2">
                A premium platform designed to make concern resolution fast,
                transparent, and hassle-free.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <FeatureCard
                icon={FileTextIcon}
                title="Smart Templates"
                description="Pre-made digital forms tailored for specific concerns. No more guessing what information is needed."
                delay={0} />
              
              <FeatureCard
                icon={ArrowRightLeftIcon}
                title="Auto Routing"
                description="Concerns are automatically sent to the correct department based on category. Zero confusion."
                delay={100} />
              
              <FeatureCard
                icon={ActivityIcon}
                title="Real-time Tracking"
                description="Monitor the status of your concern from pending to resolved. Full transparency at every step."
                delay={200} />
              
              <FeatureCard
                icon={BellRingIcon}
                title="Instant Notifications"
                description="Get alerted immediately when there's an update, comment, or resolution to your concern."
                delay={300} />
              
            </div>
          </div>
        </section>

        {/* ===== HOW CITEZEN WORKS — CAROUSEL ===== */}
        <section className="py-16 sm:py-20 lg:py-24 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 tracking-tight">
                How CITEzen Works
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-base sm:text-lg px-2 leading-relaxed">
                A streamlined process from registration to resolution — in just
                6 simple steps. Swipe on mobile, use arrows or dots on any device.
              </p>
            </div>

            <HowItWorksCarousel steps={HOW_IT_WORKS_STEPS} />
          </div>
        </section>

        {/* ===== ABOUT SECTION ===== */}
        <section
          id="about"
          className="py-16 sm:py-20 lg:py-24 bg-dark-800/50 relative border-y border-white/5">
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-0 lg:hidden">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                About CITEzen
              </h2>
            </div>
            <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-10 lg:gap-12">
              <div className="flex-1 space-y-4 sm:space-y-6 order-2 lg:order-1">
                <h2 className="hidden lg:block text-3xl md:text-4xl font-bold text-white">
                  About CITEzen
                </h2>
                <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
                  CITEzen was developed to bridge the gap between students and
                  the administration. We understand that navigating university
                  processes can sometimes be confusing and time-consuming.
                </p>
                <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
                  Our mission is to provide a centralized, transparent, and
                  efficient platform where every student's voice is heard and
                  every concern is addressed promptly by the right department.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2 sm:pt-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <ShieldCheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400 shrink-0" />
                    <span className="text-gray-300 text-sm sm:text-base font-medium">
                      Secure & Confidential
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400 shrink-0" />
                    <span className="text-gray-300 text-sm sm:text-base font-medium">
                      Student-Centric
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex-1 w-full max-w-full sm:max-w-md lg:max-w-none relative order-1 lg:order-2">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 rounded-3xl blur-2xl" />
                <div className="glass-panel p-1.5 sm:p-2 md:p-3 relative z-10 rounded-xl sm:rounded-2xl overflow-hidden">
                  <img
                    src="/pasted-image.jpg"
                    alt="NEMSU Association of Computer Science Students"
                    className="w-full h-auto rounded-lg sm:rounded-xl object-cover aspect-video" />
                  
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CONTACT SECTION ===== */}
        <section
          id="contact"
          className="py-12 sm:py-16 lg:py-24 relative bg-dark-800/30 border-t border-white/5">
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16 max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 tracking-tight">
                Get in Touch
              </h2>
              <p className="text-gray-400 text-base sm:text-lg px-1 leading-relaxed">
                Have questions or need assistance? Our support team is here to
                help.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 xl:gap-14 items-stretch">
              {/* Contact Info */}
              <div className="space-y-3 sm:space-y-5 order-2 lg:order-1">
                <div className="glass-panel p-4 sm:p-6 md:p-7 flex items-start gap-3 sm:gap-4 rounded-2xl hover:border-purple-500/30 transition-colors duration-300">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                    <MapPinIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                      Visit Us
                    </h3>
                    <p className="text-gray-400 text-sm sm:text-base">
                      NEMSU Tandag Campus
                      <br />
                      CITE Building Office
                    </p>
                  </div>
                </div>

                <div className="glass-panel p-4 sm:p-6 md:p-7 flex items-start gap-3 sm:gap-4 rounded-2xl hover:border-cyan-500/30 transition-colors duration-300">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
                    <MailIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                      Email Us
                    </h3>
                    <p className="text-gray-400 text-sm sm:text-base break-all sm:break-normal">
                      rcllanto@.nemsu.edu.ph
                      <br />
                      admin@nemsu.edu.ph
                    </p>
                  </div>
                </div>

                <div className="glass-panel p-4 sm:p-6 md:p-7 flex items-start gap-3 sm:gap-4 rounded-2xl hover:border-emerald-500/30 transition-colors duration-300">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <PhoneIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                      Call Us
                    </h3>
                    <p className="text-gray-400 text-sm sm:text-base">
                      (945) 347-7555
                      <br />
                      Mon-Fri, 7:30 AM - 5:00 PM
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="glass-panel p-4 sm:p-6 md:p-8 rounded-2xl order-1 lg:order-2 h-full flex flex-col">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-5 sm:mb-6 flex items-center gap-2.5">
                  <span className="flex h-10 w-10 rounded-xl bg-purple-500/15 items-center justify-center border border-purple-500/25">
                    <MessageSquareIcon className="h-5 w-5 text-purple-400" />
                  </span>
                  Send a Message
                </h3>
                <form
                  className="space-y-4 sm:space-y-5 flex-1 flex flex-col"
                  onSubmit={(e) => e.preventDefault()}>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="space-y-1.5">
                      <label className="citezen-label" htmlFor="contact-name">
                        Your Name
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        autoComplete="name"
                        className="citezen-input"
                        placeholder="Enter your name" />
                      
                    </div>
                    <div className="space-y-1.5">
                      <label className="citezen-label" htmlFor="contact-email">
                        Email Address
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        autoComplete="email"
                        className="citezen-input"
                        placeholder="john@example.com" />
                      
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="citezen-label" htmlFor="contact-subject">
                      Subject
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      className="citezen-input"
                      placeholder="How can we help?" />
                    
                  </div>
                  <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
                    <label className="citezen-label" htmlFor="contact-message">
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      className="citezen-input citezen-textarea flex-1 min-h-[140px]"
                      placeholder="Write your message here..." />
                    
                  </div>
                  <button
                    type="button"
                    className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm sm:text-base font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 group active:scale-[0.99] touch-manipulation">
                    
                    Send Message{' '}
                    <SendIcon className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/10 bg-dark-900 pt-8 sm:pt-12 pb-6 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 sm:gap-6 mb-6 sm:mb-8 md:flex-row md:justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/Gemini_Generated_Image_u7mgetu7mgetu7mg.png"
                alt="CITEzen Logo"
                className="h-8 w-8 object-cover rounded-full border border-white/10" />
              
              <span className="text-xl font-bold text-white">
                CITE<span className="text-gradient">zen</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-gray-400">
              <a
                href="#home"
                className="hover:text-purple-400 transition-colors">
                
                Home
              </a>
              <a
                href="#features"
                className="hover:text-purple-400 transition-colors">
                
                Features
              </a>
              <a
                href="#about"
                className="hover:text-purple-400 transition-colors">
                
                About
              </a>
              <a
                href="#contact"
                className="hover:text-purple-400 transition-colors">
                
                Contact
              </a>
            </div>
          </div>

          <div className="pt-4 sm:pt-6 border-t border-white/10 flex flex-col items-center gap-3 sm:gap-4 sm:flex-row sm:justify-between">
            <p className="text-xs sm:text-sm text-gray-500 text-center">
              © {new Date().getFullYear()} CITEzen Student Concern Management
              System. All rights reserved.
            </p>
            <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>);

}