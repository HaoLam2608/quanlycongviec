"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useChatContext } from '@/context/ChatContext';
import { CallWindow } from './CallWindow';

export const GlobalCallManager: React.FC = () => {
  const { socket } = useChatContext();
  const [callState, setCallState] = useState<{
    isActive: boolean;
    type: 'audio' | 'video' | null;
    direction: 'incoming' | 'outgoing' | 'accepted' | null;
    remoteUserId: number | null;
    remoteUserName: string | null;
    conversationId: number | null;
    hasAccepted: boolean;
  }>({
    isActive: false,
    type: null,
    direction: null,
    remoteUserId: null,
    remoteUserName: null,
    conversationId: null,
    hasAccepted: false
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  // Play ringtone for incoming calls (fast pulse)
  const playRingtone = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch (e) {}
      }
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = 800; // 800Hz for incoming call
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      
      // Fast pulse for incoming call (500ms)
      const pulseInterval = setInterval(() => {
        if (gainNode.gain.value === 0.3) {
          gainNode.gain.value = 0;
        } else {
          gainNode.gain.value = 0.3;
        }
      }, 500);
      
      oscillatorRef.current = oscillator;
      (oscillator as any).pulseInterval = pulseInterval;
    } catch (error) {
      console.error('Error playing ringtone:', error);
    }
  }, []);

  // Play ringback tone for outgoing calls (slow pulse, lower frequency)
  const playRingbackTone = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch (e) {}
      }
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = 440; // 440Hz (A note) for ringback
      oscillator.type = 'sine';
      gainNode.gain.value = 0.2;
      
      oscillator.start();
      
      // Slower pulse for outgoing call (1000ms)
      const pulseInterval = setInterval(() => {
        if (gainNode.gain.value === 0.2) {
          gainNode.gain.value = 0;
        } else {
          gainNode.gain.value = 0.2;
        }
      }, 1000);
      
      oscillatorRef.current = oscillator;
      (oscillator as any).pulseInterval = pulseInterval;
    } catch (error) {
      console.error('Error playing ringback tone:', error);
    }
  }, []);

  const stopRingtone = useCallback(() => {
    if (oscillatorRef.current) {
      clearInterval((oscillatorRef.current as any).pulseInterval);
      try {
        oscillatorRef.current.stop();
      } catch (e) {}
      oscillatorRef.current = null;
    }
  }, []);

  const acceptCall = useCallback(() => {
    if (!socket || !callState.remoteUserId || !callState.conversationId) return;

    console.log('✅ Accepting call from:', callState.remoteUserId);
    stopRingtone();
    
    setCallState(prev => ({
      ...prev,
      hasAccepted: true
    }));
    
    socket.emit('call:accept', {
      toUserId: callState.remoteUserId,
      conversationId: callState.conversationId
    });
  }, [socket, callState.remoteUserId, callState.conversationId, stopRingtone]);

  const rejectCall = useCallback(() => {
    if (!socket || !callState.remoteUserId || !callState.conversationId) return;

    stopRingtone();

    socket.emit('call:reject', {
      toUserId: callState.remoteUserId,
      conversationId: callState.conversationId
    });

    setCallState({
      isActive: false,
      type: null,
      direction: null,
      remoteUserId: null,
      remoteUserName: null,
      conversationId: null,
      hasAccepted: false
    });
  }, [socket, callState.remoteUserId, callState.conversationId, stopRingtone]);

  const endCall = useCallback(() => {
    if (socket && callState.remoteUserId) {
      socket.emit('call:end', {
        toUserId: callState.remoteUserId
      });
    }

    stopRingtone();

    setCallState({
      isActive: false,
      type: null,
      direction: null,
      remoteUserId: null,
      remoteUserName: null,
      conversationId: null,
      hasAccepted: false
    });
  }, [socket, callState.remoteUserId, stopRingtone]);

  // Handle incoming calls
  useEffect(() => {
    if (!socket) return;

    // Handle custom event from FloatingChatBox for outgoing calls
    const handleCallStart = (event: CustomEvent) => {
      const { toUserId, toUserName, conversationId, callType } = event.detail;
      console.log('📞 Starting outgoing call to:', toUserName);
      setCallState({
        isActive: true,
        type: callType,
        direction: 'outgoing',
        remoteUserId: toUserId,
        remoteUserName: toUserName,
        conversationId,
        hasAccepted: false
      });
      
      // Play ringback tone for outgoing call
      playRingbackTone();
    };

    const handleOutgoingCall = ({ toUserId, toUserName, conversationId, callType }: any) => {
      console.log('📞 Starting outgoing call to:', toUserName);
      setCallState({
        isActive: true,
        type: callType,
        direction: 'outgoing',
        remoteUserId: toUserId,
        remoteUserName: toUserName,
        conversationId,
        hasAccepted: false
      });
      
      // Play ringback tone for outgoing call
      playRingbackTone();
    };

    const handleIncomingCall = ({ fromUserId, fromName, conversationId, callType }: any) => {
      console.log('📞 Incoming call from:', fromName);
      setCallState({
        isActive: true,
        type: callType,
        direction: 'incoming',
        remoteUserId: fromUserId,
        remoteUserName: fromName,
        conversationId,
        hasAccepted: false
      });

      // Play ringtone for incoming call
      playRingtone();
    };

    const handleCallAccepted = ({ fromUserId }: any) => {
      console.log('✅ Call accepted by:', fromUserId);
      
      // Stop ringback tone for caller
      stopRingtone();
      
      // Only update to 'accepted' if we are the caller (outgoing)
      setCallState(prev => {
        if (prev.direction === 'outgoing') {
          console.log('📤 We are caller, switching to accepted to trigger offer');
          return {
            ...prev,
            direction: 'accepted'
          };
        }
        // If we are the receiver (incoming), don't change direction
        console.log('📥 We are receiver, staying in incoming state');
        return prev;
      });
    };

    const handleCallRejected = ({ fromUserId }: any) => {
      console.log('❌ Call rejected by:', fromUserId);
      alert('Cuộc gọi đã bị từ chối');
      endCall();
    };

    const handleCallEnded = ({ fromUserId }: any) => {
      console.log('📵 Call ended by:', fromUserId);
      endCall();
    };

    // Listen to custom event
    window.addEventListener('call:start', handleCallStart as EventListener);

    socket.on('call:outgoing', handleOutgoingCall);
    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:ended', handleCallEnded);

    return () => {
      window.removeEventListener('call:start', handleCallStart as EventListener);
      socket.off('call:outgoing', handleOutgoingCall);
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:ended', handleCallEnded);
      stopRingtone();
    };
  }, [socket, playRingtone, playRingbackTone, stopRingtone, endCall]);

  if (!callState.isActive) return null;

  return (
    <CallWindow
      callState={callState}
      onAccept={acceptCall}
      onReject={rejectCall}
      onEnd={endCall}
    />
  );
};
