import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import API, { authAPI } from '../api/api';

export default function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refresh');
    delete API.defaults.headers.common.Authorization;
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoggingIn(true);

    try {
      const res = await authAPI.post('auth/login/', {
        username: identifier.trim(),
        password,
      });

      if (!res.data.access || !res.data.user) {
        setError('Login failed');
        return;
      }

      localStorage.setItem('token', res.data.access);
      if (res.data.refresh) {
        localStorage.setItem('refresh', res.data.refresh);
      }
      localStorage.setItem('user', JSON.stringify(res.data.user));
      API.defaults.headers.common.Authorization = `Bearer ${res.data.access}`;

      if (res.data.user.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Invalid username/email or password');
    } finally {
      setLoggingIn(false);
    }
  }

  return (
    <div className="authPage">
      <div className="authCard">
        <h2 className="authTitle">Welcome Back</h2>
        <p className="authSubtitle">Log in to your WorkHub account</p>

        {error && <p className="authError">{error}</p>}

        <form onSubmit={handleSubmit} className="authForm">
          <input
            type="text"
            placeholder="Username or email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />

          <div className="authPasswordWrap">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            <button
              type="button"
              className="authPasswordToggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
                {!showPassword && <line x1="2" y1="2" x2="22" y2="22"/>}
              </svg>
            </button>
          </div>

          <p className="authLinkRow">
            Don't have an account?{' '}
            <Link className="authLink" to="/signup">
              Sign up
            </Link>
          </p>

          <button className="btn btnPrimary" type="submit" disabled={loggingIn}>
            {loggingIn ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
