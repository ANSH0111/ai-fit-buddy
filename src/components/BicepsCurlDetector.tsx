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

const BicepsCurlDetector = () => {
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
  const validUpRef = useRef(false);
  const lastRepTimeRef = useRef(0);
  const smallestElbowAngleRef = useRef(180);

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

  const analyzeBicepsCurlForm = (landmarks: any[]): FeedbackItem[] => {
    const fb: FeedbackItem[] = [];

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftElbow = landmarks[13];
    const rightElbow = landmarks[14];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    // 1. Elbow flexion angle (shoulder-elbow-wrist) — ~40° at top, ~160° at bottom
    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

    // 2. Upper arm stability — elbow should stay near the torso (shoulder-elbow vs shoulder-hip alignment)
    // Check if elbow stays roughly below shoulder (not swinging forward)
    const leftElbowDriftY = leftElbow.y - leftShoulder.y;
    const rightElbowDriftY = rightElbow.y - rightShoulder.y;
    const leftElbowDriftX = Math.abs(leftElbow.x - leftShoulder.x);
    const rightElbowDriftX = Math.abs(rightElbow.x - rightShoulder.x);

    // Upper arm should hang relatively straight — elbow x close to shoulder x
    const avgElbowDriftX = (leftElbowDriftX + rightElbowDriftX) / 2;
    const isElbowStable = avgElbowDriftX < 0.12;

    // 3. Body sway — shoulders should stay relatively level and torso upright
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipMidX = (leftHip.x + rightHip.x) / 2;
    const bodySway = Math.abs(shoulderMidX - hipMidX);
    const isBodySteady = bodySway < 0.08;

    // 4. Shoulder alignment (level)
    const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
    const isShouldersLevel = shoulderDiff < 0.06;

    // 5. Curl range — full range of motion check
    const isCurlComplete = avgElbowAngle <= 60;

    // --- Feedback ---
    if (phaseRef.current === "up" || avgElbowAngle < 90) {
      if (isCurlComplete) {
        fb.push({ type: "good", message: `Great curl! Elbow angle: ${Math.round(avgElbowAngle)}°` });
      } else if (avgElbowAngle < 90) {
        fb.push({ type: "warning", message: `Curl higher — elbow angle: ${Math.round(avgElbowAngle)}° (aim for ~40°)` });
      }
    }

    if (isElbowStable) {
      fb.push({ type: "good", message: "Upper arms are stable — elbows pinned to sides." });
    } else {
      fb.push({ type: "warning", message: "Keep your elbows pinned to your sides — avoid swinging." });
    }

    if (isBodySteady) {
      fb.push({ type: "good", message: "Body is steady — no swaying." });
    } else {
      fb.push({ type: "warning", message: "Avoid swaying your body — use only your biceps." });
    }

    if (isShouldersLevel) {
      fb.push({ type: "good", message: "Shoulders are level and even." });
    } else {
      fb.push({ type: "warning", message: "Keep your shoulders level — don't shrug." });
    }

    // --- Rep counting with cooldown ---
    const now = Date.now();
    const REP_COOLDOWN_MS = 800;

    // Enter "up" phase (curling up) when elbows bend past threshold
    if (avgElbowAngle < 100 && phaseRef.current !== "up") {
      phaseRef.current = "up";
      setPhase("up");
      smallestElbowAngleRef.current = avgElbowAngle;
      validUpRef.current = isCurlComplete && isElbowStable;
    }

    // Track smallest angle during curl
    if (phaseRef.current === "up" && avgElbowAngle < smallestElbowAngleRef.current) {
      smallestElbowAngleRef.current = avgElbowAngle;
      if (smallestElbowAngleRef.current <= 70) {
        validUpRef.current = true;
      }
    }

    // Count rep when arm extends back down
    if (avgElbowAngle > 140 && phaseRef.current === "up") {
      phaseRef.current = "down";
      setPhase("down");
      if (validUpRef.current && (now - lastRepTimeRef.current) > REP_COOLDOWN_MS) {
        repCountRef.current += 1;
        setRepCount(repCountRef.current);
        lastRepTimeRef.current = now;
        fb.push({ type: "good", message: "✓ Rep counted!" });
      } else if (!validUpRef.current) {
        fb.push({ type: "error", message: "Rep not counted — curl higher or keep elbows stable." });
      }
      validUpRef.current = false;
      smallestElbowAngleRef.current = 180;
    }

    // --- Form score ---
    let score = 100;
    if (!isElbowStable) score -= 25;
    if (!isBodySteady) score -= 20;
    if (!isShouldersLevel) score -= 10;
    if (!isCurlComplete && phaseRef.current === "up") score -= 20;
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

          const fb = analyzeBicepsCurlForm(landmarks);
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
    validUpRef.current = false;
    lastRepTimeRef.current = 0;
    smallestElbowAngleRef.current = 180;
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
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Biceps Curl Pose Detection</CardTitle>
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
                        Position yourself so your upper body is visible
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
                  {phase === "idle" ? "Waiting..." : phase === "up" ? "Curling Up" : "Lowering Down"}
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
                  Start detection to receive real-time feedback on your biceps curl form.
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
              <CardTitle>Biceps Curl Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Keep elbows pinned to your sides throughout</li>
                <li>• Curl until forearms are near vertical (~40° elbow angle)</li>
                <li>• Lower the weight slowly with control</li>
                <li>• Avoid swinging your body for momentum</li>
                <li>• Keep shoulders level — don't shrug</li>
                <li>• Position camera to see your upper body clearly</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BicepsCurlDetector;
