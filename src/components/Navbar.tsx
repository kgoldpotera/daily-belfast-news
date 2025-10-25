import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, PenSquare, LogIn, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-xl font-bold text-primary-foreground">DB</span>
            </div>
            <span className="text-xl font-bold text-foreground">DailyBelfastNews</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-4 md:flex">
            {user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/create">
                    <PenSquare className="mr-2 h-4 w-4" />
                    Create Post
                  </Link>
                </Button>
                {isAdmin && (
                  <Button variant="ghost" asChild>
                    <Link to="/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin
                    </Link>
                  </Button>
                )}
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="default" asChild>
                <Link to="/auth">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="border-t border-border py-4 md:hidden">
            <div className="flex flex-col space-y-3">
              {user ? (
                <>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to="/create" onClick={() => setIsMenuOpen(false)}>
                      <PenSquare className="mr-2 h-4 w-4" />
                      Create Post
                    </Link>
                  </Button>
                  {isAdmin && (
                    <Button variant="ghost" className="justify-start" asChild>
                      <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                        <Shield className="mr-2 h-4 w-4" />
                        Admin
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" className="justify-start" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button variant="default" asChild>
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
