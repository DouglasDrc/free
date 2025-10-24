import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Video, LogOut, Wallet, Search, Star, Clock, Phone, MessageCircle, CoinsIcon } from 'lucide-react';
import MobileNav from '../components/MobileNav';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [therapists, setTherapists] = useState([]);
  const [balance, setBalance] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [packages, setPackages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUserData();
    fetchTherapists();
    fetchPackages();
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

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${API}/coins/packages`);
      setPackages(response.data);
    } catch (error) {
      console.error('Failed to fetch packages');
    }
  };

  const handleRechargePackage = async (packageId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/coins/recharge/package?package_id=${packageId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBalance(response.data.new_balance);
      toast.success(response.data.message);
      fetchUserData();
    } catch (error) {
      toast.error('Recharge failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleStartSession = async (therapistId, sessionType) => {
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
      toast.success(`${sessionType} session started!`);
      if (sessionType === 'call') {
        navigate(`/call/${response.data.session_id}`);
      } else {
        toast.info('Chat feature coming soon!');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const filteredTherapists = therapists.filter(t => {
    const matchesSearch = t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.specialization?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLanguage = selectedLanguage === 'all' || 
      t.languages?.some(l => l.toLowerCase() === selectedLanguage.toLowerCase());
    
    return matchesSearch && matchesLanguage;
  });

  const getStatusColor = (status) => {
    if (status === 'online') return 'bg-green-500';
    if (status === 'busy') return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getStatusText = (status) => {
    if (status === 'online') return 'Online';
    if (status === 'busy') return 'Busy';
    return 'Offline';
  };

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
            <Button onClick={() => navigate('/faq')} variant="ghost" className="text-gray-700">FAQ</Button>
            <Button onClick={() => navigate('/support')} variant="ghost" className="text-gray-700">Support</Button>
            <div className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-6 py-3 rounded-xl" data-testid="client-coin-balance">
              <CoinsIcon className="w-6 h-6" />
              <div>
                <p className="text-xs opacity-80">My Coins</p>
                <p className="text-lg font-bold">{balance}</p>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button data-testid="recharge-dialog-btn" className="bg-teal-600 hover:bg-teal-700 text-white">
                  Recharge Wallet
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Recharge Coins</DialogTitle>
                </DialogHeader>
                <div className="grid md:grid-cols-3 gap-6 mt-6">
                  {packages.map((pkg) => (
                    <Card key={pkg.id} className="border-2 hover:border-teal-500 transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <h3 className="text-xl font-bold mb-2 capitalize">{pkg.name}</h3>
                        <div className="my-4">
                          <CoinsIcon className="w-16 h-16 mx-auto text-yellow-500" />
                        </div>
                        <p className="text-3xl font-bold text-teal-600 mb-2">₹{pkg.price}</p>
                        <p className="text-lg font-semibold mb-1">Get {pkg.coins} coins</p>
                        <p className="text-sm text-green-600 mb-4">Bonus: {pkg.bonus} coins!</p>
                        <Button 
                          onClick={() => handleRechargePackage(pkg.id)}
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
                        >
                          Choose Plan
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Find Your Therapist</h1>
          <p className="text-gray-600">Connect with qualified therapists via chat or video call</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Filter by Language</h3>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Languages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="hindi">Hindi</SelectItem>
                    <SelectItem value="spanish">Spanish</SelectItem>
                    <SelectItem value="malayalam">Malayalam</SelectItem>
                    <SelectItem value="tamil">Tamil</SelectItem>
                    <SelectItem value="telugu">Telugu</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Therapists Grid */}
          <div className="lg:col-span-3">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
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

            <div className="grid md:grid-cols-2 gap-6" data-testid="therapists-list">
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
                      <div className={`absolute top-4 right-4 ${getStatusColor(therapist.status)} text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1`}>
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        {getStatusText(therapist.status)}
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{therapist.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span>{therapist.rating || 'New'}</span>
                          <span>•</span>
                          <Clock className="w-4 h-4" />
                          <span>{therapist.experience} years</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 line-clamp-2">{therapist.bio}</p>
                      </div>
                      {therapist.hobbies?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {therapist.hobbies.slice(0, 3).map((hobby, idx) => (
                            <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                              {hobby}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {therapist.specialization?.slice(0, 3).map((spec, idx) => (
                          <span key={idx} className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                            {spec}
                          </span>
                        ))}
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>📍 {therapist.location} {therapist.age ? `• Age: ${therapist.age}` : ''}</p>
                        <p>🗣️ {therapist.languages?.join(', ')}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Chat</p>
                          <Button 
                            onClick={() => handleStartSession(therapist.user_id, 'chat')}
                            disabled={loading || balance < 100 || therapist.status === 'offline'}
                            size="sm"
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {therapist.chat_rate || 100}/min
                          </Button>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Call</p>
                          <Button 
                            onClick={() => handleStartSession(therapist.user_id, 'call')}
                            disabled={loading || balance < 100 || therapist.status === 'offline'}
                            size="sm"
                            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
                          >
                            <Phone className="w-4 h-4 mr-1" />
                            {therapist.call_rate || 150}/min
                          </Button>
                        </div>
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
      </div>
    </div>
  );
};

export default ClientDashboard;