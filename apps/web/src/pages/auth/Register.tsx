import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Lock, Mail, User } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Container } from '../../components/ui/Container';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      alert('Please acknowledge the clinical disclaimer to proceed.');
      return;
    }
    setLoading(true);
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
              Create Your Account
            </h1>
            <p className="text-sm text-[#584B68]">
              Begin your structured longitudinal health tracking journey.
            </p>
          </div>

          <Card variant="standard" className="p-8 sm:p-10 text-left border-[#E7DFEF]">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Jane Doe"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftAccessory={<User className="w-4 h-4" />}
              />

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
                placeholder="Create a strong password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftAccessory={<Lock className="w-4 h-4" />}
              />

              <div className="p-3 rounded-xl bg-[#F2ECF7] border border-[#E7DFEF] text-xs text-[#584B68] space-y-2">
                <label className="flex items-start gap-2 cursor-pointer font-medium text-[#1C1326]">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 rounded text-[#6E2D8B] focus:ring-[#6E2D8B]"
                  />
                  <span>
                    I understand PMOSense is an educational health-information platform, not a diagnostic medical service.
                  </span>
                </label>
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
                  Create Account
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-[#E7DFEF] text-center text-xs text-[#584B68]">
              Already have an account?{' '}
              <Link to={ROUTES.LOGIN} className="text-[#6E2D8B] font-bold hover:underline">
                Sign in
              </Link>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
};
