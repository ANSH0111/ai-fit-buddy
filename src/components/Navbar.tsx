import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI Fitness Trainer
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/exercises" className="text-foreground hover:text-primary transition-colors">
              Exercises
            </Link>
            <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link to="/about" className="text-foreground hover:text-primary transition-colors">
              About
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <Button variant="outline" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90" asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
            
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <Link 
                    to="/" 
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
                  >
                    Home
                  </Link>
                  <Link 
                    to="/exercises" 
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
                  >
                    Exercises
                  </Link>
                  <Link 
                    to="/dashboard" 
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/about" 
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
                  >
                    About
                  </Link>
                  <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border">
                    <Button variant="outline" asChild>
                      <Link to="/login">Sign In</Link>
                    </Button>
                    <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90" asChild>
                      <Link to="/signup">Get Started</Link>
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
