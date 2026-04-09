import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Play } from "lucide-react";
import FullscreenExerciseOverlay from "@/components/FullscreenExerciseOverlay";

interface FeedbackItem {
  type: "good" | "warning" | "error";
  message: string;
}

const PlankDetector = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [holdTime, setHoldTime] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [formScore, setFormScore] = useState(100);
  const [poseLandmarker, setPoseLandmarker] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bestTime, setBestTime] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [readyProgress, setReadyProgress] = useState(0);
  const [latestFeedback, setLatestFeedback] = useState<FeedbackItem | null>(null);

  const holdStartRef = useRef<number | null>(null);
  const holdTimeRef = useRef(0);
  const bestTimeRef = useRef(0);
  const isHoldingRef = useRef(false);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isReadyRef = useRef(false);
  const readyStartRef = useRef<number | null>(null);
  const PoseLandmarkerRef = useRef<any>(null);

  const calculateAngle = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number }
  ): number => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180) / Math.PI);
    if (angle > 180) angle = 360 - angle;
    return angle;
  };

  const initPoseLandmarker = useCallback(async () => {
    setIsLoading(true);
    try {
      const vision = await import("@mediapipe/tasks-vision");
      const { PoseLandmarker, FilesetResolver, DrawingUtils } = vision;
      PoseLandmarkerRef.current = PoseLandmarker;

      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const landmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });

      setPoseLandmarker(landmarker);
      setIsLoading(false);
      return { landmarker, DrawingUtils };
    } catch (err) {
      console.error("Failed to init PoseLandmarker:", err);
      setIsLoading(false);
      setCameraError("Failed to load pose detection model. Please try again.");
      return null;
    }
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setCameraError("Camera access denied. Please allow camera permission.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsActive(false);
    setIsHolding(false);
    isHoldingRef.current = false;
    holdStartRef.current = null;
    setIsReady(false);
    isReadyRef.current = false;
    readyStartRef.current = null;
    setReadyProgress(0);
  };

  const checkReadyPosture = (landmarks: any[]): boolean => {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];

    const leftSpineAngle = calculateAngle(leftShoulder, leftHip, leftAnkle);
    const rightSpineAngle = calculateAngle(rightShoulder, rightHip, rightAnkle);
    const avgSpineAngle = (leftSpineAngle + rightSpineAngle) / 2;

    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    const leftHipAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
    const rightHipAngle = calculateAngle(rightShoulder, rightHip, rightKnee);
    const avgHipAngle = (leftHipAngle + rightHipAngle) / 2;

    const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const avgHipY = (leftHip.y + rightHip.y) / 2;
    const isHorizontalEnough = Math.abs(avgHipY - avgShoulderY) <= 0.15;

    return avgSpineAngle >= 150 && avgHipAngle >= 155 && isHorizontalEnough;
  };

  const analyzePlankForm = (landmarks: any[]): FeedbackItem[] => {
    const fb: FeedbackItem[] = [];

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftElbow = landmarks[13];
    const rightElbow = landmarks[14];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];

    const leftSpineAngle = calculateAngle(leftShoulder, leftHip, leftAnkle);
    const rightSpineAngle = calculateAngle(rightShoulder, rightHip, rightAnkle);
    const avgSpineAngle = (leftSpineAngle + rightSpineAngle) / 2;

    const leftHipAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
    const rightHipAngle = calculateAngle(rightShoulder, rightHip, rightKnee);
    const avgHipAngle = (leftHipAngle + rightHipAngle) / 2;

    const shoulderElbowDiffL = Math.abs(leftShoulder.x - leftElbow.x);
    const shoulderElbowDiffR = Math.abs(rightShoulder.x - rightElbow.x);
    const avgShoulderElbowDiff = (shoulderElbowDiffL + shoulderElbowDiffR) / 2;

    const shoulderLevelDiff = Math.abs(leftShoulder.y - rightShoulder.y);
    const hipLevelDiff = Math.abs(leftHip.y - rightHip.y);

    const isSpineStraight = avgSpineAngle >= 150;
    const isHipAligned = avgHipAngle >= 155;
    const isShoulderOverElbow = avgShoulderElbowDiff <= 0.12;
    const isShouldersLevel = shoulderLevelDiff <= 0.06;
    const isHipsLevel = hipLevelDiff <= 0.06;

    const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const avgHipY = (leftHip.y + rightHip.y) / 2;
    const isHorizontalEnough = Math.abs(avgHipY - avgShoulderY) <= 0.15;

    const isGoodPlank = isSpineStraight && isHipAligned && isHorizontalEnough;

    if (isSpineStraight) {
      fb.push({ type: "good", message: `Spine alignment: ${Math.round(avgSpineAngle)}° — great!` });
    } else if (avgSpineAngle < 140) {
      fb.push({ type: "error", message: `Hips too high or low (${Math.round(avgSpineAngle)}°) — straighten your body` });
    } else {
      fb.push({ type: "warning", message: `Spine angle: ${Math.round(avgSpineAngle)}° — try to keep straighter (aim 170-180°)` });
    }

    if (isHipAligned) {
      fb.push({ type: "good", message: "Hip alignment is solid!" });
    } else {
      fb.push({ type: "warning", message: `Hips sagging or piked (${Math.round(avgHipAngle)}°) — engage your core` });
    }

    if (isShoulderOverElbow) {
      fb.push({ type: "good", message: "Elbows are well positioned under shoulders." });
    } else {
      fb.push({ type: "warning", message: "Keep elbows directly under your shoulders." });
    }

    if (isShouldersLevel && isHipsLevel) {
      fb.push({ type: "good", message: "Body is level — nice balance!" });
    } else if (!isShouldersLevel) {
      fb.push({ type: "warning", message: "Keep your shoulders even and level." });
    } else {
      fb.push({ type: "warning", message: "Keep your hips even — avoid tilting." });
    }

    // Only run timer if ready
    if (isReadyRef.current) {
      if (isGoodPlank) {
        if (!isHoldingRef.current) {
          isHoldingRef.current = true;
          holdStartRef.current = Date.now();
          setIsHolding(true);
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = setInterval(() => {
            if (holdStartRef.current && isHoldingRef.current) {
              const elapsed = Math.floor((Date.now() - holdStartRef.current) / 1000) + holdTimeRef.current;
              setHoldTime(elapsed);
              if (elapsed > bestTimeRef.current) {
                bestTimeRef.current = elapsed;
                setBestTime(elapsed);
              }
            }
          }, 200);
        }
        fb.push({ type: "good", message: "✓ Holding plank — keep going!" });
      } else {
        if (isHoldingRef.current) {
          if (holdStartRef.current) {
            holdTimeRef.current += Math.floor((Date.now() - holdStartRef.current) / 1000);
          }
          isHoldingRef.current = false;
          holdStartRef.current = null;
          setIsHolding(false);
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
        }
        fb.push({ type: "warning", message: "Fix your form to continue the timer." });
      }
    }

    let score = 100;
    if (!isSpineStraight) score -= 25;
    if (!isHipAligned) score -= 20;
    if (!isShoulderOverElbow) score -= 15;
    if (!isShouldersLevel) score -= 10;
    if (!isHipsLevel) score -= 10;
    if (!isHorizontalEnough) score -= 20;
    setFormScore(Math.max(0, score));

    return fb;
  };

  const startDetection = async () => {
    await startCamera();
    setIsActive(true);

    const result = await initPoseLandmarker();
    if (!result) {
      stopCamera();
      return;
    }
    setHoldTime(0);
    holdTimeRef.current = 0;
    holdStartRef.current = null;
    isHoldingRef.current = false;
    isReadyRef.current = false;
    setIsReady(false);
    readyStartRef.current = null;
    setReadyProgress(0);

    const { landmarker, DrawingUtils } = result;

    const detect = () => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (video.readyState >= 2) {
        const result = landmarker.detectForVideo(video, performance.now());
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0);

        if (result.landmarks && result.landmarks.length > 0) {
          const drawingUtils = new DrawingUtils(ctx);
          const landmarks = result.landmarks[0];

          drawingUtils.drawLandmarks(landmarks, {
            radius: 4,
            color: "hsl(142, 76%, 36%)",
            fillColor: "hsl(142, 76%, 56%)",
          });
          drawingUtils.drawConnectors(
            landmarks,
            PoseLandmarkerRef.current?.POSE_CONNECTIONS ?? [],
            { color: "hsl(217, 91%, 60%)", lineWidth: 2 }
          );

          if (!isReadyRef.current) {
            const goodPosture = checkReadyPosture(landmarks);
            if (goodPosture) {
              if (!readyStartRef.current) readyStartRef.current = Date.now();
              const elapsed = Date.now() - readyStartRef.current;
              setReadyProgress(Math.min(100, (elapsed / 2000) * 100));
              if (elapsed >= 2000) {
                isReadyRef.current = true;
                setIsReady(true);
              }
            } else {
              readyStartRef.current = null;
              setReadyProgress(0);
            }
          }

          const fb = analyzePlankForm(landmarks);
          setFeedback(fb);
          const important = fb.find(f => f.type === "error") || fb.find(f => f.type === "warning") || fb.find(f => f.message.includes("Holding")) || fb[0] || null;
          setLatestFeedback(important);
        }
      }

      animationRef.current = requestAnimationFrame(detect);
    };

    const checkVideo = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        detect();
      } else {
        requestAnimationFrame(checkVideo);
      }
    };
    checkVideo();
  };

  const stopDetection = () => {
    stopCamera();
    setFeedback([]);
    setLatestFeedback(null);
  };

  const resetSession = () => {
    setHoldTime(0);
    holdTimeRef.current = 0;
    setBestTime(0);
    bestTimeRef.current = 0;
    setFormScore(100);
    setFeedback([]);
    isHoldingRef.current = false;
    holdStartRef.current = null;
    setIsHolding(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    isReadyRef.current = false;
    setIsReady(false);
    readyStartRef.current = null;
    setReadyProgress(0);
    setLatestFeedback(null);
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (poseLandmarker) poseLandmarker.close();
    };
  }, []);

  useEffect(() => {
    import("@mediapipe/tasks-vision").then((m) => {
      PoseLandmarkerRef.current = m.PoseLandmarker;
    });
  }, []);

  if (isActive) {
    return (
      <FullscreenExerciseOverlay
        exerciseName="Plank"
        isReady={isReady}
        readyProgress={readyProgress}
        holdTime={holdTime}
        bestTime={bestTime}
        isHolding={isHolding}
        formScore={formScore}
        phase={isHolding ? "Holding" : "Get in Position"}
        latestFeedback={latestFeedback}
        onStop={stopDetection}
        onReset={resetSession}
        canvasRef={canvasRef}
        videoRef={videoRef}
        cameraError={cameraError}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plank Pose Detection</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                AI-powered hold timer with form analysis
              </p>
            </div>
            <Badge variant="secondary">
              {isLoading ? "Loading Model..." : "Ready"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <Camera className="w-16 h-16 mx-auto text-primary" />
                <p className="text-muted-foreground font-medium">
                  Camera feed will appear here
                </p>
                <p className="text-sm text-muted-foreground">
                  Position yourself sideways so your full body is visible
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              size="lg"
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              onClick={startDetection}
              disabled={isLoading}
            >
              <Play className="w-5 h-5 mr-2" />
              {isLoading ? "Loading..." : "Start Detection"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlankDetector;
