import { useNavigate } from 'react-router-dom';
export default function Signup() {
   const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    navigate('/dashboard'); // fake signup for now
  }

  return (
    <div className="authPage">
      <div className="authCard">
        <h2 className="authTitle">Create Account</h2>
        <p className="authSubtitle">Join WorkHub and track your work</p>

        <form onSubmit={handleSubmit} className="authForm">
          <input type="text" placeholder="Full Name" required />
          <input type="email" placeholder="Work Email" required />
          <input type="password" placeholder="Password" required />
          <select required>
            <option value="">Select role</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
          <button className="btn btnPrimary">Sign Up</button>
        </form>
      </div>
    </div>
  );
}
