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

const PushUpDetector = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [repCount, setRepCount] = useState(0);
  const [phase, setPhase] = useState<"up" | "down" | "idle">("idle");
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [formScore, setFormScore] = useState(100);
  const [poseLandmarker, setPoseLandmarker] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [readyProgress, setReadyProgress] = useState(0);
  const [latestFeedback, setLatestFeedback] = useState<FeedbackItem | null>(null);

  const phaseRef = useRef<"up" | "down" | "idle">("idle");
  const repCountRef = useRef(0);
  const validDownRef = useRef(false);
  const lastRepTimeRef = useRef(0);
  const lowestElbowAngleRef = useRef(180);
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
    setIsActive(false);
    setPhase("idle");
    phaseRef.current = "idle";
    setIsReady(false);
    isReadyRef.current = false;
    readyStartRef.current = null;
    setReadyProgress(0);
  };

  const checkReadyPosture = (landmarks: any[]): boolean => {
    const leftShoulder = landmarks[11];
    const leftElbow = landmarks[13];
    const leftWrist = landmarks[15];
    const rightShoulder = landmarks[12];
    const rightElbow = landmarks[14];
    const rightWrist = landmarks[16];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];

    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

    const leftTorsoAngle = calculateAngle(leftShoulder, leftHip, leftAnkle);
    const rightTorsoAngle = calculateAngle(rightShoulder, rightHip, rightAnkle);
    const avgTorsoAngle = (leftTorsoAngle + rightTorsoAngle) / 2;

    return avgElbowAngle > 145 && avgTorsoAngle >= 140;
  };

  const analyzePushUpForm = (landmarks: any[]): FeedbackItem[] => {
    const fb: FeedbackItem[] = [];

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftElbow = landmarks[13];
    const rightElbow = landmarks[14];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];

    const leftBodyArmAngle = calculateAngle(leftHip, leftShoulder, leftElbow);
    const rightBodyArmAngle = calculateAngle(rightHip, rightShoulder, rightElbow);
    const avgBodyArmAngle = (leftBodyArmAngle + rightBodyArmAngle) / 2;

    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

    const leftTorsoAngle = calculateAngle(leftShoulder, leftHip, leftAnkle);
    const rightTorsoAngle = calculateAngle(rightShoulder, rightHip, rightAnkle);
    const avgTorsoAngle = (leftTorsoAngle + rightTorsoAngle) / 2;

    const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);

    const isBodyArmGood = avgBodyArmAngle >= 15 && avgBodyArmAngle <= 75;
    const isElbowFlexGood = avgElbowAngle >= 60 && avgElbowAngle <= 120;
    const isTorsoStraight = avgTorsoAngle >= 140;
    const isShouldersLevel = shoulderDiff <= 0.08;

    if (isBodyArmGood) {
      fb.push({ type: "good", message: `Body-to-arm angle: ${Math.round(avgBodyArmAngle)}° (ideal 30-45°)` });
    } else {
      fb.push({ type: "warning", message: `Body-to-arm angle: ${Math.round(avgBodyArmAngle)}° — keep elbows closer to body (30-45°)` });
    }

    if (isTorsoStraight) {
      fb.push({ type: "good", message: "Great plank alignment! Body is straight." });
    } else {
      fb.push({ type: "warning", message: `Hips sagging or piked — straighten your body (${Math.round(avgTorsoAngle)}° / 180°)` });
    }

    if (isShouldersLevel) {
      fb.push({ type: "good", message: "Shoulders are level and even." });
    } else {
      fb.push({ type: "warning", message: "Keep your shoulders level and even." });
    }

    if (phaseRef.current === "down") {
      if (isElbowFlexGood) {
        fb.push({ type: "good", message: `Good depth! Elbow flexion: ${Math.round(avgElbowAngle)}°` });
      } else if (avgElbowAngle > 120) {
        fb.push({ type: "warning", message: `Go lower — elbow flexion: ${Math.round(avgElbowAngle)}° (aim for ~90°)` });
      }
    }

    // Only count reps if ready
    if (isReadyRef.current) {
      const now = Date.now();
      const REP_COOLDOWN_MS = 800;

      if (avgElbowAngle < 110 && phaseRef.current !== "down") {
        phaseRef.current = "down";
        setPhase("down");
        lowestElbowAngleRef.current = avgElbowAngle;
        validDownRef.current = isTorsoStraight;
      }

      if (phaseRef.current === "down" && avgElbowAngle < lowestElbowAngleRef.current) {
        lowestElbowAngleRef.current = avgElbowAngle;
        if (lowestElbowAngleRef.current <= 120 && isTorsoStraight) {
          validDownRef.current = true;
        }
      }

      if (avgElbowAngle > 145 && phaseRef.current === "down") {
        phaseRef.current = "up";
        setPhase("up");
        if (validDownRef.current && (now - lastRepTimeRef.current) > REP_COOLDOWN_MS) {
          repCountRef.current += 1;
          setRepCount(repCountRef.current);
          lastRepTimeRef.current = now;
          fb.push({ type: "good", message: "✓ Rep counted!" });
        } else if (!validDownRef.current) {
          fb.push({ type: "error", message: "Rep not counted — go lower or straighten your body." });
        }
        validDownRef.current = false;
        lowestElbowAngleRef.current = 180;
      }
    }

    let score = 100;
    if (!isBodyArmGood) score -= 20;
    if (!isTorsoStraight) score -= 20;
    if (!isShouldersLevel) score -= 10;
    if (avgTorsoAngle < 130) score -= 15;
    setFormScore(Math.max(0, score));

    return fb;
  };

  const startDetection = async () => {
    // Start camera FIRST to preserve user-gesture context for getUserMedia
    await startCamera();
    setIsActive(true);

    const result = await initPoseLandmarker();
    if (!result) {
      stopCamera();
      return;
    }
    setRepCount(0);
    repCountRef.current = 0;
    phaseRef.current = "idle";
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

          // Posture gate
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

          const fb = analyzePushUpForm(landmarks);
          setFeedback(fb);
          // Pick the most important feedback for the overlay
          const important = fb.find(f => f.type === "error") || fb.find(f => f.type === "warning") || fb.find(f => f.message.includes("Rep counted")) || fb[0] || null;
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
    setRepCount(0);
    repCountRef.current = 0;
    setFormScore(100);
    setFeedback([]);
    phaseRef.current = "idle";
    setPhase("idle");
    validDownRef.current = false;
    lastRepTimeRef.current = 0;
    lowestElbowAngleRef.current = 180;
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
        exerciseName="Push-ups"
        isReady={isReady}
        readyProgress={readyProgress}
        repCount={repCount}
        formScore={formScore}
        phase={phase === "idle" ? "Waiting..." : phase === "down" ? "Going Down" : "Pushing Up"}
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
              <CardTitle>Push-Up Pose Detection</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                AI-powered real-time form analysis
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
                  Position yourself so your full body is visible
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

export default PushUpDetector;
