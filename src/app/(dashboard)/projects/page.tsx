import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus, Search, Grid3X3, List, Filter, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getProjects } from '@/features/docs/queries';
import { formatRelativeTime } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Projects - DokuNote',
  description: 'Manage your documentation projects',
};

interface ProjectsPageProps {
  searchParams: {
    search?: string;
    view?: 'grid' | 'list';
  };
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const search = searchParams.search || '';
  const view = searchParams.view || 'grid';

  // Get projects with search
  const projects = await getProjects({
    search: search || undefined,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Create and manage your documentation projects
          </p>
        </div>
        
        <Button asChild>
          <Link href="/dashboard/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                defaultValue={search}
                className="pl-10"
                name="search"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
              
              <Separator orientation="vertical" className="h-8" />
              
              <div className="flex rounded-lg border border-border p-1">
                <Button
                  variant={view === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  asChild
                >
                  <Link href={`/dashboard/projects?view=grid${search ? `&search=${search}` : ''}`}>
                    <Grid3X3 className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant={view === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  asChild
                >
                  <Link href={`/dashboard/projects?view=list${search ? `&search=${search}` : ''}`}>
                    <List className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {search ? 'No projects found' : 'No projects yet'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {search 
                  ? `No projects match "${search}". Try adjusting your search terms.`
                  : 'Create your first documentation project to get started with DokuNote.'
                }
              </p>
              
              {!search && (
                <div className="space-y-4">
                  <Button asChild>
                    <Link href="/dashboard/projects/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Project
                    </Link>
                  </Button>
                  
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-2">Projects help you organize your documentation:</p>
                    <ul className="text-xs space-y-1">
                      <li>• Group related documents together</li>
                      <li>• Control public/private access</li>
                      <li>• Customize branding and appearance</li>
                      <li>• Track analytics and engagement</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={
          view === 'grid' 
            ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'
            : 'space-y-4'
        }>
          {projects.map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
              <Card className="h-full transition-colors hover:bg-accent/50 cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-1">
                      {project.name}
                    </CardTitle>
                    <Badge variant={project.isPublic ? 'default' : 'secondary'}>
                      {project.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                  {project.description && (
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4 text-muted-foreground">
                      <span>{project.documentCount} docs</span>
                      {project.lastActivity && (
                        <span>Updated {formatRelativeTime(project.lastActivity)}</span>
                      )}
                    </div>
                  </div>
                  
                  {project.isPublic && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Published {project.publishedAt ? formatRelativeTime(project.publishedAt) : 'recently'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Summary */}
      {projects.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              Showing {projects.length} project{projects.length !== 1 ? 's' : ''}
              {search && ` matching "${search}"`}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
