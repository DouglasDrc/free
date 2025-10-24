import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Video from 'twilio-video';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff, User } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const VideoCall = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [room, setRoom] = useState(null);
  const [localTrack, setLocalTrack] = useState(null);
  const [remoteParticipants, setRemoteParticipants] = useState(new Map());
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
    joinRoom();
    
    // Start duration counter
    durationIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setCallDuration(elapsed);
    }, 1000);

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      cleanupTwilio();
    };
  }, []);

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
      console.error('Failed to fetch session:', error);
    }
  };

  const joinRoom = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Get user info to check role
      const userRes = await axios.get(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const currentUser = userRes.data;
      
      // Get session info
      const sessionsRes = await axios.get(`${API}/sessions/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const foundSession = sessionsRes.data.find(s => s.id === sessionId);
      
      if (!foundSession) {
        toast.error('Session not found');
        return;
      }

      // If therapist, mark session as accepted (billing starts now)
      if (currentUser.role === 'therapist') {
        try {
          await axios.post(`${API}/sessions/accept`, {
            session_id: sessionId
          }, { headers: { Authorization: `Bearer ${token}` } });
          console.log('Session accepted - billing started');
          toast.success('Call accepted - billing started');
        } catch (error) {
          console.error('Failed to accept session:', error);
          // Continue with video call even if accept fails
        }
      }

      // Get Twilio token
      const tokenRes = await axios.get(
        `${API}/twilio/token?room_name=${foundSession.channel_name}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { token: twilioToken, room_name } = tokenRes.data;

      // Connect to Twilio Video room
      const connectedRoom = await Video.connect(twilioToken, {
        name: room_name,
        audio: true,
        video: { width: 640 }
      });

      setRoom(connectedRoom);

      // Attach local tracks
      connectedRoom.localParticipant.videoTracks.forEach(publication => {
        if (localVideoRef.current) {
          const track = publication.track;
          localVideoRef.current.appendChild(track.attach());
          setLocalTrack(track);
        }
      });

      // Handle existing participants
      connectedRoom.participants.forEach(participant => {
        participantConnected(participant);
      });

      // Handle new participants
      connectedRoom.on('participantConnected', participant => {
        console.log('Participant connected:', participant.identity);
        participantConnected(participant);
      });

      connectedRoom.on('participantDisconnected', participant => {
        console.log('Participant disconnected:', participant.identity);
        participantDisconnected(participant);
      });

      toast.success('Connected to call!');
    } catch (error) {
      console.error('Twilio connection error:', error);
      toast.error('Failed to connect: ' + error.message);
    }
  };

  const participantConnected = (participant) => {
    setRemoteParticipants(prev => new Map(prev).set(participant.sid, participant));
    setRemoteUserConnected(true);
    toast.success('Other user connected!');

    // Attach existing tracks
    participant.tracks.forEach(publication => {
      if (publication.isSubscribed) {
        attachTrack(publication.track);
      }
    });

    // Handle new tracks
    participant.on('trackSubscribed', track => {
      attachTrack(track);
    });

    participant.on('trackUnsubscribed', track => {
      detachTrack(track);
    });
  };

  const participantDisconnected = (participant) => {
    setRemoteParticipants(prev => {
      const newMap = new Map(prev);
      newMap.delete(participant.sid);
      return newMap;
    });
    
    setRemoteUserConnected(false);
    toast.info('Other user left the call');
    
    // Auto-end call after disconnect
    if (!hasEndedRef.current) {
      setTimeout(() => {
        if (!hasEndedRef.current) {
          handleAutoEndCall();
        }
      }, 2000);
    }
  };

  const attachTrack = (track) => {
    if (track.kind === 'video' && remoteVideoRef.current) {
      const existingElements = remoteVideoRef.current.getElementsByTagName(track.kind);
      Array.from(existingElements).forEach(el => el.remove());
      remoteVideoRef.current.appendChild(track.attach());
    } else if (track.kind === 'audio') {
      track.attach();
    }
  };

  const detachTrack = (track) => {
    track.detach().forEach(element => element.remove());
  };

  const cleanupTwilio = () => {
    try {
      if (room) {
        room.disconnect();
      }
      console.log('Twilio cleanup complete');
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  const toggleMute = () => {
    if (room) {
      room.localParticipant.audioTracks.forEach(publication => {
        if (isMuted) {
          publication.track.enable();
        } else {
          publication.track.disable();
        }
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (room) {
      room.localParticipant.videoTracks.forEach(publication => {
        if (isVideoOff) {
          publication.track.enable();
        } else {
          publication.track.disable();
        }
      });
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
      
      cleanupTwilio();
      
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
      navigate('/client');
    }
  };

  const handleEndCall = async () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    
    try {
      const token = localStorage.getItem('token');
      
      // Backend will calculate duration based on therapist_joined_time
      await axios.post(`${API}/sessions/end`, {
        session_id: sessionId
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success('Call ended');
      cleanupTwilio();
      
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
          {!remoteUserConnected && (
            <div className="text-center text-white">
              <User className="w-24 h-24 mx-auto mb-4 opacity-50" />
              <p className="text-xl">Waiting for other person to join...</p>
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
        {!remoteUserConnected && (
          <p className="text-sm mt-2 text-yellow-400 animate-pulse">⏳ Waiting for other person...</p>
        )}
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