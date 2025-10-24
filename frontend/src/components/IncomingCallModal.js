import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, User } from 'lucide-react';
import { Button } from './ui/button';

const IncomingCallModal = ({ session, onAccept, onDecline }) => {
  const audioRef = useRef(null);
  const [isVibrating, setIsVibrating] = useState(false);

  useEffect(() => {
    if (!session) return;

    // Play ringing sound continuously
    const audio = audioRef.current;
    if (audio) {
      audio.loop = true;
      audio.play().catch(e => console.log('Audio play failed:', e));
    }

    // Vibrate on mobile devices
    if ('vibrate' in navigator) {
      setIsVibrating(true);
      const vibratePattern = [500, 200, 500, 200, 500];
      const vibrateInterval = setInterval(() => {
        navigator.vibrate(vibratePattern);
      }, 2000);

      return () => {
        clearInterval(vibrateInterval);
        navigator.vibrate(0); // Stop vibration
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      };
    }

    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [session]);

  if (!session) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col items-center justify-center p-4 animate-pulse-slow">
      {/* Audio element for ringing */}
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHmq+8OOYSwsNUrDn77BdGAg+ltryxnMpBSh+zPLaizsIGGS57OihUhELTKXh8bllHAU2jdXzzn0vBSF1xe/glEIJFV624OytYBoGPJPY88p2KwUme8rx3I4+CRZiturqpVMRC0mi4PK8aB8GM4nU8tGAMQYfcsLu45ZFCxFYr+ftrWEaBkCY3PLJdSsFKH3L8tyOPQkWY7zs6qZUEQtJn9/yvmwhBTOJ1PLSgDEGH3HB7uOWRQsRV6/n7a1hGgZAl9zyyXUrBSh9y/LcjjwJFmO77OqmVBELSZ/f8r5sIQUzidTy0oAxBh9xwe7jlkULEVev5+2tYRoGQJfc8sl1KwUofcvy3I48CRZju+zqplQRC0mf3/K+bCEFM4nU8tKAMQYfccHu45ZFCxFXr+ftrWEaBkCX3PLJdSsFKH3L8tyOPAkWY7vs6qZUEQtJn9/yvmwhBTOJ1PLSgDEGH3HB7uOWRQsRV6/n7a1hGgZAl9zyyXUrBSh9y/LcjjwJFmO77OqmVBELSZ/f8r5sIQUzidTy0oAxBh9xwe7jlkULEVev5+2tYRoGQJfc8sl1KwUofcvy3I48CRZju+zqplQRC0mf3/K+bCEFM4nU8tKAMQYfccHu45ZFCxFXr+ftrWEaBkCX3PLJdSsFKH3L8tyOPAkWY7vs6qZUEQtJn9/yvmwhBTOJ1PLSgDEGH3HB7uOWRQsRV6/n7a1hGgZAl9zyyXUrBSh9y/LcjjwJFmO77OqmVBELSZ/f8r5sIQUzidTy0oAxBh9xwe7jlkULEVev5+2tYRoGQJfc8sl1KwUofcvy3I48CRZju+zqplQRC0mf3/K+bCEFM4nU8tKAMQYfccHu45ZFCxFXr+ftrWEaBkCX3PLJdSsFKH3L8tyOPAkWY7vs6qZUEQtJn9/yvmwhBTOJ1PLSgDEGH3HB7uOWRQ==" />
      
      {/* Caller Info */}
      <div className="text-center mb-8 animate-bounce-slow">
        <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <User className="w-16 h-16 md:w-20 md:h-20 text-blue-600" />
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
          {session.client_name || 'Unknown Caller'}
        </h2>
        <p className="text-xl md:text-2xl text-blue-100 mb-1">
          Incoming Call
        </p>
        <p className="text-lg text-blue-200">
          {session.session_type === 'chat' ? 'Chat Session' : 'Video Call'}
        </p>
      </div>

      {/* Animated rings */}
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-white rounded-full opacity-20 animate-ping"></div>
        <div className="absolute inset-0 bg-white rounded-full opacity-20 animate-ping animation-delay-500"></div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-6 md:space-x-8">
        {/* Decline Button */}
        <button
          onClick={onDecline}
          className="w-16 h-16 md:w-20 md:h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform active:scale-95"
        >
          <PhoneOff className="w-8 h-8 md:w-10 md:h-10 text-white" />
        </button>

        {/* Accept Button */}
        <button
          onClick={onAccept}
          className="w-16 h-16 md:w-20 md:h-20 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform active:scale-95 animate-pulse"
        >
          <Phone className="w-8 h-8 md:w-10 md:h-10 text-white" />
        </button>
      </div>

      <p className="text-white text-sm md:text-base mt-8 opacity-80">
        Swipe to answer or decline
      </p>
    </div>
  );
};

export default IncomingCallModal;
