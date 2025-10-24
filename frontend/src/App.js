import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import InstallPrompt from './components/InstallPrompt';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/ClientDashboard';
import TherapistDashboard from './pages/TherapistDashboard';
import AdminDashboard from './pages/AdminDashboard';
import VideoCall from './pages/VideoCall';
import FAQ from './pages/FAQ';
import Support from './pages/Support';
import './App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/client" element={<ClientDashboard />} />
          <Route path="/therapist" element={<TherapistDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/call/:sessionId" element={<VideoCall />} />
          <Route path="/video-call/:sessionId" element={<VideoCall />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/support" element={<Support />} />
        </Routes>
        <InstallPrompt />
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;