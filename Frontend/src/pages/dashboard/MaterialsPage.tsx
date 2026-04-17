import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FolderOpen, Search, FileText, Trash2, Upload, X, CloudUpload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function MaterialsPage() {
  const [materials,     setMaterials]     = useState<any[]>([]);
  const [search,        setSearch]        = useState('');
  const [loading,       setLoading]       = useState(true);
  const [uploading,     setUploading]     = useState(false);
  const [showModal,     setShowModal]     = useState(false);
  const [filterCoursId, setFilterCoursId] = useState('');
  const [filterType,    setFilterType]    = useState('');
const [filterFiliereId, setFilterFiliereId] = useState('');
const [filterNiveau,    setFilterNiveau]    = useState('');
const [filterGroupe,    setFilterGroupe]    = useState('');
const [filterGroupes,   setFilterGroupes]   = useState<string[]>([]);
  // ── Formulaire upload ──
  const [titre,     setTitre]     = useState('');
  const [type,      setType]      = useState('COURS');
  const [coursId,   setCoursId]   = useState('');
  const [cours,     setCours]     = useState<any[]>([]);
  const [dragOver,  setDragOver]  = useState(false);
  const [fileName,  setFileName]  = useState('');

  // ── Nouveaux états filière/niveau/groupe ──
  const [filieres,  setFilieres]  = useState<any[]>([]);
  const [filiereId, setFiliereId] = useState('');
  const [niveau,    setNiveau]    = useState('');
  const [groupes,   setGroupes]   = useState<string[]>([]);
  const [groupe,    setGroupe]    = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  const NIVEAUX = ['L1', 'L2', 'L3', 'M1', 'M2'];

  useEffect(() => { loadMaterials(); loadCours(); loadFilieres(); }, []);

  // ── Charger mes documents ──
  const loadMaterials = async () => {
    setLoading(true);
    try {
      const res = await apiCall('/documents/mes-cours');
      setMaterials(res.data ?? []);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  // ── Charger mes cours (pour filtres) ──
  const loadCours = async () => {
    try {
      const res = await apiCall('/documents/mes-cours-liste');
      setCours(res.data ?? []);
    } catch { /* ignorer */ }
  };

  const loadFilieres = async () => {
  try {
    const res = await apiCall('/documents/mes-filieres');
    setFilieres(res.data ?? []);
  } catch { /* ignorer */ }
};
  // ── Charger filières quand modal s'ouvre ──
  const openModal = async () => {
    setShowModal(true);
    try {
      const res = await apiCall('/documents/mes-filieres');
      setFilieres(res.data ?? []);
    } catch (err: any) { toast.error(err.message); }
  };

  // ── Quand filière change → reset niveau/groupe/cours ──
  const handleFiliereChange = (id: string) => {
    setFiliereId(id);
    setNiveau('');
    setGroupes([]);
    setGroupe('');
    setCoursId('');
    setCours([]);
  };

  // ── Quand niveau change → charger groupes ──
  const handleNiveauChange = async (niv: string) => {
    setNiveau(niv);
    setGroupes([]);
    setGroupe('');
    if (!filiereId || !niv) return;
    try {
      const res = await apiCall(`/documents/groupes-par-filiere/${filiereId}?niveau=${niv}`);
      setGroupes(res.data?.groupes ?? []);
    } catch (err: any) { toast.error(err.message); }
  };

  // ── Quand groupe change → charger cours de la filière ──
  const handleGroupeChange = async (g: string) => {
    setGroupe(g);
    setCoursId('');
    if (!filiereId) return;
    try {
      const res = await apiCall(`/documents/cours-par-filiere/${filiereId}`);
      setCours(res.data ?? []);
    } catch (err: any) { toast.error(err.message); }
  };

  // ── Fermer modal ──
  const closeModal = () => {
    setShowModal(false);
    setTitre(''); setType('COURS'); setCoursId('');
    setFiliereId(''); setNiveau(''); setGroupes([]);
    setGroupe(''); setFileName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Upload PDF ──
  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!filiereId) return toast.error('Sélectionne une filière.');
    if (!niveau)    return toast.error('Sélectionne un niveau.');
    if (!groupe)    return toast.error('Sélectionne un groupe.');
    if (!coursId)   return toast.error('Sélectionne un cours.');
    if (!titre)     return toast.error('Le titre est obligatoire.');
    if (!file)      return toast.error('Sélectionne un fichier PDF.');
    if (file.type !== 'application/pdf') return toast.error('Seuls les PDF sont acceptés.');

    const formData = new FormData();
    formData.append('fichier',  file);
    formData.append('titre',    titre);
    formData.append('type',     type);
    formData.append('coursId',  String(parseInt(coursId)));
    formData.append('groupe',   groupe);
formData.append('niveau',    niveau);
formData.append('filiereId', filiereId);
    setUploading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Erreur ${response.status}`);

      toast.success('Document uploadé avec succès !');
      closeModal();
      loadMaterials();
      loadCours();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce document ?')) return;
    try {
      await apiCall(`/documents/${id}`, { method: 'DELETE' });
      toast.success('Document supprimé.');
      loadMaterials();
    } catch (err: any) { toast.error(err.message); }
  };

  const filtered = materials.filter((m) => {
  const matchSearch  = (m.titre ?? '').toLowerCase().includes(search.toLowerCase());
  const matchCours   = filterCoursId  ? String(m.coursId) === filterCoursId : true;
  const matchType    = filterType     ? m.type === filterType               : true;
  const matchNiveau  = filterNiveau   ? m.niveau === filterNiveau           : true;
  const matchGroupe  = filterGroupe
    ? (() => {
        if (!m.groupe) return false;
        try {
          const groupes = JSON.parse(m.groupe);
          return Array.isArray(groupes)
            ? groupes.includes(filterGroupe)
            : m.groupe === filterGroupe;
        } catch {
          return m.groupe === filterGroupe;
        }
      })()
    : true;

  return matchSearch && matchCours && matchType && matchNiveau && matchGroupe;
});

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-primary" /> Mes supports de cours
          </h1>
          <p className="text-muted-foreground">Gérez vos documents pédagogiques</p>
        </div>
        <Button onClick={openModal} className="gap-2">
          <Upload className="h-4 w-4" /> Uploader un document
        </Button>
      </motion.div>

      {/* ── Filtres ── */}
<div className="flex gap-3 flex-wrap">

  {/* Recherche */}
  <div className="relative flex-1 min-w-[200px]">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input placeholder="Rechercher..." value={search}
      onChange={(e) => setSearch(e.target.value)} className="pl-10" />
  </div>

  {/* Filière */}
  <select
    value={filterFiliereId}
    onChange={async (e) => {
      setFilterFiliereId(e.target.value);
      setFilterNiveau('');
      setFilterGroupe('');
      setFilterGroupes([]);
    }}
    className="border rounded-md px-3 py-2 text-sm bg-background min-w-[150px]">
    <option value="">Toutes les filières</option>
    {filieres.map((f) => (
      <option key={f.id} value={f.id}>{f.nom}</option>
    ))}
  </select>

  {/* Niveau */}
  {filterFiliereId && (
    <select
      value={filterNiveau}
      onChange={async (e) => {
        const niv = e.target.value;
        setFilterNiveau(niv);
        setFilterGroupe('');
        if (niv && filterFiliereId) {
          try {
            const res = await apiCall(`/documents/groupes-par-filiere/${filterFiliereId}?niveau=${niv}`);
            setFilterGroupes(res.data?.groupes ?? []);
          } catch { setFilterGroupes([]); }
        } else {
          setFilterGroupes([]);
        }
      }}
      className="border rounded-md px-3 py-2 text-sm bg-background min-w-[100px]">
      <option value="">Tous niveaux</option>
      {NIVEAUX.map((n) => (
        <option key={n} value={n}>{n}</option>
      ))}
    </select>
  )}

  {/* Groupe */}
  {filterNiveau && filterGroupes.length > 0 && (
    <select
      value={filterGroupe}
      onChange={(e) => setFilterGroupe(e.target.value)}
      className="border rounded-md px-3 py-2 text-sm bg-background min-w-[100px]">
      <option value="">Tous les groupes</option>
      <option value="TOUS">Tous les groupes (global)</option>
      {filterGroupes.map((g) => (
        <option key={g} value={g}>{g}</option>
      ))}
    </select>
  )}

  {/* Cours */}
  <select value={filterCoursId} onChange={(e) => setFilterCoursId(e.target.value)}
    className="border rounded-md px-3 py-2 text-sm bg-background min-w-[160px]">
    <option value="">Tous les cours</option>
    {cours.map((c) => <option key={c.id} value={c.id}>{c.nom} ({c.code})</option>)}
  </select>

  {/* Type */}
  <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
    className="border rounded-md px-3 py-2 text-sm bg-background">
    <option value="">Tous les types</option>
    <option value="COURS">Cours</option>
    <option value="TD">TD</option>
    <option value="TP">TP</option>
    <option value="EXAMEN">Examen</option>
  </select>

  {/* Reset filtres */}
  {(filterFiliereId || filterNiveau || filterGroupe || filterCoursId || filterType || search) && (
    <Button variant="ghost" size="sm" onClick={() => {
      setSearch(''); setFilterFiliereId(''); setFilterNiveau('');
      setFilterGroupe(''); setFilterGroupes([]); setFilterCoursId(''); setFilterType('');
    }}>
      ✕ Reset
    </Button>
  )}
</div>

      {/* ── Liste ── */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((mat, i) => (
              <motion.div key={mat.id} layout initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                transition={{ delay: i * 0.05 }}>
                <Card className="shadow-card border-0 hover:shadow-elevated transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{mat.titre}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs">{mat.type}</Badge>
                        {mat.cours?.nom && <Badge variant="outline" className="text-xs">{mat.cours.nom}</Badge>}
                        {mat.dateDepot && <span className="text-xs text-muted-foreground">{format(new Date(mat.dateDepot), 'd MMM yyyy', { locale: fr })}</span>}
                        <span className="text-xs text-muted-foreground">{mat.nbTelechargements} téléchargement(s)</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(mat.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📄</div>
          <p className="text-muted-foreground">
            {materials.length === 0 ? 'Aucun document uploadé pour le moment' : 'Aucun résultat'}
          </p>
        </div>
      )}

      {/* ── Modal Upload ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-background rounded-2xl border shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">

              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-4 sticky top-0 bg-background border-b">
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-lg">Uploader un document</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={closeModal} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Body */}
              <div className="px-6 pb-6 space-y-4 pt-4">

                {/* Étape 1 — Filière */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                    Filière *
                  </label>
                  <select value={filiereId} onChange={(e) => handleFiliereChange(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                    <option value="">-- Sélectionner une filière --</option>
                    {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom} ({f.code})</option>)}
                  </select>
                </div>

                {/* Étape 2 — Niveau */}
                {filiereId && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                      Niveau *
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {NIVEAUX.map((n) => (
                        <button key={n} onClick={() => handleNiveauChange(n)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${niveau === n ? 'bg-primary text-primary-foreground border-primary' : 'border-muted-foreground/25 hover:border-primary/50'}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                                {/* Étape 3 — Groupe */}
                {niveau && groupes.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
                      Groupe *
                    </label>
                    <div className="flex gap-2 flex-wrap">

                      {/* ← Ajouter ce bouton "Tous" */}
                      <button
                        onClick={() => handleGroupeChange('TOUS')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          groupe === 'TOUS'
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-muted-foreground/25 hover:border-primary/50'
                        }`}>
                        Tous les groupes
                      </button>

                      {groupes.map((g) => (
                        <button key={g} onClick={() => handleGroupeChange(g)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                            groupe === g
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-muted-foreground/25 hover:border-primary/50'
                          }`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Étape 4 — Cours */}
                {groupe && cours.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">4</span>
                      Cours *
                    </label>
                    <select value={coursId} onChange={(e) => setCoursId(e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                      <option value="">-- Sélectionner un cours --</option>
                      {cours.map((c) => <option key={c.id} value={c.id}>{c.nom} ({c.code})</option>)}
                    </select>
                  </div>
                )}

                {/* Étape 5 — PDF + titre + type */}
                {coursId && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium flex items-center gap-1">
                        <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">5</span>
                        Titre + Type + Fichier *
                      </label>
                      <Input placeholder="Titre du document" value={titre} onChange={(e) => setTitre(e.target.value)} />
                    </div>

                    <select value={type} onChange={(e) => setType(e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                      <option value="COURS">Cours</option>
                      <option value="TD">TD</option>
                      <option value="TP">TP</option>
                      <option value="EXAMEN">Examen</option>
                    </select>

                    {/* Zone drop */}
                    <div
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
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
                      <CloudUpload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Glissez un fichier ici ou <span className="text-primary font-medium">parcourez</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">PDF uniquement · 10 Mo max</p>
                      {fileName && <p className="text-xs text-primary mt-2 font-medium">✓ {fileName}</p>}
                    </div>
                    <input ref={fileRef} type="file" accept=".pdf" className="hidden"
                      onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')} />
                  </>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={closeModal}>Annuler</Button>
                  <Button className="flex-1 gap-2" onClick={handleUpload} disabled={uploading}>
                    {uploading
                      ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Upload...</>
                      : <><Upload className="h-4 w-4" /> Uploader</>}
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