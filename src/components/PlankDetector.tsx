import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Camera, Play, Square, CheckCircle2, AlertCircle, RotateCcw, Timer } from "lucide-react";

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
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [holdTime, setHoldTime] = useState(0); // seconds
  const [isHolding, setIsHolding] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [formScore, setFormScore] = useState(100);
  const [poseLandmarker, setPoseLandmarker] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bestTime, setBestTime] = useState(0);

  const holdStartRef = useRef<number | null>(null);
  const holdTimeRef = useRef(0);
  const bestTimeRef = useRef(0);
  const isHoldingRef = useRef(false);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        setCameraReady(true);
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
    setCameraReady(false);
    setIsActive(false);
    setIsHolding(false);
    isHoldingRef.current = false;
    holdStartRef.current = null;
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

    // Spine alignment: shoulder-hip-ankle should be ~180° (straight line)
    const leftSpineAngle = calculateAngle(leftShoulder, leftHip, leftAnkle);
    const rightSpineAngle = calculateAngle(rightShoulder, rightHip, rightAnkle);
    const avgSpineAngle = (leftSpineAngle + rightSpineAngle) / 2;

    // Hip sag/pike: shoulder-hip-knee angle
    const leftHipAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
    const rightHipAngle = calculateAngle(rightShoulder, rightHip, rightKnee);
    const avgHipAngle = (leftHipAngle + rightHipAngle) / 2;

    // Shoulder positioning: elbow-shoulder angle (elbows under shoulders)
    const shoulderElbowDiffL = Math.abs(leftShoulder.x - leftElbow.x);
    const shoulderElbowDiffR = Math.abs(rightShoulder.x - rightElbow.x);
    const avgShoulderElbowDiff = (shoulderElbowDiffL + shoulderElbowDiffR) / 2;

    // Shoulder level check
    const shoulderLevelDiff = Math.abs(leftShoulder.y - rightShoulder.y);

    // Hip level check
    const hipLevelDiff = Math.abs(leftHip.y - rightHip.y);

    // Determine if in plank position (body roughly horizontal and straight)
    const isSpineStraight = avgSpineAngle >= 150;
    const isHipAligned = avgHipAngle >= 155;
    const isShoulderOverElbow = avgShoulderElbowDiff <= 0.12;
    const isShouldersLevel = shoulderLevelDiff <= 0.06;
    const isHipsLevel = hipLevelDiff <= 0.06;

    // Check if body is roughly horizontal (hips shouldn't be way above or below shoulders)
    const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const avgHipY = (leftHip.y + rightHip.y) / 2;
    const hipShoulderVertDiff = Math.abs(avgHipY - avgShoulderY);
    const isHorizontalEnough = hipShoulderVertDiff <= 0.15;

    const isGoodPlank = isSpineStraight && isHipAligned && isHorizontalEnough;

    // Feedback
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

    // Hold timer logic
    if (isGoodPlank) {
      if (!isHoldingRef.current) {
        isHoldingRef.current = true;
        holdStartRef.current = Date.now();
        setIsHolding(true);
        // Start timer interval
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
        // Accumulate hold time
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

    // Form score
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
    const result = await initPoseLandmarker();
    if (!result) return;

    await startCamera();
    setIsActive(true);
    setHoldTime(0);
    holdTimeRef.current = 0;
    holdStartRef.current = null;
    isHoldingRef.current = false;

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

          const fb = analyzePlankForm(landmarks);
          setFeedback(fb);
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
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (poseLandmarker) poseLandmarker.close();
    };
  }, []);

  const PoseLandmarkerRef = useRef<any>(null);
  useEffect(() => {
    import("@mediapipe/tasks-vision").then((m) => {
      PoseLandmarkerRef.current = m.PoseLandmarker;
    });
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Camera Feed */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Plank Pose Detection</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI-powered hold timer with form analysis
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isHolding && (
                    <Badge variant="default" className="animate-pulse">
                      <Timer className="w-3 h-3 mr-1" />
                      Holding
                    </Badge>
                  )}
                  <Badge variant={isActive ? "default" : "secondary"}>
                    {isLoading ? "Loading Model..." : isActive ? "Detecting" : "Ready"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-contain"
                  playsInline
                  muted
                  style={{ display: "none" }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ display: isActive ? "block" : "none" }}
                />
                {!isActive && (
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
                )}

                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
                    <Alert variant="destructive" className="max-w-sm">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>{cameraError}</AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-4">
                {!isActive ? (
                  <Button
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    onClick={startDetection}
                    disabled={isLoading}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    {isLoading ? "Loading..." : "Start Detection"}
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      variant="destructive"
                      className="flex-1"
                      onClick={stopDetection}
                    >
                      <Square className="w-5 h-5 mr-2" />
                      Stop
                    </Button>
                    <Button size="lg" variant="outline" onClick={resetSession}>
                      <RotateCcw className="w-5 h-5 mr-2" />
                      Reset
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats & Feedback */}
        <div className="space-y-6">
          {/* Timer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="w-5 h-5" />
                Hold Timer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-5xl font-bold font-mono text-primary">
                  {formatTime(holdTime)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isHolding ? "Timer running — hold steady!" : "Get into plank position to start"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted text-center">
                  <p className="text-xs text-muted-foreground">Best Time</p>
                  <p className="text-xl font-bold font-mono">{formatTime(bestTime)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted text-center">
                  <p className="text-xs text-muted-foreground">Form Score</p>
                  <p
                    className={`text-xl font-bold ${
                      formScore >= 80
                        ? "text-green-500"
                        : formScore >= 50
                        ? "text-yellow-500"
                        : "text-red-500"
                    }`}
                  >
                    {formScore}%
                  </p>
                </div>
              </div>
              {isActive && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress to 1 min</span>
                    <span>{Math.min(100, Math.round((holdTime / 60) * 100))}%</span>
                  </div>
                  <Progress value={Math.min(100, (holdTime / 60) * 100)} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Real-time Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Form Feedback</CardTitle>
            </CardHeader>
            <CardContent className="h-48 overflow-y-auto space-y-3">
              {feedback.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Start detection to receive real-time feedback on your plank form.
                </p>
              ) : (
                feedback.map((fb, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                      fb.type === "good"
                        ? "bg-green-500/10 text-green-700 dark:text-green-400"
                        : fb.type === "warning"
                        ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                        : "bg-red-500/10 text-red-700 dark:text-red-400"
                    }`}
                  >
                    {fb.type === "good" ? (
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    )}
                    <span>{fb.message}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Plank Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Keep your body in a straight line from head to heels</li>
                <li>• Engage your core — don't let hips sag or pike</li>
                <li>• Position elbows directly under shoulders</li>
                <li>• Keep shoulders and hips level</li>
                <li>• Timer only runs when form is correct</li>
                <li>• Position camera to see your full body from the side</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PlankDetector;
