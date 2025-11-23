import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { 
  ArrowLeft, 
  Settings, 
  Globe, 
  FileText, 
  Calendar,
  Users,
  BarChart3,
  Plus,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getProjectDetails, getProjectStats } from '@/features/docs/queries';
import { requireTenantAccess } from '@/features/auth/helpers';
import { formatRelativeTime, formatDate } from '@/lib/utils';

interface ProjectPageProps {
  params: {
    projectId: string;
  };
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const project = await getProjectDetails(params.projectId);
  
  if (!project) {
    return {
      title: 'Project Not Found - DokuNote',
    };
  }

  return {
    title: `${project.name} - DokuNote`,
    description: project.description || `${project.name} documentation project`,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  // Ensure user has tenant access
  await requireTenantAccess();

  // Get project details
  const project = await getProjectDetails(params.projectId);
  
  if (!project) {
    notFound();
  }

  // Get project statistics
  const stats = await getProjectStats(params.projectId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/projects">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Projects
              </Link>
            </Button>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">{project.name}</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant={project.isPublic ? 'default' : 'secondary'}>
              {project.isPublic ? (
                <>
                  <Globe className="mr-1 h-3 w-3" />
                  Public
                </>
              ) : (
                <>
                  <EyeOff className="mr-1 h-3 w-3" />
                  Private
                </>
              )}
            </Badge>
          </div>
          
          {project.description && (
            <p className="text-muted-foreground max-w-2xl">
              {project.description}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {project.isPublic && (
            <Button variant="outline" size="sm" asChild>
              <Link 
                href={`https://your-tenant.dokunote.com/${project.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Public
              </Link>
            </Button>
          )}
          
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/projects/${project.id}/settings`}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">
            Documents
            <Badge variant="secondary" className="ml-2">
              {project.documentCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalDocuments || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.publishedDocuments || 0} published
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.recentViews || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Last 7 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Created</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDate(project.createdAt).split(' ')[0]}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(project.createdAt)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {project.lastActivity ? formatDate(project.lastActivity).split(' ')[0] : 'Never'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {project.lastActivity ? formatRelativeTime(project.lastActivity) : 'No activity'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Button className="justify-start h-auto p-4" asChild>
                  <Link href={`/dashboard/projects/${project.id}/docs/new`}>
                    <div className="flex flex-col items-start space-y-1">
                      <div className="flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span className="font-medium">New Document</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Create a new page in this project
                      </span>
                    </div>
                  </Link>
                </Button>

                <Button variant="outline" className="justify-start h-auto p-4" asChild>
                  <Link href={`/dashboard/projects/${project.id}/settings`}>
                    <div className="flex flex-col items-start space-y-1">
                      <div className="flex items-center space-x-2">
                        <Settings className="h-4 w-4" />
                        <span className="font-medium">Project Settings</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Configure project options
                      </span>
                    </div>
                  </Link>
                </Button>

                {project.isPublic && (
                  <Button variant="outline" className="justify-start h-auto p-4" asChild>
                    <Link 
                      href={`https://your-tenant.dokunote.com/${project.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="flex flex-col items-start space-y-1">
                        <div className="flex items-center space-x-2">
                          <ExternalLink className="h-4 w-4" />
                          <span className="font-medium">View Public Site</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Open public documentation
                        </span>
                      </div>
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          {project.documents.length > 0 ? (
            <div className="grid gap-4">
              {project.documents.map((doc) => (
                <Card key={doc.id} className="transition-colors hover:bg-accent/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{doc.title}</h3>
                          <Badge 
                            variant={doc.isPublished ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {doc.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          /{doc.slug}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Updated {formatRelativeTime(doc.updatedAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/projects/${project.id}/docs/${doc.slug}/edit`}>
                            Edit
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/projects/${project.id}/docs/${doc.slug}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first document to start building your documentation.
                  </p>
                  
                  <Button asChild>
                    <Link href={`/dashboard/projects/${project.id}/docs/new`}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Document
                    </Link>
                  </Button>
                  
                  <div className="text-sm text-muted-foreground mt-4">
                    <p>Documents will appear here once created. You can:</p>
                    <ul className="text-xs space-y-1 mt-2">
                      <li>• Write in Markdown with live preview</li>
                      <li>• Organize documents in hierarchies</li>
                      <li>• Publish publicly or keep private</li>
                      <li>• Track views and engagement</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest changes and updates to this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {project.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {project.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 pb-4 last:pb-0 last:border-b-0 border-b border-border">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium capitalize">
                            {activity.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(activity.createdAt)}
                          </span>
                        </div>
                        {activity.user && (
                          <p className="text-xs text-muted-foreground">
                            by {activity.user.name || activity.user.email}
                          </p>
                        )}
                        {activity.data && typeof activity.data === 'object' && (
                          <div className="text-xs text-muted-foreground">
                            {JSON.stringify(activity.data, null, 2).slice(0, 100)}...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                  <p className="text-xs mt-1">Activity will appear here as team members work on this project</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Document Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Documents</span>
                    <span className="font-medium">{stats?.totalDocuments || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Published</span>
                    <span className="font-medium">{stats?.publishedDocuments || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Drafts</span>
                    <span className="font-medium">
                      {(stats?.totalDocuments || 0) - (stats?.publishedDocuments || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Views (7 days)</span>
                    <span className="font-medium">{stats?.recentViews || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Popular Documents</span>
                    <span className="font-medium">{stats?.popularDocuments?.length || 0}</span>
                  </div>
                </div>
                
                {stats?.popularDocuments && stats.popularDocuments.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h4 className="text-sm font-medium">Most Viewed</h4>
                    {stats.popularDocuments.slice(0, 3).map((doc, index) => (
                      <div key={doc.documentId} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          #{index + 1} Document
                        </span>
                        <span className="font-medium">{doc.views} views</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Analytics placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                Detailed insights and reporting for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Advanced analytics coming in Phase 4.2</p>
                <p className="text-xs mt-1">
                  Charts, trends, and detailed reporting will be available soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
