import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUpIcon, TrendingDownIcon, DollarSign, Target, Users, BarChart3 } from "lucide-react"
import type { DashboardReport } from "@/types/api"

interface SectionCardsProps {
  data?: DashboardReport["kpis"]
  isLoading?: boolean
}

interface StatCardProps {
  title: string
  value: string
  trend: string
  trendType: "up" | "down"
  footerText: string
  icon: React.ReactNode
  isLoading?: boolean
}

function StatCard({ title, value, trend, trendType, footerText, icon, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <Card className="@container/card animate-pulse">
        <CardHeader className="h-20 bg-muted/50 p-4" />
        <CardFooter className="h-8 bg-muted/20 p-4 pt-0" />
      </Card>
    )
  }

  return (
    <Card className="@container/card shadow-none border-border/50">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between gap-2">
          <CardDescription className="text-xs font-medium uppercase tracking-wider">{title}</CardDescription>
          <div className="text-muted-foreground/70">{icon}</div>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <CardTitle className="text-xl font-bold tabular-nums">
            {value}
          </CardTitle>
          <Badge 
            variant="outline" 
            className={`text-[10px] py-0 px-1 h-4 border-none ${
              trendType === "up" 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {trendType === "up" ? <TrendingUpIcon className="size-3" /> : <TrendingDownIcon className="size-3" />}
            {trend}
          </Badge>
        </div>
      </CardHeader>
      <CardFooter className="px-4 pb-4 pt-0 text-[11px]">
        <div className="text-muted-foreground line-clamp-1 italic">
          {footerText}
        </div>
      </CardFooter>
    </Card>
  )
}

export function SectionCards({ data, isLoading }: SectionCardsProps) {
  const formatCurrency = (val: string = "0") => {
    return new Intl.NumberFormat("pt-BR", { 
      style: "currency", 
      currency: data?.currency || "BRL",
      maximumFractionDigits: 0 
    }).format(parseFloat(val))
  }

  return (
    <div className="grid grid-cols-2 gap-3 @5xl/main:grid-cols-4">
      <StatCard 
        title="Comissões"
        value={formatCurrency(data?.totalCommissions)}
        trend="+12%"
        trendType="up"
        footerText="Última apuração"
        icon={<DollarSign className="size-3" />}
        isLoading={isLoading}
      />
      <StatCard 
        title="Atingimento"
        value={`${data?.goalsMetPercentage || 0}%`}
        trend="+5%"
        trendType="up"
        footerText="Média global"
        icon={<Target className="size-3" />}
        isLoading={isLoading}
      />
      <StatCard 
        title="Vendedores"
        value={`${data?.activeSalespersons || 0}`}
        trend="-2%"
        trendType="down"
        footerText="Ativos no mês"
        icon={<Users className="size-3" />}
        isLoading={isLoading}
      />
      <StatCard 
        title="Volume"
        value={formatCurrency(data?.volumeProcessed)}
        trend="+18%"
        trendType="up"
        footerText="Total processado"
        icon={<BarChart3 className="size-3" />}
        isLoading={isLoading}
      />
    </div>
  )
}
