import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, TrendingUp, Target, Clock, Flame, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Dashboard = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, User!</h1>
          <p className="text-muted-foreground">Track your progress and continue your fitness journey</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardDescription>Total Workouts</CardDescription>
              <CardTitle className="text-3xl">24</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-success">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>+12% from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader className="pb-3">
              <CardDescription>This Week</CardDescription>
              <CardTitle className="text-3xl">5</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-1" />
                <span>2.5 hours total</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-success">
            <CardHeader className="pb-3">
              <CardDescription>Avg. Accuracy</CardDescription>
              <CardTitle className="text-3xl">94%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-success">
                <Target className="w-4 h-4 mr-1" />
                <span>Excellent form!</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning">
            <CardHeader className="pb-3">
              <CardDescription>Calories Burned</CardDescription>
              <CardTitle className="text-3xl">1,280</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Flame className="w-4 h-4 mr-1" />
                <span>This week</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Start your workout or explore exercises</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90" size="lg" asChild>
                <Link to="/workout">
                  <Activity className="w-5 h-5 mr-2" />
                  Start Workout Session
                </Link>
              </Button>
              <Button variant="outline" className="w-full" size="lg" asChild>
                <Link to="/exercises">View Exercise Library</Link>
              </Button>
              <Button variant="outline" className="w-full" size="lg" asChild>
                <Link to="/chatbot">
                  <Zap className="w-5 h-5 mr-2" />
                  Ask AI Coach
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Workouts</CardTitle>
              <CardDescription>Your latest training sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { exercise: "Push-ups", reps: 30, accuracy: 96, time: "Today, 10:30 AM" },
                  { exercise: "Squats", reps: 25, accuracy: 92, time: "Yesterday, 6:15 PM" },
                  { exercise: "Lunges", reps: 20, accuracy: 94, time: "2 days ago" },
                ].map((workout, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div>
                      <p className="font-semibold">{workout.exercise}</p>
                      <p className="text-sm text-muted-foreground">{workout.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{workout.reps} reps</p>
                      <p className="text-sm text-success">{workout.accuracy}% accuracy</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Goals */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Your Fitness Goals</CardTitle>
              <CardDescription>Track your progress towards your targets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { goal: "Weekly Workouts", current: 5, target: 7, unit: "sessions" },
                  { goal: "Perfect Form Streak", current: 8, target: 14, unit: "days" },
                  { goal: "Monthly Calories", current: 3840, target: 5000, unit: "kcal" },
                ].map((goal, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{goal.goal}</span>
                      <span className="text-muted-foreground">
                        {goal.current} / {goal.target} {goal.unit}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                        style={{ width: `${(goal.current / goal.target) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
