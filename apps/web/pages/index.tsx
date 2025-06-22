import { MainLayout } from "@/components/layout/MainLayout";

export default function Home() {
  return (
    <MainLayout title="Enterprise Boilerplate">
      <section className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Welcome to Enterprise Boilerplate
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A professional, scalable, and modern full-stack TypeScript monorepo
            with enterprise-level architecture patterns.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 border rounded-lg bg-card">
              <h3 className="text-xl font-semibold mb-2">Type-Safe</h3>
              <p className="text-muted-foreground">
                End-to-end type safety with shared TypeScript types across API
                and frontend.
              </p>
            </div>

            <div className="p-6 border rounded-lg bg-card">
              <h3 className="text-xl font-semibold mb-2">Scalable</h3>
              <p className="text-muted-foreground">
                Organized with professional architecture patterns: controllers,
                services, and layers.
              </p>
            </div>

            <div className="p-6 border rounded-lg bg-card">
              <h3 className="text-xl font-semibold mb-2">Modern</h3>
              <p className="text-muted-foreground">
                Built with Next.js, shadcn/ui, Tailwind CSS, and enterprise best
                practices.
              </p>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
