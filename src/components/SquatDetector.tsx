import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Play, Square, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";

interface FeedbackItem {
  type: "good" | "warning" | "error";
  message: string;
}

const SquatDetector = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [repCount, setRepCount] = useState(0);
  const [phase, setPhase] = useState<"up" | "down" | "idle">("idle");
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [formScore, setFormScore] = useState(100);
  const [poseLandmarker, setPoseLandmarker] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const phaseRef = useRef<"up" | "down" | "idle">("idle");
  const repCountRef = useRef(0);
  const validDownRef = useRef(false);
  const lastRepTimeRef = useRef(0);
  const lowestKneeAngleRef = useRef(180);

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
    setCameraReady(false);
    setIsActive(false);
    setPhase("idle");
    phaseRef.current = "idle";
  };

  const analyzeSquatForm = (landmarks: any[]): FeedbackItem[] => {
    const fb: FeedbackItem[] = [];

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];

    // 1. Knee angle (hip-knee-ankle) — ~90° at bottom, ~170° at top
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    // 2. Hip angle (shoulder-hip-knee) — torso lean
    const leftHipAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
    const rightHipAngle = calculateAngle(rightShoulder, rightHip, rightKnee);
    const avgHipAngle = (leftHipAngle + rightHipAngle) / 2;

    // 3. Knee alignment — knees shouldn't cave inward excessively
    const kneeDiffX = Math.abs(leftKnee.x - rightKnee.x);
    const hipDiffX = Math.abs(leftHip.x - rightHip.x);
    const kneesCavingIn = kneeDiffX < hipDiffX * 0.6;

    // 4. Torso upright — shoulder should be roughly above hip
    const torsoLean = Math.abs(
      ((leftShoulder.x + rightShoulder.x) / 2) - ((leftHip.x + rightHip.x) / 2)
    );
    const isTorsoUpright = torsoLean < 0.12;

    // 5. Depth check — knee angle should reach below threshold
    const isDepthGood = avgKneeAngle <= 120;

    // --- Beginner-friendly feedback ---
    if (isDepthGood && phaseRef.current === "down") {
      fb.push({ type: "good", message: `Good depth! Knee angle: ${Math.round(avgKneeAngle)}°` });
    } else if (phaseRef.current === "down" && avgKneeAngle > 120) {
      fb.push({ type: "warning", message: `Go lower — knee angle: ${Math.round(avgKneeAngle)}° (aim for ~90°)` });
    }

    if (avgHipAngle >= 60 && avgHipAngle <= 130) {
      fb.push({ type: "good", message: `Hip hinge: ${Math.round(avgHipAngle)}° — good torso position.` });
    } else {
      fb.push({ type: "warning", message: `Adjust your torso — hip angle: ${Math.round(avgHipAngle)}° (aim 70-120°)` });
    }

    if (kneesCavingIn) {
      fb.push({ type: "warning", message: "Push your knees outward — they're caving in." });
    } else {
      fb.push({ type: "good", message: "Knees are tracking well over toes." });
    }

    if (isTorsoUpright) {
      fb.push({ type: "good", message: "Torso is upright — great posture!" });
    } else {
      fb.push({ type: "warning", message: "Keep your chest up — avoid leaning too far forward." });
    }

    // --- Rep counting with cooldown ---
    const now = Date.now();
    const REP_COOLDOWN_MS = 800;

    // Enter down phase when knees bend past threshold
    if (avgKneeAngle < 130 && phaseRef.current !== "down") {
      phaseRef.current = "down";
      setPhase("down");
      lowestKneeAngleRef.current = avgKneeAngle;
      validDownRef.current = isDepthGood && !kneesCavingIn;
    }

    // Track lowest point during down phase
    if (phaseRef.current === "down" && avgKneeAngle < lowestKneeAngleRef.current) {
      lowestKneeAngleRef.current = avgKneeAngle;
      if (lowestKneeAngleRef.current <= 120) {
        validDownRef.current = true;
      }
    }

    // Count rep when returning to standing
    if (avgKneeAngle > 155 && phaseRef.current === "down") {
      phaseRef.current = "up";
      setPhase("up");
      if (validDownRef.current && (now - lastRepTimeRef.current) > REP_COOLDOWN_MS) {
        repCountRef.current += 1;
        setRepCount(repCountRef.current);
        lastRepTimeRef.current = now;
        fb.push({ type: "good", message: "✓ Rep counted!" });
      } else if (!validDownRef.current) {
        fb.push({ type: "error", message: "Rep not counted — go deeper or fix knee alignment." });
      }
      validDownRef.current = false;
      lowestKneeAngleRef.current = 180;
    }

    // --- Form score ---
    let score = 100;
    if (!isDepthGood && phaseRef.current === "down") score -= 20;
    if (kneesCavingIn) score -= 25;
    if (!isTorsoUpright) score -= 15;
    if (avgHipAngle < 60 || avgHipAngle > 130) score -= 15;
    setFormScore(Math.max(0, score));

    return fb;
  };

  const startDetection = async () => {
    const result = await initPoseLandmarker();
    if (!result) return;

    await startCamera();
    setIsActive(true);
    setRepCount(0);
    repCountRef.current = 0;
    phaseRef.current = "idle";

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

          const fb = analyzeSquatForm(landmarks);
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
    setRepCount(0);
    repCountRef.current = 0;
    setFormScore(100);
    setFeedback([]);
    phaseRef.current = "idle";
    setPhase("idle");
    validDownRef.current = false;
    lastRepTimeRef.current = 0;
    lowestKneeAngleRef.current = 180;
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

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Camera Feed */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Squat Pose Detection</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI-powered real-time form analysis
                  </p>
                </div>
                <Badge variant={isActive ? "default" : "secondary"}>
                  {isLoading ? "Loading Model..." : isActive ? "Detecting" : "Ready"}
                </Badge>
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
                        Position yourself so your full body is visible
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
          <Card>
            <CardHeader>
              <CardTitle>Session Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted text-center">
                  <p className="text-sm text-muted-foreground">Reps</p>
                  <p className="text-3xl font-bold text-primary">{repCount}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                  <p className="text-sm text-muted-foreground">Form Score</p>
                  <p
                    className={`text-3xl font-bold ${
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
              <div className="p-4 rounded-lg bg-muted text-center">
                <p className="text-sm text-muted-foreground">Phase</p>
                <p className="text-lg font-semibold capitalize">
                  {phase === "idle" ? "Waiting..." : phase === "down" ? "Squatting Down" : "Standing Up"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Form Feedback</CardTitle>
            </CardHeader>
            <CardContent className="h-48 overflow-y-auto space-y-3">
              {feedback.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Start detection to receive real-time feedback on your squat form.
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

          <Card>
            <CardHeader>
              <CardTitle>Squat Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Keep feet shoulder-width apart</li>
                <li>• Push knees outward over your toes</li>
                <li>• Lower until thighs are parallel to floor (~90° knee angle)</li>
                <li>• Keep your chest up and torso upright</li>
                <li>• Drive through your heels when standing up</li>
                <li>• Position camera to see full body from the side</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SquatDetector;
