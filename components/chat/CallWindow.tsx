"use client";

import React, { useRef, useState, useEffect } from 'react';
import { useChatContext } from '@/context/ChatContext';
import { useWebRTC } from '@/hooks/useWebRTC';
import { CallControls } from './CallControls';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CallWindowProps {
  callState: {
    isActive: boolean;
    type: 'audio' | 'video' | null;
    direction: 'incoming' | 'outgoing' | 'accepted' | null;
    remoteUserId: number | null;
    remoteUserName: string | null;
    conversationId: number | null;
    hasAccepted: boolean;
  };
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  className?: string;
}

export const CallWindow: React.FC<CallWindowProps> = ({
  callState,
  onAccept,
  onReject,
  onEnd,
  className
}) => {
  const { socket } = useChatContext();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const callStartTimeRef = useRef<number | null>(null);
  const offerCreatedRef = useRef(false); // Track if offer was created
  const [historyCall, setHistoryCall] = useState<any>(null);
  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const callWindowRef = useRef<HTMLDivElement>(null);

  const {
    isAudioEnabled,
    isVideoEnabled,
    connectionState,
    createOffer,
    handleOffer,
    handleAnswer,
    handleCandidate,
    toggleAudio,
    toggleVideo,
    cleanup
  } = useWebRTC({
    socket,
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,
    callType: callState.type || 'audio',
    isCallActive: callState.isActive
  });

  // Handle socket events for WebRTC signaling
  useEffect(() => {
    if (!socket || !callState.isActive) return;

    const handleWebRTCOffer = async ({ fromUserId, offer }: any) => {
      console.log('📞 Received WebRTC offer from:', fromUserId);
      await handleOffer(fromUserId, offer);
    };

    const handleWebRTCAnswer = async ({ answer }: any) => {
      console.log('📞 Received WebRTC answer');
      await handleAnswer(answer);
    };

    const handleWebRTCCandidate = async ({ candidate }: any) => {
      console.log('🧊 Received ICE candidate');
      await handleCandidate(candidate);
    };

    socket.on('webrtc:offer', handleWebRTCOffer);
    socket.on('webrtc:answer', handleWebRTCAnswer);
    socket.on('webrtc:candidate', handleWebRTCCandidate);

    return () => {
      socket.off('webrtc:offer', handleWebRTCOffer);
      socket.off('webrtc:answer', handleWebRTCAnswer);
      socket.off('webrtc:candidate', handleWebRTCCandidate);
    };
  }, [socket, callState.isActive, handleOffer, handleAnswer, handleCandidate]);

  // Handle call acceptance
  const handleAcceptCall = async () => {
    console.log('📞 Accepting call...');
    onAccept(); // This sends call:accept via socket
    // Note: createOffer will be triggered by the caller, we'll receive offer and send answer
  };

  // Track WebRTC connection state and start timer when connected
  useEffect(() => {
    if (connectionState === 'connected' && !isConnected) {
      console.log('✅ Call connected! Starting timer...');
      setIsConnected(true);
      if (!callStartTimeRef.current) {
        callStartTimeRef.current = Date.now();
      }
    } else if (connectionState === 'disconnected' || connectionState === 'failed') {
      console.log('❌ Call disconnected');
      setIsConnected(false);
    }
  }, [connectionState, isConnected]);
  
  useEffect(() => {
    // Only create offer once after the remote user accepts the call
    if (callState.isActive && 
        callState.direction === 'accepted' && 
        callState.remoteUserId &&
        !offerCreatedRef.current) {
      console.log('📤 Call accepted! Creating WebRTC offer for user:', callState.remoteUserId);
      offerCreatedRef.current = true; // Mark as created to prevent duplicate calls
      createOffer(callState.remoteUserId);
    }
    
    // Reset flag when call becomes inactive
    if (!callState.isActive) {
      offerCreatedRef.current = false;
    }
  }, [callState.isActive, callState.direction, callState.remoteUserId, createOffer]);

  // Call duration timer
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      if (callStartTimeRef.current) {
        const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        setCallDuration(duration);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      callStartTimeRef.current = null;
      setCallDuration(0);
      setIsConnected(false);
    };
  }, [cleanup]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    cleanup();
    callStartTimeRef.current = null;
    setCallDuration(0);
    setIsConnected(false);
    onEnd();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Center window on mount
  useEffect(() => {
    if (!isFullscreen && callWindowRef.current) {
      const rect = callWindowRef.current.getBoundingClientRect();
      setPosition({
        x: (window.innerWidth - rect.width) / 2,
        y: (window.innerHeight - rect.height) / 2
      });
    }
  }, [callState.isActive, isFullscreen]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isFullscreen) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isFullscreen) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, isFullscreen]);

  if (!callState.isActive) return null;

  const isIncoming = callState.direction === 'incoming' && !callState.hasAccepted;
  const isVideoCall = callState.type === 'video';

  return (
    <div
      ref={callWindowRef}
      className={cn(
        "fixed bg-gray-900 shadow-2xl flex flex-col transition-all",
        isFullscreen
          ? "inset-0 z-50"
          : isMinimized
          ? "z-50 w-80 h-24 rounded-lg overflow-hidden"
          : "z-50 w-[500px] h-[700px] rounded-lg overflow-hidden",
        isDragging && "cursor-move",
        className
      )}
      style={
        !isFullscreen
          ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
              transform: 'none'
            }
          : undefined
      }
    >
      {/* Draggable Header */}
      {!isFullscreen && (
        <div
          className="bg-gray-800 px-4 py-2 flex items-center justify-between cursor-move border-b border-gray-700"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-white">
              {callState.remoteUserName || 'Cuộc gọi'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleMinimize}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <span className="text-white text-xs">_</span>
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <span className="text-white text-xs">□</span>
            </button>
          </div>
        </div>
      )}

      {/* Minimized View */}
      {isMinimized ? (
        <div className="flex-1 flex items-center justify-between px-4 bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <Phone className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-white font-medium">{callState.remoteUserName}</div>
              <div className="text-sm text-gray-400">{formatDuration(callDuration)}</div>
            </div>
          </div>
          <button
            onClick={handleEndCall}
            className="bg-red-600 hover:bg-red-700 p-2 rounded-full"
          >
            <Phone className="h-5 w-5 text-white transform rotate-135" />
          </button>
        </div>
      ) : (
        <>
          {/* Remote Video (or avatar for audio call) */}
          <div className="flex-1 relative bg-gray-800">
            {isVideoCall ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted={false}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Avatar className="h-32 w-32 mb-6">
                  <AvatarFallback className="bg-gray-700 text-white text-4xl">
                    <User className="h-16 w-16" />
                  </AvatarFallback>
                </Avatar>
            <div className="text-white text-center">
              <div className="text-2xl font-semibold mb-2">
                {callState.remoteUserName || 'Đang gọi...'}
              </div>
              {isConnected ? (
                <div className="text-lg text-green-400 font-mono">
                  {formatDuration(callDuration)}
                </div>
              ) : isIncoming ? (
                <div className="text-sm text-gray-400">
                  Cuộc gọi đến...
                </div>
              ) : (
                <div className="text-sm text-gray-400 animate-pulse">
                  Đang kết nối...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Local Video (Picture-in-Picture for video calls) */}
        {isVideoCall && (
          <div className="absolute top-4 right-4 w-32 h-24 rounded-lg overflow-hidden shadow-lg border-2 border-white">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
          </div>
        )}

        {/* Status indicators */}
        {isVideoCall && isConnected && (
          <div className="absolute top-4 left-4 bg-black/70 px-4 py-2 rounded-full text-white text-sm font-mono">
            {formatDuration(callDuration)}
          </div>
        )}

        {!isConnected && !isIncoming && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white text-center">
              <div className="animate-pulse mb-4">
                <Phone className="h-12 w-12 mx-auto" />
              </div>
              <div className="text-lg">Đang kết nối...</div>
            </div>
          </div>
        )}

        {isIncoming && !isConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-white text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarFallback className="bg-gray-700 text-white text-2xl">
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <div className="text-2xl font-semibold mb-2">
                {callState.remoteUserName || 'Người dùng'}
              </div>
              <div className="text-sm text-gray-300 mb-6">
                {isVideoCall ? 'Cuộc gọi video đến' : 'Cuộc gọi thoại đến'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-6 flex items-center justify-center">
        <CallControls
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={isVideoEnabled}
            callType={callState.type || 'audio'}
            isFullscreen={isFullscreen}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onEndCall={handleEndCall}
            onAcceptCall={handleAcceptCall}
            onRejectCall={onReject}
            onToggleFullscreen={isVideoCall ? toggleFullscreen : undefined}
            isIncoming={isIncoming}
          />
        </div>

        {/* Audio-only: Hidden video element for local stream and audio element for remote */}
        {!isVideoCall && (
          <>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="hidden"
            />
            <audio
              ref={remoteAudioRef}
              autoPlay
              playsInline
              className="hidden"
            />
          </>
        )}
      </>
      )}

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};
