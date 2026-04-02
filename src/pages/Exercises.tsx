import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import PushUpDetector from "@/components/PushUpDetector";
import SquatDetector from "@/components/SquatDetector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Exercises = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/signup");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;

  const exercises = [
    {
      id: "push-ups",
      name: "Push-ups",
      category: "Upper Body",
      difficulty: "Medium",
      duration: "10-15 min",
      description: "Build chest, shoulder, and tricep strength with proper form tracking",
      benefits: ["Chest strength", "Core stability", "Arm definition"],
      keypoints: "33 body landmarks tracked for perfect form",
      available: true,
    },
    {
      id: "squats",
      name: "Squats",
      category: "Lower Body",
      difficulty: "Easy",
      duration: "10-12 min",
      description: "Strengthen legs and glutes while improving overall balance",
      benefits: ["Leg power", "Glute activation", "Joint health"],
      keypoints: "Real-time knee and hip angle analysis",
      available: false,
    },
    {
      id: "lunges",
      name: "Lunges",
      category: "Lower Body",
      difficulty: "Medium",
      duration: "12-15 min",
      description: "Enhance leg strength and improve balance with controlled movements",
      benefits: ["Single-leg strength", "Balance", "Flexibility"],
      keypoints: "Advanced posture correction for alignment",
      available: false,
    },
    {
      id: "plank",
      name: "Plank",
      category: "Core",
      difficulty: "Easy",
      duration: "5-10 min",
      description: "Core endurance exercise with spinal alignment monitoring",
      benefits: ["Core strength", "Posture", "Stability"],
      keypoints: "Spine alignment and shoulder positioning tracked",
      available: false,
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Exercise Library</h1>
          <p className="text-muted-foreground">
            AI-powered exercises with real-time posture detection
          </p>
        </div>

        <Tabs defaultValue="push-ups" className="space-y-8">
          <TabsList className="flex flex-wrap h-auto gap-2">
            {exercises.map((ex) => (
              <TabsTrigger
                key={ex.id}
                value={ex.id}
                disabled={!ex.available}
                className="flex items-center gap-2"
              >
                {ex.name}
                {!ex.available && <Lock className="w-3 h-3" />}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Push-ups - Active with pose detection */}
          <TabsContent value="push-ups">
            <PushUpDetector />
          </TabsContent>

          {/* Other exercises - Coming soon */}
          {exercises
            .filter((ex) => !ex.available)
            .map((exercise) => (
              <TabsContent key={exercise.id} value={exercise.id}>
                <Card className="text-center py-12">
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-full bg-muted inline-block mx-auto">
                      <Lock className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold">{exercise.name}</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      {exercise.description}
                    </p>
                    <Badge variant="secondary">Coming Soon</Badge>
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      {exercise.benefits.map((b, j) => (
                        <Badge key={j} variant="outline">
                          {b}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Exercises;
