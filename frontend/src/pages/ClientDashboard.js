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
      {/* Mobile-Friendly Navbar */}
      <MobileNav 
        user={user}
        balance={balance}
        onLogout={handleLogout}
        showRecharge={true}
        onRechargeClick={() => setShowRechargeDialog(true)}
      />
      
      {/* Recharge Dialog */}
      <Dialog open={showRechargeDialog} onOpenChange={setShowRechargeDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Recharge Coins</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="border-2 hover:border-teal-500 transition-all duration-300">
                <CardContent className="p-4 md:p-6 text-center">
                  <h3 className="text-lg md:text-xl font-bold mb-2 capitalize">{pkg.name}</h3>
                  <div className="my-4">
                    <CoinsIcon className="w-12 h-12 md:w-16 md:h-16 mx-auto text-yellow-500" />
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-teal-600 mb-2">₹{pkg.price}</p>
                  <p className="text-base md:text-lg font-semibold mb-1">Get {pkg.coins} coins</p>
                  <p className="text-sm text-green-600 mb-4">Bonus: {pkg.bonus} coins!</p>
                  <Button 
                    onClick={() => {
                      handleRechargePackage(pkg.id);
                      setShowRechargeDialog(false);
                    }}
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