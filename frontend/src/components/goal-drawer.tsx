// frontend/src/components/goal-drawer.tsx
import * as React from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2Icon, PlusIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { goalService } from '@/services/goal.service';
import { ConditionBuilder } from '@/components/condition-builder';
import { emptyGroup, draftToInput } from '@/lib/condition-builder.utils';
import type { ConditionGroupDraft } from '@/types/goal';

const formSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(200),
  validFrom: z.string().min(1, 'Obrigatório'),
  validTo: z.string().min(1, 'Obrigatório'),
  compensationType: z.enum(['FIXED', 'PERCENTAGE'] as const),
  compensationValue: z.number().min(0, 'Deve ser ≥ 0'),
  compensationCurrency: z.string().length(3, 'Deve ter 3 letras').optional().or(z.literal('')),
}).refine(
  (v) => !v.validFrom || !v.validTo || new Date(v.validFrom) <= new Date(v.validTo),
  { message: 'A data inicial deve ser anterior à data final', path: ['validTo'] }
);

type FormValues = z.infer<typeof formSchema>;

function hasEmptyRawValues(group: ConditionGroupDraft): boolean {
  if (group.conditions.some((c) => c.rawValue.trim() === '')) return true;
  return group.children.some(hasEmptyRawValues);
}

export function GoalDrawer({ campaignId }: { campaignId: string }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [conditionTree, setConditionTree] = React.useState<ConditionGroupDraft>(emptyGroup());
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { compensationType: 'FIXED', compensationValue: 0 },
  });

  const compensationType = useWatch({ control, name: 'compensationType' });

  const mutation = useMutation({
    mutationFn: goalService.create,
    onSuccess: () => {
      toast.success('Objetivo criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['goals', campaignId] });
      closeSheet();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { errors?: string[] } } })?.response?.data?.errors?.join(', ') ??
        'Erro ao criar objetivo.';
      toast.error(msg);
    },
  });

  function closeSheet() {
    setOpen(false);
    reset();
    setConditionTree(emptyGroup());
  }

  function onSubmit(values: FormValues) {
    if (hasEmptyRawValues(conditionTree)) {
      toast.error('Preencha o valor de todas as condições antes de salvar.');
      return;
    }
    mutation.mutate({
      campaignId,
      name: values.name,
      validFrom: new Date(values.validFrom).toISOString(),
      validTo: new Date(values.validTo).toISOString(),
      compensationType: values.compensationType,
      compensationValue: values.compensationValue,
      compensationCurrency: values.compensationCurrency || undefined,
      conditionTree: draftToInput(conditionTree),
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) closeSheet();
        else setOpen(true);
      }}
    >
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PlusIcon className="size-4 mr-1" />
        Novo Objetivo
      </Button>

      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        showCloseButton={false}
        className="overflow-hidden p-0 sm:max-w-xl"
      >
        <SheetHeader className="p-4 pb-0">
          <SheetTitle>Novo Objetivo</SheetTitle>
          <SheetDescription>
            Defina os critérios de elegibilidade e compensação.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 overflow-y-auto p-4 text-sm flex-1 min-h-0">
          {/* Nome */}
          <div className="flex flex-col gap-3">
            <Label htmlFor="goal-name">Nome da meta</Label>
            <Input
              id="goal-name"
              {...register('name')}
              placeholder="Ex: Objetivo Q1 Sudeste"
            />
            {errors.name && (
              <span className="text-xs text-destructive">{errors.name.message}</span>
            )}
          </div>

          {/* Período */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="goal-valid-from">Válido de</Label>
              <Input id="goal-valid-from" type="date" {...register('validFrom')} />
              {errors.validFrom && (
                <span className="text-xs text-destructive">{errors.validFrom.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="goal-valid-to">Válido até</Label>
              <Input id="goal-valid-to" type="date" {...register('validTo')} />
              {errors.validTo && (
                <span className="text-xs text-destructive">{errors.validTo.message}</span>
              )}
            </div>
          </div>

          {/* Compensação */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label>Tipo</Label>
              <Controller
                control={control}
                name="compensationType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => field.onChange(v ?? 'FIXED')}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="FIXED">Fixo (R$)</SelectItem>
                        <SelectItem value="PERCENTAGE">Percentual (%)</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="goal-comp-value">Valor</Label>
              <Input
                id="goal-comp-value"
                type="number"
                step="0.01"
                min={0}
                {...register('compensationValue', { valueAsNumber: true })}
              />
              {errors.compensationValue && (
                <span className="text-xs text-destructive">{errors.compensationValue.message}</span>
              )}
            </div>
          </div>

          {/* Moeda — só para FIXED */}
          {compensationType === 'FIXED' && (
            <div className="flex flex-col gap-3">
              <Label htmlFor="goal-currency">Moeda (ex: BRL)</Label>
              <Input
                id="goal-currency"
                {...register('compensationCurrency')}
                placeholder="BRL"
                maxLength={3}
                className="w-24 uppercase"
              />
              {errors.compensationCurrency && (
                <span className="text-xs text-destructive">{errors.compensationCurrency.message}</span>
              )}
            </div>
          )}

          <Separator />

          {/* Condition builder */}
          <div className="flex flex-col gap-3">
            <div>
              <Label>Condições</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Opcional. Defina quando esta meta se aplica. Sem condições, aplica-se a todas as vendas.
              </p>
            </div>
            <ConditionBuilder value={conditionTree} onChange={setConditionTree} />
          </div>
        </div>

        <SheetFooter className="p-4 pt-0">
          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            Criar Objetivo
          </Button>
          <SheetClose render={<Button variant="outline" />}>
            Cancelar
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
