import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

function Home() {
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
                <Link className="btn btnPrimary" to="/login">Login</Link>
                <Link className="btn btnSecondary" to="/signup">Sign Up</Link>
          </div>
        </div>
      </main>

    </div>
  );
}

export default Home;
