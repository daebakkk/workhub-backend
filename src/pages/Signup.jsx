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
  const [signingUp, setSigningUp] = useState(false);

  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refresh');
    delete API.defaults.headers.common.Authorization;
  }, []);

  const allowedDomain = '@thefifthlab.com';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSigningUp(true);

    //frontend email validation
    if (!email.endsWith(allowedDomain)) {
      setError(`Email must end with ${allowedDomain}`);
      setSigningUp(false);
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
      console.error('Signup error:', err.response?.status, data || err);
      setError('Signup failed. Please try again.');
    } finally {
      setSigningUp(false);
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

          <button className="btn btnPrimary" disabled={signingUp}>
            {signingUp ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
}
