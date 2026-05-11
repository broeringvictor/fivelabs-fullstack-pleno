// frontend/src/components/goals-table.tsx
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { campaignService } from '@/services/api.service';
import { goalService } from '@/services/goal.service';
import { GoalDrawer } from '@/components/goal-drawer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function formatCompensation(
  type: string,
  value: string,
  currency: string | null,
): string {
  const n = parseFloat(value);
  if (type === 'FIXED') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency ?? 'BRL',
    }).format(n);
  }
  return `${n.toFixed(2)}%`;
}

export function GoalsTable() {
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<string>('');

  const { data: campaigns, isLoading: loadingCampaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: campaignService.list,
  });

  const { data: goals, isLoading: loadingGoals } = useQuery({
    queryKey: ['goals', selectedCampaignId],
    queryFn: () => goalService.list(selectedCampaignId),
    enabled: !!selectedCampaignId,
  });

  return (
    <Card className="shadow-none border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">Metas</CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={selectedCampaignId}
              onValueChange={setSelectedCampaignId}
              disabled={loadingCampaigns}
            >
              <SelectTrigger className="w-52 h-8 text-xs">
                <SelectValue placeholder="Selecione uma campanha" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {campaigns?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {selectedCampaignId && <GoalDrawer campaignId={selectedCampaignId} />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 text-xs pl-6">Nome</TableHead>
              <TableHead className="h-10 text-xs">Período</TableHead>
              <TableHead className="h-10 text-xs">Tipo</TableHead>
              <TableHead className="h-10 text-xs text-right pr-6">Compensação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!selectedCampaignId ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-10 text-xs text-muted-foreground"
                >
                  Selecione uma campanha para ver as metas.
                </TableCell>
              </TableRow>
            ) : loadingGoals ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-6">
                    <Skeleton className="h-3 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-16" />
                  </TableCell>
                  <TableCell className="pr-6">
                    <Skeleton className="h-3 w-20 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : goals?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-10 text-xs text-muted-foreground"
                >
                  Nenhuma meta cadastrada. Clique em "Nova Meta" para começar.
                </TableCell>
              </TableRow>
            ) : (
              goals?.map((goal) => (
                <TableRow key={goal.id} className="text-sm">
                  <TableCell className="font-medium py-3 pl-6">{goal.name}</TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground">
                    {formatDate(goal.validFrom)} — {formatDate(goal.validTo)}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {goal.compensationType === 'FIXED' ? 'Fixo' : 'Percentual'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-3 tabular-nums pr-6">
                    {formatCompensation(
                      goal.compensationType,
                      goal.compensationValue,
                      goal.compensationCurrency,
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
