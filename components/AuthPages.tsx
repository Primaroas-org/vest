import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ViewState } from '../types';

interface AuthPageProps {
  onNavigate: (view: ViewState) => void;
}

export const Login: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const { dict } = useLanguage();
  const { login } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(email, password);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onNavigate('dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark py-20 px-4 relative overflow-hidden">
       {/* Background Decoration */}
       <div className="absolute top-0 left-0 w-full h-full hero-gradient opacity-10 pointer-events-none"></div>
       <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
       <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>

      <div className="bg-white dark:bg-charcoal p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex bg-primary p-3 rounded-xl mb-6 shadow-lg shadow-primary/20">
            <span className="material-icons-round text-white text-3xl">apartment</span>
          </div>
          <h2 className="text-3xl font-extrabold text-charcoal dark:text-white font-display mb-2">{dict.auth.welcomeBack}</h2>
          <p className="text-gray-500 dark:text-gray-400">{dict.auth.enterDetails}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{dict.auth.email}</label>
            <div className="relative">
              <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">email</span>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                placeholder="name@example.com"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">{dict.auth.password}</label>
              <button type="button" onClick={() => onNavigate('forgot-password')} className="text-xs font-bold text-primary hover:text-emerald-600 transition-colors">{dict.auth.forgotPassword}</button>
            </div>
            <div className="relative">
              <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">lock</span>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/25 transition-all active:scale-95">
            {loading ? 'Signing in...' : dict.auth.signIn}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
          <button className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-charcoal dark:text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            {dict.auth.continueGoogle}
          </button>
          
          <p className="text-center mt-6 text-gray-500 dark:text-gray-400 text-sm">
            {dict.auth.noAccount} {' '}
            <button onClick={() => onNavigate('signup')} className="text-primary font-bold hover:underline">
              {dict.auth.signUp}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export const Signup: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const { dict } = useLanguage();
  const { register } = useAuth();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const result = await register(email, password, name);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.message) {
      // Show success message for email confirmation
      setSuccess(result.message);
      setLoading(false);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        onNavigate('login');
      }, 3000);
    } else {
      onNavigate('dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark py-20 px-4 relative overflow-hidden">
        {/* Background Decoration */}
       <div className="absolute top-0 left-0 w-full h-full hero-gradient opacity-10 pointer-events-none"></div>
       <div className="absolute top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
       <div className="absolute bottom-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>

      <div className="bg-white dark:bg-charcoal p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-charcoal dark:text-white font-display mb-2">{dict.auth.createAccount}</h2>
          <p className="text-gray-500 dark:text-gray-400">{dict.auth.joinCommunity}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-sm">
              {success}
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{dict.auth.name}</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{dict.auth.email}</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{dict.auth.password}</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/25 transition-all active:scale-95">
            {loading ? 'Creating account...' : dict.auth.signUp}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed">
          {dict.auth.bySigning}
        </p>

        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {dict.auth.haveAccount} {' '}
            <button onClick={() => onNavigate('login')} className="text-primary font-bold hover:underline">
              {dict.auth.signIn}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export const ForgotPassword: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const { dict } = useLanguage();
  const { resetPassword } = useAuth();
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Check cooldown
    const lastResendTime = sessionStorage.getItem('lastResendTime');
    if (lastResendTime) {
      const timeSinceLastResend = Date.now() - parseInt(lastResendTime, 10);
      const cooldownPeriod = 60000; // 60 seconds
      
      if (timeSinceLastResend < cooldownPeriod) {
        const remainingSeconds = Math.ceil((cooldownPeriod - timeSinceLastResend) / 1000);
        setError(`Please wait ${remainingSeconds} seconds before requesting another reset link.`);
        return;
      }
    }
    
    setLoading(true);

    const result = await resetPassword(email);
    
    if (result.error) {
      // Handle rate limit error specifically
      if (result.error.includes('429') || result.error.toLowerCase().includes('too many requests')) {
        setError('Too many requests. Please wait a minute before trying again.');
        sessionStorage.setItem('lastResendTime', Date.now().toString());
      } else {
        setError(result.error);
      }
      setLoading(false);
    } else {
      // Store email in sessionStorage for resend functionality
      sessionStorage.setItem('resetPasswordEmail', email);
      sessionStorage.setItem('lastResendTime', Date.now().toString());
      setEmailSent(true);
      setLoading(false);
    }
  };

  if (emailSent) {
    return <CheckEmail onNavigate={onNavigate} email={email} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark py-20 px-4 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full hero-gradient opacity-10 pointer-events-none"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>

      <div className="bg-white dark:bg-charcoal p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex bg-primary p-3 rounded-xl mb-6 shadow-lg shadow-primary/20">
            <span className="material-icons-round text-white text-3xl">lock_reset</span>
          </div>
          <h2 className="text-3xl font-extrabold text-charcoal dark:text-white font-display mb-2">
            {dict.auth.forgotPasswordTitle}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">{dict.auth.forgotPasswordDesc}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{dict.auth.email}</label>
            <div className="relative">
              <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">email</span>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/25 transition-all active:scale-95">
            {loading ? 'Sending...' : dict.auth.sendResetLink}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 text-center">
          <button 
            onClick={() => onNavigate('login')}
            className="text-gray-500 dark:text-gray-400 text-sm hover:text-primary transition-colors">
            <span className="material-icons-round inline-block align-middle mr-1 text-base">arrow_back</span>
            {dict.auth.backToLogin}
          </button>
        </div>
      </div>
    </div>
  );
};

export const CheckEmail: React.FC<AuthPageProps & { email?: string }> = ({ onNavigate, email: emailProp }) => {
  const { dict } = useLanguage();
  const { resetPassword } = useAuth();
  const [resending, setResending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [cooldownSeconds, setCooldownSeconds] = React.useState(0);
  
  // Get email from prop or sessionStorage
  const email = emailProp || sessionStorage.getItem('resetPasswordEmail') || '';

  // Check for existing cooldown on mount
  React.useEffect(() => {
    const lastResendTime = sessionStorage.getItem('lastResendTime');
    if (lastResendTime) {
      const timeSinceLastResend = Date.now() - parseInt(lastResendTime, 10);
      const cooldownPeriod = 60000; // 60 seconds
      const remainingCooldown = Math.max(0, cooldownPeriod - timeSinceLastResend);
      
      if (remainingCooldown > 0) {
        setCooldownSeconds(Math.ceil(remainingCooldown / 1000));
        
        const interval = setInterval(() => {
          const timeSinceLastResend = Date.now() - parseInt(lastResendTime, 10);
          const remainingCooldown = Math.max(0, cooldownPeriod - timeSinceLastResend);
          
          if (remainingCooldown > 0) {
            setCooldownSeconds(Math.ceil(remainingCooldown / 1000));
          } else {
            setCooldownSeconds(0);
            clearInterval(interval);
            sessionStorage.removeItem('lastResendTime');
          }
        }, 1000);
        
        return () => clearInterval(interval);
      }
    }
  }, []);

  const handleResend = async () => {
    if (!email) {
      setError('Email address not found. Please start over.');
      return;
    }
    
    // Check cooldown
    const lastResendTime = sessionStorage.getItem('lastResendTime');
    if (lastResendTime) {
      const timeSinceLastResend = Date.now() - parseInt(lastResendTime, 10);
      const cooldownPeriod = 60000; // 60 seconds
      
      if (timeSinceLastResend < cooldownPeriod) {
        const remainingSeconds = Math.ceil((cooldownPeriod - timeSinceLastResend) / 1000);
        setError(`Please wait ${remainingSeconds} seconds before requesting another reset link.`);
        return;
      }
    }
    
    setResending(true);
    setError(null);
    setSuccess(false);
    
    try {
      const result = await resetPassword(email);
      
      if (result.error) {
        // Handle rate limit error specifically
        if (result.error.includes('429') || result.error.toLowerCase().includes('too many requests')) {
          setError('Too many requests. Please wait a minute before trying again.');
          // Set cooldown
          sessionStorage.setItem('lastResendTime', Date.now().toString());
          setCooldownSeconds(60);
          
          // Start countdown
          const interval = setInterval(() => {
            setCooldownSeconds((prev) => {
              if (prev <= 1) {
                clearInterval(interval);
                sessionStorage.removeItem('lastResendTime');
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          setError(result.error);
        }
      } else {
        setSuccess(true);
        // Set cooldown after successful send
        sessionStorage.setItem('lastResendTime', Date.now().toString());
        setCooldownSeconds(60);
        
        // Start countdown
        const interval = setInterval(() => {
          setCooldownSeconds((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              sessionStorage.removeItem('lastResendTime');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark py-20 px-4 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full hero-gradient opacity-10 pointer-events-none"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>

      <div className="bg-white dark:bg-charcoal p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex bg-primary p-3 rounded-xl mb-6 shadow-lg shadow-primary/20">
            <span className="material-icons-round text-white text-3xl">mark_email_read</span>
          </div>
          <h2 className="text-3xl font-extrabold text-charcoal dark:text-white font-display mb-2">
            {dict.auth.checkEmail}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">{dict.auth.checkEmailDesc}</p>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-sm">
              Reset link sent successfully! Please check your email.
            </div>
          )}
          <button
            onClick={() => onNavigate('login')}
            className="w-full bg-primary hover:bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/25 transition-all active:scale-95">
            {dict.auth.backToLogin}
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
          <div className="text-center space-y-4">
            <div>
              <p className="text-charcoal dark:text-white text-base font-bold mb-1">
                {dict.auth.didntReceiveEmail}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {dict.auth.checkSpamFolder}
              </p>
            </div>
            {email && (
              <button
                onClick={handleResend}
                disabled={resending || cooldownSeconds > 0}
                className="text-primary font-bold text-sm hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto">
                {resending ? 'Sending...' : cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` : dict.auth.resendLink}
                {!resending && cooldownSeconds === 0 && (
                  <span className="material-icons-round text-base">refresh</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};