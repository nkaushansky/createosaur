import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Settings, LogOut, Crown, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from './AuthForm';

interface HeaderAuthProps {
  onCommunityClick: () => void;
  onSettingsClick?: () => void;
}

export const HeaderAuth = ({ onCommunityClick, onSettingsClick }: HeaderAuthProps) => {
  const { user, signOut } = useAuth();
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const getUserInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const getUserDisplayName = (email: string) => {
    return email.split('@')[0];
  };

  if (user) {
    // Authenticated user - show user menu with community and settings
    return (
      <div className="flex items-center gap-2">
        {/* Community Button */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={onCommunityClick}
          className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20 hover:from-green-500/20 hover:to-blue-500/20"
        >
          <Globe className="w-4 h-4 mr-2" />
          Community
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials(user.email || '')}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium">{getUserDisplayName(user.email || '')}</p>
                <p className="w-[200px] truncate text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSettingsClick}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings & API Keys</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Anonymous user - show community and auth buttons
  return (
    <div className="flex items-center gap-2">
      {/* Community Button */}
      <Button 
        variant="outline" 
        size="sm"
        onClick={onCommunityClick}
        className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20 hover:from-green-500/20 hover:to-blue-500/20"
      >
        <Globe className="w-4 h-4 mr-2" />
        Community
      </Button>

      {/* Sign Up / Sign In */}
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            size="sm" 
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            <User className="w-4 h-4 mr-2" />
            Sign Up
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Join Createosaur
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">Create an account to:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Save your creatures permanently</li>
                <li>Share creations with the community</li>
                <li>Add your own API keys for unlimited generations</li>
                <li>Access advanced customization features</li>
              </ul>
            </div>
            <AuthForm onSuccess={() => setIsAuthDialogOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};