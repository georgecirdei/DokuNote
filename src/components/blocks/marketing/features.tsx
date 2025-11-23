import { 
  FileText, 
  Users, 
  BarChart3, 
  Shield, 
  Palette, 
  Search,
  Globe,
  Zap
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: FileText,
    title: 'MDX-Powered Editor',
    description: 'Write in Markdown with React components. Full MDX support with syntax highlighting and live preview.',
  },
  {
    icon: Users,
    title: 'Multi-Tenant Architecture', 
    description: 'Built for teams. Each organization gets their own isolated workspace with role-based permissions.',
  },
  {
    icon: Globe,
    title: 'Custom Subdomains',
    description: 'Professional documentation URLs like docs.yourcompany.com or yourcompany.dokunote.com.',
  },
  {
    icon: BarChart3,
    title: 'Built-in Analytics',
    description: 'Track page views, popular content, search queries, and user engagement with detailed insights.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'SOC 2 compliant with SSO, advanced permissions, audit logs, and data encryption.',
  },
  {
    icon: Search,
    title: 'Powerful Search',
    description: 'Fast, accurate search with filters, autocomplete, and content highlighting across all your docs.',
  },
  {
    icon: Palette,
    title: 'Custom Branding',
    description: 'Match your brand with custom colors, logos, fonts, and CSS. White-label ready.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Built on Next.js 15 and React 19. Optimized for performance with edge caching.',
  },
];

export function Features() {
  return (
    <section className="container px-4 py-16 mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Everything You Need for Great Documentation
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          DokuNote provides all the tools your team needs to create, maintain, and publish 
          world-class documentation that users actually want to read.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card key={index} className="border-border/50 hover:border-border transition-colors">
              <CardHeader className="pb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
