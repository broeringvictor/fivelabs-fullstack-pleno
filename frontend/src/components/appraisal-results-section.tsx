// frontend/src/components/appraisal-results-section.tsx
import { useQuery } from '@tanstack/react-query';
import { appraisalService } from '@/services/api.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, Loader2, ClockIcon } from 'lucide-react';
import type { Appraisal, AppraisalResultItem } from '@/types/api';

function formatCurrency(value: string, currency: string) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency || 'BRL',
  }).format(parseFloat(value));
}

function StatusBadge({ status }: { status: Appraisal['status'] }) {
  if (status === 'DONE') return <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-none">Concluída</Badge>;
  if (status === 'PROCESSING') return <Badge className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-600 border-none"><Loader2 className="size-2.5 mr-0.5 animate-spin" />Processando</Badge>;
  if (status === 'PENDING') return <Badge className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-600 border-none"><ClockIcon className="size-2.5 mr-0.5" />Aguardando</Badge>;
  return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Falhou</Badge>;
}

function groupByGoal(results: AppraisalResultItem[]) {
  const map = new Map<string, { goalName: string; items: AppraisalResultItem[] }>();
  for (const r of results) {
    if (!map.has(r.goalId)) map.set(r.goalId, { goalName: r.goalName, items: [] });
    map.get(r.goalId)!.items.push(r);
  }
  return [...map.values()];
}

export function AppraisalResultsSection() {
  const { data: appraisals, isLoading: loadingList } = useQuery<Appraisal[]>({
    queryKey: ['appraisals'],
    queryFn: appraisalService.list,
    refetchInterval: (query) => {
      const data = query.state.data as Appraisal[] | undefined;
      const latest = data?.[0];
      if (latest?.status === 'PENDING' || latest?.status === 'PROCESSING') return 3000;
      return false;
    },
  });

  const latest = appraisals?.[0];

  const { data: detail, isLoading: loadingDetail } = useQuery({
    queryKey: ['appraisal-detail', latest?.id],
    queryFn: () => appraisalService.getDetail(latest!.id),
    enabled: latest?.status === 'DONE',
  });

  const isLoading = loadingList || (latest?.status === 'DONE' && loadingDetail);
  const groups = detail ? groupByGoal(detail.results) : [];

  return (
    <Card className="shadow-none border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Resultado da Apuração</CardTitle>
          {latest && <StatusBadge status={latest.status} />}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : !latest ? (
          <p className="text-center py-10 text-xs text-muted-foreground">
            Nenhuma apuração realizada. Clique em "Executar Apuração" para começar.
          </p>
        ) : latest.status === 'PENDING' || latest.status === 'PROCESSING' ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Apuração em andamento...
          </div>
        ) : latest.status === 'FAILED' ? (
          <p className="text-center py-10 text-xs text-destructive">
            A apuração falhou. Tente novamente.
          </p>
        ) : groups.length === 0 ? (
          <p className="text-center py-10 text-xs text-muted-foreground">
            Nenhum resultado encontrado para esta apuração.
          </p>
        ) : (
          groups.map((group, idx) => (
            <div key={group.goalName}>
              {idx > 0 && <div className="border-t border-border/40 mx-4" />}
              <div className="px-4 pt-3 pb-1">
                <p className="text-sm font-semibold">{group.goalName}</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-8 text-xs pl-4">Vendedor</TableHead>
                    <TableHead className="h-8 text-xs text-right">Valor Realizado</TableHead>
                    <TableHead className="h-8 text-xs text-center">Status</TableHead>
                    <TableHead className="h-8 text-xs text-right pr-4">Valor a Pagar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.items.map((r) => (
                    <TableRow key={r.salespersonId} className="text-sm">
                      <TableCell className="py-2.5 pl-4 font-medium">{r.salespersonName}</TableCell>
                      <TableCell className="py-2.5 text-right tabular-nums text-xs text-muted-foreground">
                        {formatCurrency(r.achievedValue, r.achievedCurrency)}
                      </TableCell>
                      <TableCell className="py-2.5 text-center">
                        {r.goalMet
                          ? <CheckCircle2 className="size-4 text-emerald-500 mx-auto" />
                          : <XCircle className="size-4 text-muted-foreground/50 mx-auto" />}
                      </TableCell>
                      <TableCell className="py-2.5 text-right tabular-nums pr-4 font-medium">
                        {r.goalMet
                          ? formatCurrency(r.payableAmount, r.payableCurrency)
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
