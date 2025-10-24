import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { Video, LogOut, Wallet, TrendingUp, Users, Clock, Phone, X } from 'lucide-react';
import IncomingCallModal from '../components/IncomingCallModal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TherapistDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [status, setStatus] = useState('offline');
  const [previousSessionIds, setPreviousSessionIds] = useState(new Set());
  const [showIncomingCall, setShowIncomingCall] = useState(null); // For full-screen modal
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    specialization: '',
    experience: 0,
    languages: '',
    bio: '',
    photo: '',
    phone: '',
    gender: '',
    chat_rate: 100,
    call_rate: 150,
    hobbies: '',
    age: 0,
    location: 'India'
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUserData();
    fetchProfile();
    fetchSessions();
    fetchActiveSessions();
    
    // Aggressive polling for active sessions every 2 seconds
    const interval = setInterval(fetchActiveSessions, 2000);
    return () => clearInterval(interval);
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

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const profileRes = await axios.get(`${API}/therapists/profile/me`, { headers: { Authorization: `Bearer ${token}` } });
      setProfile(profileRes.data);
      setStatus(profileRes.data.status || 'offline');
      
      // Populate edit form with current data
      setEditForm({
        specialization: profileRes.data.specialization?.join(', ') || '',
        experience: profileRes.data.experience || 0,
        languages: profileRes.data.languages?.join(', ') || '',
        bio: profileRes.data.bio || '',
        photo: profileRes.data.photo || '',
        phone: profileRes.data.phone || '',
        gender: profileRes.data.gender || '',
        chat_rate: profileRes.data.chat_rate || 100,
        call_rate: profileRes.data.call_rate || 150,
        hobbies: profileRes.data.hobbies?.join(', ') || '',
        age: profileRes.data.age || 0,
        location: profileRes.data.location || 'India'
      });
    } catch (error) {
      toast.error('Profile not found. Please contact admin to create your profile.');
      setShowProfileForm(true);
    }
  };

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sessions/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(response.data);
    } catch (error) {
      console.error('Failed to fetch sessions');
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sessions/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newSessions = response.data;
      const newSessionIds = new Set(newSessions.map(s => s.id));
      
      // Find truly new sessions (pending status only - incoming calls)
      const incomingSessions = newSessions.filter(s => 
        s.status === 'pending' && !previousSessionIds.has(s.id)
      );
      
      // Show full-screen modal for first incoming call
      if (incomingSessions.length > 0 && previousSessionIds.size > 0 && !showIncomingCall) {
        setShowIncomingCall(incomingSessions[0]);
        
        // Also show toast notification
        toast.success(`📞 New incoming call from ${incomingSessions[0].client_name}!`, {
          duration: 10000,
          icon: '📞',
          position: 'top-center'
        });
      }
      
      // If no pending sessions, hide modal
      const hasPendingSessions = newSessions.some(s => s.status === 'pending');
      if (!hasPendingSessions && showIncomingCall) {
        setShowIncomingCall(null);
      }
      
      setPreviousSessionIds(newSessionIds);
      setActiveSessions(newSessions);
    } catch (error) {
      console.error('Failed to fetch active sessions');
    }
  };

  const handleDeclineCall = async (sessionId, clientName) => {
    if (!window.confirm(`Decline call from ${clientName}?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/sessions/decline`, {
        session_id: sessionId,
        reason: "Therapist is busy"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Call declined');
      setShowIncomingCall(null);
      fetchActiveSessions();
    } catch (error) {
      toast.error('Failed to decline call');
    }
  };

  const handleAcceptCallFromModal = async () => {
    if (!showIncomingCall) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/sessions/accept`, {
        session_id: showIncomingCall.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowIncomingCall(null);
      toast.success('Call accepted - joining now');
      navigate(`/video-call/${showIncomingCall.id}`);
    } catch (error) {
      toast.error('Failed to accept call');
      setShowIncomingCall(null);
    }
  };

  const handleDeclineCallFromModal = async () => {
    if (!showIncomingCall) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/sessions/decline`, {
        session_id: showIncomingCall.id,
        reason: "Therapist declined"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowIncomingCall(null);
      toast.success('Call declined');
      fetchActiveSessions();
    } catch (error) {
      toast.error('Failed to decline call');
      setShowIncomingCall(null);
    }
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/therapists/profile`, {
        ...profileForm,
        specialization: profileForm.specialization.split(',').map(s => s.trim()),
        languages: profileForm.languages.split(',').map(l => l.trim())
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Profile created successfully!');
      setShowProfileForm(false);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create profile');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/therapists/status?status=${newStatus}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus(newStatus);
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/therapists/profile/me`, {
        ...editForm,
        specialization: editForm.specialization.split(',').map(s => s.trim()).filter(s => s),
        languages: editForm.languages.split(',').map(l => l.trim()).filter(l => l),
        hobbies: editForm.hobbies.split(',').map(h => h.trim()).filter(h => h)
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Profile updated successfully!');
      setShowEditProfile(false);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    }
  };

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const totalEarnings = completedSessions.reduce((sum, s) => sum + (s.duration_minutes * 30), 0);
  const totalMinutes = completedSessions.reduce((sum, s) => sum + s.duration_minutes, 0);

  if (showProfileForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Profile Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-gray-600 mb-6">
              Your therapist profile has not been created yet. Please contact the administrator to set up your profile.
            </p>
            <Button 
              onClick={() => {
                localStorage.removeItem('token');
                navigate('/login');
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Full-Screen Incoming Call Modal */}
      <IncomingCallModal 
        session={showIncomingCall}
        onAccept={handleAcceptCallFromModal}
        onDecline={handleDeclineCallFromModal}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">MindConnect</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Active Calls Badge */}
            {activeSessions.length > 0 && (
              <div className="relative">
                <Phone className="w-6 h-6 text-green-600 animate-bounce" />
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {activeSessions.length}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Status:</span>
              <Switch checked={status === 'online'} onCheckedChange={(checked) => handleStatusChange(checked ? 'online' : 'offline')} data-testid="therapist-online-toggle" />
              <span className={`text-sm font-semibold ${status === 'online' ? 'text-green-600' : 'text-gray-500'}`}>
                {status === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-xl" data-testid="therapist-earnings">
              <Wallet className="w-5 h-5" />
              <span className="font-semibold">{balance} coins</span>
            </div>
            <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Your Profile</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateProfile} className="space-y-4 mt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        className="mt-2"
                        placeholder="+91 1234567890"
                      />
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <Select value={editForm.gender} onValueChange={(value) => setEditForm({...editForm, gender: value})}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Age</Label>
                      <Input
                        type="number"
                        value={editForm.age}
                        onChange={(e) => setEditForm({...editForm, age: Number(e.target.value)})}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Experience (years)</Label>
                      <Input
                        type="number"
                        value={editForm.experience}
                        onChange={(e) => setEditForm({...editForm, experience: Number(e.target.value)})}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Chat Rate (coins/min)</Label>
                      <Input
                        type="number"
                        value={editForm.chat_rate}
                        onChange={(e) => setEditForm({...editForm, chat_rate: Number(e.target.value)})}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Call Rate (coins/min)</Label>
                      <Input
                        type="number"
                        value={editForm.call_rate}
                        onChange={(e) => setEditForm({...editForm, call_rate: Number(e.target.value)})}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Specializations (comma-separated)</Label>
                    <Input
                      value={editForm.specialization}
                      onChange={(e) => setEditForm({...editForm, specialization: e.target.value})}
                      className="mt-2"
                      placeholder="Anxiety, Depression, Stress"
                    />
                  </div>
                  <div>
                    <Label>Languages (comma-separated)</Label>
                    <Input
                      value={editForm.languages}
                      onChange={(e) => setEditForm({...editForm, languages: e.target.value})}
                      className="mt-2"
                      placeholder="English, Hindi"
                    />
                  </div>
                  <div>
                    <Label>Hobbies (comma-separated)</Label>
                    <Input
                      value={editForm.hobbies}
                      onChange={(e) => setEditForm({...editForm, hobbies: e.target.value})}
                      className="mt-2"
                      placeholder="Reading, Yoga, Traveling"
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={editForm.location}
                      onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                      className="mt-2"
                      placeholder="India"
                    />
                  </div>
                  <div>
                    <Label>Bio</Label>
                    <Textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      className="mt-2"
                      rows={4}
                      placeholder="Tell clients about yourself..."
                    />
                  </div>
                  <div>
                    <Label>Photo URL</Label>
                    <Input
                      value={editForm.photo}
                      onChange={(e) => setEditForm({...editForm, photo: e.target.value})}
                      className="mt-2"
                      placeholder="https://..."
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                    Save Changes
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button 
              variant="ghost" 
              onClick={() => {
                localStorage.removeItem('token');
                navigate('/login');
              }}
              data-testid="therapist-logout-btn"
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
          <h1 className="text-4xl font-bold mb-2">Therapist Dashboard</h1>
          <p className="text-gray-600">Manage your sessions and earnings</p>
        </div>

        {/* Active Sessions Alert */}
        {activeSessions.length > 0 && (
          <Card className="mb-8 border-2 border-green-500 bg-green-50">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
                <Phone className="w-6 h-6 animate-pulse" />
                Incoming Calls ({activeSessions.length})
              </h3>
              <div className="space-y-3">
                {activeSessions.map((session) => (
                  <div key={session.id} className="bg-white p-4 rounded-lg flex justify-between items-center shadow">
                    <div>
                      <p className="font-semibold text-lg">{session.client_name}</p>
                      <p className="text-sm text-gray-600">
                        Session Type: <span className="capitalize">{session.session_type}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Started: {new Date(session.start_time).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleDeclineCall(session.id, session.client_name)}
                        data-testid={`decline-call-btn-${session.id}`}
                        variant="outline"
                        className="border-2 border-red-500 text-red-600 hover:bg-red-50 px-6 py-6 text-lg"
                      >
                        <X className="w-5 h-5 mr-2" />
                        Decline
                      </Button>
                      <Button
                        onClick={() => navigate(`/call/${session.id}`)}
                        data-testid={`join-call-btn-${session.id}`}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-6 text-lg animate-pulse"
                      >
                        <Phone className="w-5 h-5 mr-2" />
                        Join Call
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Earnings</p>
                  <p className="text-3xl font-bold mt-1">{totalEarnings} coins</p>
                </div>
                <TrendingUp className="w-12 h-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Total Sessions</p>
                  <p className="text-3xl font-bold mt-1">{completedSessions.length}</p>
                </div>
                <Users className="w-12 h-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Minutes</p>
                  <p className="text-3xl font-bold mt-1">{totalMinutes} min</p>
                </div>
                <Clock className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Session History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length > 0 ? (
              <div className="space-y-4" data-testid="session-history-list">
                {sessions.slice(0, 10).map((session) => (
                  <div key={session.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Session ID: {session.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(session.start_time).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-purple-700">
                        {session.duration_minutes} min • {session.duration_minutes * 30} coins
                      </p>
                      <p className="text-sm text-gray-600 capitalize">{session.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No sessions yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
};

export default TherapistDashboard;