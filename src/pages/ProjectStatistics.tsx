import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Download, BarChart3, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface StatisticsBreakdown {
  words: number;
  segments: number;
  chars_with_spaces: number;
  chars_no_spaces: number;
}

interface ProjectStatistics {
  totalWords: number;
  totalSegments: number;
  totalCharsWithSpaces: number;
  totalCharsNoSpaces: number;
  breakdown: {
    new: StatisticsBreakdown;
    fuzzy_50_74: StatisticsBreakdown;
    fuzzy_75_84: StatisticsBreakdown;
    fuzzy_85_94: StatisticsBreakdown;
    fuzzy_95_99: StatisticsBreakdown;
    match_100: StatisticsBreakdown;
    match_101: StatisticsBreakdown;
    repetition: StatisticsBreakdown;
    cross_file_repetition: StatisticsBreakdown;
  };
}

const WORDS_PER_PAGE = 250;

const matchCategories = [
  { key: 'new', label: 'New', color: 'text-red-500' },
  { key: 'fuzzy_50_74', label: '50%–74%', color: 'text-orange-500' },
  { key: 'fuzzy_75_84', label: '75%–84%', color: 'text-yellow-500' },
  { key: 'fuzzy_85_94', label: '85%–94%', color: 'text-lime-500' },
  { key: 'fuzzy_95_99', label: '95%–99%', color: 'text-green-500' },
  { key: 'match_100', label: '100%', color: 'text-emerald-500' },
  { key: 'match_101', label: '101%', color: 'text-teal-500' },
  { key: 'repetition', label: '102%–103%', color: 'text-cyan-500' },
  { key: 'cross_file_repetition', label: 'Cross-file repetitions', color: 'text-blue-500' },
];

export default function ProjectStatistics() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [statistics, setStatistics] = useState<ProjectStatistics | null>(null);
  const [project, setProject] = useState<any>(null);
  const [includeInternalFuzzy, setIncludeInternalFuzzy] = useState(true);
  const [includeCrossFile, setIncludeCrossFile] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const projectData = await api.getProject(id);
      setProject(projectData);
      await calculateStatistics();
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = async () => {
    if (!id) return;
    
    try {
      setCalculating(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/statistics/${id}/calculate`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to calculate statistics');

      const result = await response.json();
      setStatistics(result.data);
      
      toast({
        title: 'Success',
        description: 'Statistics calculated successfully',
      });
    } catch (error) {
      console.error('Failed to calculate statistics:', error);
      toast({
        title: 'Error',
        description: 'Failed to calculate statistics',
        variant: 'destructive',
      });
    } finally {
      setCalculating(false);
    }
  };

  const exportCSV = () => {
    if (!statistics) return;

    const rows = [
      ['Match Category', 'Words', '%', 'Segments', 'Pages', 'Characters (no spaces)', 'Characters (with spaces)'],
    ];

    matchCategories.forEach(cat => {
      const data = statistics.breakdown[cat.key as keyof typeof statistics.breakdown];
      const percentage = statistics.totalWords > 0 
        ? ((data.words / statistics.totalWords) * 100).toFixed(2)
        : '0.00';
      const pages = (data.words / WORDS_PER_PAGE).toFixed(2);

      rows.push([
        cat.label,
        data.words.toString(),
        percentage,
        data.segments.toString(),
        pages,
        data.chars_no_spaces.toString(),
        data.chars_with_spaces.toString(),
      ]);
    });

    // Add totals
    rows.push([
      'Total',
      statistics.totalWords.toString(),
      '100.00',
      statistics.totalSegments.toString(),
      (statistics.totalWords / WORDS_PER_PAGE).toFixed(2),
      statistics.totalCharsNoSpaces.toString(),
      statistics.totalCharsWithSpaces.toString(),
    ]);

    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project?.name || 'project'}_statistics.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Statistics exported as CSV',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${id}`)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Statistics</h1>
            <p className="text-muted-foreground mt-1">{project?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={calculateStatistics}
            disabled={calculating}
            className="gap-2"
          >
            {calculating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={exportCSV}
            disabled={!statistics}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Statistics Table */}
        <div className="lg:col-span-3 space-y-6">
          {/* Summary Cards */}
          {statistics && (
            <div className="grid grid-cols-4 gap-4">
              <div className="glass-card p-4 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Total Words</p>
                <p className="text-2xl font-bold text-foreground">
                  {statistics.totalWords.toLocaleString()}
                </p>
              </div>
              <div className="glass-card p-4 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Segments</p>
                <p className="text-2xl font-bold text-foreground">
                  {statistics.totalSegments.toLocaleString()}
                </p>
              </div>
              <div className="glass-card p-4 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Pages</p>
                <p className="text-2xl font-bold text-foreground">
                  {(statistics.totalWords / WORDS_PER_PAGE).toFixed(1)}
                </p>
              </div>
              <div className="glass-card p-4 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Characters</p>
                <p className="text-2xl font-bold text-foreground">
                  {statistics.totalCharsWithSpaces.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Statistics Table */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Match Category Breakdown
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Collapse' : 'Expand'}
              </Button>
            </div>

            {expanded && statistics && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Match Category</TableHead>
                    <TableHead className="text-right">Words</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">Segments</TableHead>
                    <TableHead className="text-right">Pages</TableHead>
                    <TableHead className="text-right">Chars (no spaces)</TableHead>
                    <TableHead className="text-right">Chars (with spaces)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matchCategories.map((cat) => {
                    const data = statistics.breakdown[cat.key as keyof typeof statistics.breakdown];
                    const percentage = statistics.totalWords > 0 
                      ? (data.words / statistics.totalWords) * 100
                      : 0;
                    const pages = data.words / WORDS_PER_PAGE;

                    return (
                      <TableRow key={cat.key}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${cat.color.replace('text-', 'bg-')}`} />
                            <span className={cat.color}>{cat.label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {data.words.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Progress value={percentage} className="w-16 h-2" />
                            <span className="text-xs font-mono w-12">
                              {percentage.toFixed(2)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {data.segments.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {pages.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {data.chars_no_spaces.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {data.chars_with_spaces.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {/* Total Row */}
                  <TableRow className="bg-accent/5 font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right font-mono">
                      {statistics.totalWords.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">100.00%</TableCell>
                    <TableCell className="text-right font-mono">
                      {statistics.totalSegments.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {(statistics.totalWords / WORDS_PER_PAGE).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {statistics.totalCharsNoSpaces.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {statistics.totalCharsWithSpaces.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-4">
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Calculation Settings</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="internal-fuzzy" className="text-sm">
                  Include internal fuzzy matches
                </Label>
                <Switch
                  id="internal-fuzzy"
                  checked={includeInternalFuzzy}
                  onCheckedChange={setIncludeInternalFuzzy}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="cross-file" className="text-sm">
                  Include cross-file repetitions
                </Label>
                <Switch
                  id="cross-file"
                  checked={includeCrossFile}
                  onCheckedChange={setIncludeCrossFile}
                />
              </div>
            </div>
          </div>

          {statistics && (
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-foreground">Match Distribution</h3>
              </div>
              <div className="space-y-2">
                {matchCategories.map((cat) => {
                  const data = statistics.breakdown[cat.key as keyof typeof statistics.breakdown];
                  const percentage = statistics.totalWords > 0 
                    ? (data.words / statistics.totalWords) * 100
                    : 0;

                  if (percentage === 0) return null;

                  return (
                    <div key={cat.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={cat.color}>{cat.label}</span>
                        <span className="font-mono">{percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
