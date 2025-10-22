import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff, User } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const VideoCall = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [agoraClient, setAgoraClient] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callRate, setCallRate] = useState(150);
  const [remoteUserConnected, setRemoteUserConnected] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const durationIntervalRef = useRef(null);
  const hasEndedRef = useRef(false);

  useEffect(() => {
    fetchSession();
    initializeAgora();
    
    // Start duration counter
    durationIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setCallDuration(elapsed);
    }, 1000);

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      cleanupAgora();
    };
  }, []);

  // Play local video when track is ready
  useEffect(() => {
    if (localVideoTrack && localVideoRef.current) {
      localVideoTrack.play(localVideoRef.current);
    }
  }, [localVideoTrack]);

  // Play remote video when users join
  useEffect(() => {
    if (remoteVideoRef.current && Object.keys(remoteUsers).length > 0) {
      const remoteUser = Object.values(remoteUsers)[0];
      if (remoteUser && remoteUser.videoTrack) {
        remoteUser.videoTrack.play(remoteVideoRef.current);
      }
    }
  }, [remoteUsers]);

  const fetchSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sessions/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const foundSession = response.data.find(s => s.id === sessionId);
      if (foundSession) {
        setSession(foundSession);
        
        // Get therapist rate
        const therapistRes = await axios.get(`${API}/therapists/${foundSession.therapist_id}`);
        const sessionType = foundSession.session_type || 'call';
        const rate = sessionType === 'chat' ? therapistRes.data.chat_rate : therapistRes.data.call_rate;
        setCallRate(rate || 150);
      }
    } catch (error) {
      toast.error('Failed to fetch session');
    }
  };

  const initializeAgora = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Get session info first
      const sessionsRes = await axios.get(`${API}/sessions/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const foundSession = sessionsRes.data.find(s => s.id === sessionId);
      
      if (!foundSession) {
        toast.error('Session not found');
        return;
      }

      // Generate Agora token
      const randomUid = Math.floor(Math.random() * 10000);
      const tokenRes = await axios.get(
        `${API}/agora/token?channel_name=${foundSession.channel_name}&user_id=${randomUid}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { app_id, token: agoraToken, channel_name } = tokenRes.data;

      // Create Agora client
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      setAgoraClient(client);

      // Set up event handlers
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        
        if (mediaType === 'video') {
          setRemoteUsers(prev => ({ ...prev, [user.uid]: user }));
          setRemoteUserConnected(true);
          toast.success('Other user connected!');
        }
        
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      });

      client.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          setRemoteUsers(prev => {
            const updated = { ...prev };
            delete updated[user.uid];
            return updated;
          });
        }
      });

      client.on('user-left', (user) => {
        console.log('User left:', user.uid);
        setRemoteUsers(prev => {
          const updated = { ...prev };
          delete updated[user.uid];
          return updated;
        });
        setRemoteUserConnected(false);
        
        // Auto end call when remote user leaves
        if (!hasEndedRef.current) {
          toast.info('Other user left the call');
          setTimeout(() => {
            if (!hasEndedRef.current) {
              handleAutoEndCall();
            }
          }, 2000);
        }
      });

      // Join channel
      await client.join(app_id, channel_name, agoraToken, randomUid);

      // Create and publish local tracks
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      
      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);

      // Publish tracks
      await client.publish([audioTrack, videoTrack]);

      toast.success('Connected to call!');
    } catch (error) {
      console.error('Agora initialization error:', error);
      toast.error('Failed to connect to call: ' + error.message);
    }
  };

  const cleanupAgora = async () => {
    try {
      if (localAudioTrack) {
        localAudioTrack.close();
      }
      if (localVideoTrack) {
        localVideoTrack.close();
      }
      if (agoraClient) {
        await agoraClient.leave();
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  const toggleMute = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleAutoEndCall = async () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    
    try {
      const token = localStorage.getItem('token');
      const durationMinutes = Math.ceil(callDuration / 60);
      
      await axios.post(`${API}/sessions/end`, {
        session_id: sessionId,
        duration_minutes: durationMinutes
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      await cleanupAgora();
      
      // Get user role to determine redirect
      const userRes = await axios.get(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (userRes.data.role === 'therapist') {
        navigate('/therapist');
      } else {
        navigate('/client');
      }
    } catch (error) {
      console.error('Auto end call error:', error);
      // Still navigate away even if API fails
      navigate('/client');
    }
  };

  const handleEndCall = async () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    
    try {
      const token = localStorage.getItem('token');
      const durationMinutes = Math.ceil(callDuration / 60);
      
      await axios.post(`${API}/sessions/end`, {
        session_id: sessionId,
        duration_minutes: durationMinutes
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success('Call ended');
      await cleanupAgora();
      
      // Get user role to determine redirect
      const userRes = await axios.get(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (userRes.data.role === 'therapist') {
        navigate('/therapist');
      } else {
        navigate('/client');
      }
    } catch (error) {
      toast.error('Failed to end call: ' + (error.response?.data?.detail || error.message));
      console.error('End call error:', error);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 relative" data-testid="video-call-page">
      {/* Remote Video (Full Screen) */}
      <div className="absolute inset-0">
        <div 
          ref={remoteVideoRef} 
          data-testid="remote-video-container"
          className="w-full h-full bg-gray-800 flex items-center justify-center"
        >
          {Object.keys(remoteUsers).length === 0 && (
            <div className="text-center text-white">
              <User className="w-24 h-24 mx-auto mb-4 opacity-50" />
              <p className="text-xl">Waiting for therapist to join...</p>
            </div>
          )}
        </div>
      </div>

      {/* Local Video (Picture-in-Picture) */}
      <div className="absolute top-6 right-6 w-64 h-48 bg-gray-800 rounded-xl overflow-hidden border-4 border-white shadow-2xl z-10">
        <div 
          ref={localVideoRef} 
          data-testid="local-video-container"
          className="w-full h-full"
        />
        {isVideoOff && (
          <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
            <VideoOff className="w-12 h-12 text-white opacity-50" />
          </div>
        )}
      </div>

      {/* Call Info */}
      <div className="absolute top-6 left-6 bg-black/50 backdrop-blur-md text-white px-6 py-4 rounded-xl z-10">
        <p className="text-sm opacity-75">Session Duration</p>
        <p className="text-3xl font-bold" data-testid="call-duration">{formatDuration(callDuration)}</p>
        <p className="text-sm mt-2 opacity-75">Rate: {callRate} coins/min</p>
        <p className="text-sm opacity-75">Cost: {Math.ceil(callDuration / 60) * callRate} coins</p>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-10">
        <Button
          onClick={toggleMute}
          data-testid="toggle-mute-btn"
          className={`w-16 h-16 rounded-full ${
            isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
          } text-white`}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </Button>
        
        <Button
          onClick={handleEndCall}
          data-testid="end-call-btn"
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white"
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
        
        <Button
          onClick={toggleVideo}
          data-testid="toggle-video-btn"
          className={`w-16 h-16 rounded-full ${
            isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
          } text-white`}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
        </Button>
      </div>
    </div>
  );
};

export default VideoCall;