import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, Video, PhoneOff, Mic, MicOff, VideoOff } from "lucide-react";

interface CallDialogProps {
  open: boolean;
  onClose: () => void;
  callType: 'audio' | 'video';
  callerName: string;
  callerAvatar?: string;
  isIncoming: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onEnd?: () => void;
  isConnected?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  onToggleMute?: () => void;
  onToggleVideo?: () => void;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
}

export function CallDialog({
  open,
  onClose,
  callType,
  callerName,
  callerAvatar,
  isIncoming,
  onAccept,
  onReject,
  onEnd,
  isConnected = false,
  isMuted = false,
  isVideoOff = false,
  onToggleMute,
  onToggleVideo,
  localStream,
  remoteStream,
}: CallDialogProps) {
  const [callDuration, setCallDuration] = useState(0);
  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  
  // Update video/audio elements when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log('Attaching local video stream:', {
        streamId: localStream.id,
        videoTracks: localStream.getVideoTracks().length,
        audioTracks: localStream.getAudioTracks().length
      });
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(err => {
        console.error('Error playing local video:', err);
      });
    } else if (localVideoRef.current && !localStream) {
      localVideoRef.current.srcObject = null;
    }
  }, [localStream]);
  
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log('Attaching remote video stream:', {
        streamId: remoteStream.id,
        videoTracks: remoteStream.getVideoTracks().length,
        audioTracks: remoteStream.getAudioTracks().length
      });
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(err => {
        console.error('Error playing remote video:', err);
      });
    } else if (remoteVideoRef.current && !remoteStream) {
      remoteVideoRef.current.srcObject = null;
    }
  }, [remoteStream]);
  
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      console.log('Attaching remote audio stream:', {
        streamId: remoteStream.id,
        audioTracks: remoteStream.getAudioTracks().length
      });
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current.play().then(() => {
        console.log('Remote audio playing successfully');
      }).catch(err => {
        console.error('Error playing remote audio:', err);
        // Try again after a short delay
        setTimeout(() => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.play().catch(e => {
              console.error('Retry failed:', e);
            });
          }
        }, 500);
      });
    } else if (remoteAudioRef.current && !remoteStream) {
      remoteAudioRef.current.srcObject = null;
    }
  }, [remoteStream]);

  // Play ringtone for incoming calls
  useEffect(() => {
    if (open && isIncoming && !isConnected) {
      // Create and play ringtone using Web Audio API
      const playRingtone = () => {
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800; // Hz
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
          console.error('Error playing ringtone:', error);
        }
      };
      
      // Play ringtone every 2 seconds
      playRingtone();
      ringIntervalRef.current = setInterval(playRingtone, 2000);
      
      return () => {
        if (ringIntervalRef.current) {
          clearInterval(ringIntervalRef.current);
          ringIntervalRef.current = null;
        }
      };
    } else {
      // Stop ringtone
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
    }
  }, [open, isIncoming, isConnected]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected && open) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, open]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#17212b] border-[#242f3d] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-center">
            {isIncoming ? 'Kiruvchi qo\'ng\'iroq' : 'Chiquvchi qo\'ng\'iroq'}
          </DialogTitle>
          <DialogDescription className="text-[#6e7a8a] text-center">
            {callType === 'video' ? 'Video qo\'ng\'iroq' : 'Ovozli qo\'ng\'iroq'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-8">
          {/* Video streams for video calls */}
          {callType === 'video' && isConnected ? (
            <div className="relative w-full max-w-md mb-4">
              {/* Remote video (other person) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-64 bg-[#242f3d] rounded-lg object-cover"
                style={{ display: remoteStream ? 'block' : 'none' }}
                onLoadedMetadata={() => {
                  console.log('Remote video metadata loaded');
                  if (remoteVideoRef.current) {
                    remoteVideoRef.current.play().catch(err => {
                      console.error('Error playing remote video after metadata:', err);
                    });
                  }
                }}
              />
              
              {/* Local video (yourself) - small picture in picture */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute bottom-4 right-4 w-32 h-24 bg-[#242f3d] rounded-lg object-cover border-2 border-[#5288c1]"
                style={{ display: localStream && !isVideoOff ? 'block' : 'none' }}
                onLoadedMetadata={() => {
                  console.log('Local video metadata loaded');
                  if (localVideoRef.current) {
                    localVideoRef.current.play().catch(err => {
                      console.error('Error playing local video after metadata:', err);
                    });
                  }
                }}
              />
              
              {/* Fallback avatar if no video */}
              {!remoteStream && (
                <div className="w-full h-64 bg-[#242f3d] rounded-lg flex items-center justify-center">
                  <Avatar className="h-32 w-32 border-4 border-[#5288c1]">
                    <AvatarImage src={callerAvatar} alt={callerName} />
                    <AvatarFallback className="bg-[#5288c1] text-white text-3xl">
                      {callerName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          ) : (
            /* Avatar for audio calls or when not connected */
            <Avatar className="h-32 w-32 mb-4 border-4 border-[#5288c1]">
              <AvatarImage src={callerAvatar} alt={callerName} />
              <AvatarFallback className="bg-[#5288c1] text-white text-3xl">
                {callerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          
          {/* Remote audio element (hidden) - for both audio and video calls */}
          <audio
            ref={remoteAudioRef}
            autoPlay
            playsInline
            style={{ display: 'none' }}
            onLoadedMetadata={() => {
              console.log('Remote audio metadata loaded');
              if (remoteAudioRef.current) {
                remoteAudioRef.current.play().catch(err => {
                  console.error('Error playing remote audio after metadata:', err);
                });
              }
            }}
          />
          
          {/* Name */}
          <h3 className="text-2xl font-semibold text-white mb-2">{callerName}</h3>
          
          {/* Status */}
          {isIncoming && !isConnected && (
            <p className="text-[#6e7a8a] mb-4">Qo'ng'iroqni javob bering...</p>
          )}
          {isConnected && (
            <p className="text-[#5288c1] mb-4">{formatTime(callDuration)}</p>
          )}
          {!isIncoming && !isConnected && (
            <p className="text-[#6e7a8a] mb-4">Qo'ng'iroq qilinmoqda...</p>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-4 pb-4">
          {isIncoming && !isConnected ? (
            <>
              <Button
                onClick={onReject}
                className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white"
                aria-label="Rad etish"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
              <Button
                onClick={onAccept}
                className={`h-14 w-14 rounded-full ${
                  callType === 'video' 
                    ? 'bg-[#5288c1] hover:bg-[#4a7ab8] ring-4 ring-[#5288c1]/30' 
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
                aria-label="Qabul qilish"
              >
                {callType === 'video' ? (
                  <Video className="h-6 w-6" />
                ) : (
                  <Phone className="h-6 w-6" />
                )}
              </Button>
            </>
          ) : isConnected ? (
            <>
              {callType === 'video' && onToggleVideo && (
                <Button
                  onClick={onToggleVideo}
                  className={`h-12 w-12 rounded-full ${
                    isVideoOff 
                      ? 'bg-[#242f3d] hover:bg-[#2a3542]' 
                      : 'bg-[#5288c1] hover:bg-[#4a7ab8]'
                  } text-white`}
                  aria-label={isVideoOff ? 'Video yoqish' : 'Video o\'chirish'}
                >
                  {isVideoOff ? (
                    <VideoOff className="h-5 w-5" />
                  ) : (
                    <Video className="h-5 w-5" />
                  )}
                </Button>
              )}
              {onToggleMute && (
                <Button
                  onClick={onToggleMute}
                  className={`h-12 w-12 rounded-full ${
                    isMuted 
                      ? 'bg-[#242f3d] hover:bg-[#2a3542]' 
                      : 'bg-[#5288c1] hover:bg-[#4a7ab8]'
                  } text-white`}
                  aria-label={isMuted ? 'Mikrofonni yoqish' : 'Mikrofonni o\'chirish'}
                >
                  {isMuted ? (
                    <MicOff className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>
              )}
              {onEnd && (
                <Button
                  onClick={onEnd}
                  className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700 text-white"
                  aria-label="Qo'ng'iroqni tugatish"
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
              )}
            </>
          ) : (
            <Button
              onClick={onReject}
              className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white"
              aria-label="Bekor qilish"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

