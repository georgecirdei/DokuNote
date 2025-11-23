import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  ArrowLeft, 
  Settings, 
  Globe, 
  Palette,
  Code,
  Trash2,
  Copy,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ProjectForm } from '@/components/forms/project-form';
import { getProjectDetails } from '@/features/docs/queries';
import { requireTenantAccess, getCurrentTenant } from '@/features/auth/helpers';
import { formatDate } from '@/lib/utils';

interface ProjectSettingsPageProps {
  params: {
    projectId: string;
  };
}

export async function generateMetadata({ params }: ProjectSettingsPageProps): Promise<Metadata> {
  const project = await getProjectDetails(params.projectId);
  
  if (!project) {
    return {
      title: 'Project Not Found - DokuNote',
    };
  }

  return {
    title: `${project.name} Settings - DokuNote`,
    description: `Manage settings for ${project.name}`,
  };
}

export default async function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  // Ensure user has tenant access
  await requireTenantAccess();

  // Get project details and tenant context
  const project = await getProjectDetails(params.projectId);
  const currentTenant = await getCurrentTenant();
  
  if (!project) {
    notFound();
  }

  // Check user permissions
  const userRole = currentTenant?.userTenants?.[0]?.role || 'viewer';
  const canManageProject = userRole === 'owner' || userRole === 'admin';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/dashboard/projects" className="text-muted-foreground hover:text-foreground">
              Projects
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link href={`/dashboard/projects/${project.id}`} className="text-muted-foreground hover:text-foreground">
              {project.name}
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">Settings</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold tracking-tight">Project Settings</h1>
            <Badge variant={project.isPublic ? 'default' : 'secondary'}>
              {project.isPublic ? 'Public' : 'Private'}
            </Badge>
          </div>
          
          <p className="text-muted-foreground">
            Manage settings and configuration for {project.name}
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link href={`/dashboard/projects/${project.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Link>
        </Button>
      </div>

      {/* Permission Check */}
      {!canManageProject && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have read-only access to this project. Contact an administrator to make changes.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="publishing">Publishing</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          {canManageProject ? (
            <ProjectForm
              mode="edit"
              initialData={{
                id: project.id,
                name: project.name,
                description: project.description,
                isPublic: project.isPublic,
                metaTitle: project.metaTitle,
                metaDescription: project.metaDescription,
                primaryColor: project.primaryColor,
                customCss: project.customCss,
              }}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
                <CardDescription>
                  Basic information about this project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-muted-foreground mt-1">{project.name}</p>
                </div>
                
                {project.description && (
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(project.createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Publishing Settings */}
        <TabsContent value="publishing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Public Access</span>
              </CardTitle>
              <CardDescription>
                Control who can access this project's documentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <div className="font-medium">
                    {project.isPublic ? 'Public Documentation' : 'Private Documentation'}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {project.isPublic 
                      ? 'This project is accessible to anyone on the internet'
                      : 'This project is only accessible to team members'
                    }
                  </p>
                </div>
                <Badge variant={project.isPublic ? 'default' : 'secondary'}>
                  {project.isPublic ? 'Public' : 'Private'}
                </Badge>
              </div>

              {project.isPublic && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Public URL</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm flex-1">
                        {currentTenant?.subdomain || 'your-org'}.dokunote.com/{project.slug}
                      </code>
                      <Button variant="ghost" size="sm" asChild>
                        <Link 
                          href={`https://${currentTenant?.subdomain || 'your-org'}.dokunote.com/${project.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">SEO Settings</Label>
                    <div className="grid gap-3 mt-2">
                      <div>
                        <span className="text-xs text-muted-foreground">Meta Title:</span>
                        <p className="text-sm mt-1">
                          {project.metaTitle || project.name}
                        </p>
                      </div>
                      {project.metaDescription && (
                        <div>
                          <span className="text-xs text-muted-foreground">Meta Description:</span>
                          <p className="text-sm mt-1">
                            {project.metaDescription}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {project.publishedAt && (
                    <div>
                      <Label className="text-sm font-medium">Published</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(project.publishedAt)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Settings */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Brand Customization</span>
              </CardTitle>
              <CardDescription>
                Customize the appearance of your documentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {project.primaryColor && (
                <div>
                  <Label className="text-sm font-medium">Primary Color</Label>
                  <div className="flex items-center space-x-3 mt-2">
                    <div
                      className="w-8 h-8 rounded-lg border border-border"
                      style={{ backgroundColor: project.primaryColor }}
                    />
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {project.primaryColor}
                    </code>
                  </div>
                </div>
              )}

              {project.customCss && (
                <div>
                  <Label className="text-sm font-medium flex items-center space-x-2">
                    <Code className="h-4 w-4" />
                    <span>Custom CSS</span>
                  </Label>
                  <div className="mt-2">
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-40">
                      {project.customCss.slice(0, 500)}
                      {project.customCss.length > 500 && '...'}
                    </pre>
                  </div>
                </div>
              )}

              {!project.primaryColor && !project.customCss && (
                <div className="text-center py-8 text-muted-foreground">
                  <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No custom branding configured</p>
                  <p className="text-xs mt-1">
                    Add colors and custom CSS to personalize your documentation
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Actions</CardTitle>
              <CardDescription>
                Advanced project management and maintenance actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <div className="font-medium">Duplicate Project</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create a copy of this project with all its settings
                    </p>
                  </div>
                  <Button variant="outline" size="sm" disabled={!canManageProject}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <div className="font-medium">Export Data</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Export all project content and settings
                    </p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Export
                    <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Danger Zone */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold text-red-600">Danger Zone</h3>
                </div>
                
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    These actions are permanent and cannot be undone. Please proceed with caution.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950/20">
                    <div>
                      <div className="font-medium text-red-600">Delete Project</div>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        Permanently delete this project and all its documents
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        This action cannot be undone
                      </p>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      disabled={!canManageProject}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Project
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>
                Technical details and metadata
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project ID:</span>
                  <code className="bg-muted px-1 py-0.5 rounded text-xs">
                    {project.id}
                  </code>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slug:</span>
                  <code className="bg-muted px-1 py-0.5 rounded text-xs">
                    {project.slug}
                  </code>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDate(project.createdAt)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Modified:</span>
                  <span>{formatDate(project.updatedAt)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Documents:</span>
                  <span>{project.documentCount}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={project.isPublic ? 'default' : 'secondary'}>
                    {project.isPublic ? 'Public' : 'Private'}
                  </Badge>
                </div>

                {project.publishedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Published:</span>
                    <span>{formatDate(project.publishedAt)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
