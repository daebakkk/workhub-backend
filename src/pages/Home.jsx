import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="page">
      
      <header className="topBar">
        <div></div>
        <Navbar />
      </header>

      <main className="centerArea">
        <div className="heroText">
            <h1 className="brandTitle">WorkHub</h1>
            <p className="brandSubtitle">
                Keep track of all your work progress.
            </p>
            <div className="heroButtons">
                <button className="btn btnPrimary" onClick={() => navigate('/login')}>Login</button>
                <button className="btn btnSecondary" onClick={() => navigate('/signup')}>Sign Up</button>
          </div>
        </div>
      </main>

    </div>
  );
}

export default Home;
