import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Clock, CoinsIcon, User, Phone, Video, Calendar } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CallHistory = ({ role, userId }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCallHistory();
  }, []);

  const fetchCallHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let endpoint = '/sessions/history';
      
      if (role === 'admin') {
        endpoint = '/admin/sessions/all';
      }
      
      const response = await axios.get(`${API}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter completed sessions only
      const completedSessions = response.data.filter(s => s.status === 'completed');
      setSessions(completedSessions);
    } catch (error) {
      toast.error('Failed to load call history');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  const getSessionTypeIcon = (type) => {
    return type === 'call' ? <Phone className="w-4 h-4" /> : <Video className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Call History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Call History ({sessions.length} calls)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No call history yet
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left side - Session info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getSessionTypeIcon(session.session_type)}
                      <span className="font-semibold text-gray-900 capitalize">
                        {session.session_type || 'Call'}
                      </span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Completed
                      </span>
                    </div>
                    
                    {/* Names for admin */}
                    {role === 'admin' && (
                      <div className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Client:</span> {session.client_name || 'Unknown'} | 
                        <span className="font-medium ml-2">Therapist:</span> {session.therapist_name || 'Unknown'}
                      </div>
                    )}
                    
                    {/* Name for client */}
                    {role === 'client' && session.therapist_name && (
                      <div className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Therapist:</span> {session.therapist_name}
                      </div>
                    )}
                    
                    {/* Name for therapist */}
                    {role === 'therapist' && session.client_name && (
                      <div className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Client:</span> {session.client_name}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateTime(session.start_time)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {session.duration_minutes} min
                      </div>
                    </div>
                  </div>

                  {/* Right side - Coins info */}
                  <div className="flex flex-col md:items-end gap-2">
                    {/* For admin - show all three */}
                    {role === 'admin' && (
                      <>
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <CoinsIcon className="w-4 h-4" />
                          <span className="font-bold">-{session.coins_spent}</span>
                          <span className="text-xs">(Client)</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <CoinsIcon className="w-4 h-4" />
                          <span className="font-bold">+{session.therapist_earnings || (session.duration_minutes * 30)}</span>
                          <span className="text-xs">(Therapist)</span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-600 text-sm">
                          <CoinsIcon className="w-4 h-4" />
                          <span className="font-bold">+{session.admin_commission || (session.duration_minutes * 70)}</span>
                          <span className="text-xs">(Commission)</span>
                        </div>
                      </>
                    )}
                    
                    {/* For client - show deduction */}
                    {role === 'client' && (
                      <div className="flex items-center gap-2 text-red-600">
                        <CoinsIcon className="w-5 h-5" />
                        <div className="text-right">
                          <p className="font-bold text-lg">-{session.coins_spent}</p>
                          <p className="text-xs text-gray-500">coins deducted</p>
                          <p className="text-xs text-gray-400">@100/min</p>
                        </div>
                      </div>
                    )}
                    
                    {/* For therapist - show earning */}
                    {role === 'therapist' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CoinsIcon className="w-5 h-5" />
                        <div className="text-right">
                          <p className="font-bold text-lg">+{session.therapist_earnings || (session.duration_minutes * 30)}</p>
                          <p className="text-xs text-gray-500">coins earned</p>
                          <p className="text-xs text-gray-400">@30/min</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CallHistory;
