import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Activity, TrendingUp, Target, Clock, Flame, Zap, User, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfWeek, isAfter } from "date-fns";

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
  fitness_goal: string | null;
}

interface WorkoutSession {
  id: string;
  exercise_name: string;
  reps: number;
  hold_time: number;
  form_score: number;
  calories_burned: number;
  created_at: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [profileRes, sessionsRes] = await Promise.all([
        supabase.from("profiles").select("display_name, avatar_url, fitness_goal").eq("user_id", user.id).maybeSingle(),
        supabase.from("workout_sessions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (sessionsRes.data) setSessions(sessionsRes.data as WorkoutSession[]);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekSessions = sessions.filter(s => isAfter(new Date(s.created_at), weekStart));
  const totalWorkouts = sessions.length;
  const weekWorkouts = weekSessions.length;
  const weekCalories = weekSessions.reduce((sum, s) => sum + Number(s.calories_burned), 0);
  const avgAccuracy = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + Number(s.form_score), 0) / sessions.length)
    : 0;

  const recentSessions = sessions.slice(0, 5);
  const displayName = profile?.display_name || user?.user_metadata?.full_name || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Profile Section */}
        <div className="flex items-center gap-4 mb-8 p-6 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-border">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="text-lg bg-primary text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Welcome back, {displayName}!</h1>
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <Target className="w-4 h-4" />
              {profile?.fitness_goal || "Stay fit"}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {format(new Date(), "EEEE, MMM d")}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardDescription>Total Workouts</CardDescription>
              <CardTitle className="text-3xl">{totalWorkouts}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>All time</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader className="pb-3">
              <CardDescription>This Week</CardDescription>
              <CardTitle className="text-3xl">{weekWorkouts}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-1" />
                <span>{weekWorkouts} session{weekWorkouts !== 1 ? "s" : ""}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary">
            <CardHeader className="pb-3">
              <CardDescription>Avg. Form Score</CardDescription>
              <CardTitle className="text-3xl">{avgAccuracy}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Target className="w-4 h-4 mr-1" />
                <span>{avgAccuracy >= 90 ? "Excellent form!" : avgAccuracy >= 70 ? "Good form" : totalWorkouts > 0 ? "Keep practicing" : "No data yet"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-destructive">
            <CardHeader className="pb-3">
              <CardDescription>Calories Burned</CardDescription>
              <CardTitle className="text-3xl">{Math.round(weekCalories).toLocaleString()}</CardTitle>
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
                <Link to="/exercises">
                  <Activity className="w-5 h-5 mr-2" />
                  Start Workout Session
                </Link>
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
              {recentSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No workouts yet</p>
                  <p className="text-sm">Start your first session to see your history here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div>
                        <p className="font-semibold">{session.exercise_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(session.created_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {session.hold_time > 0 ? `${session.hold_time}s hold` : `${session.reps} reps`}
                        </p>
                        <p className="text-sm text-muted-foreground">{Number(session.form_score)}% form</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Progress */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Weekly Progress</CardTitle>
              <CardDescription>Your activity this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { goal: "Weekly Workouts", current: weekWorkouts, target: 7, unit: "sessions" },
                  { goal: "Avg. Form Score", current: avgAccuracy, target: 100, unit: "%" },
                  { goal: "Calories Burned", current: Math.round(weekCalories), target: 2000, unit: "kcal" },
                ].map((goal, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{goal.goal}</span>
                      <span className="text-muted-foreground">
                        {goal.current} / {goal.target} {goal.unit}
                      </span>
                    </div>
                    <Progress value={Math.min((goal.current / goal.target) * 100, 100)} className="h-2" />
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
