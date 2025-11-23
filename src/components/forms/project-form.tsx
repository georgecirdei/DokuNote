'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Palette, Globe, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { createProject, updateProject } from '@/features/docs/actions';

interface ProjectFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    id?: string;
    name?: string;
    description?: string;
    isPublic?: boolean;
    metaTitle?: string;
    metaDescription?: string;
    primaryColor?: string;
    customCss?: string;
  };
  onSuccess?: (projectId: string) => void;
}

export function ProjectForm({ mode, initialData, onSuccess }: ProjectFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(initialData?.isPublic || false);
  const [primaryColor, setPrimaryColor] = useState(initialData?.primaryColor || '#0066CC');
  
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.set('isPublic', isPublic.toString());
    formData.set('primaryColor', primaryColor);

    try {
      const result = mode === 'create' 
        ? await createProject(formData)
        : await updateProject(initialData?.id!, formData);

      if (!result.success) {
        setError(result.message);
        return;
      }

      toast({
        title: mode === 'create' ? 'Project created!' : 'Project updated!',
        description: result.message,
      });

      if (onSuccess && result.projectId) {
        onSuccess(result.projectId);
      } else if (mode === 'create' && result.projectId) {
        router.push(`/dashboard/projects/${result.projectId}`);
      } else {
        router.refresh();
      }

    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Project form error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>{mode === 'create' ? 'Create New Project' : 'Edit Project'}</span>
        </CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? 'Create a new documentation project for your organization'
            : 'Update your project settings and configuration'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="publishing">Publishing</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="API Documentation"
                    required
                    disabled={isLoading}
                    defaultValue={initialData?.name}
                  />
                  <p className="text-xs text-muted-foreground">
                    A clear, descriptive name for your documentation project
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Complete API reference and integration guides"
                    disabled={isLoading}
                    defaultValue={initialData?.description}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional description to help your team understand the project's purpose
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Publishing Tab */}
            <TabsContent value="publishing" className="space-y-4">
              <div className="grid gap-6">
                {/* Public/Private Toggle */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <Label className="text-base font-medium">
                        Public Documentation
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Make this project accessible to the public at your organization's subdomain
                    </p>
                    {isPublic && (
                      <p className="text-xs text-blue-600">
                        Will be available at: your-org.dokunote.com
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                    disabled={isLoading}
                  />
                </div>

                {/* SEO Settings */}
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input
                      id="metaTitle"
                      name="metaTitle"
                      type="text"
                      placeholder="API Documentation - Your Company"
                      disabled={isLoading}
                      defaultValue={initialData?.metaTitle}
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground">
                      SEO title for search engines (max 60 characters)
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <Textarea
                      id="metaDescription"
                      name="metaDescription"
                      placeholder="Complete API reference and integration guides for developers"
                      disabled={isLoading}
                      defaultValue={initialData?.metaDescription}
                      rows={2}
                      maxLength={160}
                    />
                    <p className="text-xs text-muted-foreground">
                      SEO description for search engines (max 160 characters)
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Branding Tab */}
            <TabsContent value="branding" className="space-y-4">
              <div className="grid gap-6">
                {/* Primary Color */}
                <div className="grid gap-4">
                  <div className="flex items-center space-x-2">
                    <Palette className="h-4 w-4" />
                    <Label className="text-base font-medium">Brand Color</Label>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-12 h-12 rounded-lg border border-border"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <div className="flex-1">
                      <Input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        disabled={isLoading}
                        className="w-20 h-10"
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {primaryColor}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Primary color for your documentation theme
                  </p>
                </div>

                {/* Custom CSS */}
                <div className="grid gap-2">
                  <Label htmlFor="customCss">Custom CSS</Label>
                  <Textarea
                    id="customCss"
                    name="customCss"
                    placeholder="/* Add custom styles for your documentation */
.custom-header {
  background: linear-gradient(90deg, #0066cc, #004499);
}"
                    disabled={isLoading}
                    defaultValue={initialData?.customCss}
                    rows={8}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Custom CSS to personalize your documentation appearance
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <FileText className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                mode === 'create' ? 'Create Project' : 'Update Project'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
