// frontend/src/components/condition-builder.tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import type {
  ConditionDraft,
  ConditionField,
  ConditionGroupDraft,
  ConditionOperator,
} from '@/types/goal';
import { emptyGroup } from '@/lib/condition-builder.utils';

// ── helpers ──────────────────────────────────────────────────────────────────

function emptyCondition(): ConditionDraft {
  return { _id: crypto.randomUUID(), field: 'TOTAL_VALUE', operator: 'GT', rawValue: '' };
}

const FIELD_LABELS: Record<ConditionField, string> = {
  TOTAL_VALUE: 'Valor Total',
  REGION: 'Região',
  PRODUCT: 'Produto',
  SALESPERSON: 'Vendedor',
};

const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  EQ: 'igual a',
  NEQ: 'diferente de',
  GT: 'maior que',
  GTE: 'maior ou igual a',
  LT: 'menor que',
  LTE: 'menor ou igual a',
  IN: 'está em',
  NOT_IN: 'não está em',
};

// Operadores disponíveis por campo
const OPERATORS_FOR_FIELD: Record<ConditionField, ConditionOperator[]> = {
  TOTAL_VALUE: ['GT', 'GTE', 'LT', 'LTE', 'EQ', 'NEQ'],
  REGION: ['EQ', 'NEQ', 'IN', 'NOT_IN'],
  PRODUCT: ['EQ', 'NEQ', 'IN', 'NOT_IN'],
  SALESPERSON: ['EQ', 'NEQ', 'IN', 'NOT_IN'],
};

// ── ConditionRow ──────────────────────────────────────────────────────────────

function ConditionRow({
  condition,
  onChange,
  onRemove,
}: {
  condition: ConditionDraft;
  onChange: (c: ConditionDraft) => void;
  onRemove: () => void;
}) {
  const availableOperators = OPERATORS_FOR_FIELD[condition.field];
  const isCollection = condition.operator === 'IN' || condition.operator === 'NOT_IN';

  function handleFieldChange(field: string | null) {
    if (!field) return;
    const f = field as ConditionField;
    const ops = OPERATORS_FOR_FIELD[f];
    // Se o operador atual não é válido para o novo campo, usa o primeiro disponível
    const operator = ops.includes(condition.operator) ? condition.operator : ops[0];
    onChange({ ...condition, field: f, operator });
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={condition.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-32 h-8 text-xs">
          <SelectValue>{(v: string) => FIELD_LABELS[v as ConditionField] ?? v}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {(Object.keys(FIELD_LABELS) as ConditionField[]).map((f) => (
              <SelectItem key={f} value={f}>{FIELD_LABELS[f]}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={condition.operator}
        onValueChange={(op) => op && onChange({ ...condition, operator: op as ConditionOperator })}
      >
        <SelectTrigger className="w-36 h-8 text-xs">
          <SelectValue>{(v: string) => OPERATOR_LABELS[v as ConditionOperator] ?? v}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {availableOperators.map((op) => (
              <SelectItem key={op} value={op}>{OPERATOR_LABELS[op]}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Input
        className="h-8 text-xs flex-1 min-w-0"
        placeholder={isCollection ? 'val1, val2, ...' : 'valor'}
        value={condition.rawValue}
        onChange={(e) => onChange({ ...condition, rawValue: e.target.value })}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2Icon className="size-3.5" />
      </Button>
    </div>
  );
}

// ── ConditionGroupNode ────────────────────────────────────────────────────────

function ConditionGroupNode({
  group,
  isRoot,
  onChange,
  onRemove,
}: {
  group: ConditionGroupDraft;
  isRoot: boolean;
  onChange: (g: ConditionGroupDraft) => void;
  onRemove?: () => void;
}) {
  function toggleOperator() {
    onChange({ ...group, logicalOperator: group.logicalOperator === 'AND' ? 'OR' : 'AND' });
  }

  function updateCondition(index: number, c: ConditionDraft) {
    const conditions = [...group.conditions];
    conditions[index] = c;
    onChange({ ...group, conditions });
  }

  function removeCondition(index: number) {
    onChange({ ...group, conditions: group.conditions.filter((_, i) => i !== index) });
  }

  function addCondition() {
    onChange({ ...group, conditions: [...group.conditions, emptyCondition()] });
  }

  function updateChild(index: number, child: ConditionGroupDraft) {
    const children = [...group.children];
    children[index] = child;
    onChange({ ...group, children });
  }

  function removeChild(index: number) {
    onChange({ ...group, children: group.children.filter((_, i) => i !== index) });
  }

  function addChildGroup() {
    onChange({ ...group, children: [...group.children, emptyGroup()] });
  }

  return (
    <div className={isRoot ? '' : 'border-l-2 border-primary/30 pl-3 mt-1'}>
      {/* Cabeçalho do grupo: toggle AND/OR + botão remover (não-root) */}
      <div className="flex items-center gap-2 mb-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 px-2 text-xs font-mono"
          onClick={toggleOperator}
        >
          {group.logicalOperator === 'AND' ? 'E (AND)' : 'OU (OR)'}
        </Button>
        {!isRoot && onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            Remover grupo
          </Button>
        )}
      </div>

      {/* Linhas de condição e sub-grupos */}
      <div className="flex flex-col gap-2">
        {group.conditions.map((c, i) => (
          <ConditionRow
            key={c._id}
            condition={c}
            onChange={(updated) => updateCondition(i, updated)}
            onRemove={() => removeCondition(i)}
          />
        ))}

        {group.children.map((child, i) => (
          <ConditionGroupNode
            key={child._id}
            group={child}
            isRoot={false}
            onChange={(updated) => updateChild(i, updated)}
            onRemove={() => removeChild(i)}
          />
        ))}
      </div>

      {/* Botões de adicionar */}
      <div className="flex items-center gap-3 mt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground"
          onClick={addCondition}
        >
          <PlusIcon className="size-3 mr-1" />
          condição
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground"
          onClick={addChildGroup}
        >
          <PlusIcon className="size-3 mr-1" />
          sub-grupo
        </Button>
      </div>
    </div>
  );
}

// ── ConditionBuilder (export público) ────────────────────────────────────────

export function ConditionBuilder({
  value,
  onChange,
}: {
  value: ConditionGroupDraft;
  onChange: (v: ConditionGroupDraft) => void;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/20 p-3" data-vaul-no-drag>
      <ConditionGroupNode group={value} isRoot onChange={onChange} />
    </div>
  );
}
