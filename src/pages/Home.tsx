import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Activity, MessageSquare, TrendingUp, Video, Zap, Target, Play } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/hero-fitness.jpg";
import poseIcon from "@/assets/pose-detection-icon.png";
import chatbotIcon from "@/assets/chatbot-icon.png";
import progressIcon from "@/assets/progress-icon.png";

const Home = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-background"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Your <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">AI-Powered</span> Virtual Fitness Coach
              </h1>
              <p className="text-xl text-muted-foreground">
                Real-time posture detection, instant corrections, and personalized guidance. Train smarter, safer, and achieve your fitness goals with AI.
              </p>
              <div className="flex flex-wrap gap-4">
                {!user && (
                  <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90" asChild>
                    <Link to="/signup">Start Training Free</Link>
                  </Button>
                )}
                <Button size="lg" variant="outline" asChild>
                  <Link to="/demo">Watch Demo</Link>
                </Button>
              </div>
              <div className="flex items-center gap-8 pt-4">
                <div>
                  <p className="text-3xl font-bold text-primary">15+</p>
                  <p className="text-sm text-muted-foreground">Exercises</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-accent">98%</p>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-success">24/7</p>
                  <p className="text-sm text-muted-foreground">AI Support</p>
                </div>
              </div>
            </div>
            <div className="relative animate-slide-up">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl"></div>
              <img 
                src={heroImage} 
                alt="AI Fitness Trainer in action" 
                className="relative rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold">Powered by Advanced AI Technology</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Combining computer vision, machine learning, and natural language processing for the ultimate fitness experience
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary transition-all hover:shadow-lg group">
              <CardContent className="p-8 space-y-4">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <img src={poseIcon} alt="Pose Detection" className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold">Real-Time Pose Detection</h3>
                <p className="text-muted-foreground">
                  MediaPipe-powered skeletal tracking detects 33 body landmarks to analyze your form with precision during every exercise.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span>Instant feedback</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span>Joint angle analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span>Motion tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent transition-all hover:shadow-lg group">
              <CardContent className="p-8 space-y-4">
                <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <img src={chatbotIcon} alt="AI Chatbot" className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold">AI Fitness Chatbot</h3>
                <p className="text-muted-foreground">
                  Interactive conversational AI provides personalized workout suggestions, answers questions, and motivates you throughout your journey.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-accent" />
                    <span>24/7 assistance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-accent" />
                    <span>Personalized tips</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent" />
                    <span>Exercise recommendations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-success transition-all hover:shadow-lg group">
              <CardContent className="p-8 space-y-4">
                <div className="w-16 h-16 rounded-xl bg-success/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <img src={progressIcon} alt="Progress Tracking" className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold">Progress Tracking</h3>
                <p className="text-muted-foreground">
                  Comprehensive analytics track your workout history, posture improvements, and performance metrics with beautiful visualizations.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span>Performance graphs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-success" />
                    <span>Workout history</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-success" />
                    <span>Goal tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold">How It Works</h2>
            <p className="text-xl text-muted-foreground">Simple, effective, and powered by AI</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: "Sign Up", desc: "Create your account and set fitness goals" },
              { step: 2, title: "Choose Exercise", desc: "Select from squats, push-ups, lunges, and more" },
              { step: 3, title: "Start Workout", desc: "AI analyzes your form in real-time via camera" },
              { step: 4, title: "Get Feedback", desc: "Receive instant corrections and track progress" }
            ].map((item) => (
              <div key={item.step} className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-accent/5 to-background">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">Ready to Transform Your Fitness Journey?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of users training smarter with AI-powered guidance
          </p>
          {!user && (
            <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8" asChild>
              <Link to="/signup">Get Started Now - It's Free</Link>
            </Button>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
