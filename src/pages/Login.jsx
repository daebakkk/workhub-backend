import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  function handleSubmit(e) {
    e.preventDefault();
    navigate('/dashboard');
  }
  
  return (
    <div className="authPage">
      <div className="authCard">
        <h2 className="authTitle">Welcome Back</h2>
        <p className="authSubtitle">Log in to your WorkHub account</p>

        <form onSubmit={handleSubmit} className="authForm">
          <input type="email" placeholder="Work Email" required />
          <input type="password" placeholder="Password" required />

          <button className="btn btnPrimary">Login</button>
        </form>
      </div>
    </div>
  );
}
