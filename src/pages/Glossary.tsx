import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api, type GlossaryTerm } from '@/services/api';

const LANGUAGE_PAIRS = [
  { value: 'EN-FR', label: 'English → French' },
  { value: 'EN-DE', label: 'English → German' },
  { value: 'EN-ES', label: 'English → Spanish' },
  { value: 'EN-IT', label: 'English → Italian' },
  { value: 'FR-EN', label: 'French → English' },
  { value: 'DE-EN', label: 'German → English' },
  { value: 'ES-EN', label: 'Spanish → English' },
];

export default function Glossary() {
  const { toast } = useToast();
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguagePair, setSelectedLanguagePair] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    source_term: '',
    target_term: '',
    language_pair: 'EN-FR',
    description: '',
  });

  useEffect(() => {
    loadGlossaryTerms();
  }, [selectedLanguagePair, searchQuery]);

  const loadGlossaryTerms = async () => {
    try {
      setLoading(true);
      const data = await api.getGlossaryTerms(
        selectedLanguagePair || undefined,
        searchQuery || undefined
      );
      setTerms(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load glossary terms',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTerm = async () => {
    if (!formData.source_term || !formData.target_term || !formData.language_pair) {
      toast({
        title: 'Error',
        description: 'Source term, target term, and language pair are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await api.createGlossaryTerm(formData);
      
      toast({
        title: 'Success',
        description: 'Glossary term added successfully',
      });

      setIsAddDialogOpen(false);
      setFormData({
        source_term: '',
        target_term: '',
        language_pair: 'EN-FR',
        description: '',
      });
      loadGlossaryTerms();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add glossary term',
        variant: 'destructive',
      });
    }
  };

  const handleEditTerm = async () => {
    if (!editingTerm) return;

    try {
      await api.updateGlossaryTerm(editingTerm.id, formData);
      
      toast({
        title: 'Success',
        description: 'Glossary term updated successfully',
      });

      setIsEditDialogOpen(false);
      setEditingTerm(null);
      loadGlossaryTerms();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update glossary term',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTerm = async (id: string) => {
    if (!confirm('Are you sure you want to delete this glossary term?')) {
      return;
    }

    try {
      await api.deleteGlossaryTerm(id);
      
      toast({
        title: 'Success',
        description: 'Glossary term deleted successfully',
      });

      loadGlossaryTerms();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete glossary term',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (term: GlossaryTerm) => {
    setEditingTerm(term);
    setFormData({
      source_term: term.source_term,
      target_term: term.target_term,
      language_pair: term.language_pair,
      description: term.description || '',
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Glossary</h1>
          <p className="text-muted-foreground mt-1">Manage terminology and glossary terms</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Add Term
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Glossary Term</DialogTitle>
              <DialogDescription>
                Add a new term to your glossary for consistent translations.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="add-source-term">Source Term</Label>
                <Input
                  id="add-source-term"
                  value={formData.source_term}
                  onChange={(e) => setFormData({ ...formData, source_term: e.target.value })}
                  placeholder="e.g., Dashboard"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-target-term">Target Term</Label>
                <Input
                  id="add-target-term"
                  value={formData.target_term}
                  onChange={(e) => setFormData({ ...formData, target_term: e.target.value })}
                  placeholder="e.g., Tableau de bord"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-language-pair">Language Pair</Label>
                <Select
                  value={formData.language_pair}
                  onValueChange={(value) => setFormData({ ...formData, language_pair: value })}
                >
                  <SelectTrigger id="add-language-pair">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_PAIRS.map((pair) => (
                      <SelectItem key={pair.value} value={pair.value}>
                        {pair.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-description">Description (Optional)</Label>
                <Textarea
                  id="add-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add context or notes about this term..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTerm}>Add Term</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Search Terms</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search glossary terms..."
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Filter by Language Pair</Label>
            <Select value={selectedLanguagePair} onValueChange={setSelectedLanguagePair}>
              <SelectTrigger>
                <SelectValue placeholder="All language pairs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All language pairs</SelectItem>
                {LANGUAGE_PAIRS.map((pair) => (
                  <SelectItem key={pair.value} value={pair.value}>
                    {pair.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Terms Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Source Term
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Target Term
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Language Pair
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Description
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {terms.map((term) => (
                  <tr
                    key={term.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-5 py-4 text-sm font-medium text-foreground">
                      {term.source_term}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {term.target_term}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {term.language_pair}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground max-w-xs truncate">
                      {term.description || '-'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(term)}
                          className="gap-2"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTerm(term.id)}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {terms.length === 0 && (
              <div className="px-6 py-12 text-center text-muted-foreground">
                <p>No glossary terms found. Add your first term to get started.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Glossary Term</DialogTitle>
            <DialogDescription>
              Update the glossary term details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-source-term">Source Term</Label>
              <Input
                id="edit-source-term"
                value={formData.source_term}
                onChange={(e) => setFormData({ ...formData, source_term: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-target-term">Target Term</Label>
              <Input
                id="edit-target-term"
                value={formData.target_term}
                onChange={(e) => setFormData({ ...formData, target_term: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-language-pair">Language Pair</Label>
              <Select
                value={formData.language_pair}
                onValueChange={(value) => setFormData({ ...formData, language_pair: value })}
              >
                <SelectTrigger id="edit-language-pair">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_PAIRS.map((pair) => (
                    <SelectItem key={pair.value} value={pair.value}>
                      {pair.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTerm}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
