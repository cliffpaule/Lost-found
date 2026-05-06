import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%)',
      alignItems: 'center', justifyContent: 'center', padding: '24px 16px'
    }}>
      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 440, background: 'var(--surface)',
        borderRadius: 'var(--radius-xl)', padding: '40px 36px',
        boxShadow: 'var(--shadow-xl)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: 'var(--navy)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, color: 'var(--gold-light)',
            margin: '0 auto 16px'
          }}>LU</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--navy)', marginBottom: 6 }}>{title}</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{subtitle}</p>
        </div>

        {children}

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          {footer}
        </div>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 24 }}>
        Laikipia University Lost & Found System · BICT 328
      </p>
    </div>
  );
}

function FormField({ label, type = 'text', placeholder, value, onChange, icon, required, hint }) {
  const [showPass, setShowPass] = useState(false);
  const isPass = type === 'password';
  return (
    <div className="form-group">
      <label className="form-label">{label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={isPass ? (showPass ? 'text' : 'password') : type}
          className="form-input"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          required={required}
          style={{ paddingRight: isPass ? 44 : 14 }}
        />
        {isPass && (
          <button type="button" onClick={() => setShowPass(!showPass)} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)'
          }}>
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {hint && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{hint}</span>}
    </div>
  );
}

// ─── LOGIN PAGE ────────────────────────────────────────────────
export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your Laikipia University account"
      footer={<>Don't have an account? <Link to="/register" style={{ color: 'var(--navy)', fontWeight: 600 }}>Register here</Link></>}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <FormField label="Email Address" type="email" placeholder="you@laikipia.ac.ke"
          value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} required />
        <FormField label="Password" type="password" placeholder="Your password"
          value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} required />

        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: 4 }} disabled={loading}>
          {loading ? <><div className="spinner" /> Signing in…</> : 'Sign In →'}
        </button>

        {/* Demo credentials */}
        <div style={{ background: 'var(--gold-pale)', border: '1px solid var(--sand)', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--navy)' }}>Demo Admin:</strong> admin@laikipia.ac.ke / Admin@1234
        </div>
      </form>
    </AuthLayout>
  );
}

// ─── REGISTER PAGE ─────────────────────────────────────────────
export function RegisterPage() {
  const [form, setForm] = useState({
    full_name: '', email: '', student_id: '', password: '',
    confirm_password: '', role: 'student', department: '', phone: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const f = (key) => ({ value: form[key], onChange: v => setForm(p => ({ ...p, [key]: v })) });

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join the Laikipia University Lost & Found platform"
      footer={<>Already have an account? <Link to="/login" style={{ color: 'var(--navy)', fontWeight: 600 }}>Sign in</Link></>}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <FormField label="Full Name" placeholder="John Doe" {...f('full_name')} required />
          </div>
          <FormField label="Email" type="email" placeholder="SC/ICT/xxx/xx@laikipia.ac.ke" {...f('email')} required />
          <FormField label="Student/Staff ID" placeholder="SC/ICT/1673/23" {...f('student_id')}
            hint="Leave blank for non-students" />
        </div>

        <div className="form-group">
          <label className="form-label">Role <span style={{ color: 'var(--danger)' }}>*</span></label>
          <select className="form-select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
            <option value="student">Student</option>
            <option value="staff">Staff / Lecturer</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Department" placeholder="Computing & Informatics" {...f('department')} />
          <FormField label="Phone Number" type="tel" placeholder="+254 700 000 000" {...f('phone')} />
        </div>

        <FormField label="Password" type="password" placeholder="Min 8 characters" {...f('password')} required />
        <FormField label="Confirm Password" type="password" placeholder="Repeat your password" {...f('confirm_password')} required />

        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13, marginTop: 4 }} disabled={loading}>
          {loading ? <><div className="spinner" /> Creating account…</> : 'Create Account →'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default LoginPage;
