import { Activity, Github, Linkedin, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
                <Activity className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">AI Fitness Trainer</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Your virtual fitness coach powered by AI. Perfect form, safer workouts, better results.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/exercises" className="hover:text-primary transition-colors">Exercises</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
              <li><Link to="/progress" className="hover:text-primary transition-colors">Progress</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">About</Link></li>
              <li><Link to="/docs" className="hover:text-primary transition-colors">Documentation</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Connect</h3>
            <div className="flex gap-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" 
                 className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                 className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="mailto:contact@example.com"
                 className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; 2025 AI Fitness Trainer. Final Year Project - Computer Science & Engineering</p>
          <p className="mt-2">Developed by Aman Pandey, Ansh Agnihotri, Anshika Gupta</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
