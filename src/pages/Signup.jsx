import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { authAPI } from '../api/api';

export default function Signup() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('frontend');
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
        specialization,
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
          <select
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            required
          >
            <option value="frontend">Frontend Developer</option>
            <option value="backend">Backend Developer</option>
            <option value="full_stack">Full Stack Developer</option>
            <option value="mobile_ios">Mobile iOS Developer</option>
            <option value="mobile_android">Mobile Android Developer</option>
            <option value="mobile_cross">Cross-platform Mobile Developer</option>
            <option value="web_accessibility">Web Accessibility</option>
            <option value="ui_ux">UI/UX Designer</option>
            <option value="product_design">Product Designer</option>
            <option value="qa_manual">Manual QA</option>
            <option value="qa_automation">QA Automation</option>
            <option value="test_engineer">Test Engineer</option>
            <option value="devops">DevOps Engineer</option>
            <option value="sre">Site Reliability Engineer</option>
            <option value="cloud_engineer">Cloud Engineer</option>
            <option value="platform_engineer">Platform Engineer</option>
            <option value="systems_engineer">Systems Engineer</option>
            <option value="network_engineer">Network Engineer</option>
            <option value="security_engineer">Security Engineer</option>
            <option value="appsec">Application Security</option>
            <option value="netsec">Network Security</option>
            <option value="data_analyst">Data Analyst</option>
            <option value="data_engineer">Data Engineer</option>
            <option value="data_scientist">Data Scientist</option>
            <option value="ml_engineer">ML Engineer</option>
            <option value="ai_engineer">AI Engineer</option>
            <option value="mlops">MLOps Engineer</option>
            <option value="database_admin">Database Administrator</option>
            <option value="api_engineer">API Engineer</option>
            <option value="software_architect">Software Architect</option>
            <option value="embedded">Embedded Systems</option>
            <option value="iot">IoT Engineer</option>
            <option value="robotics">Robotics Engineer</option>
            <option value="game_dev">Game Developer</option>
            <option value="ar_vr">AR/VR Developer</option>
            <option value="blockchain">Blockchain Developer</option>
            <option value="devrel">Developer Advocate</option>
            <option value="tech_writer">Technical Writer</option>
            <option value="support_engineer">Support Engineer</option>
            <option value="build_release">Build/Release Engineer</option>
            <option value="infra_ops">Infrastructure Operations</option>
            <option value="sys_admin">System Administrator</option>
            <option value="it_support">IT Support</option>
            <option value="business_analyst">Business Analyst</option>
            <option value="product_manager">Product Manager</option>
            <option value="gis">GIS Specialist</option>
          </select>

          <button className="btn btnPrimary" type="submit" disabled={signingUp}>
            {signingUp ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
}
