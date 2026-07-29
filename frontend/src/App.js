import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import InstallPrompt from './components/InstallPrompt';
import PrivateRoute from './components/PrivateRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import TherapistLogin from './pages/TherapistLogin';
import ClientDashboard from './pages/ClientDashboard';
import TherapistDashboard from './pages/TherapistDashboard';
import AdminDashboard from './pages/AdminDashboard';
import VideoCall from './pages/VideoCall';
import FAQ from './pages/FAQ';
import Support from './pages/Support';
import SmmPanel from './pages/SmmPanel';
import './App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/therapist-login" element={<TherapistLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/support" element={<Support />} />
          <Route path="/smm-panel" element={<SmmPanel />} />
          <Route path="/instagram-followers" element={<SmmPanel />} />
          <Route path="/youtube-views" element={<SmmPanel />} />
          <Route path="/tiktok-followers" element={<SmmPanel />} />
          
          {/* Protected Routes with Role-Based Access */}
          <Route 
            path="/client" 
            element={
              <PrivateRoute allowedRoles={['client']}>
                <ClientDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/therapist" 
            element={
              <PrivateRoute allowedRoles={['therapist']}>
                <TherapistDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/call/:sessionId" 
            element={
              <PrivateRoute allowedRoles={['client', 'therapist']}>
                <VideoCall />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/video-call/:sessionId" 
            element={
              <PrivateRoute allowedRoles={['client', 'therapist']}>
                <VideoCall />
              </PrivateRoute>
            } 
          />
        </Routes>
        <InstallPrompt />
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;