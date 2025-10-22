import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Video, LogOut, Wallet, Search, Star, Clock, Phone, CoinsIcon } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [therapists, setTherapists] = useState([]);
  const [balance, setBalance] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState(500);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUserData();
    fetchTherapists();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [profileRes, balanceRes] = await Promise.all([
        axios.get(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/users/balance`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUser(profileRes.data);
      setBalance(balanceRes.data.coins);
    } catch (error) {
      toast.error('Failed to fetch user data');
      navigate('/login');
    }
  };

  const fetchTherapists = async () => {
    try {
      const response = await axios.get(`${API}/therapists`);
      setTherapists(response.data);
    } catch (error) {
      toast.error('Failed to fetch therapists');
    }
  };

  const handleRecharge = async () => {
    if (rechargeAmount < 100) {
      toast.error('Minimum recharge is 100 coins');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/coins/recharge?amount=${rechargeAmount}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBalance(response.data.new_balance);
      toast.success(`Successfully recharged ${rechargeAmount} coins!`);
      setRechargeAmount(500);
    } catch (error) {
      toast.error('Recharge failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (therapistId) => {
    if (balance < 100) {
      toast.error('Insufficient coins! Please recharge.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/sessions/start`, 
        { therapist_id: therapistId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Session started!');
      navigate(`/call/${response.data.session_id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const filteredTherapists = therapists.filter(t => 
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.specialization?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-teal-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">MindConnect</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-4 py-2 rounded-xl" data-testid="client-coin-balance">
              <Wallet className="w-5 h-5" />
              <span className="font-semibold">{balance} coins</span>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button data-testid="recharge-dialog-btn" className="bg-teal-600 hover:bg-teal-700 text-white">
                  <CoinsIcon className="w-4 h-4 mr-2" /> Recharge
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Recharge Coins</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium">Amount (INR = Coins)</label>
                    <Input
                      type="number"
                      value={rechargeAmount}
                      onChange={(e) => setRechargeAmount(Number(e.target.value))}
                      data-testid="recharge-amount-input"
                      min="100"
                      className="mt-2"
                    />
                  </div>
                  <Button 
                    onClick={handleRecharge} 
                    disabled={loading}
                    data-testid="recharge-submit-btn"
                    className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
                  >
                    {loading ? 'Processing...' : `Recharge ${rechargeAmount} coins`}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button 
              variant="ghost" 
              onClick={() => {
                localStorage.removeItem('token');
                navigate('/login');
              }}
              data-testid="client-logout-btn"
              className="text-gray-700 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Find Your Therapist</h1>
          <p className="text-gray-600">Browse qualified therapists and start your session</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by name or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="therapist-search-input"
              className="pl-10 py-6"
            />
          </div>
        </div>

        {/* Therapists Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="therapists-list">
          {filteredTherapists.map((therapist) => (
            <Card key={therapist.user_id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-teal-200">
              <CardContent className="p-0">
                <div className="h-48 bg-gradient-to-br from-teal-400 to-cyan-500 relative">
                  {therapist.photo ? (
                    <img src={therapist.photo} alt={therapist.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-6xl font-bold">
                      {therapist.name?.charAt(0)}
                    </div>
                  )}
                  {therapist.is_online && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Online
                    </div>
                  )}
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{therapist.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span>{therapist.rating || 'New'}</span>
                      <span>•</span>
                      <Clock className="w-4 h-4" />
                      <span>{therapist.experience} years exp</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 line-clamp-2">{therapist.bio}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {therapist.specialization?.slice(0, 3).map((spec, idx) => (
                      <span key={idx} className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                        {spec}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-lg font-semibold text-teal-700">{therapist.hourly_rate} coins/min</span>
                    <Button 
                      onClick={() => handleStartSession(therapist.user_id)}
                      disabled={loading || balance < 100}
                      data-testid={`start-session-btn-${therapist.user_id}`}
                      className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
                    >
                      <Phone className="w-4 h-4 mr-2" /> Start Session
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTherapists.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No therapists found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;