import { Database, Search, Upload, Download, Trash2 } from "lucide-react";

export default function TranslationMemory() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Translation Memory</h1>
          <p className="text-muted-foreground mt-1">Manage your translation memory database</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors">
            <Upload className="w-4 h-4" /> Import
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search translation memory..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <div className="space-y-4">
          {[
            { source: "Welcome to our platform", target: "Bienvenue sur notre plateforme", lang: "EN → FR", date: "2024-02-10" },
            { source: "User settings", target: "Paramètres utilisateur", lang: "EN → FR", date: "2024-02-09" },
            { source: "Save changes", target: "Enregistrer les modifications", lang: "EN → FR", date: "2024-02-08" },
            { source: "Delete account", target: "Supprimer le compte", lang: "EN → FR", date: "2024-02-07" },
          ].map((entry, i) => (
            <div key={i} className="p-4 rounded-lg border border-border hover:bg-secondary/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-accent">{entry.lang}</span>
                    <span className="text-xs text-muted-foreground">{entry.date}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-foreground">{entry.source}</p>
                    <p className="text-sm text-muted-foreground">{entry.target}</p>
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
