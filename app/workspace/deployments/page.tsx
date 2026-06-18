import { prisma } from "@/lib/prisma";
import DeploymentList from "./components/DeploymentList";

export const dynamic = "force-dynamic";

export default async function DeploymentsPage() {
  const deployments = await prisma.deploymentLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="w-full max-w-[1400px] mx-auto px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Deployments</h1>
          <p className="text-sm text-text-muted mt-1">
            Monitor and trigger VPS container deployments
          </p>
        </div>
      </div>

      <DeploymentList initialDeployments={deployments} />
    </div>
  );
}
