"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff,
  Phone,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CallControlsProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  callType: 'audio' | 'video';
  isFullscreen?: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  onAcceptCall?: () => void;
  onRejectCall?: () => void;
  onToggleFullscreen?: () => void;
  isIncoming?: boolean;
  className?: string;
}

export const CallControls: React.FC<CallControlsProps> = ({
  isAudioEnabled,
  isVideoEnabled,
  callType,
  isFullscreen = false,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
  onAcceptCall,
  onRejectCall,
  onToggleFullscreen,
  isIncoming = false,
  className
}) => {
  if (isIncoming) {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        <Button
          size="lg"
          variant="default"
          className="bg-green-500 hover:bg-green-600 rounded-full h-14 w-14"
          onClick={onAcceptCall}
        >
          <Phone className="h-6 w-6" />
        </Button>
        <Button
          size="lg"
          variant="destructive"
          className="rounded-full h-14 w-14"
          onClick={onRejectCall}
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Audio toggle */}
      <Button
        size="lg"
        variant={isAudioEnabled ? "secondary" : "destructive"}
        className="rounded-full h-12 w-12"
        onClick={onToggleAudio}
        title={isAudioEnabled ? "Tắt mic" : "Bật mic"}
      >
        {isAudioEnabled ? (
          <Mic className="h-5 w-5" />
        ) : (
          <MicOff className="h-5 w-5" />
        )}
      </Button>

      {/* Video toggle - only for video calls */}
      {callType === 'video' && (
        <Button
          size="lg"
          variant={isVideoEnabled ? "secondary" : "destructive"}
          className="rounded-full h-12 w-12"
          onClick={onToggleVideo}
          title={isVideoEnabled ? "Tắt camera" : "Bật camera"}
        >
          {isVideoEnabled ? (
            <Video className="h-5 w-5" />
          ) : (
            <VideoOff className="h-5 w-5" />
          )}
        </Button>
      )}

      {/* Fullscreen toggle - only for video calls */}
      {callType === 'video' && onToggleFullscreen && (
        <Button
          size="lg"
          variant="secondary"
          className="rounded-full h-12 w-12"
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-5 w-5" />
          ) : (
            <Maximize2 className="h-5 w-5" />
          )}
        </Button>
      )}

      {/* End call */}
      <Button
        size="lg"
        variant="destructive"
        className="rounded-full h-14 w-14"
        onClick={onEndCall}
        title="Kết thúc cuộc gọi"
      >
        <PhoneOff className="h-6 w-6" />
      </Button>
    </div>
  );
};
