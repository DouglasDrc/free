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
import './App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/support" element={<Support />} />
          
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