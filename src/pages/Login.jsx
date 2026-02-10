import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import API, { authAPI } from '../api/api';

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        username: email.trim().toLowerCase(),
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
      setError('Invalid email or password');
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
            type="email"
            placeholder="Work Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <p className="authLinkRow">
            Don't have an account?{' '}
            <Link className="authLink" to="/signup">
              Sign up
            </Link>
          </p>

          <button className="btn btnPrimary" disabled={loggingIn}>
            {loggingIn ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
