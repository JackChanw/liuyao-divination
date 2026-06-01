import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DivinationPage from './pages/DivinationPage';
import ResultPage from './pages/ResultPage';
import SharedResultPage from './pages/SharedResultPage';
import HistoryPage from './pages/HistoryPage';
import GlobalNav from './components/GlobalNav';

export default function App() {
  return (
    <>
      <GlobalNav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/divine" element={<DivinationPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/r/:token" element={<SharedResultPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
