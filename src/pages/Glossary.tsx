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
  // English pairs
  { value: 'EN-FR', label: 'English → French' },
  { value: 'EN-DE', label: 'English → German' },
  { value: 'EN-ES', label: 'English → Spanish' },
  { value: 'EN-IT', label: 'English → Italian' },
  { value: 'EN-PT', label: 'English → Portuguese' },
  { value: 'EN-RU', label: 'English → Russian' },
  { value: 'EN-ZH', label: 'English → Chinese' },
  { value: 'EN-JA', label: 'English → Japanese' },
  { value: 'EN-KO', label: 'English → Korean' },
  { value: 'EN-AR', label: 'English → Arabic' },
  { value: 'EN-HI', label: 'English → Hindi' },
  { value: 'EN-UR', label: 'English → Urdu' },
  { value: 'EN-TR', label: 'English → Turkish' },
  { value: 'EN-NL', label: 'English → Dutch' },
  { value: 'EN-PL', label: 'English → Polish' },
  { value: 'EN-SV', label: 'English → Swedish' },
  { value: 'EN-NO', label: 'English → Norwegian' },
  { value: 'EN-DA', label: 'English → Danish' },
  { value: 'EN-FI', label: 'English → Finnish' },
  { value: 'EN-EL', label: 'English → Greek' },
  { value: 'EN-HE', label: 'English → Hebrew' },
  { value: 'EN-TH', label: 'English → Thai' },
  { value: 'EN-VI', label: 'English → Vietnamese' },
  { value: 'EN-ID', label: 'English → Indonesian' },
  { value: 'EN-MS', label: 'English → Malay' },
  { value: 'EN-CS', label: 'English → Czech' },
  { value: 'EN-HU', label: 'English → Hungarian' },
  { value: 'EN-RO', label: 'English → Romanian' },
  { value: 'EN-UK', label: 'English → Ukrainian' },
  { value: 'EN-BG', label: 'English → Bulgarian' },
  
  // French pairs
  { value: 'FR-EN', label: 'French → English' },
  { value: 'FR-DE', label: 'French → German' },
  { value: 'FR-ES', label: 'French → Spanish' },
  { value: 'FR-IT', label: 'French → Italian' },
  { value: 'FR-PT', label: 'French → Portuguese' },
  
  // German pairs
  { value: 'DE-EN', label: 'German → English' },
  { value: 'DE-FR', label: 'German → French' },
  { value: 'DE-ES', label: 'German → Spanish' },
  { value: 'DE-IT', label: 'German → Italian' },
  
  // Spanish pairs
  { value: 'ES-EN', label: 'Spanish → English' },
  { value: 'ES-FR', label: 'Spanish → French' },
  { value: 'ES-DE', label: 'Spanish → German' },
  { value: 'ES-PT', label: 'Spanish → Portuguese' },
  { value: 'ES-IT', label: 'Spanish → Italian' },
  
  // Italian pairs
  { value: 'IT-EN', label: 'Italian → English' },
  { value: 'IT-FR', label: 'Italian → French' },
  { value: 'IT-DE', label: 'Italian → German' },
  { value: 'IT-ES', label: 'Italian → Spanish' },
  
  // Portuguese pairs
  { value: 'PT-EN', label: 'Portuguese → English' },
  { value: 'PT-ES', label: 'Portuguese → Spanish' },
  { value: 'PT-FR', label: 'Portuguese → French' },
  
  // Russian pairs
  { value: 'RU-EN', label: 'Russian → English' },
  { value: 'RU-DE', label: 'Russian → German' },
  { value: 'RU-FR', label: 'Russian → French' },
  
  // Chinese pairs
  { value: 'ZH-EN', label: 'Chinese → English' },
  { value: 'ZH-JA', label: 'Chinese → Japanese' },
  { value: 'ZH-KO', label: 'Chinese → Korean' },
  
  // Japanese pairs
  { value: 'JA-EN', label: 'Japanese → English' },
  { value: 'JA-ZH', label: 'Japanese → Chinese' },
  { value: 'JA-KO', label: 'Japanese → Korean' },
  
  // Korean pairs
  { value: 'KO-EN', label: 'Korean → English' },
  { value: 'KO-ZH', label: 'Korean → Chinese' },
  { value: 'KO-JA', label: 'Korean → Japanese' },
  
  // Arabic pairs
  { value: 'AR-EN', label: 'Arabic → English' },
  { value: 'AR-FR', label: 'Arabic → French' },
  
  // Hindi/Urdu pairs
  { value: 'HI-EN', label: 'Hindi → English' },
  { value: 'UR-EN', label: 'Urdu → English' },
  
  // Turkish pairs
  { value: 'TR-EN', label: 'Turkish → English' },
  { value: 'TR-DE', label: 'Turkish → German' },
  
  // Dutch pairs
  { value: 'NL-EN', label: 'Dutch → English' },
  { value: 'NL-DE', label: 'Dutch → German' },
  { value: 'NL-FR', label: 'Dutch → French' },
  
  // Polish pairs
  { value: 'PL-EN', label: 'Polish → English' },
  { value: 'PL-DE', label: 'Polish → German' },
  
  // Nordic language pairs
  { value: 'SV-EN', label: 'Swedish → English' },
  { value: 'NO-EN', label: 'Norwegian → English' },
  { value: 'DA-EN', label: 'Danish → English' },
  { value: 'FI-EN', label: 'Finnish → English' },
  
  // Other pairs
  { value: 'EL-EN', label: 'Greek → English' },
  { value: 'HE-EN', label: 'Hebrew → English' },
  { value: 'TH-EN', label: 'Thai → English' },
  { value: 'VI-EN', label: 'Vietnamese → English' },
  { value: 'ID-EN', label: 'Indonesian → English' },
  { value: 'MS-EN', label: 'Malay → English' },
  { value: 'CS-EN', label: 'Czech → English' },
  { value: 'HU-EN', label: 'Hungarian → English' },
  { value: 'RO-EN', label: 'Romanian → English' },
  { value: 'UK-EN', label: 'Ukrainian → English' },
  { value: 'BG-EN', label: 'Bulgarian → English' },
];

export default function Glossary() {
  const { toast } = useToast();
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguagePair, setSelectedLanguagePair] = useState<string>('all');
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
        selectedLanguagePair !== 'all' ? selectedLanguagePair : undefined,
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
                <SelectItem value="all">All language pairs</SelectItem>
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
