import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Instagram, Heart, Scissors, Package, Menu, X, Plus, Image as ImageIcon, Trash2, Camera, Loader2, FolderPlus, Share2, Search, SortAsc, Moon, Sun, Facebook } from 'lucide-react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
  getDoc
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import imageCompression from 'browser-image-compression';
import { db, auth } from './firebase';
import logo from './assets/logo.png';
import portraitImg from './assets/maria-helena-portrait.png';
import atelierImg from './assets/maria-helena-atelier.png';

const OWNER_EMAIL = 'pierre.santos.p@gmail.com';
const CATEGORIES_DOC_ID = 'app-categories';
const SOCIAL_LINKS_DOC_ID = 'social-links';

setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error('Falha ao configurar persistência de login:', err);
});

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } 
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

interface CollectionItem {
  id: string;
  category: string;
  title: string;
  images: string[];
  desc: string;
  price?: string;
  availability: 'Pronta Entrega' | 'Sob Encomenda' | 'Vendido';
  createdAt?: any;
}

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isCuratorMode, setIsCuratorMode] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<CollectionItem[]>([]);
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoginOpen, setIsLoginOpen] = React.useState(false);
  const [loginEmail, setLoginEmail] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  // Categories Management
  const [categories, setCategories] = React.useState<string[]>(['Enxoval Delicado', 'Decor Baby', 'Acessórios Afetivos']);
  const [isCategoriesOpen, setIsCategoriesOpen] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState('');

  // Social Links Management
  const [socialLinks, setSocialLinks] = React.useState({ instagram: '', facebook: '', whatsapp: '' });
  const [isSocialLinksOpen, setIsSocialLinksOpen] = React.useState(false);
  const [tempInstagram, setTempInstagram] = React.useState('');
  const [tempFacebook, setTempFacebook] = React.useState('');
  const [tempWhatsapp, setTempWhatsapp] = React.useState('');

  // Search, Sort, Pagination
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'recent' | 'price-asc' | 'price-desc' | 'name'>('recent');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [darkMode, setDarkMode] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const itemsPerPage = 12;

  // Form State
  const [newItem, setNewItem] = React.useState<Partial<CollectionItem>>({
    category: 'Enxoval Delicado',
    availability: 'Sob Encomenda',
    images: []
  });



  // Auth (Email + Password)
  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u && u.email === OWNER_EMAIL) {
        console.log('Proprietária logada:', u.email);
        setIsCuratorMode(true);
        setIsLoginOpen(false);
      } else {
        setIsCuratorMode(false);
      }
    });
    return unsub;
  }, []);

  // Load categories from Firestore
  React.useEffect(() => {
    const loadCategories = async () => {
      try {
        const docRef = doc(db, 'settings', CATEGORIES_DOC_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.categories && Array.isArray(data.categories)) {
            setCategories(data.categories);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
      }
    };
    loadCategories();
  }, []);

  // Load social links from Firestore
  React.useEffect(() => {
    const loadSocialLinks = async () => {
      try {
        const docRef = doc(db, 'settings', SOCIAL_LINKS_DOC_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSocialLinks({
            instagram: data.instagram || '',
            facebook: data.facebook || '',
            whatsapp: data.whatsapp || ''
          });
        }
      } catch (error) {
        console.error('Erro ao carregar links sociais:', error);
      }
    };
    loadSocialLinks();
  }, []);

  const openLogin = () => {
    setLoginPassword('');
    setLoginError(null);
    setIsLoginOpen(true);
  };

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      // onAuthStateChanged cuidará de fechar o modal e ativar o modo curadoria
    } catch (err: any) {
      const code = err?.code || '';
      let msg = 'Não foi possível entrar. Verifique e-mail e senha.';
      if (code === 'auth/invalid-email') msg = 'E-mail inválido.';
      else if (code === 'auth/user-not-found') msg = 'Usuária não encontrada. Crie a conta no Firebase Authentication.';
      else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') msg = 'Senha incorreta.';
      else if (code === 'auth/too-many-requests') msg = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
      else if (code === 'auth/network-request-failed') msg = 'Sem conexão. Verifique sua internet.';
      else if (code === 'auth/operation-not-allowed') msg = 'O método de login por e-mail e senha não está habilitado no Firebase.';
      setLoginError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setIsCuratorMode(false);
  };

  const toggleCuratorMode = () => {
    if (user && user.email === OWNER_EMAIL) {
      // Já logada: alterna o modo curadoria
      setIsCuratorMode(!isCuratorMode);
    } else {
      // Não logada (ou e-mail diferente): abre modal
      openLogin();
    }
  };

  // Real-time Firestore sync
  React.useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'collections'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as CollectionItem[];
      setItems(data);
      setIsLoading(false);
    });
    return unsub;
  }, []);

  // Dark mode
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Filter, Sort, Paginate
  const filteredItems = React.useMemo(() => {
    let filtered = items.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.desc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'price-asc':
          return (parseFloat(a.price || '0') - parseFloat(b.price || '0'));
        case 'price-desc':
          return (parseFloat(b.price || '0') - parseFloat(a.price || '0'));
        case 'name':
          return a.title.localeCompare(b.title);
        case 'recent':
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, searchTerm, sortBy]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Share function
  const shareProduct = (item: CollectionItem) => {
    const url = window.location.href;
    const text = `Confira: ${item.title} - Anja Mila Ateliê`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Check if item is new (last 7 days)
  const isNewItem = (item: CollectionItem) => {
    if (!item.createdAt) return false;
    const created = item.createdAt.toDate?.() || new Date(item.createdAt);
    const daysDiff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    // Limits: Max 5 images per document to stay under 1MB Firestore limit
    const currentCount = newItem.images?.length || 0;
    const remainingCount = 5 - currentCount;
    const filesToUpload = files.slice(0, remainingCount);

    if (filesToUpload.length === 0) {
      if (currentCount >= 5) alert("Limite de 5 fotos por peça atingido para garantir a performance.");
      return;
    }

    setIsUploading(true);
    try {
      const base64Images: string[] = [];
      
      const options = {
        maxSizeMB: 0.1, // Keep it very small (100kb)
        maxWidthOrHeight: 1024,
        useWebWorker: true
      };

      for (const file of filesToUpload) {
        // Compress image
        const compressedFile = await imageCompression(file, options);
        
        // Convert to Base64
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(compressedFile);
        });
        base64Images.push(base64);
      }

      setNewItem(prev => ({
        ...prev,
        images: [...(prev.images || []), ...base64Images]
      }));
    } catch (error: any) {
      console.error("Processing failed:", error);
      alert("Erro ao processar imagem: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const addImageUrl = (raw: string): boolean => {
    const val = raw.trim();
    if (!val) return false;
    let parsed: URL;
    try {
      parsed = new URL(val);
    } catch {
      alert('Link inválido. Cole um endereço completo começando com https://');
      return false;
    }
    if (parsed.protocol !== 'https:') {
      alert('Por segurança, apenas links https:// são aceitos.');
      return false;
    }
    if ((newItem.images?.length || 0) >= 10) {
      alert('Limite de 10 fotos por peça atingido.');
      return false;
    }
    setNewItem(prev => ({ ...prev, images: [...(prev.images || []), val] }));
    return true;
  };

  const removeUploadedImage = (url: string) => {
    setNewItem(prev => ({
      ...prev,
      images: prev.images?.filter(u => u !== url)
    }));
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title || !newItem.images || newItem.images.length === 0) return;

    try {
      if (editingId) {
        const itemRef = doc(db, 'collections', editingId);
        await updateDoc(itemRef, {
          ...newItem,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'collections'), {
          ...newItem,
          createdAt: serverTimestamp()
        });
      }

      setNewItem({ category: 'Enxoval Delicado', availability: 'Sob Encomenda', images: [] });
      setEditingId(null);
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error saving doc:", error);
    }
  };

  const removeItem = async (id: string) => {
    // Usando confirm do navegador. Se não aparecer, pode ser bloqueio do browser no preview.
    const confirmed = window.confirm("Você tem certeza que deseja excluir esta peça permanentemente?");
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'collections', id));
      alert("Peça removida com sucesso!");
    } catch (error: any) {
      console.error("Delete failed:", error);
      alert("Não foi possível excluir: " + (error.message || "Erro de permissão. Verifique se você está logado com o e-mail correto."));
    }
  };

  const openEdit = (item: CollectionItem) => {
    setNewItem(item);
    setEditingId(item.id);
    setIsFormOpen(true);
  };

  const openCreate = () => {
    setNewItem({ category: categories[0] || 'Enxoval Delicado', availability: 'Sob Encomenda', images: [] });
    setEditingId(null);
    setIsFormOpen(true);
  };

  // Categories Management Functions
  const saveCategories = async (newCategories: string[]) => {
    try {
      const docRef = doc(db, 'settings', CATEGORIES_DOC_ID);
      await setDoc(docRef, { categories: newCategories });
      setCategories(newCategories);
    } catch (error) {
      console.error('Erro ao salvar categorias:', error);
      alert('Não foi possível salvar as categorias.');
    }
  };

  const addCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      alert('Digite um nome para a categoria.');
      return;
    }
    if (categories.includes(trimmed)) {
      alert('Esta categoria já existe.');
      return;
    }
    const updated = [...categories, trimmed];
    await saveCategories(updated);
    setNewCategoryName('');
  };

  const removeCategory = async (categoryToRemove: string) => {
    const confirmed = window.confirm(`Tem certeza que deseja excluir a categoria "${categoryToRemove}"?`);
    if (!confirmed) return;

    const updated = categories.filter(c => c !== categoryToRemove);
    await saveCategories(updated);
  };

  // Social Links Management Functions
  const validateUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Empty is valid
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      return false;
    }
  };

  const saveSocialLinks = async () => {
    if (!validateUrl(tempInstagram)) {
      alert('Link do Instagram inválido. Use um URL completo (https://...)');
      return;
    }
    if (!validateUrl(tempFacebook)) {
      alert('Link do Facebook inválido. Use um URL completo (https://...)');
      return;
    }
    if (!validateUrl(tempWhatsapp)) {
      alert('Link do WhatsApp inválido. Use um URL completo (https://wa.me/...)');
      return;
    }

    try {
      const docRef = doc(db, 'settings', SOCIAL_LINKS_DOC_ID);
      await setDoc(docRef, {
        instagram: tempInstagram.trim(),
        facebook: tempFacebook.trim(),
        whatsapp: tempWhatsapp.trim()
      });
      setSocialLinks({
        instagram: tempInstagram.trim(),
        facebook: tempFacebook.trim(),
        whatsapp: tempWhatsapp.trim()
      });
      setIsSocialLinksOpen(false);
    } catch (error) {
      console.error('Erro ao salvar links:', error);
      alert('Não foi possível salvar os links.');
    }
  };

  const openSocialLinksModal = () => {
    setTempInstagram(socialLinks.instagram);
    setTempFacebook(socialLinks.facebook);
    setTempWhatsapp(socialLinks.whatsapp);
    setIsSocialLinksOpen(true);
  };

  const handleSocialClick = (platform: 'instagram' | 'facebook' | 'whatsapp') => {
    if (isCuratorMode) {
      openSocialLinksModal();
    } else {
      const url = socialLinks[platform];
      if (url) window.open(url, '_blank');
    }
  };

  return (
    <div className="min-h-screen selection:bg-cottage-rose/30 relative overflow-hidden">
      {/* Decorative botanical background — fixed in viewport, behind content */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* Soft warm halos for depth */}
        <div className="absolute -top-32 -left-32 w-[32rem] h-[32rem] bg-cottage-rose/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-[36rem] h-[36rem] bg-cottage-sage/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[30rem] h-[30rem] bg-cottage-rose/15 rounded-full blur-3xl" />

        {/* Eucalyptus sprig — top right */}
        <svg className="absolute top-28 -right-8 w-72 md:w-96 opacity-30 -rotate-12" viewBox="0 0 200 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 280 Q105 200 95 130 Q88 80 100 20" stroke="#A3B18A" strokeWidth="1.5" strokeLinecap="round"/>
          {[40, 70, 100, 130, 160, 190, 220, 250].map((y, i) => (
            <g key={i}>
              <ellipse cx={i % 2 === 0 ? 78 : 122} cy={y} rx="14" ry="9" fill="#A3B18A" opacity="0.7" transform={`rotate(${i % 2 === 0 ? -25 : 25} ${i % 2 === 0 ? 78 : 122} ${y})`}/>
              <ellipse cx={i % 2 === 0 ? 60 : 140} cy={y - 5} rx="12" ry="7" fill="#A3B18A" opacity="0.55" transform={`rotate(${i % 2 === 0 ? -45 : 45} ${i % 2 === 0 ? 60 : 140} ${y - 5})`}/>
            </g>
          ))}
        </svg>

        {/* Lavender sprig — bottom left */}
        <svg className="absolute bottom-16 -left-4 w-64 md:w-80 opacity-30 rotate-6" viewBox="0 0 160 280" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M80 270 Q82 180 78 100 Q76 60 80 30" stroke="#A3B18A" strokeWidth="1.5" strokeLinecap="round"/>
          {[35, 50, 65, 80, 95, 110, 125].map((y, i) => (
            <g key={i}>
              <ellipse cx={70 - (i % 2) * 4} cy={y} rx="6" ry="4" fill="#9B7B8C" opacity="0.75"/>
              <ellipse cx={88 + (i % 2) * 4} cy={y + 4} rx="6" ry="4" fill="#9B7B8C" opacity="0.75"/>
              <ellipse cx={80} cy={y - 2} rx="5" ry="3.5" fill="#B89AAA" opacity="0.7"/>
            </g>
          ))}
          <ellipse cx="60" cy="180" rx="16" ry="6" fill="#A3B18A" opacity="0.55" transform="rotate(-30 60 180)"/>
          <ellipse cx="100" cy="210" rx="16" ry="6" fill="#A3B18A" opacity="0.55" transform="rotate(30 100 210)"/>
          <ellipse cx="62" cy="230" rx="14" ry="5" fill="#A3B18A" opacity="0.5" transform="rotate(-30 62 230)"/>
        </svg>

        {/* Wildflower cluster — middle left (desktop only) */}
        <svg className="absolute top-1/2 -translate-y-1/2 -left-6 w-44 opacity-25 -rotate-12 hidden lg:block" viewBox="0 0 120 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M60 200 Q62 140 58 80 Q55 50 60 20" stroke="#A3B18A" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M60 120 Q40 90 30 60" stroke="#A3B18A" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M60 140 Q80 110 90 80" stroke="#A3B18A" strokeWidth="1.2" strokeLinecap="round"/>
          {[
            { cx: 60, cy: 20 },
            { cx: 30, cy: 60 },
            { cx: 90, cy: 80 },
          ].map((p, i) => (
            <g key={i}>
              {[0, 72, 144, 216, 288].map((deg) => (
                <ellipse key={deg} cx={p.cx} cy={p.cy - 7} rx="4" ry="6" fill="#D4A373" opacity="0.7" transform={`rotate(${deg} ${p.cx} ${p.cy})`}/>
              ))}
              <circle cx={p.cx} cy={p.cy} r="2.5" fill="#5E503F" opacity="0.6"/>
            </g>
          ))}
        </svg>

        {/* Small leaves — top left accent */}
        <svg className="absolute top-40 left-12 w-32 opacity-25 rotate-45 hidden md:block" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 10 Q50 55 50 90" stroke="#A3B18A" strokeWidth="1.2" strokeLinecap="round"/>
          <ellipse cx="38" cy="35" rx="12" ry="6" fill="#A3B18A" opacity="0.7" transform="rotate(-35 38 35)"/>
          <ellipse cx="62" cy="50" rx="12" ry="6" fill="#A3B18A" opacity="0.7" transform="rotate(35 62 50)"/>
          <ellipse cx="38" cy="65" rx="11" ry="5" fill="#A3B18A" opacity="0.65" transform="rotate(-35 38 65)"/>
        </svg>

        {/* Single flower — bottom right */}
        <svg className="absolute bottom-40 right-16 w-28 opacity-30 rotate-12 hidden md:block" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <ellipse key={deg} cx="50" cy="35" rx="6" ry="14" fill="#D4A373" opacity="0.7" transform={`rotate(${deg} 50 50)`}/>
          ))}
          <circle cx="50" cy="50" r="6" fill="#5E503F" opacity="0.6"/>
          <path d="M50 56 Q50 80 50 95" stroke="#A3B18A" strokeWidth="1.5" strokeLinecap="round"/>
          <ellipse cx="42" cy="75" rx="9" ry="4" fill="#A3B18A" opacity="0.7" transform="rotate(-30 42 75)"/>
        </svg>
      </div>

      {/* Navbar - Fixed (z-40) */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-cottage-cream/80 backdrop-blur-md border-b border-wood-soft">
        <div className="max-w-7xl mx-auto px-12 h-24 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3 group" aria-label="Anja Mila Ateliê">
            <img
              src={logo}
              alt="Anja Mila Ateliê"
              className="h-16 md:h-20 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
            />
            <span className="sr-only">Anja Mila Ateliê</span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-12">
            {['Coleções', 'A Artesã', 'Processo', 'Contato'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="text-[13px] uppercase tracking-[0.2em] font-semibold text-cottage-wood opacity-70 hover:opacity-100 hover:text-cottage-rose transition-all duration-300"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3 border border-wood-soft rounded-full px-5 py-2.5 opacity-60 text-sm italic">
            <span>Procurar um presente especial...</span>
          </div>

          <button 
            className="md:hidden text-cottage-wood"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden bg-cottage-cream border-b border-wood-soft px-6 py-6"
            >
              <div className="flex flex-col gap-6">
                {['Coleções', 'A Artesã', 'Processo', 'Contato'].map((item) => (
                  <a 
                    key={item} 
                    href={`#${item.toLowerCase().replace(' ', '-')}`}
                    className="text-[10px] uppercase tracking-[0.2em] font-semibold text-cottage-wood/70"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center pt-24 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1528576273885-9e2c30d7758a?q=80&w=2070&auto=format&fit=crop" 
            alt="Ateliê de costura organizado com tecidos e carinho" 
            className="w-full h-full object-cover cottage-filter"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-cottage-cream/60 via-transparent to-cottage-cream/80" />
        </div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="relative z-10 text-center px-6 max-w-4xl"
        >
          <span className="inline-block text-cottage-sage font-semibold uppercase tracking-widest text-[11px] mb-6">
            Modern Cottagecore
          </span>
          <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl text-cottage-wood leading-[1.1] mb-8">
            Onde o carinho ganha forma e a arte vira abraço.
          </h2>
          <p className="text-sm md:text-base text-cottage-wood/80 max-lg:mx-auto mb-12 italic font-light leading-relaxed max-w-lg mx-auto">
            Artesanato premium feito à mão para eternizar momentos e decorar com alma.
          </p>
          <motion.a 
            whileHover={{ scale: 1.05, brightness: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="#coleções"
            className="inline-block bg-cottage-rose text-white px-10 py-4 rounded-full text-[11px] uppercase tracking-[0.2em] font-bold shadow-lg shadow-cottage-rose/20 hover:brightness-105 transition-all duration-500"
          >
            Explorar Coleções
          </motion.a>
        </motion.div>
      </section>

      {/* Galeria Section */}
      <section id="coleções" className="py-32 px-6 max-w-7xl mx-auto">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="text-center mb-20 relative"
        >
          <h3 className="font-serif text-4xl md:text-5xl text-cottage-wood mb-6">Feito com Amor: Nossa Curadoria</h3>
          <p className="text-cottage-wood/60 max-w-2xl mx-auto italic text-sm leading-relaxed">
            Peças exclusivas em costura criativa e tecidos selecionados, pensadas para quem valoriza o detalhe.
          </p>
          
          {isCuratorMode && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <motion.button
                layoutId="curator-btn"
                onClick={openCreate}
                className="inline-flex items-center gap-2 text-cottage-rose border border-cottage-rose px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-cottage-rose hover:text-white transition-all duration-300"
              >
                <Plus size={14} /> Verificar Produtos
              </motion.button>
              <motion.button
                onClick={() => setIsCategoriesOpen(true)}
                className="inline-flex items-center gap-2 text-cottage-sage border border-cottage-sage px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-cottage-sage hover:text-white transition-all duration-300"
              >
                <FolderPlus size={14} /> Gerenciar Categorias
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Search, Sort, Dark Mode Controls */}
        <div className="mb-12 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cottage-wood/40" size={18} />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-3 rounded-full border border-wood-soft bg-white dark:bg-cottage-wood dark:text-cottage-cream focus:border-cottage-rose outline-none transition-colors"
            />
          </div>

          <div className="flex gap-3 items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 rounded-full border border-wood-soft bg-white dark:bg-cottage-wood dark:text-cottage-cream text-sm outline-none cursor-pointer"
            >
              <option value="recent">Mais Recentes</option>
              <option value="name">Nome A-Z</option>
              <option value="price-asc">Menor Preço</option>
              <option value="price-desc">Maior Preço</option>
            </select>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full border border-wood-soft hover:bg-cottage-wood/5 dark:hover:bg-cottage-cream/10 transition-colors"
              title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-cottage-wood/10 dark:bg-cottage-cream/10 rounded-3xl mb-6" />
                <div className="h-6 bg-cottage-wood/10 dark:bg-cottage-cream/10 rounded w-3/4 mb-2" />
                <div className="h-4 bg-cottage-wood/10 dark:bg-cottage-cream/10 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {paginatedItems.map((item) => (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.6 }}
                className="group relative"
              >
                {isCuratorMode && (
                  <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <button
                      onClick={() => openEdit(item)}
                      className="bg-white/80 p-2 rounded-full text-cottage-rose hover:text-white hover:bg-cottage-rose transition-all shadow-sm"
                      title="Editar Peça"
                    >
                      <Scissors size={14} />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="bg-white/80 p-2 rounded-full text-red-400 hover:text-red-600 hover:bg-white transition-all shadow-sm"
                      title="Excluir Peça"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                {/* Share Button */}
                <button
                  onClick={() => shareProduct(item)}
                  className="absolute top-4 left-4 z-20 bg-white/80 p-2 rounded-full text-cottage-sage hover:text-white hover:bg-cottage-sage transition-all shadow-sm"
                  title="Compartilhar"
                >
                  <Share2 size={14} />
                </button>

                <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-sm mb-6">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110 cottage-filter"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="absolute bottom-6 left-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-4 group-hover:translate-y-0">
                    <div className="font-serif text-2xl">{item.title}</div>
                    <div className="text-[10px] uppercase tracking-widest opacity-80">{item.category}</div>
                    {item.price && <div className="text-sm mt-2 font-medium">R$ {item.price}</div>}
                  </div>

                  {/* New Badge */}
                  {isNewItem(item) && (
                    <div className="absolute top-6 left-6 bg-cottage-rose text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg animate-pulse">
                      Novo
                    </div>
                  )}

                  {item.availability && !isNewItem(item) && (
                    <div className="absolute top-6 left-6 bg-cottage-cream/90 dark:bg-cottage-wood/90 text-cottage-wood dark:text-cottage-cream text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-wood-soft">
                      {item.availability}
                    </div>
                  )}
                  {item.images.length > 1 && (
                    <div className="absolute bottom-6 right-6 bg-black/40 backdrop-blur-md text-[10px] text-white px-2 py-1 rounded-md">
                      +{item.images.length - 1} fotos
                    </div>
                  )}
                </div>
                <h4 className="font-serif text-xl text-cottage-wood dark:text-cottage-cream mb-2">{item.title}</h4>
                <p className="text-[10px] text-cottage-wood/50 dark:text-cottage-cream/50 uppercase tracking-[0.2em]">{item.desc}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-16 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-full border border-wood-soft disabled:opacity-30 hover:bg-cottage-wood/5 dark:hover:bg-cottage-cream/10 transition-colors"
            >
              Anterior
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-full transition-colors ${
                  currentPage === i + 1
                    ? 'bg-cottage-rose text-white'
                    : 'border border-wood-soft hover:bg-cottage-wood/5 dark:hover:bg-cottage-cream/10'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-full border border-wood-soft disabled:opacity-30 hover:bg-cottage-wood/5 dark:hover:bg-cottage-cream/10 transition-colors"
            >
              Próxima
            </button>
          </div>
        )}
          </>
        )}
      </section>

      {/* Sobre Section */}
      <section id="a-artesã" className="py-32 bg-[#E9E1D2]/30 border-y border-wood-soft">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0, x: -50 },
              visible: { opacity: 1, x: 0, transition: { duration: 1 } }
            }}
            className="relative"
          >
            {/* Soft halos behind composition */}
            <div className="absolute -top-10 -left-10 w-56 h-56 bg-cottage-sage/15 rounded-full blur-3xl -z-10" />
            <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-cottage-rose/15 rounded-full blur-3xl -z-10" />

            {/* Main portrait */}
            <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <img
                src={portraitImg}
                alt="Maria Helena, artesã do Anja Mila Ateliê, segurando uma agenda artesanal"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Secondary "polaroid" image — overlapping bottom-right */}
            <motion.div
              initial={{ opacity: 0, y: 30, rotate: -6 }}
              whileInView={{ opacity: 1, y: 0, rotate: 4 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.4 }}
              className="hidden sm:block absolute -bottom-12 -right-6 md:-right-12 w-44 md:w-56 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-white"
            >
              <img
                src={atelierImg}
                alt="Maria Helena no ateliê com tecidos e máquinas de costura"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Decorative tag */}
            <div className="hidden md:flex absolute -top-6 -right-6 items-center justify-center w-24 h-24 bg-cottage-cream rounded-full shadow-lg border border-wood-soft rotate-12">
              <div className="text-center">
                <div className="font-serif text-cottage-rose text-2xl leading-none">+30</div>
                <div className="text-[8px] uppercase tracking-widest text-cottage-wood/70 mt-1">anos<br/>de ofício</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="space-y-8"
          >
            <div className="text-cottage-sage font-semibold uppercase tracking-widest text-[11px]">Conectando Gerações</div>
            <h3 className="font-serif text-4xl md:text-5xl text-cottage-wood leading-[1.1]">
              Mãos que criam,<br />coração que dedica
            </h3>
            <p className="text-xs md:text-sm text-cottage-wood/80 leading-relaxed italic font-light max-w-md">
              "Por trás de cada ponto e cada corte na Anja Mila Ateliê, existe uma história de paixão pelo feito à mão. Acredito que o artesanato é a forma mais pura de materializar o afeto. Aqui, o tempo corre mais devagar para que cada detalhe receba a atenção que merece."
            </p>
            <div className="flex items-center gap-4 text-cottage-sage font-medium tracking-widest uppercase text-[10px]">
              <div className="h-[1px] w-12 bg-cottage-sage" />
              Anja Mila Ateliê
            </div>
          </motion.div>
        </div>
      </section>

      {/* Processo Section */}
      <section id="processo" className="py-32 px-6 max-w-7xl mx-auto">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="text-center mb-20"
        >
          <h3 className="font-serif text-4xl md:text-5xl text-cottage-wood mb-6">A Jornada de uma Peça Única</h3>
          <p className="text-cottage-wood/60 max-w-2xl mx-auto italic text-sm">O cuidado por trás de cada detalhe que chega até você.</p>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-16"
        >
          {[
            { 
              icon: <Scissors className="w-8 h-8" />, 
              title: 'A Escolha', 
              desc: 'Seleção cuidadosa de tecidos naturais e texturas que despertam o toque.' 
            },
            { 
              icon: <Heart className="w-8 h-8" />, 
              title: 'O Alinhavo', 
              desc: 'Costura feita com paciência e precisão milimétrica em cada ponto.' 
            },
            { 
              icon: <Package className="w-8 h-8" />, 
              title: 'O Toque Final', 
              desc: 'Embalagem perfumada e personalizada, pronta para emocionar.' 
            }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              variants={fadeIn}
              className="group"
            >
              <div className="flex flex-col gap-1 mb-8">
                <span className="text-[11px] uppercase font-bold text-cottage-sage tracking-widest">{item.title}</span>
                <span className="text-[11px] opacity-60 leading-relaxed">{item.desc}</span>
              </div>
              <div className="aspect-[16/9] rounded-3xl bg-cottage-sage/5 border border-wood-soft flex items-center justify-center text-cottage-sage group-hover:bg-cottage-rose/5 group-hover:text-cottage-rose transition-colors duration-500">
                {item.icon}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA Section */}
      <section id="contato" className="py-32 bg-cottage-wood text-cottage-cream relative overflow-hidden border-t border-wood-soft">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-10 left-10"><Instagram size={100} /></div>
          <div className="absolute bottom-10 right-10"><Heart size={100} /></div>
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="space-y-10"
          >
            <h3 className="font-serif text-4xl md:text-6xl italic">Vamos criar algo especial para você?</h3>
            <p className="text-sm md:text-base text-cottage-cream/60 font-light max-w-lg mx-auto leading-relaxed italic">
              Para encomendas personalizadas ou dúvidas sobre prazos, entre em contato diretamente conosco. Será um prazer te ouvir.
            </p>
            <div className="flex flex-col items-center gap-6 pt-6">
              <div className="text-[10px] text-cottage-cream/70 tracking-widest uppercase">© 2026 Anja Mila Ateliê — Feito à mão com paciência e amor.</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Curator Mode Toggle FAB */}
      <button 
        onClick={toggleCuratorMode}
        className={`fixed bottom-8 left-8 z-50 p-4 rounded-full shadow-2xl transition-all duration-500 scale-90 hover:scale-100 ${isCuratorMode ? 'bg-cottage-rose text-white' : 'bg-white text-cottage-wood'}`}
        title={isCuratorMode ? 'Desativar Modo Curadoria' : 'Ativar Modo Curadoria'}
      >
        <Scissors size={20} className={isCuratorMode ? 'animate-pulse' : ''} />
      </button>

      {user && user.email === OWNER_EMAIL && (
        <button
          onClick={logout}
          className="fixed bottom-8 left-24 z-50 bg-white/80 backdrop-blur-md text-cottage-wood text-[9px] font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-wood-soft hover:bg-white transition-all shadow-lg"
        >
          Sair do Ateliê
        </button>
      )}

      {/* Social Media Buttons */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
        <button
          onClick={() => handleSocialClick('instagram')}
          className="p-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-2xl hover:scale-110 transition-transform"
          title={isCuratorMode ? 'Configurar Instagram' : 'Instagram'}
        >
          <Instagram size={20} />
        </button>
        <button
          onClick={() => handleSocialClick('facebook')}
          className="p-4 rounded-full bg-blue-600 text-white shadow-2xl hover:scale-110 transition-transform"
          title={isCuratorMode ? 'Configurar Facebook' : 'Facebook'}
        >
          <Facebook size={20} />
        </button>
        <button
          onClick={() => handleSocialClick('whatsapp')}
          className="p-4 rounded-full bg-green-500 text-white shadow-2xl hover:scale-110 transition-transform"
          title={isCuratorMode ? 'Configurar WhatsApp' : 'WhatsApp'}
        >
          <MessageCircle size={20} />
        </button>
      </div>

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isLoggingIn && setIsLoginOpen(false)}
              className="fixed inset-0 bg-cottage-wood/40 backdrop-blur-sm z-[80]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 22, stiffness: 220 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] w-[90%] max-w-sm bg-cottage-cream rounded-3xl shadow-2xl p-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-serif text-2xl italic text-cottage-wood">Modo Curadoria</h3>
                  <p className="text-[10px] uppercase tracking-widest text-cottage-wood/50 mt-1">Acesso da Artesã</p>
                </div>
                <button
                  type="button"
                  onClick={() => !isLoggingIn && setIsLoginOpen(false)}
                  className="text-cottage-wood opacity-40 hover:opacity-100 transition-opacity"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={submitLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-cottage-sage">E-mail</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-transparent border-b border-wood-soft py-2 focus:border-cottage-rose transition-colors outline-none text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-cottage-sage">Senha</label>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-transparent border-b border-wood-soft py-2 focus:border-cottage-rose transition-colors outline-none text-sm"
                  />
                </div>

                {loginError && (
                  <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn || !loginPassword}
                  className="w-full bg-cottage-rose text-white py-3 rounded-full text-[11px] uppercase tracking-widest font-bold shadow-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoggingIn ? <><Loader2 className="animate-spin" size={14} /> Entrando...</> : 'Entrar no Ateliê'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add/Edit Item Slide-over Form */}
      <AnimatePresence>
        {isFormOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="fixed inset-0 bg-cottage-wood/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-cottage-cream shadow-2xl z-[70] p-10 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-12">
                <h3 className="font-serif text-3xl italic">
                  {editingId ? 'Editar Peça Afetiva' : 'Curadoria Especial'}
                </h3>
                <button onClick={() => setIsFormOpen(false)} className="text-cottage-wood opacity-40 hover:opacity-100 transition-opacity">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-8">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-cottage-sage">Título da Peça</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Manta Aconchego"
                    className="w-full bg-transparent border-b border-wood-soft py-2 focus:border-cottage-rose transition-colors outline-none font-serif text-xl"
                    value={newItem.title || ''}
                    onChange={e => setNewItem({...newItem, title: e.target.value})}
                  />
                </div>

                {/* Multiple Image Upload */}
                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-cottage-sage block">
                    Fotos ({newItem.images?.length || 0}/10)
                  </label>
                  
                  <div className="grid grid-cols-5 gap-3">
                    {(newItem.images || []).map((url) => (
                      <div key={url} className="relative aspect-square rounded-lg overflow-hidden group shadow-sm">
                        <img src={url} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => removeUploadedImage(url)}
                          className="absolute inset-0 bg-red-500/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    
                    {(newItem.images?.length || 0) < 10 && (
                      <label className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 cursor-pointer group
                        ${isUploading 
                          ? 'border-cottage-rose bg-cottage-rose/5 opacity-50 pointer-events-none' 
                          : 'border-wood-soft text-cottage-wood/40 hover:border-cottage-rose hover:bg-cottage-rose/[0.02] hover:text-cottage-rose'}`}>
                        <div className={`p-3 rounded-full mb-1 transition-transform duration-500 ${isUploading ? 'bg-cottage-rose/10' : 'bg-cottage-wood/5 group-hover:scale-110 group-hover:bg-cottage-rose/10'}`}>
                          {isUploading ? <Loader2 className="animate-spin text-cottage-rose" size={20} /> : <Camera size={20} />}
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-center px-1">
                          {isUploading ? '...' : 'Upload'}
                        </span>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
                      </label>
                    )}
                  </div>

                  <div className="flex gap-2 items-center">
                    <input 
                      type="url" 
                      id="image-url-input"
                      placeholder="Ou cole o link https:// da imagem..."
                      className="flex-1 bg-transparent border-b border-wood-soft py-2 focus:border-cottage-rose transition-colors outline-none text-xs italic"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.currentTarget as HTMLInputElement).value.trim();
                          if (addImageUrl(val)) {
                            (e.currentTarget as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('image-url-input') as HTMLInputElement;
                        const val = input.value.trim();
                        if (addImageUrl(val)) {
                          input.value = '';
                        }
                      }}
                      className="px-4 py-2 text-[8px] uppercase font-bold tracking-widest border border-cottage-wood/20 rounded-lg hover:bg-cottage-wood/5 transition-all"
                    >
                      OK
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-cottage-sage">Categoria</label>
                    <select
                      className="w-full bg-transparent border-b border-wood-soft py-2 text-sm outline-none cursor-pointer"
                      value={newItem.category}
                      onChange={e => setNewItem({...newItem, category: e.target.value})}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-cottage-sage">Status</label>
                    <select
                      className="w-full bg-transparent border-b border-wood-soft py-2 text-sm outline-none cursor-pointer"
                      value={newItem.availability}
                      onChange={e => setNewItem({...newItem, availability: e.target.value as any})}
                    >
                      <option value="Pronta Entrega">Pronta Entrega</option>
                      <option value="Sob Encomenda">Sob Encomenda</option>
                      <option value="Vendido">Vendido</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-cottage-sage">Preço (R$)</label>
                  <input 
                    type="text" 
                    placeholder="Opcional..."
                    className="w-full bg-transparent border-b border-wood-soft py-2 focus:border-cottage-rose transition-colors outline-none text-sm"
                    value={newItem.price || ''}
                    onChange={e => setNewItem({...newItem, price: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-cottage-sage">História da Peça</label>
                  <textarea 
                    rows={3}
                    placeholder="Descrição afetiva e materiais..."
                    className="w-full bg-transparent border-b border-wood-soft py-2 focus:border-cottage-rose transition-colors outline-none text-sm resize-none"
                    value={newItem.desc || ''}
                    onChange={e => setNewItem({...newItem, desc: e.target.value})}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isUploading || !newItem.title || (newItem.images?.length || 0) === 0}
                  className="w-full bg-cottage-rose text-white py-4 rounded-full text-[11px] uppercase tracking-widest font-bold shadow-lg hover:brightness-110 transition-all pt-10 mt-10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Finalizando Upload...' : (editingId ? 'Salvar Alterações' : 'Registrar Nova Criação')}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Categories Management Modal */}
      <AnimatePresence>
        {isCategoriesOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategoriesOpen(false)}
              className="fixed inset-0 bg-cottage-wood/40 backdrop-blur-sm z-[80]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 22, stiffness: 220 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] w-[90%] max-w-md bg-cottage-cream rounded-3xl shadow-2xl p-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-serif text-2xl italic text-cottage-wood">Gerenciar Categorias</h3>
                  <p className="text-[10px] uppercase tracking-widest text-cottage-wood/50 mt-1">Organize suas coleções</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCategoriesOpen(false)}
                  className="text-cottage-wood opacity-40 hover:opacity-100 transition-opacity"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Add New Category */}
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-cottage-sage">Nova Categoria</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCategory();
                        }
                      }}
                      placeholder="Ex: Decoração Infantil"
                      className="flex-1 bg-transparent border-b border-wood-soft py-2 focus:border-cottage-sage transition-colors outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={addCategory}
                      className="px-4 py-2 bg-cottage-sage text-white rounded-lg text-[10px] uppercase font-bold tracking-widest hover:brightness-110 transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Categories List */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-cottage-sage">Categorias Existentes</label>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {categories.map((category) => (
                      <div
                        key={category}
                        className="flex items-center justify-between bg-cottage-wood/5 rounded-lg px-4 py-3 group hover:bg-cottage-wood/10 transition-colors"
                      >
                        <span className="text-sm text-cottage-wood">{category}</span>
                        <button
                          type="button"
                          onClick={() => removeCategory(category)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                          title="Excluir categoria"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCategoriesOpen(false)}
                  className="w-full bg-cottage-rose text-white py-3 rounded-full text-[11px] uppercase tracking-widest font-bold shadow-lg hover:brightness-110 transition-all"
                >
                  Concluído
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Social Links Management Modal */}
      <AnimatePresence>
        {isSocialLinksOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSocialLinksOpen(false)}
              className="fixed inset-0 bg-cottage-wood/40 backdrop-blur-sm z-[80]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 22, stiffness: 220 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] w-[90%] max-w-md bg-cottage-cream rounded-3xl shadow-2xl p-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-serif text-2xl italic text-cottage-wood">Redes Sociais</h3>
                  <p className="text-[10px] uppercase tracking-widest text-cottage-wood/50 mt-1">Configure os links</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSocialLinksOpen(false)}
                  className="text-cottage-wood opacity-40 hover:opacity-100 transition-opacity"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-cottage-sage flex items-center gap-2">
                    <Instagram size={14} /> Instagram
                  </label>
                  <input
                    type="url"
                    value={tempInstagram}
                    onChange={(e) => setTempInstagram(e.target.value)}
                    placeholder="https://instagram.com/seu_perfil"
                    className="w-full bg-transparent border-b border-wood-soft py-2 focus:border-cottage-sage transition-colors outline-none text-sm"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-cottage-sage flex items-center gap-2">
                    <Facebook size={14} /> Facebook
                  </label>
                  <input
                    type="url"
                    value={tempFacebook}
                    onChange={(e) => setTempFacebook(e.target.value)}
                    placeholder="https://facebook.com/sua_pagina"
                    className="w-full bg-transparent border-b border-wood-soft py-2 focus:border-cottage-sage transition-colors outline-none text-sm"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-cottage-sage flex items-center gap-2">
                    <MessageCircle size={14} /> WhatsApp
                  </label>
                  <input
                    type="url"
                    value={tempWhatsapp}
                    onChange={(e) => setTempWhatsapp(e.target.value)}
                    placeholder="https://wa.me/5511999999999"
                    className="w-full bg-transparent border-b border-wood-soft py-2 focus:border-cottage-sage transition-colors outline-none text-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={saveSocialLinks}
                  className="w-full bg-cottage-sage text-white py-3 rounded-full text-[11px] uppercase tracking-widest font-bold shadow-lg hover:brightness-110 transition-all"
                >
                  Salvar Links
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <footer className="py-12 px-6 border-t border-cottage-wood/10 text-center text-cottage-wood/80 text-xs tracking-widest uppercase">
        <p>© 2026 Anja Mila Ateliê. Feito à mão, com paciência e amor.</p>
        <p className="mt-2 italic normal-case tracking-normal text-sm text-cottage-rose">Transformando carinho em arte.</p>
      </footer>
    </div>
  );
}
