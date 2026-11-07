import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import Footer from '../components/Footer';
import PageLoader from '../components/PageLoader';
import Confetti from '../components/Confetti';
import { clearSession, clearApplication, getApplication } from '../lib/session';
import { CheckCircle2, Home, LogOut, FileCheck, ArrowRight, Smartphone } from 'lucide-react';

export default function SuccessPage() {
  const navigate = useNavigate();
  const application = getApplication();

  const handleLogout = () => {
    clearSession();
    clearApplication();
    navigate('/');
  };

  return (
    <PageLoader>
      <div className="min-h-screen bg-[hsl(220,50%,12%)] text-white flex flex-col relative overflow-x-hidden">
        <Confetti />

        {/* Top Header */}
        <header className="bg-[#ffcc00] text-[hsl(220,50%,12%)] py-3 px-4 shadow-md sticky top-0 z-40">
          <div className="container mx-auto max-w-4xl flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <Logo size="sm" />
              <span className="font-extrabold text-lg sm:text-xl tracking-tight">
                MoMo <span className="font-normal opacity-90">Business Loans</span>
              </span>
            </div>
            <span className="text-xs font-bold bg-[hsl(220,50%,12%)]/10 px-3 py-1 rounded-full text-[hsl(220,50%,12%)]">
              Application Complete
            </span>
          </div>
        </header>

        {/* Main Success Container */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="bg-white rounded-3xl p-8 sm:p-10 text-center max-w-md w-full shadow-2xl text-[hsl(220,50%,12%)] border border-gray-100 relative z-10">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-200">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 tracking-tight text-[hsl(220,50%,12%)]">
              🎉 Congratulations!
            </h2>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
              You have successfully submitted your business loan application. Our verification team is reviewing your information within the hour.
            </p>

            {application && (
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 mb-6 text-left text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-gray-800 pb-2 border-b border-gray-200">
                  <FileCheck className="w-4 h-4 text-green-600" />
                  <span>Submitted Loan Summary</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Applicant:</span>
                  <span className="font-bold text-gray-900">{application.firstName} {application.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-bold text-green-700">{application.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tenure:</span>
                  <span className="font-bold text-gray-900">{application.repayment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Purpose:</span>
                  <span className="font-bold text-gray-900">{application.purpose}</span>
                </div>
              </div>
            )}

            <div className="bg-yellow-50/70 border border-[#ffcc00]/40 rounded-2xl p-3.5 mb-6 text-xs text-gray-700 flex items-center gap-2.5 text-left">
              <Smartphone className="w-5 h-5 text-[#ffcc00] shrink-0" />
              <span>We will send an SMS notification and Mobile Money approval prompt directly to your phone.</span>
            </div>

            <div className="flex flex-col gap-3">
              <button
                id="success-home-btn"
                onClick={() => navigate('/')}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#ffcc00] text-[hsl(220,50%,12%)] font-extrabold text-sm sm:text-base transition hover:bg-[#ffcc00]/90 shadow-md"
              >
                <Home className="w-4 h-4" />
                <span>Go Back Home</span>
              </button>
              <button
                id="success-logout-btn"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold text-sm sm:text-base transition hover:bg-gray-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </PageLoader>
  );
}
