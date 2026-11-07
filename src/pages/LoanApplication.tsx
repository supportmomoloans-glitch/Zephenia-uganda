import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../components/Logo';
import PageLoader from '../components/PageLoader';
import { setPendingLoan, getPendingLoan } from '../lib/session';
import { ChevronDown, ArrowLeft, Building2, Calculator, CheckCircle2, ShieldCheck } from 'lucide-react';

const loanPurposes = [
  'Business Expansion',
  'Working Capital',
  'Equipment Purchase',
  'Agriculture',
  'Trade & Commerce',
  'Transport',
  'Education',
  'Other',
];

const loanTypes = [
  'SME Loan',
  'Business Loan',
  'Salary Advance',
  'Emergency Loan',
];

const repaymentPeriods = [
  '1 Month',
  '3 Months',
  '6 Months',
  '12 Months',
];

const amounts = [
  'UGX 100,000',
  'UGX 250,000',
  'UGX 500,000',
  'UGX 1,000,000',
  'UGX 2,000,000',
  'UGX 5,000,000',
  'UGX 10,000,000',
  'UGX 20,000,000',
];

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="mb-5">
      <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none border-2 border-gray-200 focus:border-[#ffcc00] rounded-2xl px-4 py-3.5 text-sm sm:text-base font-bold text-gray-800 outline-none bg-white pr-10 shadow-sm transition"
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

export default function LoanApplication() {
  const navigate = useNavigate();
  const location = useLocation();
  const pending = getPendingLoan();
  const navState = (location.state as { amount?: string; repayment?: string; purpose?: string; type?: string }) || {};

  const [amount, setAmount] = useState(navState.amount || pending?.amount || 'UGX 1,000,000');
  const [purpose, setPurpose] = useState(navState.purpose || pending?.purpose || 'Business Expansion');
  const [type, setType] = useState(navState.type || pending?.type || 'Business Loan');
  const [repayment, setRepayment] = useState(navState.repayment || pending?.repayment || '6 Months');

  const valid = amount && purpose && type && repayment;

  return (
    <PageLoader>
      <div className="min-h-screen bg-[hsl(220,50%,12%)] text-white flex flex-col">
        {/* Header */}
        <header className="bg-[#ffcc00] text-[hsl(220,50%,12%)] py-3 px-4 shadow-md">
          <div className="container mx-auto max-w-4xl flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <Logo size="sm" />
              <span className="font-extrabold text-lg sm:text-xl tracking-tight">
                MoMo <span className="font-normal opacity-90">Business Loans</span>
              </span>
            </div>
            <span className="text-xs font-bold bg-[hsl(220,50%,12%)]/10 px-3 py-1 rounded-full">
              Step 1 of 3: Loan Details
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 container mx-auto max-w-lg px-4 py-8">
          <div className="bg-white rounded-3xl p-6 sm:p-8 text-[hsl(220,50%,12%)] shadow-2xl border border-gray-100">
            <button
              id="loan-app-back-btn"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-900 text-sm font-semibold mb-4 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#ffcc00]/20 text-[#ffcc00] flex items-center justify-center mx-auto mb-3 border border-[#ffcc00]/30">
                <Building2 className="w-6 h-6 text-gray-800" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[hsl(220,50%,12%)]">
                Apply for a Business Loan
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">
                Customize your loan parameters to match your cashflow needs
              </p>
            </div>

            <SelectField
              id="select-loan-amount"
              label="Loan Amount"
              value={amount}
              onChange={setAmount}
              options={amounts}
            />
            <SelectField
              id="select-loan-purpose"
              label="Purpose of Loan"
              value={purpose}
              onChange={setPurpose}
              options={loanPurposes}
            />
            <SelectField
              id="select-loan-type"
              label="Type of Loan"
              value={type}
              onChange={setType}
              options={loanTypes}
            />
            <SelectField
              id="select-repayment-period"
              label="Repayment Period"
              value={repayment}
              onChange={setRepayment}
              options={repaymentPeriods}
            />

            {/* Quick Summary Box */}
            {valid && (
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wide mb-2.5">
                  <Calculator className="w-4 h-4 text-[#ffcc00]" />
                  <span>Selected Terms Overview</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Amount:</span>{' '}
                    <span className="font-bold text-gray-900">{amount}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tenure:</span>{' '}
                    <span className="font-bold text-gray-900">{repayment}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Category:</span>{' '}
                    <span className="font-bold text-gray-900">{type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Disbursement:</span>{' '}
                    <span className="font-bold text-green-700">Instant MoMo</span>
                  </div>
                </div>
              </div>
            )}

            <button
              id="loan-app-next-btn"
              onClick={() => {
                if (valid) {
                  setPendingLoan({ amount, purpose, type, repayment });
                  navigate('/personal-details', {
                    state: { amount, purpose, type, repayment },
                  });
                }
              }}
              disabled={!valid}
              className="w-full py-4 rounded-2xl bg-[#ffcc00] text-[hsl(220,50%,12%)] font-extrabold text-base hover:bg-[#ffcc00]/90 disabled:opacity-40 transition shadow-md flex items-center justify-center gap-2"
            >
              <span>Next: Personal Details</span>
            </button>
          </div>
        </main>
      </div>
    </PageLoader>
  );
}
