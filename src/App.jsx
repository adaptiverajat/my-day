import { Routes, Route } from 'react-router-dom';
import './App.css';
import Calendar from './components/Calendar';
import Report from './components/Report';
import JivanDisha from './components/JivanDisha';
import Finances from './components/Finances';
import Work from './components/Work';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Calendar />} />
      <Route path="/report" element={<Report />} />
      <Route path="/jivandisha" element={<JivanDisha />} />
      <Route path="/finances" element={<Finances />} />
      <Route path="/work" element={<Work />} />
    </Routes>
  );
}

export default App;