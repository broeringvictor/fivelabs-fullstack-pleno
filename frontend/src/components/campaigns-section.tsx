// frontend/src/components/campaigns-section.tsx
import { useQuery } from '@tanstack/react-query';
import { campaignService } from '@/services/api.service';
import { goalService } from '@/services/goal.service';
import { GoalDrawer } from '@/components/goal-drawer';
import { CampaignDrawer } from '@/components/campaign-drawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Campaign, Goal } from '@/types/api';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function formatCompensation(type: string, value: string, currency: string | null) {
  const n = parseFloat(value);
  if (type === 'FIXED') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency ?? 'BRL',
    }).format(n);
  }
  return `${n.toFixed(2)}%`;
}

function CampaignGoals({ campaign }: { campaign: Campaign }) {
  const { data: goals, isLoading } = useQuery<Goal[]>({
    queryKey: ['goals', campaign.id],
    queryFn: () => goalService.list(campaign.id),
  });

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-8 text-xs pl-4">Nome</TableHead>
            <TableHead className="h-8 text-xs">Vigência</TableHead>
            <TableHead className="h-8 text-xs">Tipo</TableHead>
            <TableHead className="h-8 text-xs text-right pr-4">Compensação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="pl-4"><Skeleton className="h-3 w-32" /></TableCell>
                <TableCell><Skeleton className="h-3 w-28" /></TableCell>
                <TableCell><Skeleton className="h-3 w-16" /></TableCell>
                <TableCell className="pr-4"><Skeleton className="h-3 w-20 ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : goals?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground pl-4">
                Nenhuma meta cadastrada.
              </TableCell>
            </TableRow>
          ) : (
            goals?.map((goal) => (
              <TableRow key={goal.id} className="text-sm">
                <TableCell className="py-2.5 pl-4 font-medium">{goal.name}</TableCell>
                <TableCell className="py-2.5 text-xs text-muted-foreground">
                  {formatDate(goal.validFrom)} — {formatDate(goal.validTo)}
                </TableCell>
                <TableCell className="py-2.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {goal.compensationType === 'FIXED' ? 'Fixo' : 'Percentual'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right py-2.5 tabular-nums pr-4">
                  {formatCompensation(goal.compensationType, goal.compensationValue, goal.compensationCurrency)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className="px-4 pb-3 pt-1">
        <GoalDrawer campaignId={campaign.id} />
      </div>
    </div>
  );
}

export function CampaignsSection() {
  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: campaignService.list,
  });

  return (
    <Card className="shadow-none border-border/50">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Campanhas</CardTitle>
          <CampaignDrawer />
        </div>
      </CardHeader>
      <CardContent className="p-0 pt-2">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : campaigns?.length === 0 ? (
          <p className="text-center py-10 text-xs text-muted-foreground">
            Nenhuma campanha cadastrada.
          </p>
        ) : (
          campaigns?.map((campaign, idx) => (
            <div key={campaign.id}>
              {idx > 0 && <div className="border-t border-border/40 mx-4" />}
              <div className="px-4 pt-3 pb-1">
                <p className="text-sm font-semibold">{campaign.name}</p>
                {campaign.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{campaign.description}</p>
                )}
              </div>
              <CampaignGoals campaign={campaign} />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
