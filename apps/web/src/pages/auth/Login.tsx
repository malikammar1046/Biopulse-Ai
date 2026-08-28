import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Lock, Mail, ShieldAlert } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Container } from '../../components/ui/Container';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Preview routing to app dashboard
    setTimeout(() => {
      setLoading(false);
      navigate(ROUTES.APP.DASHBOARD);
    }, 600);
  };

  return (
    <div className="py-12 sm:py-20 flex items-center justify-center">
      <Container size="sm">
        <div className="max-w-md mx-auto space-y-8 text-center">
          <div className="space-y-3">
            <Link to={ROUTES.HOME} className="inline-flex items-center gap-2.5 mx-auto">
              <div className="w-10 h-10 rounded-2xl bg-gradient-brand flex items-center justify-center text-white shadow-md shadow-purple-950/20">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold font-display text-[#1C1326] tracking-tight">
                PMOSense
              </span>
            </Link>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1326] font-display">
              Welcome Back
            </h1>
            <p className="text-sm text-[#584B68]">
              Log in to your longitudinal health record and monitoring dashboard.
            </p>
          </div>

          <Card variant="standard" className="p-8 sm:p-10 text-left border-[#E7DFEF]">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                placeholder="you@domain.com"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftAccessory={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftAccessory={<Lock className="w-4 h-4" />}
              />

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-[#584B68] cursor-pointer">
                  <input type="checkbox" className="rounded text-[#6E2D8B] focus:ring-[#6E2D8B]" />
                  <span>Remember me</span>
                </label>
                <span className="text-[#6E2D8B] font-semibold hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Sign In to Dashboard
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-[#E7DFEF] text-center text-xs text-[#584B68]">
              Don't have an account?{' '}
              <Link to={ROUTES.REGISTER} className="text-[#6E2D8B] font-bold hover:underline">
                Create an account
              </Link>
            </div>
          </Card>

          <div className="p-3 rounded-2xl bg-[#EDE4F7]/60 border border-[#D8B4FE]/40 text-left flex items-start gap-2.5 text-xs text-[#584B68]">
            <ShieldAlert className="w-4 h-4 text-[#6E2D8B] shrink-0 mt-0.5" />
            <span>
              Phase 1 Preview Mode: Clicking Sign In navigates to the Authenticated App Shell placeholder.
            </span>
          </div>
        </div>
      </Container>
    </div>
  );
};
