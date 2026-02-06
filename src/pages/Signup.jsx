import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { authAPI } from '../api/api';

export default function Signup() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete API.defaults.headers.common.Authorization;
  }, []);

  const allowedDomain = '@thefifthlab.com';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    //frontend email validation
    if (!email.endsWith(allowedDomain)) {
      setError(`Email must end with ${allowedDomain}`);
      return;
    }

    try {
      await authAPI.post('auth/register/', {
        username: email.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password: password,
        first_name: firstName,
        last_name: lastName,
        role: 'staff',
      });

      navigate('/login');
    } catch (err) {
      const data = err.response?.data;
      const firstError =
        (typeof data === 'string' ? data : null) ||
        data?.email?.[0] ||
        data?.username?.[0] ||
        data?.password?.[0] ||
        data?.non_field_errors?.[0] ||
        data?.detail ||
        err.message ||
        'Signup failed. Please try again.';
      console.error('Signup error:', err.response?.status, data || err);
      setError(firstError);
    }
  }

  return (
    <div className="authPage">
      <div className="authCard">
        <h2 className="authTitle">Create Account</h2>
        <p className="authSubtitle">Join WorkHub and track your work</p>

        {error && <p className="authError">{error}</p>}

        <form onSubmit={handleSubmit} className="authForm">
          <input
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />

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

          <button className="btn btnPrimary">Sign Up</button>
        </form>
      </div>
    </div>
  );
}
