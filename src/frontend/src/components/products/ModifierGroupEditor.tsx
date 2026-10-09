import { useState } from 'react';
import { Plus, Trash2, GripVertical, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useModifierGroups,
  useCreateModifierGroup,
  useDeleteModifierGroup,
} from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import type { ModifierGroup, ModifierGroupType } from '@/lib/api';
import { toast } from 'sonner';

interface ModifierGroupEditorProps {
  selectedGroups: string[];
  onChange: (groupIds: string[]) => void;
}

export function ModifierGroupEditor({ selectedGroups, onChange }: ModifierGroupEditorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState<ModifierGroupType>('custom');

  const { data: groups, isLoading } = useModifierGroups();
  const createGroup = useCreateModifierGroup();
  const deleteGroup = useDeleteModifierGroup();

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Nama grup harus diisi');
      return;
    }

    try {
      const newGroup = await createGroup.mutateAsync({
        name: newGroupName.trim(),
        type: newGroupType,
      });

      onChange([...selectedGroups, newGroup.id]);
      setNewGroupName('');
      setNewGroupType('custom');
      setIsCreating(false);
      toast.success('Grup modifier berhasil ditambahkan');
    } catch {
      toast.error('Gagal membuat grup modifier');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await deleteGroup.mutateAsync(groupId);
      onChange(selectedGroups.filter((id) => id !== groupId));
      toast.success('Grup modifier berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus grup modifier');
    }
  };

  const toggleGroup = (groupId: string) => {
    if (selectedGroups.includes(groupId)) {
      onChange(selectedGroups.filter((id) => id !== groupId));
    } else {
      onChange([...selectedGroups, groupId]);
    }
  };

  const selectedGroupsData = groups?.filter((g) => selectedGroups.includes(g.id)) || [];
  const availableGroups = groups?.filter((g) => !selectedGroups.includes(g.id)) || [];

  return (
    <div className="space-y-4">
      {/* Selected Groups */}
      {selectedGroupsData.length > 0 && (
        <div className="space-y-3">
          <Label>Grup Modifier Terpilih</Label>
          {selectedGroupsData.map((group) => (
            <ModifierGroupCard
              key={group.id}
              group={group}
              onDelete={() => handleDeleteGroup(group.id)}
            />
          ))}
        </div>
      )}

      {/* Add Group Section */}
      {isCreating ? (
        <div className="p-4 border rounded-lg space-y-3 bg-muted/50">
          <div className="space-y-2">
            <Label htmlFor="newGroupName">Nama Grup</Label>
            <Input
              id="newGroupName"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Ukuran"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newGroupType">Tipe</Label>
            <Select value={newGroupType} onValueChange={(v) => setNewGroupType(v as ModifierGroupType)}>
              <SelectTrigger id="newGroupType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="size">Ukuran</SelectItem>
                <SelectItem value="extras">Ekstra</SelectItem>
                <SelectItem value="topping">Topping</SelectItem>
                <SelectItem value="custom">Kustom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreating(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddGroup}
              disabled={createGroup.isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              Simpan
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Tambah Grup Modifier</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Grup Baru
            </Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : availableGroups.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availableGroups.map((group) => (
                <Button
                  key={group.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleGroup(group.id)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {group.name}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Semua grup sudah ditambahkan
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Modifier Group Card Component
interface ModifierGroupCardProps {
  group: ModifierGroup;
  onDelete: () => void;
}

function ModifierGroupCard({ group, onDelete }: ModifierGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const typeLabels: Record<ModifierGroupType, string> = {
    size: 'Ukuran',
    extras: 'Ekstra',
    topping: 'Topping',
    custom: 'Kustom',
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-3 bg-muted/50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{group.name}</span>
          <span className="text-xs text-muted-foreground">
            ({typeLabels[group.type]})
          </span>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 border-t">
          {group.modifiers.length > 0 ? (
            <ul className="space-y-1">
              {group.modifiers.map((modifier) => (
                <li
                  key={modifier.id}
                  className="flex items-center justify-between py-1 text-sm"
                >
                  <span>{modifier.name}</span>
                  {modifier.price !== 0 && (
                    <span className="text-muted-foreground">
                      {modifier.price > 0 ? '+' : ''}
                      {formatCurrency(modifier.price)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Belum ada modifier
            </p>
          )}
        </div>
      )}
    </div>
  );
}
