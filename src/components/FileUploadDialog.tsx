import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { readFileAsText, parseFile, type ParsedSegment } from '@/utils/fileParser';

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (segments: ParsedSegment[]) => Promise<void>;
}

export function FileUploadDialog({ open, onOpenChange, onUpload }: FileUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewSegments, setPreviewSegments] = useState<ParsedSegment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(null);
    setError(null);
    setPreviewSegments([]);

    // Validate file type
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    const supportedExtensions = ['json', 'csv', 'txt', 'xlsx', 'xls'];
    
    if (!supportedExtensions.includes(extension || '')) {
      setError(`Unsupported file format: .${extension}. Please upload JSON, CSV, TXT, or Excel (XLSX/XLS) files.`);
      return;
    }

    setFile(selectedFile);

    try {
      let segments: ParsedSegment[];
      
      // Handle binary files (Excel) differently
      if (extension === 'xlsx' || extension === 'xls') {
        segments = await parseFile(selectedFile);
      } else {
        // Handle text-based files
        const content = await readFileAsText(selectedFile);
        segments = await parseFile(selectedFile, content);
      }
      
      // Show preview of first 5 segments
      setPreviewSegments(segments.slice(0, 5));
    } catch (err: any) {
      setError(err.message);
      setFile(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    
    if (droppedFile) {
      // Let handleFileSelect do the validation
      handleFileSelect(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setProgress(10);

      const extension = file.name.split('.').pop()?.toLowerCase();
      let segments: ParsedSegment[];
      
      // Handle binary files (Excel) differently
      if (extension === 'xlsx' || extension === 'xls') {
        setProgress(30);
        segments = await parseFile(file);
      } else {
        // Handle text-based files
        const content = await readFileAsText(file);
        setProgress(30);
        segments = await parseFile(file, content);
      }
      
      setProgress(50);

      await onUpload(segments);
      setProgress(100);

      // Reset and close
      setTimeout(() => {
        setFile(null);
        setPreviewSegments([]);
        setProgress(0);
        setUploading(false);
        onOpenChange(false);
      }, 500);
    } catch (err: any) {
      setError(err.message);
      setUploading(false);
      setProgress(0);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFile(null);
      setPreviewSegments([]);
      setError(null);
      setProgress(0);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Upload JSON, CSV, TXT, or Excel files to import segments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Drop Zone */}
          {!file && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground mb-1">
                Drop your file here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                Supports JSON, CSV, TXT, and Excel (XLSX/XLS) files
              </p>
              <p className="text-xs text-blue-600">
                If you don't see your file type, try typing *.* in the filename field or change "All supported files" to "All files"
              </p>
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) handleFileSelect(selectedFile);
                }}
                className="hidden"
              />
            </div>
          )}

          {/* File Selected */}
          {file && !uploading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB • {previewSegments.length} segments
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setPreviewSegments([]);
                    setError(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Preview */}
              {previewSegments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Preview (first 5 segments):</p>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {previewSegments.map((segment, idx) => (
                      <div key={idx} className="p-3 bg-secondary/50 rounded text-sm">
                        <p className="text-foreground">{segment.source_text}</p>
                        {segment.target_text && (
                          <p className="text-muted-foreground text-xs mt-1">
                            → {segment.target_text}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Uploading Progress */}
          {uploading && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
                <p className="text-sm text-foreground">Uploading and processing file...</p>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? 'Uploading...' : 'Upload & Import'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
