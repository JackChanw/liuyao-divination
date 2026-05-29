import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DivinationPage from './pages/DivinationPage';
import ResultPage from './pages/ResultPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/divine" element={<DivinationPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
