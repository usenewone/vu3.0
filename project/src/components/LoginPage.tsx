
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, accessAsGuest } = useAuth();

  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(username, password);
    
    if (error) {
      setError(error.message);
    }
    
    setLoading(false);
  };

  const handleGuestAccess = () => {
    accessAsGuest();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-beige via-cream-white to-soft-gray flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-warm-beige/50 via-cream-white/30 to-transparent"></div>
      
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-accent-gold/20 rounded-full animate-floating-slow"></div>
      <div className="absolute bottom-20 right-10 w-16 h-16 bg-secondary-brown/20 rounded-full animate-floating-fast"></div>
      <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-primary-brown/10 rounded-full animate-floating-medium"></div>

      <div className="relative max-w-md w-full space-y-8 animate-fade-in">
        <div className="text-center">
          <h1 className="text-6xl font-playfair font-bold text-primary-brown mb-4 animate-slide-up">
            Vaishnavi Upadhyay
          </h1>
          <p className="text-xl text-secondary-brown font-poppins animate-fade-in-delay-1">
            Interior Designer Portfolio
          </p>
        </div>

        <div className="space-y-6">
          {/* Owner Login Card */}
          <Card className="bg-card-gradient backdrop-blur-sm border-0 shadow-xl hover-lift">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-poppins text-primary-brown">
                Owner Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleOwnerLogin} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white/70 border-primary-brown/20 focus:border-primary-brown"
                    required
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/70 border-primary-brown/20 focus:border-primary-brown"
                    required
                  />
                </div>
                {error && (
                  <p className="text-red-600 text-sm font-inter">{error}</p>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary-brown to-secondary-brown hover:scale-105 transition-all duration-300 font-poppins"
                >
                  {loading ? 'Signing In...' : 'Sign In as Owner'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Guest Access Card */}
          <Card className="bg-card-gradient backdrop-blur-sm border-0 shadow-xl hover-lift">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-poppins text-primary-brown">
                Guest Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-dark font-inter mb-4 text-center">
                View the portfolio without signing in
              </p>
              <Button
                onClick={handleGuestAccess}
                variant="outline"
                className="w-full border-2 border-primary-brown text-primary-brown hover:bg-primary-brown hover:text-white transition-all duration-300 font-poppins"
              >
                View Portfolio as Guest
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-sm text-text-light font-inter">
            Creating beautiful, functional spaces that reflect your unique style
          </p>
        </div>
      </div>
    </div>
  );
};
