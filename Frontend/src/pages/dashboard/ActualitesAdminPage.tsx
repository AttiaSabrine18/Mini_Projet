import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Newspaper, Search, Trash2, Upload, X, CloudUpload, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ActualitesAdminPage() {
  const [actualites, setActualites] = useState<any[]>([]);
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [uploading,  setUploading]  = useState(false);
  const [showModal,  setShowModal]  = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [dragOver,   setDragOver]   = useState(false);
  const [fileName,   setFileName]   = useState('');

  const [titre,      setTitre]      = useState('');
  const [contenu,    setContenu]    = useState('');
  const [estPubliee, setEstPubliee] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadActualites(); }, []);

  const loadActualites = async () => {
    setLoading(true);
    try {
      const res = await apiCall('/actualites/toutes');
      setActualites(res.data ?? []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditTarget(null);
    setTitre(''); setContenu(''); setEstPubliee(true); setFileName('');
    if (fileRef.current) fileRef.current.value = '';
    setShowModal(true);
  };

  const openEdit = (actu: any) => {
    setEditTarget(actu);
    setTitre(actu.titre);
    setContenu(actu.contenu);
    setEstPubliee(actu.estPubliee);
    setFileName('');
    if (fileRef.current) fileRef.current.value = '';
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTarget(null);
    setTitre(''); setContenu(''); setFileName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!titre)   return toast.error('Le titre est obligatoire.');
    if (!contenu) return toast.error('Le contenu est obligatoire.');

    const formData = new FormData();
    formData.append('titre',      titre);
    formData.append('contenu',    contenu);
    formData.append('estPubliee', String(estPubliee));
    const file = fileRef.current?.files?.[0];
    if (file) formData.append('fichierPDF', file);

    setUploading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const url    = editTarget ? `/api/actualites/${editTarget.id}` : '/api/actualites';
      const method = editTarget ? 'PUT' : 'POST';

      const response = await fetch(`http://localhost:3000${url}`, {
        method,
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Erreur ${response.status}`);

      toast.success(editTarget ? 'Actualité modifiée !' : 'Actualité créée !');
      closeModal();
      loadActualites();
    } catch (err: any) {
      toast.error(err.message || 'Erreur.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette actualité ?')) return;
    try {
      await apiCall(`/actualites/${id}`, { method: 'DELETE' });
      toast.success('Actualité supprimée.');
      loadActualites();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDownload = async (actu: any) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:3000/api/actualites/telecharger/${actu.id}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!response.ok) throw new Error('Erreur téléchargement');
      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `${actu.titre}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filtered = actualites.filter((a) =>
    (a.titre ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-primary" /> Actualités
          </h1>
          <p className="text-muted-foreground">Gérez les actualités de l'établissement</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Upload className="h-4 w-4" /> Nouvelle actualité
        </Button>
      </motion.div>

      {/* ── Recherche ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* ── Liste ── */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((actu, i) => (
              <motion.div key={actu.id} layout
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }} transition={{ delay: i * 0.05 }}>
                <Card className="shadow-card border-0 hover:shadow-elevated transition-shadow">
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Newspaper className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{actu.titre}</p>
                        <Badge variant={actu.estPubliee ? 'default' : 'secondary'} className="text-xs">
                          {actu.estPubliee ? 'Publiée' : 'Brouillon'}
                        </Badge>
                        {actu.fichierPDF && (
                          <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10"
                            onClick={() => handleDownload(actu)}>
                            📎 PDF
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{actu.contenu}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {actu.admin?.utilisateur?.prenom} {actu.admin?.utilisateur?.nom}
                        </span>
                        {actu.datePublication && (
                          <span className="text-xs text-muted-foreground">
                            · {format(new Date(actu.datePublication), 'd MMM yyyy', { locale: fr })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(actu)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(actu.id)}
                        className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📰</div>
              <p className="text-muted-foreground">
                {actualites.length === 0 ? 'Aucune actualité pour le moment' : 'Aucun résultat'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Modal Créer / Modifier ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-background rounded-2xl border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

              {/* Header modal */}
              <div className="flex items-center justify-between p-6 pb-4 sticky top-0 bg-background z-10 border-b">
                <div className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-lg">
                    {editTarget ? 'Modifier l\'actualité' : 'Nouvelle actualité'}
                  </h2>
                </div>
                <Button variant="ghost" size="icon" onClick={closeModal} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Body modal */}
              <div className="px-6 pb-6 pt-4 space-y-4">

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Titre *</label>
                  <Input placeholder="ex: Rentrée universitaire 2026"
                    value={titre} onChange={(e) => setTitre(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Contenu *</label>
                  <textarea
                    placeholder="Rédigez le contenu de l'actualité..."
                    value={contenu}
                    onChange={(e) => setContenu(e.target.value)}
                    rows={5}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium">Statut</label>
                  <button
                    onClick={() => setEstPubliee(!estPubliee)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${estPubliee ? 'bg-primary' : 'bg-muted'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${estPubliee ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {estPubliee ? 'Publiée' : 'Brouillon'}
                  </span>
                </div>

                {/* Zone drop PDF */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Fichier PDF <span className="text-muted-foreground">(optionnel)</span></label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault(); setDragOver(false);
                      const file = e.dataTransfer.files[0];
                      if (file && fileRef.current) {
                        const dt = new DataTransfer();
                        dt.items.add(file);
                        fileRef.current.files = dt.files;
                        setFileName(file.name);
                      }
                    }}>
                    <CloudUpload className="h-7 w-7 mx-auto mb-2 text-muted-foreground" />
                    {fileName ? (
                      <p className="text-sm text-primary font-medium">✓ {fileName}</p>
                    ) : editTarget?.fichierPDF ? (
                      <p className="text-sm text-muted-foreground">
                        PDF actuel attaché · <span className="text-primary">Remplacer</span>
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Glissez un fichier ou <span className="text-primary font-medium">parcourez</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">PDF uniquement · 10 Mo max</p>
                      </>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept=".pdf" className="hidden"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')} />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={closeModal}>Annuler</Button>
                  <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={uploading}>
                    {uploading
                      ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> En cours...</>
                      : <><Upload className="h-4 w-4" /> {editTarget ? 'Modifier' : 'Publier'}</>
                    }
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}