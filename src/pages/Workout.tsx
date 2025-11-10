import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Play, Square, Video, AlertCircle, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Workout = () => {
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState("push-ups");

  const exercises = [
    { id: "push-ups", name: "Push-ups", difficulty: "Medium", target: "Chest, Triceps" },
    { id: "squats", name: "Squats", difficulty: "Easy", target: "Legs, Glutes" },
    { id: "lunges", name: "Lunges", difficulty: "Medium", target: "Legs, Balance" },
    { id: "plank", name: "Plank", difficulty: "Easy", target: "Core, Stability" },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Workout Session</h1>
          <p className="text-muted-foreground">Real-time pose detection and correction</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Camera Feed */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Live Camera Feed</CardTitle>
                    <CardDescription>AI pose detection active</CardDescription>
                  </div>
                  <Badge variant={isWorkoutActive ? "default" : "secondary"}>
                    {isWorkoutActive ? "Recording" : "Ready"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {!isWorkoutActive ? (
                    <div className="text-center space-y-4">
                      <Camera className="w-16 h-16 mx-auto text-primary" />
                      <p className="text-muted-foreground">Camera feed will appear here</p>
                      <p className="text-sm text-muted-foreground">MediaPipe pose detection ready</p>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <Video className="w-16 h-16 mx-auto text-primary animate-pulse" />
                        <p className="text-lg font-semibold">Analyzing your form...</p>
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                          <span className="text-sm">33 keypoints detected</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-4 mt-6">
                  {!isWorkoutActive ? (
                    <Button 
                      size="lg" 
                      className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                      onClick={() => setIsWorkoutActive(true)}
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Start Workout
                    </Button>
                  ) : (
                    <Button 
                      size="lg" 
                      variant="destructive"
                      className="flex-1"
                      onClick={() => setIsWorkoutActive(false)}
                    >
                      <Square className="w-5 h-5 mr-2" />
                      Stop Workout
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Real-time Feedback */}
            {isWorkoutActive && (
              <Card className="border-l-4 border-l-success">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    Real-time Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <CheckCircle2 className="w-4 h-4" />
                    <AlertDescription>
                      <strong>Great form!</strong> Keep your back straight and core engaged.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Reps Completed</p>
                      <p className="text-2xl font-bold">12</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Form Accuracy</p>
                      <p className="text-2xl font-bold text-success">96%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Exercise Selection & Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Exercise</CardTitle>
                <CardDescription>Choose your workout</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {exercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => setSelectedExercise(exercise.id)}
                    className={`w-full p-4 rounded-lg text-left transition-all ${
                      selectedExercise === exercise.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    <p className="font-semibold">{exercise.name}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {exercise.difficulty}
                      </Badge>
                      <span className="text-xs opacity-80">{exercise.target}</span>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exercise Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Camera Permission Required</strong>
                    <br />
                    Allow camera access for pose detection
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2 text-sm">
                  <h4 className="font-semibold">Key Points:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Keep your body aligned</li>
                    <li>• Maintain steady breathing</li>
                    <li>• Focus on controlled movements</li>
                    <li>• Follow AI corrections in real-time</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Workout;
