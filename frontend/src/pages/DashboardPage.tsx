import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appraisalService, reportService } from "@/services/api.service";
import { MainLayout } from "@/components/MainLayout";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, PlayCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { GoalsTable } from "@/components/goals-table";

export default function DashboardPage() {
  const queryClient = useQueryClient();

  const { data: report, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard-report"],
    queryFn: reportService.getDashboard,
    // Exponential/backoff polling while processing to reduce traffic:
    // - first 10s: poll every 3s
    // - 10s..60s: poll every 10s
    // - 60s..5min: poll every 60s
    // - after 5min: stop automatic polling
    refetchInterval: (query) => {
      const data = query.state.data as any;
      if (!data?.isProcessing) return false;

      // Prefer explicit timestamp from backend if available
      const lastUpdatedStr = data?.lastAppraisal?.updatedAt;
      const startedAt = lastUpdatedStr ? Date.parse(lastUpdatedStr) : query.state.dataUpdatedAt || Date.now();
      const elapsed = Date.now() - startedAt;

      if (elapsed < 10_000) return 3000; // 3s for the first 10s
      if (elapsed < 60_000) return 10_000; // 10s up to 1min
      if (elapsed < 5 * 60_000) return 60_000; // 60s up to 5min

      console.warn("[Dashboard] Stopping polling after 5 minutes of processing.");
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
    },
    onError: () => {
      // O interceptor já mostra o toast
    },
  });

  if (isError) {
    return (
      <MainLayout>
        <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-2xl font-bold">Erro ao carregar Dashboard</h2>
          <p className="text-muted-foreground">Não foi possível conectar ao servidor para obter os dados.</p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
          </Button>
        </div>
      </MainLayout>
    );
  }

  const hasFailedAppraisal = report?.lastAppraisal?.status === "FAILED";

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        {hasFailedAppraisal && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertTitle>Falha na última apuração</AlertTitle>
            <AlertDescription className="text-xs">
              A última tentativa de apuração falhou com o erro: <span className="font-mono font-bold">{report.lastAppraisal?.lastError || "Erro desconhecido"}</span>. 
              Por favor, verifique os dados ou tente novamente mais tarde.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Performance Global</h2>
            <p className="text-sm text-muted-foreground">Acompanhamento de metas e apurações em tempo real.</p>
          </div>
          <div className="flex items-center gap-2">
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
        </div>

        <SectionCards data={report?.kpis} isLoading={isLoading} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartAreaInteractive />
          
          <Card className="shadow-none border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Últimos Resultados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 text-xs">Vendedor</TableHead>
                    <TableHead className="h-10 text-xs">Status</TableHead>
                    <TableHead className="h-10 text-xs text-right">Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="animate-pulse">
                        <TableCell><div className="h-3 w-24 bg-muted rounded" /></TableCell>
                        <TableCell><div className="h-3 w-16 bg-muted rounded" /></TableCell>
                        <TableCell><div className="h-3 w-16 bg-muted rounded ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : (report?.latestResults?.length || 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10 text-xs text-muted-foreground">
                        Nenhum resultado disponível. Execute uma apuração.
                      </TableCell>
                    </TableRow>
                  ) : (
                    report?.latestResults.map((result) => (
                      <TableRow key={result.id} className="text-sm">
                        <TableCell className="font-medium py-3">{result.salespersonName}</TableCell>
                        <TableCell className="py-3">
                          <Badge variant={result.status === "MET" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                            {result.status === "MET" ? "Atingida" : "Pendente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right py-3 tabular-nums">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: report?.kpis.currency || "BRL" }).format(parseFloat(result.payable))}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <GoalsTable />
      </div>
    </MainLayout>
  );
}
