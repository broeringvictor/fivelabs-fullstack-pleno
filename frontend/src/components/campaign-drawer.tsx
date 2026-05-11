// frontend/src/components/campaign-drawer.tsx
import * as React from 'react';
import { useForm } from 'react-hook-form';
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
import { Loader2Icon, PlusIcon } from 'lucide-react';
import { campaignService } from '@/services/api.service';

const formSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(200),
  description: z.string().max(500).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export function CampaignDrawer() {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', description: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      campaignService.create({ name: data.name, description: data.description ?? '' }),
    onSuccess: () => {
      toast.success('Campanha criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setOpen(false);
      reset();
    },
    onError: () => {
      toast.error('Erro ao criar campanha.');
    },
  });

  function onSubmit(values: FormValues) {
    mutation.mutate(values);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) { setOpen(false); reset(); }
        else setOpen(true);
      }}
    >
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PlusIcon className="size-4 mr-1" />
        Nova Campanha
      </Button>

      <SheetContent side="right" showCloseButton={false} className="overflow-hidden p-0">
        <SheetHeader className="p-4 pb-0">
          <SheetTitle>Nova Campanha</SheetTitle>
          <SheetDescription>
            Agrupe metas em uma campanha para organização.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 overflow-y-auto p-4 text-sm flex-1 min-h-0">
          <div className="flex flex-col gap-3">
            <Label htmlFor="camp-name">Nome</Label>
            <Input
              id="camp-name"
              {...register('name')}
              placeholder="Ex: Campanha Q3 2025"
              autoFocus={false}
            />
            {errors.name && (
              <span className="text-xs text-destructive">{errors.name.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="camp-desc">Descrição <span className="text-muted-foreground">(opcional)</span></Label>
            <textarea
              id="camp-desc"
              {...register('description')}
              placeholder="Descreva o objetivo desta campanha..."
              rows={4}
              className="resize-none w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            {errors.description && (
              <span className="text-xs text-destructive">{errors.description.message}</span>
            )}
          </div>
        </div>

        <SheetFooter className="p-4 pt-0">
          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            Criar Campanha
          </Button>
          <SheetClose render={<Button variant="outline" />}>
            Cancelar
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
