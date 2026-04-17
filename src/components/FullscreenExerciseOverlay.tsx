import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Square, RotateCcw, CheckCircle2, AlertCircle, Timer, Shield, Volume2, VolumeX } from "lucide-react";

interface FeedbackItem {
  type: "good" | "warning" | "error";
  message: string;
}

interface FullscreenExerciseOverlayProps {
  exerciseName: string;
  isReady: boolean;
  readyProgress: number; // 0-100
  repCount?: number;
  holdTime?: number;
  bestTime?: number;
  formScore: number;
  phase: string;
  isHolding?: boolean;
  latestFeedback: FeedbackItem | null;
  onStop: () => void;
  onReset: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  cameraError: string | null;
  voiceEnabled?: boolean;
  voiceSupported?: boolean;
  onToggleVoice?: () => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const FullscreenExerciseOverlay = ({
  exerciseName,
  isReady,
  readyProgress,
  repCount,
  holdTime,
  bestTime,
  formScore,
  phase,
  isHolding,
  latestFeedback,
  onStop,
  onReset,
  canvasRef,
  videoRef,
  cameraError,
  voiceEnabled,
  voiceSupported,
  onToggleVoice,
}: FullscreenExerciseOverlayProps) => {
  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-contain"
        playsInline
        muted
        autoPlay
      />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full object-contain pointer-events-none"
      />

      {/* Ready gate overlay */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="text-center space-y-4 p-8">
            <Shield className="w-16 h-16 mx-auto text-primary animate-pulse" />
            <h2 className="text-2xl font-bold text-white">Get Into Position</h2>
            <p className="text-white/70 max-w-sm">
              Hold the correct starting posture for 2 seconds to begin {exerciseName}
            </p>
            <div className="w-64 mx-auto">
              <Progress value={readyProgress} className="h-3" />
            </div>
            <p className="text-sm text-white/50">
              {readyProgress > 0 ? "Hold steady..." : "Waiting for correct posture..."}
            </p>
          </div>
        </div>
      )}

      {/* Ready confirmation flash */}
      {isReady && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 animate-bounce">
          <Badge className="bg-green-500/90 text-white text-lg px-4 py-2 shadow-lg">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Ready! Go!
          </Badge>
        </div>
      )}

      {/* Top-right stats */}
      {isReady && (
        <div className="absolute top-4 right-4 flex gap-3">
          {repCount !== undefined && (
            <div className="bg-black/70 backdrop-blur-sm rounded-xl px-4 py-3 text-center min-w-[80px]">
              <p className="text-xs text-white/60">Reps</p>
              <p className="text-2xl font-bold text-primary">{repCount}</p>
            </div>
          )}
          {holdTime !== undefined && (
            <div className="bg-black/70 backdrop-blur-sm rounded-xl px-4 py-3 text-center min-w-[100px]">
              <p className="text-xs text-white/60 flex items-center justify-center gap-1">
                <Timer className="w-3 h-3" />
                {isHolding ? "Holding" : "Paused"}
              </p>
              <p className="text-2xl font-bold font-mono text-primary">{formatTime(holdTime)}</p>
            </div>
          )}
          {bestTime !== undefined && bestTime > 0 && (
            <div className="bg-black/70 backdrop-blur-sm rounded-xl px-4 py-3 text-center min-w-[80px]">
              <p className="text-xs text-white/60">Best</p>
              <p className="text-lg font-bold font-mono text-white">{formatTime(bestTime)}</p>
            </div>
          )}
          <div className="bg-black/70 backdrop-blur-sm rounded-xl px-4 py-3 text-center min-w-[80px]">
            <p className="text-xs text-white/60">Score</p>
            <p className={`text-2xl font-bold ${
              formScore >= 80 ? "text-green-400" : formScore >= 50 ? "text-yellow-400" : "text-red-400"
            }`}>
              {formScore}%
            </p>
          </div>
        </div>
      )}

      {/* Phase badge - top left */}
      {isReady && (
        <div className="absolute top-4 left-4">
          <Badge className="bg-black/70 backdrop-blur-sm text-white text-sm px-3 py-1.5">
            {phase}
          </Badge>
        </div>
      )}

      {/* Bottom-left latest feedback */}
      {isReady && latestFeedback && (
        <div className="absolute bottom-24 left-4 right-4 max-w-md">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl backdrop-blur-sm text-sm font-medium ${
            latestFeedback.type === "good"
              ? "bg-green-500/20 text-green-300"
              : latestFeedback.type === "warning"
              ? "bg-yellow-500/20 text-yellow-300"
              : "bg-red-500/20 text-red-300"
          }`}>
            {latestFeedback.type === "good" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{latestFeedback.message}</span>
          </div>
        </div>
      )}

      {/* Bottom-center controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
        <Button
          size="lg"
          variant="destructive"
          className="shadow-lg"
          onClick={onStop}
        >
          <Square className="w-5 h-5 mr-2" />
          Stop
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white shadow-lg"
          onClick={onReset}
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Reset
        </Button>
        {onToggleVoice && voiceSupported && (
          <Button
            size="lg"
            variant="outline"
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white shadow-lg"
            onClick={onToggleVoice}
            title={voiceEnabled ? "Mute voice feedback" : "Enable voice feedback"}
          >
            {voiceEnabled ? (
              <>
                <Volume2 className="w-5 h-5 mr-2" />
                Voice On
              </>
            ) : (
              <>
                <VolumeX className="w-5 h-5 mr-2" />
                Voice Off
              </>
            )}
          </Button>
        )}
      </div>

      {/* Camera error */}
      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="bg-destructive/90 text-white rounded-xl px-6 py-4 max-w-sm text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>{cameraError}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullscreenExerciseOverlay;
