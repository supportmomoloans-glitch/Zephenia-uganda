import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import Footer from '../components/Footer';
import PageLoader from '../components/PageLoader';
import { getSession, getApplication, clearSession, clearApplication, MoMoSession, LoanApplication } from '../lib/session';
import { lugandaWords } from '../data/lugandaWords';
import {
  Shield,
  Clock,
  Smartphone,
  CheckCircle2,
  LogOut,
  FileText,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Percent,
  Search,
  LogIn,
  UserPlus,
  Building2,
  CreditCard
} from 'lucide-react';

function LoggedInHome({
  session,
  application,
  onLogout,
}: {
  session: MoMoSession;
  application: LoanApplication | null;
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const [wordIndex, setWordIndex] = useState(() => Math.floor(Math.random() * lugandaWords.length));
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const t = setInterval(() => {
      setWordIndex((i) => (i + 1) % lugandaWords.length);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  const word = lugandaWords[wordIndex];

  const filteredWords = lugandaWords.filter(
    (w) =>
      w.luganda.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.english.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[hsl(220,50%,12%)] text-white flex flex-col">
      {/* Header */}
      <header className="bg-[#ffcc00] text-[hsl(220,50%,12%)] py-3 px-4 shadow-md sticky top-0 z-40">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <Logo size="sm" />
            <span className="font-extrabold text-lg sm:text-xl tracking-tight">
              MoMo <span className="font-normal opacity-90">Business Loans</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs font-semibold bg-[hsl(220,50%,12%)]/10 px-2.5 py-1 rounded-full">
              {session.countryCode} {session.phone}
            </span>
            <button
              id="logout-btn"
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-[hsl(220,50%,12%)] text-white px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-[hsl(220,50%,12%)]/90 transition shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto max-w-4xl px-4 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[hsl(220,50%,16%)] to-[hsl(220,40%,20%)] rounded-3xl p-6 sm:p-8 mb-8 border border-[hsl(220,30%,25%)] shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffcc00]/15 text-[#ffcc00] text-xs font-bold mb-3 border border-[#ffcc00]/25">
                <span>Verified MoMo Account</span>
                <span>•</span>
                <span>{session.country}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                Welcome back! 👋
              </h1>
              <p className="text-gray-300 text-sm sm:text-base font-medium">
                Registered Mobile: <span className="text-[#ffcc00] font-bold">{session.countryCode} {session.phone}</span>
              </p>
            </div>

            {!application ? (
              <button
                id="apply-top-btn"
                onClick={() => navigate('/apply')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#ffcc00] text-[hsl(220,50%,12%)] font-extrabold text-sm sm:text-base hover:bg-[#ffcc00]/90 transition shadow-lg flex items-center justify-center gap-2 group shrink-0"
              >
                <span>Apply for Loan</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Existing Application Card */}
        {application ? (
          <div id="application-status-card" className="bg-[hsl(220,50%,16%)] rounded-3xl p-6 sm:p-8 mb-8 border border-[hsl(220,30%,25%)] shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[hsl(220,30%,25%)]">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#ffcc00]/20 flex items-center justify-center text-[#ffcc00] shrink-0 border border-[#ffcc00]/30">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg sm:text-xl">Your Loan Application</h3>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    Submitted on {new Date(application.submittedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-[#ffcc00]/15 text-[#ffcc00] px-3.5 py-1.5 rounded-full border border-[#ffcc00]/30 w-fit">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffcc00] animate-pulse" />
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wide">Status: Under Review</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
              <div className="bg-[hsl(220,50%,12%)] rounded-2xl p-4 border border-[hsl(220,30%,20%)]">
                <p className="text-xs text-gray-400 font-medium mb-1">Requested Amount</p>
                <p className="font-extrabold text-base sm:text-lg text-[#ffcc00]">{application.amount}</p>
              </div>
              <div className="bg-[hsl(220,50%,12%)] rounded-2xl p-4 border border-[hsl(220,30%,20%)]">
                <p className="text-xs text-gray-400 font-medium mb-1">Repayment Period</p>
                <p className="font-bold text-sm sm:text-base text-white">{application.repayment}</p>
              </div>
              <div className="bg-[hsl(220,50%,12%)] rounded-2xl p-4 border border-[hsl(220,30%,20%)]">
                <p className="text-xs text-gray-400 font-medium mb-1">Loan Purpose</p>
                <p className="font-bold text-sm sm:text-base text-white truncate">{application.purpose}</p>
              </div>
              <div className="bg-[hsl(220,50%,12%)] rounded-2xl p-4 border border-[hsl(220,30%,20%)]">
                <p className="text-xs text-gray-400 font-medium mb-1">Applicant Name</p>
                <p className="font-bold text-sm sm:text-base text-white truncate">{application.firstName} {application.lastName}</p>
              </div>
            </div>

            <div className="bg-[hsl(220,50%,12%)] rounded-2xl p-4 border border-[hsl(220,30%,20%)] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-300">
                <Clock className="w-4 h-4 text-[#ffcc00] shrink-0" />
                <span>Our verification team reviews applications within 1 hour. You will receive an SMS and Mobile Money notification once approved.</span>
              </div>
              <button
                onClick={() => navigate('/apply')}
                className="text-xs font-bold text-[#ffcc00] hover:underline"
              >
                Submit another application
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[hsl(220,50%,16%)] rounded-3xl p-8 sm:p-10 mb-8 border border-[hsl(220,30%,25%)] text-center shadow-xl">
            <div className="w-16 h-16 rounded-3xl bg-[#ffcc00]/20 text-[#ffcc00] flex items-center justify-center mx-auto mb-4 border border-[#ffcc00]/30">
              <Smartphone className="w-8 h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold mb-2">Ready to grow your business?</h3>
            <p className="text-gray-300 text-sm sm:text-base max-w-md mx-auto mb-6 leading-relaxed">
              Apply for an instant Mobile Money business loan up to UGX 20,000,000 with flexible tenures from 1 to 12 months.
            </p>
            <button
              id="apply-main-btn"
              onClick={() => navigate('/apply')}
              className="px-8 py-3.5 rounded-2xl bg-[#ffcc00] text-[hsl(220,50%,12%)] font-extrabold text-base hover:bg-[#ffcc00]/90 transition shadow-lg inline-flex items-center gap-2"
            >
              <span>Apply Now</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Word of the Day Feature */}
        <div className="bg-[hsl(220,50%,16%)] rounded-3xl p-6 sm:p-8 border border-[hsl(220,30%,25%)] mb-8 shadow-xl">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-[#ffcc00]" />
              <h3 className="font-extrabold text-base sm:text-lg">Inspirational Thought of the Day</h3>
            </div>
            <span className="text-xs font-semibold text-gray-400 bg-[hsl(220,50%,12%)] px-3 py-1 rounded-full border border-[hsl(220,30%,25%)]">
              Luganda & English
            </span>
          </div>

          <div className="text-center py-6 px-4 bg-[hsl(220,50%,12%)] rounded-2xl border border-[hsl(220,30%,20%)] my-2">
            <p className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#ffcc00] mb-2 italic">
              "{word.luganda}"
            </p>
            <p className="text-gray-300 text-sm sm:text-base font-medium">
              — {word.english}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 mt-4 px-1">
            <span>Updates every few seconds</span>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === wordIndex % 5 ? 'w-6 bg-[#ffcc00]' : 'w-2 bg-[hsl(220,30%,25%)]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* All Encouraging Words List with Search */}
        <div className="bg-[hsl(220,50%,16%)] rounded-3xl p-6 sm:p-8 border border-[hsl(220,30%,25%)] mb-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl">
                🇺🇬 Ugandan Business Wisdom & Proverbs
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                Inspirational phrases in Luganda to empower your daily enterprise ({lugandaWords.length} sayings)
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Luganda / English..."
                className="w-full bg-[hsl(220,50%,12%)] border border-[hsl(220,30%,25%)] rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#ffcc00] transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {filteredWords.map((w, i) => (
              <div
                key={i}
                className="bg-[hsl(220,50%,12%)] rounded-2xl p-4 border border-[hsl(220,30%,20%)] hover:border-[#ffcc00]/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm sm:text-base font-bold text-[#ffcc00] leading-snug">{w.luganda}</p>
                  <span className="text-[10px] font-bold text-gray-400 bg-[hsl(220,50%,16%)] px-2 py-0.5 rounded-md border border-[hsl(220,30%,25%)]">Luganda</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-300 font-medium">{w.english}</p>
              </div>
            ))}
            {filteredWords.length === 0 && (
              <div className="col-span-full py-8 text-center text-gray-400 text-sm">
                No matching phrases found.
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [session, setSessionState] = useState<MoMoSession | null>(null);
  const [application, setAppState] = useState<LoanApplication | null>(null);

  // Loan calculator state on landing page (in UGX)
  const [calcAmount, setCalcAmount] = useState(1000000);
  const [calcMonths, setCalcMonths] = useState(6);

  useEffect(() => {
    setSessionState(getSession());
    setAppState(getApplication());
  }, []);

  const handleLogout = () => {
    clearSession();
    clearApplication();
    setSessionState(null);
    setAppState(null);
  };

  if (session?.loggedIn) {
    return (
      <PageLoader>
        <LoggedInHome session={session} application={application} onLogout={handleLogout} />
      </PageLoader>
    );
  }

  // Monthly interest estimate (e.g. 2.5% monthly)
  const monthlyRate = 0.025;
  const totalInterest = calcAmount * monthlyRate * calcMonths;
  const totalRepayment = calcAmount + totalInterest;
  const monthlyInstallment = Math.round(totalRepayment / calcMonths);

  return (
    <PageLoader>
      <div className="min-h-screen bg-[hsl(220,50%,12%)] text-white flex flex-col">
        {/* Top Announcement Bar */}
        <div className="bg-[#ffcc00] text-[hsl(220,50%,12%)] px-4 py-2 text-center text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2">
          <span>⚡ Instant MoMo Loans approved within minutes in Uganda · No paperwork required!</span>
        </div>

        {/* Navigation Bar */}
        <nav className="container mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <Logo size="sm" />
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight">
              MoMo <span className="text-[#ffcc00]">Business Loans</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
          </div>
        </nav>

        {/* Hero Section */}
        <section className="flex-1 container mx-auto max-w-6xl px-4 py-12 sm:py-16 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[hsl(220,50%,18%)] border border-[hsl(220,30%,28%)] text-xs sm:text-sm font-bold text-[#ffcc00] mb-6 shadow-sm">
            <Sparkles className="w-4 h-4" />
            <span>Fast & Affordable Mobile Money Financing in Uganda</span>
          </div>

          <Logo size="lg" className="mb-6 shadow-2xl" />

          <h1 className="text-4xl sm:5xl md:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight sm:leading-tight mb-6">
            Empower Your Business with Instant <span className="text-[#ffcc00]">MoMo Loans</span>
          </h1>

          <p className="text-gray-300 text-base sm:text-lg md:text-xl max-w-2xl mb-8 leading-relaxed font-medium">
            Get quick funding directly to your Mobile Money wallet in Uganda. Fast disbursements, transparent terms, and zero collateral required.
          </p>

          {/* Action Buttons */}
          <div className="flex justify-center mb-14 w-full sm:w-auto">
            <button
              id="hero-apply-btn"
              onClick={() => navigate('/apply')}
              className="w-full sm:w-auto px-10 py-4 rounded-full bg-[#ffcc00] text-[hsl(220,50%,12%)] font-extrabold text-base hover:bg-[#ffcc00]/90 transition shadow-2xl flex items-center justify-center gap-2 group"
            >
              <span>Apply for Loan</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Key Advantages 4-Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full max-w-5xl mb-16">
            {[
              { icon: Smartphone, title: 'Mobile Money', desc: 'Direct to your MoMo wallet' },
              { icon: Clock, title: 'Instant Approval', desc: 'Reviewed in minutes' },
              { icon: Shield, title: 'Safe & Secure', desc: 'Bank grade encryption' },
              { icon: CheckCircle2, title: 'No Paperwork', desc: '100% digital application' },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex flex-col items-center text-center p-5 sm:p-6 rounded-3xl bg-[hsl(220,50%,16%)] border border-[hsl(220,30%,25%)] shadow-lg hover:border-[#ffcc00]/40 transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#ffcc00]/15 flex items-center justify-center text-[#ffcc00] mb-3">
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-sm sm:text-base text-white mb-1">{title}</h4>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            ))}
          </div>

          {/* Interactive Loan Calculator Section */}
          <div className="w-full max-w-4xl bg-[hsl(220,50%,16%)] rounded-3xl p-6 sm:p-10 border border-[hsl(220,30%,25%)] shadow-2xl text-left mb-16">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[hsl(220,30%,25%)]">
              <div>
                <div className="flex items-center gap-2 text-[#ffcc00] text-xs font-bold uppercase tracking-wider mb-1">
                  <Percent className="w-4 h-4" />
                  <span>Calculator</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">Estimate Your Loan Repayment</h3>
              </div>
              <span className="text-xs text-gray-400 bg-[hsl(220,50%,12%)] px-3 py-1.5 rounded-xl border border-[hsl(220,30%,25%)] font-semibold">
                Transparent 2.5% monthly rate
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Controls */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center text-sm font-semibold mb-2">
                    <label className="text-gray-300">Loan Amount</label>
                    <span className="text-[#ffcc00] font-extrabold text-base">UGX {calcAmount.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="100000"
                    max="20000000"
                    step="100000"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Number(e.target.value))}
                    className="w-full h-2 bg-[hsl(220,50%,12%)] rounded-lg appearance-none cursor-pointer accent-[#ffcc00]"
                  />
                  <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                    <span>UGX 100,000</span>
                    <span>UGX 20,000,000</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-sm font-semibold mb-2">
                    <label className="text-gray-300">Repayment Tenure</label>
                    <span className="text-[#ffcc00] font-extrabold text-base">{calcMonths} Month{calcMonths > 1 ? 's' : ''}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 3, 6, 12].map((m) => (
                      <button
                        key={m}
                        onClick={() => setCalcMonths(m)}
                        className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                          calcMonths === m
                            ? 'bg-[#ffcc00] text-[hsl(220,50%,12%)] shadow-md'
                            : 'bg-[hsl(220,50%,12%)] text-gray-300 hover:text-white border border-[hsl(220,30%,25%)]'
                        }`}
                      >
                        {m} Mo
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Output Display Card */}
              <div className="bg-[hsl(220,50%,12%)] rounded-2xl p-6 border border-[hsl(220,30%,20%)] space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-[hsl(220,30%,20%)]">
                  <span className="text-xs text-gray-400">Monthly Installment</span>
                  <span className="text-lg sm:text-xl font-extrabold text-[#ffcc00]">
                    UGX {monthlyInstallment.toLocaleString()} / mo
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>Principal Amount</span>
                  <span className="font-bold text-white">UGX {calcAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>Estimated Total Interest</span>
                  <span className="font-bold text-white">UGX {Math.round(totalInterest).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-[hsl(220,30%,20%)]">
                  <span className="text-xs font-bold text-white">Total Amount Due</span>
                  <span className="text-base font-extrabold text-[#ffcc00]">
                    UGX {Math.round(totalRepayment).toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() =>
                    navigate('/apply', {
                      state: {
                        amount: `UGX ${calcAmount.toLocaleString()}`,
                        repayment: `${calcMonths} Month${calcMonths > 1 ? 's' : ''}`,
                      },
                    })
                  }
                  className="w-full py-3 rounded-xl bg-[#ffcc00] text-[hsl(220,50%,12%)] font-extrabold text-sm hover:bg-[#ffcc00]/90 transition shadow-md mt-2 block text-center"
                >
                  Apply for UGX {calcAmount.toLocaleString()}
                </button>
              </div>
            </div>
          </div>

          {/* Simple 3-step guide */}
          <div className="w-full max-w-5xl mb-8">
            <h3 className="text-2xl font-extrabold mb-8 text-white">How It Works in 3 Simple Steps</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-[hsl(220,50%,16%)] p-6 rounded-3xl border border-[hsl(220,30%,25%)]">
                <div className="w-10 h-10 rounded-xl bg-[#ffcc00] text-[hsl(220,50%,12%)] font-black text-lg flex items-center justify-center mb-4">
                  1
                </div>
                <h4 className="font-bold text-base text-white mb-1">Apply for Your Loan</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Select your desired loan amount in UGX, choose flexible repayment duration, and enter your personal details.
                </p>
              </div>

              <div className="bg-[hsl(220,50%,16%)] p-6 rounded-3xl border border-[hsl(220,30%,25%)]">
                <div className="w-10 h-10 rounded-xl bg-[#ffcc00] text-[hsl(220,50%,12%)] font-black text-lg flex items-center justify-center mb-4">
                  2
                </div>
                <h4 className="font-bold text-base text-white mb-1">Sign Up & Verify MoMo</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Authenticate your registered Mobile Money number via SMS, PIN, and security code to finalize your application.
                </p>
              </div>

              <div className="bg-[hsl(220,50%,16%)] p-6 rounded-3xl border border-[hsl(220,30%,25%)]">
                <div className="w-10 h-10 rounded-xl bg-[#ffcc00] text-[hsl(220,50%,12%)] font-black text-lg flex items-center justify-center mb-4">
                  3
                </div>
                <h4 className="font-bold text-base text-white mb-1">Receive Mobile Funds</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Upon rapid automated review, funds are sent directly to your Ugandan MoMo wallet ready for immediate business use.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </PageLoader>
  );
}
