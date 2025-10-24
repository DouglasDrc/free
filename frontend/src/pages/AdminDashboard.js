import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Video, LogOut, Users, DollarSign, Activity, TrendingUp, UserPlus, Trash2 } from 'lucide-react';
import CallHistory from '../components/CallHistory';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [showAddTherapist, setShowAddTherapist] = useState(false);
  const [showEditTherapist, setShowEditTherapist] = useState(false);
  const [showEditBalance, setShowEditBalance] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [newBalance, setNewBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [therapistForm, setTherapistForm] = useState({
    email: '',
    name: '',
    password: '',
    specialization: '',
    experience: 0,
    languages: '',
    bio: '',
    photo: '',
    chat_rate: 100,
    call_rate: 150,
    hobbies: '',
    age: 0,
    location: 'India',
    phone: '',
    gender: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchAnalytics();
    fetchUsers();
    fetchTherapists();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Failed to fetch analytics');
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  const fetchTherapists = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/therapists`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTherapists(response.data);
    } catch (error) {
      toast.error('Failed to fetch therapists');
    }
  };

  const handleAddTherapist = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/admin/therapists/create`, {
        ...therapistForm,
        specialization: therapistForm.specialization.split(',').map(s => s.trim()),
        languages: therapistForm.languages.split(',').map(l => l.trim()),
        hobbies: therapistForm.hobbies ? therapistForm.hobbies.split(',').map(h => h.trim()).filter(h => h) : []
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Therapist created successfully!');
      setShowAddTherapist(false);
      setTherapistForm({
        email: '',
        name: '',
        password: '',
        specialization: '',
        experience: 0,
        languages: '',
        bio: '',
        photo: '',
        chat_rate: 100,
        call_rate: 150,
        hobbies: '',
        age: 0,
        location: 'India',
        phone: '',
        gender: ''
      });
      fetchUsers();
      fetchTherapists();
      fetchAnalytics();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create therapist');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User deleted successfully');
      fetchUsers();
      fetchTherapists();
      fetchAnalytics();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const openEditBalance = (user) => {
    setSelectedUser(user);
    setNewBalance(user.coins || 0);
    setShowEditBalance(true);
  };

  const handleUpdateBalance = async () => {
    if (!selectedUser) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/admin/users/${selectedUser.id}/balance?coins=${newBalance}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Balance updated successfully!');
      setShowEditBalance(false);
      fetchUsers();
      fetchTherapists();
      fetchAnalytics();
    } catch (error) {
      toast.error('Failed to update balance');
    }
  };

  const openEditTherapist = (therapist) => {
    setSelectedTherapist(therapist);
    setTherapistForm({
      email: therapist.email || '',
      name: therapist.name || '',
      password: '',
      specialization: therapist.specialization?.join(', ') || '',
      experience: therapist.experience || 0,
      languages: therapist.languages?.join(', ') || '',
      bio: therapist.bio || '',
      photo: therapist.photo || '',
      chat_rate: therapist.chat_rate || 100,
      call_rate: therapist.call_rate || 150,
      hobbies: therapist.hobbies?.join(', ') || '',
      age: therapist.age || 0,
      location: therapist.location || 'India',
      phone: therapist.phone || '',
      gender: therapist.gender || ''
    });
    setShowEditTherapist(true);
  };

  const handleUpdateTherapist = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/admin/therapists/${selectedTherapist.user_id}`, {
        specialization: therapistForm.specialization.split(',').map(s => s.trim()),
        experience: therapistForm.experience,
        languages: therapistForm.languages.split(',').map(l => l.trim()),
        bio: therapistForm.bio,
        photo: therapistForm.photo,
        phone: therapistForm.phone,
        gender: therapistForm.gender,
        chat_rate: therapistForm.chat_rate,
        call_rate: therapistForm.call_rate,
        hobbies: therapistForm.hobbies ? therapistForm.hobbies.split(',').map(h => h.trim()).filter(h => h) : [],
        age: therapistForm.age,
        location: therapistForm.location
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Therapist updated successfully!');
      setShowEditTherapist(false);
      setTherapistForm({
        email: '',
        name: '',
        password: '',
        specialization: '',
        experience: 0,
        languages: '',
        bio: '',
        photo: '',
        chat_rate: 100,
        call_rate: 150,
        hobbies: '',
        age: 0,
        location: 'India',
        phone: '',
        gender: ''
      });
      fetchTherapists();
      fetchAnalytics();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update therapist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">MindConnect Admin</span>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => {
              localStorage.removeItem('token');
              navigate('/login');
            }}
            data-testid="admin-logout-btn"
            className="text-gray-700 hover:text-gray-900"
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Platform overview and management</p>
          </div>
          <Dialog open={showAddTherapist} onOpenChange={setShowAddTherapist}>
            <DialogTrigger asChild>
              <Button data-testid="add-therapist-btn" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                <UserPlus className="w-4 h-4 mr-2" /> Add Therapist
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Therapist</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddTherapist} className="space-y-4 mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={therapistForm.name}
                      onChange={(e) => setTherapistForm({...therapistForm, name: e.target.value})}
                      data-testid="add-therapist-name-input"
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={therapistForm.email}
                      onChange={(e) => setTherapistForm({...therapistForm, email: e.target.value})}
                      data-testid="add-therapist-email-input"
                      required
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={therapistForm.phone}
                      onChange={(e) => setTherapistForm({...therapistForm, phone: e.target.value})}
                      data-testid="add-therapist-phone-input"
                      className="mt-2"
                      placeholder="+91 1234567890"
                    />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select value={therapistForm.gender} onValueChange={(value) => setTherapistForm({...therapistForm, gender: value})}>
                      <SelectTrigger data-testid="add-therapist-gender-select" className="mt-2">
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
                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={therapistForm.password}
                    onChange={(e) => setTherapistForm({...therapistForm, password: e.target.value})}
                    data-testid="add-therapist-password-input"
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Specializations (comma-separated)</Label>
                  <Input
                    value={therapistForm.specialization}
                    onChange={(e) => setTherapistForm({...therapistForm, specialization: e.target.value})}
                    data-testid="add-therapist-specialization-input"
                    placeholder="Anxiety, Depression, Relationships"
                    required
                    className="mt-2"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Years of Experience</Label>
                    <Input
                      type="number"
                      value={therapistForm.experience}
                      onChange={(e) => setTherapistForm({...therapistForm, experience: Number(e.target.value)})}
                      data-testid="add-therapist-experience-input"
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Age</Label>
                    <Input
                      type="number"
                      value={therapistForm.age}
                      onChange={(e) => setTherapistForm({...therapistForm, age: Number(e.target.value)})}
                      data-testid="add-therapist-age-input"
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Chat Rate (coins/min)</Label>
                    <Input
                      type="number"
                      value={therapistForm.chat_rate}
                      onChange={(e) => setTherapistForm({...therapistForm, chat_rate: Number(e.target.value)})}
                      data-testid="add-therapist-chat-rate-input"
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Call Rate (coins/min)</Label>
                    <Input
                      type="number"
                      value={therapistForm.call_rate}
                      onChange={(e) => setTherapistForm({...therapistForm, call_rate: Number(e.target.value)})}
                      data-testid="add-therapist-call-rate-input"
                      required
                      className="mt-2"
                    />
                  </div>
                </div>
                <div>
                  <Label>Languages (comma-separated)</Label>
                  <Input
                    value={therapistForm.languages}
                    onChange={(e) => setTherapistForm({...therapistForm, languages: e.target.value})}
                    data-testid="add-therapist-languages-input"
                    placeholder="English, Spanish"
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Hobbies/Interests (comma-separated)</Label>
                  <Input
                    value={therapistForm.hobbies}
                    onChange={(e) => setTherapistForm({...therapistForm, hobbies: e.target.value})}
                    data-testid="add-therapist-hobbies-input"
                    placeholder="Reading, Yoga, Traveling"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={therapistForm.location}
                    onChange={(e) => setTherapistForm({...therapistForm, location: e.target.value})}
                    data-testid="add-therapist-location-input"
                    placeholder="India"
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Bio</Label>
                  <Textarea
                    value={therapistForm.bio}
                    onChange={(e) => setTherapistForm({...therapistForm, bio: e.target.value})}
                    data-testid="add-therapist-bio-input"
                    placeholder="Professional background and approach..."
                    required
                    className="mt-2"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Photo URL (optional)</Label>
                  <Input
                    value={therapistForm.photo}
                    onChange={(e) => setTherapistForm({...therapistForm, photo: e.target.value})}
                    data-testid="add-therapist-photo-input"
                    placeholder="https://..."
                    className="mt-2"
                  />
                </div>
                <Button type="submit" disabled={loading} data-testid="submit-add-therapist-btn" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                  {loading ? 'Creating...' : 'Create Therapist Account'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Therapist Dialog */}
        <Dialog open={showEditTherapist} onOpenChange={setShowEditTherapist}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Therapist Details</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateTherapist} className="space-y-4 mt-4">
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Email and password cannot be changed here. Contact support for account changes.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={therapistForm.phone}
                    onChange={(e) => setTherapistForm({...therapistForm, phone: e.target.value})}
                    className="mt-2"
                    placeholder="+91 1234567890"
                  />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select value={therapistForm.gender} onValueChange={(value) => setTherapistForm({...therapistForm, gender: value})}>
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
              <div>
                <Label>Specializations (comma-separated)</Label>
                <Input
                  value={therapistForm.specialization}
                  onChange={(e) => setTherapistForm({...therapistForm, specialization: e.target.value})}
                  required
                  className="mt-2"
                  placeholder="Anxiety, Depression, Relationships"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Years of Experience</Label>
                  <Input
                    type="number"
                    value={therapistForm.experience}
                    onChange={(e) => setTherapistForm({...therapistForm, experience: Number(e.target.value)})}
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Age</Label>
                  <Input
                    type="number"
                    value={therapistForm.age}
                    onChange={(e) => setTherapistForm({...therapistForm, age: Number(e.target.value)})}
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Chat Rate (coins/min)</Label>
                  <Input
                    type="number"
                    value={therapistForm.chat_rate}
                    onChange={(e) => setTherapistForm({...therapistForm, chat_rate: Number(e.target.value)})}
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Call Rate (coins/min)</Label>
                  <Input
                    type="number"
                    value={therapistForm.call_rate}
                    onChange={(e) => setTherapistForm({...therapistForm, call_rate: Number(e.target.value)})}
                    required
                    className="mt-2"
                  />
                </div>
              </div>
              <div>
                <Label>Languages (comma-separated)</Label>
                <Input
                  value={therapistForm.languages}
                  onChange={(e) => setTherapistForm({...therapistForm, languages: e.target.value})}
                  required
                  className="mt-2"
                  placeholder="English, Spanish"
                />
              </div>
              <div>
                <Label>Hobbies/Interests (comma-separated)</Label>
                <Input
                  value={therapistForm.hobbies}
                  onChange={(e) => setTherapistForm({...therapistForm, hobbies: e.target.value})}
                  className="mt-2"
                  placeholder="Reading, Yoga, Traveling"
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={therapistForm.location}
                  onChange={(e) => setTherapistForm({...therapistForm, location: e.target.value})}
                  required
                  className="mt-2"
                  placeholder="India"
                />
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea
                  value={therapistForm.bio}
                  onChange={(e) => setTherapistForm({...therapistForm, bio: e.target.value})}
                  required
                  className="mt-2"
                  rows={3}
                  placeholder="Professional background and approach..."
                />
              </div>
              <div>
                <Label>Photo URL (optional)</Label>
                <Input
                  value={therapistForm.photo}
                  onChange={(e) => setTherapistForm({...therapistForm, photo: e.target.value})}
                  className="mt-2"
                  placeholder="https://..."
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                {loading ? 'Updating...' : 'Update Therapist Details'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Balance Dialog */}
        <Dialog open={showEditBalance} onOpenChange={setShowEditBalance}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User Balance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>User: {selectedUser?.name}</Label>
                <p className="text-sm text-gray-600">{selectedUser?.email}</p>
              </div>
              <div>
                <Label>Current Balance: {selectedUser?.coins} coins</Label>
              </div>
              <div>
                <Label>New Balance</Label>
                <Input
                  type="number"
                  value={newBalance}
                  onChange={(e) => setNewBalance(Number(e.target.value))}
                  data-testid="edit-balance-input"
                  className="mt-2"
                  min="0"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEditBalance(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateBalance}
                  data-testid="update-balance-btn"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  Update Balance
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Stats Cards */}
        {analytics && (
          <div className="grid md:grid-cols-4 gap-6 mb-8" data-testid="admin-analytics">
            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Users</p>
                    <p className="text-3xl font-bold mt-1">{analytics.total_users}</p>
                  </div>
                  <Users className="w-12 h-12 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Total Therapists</p>
                    <p className="text-3xl font-bold mt-1">{analytics.total_therapists}</p>
                  </div>
                  <Activity className="w-12 h-12 text-purple-200" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Total Sessions</p>
                    <p className="text-3xl font-bold mt-1">{analytics.total_sessions}</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-orange-200" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500 to-teal-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Total Revenue</p>
                    <p className="text-3xl font-bold mt-1">{analytics.total_revenue}</p>
                  </div>
                  <DollarSign className="w-12 h-12 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs for Users and Therapists */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="users">All Users</TabsTrigger>
            <TabsTrigger value="therapists">Therapists</TabsTrigger>
            <TabsTrigger value="callhistory">Call History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="users-table">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Name</th>
                        <th className="text-left p-3 font-semibold">Email</th>
                        <th className="text-left p-3 font-semibold">Role</th>
                        <th className="text-left p-3 font-semibold">Coins</th>
                        <th className="text-left p-3 font-semibold">Joined</th>
                        <th className="text-left p-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{user.name}</td>
                          <td className="p-3">{user.email}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'client' ? 'bg-blue-100 text-blue-700' :
                              user.role === 'therapist' ? 'bg-purple-100 text-purple-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="p-3">{user.coins}</td>
                          <td className="p-3 text-sm text-gray-600">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditBalance(user)}
                                data-testid={`edit-balance-btn-${user.id}`}
                              >
                                Edit Balance
                              </Button>
                              {user.role !== 'admin' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteUser(user.id)}
                                  data-testid={`delete-user-btn-${user.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="therapists">
            <Card>
              <CardHeader>
                <CardTitle>Therapist Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4" data-testid="therapists-details-list">
                  {therapists.map((therapist) => (
                    <div key={therapist.user_id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                            {therapist.name?.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{therapist.name}</h3>
                            <p className="text-sm text-gray-600">{therapist.email}</p>
                            <div className="flex gap-2 mt-2">
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">{therapist.experience} years exp</span>
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">{therapist.hourly_rate} coins/min</span>
                              <span className={`px-2 py-1 rounded text-xs ${therapist.is_online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                {therapist.is_online ? 'Online' : 'Offline'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Earnings</p>
                          <p className="text-xl font-bold text-purple-700">{therapist.coins} coins</p>
                          <p className="text-xs text-gray-600 mt-1">Rating: {therapist.rating || 'N/A'} ⭐</p>
                          <p className="text-xs text-gray-600">{therapist.total_sessions} sessions</p>
                          <Button
                            size="sm"
                            onClick={() => openEditTherapist(therapist)}
                            data-testid={`edit-therapist-btn-${therapist.user_id}`}
                            className="mt-3 bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            Edit Details
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-700 mb-2">{therapist.bio}</p>
                        <div className="flex flex-wrap gap-2">
                          {therapist.specialization?.map((spec, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                              {spec}
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-2">
                          {therapist.languages?.map((lang, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {therapists.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No therapists yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="callhistory">
            <CallHistory role="admin" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;