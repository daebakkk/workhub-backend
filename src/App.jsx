import { Routes, Route, useLocation } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Reports from "./pages/Reports";
import WorkLogs from './pages/WorkLogs';

function App() {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/work-logs" element={<WorkLogs />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
  );
}

export default App;
