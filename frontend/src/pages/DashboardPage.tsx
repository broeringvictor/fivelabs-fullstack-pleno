import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appraisalService, reportService } from "@/services/api.service";
import { MainLayout } from "@/components/MainLayout";
import { SectionCards } from "@/components/section-cards";
import { CampaignsSection } from "@/components/campaigns-section";
import { AppraisalResultsSection } from "@/components/appraisal-results-section";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle } from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const queryClient = useQueryClient();

  const { data: report, isLoading } = useQuery({
    queryKey: ["dashboard-report"],
    queryFn: reportService.getDashboard,
    refetchInterval: (query) => {
      const data = query.state.data as any;
      if (!data?.isProcessing) return false;
      const startedAt = data?.lastAppraisal?.updatedAt
        ? Date.parse(data.lastAppraisal.updatedAt)
        : Date.now();
      const elapsed = Date.now() - startedAt;
      if (elapsed < 10_000) return 3000;
      if (elapsed < 60_000) return 10_000;
      if (elapsed < 5 * 60_000) return 60_000;
      return false;
    },
    retry: 1,
    staleTime: 0,
  });

  const appraisalMutation = useMutation({
    mutationFn: appraisalService.trigger,
    onSuccess: () => {
      toast.info("Apuração iniciada! Os dados serão atualizados em breve.");
      queryClient.invalidateQueries({ queryKey: ["dashboard-report"] });
      queryClient.invalidateQueries({ queryKey: ["appraisals"] });
    },
  });

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Performance Global</h2>
            <p className="text-sm text-muted-foreground">
              Acompanhamento de metas e apurações.
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => appraisalMutation.mutate()}
            disabled={appraisalMutation.isPending || report?.isProcessing}
          >
            {appraisalMutation.isPending || report?.isProcessing ? (
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            ) : (
              <PlayCircle className="mr-2 h-3 w-3" />
            )}
            {report?.isProcessing ? "Processando..." : "Executar Apuração"}
          </Button>
        </div>

        <SectionCards data={report?.kpis} isLoading={isLoading} />

        <CampaignsSection />

        <AppraisalResultsSection />
      </div>
    </MainLayout>
  );
}
