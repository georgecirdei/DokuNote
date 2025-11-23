import Link from 'next/link';
import { ArrowRight, Github, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Hero() {
  return (
    <section className="container px-4 py-16 mx-auto">
      <div className="flex flex-col items-center text-center spacing-compact-lg">
        {/* Badge */}
        <Badge variant="secondary" className="mb-4">
          <Star className="mr-1 h-3 w-3 fill-current" />
          Open Source & Self-Hosted
        </Badge>

        {/* Heading */}
        <h1 className="heading-compact font-bold text-foreground max-w-3xl">
          Create Beautiful Documentation
          <span className="text-primary block">That Your Team Will Love</span>
        </h1>

        {/* Description */}
        <p className="prose-compact text-muted-foreground max-w-2xl mt-4">
          DokuNote is an enterprise-grade, multi-tenant documentation platform built with Next.js 15 and React 19. 
          Create, collaborate, and publish stunning documentation with powerful features like real-time collaboration, 
          custom subdomains, and advanced analytics.
        </p>

        {/* Features List */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
          <span className="flex items-center">
            ✨ Multi-tenant architecture
          </span>
          <span className="flex items-center">
            🚀 Custom subdomains
          </span>
          <span className="flex items-center">
            📊 Built-in analytics
          </span>
          <span className="flex items-center">
            🔒 Enterprise security
          </span>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button size="lg" className="min-w-[140px]" asChild>
            <Link href="/dashboard">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="min-w-[140px]" asChild>
            <Link href="https://github.com/georgecirdei/DokuNote" target="_blank">
              <Github className="mr-2 h-4 w-4" />
              View on GitHub
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="flex flex-col sm:flex-row items-center gap-8 mt-12 pt-8 border-t border-border">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">10,000+</div>
            <div className="text-sm text-muted-foreground">Documents Created</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">500+</div>
            <div className="text-sm text-muted-foreground">Teams Using DokuNote</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">99.9%</div>
            <div className="text-sm text-muted-foreground">Uptime SLA</div>
          </div>
        </div>
      </div>
    </section>
  );
}
