"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';

interface UseWebRTCProps {
  socket: Socket | null;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  remoteAudioRef?: React.RefObject<HTMLAudioElement>;
  callType: 'audio' | 'video';
  isCallActive: boolean;
}

export const useWebRTC = ({
  socket,
  localVideoRef,
  remoteVideoRef,
  remoteAudioRef,
  callType,
  isCallActive
}: UseWebRTCProps) => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);

  // ICE servers configuration (using Google's STUN server)
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  // Initialize local media stream
  const initializeLocalStream = useCallback(async () => {
    try {
      // If stream already exists and is active, reuse it
      if (localStream && localStream.active) {
        console.log('♻️ Reusing existing local stream:', {
          audioTracks: localStream.getAudioTracks().length,
          videoTracks: localStream.getVideoTracks().length,
          active: localStream.active
        });
        return localStream;
      }

      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false
      };

      console.log('🎤 Requesting media with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Media stream obtained:', {
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length,
        tracks: stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, muted: t.muted }))
      });
      
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('📹 Local stream set to video element');
      }

      return stream;
    } catch (error) {
      console.error('❌ Error accessing media devices:', error);
      throw error;
    }
  }, [callType, localVideoRef, localStream]);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const pc = new RTCPeerConnection(iceServers);
    peerConnectionRef.current = pc;


    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        const remoteUserId = (pc as any).remoteUserId;
        if (remoteUserId) {
          socket.emit('webrtc:candidate', {
            toUserId: remoteUserId,
            candidate: event.candidate
          });
        }
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('TRACK RECEIVED:', event.track.kind, 'enabled:', event.track.enabled, 'readyState:', event.track.readyState);
      const [stream] = event.streams;
      console.log('REMOTE STREAM:', {
        id: stream.id,
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length,
        active: stream.active
      });
      setRemoteStream(stream);
      
      // Use audio element for audio calls, video element for video calls
      if (callType === 'audio' && remoteAudioRef?.current) {
        console.log('AUDIO CALL: Setting srcObject to audio element');
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.volume = 1.0;
        console.log('AUDIO ELEMENT:', {
          src: remoteAudioRef.current.src,
          volume: remoteAudioRef.current.volume,
          muted: remoteAudioRef.current.muted,
          paused: remoteAudioRef.current.paused
        });
        remoteAudioRef.current.play().then(() => {
          console.log('AUDIO PLAYBACK STARTED');
        }).catch(err => {
          console.error('AUDIO PLAYBACK ERROR:', err);
        });
      } else if (callType === 'video' && remoteVideoRef.current) {
        console.log('VIDEO CALL: Setting srcObject to video element');
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.muted = false; // Ensure not muted
        remoteVideoRef.current.volume = 1.0; // Max volume
        console.log('VIDEO ELEMENT:', {
          muted: remoteVideoRef.current.muted,
          volume: remoteVideoRef.current.volume,
          audioTracks: stream.getAudioTracks().map(t => ({
            enabled: t.enabled,
            muted: t.muted,
            readyState: t.readyState
          }))
        });
        remoteVideoRef.current.play().then(() => {
          console.log('VIDEO PLAYBACK STARTED');
        }).catch(err => {
          console.error('VIDEO PLAYBACK ERROR:', err);
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('🔄 Connection state:', pc.connectionState);
      setConnectionState(pc.connectionState);
      if (pc.connectionState === 'connected') {
        console.log('✅ WebRTC connection established!');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.error('❌ Peer connection failed or disconnected');
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        console.log('✅ ICE connection successful!');
      }
    };

    return pc;
  }, [socket, remoteVideoRef, remoteAudioRef, callType]);

  // Create and send offer
  const createOffer = useCallback(async (toUserId: number) => {
    try {
      console.log('📤 [createOffer] Starting offer creation for user:', toUserId);
      const stream = await initializeLocalStream();
      console.log('📤 [createOffer] Local stream initialized:', stream.getTracks().map(t => t.kind));
      
      const pc = createPeerConnection();
      (pc as any).remoteUserId = toUserId;

      // Check if tracks are already added to avoid "sender already exists" error
      const existingSenders = pc.getSenders();
      const existingTrackIds = existingSenders.map(sender => sender.track?.id).filter(Boolean);
      
      // Add local stream tracks to peer connection (only if not already added)
      stream.getTracks().forEach(track => {
        if (!existingTrackIds.includes(track.id)) {
          console.log('📤 [createOffer] Adding track:', track.kind, track.id);
          pc.addTrack(track, stream);
        } else {
          console.log('♻️ [createOffer] Track already added:', track.kind, track.id);
        }
      });

      console.log('📤 [createOffer] Creating offer...');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('📤 [createOffer] Offer created and set as local description');

      if (socket) {
        console.log('📤 [createOffer] Emitting webrtc:offer to user:', toUserId);
        socket.emit('webrtc:offer', {
          toUserId,
          offer: offer
        });
      }
    } catch (error) {
      console.error('❌ [createOffer] Error:', error);
      throw error;
    }
  }, [socket, initializeLocalStream, createPeerConnection]);

  // Handle incoming offer
  const handleOffer = useCallback(async (fromUserId: number, offer: RTCSessionDescriptionInit) => {
    try {
      console.log('📥 [handleOffer] Received offer from user:', fromUserId);
      const stream = await initializeLocalStream();
      console.log('📥 [handleOffer] Local stream initialized:', stream.getTracks().map(t => t.kind));
      
      const pc = createPeerConnection();
      (pc as any).remoteUserId = fromUserId;

      // Check if tracks are already added to avoid "sender already exists" error
      const existingSenders = pc.getSenders();
      const existingTrackIds = existingSenders.map(sender => sender.track?.id).filter(Boolean);

      // Add local stream tracks (only if not already added)
      stream.getTracks().forEach(track => {
        if (!existingTrackIds.includes(track.id)) {
          console.log('📥 [handleOffer] Adding track:', track.kind, track.id);
          pc.addTrack(track, stream);
        } else {
          console.log('♻️ [handleOffer] Track already added:', track.kind, track.id);
        }
      });

      console.log('📥 [handleOffer] Setting remote description...');
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Add any pending ICE candidates
      console.log('📥 [handleOffer] Pending candidates:', pendingCandidatesRef.current.length);
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(candidate);
      }
      pendingCandidatesRef.current = [];

      console.log('📥 [handleOffer] Creating answer...');
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('📥 [handleOffer] Answer created and set as local description');

      if (socket) {
        console.log('📥 [handleOffer] Emitting webrtc:answer to user:', fromUserId);
        socket.emit('webrtc:answer', {
          toUserId: fromUserId,
          answer: answer
        });
      }
    } catch (error) {
      console.error('❌ [handleOffer] Error:', error);
      throw error;
    }
  }, [socket, initializeLocalStream, createPeerConnection]);

  // Handle incoming answer
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    try {
      console.log('📥 [handleAnswer] Received answer');
      const pc = peerConnectionRef.current;
      if (!pc) {
        console.error('❌ [handleAnswer] No peer connection found');
        return;
      }

      console.log('📥 [handleAnswer] Setting remote description...');
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('✅ [handleAnswer] Remote description set');

      // Add any pending ICE candidates
      console.log('📥 [handleAnswer] Pending candidates:', pendingCandidatesRef.current.length);
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(candidate);
      }
      pendingCandidatesRef.current = [];
    } catch (error) {
      console.error('❌ [handleAnswer] Error:', error);
    }
  }, []);

  // Handle incoming ICE candidate
  const handleCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    try {
      const pc = peerConnectionRef.current;
      
      if (!pc) {
        console.warn('No peer connection, storing candidate');
        pendingCandidatesRef.current.push(new RTCIceCandidate(candidate));
        return;
      }

      if (!pc.remoteDescription) {
        console.warn('No remote description yet, storing candidate');
        pendingCandidatesRef.current.push(new RTCIceCandidate(candidate));
        return;
      }

      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, [localStream]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, [localStream]);

  // Cleanup
  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up WebRTC resources');
    
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
      });
      setLocalStream(null);
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear remote stream
    setRemoteStream(null);

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (remoteAudioRef?.current) {
      remoteAudioRef.current.srcObject = null;
    }

    // Clear pending candidates
    pendingCandidatesRef.current = [];
  }, []); // Remove dependencies to prevent cleanup loop

  // Cleanup on unmount or when call becomes inactive
  useEffect(() => {
    console.log('CALL ACTIVE STATE CHANGED:', isCallActive);
    if (!isCallActive) {
      console.log('Call inactive - triggering cleanup');
      cleanup();
    }
    
    return () => {
      console.log('useWebRTC unmounting - cleanup');
      // Only cleanup on unmount, not on every re-render
      if (!isCallActive) {
        cleanup();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCallActive]); // Intentionally omit cleanup from deps to prevent loops

  return {
    isAudioEnabled,
    isVideoEnabled,
    localStream,
    remoteStream,
    connectionState,
    createOffer,
    handleOffer,
    handleAnswer,
    handleCandidate,
    toggleAudio,
    toggleVideo,
    cleanup
  };
};
