import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ProjectForm } from '@/components/forms/project-form';
import { requireTenantAccess } from '@/features/auth/helpers';

export const metadata: Metadata = {
  title: 'New Project - DokuNote',
  description: 'Create a new documentation project',
};

export default async function NewProjectPage() {
  // Ensure user has access to current tenant
  await requireTenantAccess();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/projects">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>
        </Button>
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
          <p className="text-muted-foreground">
            Start a new documentation project for your organization
          </p>
        </div>
      </div>

      {/* Project Form */}
      <div className="max-w-4xl">
        <ProjectForm mode="create" />
      </div>

      {/* Help Section */}
      <div className="max-w-4xl">
        <div className="bg-muted/50 rounded-lg p-6">
          <h3 className="font-semibold mb-3">Project Tips</h3>
          <div className="grid gap-3 text-sm text-muted-foreground">
            <div className="flex items-start space-x-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Choose a clear name:</strong> Use descriptive names like "API Documentation" 
                or "User Guide" to help your team understand the project's purpose.
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Public vs Private:</strong> Public projects are accessible to anyone at your 
                organization's subdomain. Private projects require team member access.
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-primary">•</span>
              <span>
                <strong>SEO optimization:</strong> Add meta titles and descriptions to improve 
                how your documentation appears in search engines.
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Brand consistency:</strong> Customize colors and CSS to match your 
                organization's brand guidelines.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
