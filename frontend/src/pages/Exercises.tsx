import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Exercises = () => {
  const exercises = [
    {
      name: "Push-ups",
      category: "Upper Body",
      difficulty: "Medium",
      duration: "10-15 min",
      description: "Build chest, shoulder, and tricep strength with proper form tracking",
      benefits: ["Chest strength", "Core stability", "Arm definition"],
      keypoints: "33 body landmarks tracked for perfect form"
    },
    {
      name: "Squats",
      category: "Lower Body",
      difficulty: "Easy",
      duration: "10-12 min",
      description: "Strengthen legs and glutes while improving overall balance",
      benefits: ["Leg power", "Glute activation", "Joint health"],
      keypoints: "Real-time knee and hip angle analysis"
    },
    {
      name: "Lunges",
      category: "Lower Body",
      difficulty: "Medium",
      duration: "12-15 min",
      description: "Enhance leg strength and improve balance with controlled movements",
      benefits: ["Single-leg strength", "Balance", "Flexibility"],
      keypoints: "Advanced posture correction for alignment"
    },
    {
      name: "Plank",
      category: "Core",
      difficulty: "Easy",
      duration: "5-10 min",
      description: "Core endurance exercise with spinal alignment monitoring",
      benefits: ["Core strength", "Posture", "Stability"],
      keypoints: "Spine alignment and shoulder positioning tracked"
    },
    {
      name: "Burpees",
      category: "Full Body",
      difficulty: "Hard",
      duration: "15-20 min",
      description: "High-intensity full-body exercise for cardiovascular fitness",
      benefits: ["Cardio", "Full body workout", "Calorie burn"],
      keypoints: "Multi-phase movement analysis"
    },
    {
      name: "Mountain Climbers",
      category: "Cardio",
      difficulty: "Medium",
      duration: "8-12 min",
      description: "Dynamic cardio exercise engaging core and legs",
      benefits: ["Cardio endurance", "Core engagement", "Agility"],
      keypoints: "Rapid movement tracking with pose estimation"
    },
  ];

  const categories = ["All", "Upper Body", "Lower Body", "Core", "Cardio", "Full Body"];
  const difficulties = ["Easy", "Medium", "Hard"];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Exercise Library</h1>
          <p className="text-muted-foreground">AI-powered exercises with real-time posture detection</p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-3">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button key={cat} variant="outline" size="sm">
                  {cat}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-3">Difficulty</h3>
            <div className="flex flex-wrap gap-2">
              {difficulties.map((diff) => (
                <Badge key={diff} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                  {diff}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Exercise Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map((exercise, i) => (
            <Card key={i} className="hover:shadow-lg transition-all hover:border-primary group">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Activity className="w-6 h-6" />
                  </div>
                  <Badge variant={
                    exercise.difficulty === "Easy" ? "secondary" :
                    exercise.difficulty === "Medium" ? "default" : "destructive"
                  }>
                    {exercise.difficulty}
                  </Badge>
                </div>
                <CardTitle>{exercise.name}</CardTitle>
                <CardDescription className="flex items-center gap-4">
                  <span>{exercise.category}</span>
                  <span>•</span>
                  <span>{exercise.duration}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{exercise.description}</p>
                
                <div>
                  <p className="text-sm font-semibold mb-2">Benefits:</p>
                  <div className="flex flex-wrap gap-2">
                    {exercise.benefits.map((benefit, j) => (
                      <Badge key={j} variant="outline" className="text-xs">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <p className="text-xs text-primary font-medium">🤖 {exercise.keypoints}</p>
                </div>
                
                <Button className="w-full" variant="outline" asChild>
                  <Link to="/workout">Start Exercise</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Exercises;
