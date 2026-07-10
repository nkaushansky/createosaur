import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Loader2, Save, Key, User, Shield, LogOut, Eye, EyeOff } from 'lucide-react'

interface UserProfileProps {
  onClose?: () => void
}

export const UserProfile = ({ onClose }: UserProfileProps) => {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showKeys, setShowKeys] = useState(false)

  const [profile, setProfile] = useState({
    display_name: '',
    api_keys: {
      huggingface: '',
      openai: '',
      stability: ''
    }
  })

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error
      }

      if (data) {
        setProfile({
          display_name: data.display_name || '',
          api_keys: data.api_keys || {
            huggingface: '',
            openai: '',
            stability: ''
          }
        })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    if (!user) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          display_name: profile.display_name,
          api_keys: profile.api_keys,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error('Profile save error:', error)
        throw error
      }

      setSuccess('Profile saved successfully!')
    } catch (err: any) {
      console.error('Profile save failed:', err)
      setError(`Failed to save profile: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('api_keys.')) {
      const keyType = field.split('.')[1]
      setProfile(prev => ({
        ...prev,
        api_keys: {
          ...prev.api_keys,
          [keyType]: value
        }
      }))
    } else {
      setProfile(prev => ({
        ...prev,
        [field]: value
      }))
    }
    setError(null)
    setSuccess(null)
  }

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      setError(error.message)
    } else {
      onClose?.()
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading profile...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          User Profile
        </CardTitle>
        <CardDescription>
          Manage your account settings and API keys
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  value={profile.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  placeholder="Enter your display name"
                />
              </div>

              <Button onClick={saveProfile} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Profile
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">API Keys</h3>
                  <p className="text-sm text-muted-foreground">
                    Store your AI provider API keys securely
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="show-keys" className="text-sm">Show keys</Label>
                  <Switch
                    id="show-keys"
                    checked={showKeys}
                    onCheckedChange={setShowKeys}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="huggingface-key">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Hugging Face API Key
                    </div>
                  </Label>
                  <div className="relative">
                    <Input
                      id="huggingface-key"
                      type={showKeys ? 'text' : 'password'}
                      value={profile.api_keys.huggingface}
                      onChange={(e) => handleInputChange('api_keys.huggingface', e.target.value)}
                      placeholder="hf_..."
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Free API key from huggingface.co for AI image generation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="openai-key">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      OpenAI API Key
                    </div>
                  </Label>
                  <div className="relative">
                    <Input
                      id="openai-key"
                      type={showKeys ? 'text' : 'password'}
                      value={profile.api_keys.openai}
                      onChange={(e) => handleInputChange('api_keys.openai', e.target.value)}
                      placeholder="sk-..."
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Optional: For enhanced image generation capabilities
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stability-key">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Stability AI API Key
                    </div>
                  </Label>
                  <div className="relative">
                    <Input
                      id="stability-key"
                      type={showKeys ? 'text' : 'password'}
                      value={profile.api_keys.stability}
                      onChange={(e) => handleInputChange('api_keys.stability', e.target.value)}
                      placeholder="sk-..."
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Optional: For Stable Diffusion image generation
                  </p>
                </div>
              </div>

              <Button onClick={saveProfile} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Shield className="mr-2 h-4 w-4" />
                Save API Keys
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mt-4">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Separator className="my-6" />

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">
              Signed in as {user?.email}
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}