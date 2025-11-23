import { z } from 'zod';
import { redirect } from 'next/navigation';
import { requireAuth, requireTenantAccessForAPI } from '@/features/auth/helpers';
import { createTenantDBFromSession } from '@/lib/multitenancy';
import { db } from '@/lib/db';
import { ContextLogger } from '@/lib/logger';
import { createProjectSchema, updateProjectSchema } from '@/lib/validation/tenant-schemas';
import { generateSlug } from '@/lib/utils';

/**
 * Documentation project management server actions
 * Handles project CRUD operations with tenant isolation and security validation
 */

const projectLogger = new ContextLogger({ requestId: 'project-actions' });

export interface ProjectActionResult {
  success: boolean;
  message: string;
  projectId?: string;
  error?: string;
}

/**
 * Create new project
 */
export async function createProject(formData: FormData): Promise<ProjectActionResult> {
  try {
    const session = await requireAuth();
    
    if (!session.user.currentTenantId) {
      return {
        success: false,
        message: 'Please select an organization before creating a project.',
      };
    }

    const rawData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      isPublic: formData.get('isPublic') === 'true',
      metaTitle: formData.get('metaTitle') as string || undefined,
      metaDescription: formData.get('metaDescription') as string || undefined,
      primaryColor: formData.get('primaryColor') as string || undefined,
      customCss: formData.get('customCss') as string || undefined,
    };

    // Validate input
    const validatedData = createProjectSchema.parse(rawData);

    projectLogger.info('Project creation attempt', {
      userId: session.user.id,
      tenantId: session.user.currentTenantId,
      projectName: validatedData.name,
      isPublic: validatedData.isPublic,
    });

    // Generate slug from name
    const slug = generateSlug(validatedData.name);

    // Validate tenant access
    await requireTenantAccessForAPI(session.user.currentTenantId);

    // Create tenant-scoped database client
    const tenantDB = await createTenantDBFromSession();

    // Check if slug is unique within tenant - use direct db access for complex queries
    const existingProject = await db.project.findFirst({
      where: {
        tenantId: session.user.currentTenantId,
        slug,
      },
    });

    if (existingProject) {
      return {
        success: false,
        message: 'A project with this name already exists. Please choose a different name.',
      };
    }

    // Create project
    const project = await tenantDB.projects.create({
      data: {
        name: validatedData.name,
        slug,
        description: validatedData.description,
        isPublic: validatedData.isPublic,
        metaTitle: validatedData.metaTitle,
        metaDescription: validatedData.metaDescription,
        primaryColor: validatedData.primaryColor,
        customCss: validatedData.customCss,
        settings: {
          enableSearch: true,
          enableFeedback: true,
          showLastUpdated: true,
          enablePrintMode: true,
        },
      },
    });

    projectLogger.info('Project created successfully', {
      userId: session.user.id,
      tenantId: session.user.currentTenantId,
      projectId: project.id,
      projectSlug: project.slug,
      isPublic: project.isPublic,
    });

    // Track analytics event
    const tenantDB2 = await createTenantDBFromSession();
    await tenantDB2.events.create({
      data: {
        type: 'project_created',
        data: {
          projectId: project.id,
          projectName: project.name,
          isPublic: project.isPublic,
        },
      },
    });

    return {
      success: true,
      message: 'Project created successfully!',
      projectId: project.id,
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.issues[0].message,
      };
    }

    projectLogger.error('Project creation failed', error, {
      userId: (await requireAuth()).user.id,
    });

    return {
      success: false,
      message: 'Failed to create project. Please try again.',
    };
  }
}

/**
 * Update existing project
 */
export async function updateProject(
  projectId: string,
  formData: FormData
): Promise<ProjectActionResult> {
  try {
    const session = await requireAuth();
    
    if (!session.user.currentTenantId) {
      return {
        success: false,
        message: 'Tenant context required.',
      };
    }

    const rawData = {
      name: formData.get('name') as string || undefined,
      description: formData.get('description') as string || undefined,
      isPublic: formData.get('isPublic') === 'true',
      metaTitle: formData.get('metaTitle') as string || undefined,
      metaDescription: formData.get('metaDescription') as string || undefined,
      primaryColor: formData.get('primaryColor') as string || undefined,
      customCss: formData.get('customCss') as string || undefined,
    };

    // Validate input
    const validatedData = updateProjectSchema.parse(rawData);

    projectLogger.info('Project update attempt', {
      userId: session.user.id,
      tenantId: session.user.currentTenantId,
      projectId,
    });

    // Validate tenant access
    await requireTenantAccessForAPI(session.user.currentTenantId);

    // Create tenant-scoped database client
    const tenantDB = await createTenantDBFromSession();

    // Check if project exists and user has access - use direct db access for complex queries
    const existingProject = await db.project.findUnique({
      where: { 
        id: projectId,
        tenantId: session.user.currentTenantId,
      },
    });

    if (!existingProject) {
      return {
        success: false,
        message: 'Project not found or you do not have access to it.',
      };
    }

    // Generate new slug if name changed
    let updateData = { ...validatedData };
    if (validatedData.name && validatedData.name !== existingProject.name) {
      const newSlug = generateSlug(validatedData.name);
      
      // Check if new slug conflicts with existing projects
      const conflictingProject = await db.project.findFirst({
        where: {
          tenantId: session.user.currentTenantId,
          slug: newSlug,
          id: { not: projectId },
        },
      });

      if (conflictingProject) {
        return {
          success: false,
          message: 'A project with this name already exists. Please choose a different name.',
        };
      }

      updateData = { ...updateData, slug: newSlug };
    }

    // Update project
    const updatedProject = await tenantDB.projects.update({
      where: { id: projectId },
      data: updateData,
    });

    projectLogger.info('Project updated successfully', {
      userId: session.user.id,
      tenantId: session.user.currentTenantId,
      projectId: updatedProject.id,
      updatedFields: Object.keys(validatedData).filter(key => 
        validatedData[key as keyof typeof validatedData] !== undefined
      ),
    });

    // Track analytics event
    await tenantDB.events.create({
      data: {
        type: 'project_updated',
        data: {
          projectId: updatedProject.id,
          projectName: updatedProject.name,
          changes: Object.keys(updateData),
        },
      },
    });

    return {
      success: true,
      message: 'Project updated successfully!',
      projectId: updatedProject.id,
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.issues[0].message,
      };
    }

    projectLogger.error('Project update failed', error);
    return {
      success: false,
      message: 'Failed to update project. Please try again.',
    };
  }
}

/**
 * Delete project
 */
export async function deleteProject(projectId: string): Promise<ProjectActionResult> {
  try {
    const session = await requireAuth();
    
    if (!session.user.currentTenantId) {
      return {
        success: false,
        message: 'Tenant context required.',
      };
    }

    projectLogger.warn('Project deletion attempt', {
      userId: session.user.id,
      tenantId: session.user.currentTenantId,
      projectId,
    });

    // Validate tenant access
    await requireTenantAccessForAPI(session.user.currentTenantId);

    // Create tenant-scoped database client
    const tenantDB = await createTenantDBFromSession();

    // Check if project exists and get details - use direct db access
    const project = await db.project.findUnique({
      where: { 
        id: projectId,
        tenantId: session.user.currentTenantId,
      },
      include: {
        _count: {
          select: {
            documents: true,
          },
        },
      },
    });

    if (!project) {
      return {
        success: false,
        message: 'Project not found or you do not have access to it.',
      };
    }

    // Check if user has permission to delete (owner/admin or project creator)
    // For MVP, allow any authenticated tenant member to delete projects
    // TODO: Implement more granular permissions in future phases

    // Soft delete project (set isActive to false) - use direct db access
    await db.project.update({
      where: { id: projectId },
      data: { isActive: false },
    });

    projectLogger.warn('Project deleted', {
      userId: session.user.id,
      tenantId: session.user.currentTenantId,
      projectId,
      projectName: project.name,
      documentCount: project._count.documents,
    });

    // Track analytics event
    await tenantDB.events.create({
      data: {
        type: 'project_deleted',
        data: {
          projectId,
          projectName: project.name,
          documentCount: project._count.documents,
        },
      },
    });

    return {
      success: true,
      message: 'Project deleted successfully.',
    };

  } catch (error) {
    projectLogger.error('Project deletion failed', error);
    return {
      success: false,
      message: 'Failed to delete project. Please try again.',
    };
  }
}

/**
 * Toggle project public/private status
 */
export async function toggleProjectPublic(
  projectId: string,
  isPublic: boolean
): Promise<ProjectActionResult> {
  try {
    const session = await requireAuth();
    
    if (!session.user.currentTenantId) {
      return {
        success: false,
        message: 'Tenant context required.',
      };
    }

    projectLogger.info('Project visibility toggle attempt', {
      userId: session.user.id,
      tenantId: session.user.currentTenantId,
      projectId,
      newVisibility: isPublic ? 'public' : 'private',
    });

    // Validate tenant access
    await requireTenantAccessForAPI(session.user.currentTenantId);

    // Create tenant-scoped database client
    const tenantDB = await createTenantDBFromSession();

    // Update project visibility
    const updatedProject = await tenantDB.projects.update({
      where: { id: projectId },
      data: { 
        isPublic,
        publishedAt: isPublic ? new Date() : null,
      },
    });

    projectLogger.info('Project visibility updated', {
      userId: session.user.id,
      tenantId: session.user.currentTenantId,
      projectId,
      projectName: updatedProject.name,
      isPublic: updatedProject.isPublic,
    });

    // Track analytics event
    await tenantDB.events.create({
      data: {
        type: isPublic ? 'project_published' : 'project_unpublished',
        data: {
          projectId,
          projectName: updatedProject.name,
        },
      },
    });

    return {
      success: true,
      message: `Project ${isPublic ? 'published' : 'unpublished'} successfully!`,
      projectId: updatedProject.id,
    };

  } catch (error) {
    projectLogger.error('Project visibility toggle failed', error);
    return {
      success: false,
      message: 'Failed to update project visibility. Please try again.',
    };
  }
}

/**
 * Duplicate project
 */
export async function duplicateProject(projectId: string): Promise<ProjectActionResult> {
  try {
    const session = await requireAuth();
    
    if (!session.user.currentTenantId) {
      return {
        success: false,
        message: 'Tenant context required.',
      };
    }

    projectLogger.info('Project duplication attempt', {
      userId: session.user.id,
      tenantId: session.user.currentTenantId,
      sourceProjectId: projectId,
    });

    // Validate tenant access
    await requireTenantAccessForAPI(session.user.currentTenantId);

    // Create tenant-scoped database client
    const tenantDB = await createTenantDBFromSession();

    // Get source project - use direct db access for complex queries
    const sourceProject = await db.project.findUnique({
      where: { 
        id: projectId,
        tenantId: session.user.currentTenantId,
      },
      include: {
        documents: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!sourceProject) {
      return {
        success: false,
        message: 'Source project not found or you do not have access to it.',
      };
    }

    // Generate unique name and slug for duplicate
    const duplicateName = `${sourceProject.name} (Copy)`;
    let duplicateSlug = generateSlug(duplicateName);
    let counter = 1;

    // Ensure slug is unique - use direct db access
    while (await db.project.findFirst({ 
      where: { 
        tenantId: session.user.currentTenantId,
        slug: duplicateSlug 
      } 
    })) {
      duplicateSlug = generateSlug(`${duplicateName} ${counter}`);
      counter++;
    }

    // Create duplicate project
    const duplicateProject = await tenantDB.projects.create({
      data: {
        name: duplicateName,
        slug: duplicateSlug,
        description: sourceProject.description,
        isPublic: false, // Always create as private
        metaTitle: sourceProject.metaTitle,
        metaDescription: sourceProject.metaDescription,
        primaryColor: sourceProject.primaryColor,
        customCss: sourceProject.customCss,
        settings: sourceProject.settings,
      },
    });

    // TODO: Duplicate documents in Phase 3.3
    
    projectLogger.info('Project duplicated successfully', {
      userId: session.user.id,
      tenantId: session.user.currentTenantId,
      sourceProjectId: projectId,
      duplicateProjectId: duplicateProject.id,
      documentCount: sourceProject.documents.length,
    });

    // Track analytics event
    await tenantDB.events.create({
      data: {
        type: 'project_duplicated',
        data: {
          sourceProjectId: projectId,
          duplicateProjectId: duplicateProject.id,
          projectName: duplicateProject.name,
        },
      },
    });

    return {
      success: true,
      message: 'Project duplicated successfully!',
      projectId: duplicateProject.id,
    };

  } catch (error) {
    projectLogger.error('Project duplication failed', error);
    return {
      success: false,
      message: 'Failed to duplicate project. Please try again.',
    };
  }
}
