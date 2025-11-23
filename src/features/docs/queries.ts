import { db } from '@/lib/db';
import { requireAuth } from '@/features/auth/helpers';
import { createTenantDBFromSession } from '@/lib/multitenancy';
import { ContextLogger } from '@/lib/logger';

/**
 * Documentation project queries
 * Provides data fetching for project management and dashboard interfaces
 */

const projectLogger = new ContextLogger({ requestId: 'project-queries' });

export interface ProjectSummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  documentCount: number;
  lastActivity?: Date;
}

export interface ProjectDetails extends ProjectSummary {
  metaTitle?: string;
  metaDescription?: string;
  primaryColor?: string;
  customCss?: string;
  settings: any;
  documents: Array<{
    id: string;
    title: string;
    slug: string;
    isPublished: boolean;
    updatedAt: Date;
  }>;
  recentActivity: Array<{
    type: string;
    createdAt: Date;
    data: any;
    user?: {
      name?: string;
      email: string;
    };
  }>;
}

/**
 * Get all projects for current tenant
 */
export async function getProjects(options: {
  includePrivate?: boolean;
  search?: string;
  sortBy?: 'name' | 'updatedAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
} = {}): Promise<ProjectSummary[]> {
  try {
    const session = await requireAuth();
    
    if (!session.user.currentTenantId) {
      return [];
    }

    projectLogger.info('Fetching projects', {
      userId: session.user.id,
      tenantId: session.user.currentTenantId,
      options,
    });

    const tenantDB = await createTenantDBFromSession();

    const {
      includePrivate = true,
      search,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      limit = 50,
      offset = 0,
    } = options;

    // Build where clause
    let whereClause: any = {};
    
    if (!includePrivate) {
      whereClause.isPublic = true;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Use direct db access for complex queries with includes
    const projects = await db.project.findMany({
      where: {
        ...whereClause,
        tenantId: session.user.currentTenantId,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            documents: true,
          },
        },
        documents: {
          select: { updatedAt: true },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: offset,
      take: limit,
    });

    const projectSummaries: ProjectSummary[] = projects.map(project => ({
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description || undefined,
      isPublic: project.isPublic,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      publishedAt: project.publishedAt || undefined,
      documentCount: project._count.documents,
      lastActivity: project.documents[0]?.updatedAt,
    }));

    return projectSummaries;

  } catch (error) {
    projectLogger.error('Failed to fetch projects', error);
    return [];
  }
}

/**
 * Get detailed project information
 */
export async function getProjectDetails(projectId: string): Promise<ProjectDetails | null> {
  try {
    const session = await requireAuth();
    
    if (!session.user.currentTenantId) {
      return null;
    }

    projectLogger.info('Fetching project details', {
      userId: session.user.id,
      tenantId: session.user.currentTenantId,
      projectId,
    });

    const tenantDB = await createTenantDBFromSession();

    // Use direct db access for complex queries with includes
    const project = await db.project.findUnique({
      where: { 
        id: projectId,
        tenantId: session.user.currentTenantId,
      },
      include: {
        documents: {
          select: {
            id: true,
            title: true,
            slug: true,
            isPublished: true,
            updatedAt: true,
          },
          orderBy: [
            { order: 'asc' },
            { updatedAt: 'desc' },
          ],
        },
        _count: {
          select: {
            documents: true,
          },
        },
      },
    });

    if (!project) {
      projectLogger.warn('Project not found or access denied', {
        projectId,
        userId: session.user.id,
        tenantId: session.user.currentTenantId,
      });
      return null;
    }

    // Get recent activity for this project
    const recentActivity = await db.analyticsEvent.findMany({
      where: {
        projectId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const projectDetails: ProjectDetails = {
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description || undefined,
      isPublic: project.isPublic,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      publishedAt: project.publishedAt || undefined,
      metaTitle: project.metaTitle || undefined,
      metaDescription: project.metaDescription || undefined,
      primaryColor: project.primaryColor || undefined,
      customCss: project.customCss || undefined,
      settings: project.settings,
      documentCount: project._count.documents,
      documents: project.documents,
      recentActivity: recentActivity.map(event => ({
        type: event.type,
        createdAt: event.createdAt,
        data: event.data,
        user: event.user ? {
          name: event.user.name || undefined,
          email: event.user.email,
        } : undefined,
      })),
      lastActivity: project.documents[0]?.updatedAt,
    };

    return projectDetails;

  } catch (error) {
    projectLogger.error('Failed to fetch project details', error);
    return null;
  }
}

/**
 * Get project by slug
 */
export async function getProjectBySlug(slug: string): Promise<ProjectDetails | null> {
  try {
    const session = await requireAuth();
    
    if (!session.user.currentTenantId) {
      return null;
    }

    const tenantDB = await createTenantDBFromSession();

    // Use direct db access for complex queries
    const project = await db.project.findFirst({
      where: {
        tenantId: session.user.currentTenantId,
        slug,
        isActive: true,
      },
    });

    if (!project) {
      return null;
    }

    return await getProjectDetails(project.id);

  } catch (error) {
    projectLogger.error('Failed to fetch project by slug', error);
    return null;
  }
}

/**
 * Get public projects for tenant (for public documentation)
 */
export async function getPublicProjects(tenantSlug: string): Promise<ProjectSummary[]> {
  try {
    projectLogger.info('Fetching public projects', {
      tenantSlug,
    });

    // Find tenant by slug
    const tenant = await db.tenant.findUnique({
      where: { 
        slug: tenantSlug,
        isActive: true,
      },
      include: {
        projects: {
          where: { 
            isPublic: true,
            isActive: true,
          },
          include: {
            _count: {
              select: {
                documents: { where: { isPublished: true } },
              },
            },
          },
          orderBy: { publishedAt: 'desc' },
        },
      },
    });

    if (!tenant) {
      return [];
    }

    const publicProjects: ProjectSummary[] = tenant.projects.map(project => ({
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description || undefined,
      isPublic: project.isPublic,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      publishedAt: project.publishedAt || undefined,
      documentCount: project._count.documents,
    }));

    return publicProjects;

  } catch (error) {
    projectLogger.error('Failed to fetch public projects', error);
    return [];
  }
}

/**
 * Get project statistics for analytics
 */
export async function getProjectStats(projectId: string) {
  try {
    const session = await requireAuth();
    
    if (!session.user.currentTenantId) {
      return null;
    }

    const tenantDB = await createTenantDBFromSession();

    // Validate project access
    const project = await tenantDB.projects.findUnique({
      where: { id: projectId },
      select: { id: true, name: true },
    });

    if (!project) {
      return null;
    }

    // Get comprehensive project statistics
    const [
      totalDocuments,
      publishedDocuments,
      recentViews,
      popularDocuments,
    ] = await Promise.all([
      db.document.count({
        where: { projectId, tenantId: session.user.currentTenantId },
      }),

      db.document.count({
        where: { 
          projectId, 
          tenantId: session.user.currentTenantId,
          isPublished: true,
        },
      }),

      db.analyticsEvent.count({
        where: {
          projectId,
          tenantId: session.user.currentTenantId,
          type: 'page_view',
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),

      db.analyticsEvent.groupBy({
        by: ['documentId'],
        where: {
          projectId,
          tenantId: session.user.currentTenantId,
          type: 'page_view',
          documentId: { not: null },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        _count: {
          documentId: true,
        },
        orderBy: { 
          _count: { 
            documentId: 'desc' 
          } 
        },
        take: 5,
      }),
    ]);

    return {
      totalDocuments,
      publishedDocuments,
      recentViews,
      popularDocuments: popularDocuments.map(item => ({
        documentId: item.documentId || '',
        views: item._count.documentId,
      })),
      generatedAt: new Date(),
    };

  } catch (error) {
    projectLogger.error('Failed to fetch project stats', error);
    return null;
  }
}

/**
 * Search projects within tenant
 */
export async function searchProjects(
  query: string,
  options: {
    includePrivate?: boolean;
    limit?: number;
  } = {}
): Promise<ProjectSummary[]> {
  try {
    const session = await requireAuth();
    
    if (!session.user.currentTenantId) {
      return [];
    }

    const { includePrivate = true, limit = 20 } = options;

    projectLogger.info('Searching projects', {
      userId: session.user.id,
      tenantId: session.user.currentTenantId,
      query,
      includePrivate,
    });

    return await getProjects({
      search: query,
      includePrivate,
      limit,
    });

  } catch (error) {
    projectLogger.error('Project search failed', error);
    return [];
  }
}
