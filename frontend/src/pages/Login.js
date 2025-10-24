import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Video, ArrowLeft } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login?email=${email}&password=${password}`);
      localStorage.setItem('token', response.data.access_token);
      
      // Get user profile to determine role
      const profileRes = await axios.get(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${response.data.access_token}` }
      });
      
      const role = profileRes.data.role;
      
      // Redirect therapists to therapist login page
      if (role === 'therapist') {
        toast.error('Please use the Therapist Login page');
        localStorage.removeItem('token');
        navigate('/therapist-login');
        return;
      }
      
      toast.success('Login successful!');
      
      // Redirect based on role
      if (role === 'client') navigate('/client');
      else if (role === 'admin') navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          data-testid="back-to-home-btn"
          className="mb-6 text-teal-700 hover:text-teal-800 hover:bg-teal-50"
        >
          <ArrowLeft className="mr-2 w-4 h-4" /> Back to Home
        </Button>
        
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <Video className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Login</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="login-email-input"
                required
                className="mt-2"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="login-password-input"
                required
                className="mt-2"
                placeholder="••••••••"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              data-testid="login-submit-btn"
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white py-6 text-lg"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                data-testid="go-to-register-btn"
                className="text-teal-600 hover:text-teal-700 font-semibold"
              >
                Register here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;