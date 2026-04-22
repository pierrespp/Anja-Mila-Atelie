# 📋 Instruções - Mapa do Código Anja Mila Ateliê

## 🎯 Visão Geral do Projeto

**Tipo:** Single Page Application (SPA) - Site de portfólio/e-commerce artesanal  
**Stack:** React 19 + TypeScript + Vite + Firebase + Tailwind CSS 4  
**Tema:** Modern Cottagecore - Ateliê de artesanato premium feito à mão  
**Funcionalidades:** Galeria de produtos, autenticação, CRUD de itens, animações suaves

---

## 📁 Estrutura de Arquivos

```
Anja-Mila-Atelie-main/
├── src/
│   ├── App.tsx              # Componente principal (878 linhas)
│   ├── main.tsx             # Entry point React
│   ├── firebase.ts          # Configuração Firebase
│   └── index.css            # Estilos globais + tema Tailwind
├── firebase-applet-config.json  # Credenciais Firebase
├── package.json             # Dependências
├── vite.config.ts           # Configuração Vite
├── tsconfig.json            # Configuração TypeScript
└── index.html               # HTML base
```

---

## 🎨 Sistema de Design (Paleta Cottagecore)

### Cores Principais (definidas em `index.css`)
```css
--color-cottage-cream: #F1EAD7   /* Fundo principal - bege claro */
--color-cottage-rose: #D4A373    /* Destaque/CTA - rosa terroso */
--color-cottage-sage: #A3B18A    /* Secundário - verde sálvia */
--color-cottage-wood: #5E503F    /* Texto principal - marrom madeira */
--border-color-wood-soft: rgba(94, 80, 63, 0.15)  /* Bordas suaves */
```

### Tipografia
- **Serif:** Playfair Display (títulos, elegância)
- **Sans:** Montserrat (corpo, legibilidade)

### Filtro de Imagem
```css
.cottage-filter {
  filter: saturate(0.8) sepia(0.2) contrast(0.9);
}
```
Aplicado em todas as imagens para manter consistência visual vintage.

---

## 🔥 Firebase - Configuração e Estrutura

### Arquivo: `src/firebase.ts`

**Serviços Inicializados:**
- **Firestore Database:** `db` - Banco de dados principal
- **Storage:** `storage` - Armazenamento (não usado atualmente, imagens em Base64)
- **Authentication:** `auth` - Login com email/senha

**Teste de Conexão:**
Tenta buscar documento `test/connection` ao inicializar para validar conectividade.

### Estrutura Firestore

**Collection:** `collections`

**Documento (CollectionItem):**
```typescript
{
  id: string;                    // Auto-gerado pelo Firestore
  category: string;              // "Enxoval Delicado" | "Decor Baby" | "Acessórios Afetivos"
  title: string;                 // Nome da peça
  images: string[];              // Array de URLs ou Base64 (limite: 10 imagens)
  desc: string;                  // Descrição afetiva
  price?: string;                // Preço opcional (formato livre)
  availability: string;          // "Pronta Entrega" | "Sob Encomenda" | "Vendido"
  createdAt: Timestamp;          // Timestamp do Firestore
  updatedAt?: Timestamp;         // Timestamp de edição
}
```

**Query Padrão:**
```typescript
query(collection(db, 'collections'), orderBy('createdAt', 'desc'))
```
Ordena por data de criação (mais recentes primeiro).

---

## 🔐 Sistema de Autenticação

### Email Autorizado
```typescript
const OWNER_EMAIL = 'pierre.santos.p@gmail.com';
```
Apenas este email tem acesso ao **Modo Curadoria** (edição de conteúdo).

### Fluxo de Login
1. Usuário clica no botão FAB (Floating Action Button) com ícone de tesoura
2. Modal de login abre (`isLoginOpen = true`)
3. Formulário com email + senha
4. `signInWithEmailAndPassword(auth, email, password)`
5. `onAuthStateChanged` detecta login e ativa `isCuratorMode`
6. Persistência: `browserLocalPersistence` (mantém login após refresh)

### Estados de Autenticação
- `user`: User | null - Objeto do Firebase Auth
- `isCuratorMode`: boolean - Controla visibilidade de botões de edição
- `isLoginOpen`: boolean - Controla modal de login
- `isLoggingIn`: boolean - Loading durante autenticação

### Tratamento de Erros
Mensagens customizadas para códigos Firebase:
- `auth/invalid-email` → "E-mail inválido."
- `auth/user-not-found` → "Usuária não encontrada."
- `auth/wrong-password` → "Senha incorreta."
- `auth/too-many-requests` → "Muitas tentativas. Aguarde."
- `auth/network-request-failed` → "Sem conexão."

---

## 🖼️ Sistema de Upload de Imagens

### Estratégia Atual: Base64 Inline
**Por quê?** Evita complexidade de Storage + URLs públicas. Limite Firestore: ~1MB por documento.

### Processo de Upload (`handleFileUpload`)

1. **Limite:** Máximo 5 imagens por peça (para não exceder 1MB Firestore)
2. **Compressão:** `browser-image-compression`
   ```typescript
   {
     maxSizeMB: 0.1,           // 100KB por imagem
     maxWidthOrHeight: 1024,   // Redimensiona para 1024px
     useWebWorker: true        // Performance
   }
   ```
3. **Conversão:** FileReader → Base64 (`data:image/...`)
4. **Armazenamento:** Array `newItem.images`

### Upload por URL
Função `addImageUrl(raw: string)`:
- Valida URL completa
- Aceita apenas `https://` (segurança)
- Limite: 10 imagens por peça
- Adiciona diretamente ao array sem compressão

### Remoção de Imagem
`removeUploadedImage(url)` - Remove do array `newItem.images`

---

## 📝 CRUD de Itens (Modo Curadoria)

### CREATE - Adicionar Nova Peça
**Função:** `handleAddItem(e: FormEvent)`
```typescript
await addDoc(collection(db, 'collections'), {
  ...newItem,
  createdAt: serverTimestamp()
});
```

### READ - Listagem em Tempo Real
**Hook:** `useEffect` com `onSnapshot`
```typescript
const q = query(collection(db, 'collections'), orderBy('createdAt', 'desc'));
onSnapshot(q, (snapshot) => {
  const data = snapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
  setItems(data);
});
```
Atualiza automaticamente quando há mudanças no Firestore.

### UPDATE - Editar Peça Existente
**Função:** `openEdit(item)` → `handleAddItem` (com `editingId`)
```typescript
const itemRef = doc(db, 'collections', editingId);
await updateDoc(itemRef, {
  ...newItem,
  updatedAt: serverTimestamp()
});
```

### DELETE - Remover Peça
**Função:** `removeItem(id: string)`
```typescript
const confirmed = window.confirm("Você tem certeza?");
if (confirmed) {
  await deleteDoc(doc(db, 'collections', id));
}
```

---

## 🎭 Componentes e Seções do App.tsx

### 1. Navbar (Fixo, z-40)
- Logo: "Anja Mila Ateliê" (font-serif, italic)
- Menu Desktop: Coleções | A Artesã | Processo | Contato
- Menu Mobile: Hamburguer com AnimatePresence
- Barra de busca decorativa (não funcional)

### 2. Hero Section (Fullscreen)
- Imagem de fundo com overlay gradiente
- Título principal: "Onde o carinho ganha forma..."
- CTA: "Explorar Coleções" → scroll para #coleções
- Animação: `fadeIn` do Motion

### 3. Galeria de Coleções (#coleções)
**Grid:** `grid-cols-1 md:grid-cols-3`

**Card de Produto:**
- Imagem principal (aspect-ratio 4:5)
- Hover: escala 110%, overlay escuro, informações aparecem
- Badge de disponibilidade (top-left)
- Contador de fotos (bottom-right, se > 1)
- **Modo Curadoria:** Botões de editar (tesoura) e excluir (lixeira)

**Animações:**
- `AnimatePresence` com `mode="popLayout"`
- `layout` prop para transições suaves ao adicionar/remover

### 4. Sobre a Artesã (#a-artesã)
- Layout: Grid 2 colunas (imagem + texto)
- Imagem com blur decorativo (rosa)
- Citação em itálico
- Animação: slide da esquerda

### 5. Processo (#processo)
**3 Cards:**
1. **A Escolha** (Scissors) - Seleção de tecidos
2. **O Alinhavo** (Heart) - Costura artesanal
3. **O Toque Final** (Package) - Embalagem

Animação: `staggerContainer` (delay 0.2s entre cards)

### 6. CTA/Contato (#contato)
- Fundo escuro (`bg-cottage-wood`)
- Título: "Vamos criar algo especial?"
- Botão WhatsApp (link placeholder: `wa.me/5500000000000`)
- Ícones decorativos em background (Instagram, Heart)

### 7. Footer
- Copyright 2026
- Texto: "Feito à mão, com paciência e amor."

---

## 🎨 Modais e Overlays

### Modal de Login (z-[80-90])
**Trigger:** Botão FAB (tesoura) quando não logado

**Estrutura:**
- Backdrop blur (`bg-cottage-wood/40`)
- Card centralizado (max-w-sm)
- Form: email + password
- Botão submit com loading spinner
- Mensagem de erro (se houver)

**Animações:**
- Backdrop: fade in/out
- Card: scale + translate (spring animation)

### Slide-over Form (z-[60-70])
**Trigger:** 
- Botão "Adicionar Nova Inspiração" (criar)
- Botão de editar no card (editar)

**Campos:**
1. **Título** (text, required)
2. **Fotos** (upload múltiplo + URL manual)
   - Grid 5 colunas
   - Preview com botão de remover (X no hover)
   - Input file oculto + label customizado
   - Input URL com botão "OK"
3. **Categoria** (select)
   - Enxoval Delicado
   - Decor Baby
   - Acessórios Afetivos
4. **Status** (select)
   - Pronta Entrega
   - Sob Encomenda
   - Vendido
5. **Preço** (text, opcional)
6. **História da Peça** (textarea)

**Botão Submit:**
- Texto dinâmico: "Registrar Nova Criação" | "Salvar Alterações"
- Disabled se: `isUploading` ou sem título ou sem imagens

**Animações:**
- Slide da direita (x: 100% → 0)
- Spring transition (damping: 25, stiffness: 200)

---

## 🎬 Sistema de Animações (Motion)

### Variantes Principais

**fadeIn:**
```typescript
{
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } 
  }
}
```

**staggerContainer:**
```typescript
{
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
}
```

### Padrão de Uso
```tsx
<motion.div 
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
  variants={fadeIn}
>
```

### Animações de Interação
- `whileHover={{ scale: 1.05 }}`
- `whileTap={{ scale: 0.95 }}`
- `layoutId` para transições compartilhadas

---

## 🔧 Configuração Vite

### Base Path
```typescript
base: command === 'build' ? '/Anja-Mila-Atelie/' : '/'
```
Para deploy no GitHub Pages.

### Server
- Host: `0.0.0.0` (acesso externo)
- Port: `5000`
- HMR: Ativo (pode ser desabilitado via env)

### Alias
```typescript
'@': path.resolve(__dirname, '.')
```

### Env Variables
- `GEMINI_API_KEY` (definido mas não usado no código atual)

---

## 📦 Dependências Principais

### Produção
- `react` + `react-dom` (v19)
- `firebase` (v12.12.1) - Backend completo
- `motion` (v12.23.24) - Animações (fork do Framer Motion)
- `lucide-react` (v0.546.0) - Ícones
- `browser-image-compression` (v2.0.2) - Compressão de imagens
- `@tailwindcss/vite` (v4.1.14) - Tailwind CSS 4
- `vite` (v6.2.0) - Build tool

### Dev
- `typescript` (v5.8.2)
- `@types/node` + `@types/express`
- `tsx` - TypeScript executor

---

## 🚀 Scripts Disponíveis

```bash
npm run dev      # Inicia dev server (porta 5000)
npm run build    # Build para produção
npm run preview  # Preview do build
npm run clean    # Remove pasta dist
npm run lint     # Type checking (tsc --noEmit)
```

---

## 🎯 Estados Globais (App.tsx)

### UI States
```typescript
isMenuOpen: boolean          // Menu mobile aberto
isCuratorMode: boolean       // Modo edição ativo
isFormOpen: boolean          // Slide-over form aberto
isUploading: boolean         // Upload em progresso
editingId: string | null     // ID do item sendo editado
```

### Auth States
```typescript
user: User | null            // Usuário Firebase
isLoginOpen: boolean         // Modal de login aberto
loginEmail: string           // Input email
loginPassword: string        // Input senha
loginError: string | null    // Mensagem de erro
isLoggingIn: boolean         // Loading login
```

### Data States
```typescript
items: CollectionItem[]      // Lista de produtos (sync Firestore)
newItem: Partial<CollectionItem>  // Form data (criar/editar)
```

---

## 🔍 Pontos de Atenção

### Segurança
- ✅ Credenciais Firebase expostas (normal para frontend)
- ✅ Regras Firestore devem estar configuradas no console
- ✅ Apenas HTTPS para URLs de imagens
- ⚠️ Email do owner hardcoded (considerar env variable)

### Performance
- ✅ Compressão de imagens (100KB cada)
- ✅ Lazy loading com `whileInView`
- ⚠️ Base64 aumenta tamanho do documento Firestore
- ⚠️ Sem paginação (pode ser lento com muitos itens)

### UX
- ✅ Animações suaves e consistentes
- ✅ Feedback visual (loading, errors)
- ✅ Confirmação antes de deletar
- ⚠️ WhatsApp link é placeholder (atualizar número real)
- ⚠️ Barra de busca é decorativa (não funcional)

### Acessibilidade
- ⚠️ Faltam `aria-labels` em botões de ícone
- ⚠️ Modal não trava foco (trap focus)
- ⚠️ Sem suporte a teclado em alguns componentes

---

## 🎨 Padrões de Código

### Nomenclatura
- **Componentes:** PascalCase
- **Funções:** camelCase
- **Constantes:** UPPER_SNAKE_CASE
- **CSS Classes:** kebab-case (Tailwind)

### Estrutura de Função
```typescript
const handleAction = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    // Firebase operation
  } catch (error) {
    console.error("Error:", error);
  }
};
```

### Tailwind Classes
- Ordem: layout → spacing → typography → colors → effects
- Breakpoints: `md:` (768px), `lg:` (1024px)
- Custom utilities: `cottage-filter`

---

## 🔄 Fluxos Principais

### Fluxo de Criação de Peça
1. Login como owner
2. Modo curadoria ativo
3. Clicar "Adicionar Nova Inspiração"
4. Preencher formulário
5. Upload de imagens (compressão automática)
6. Submit → `addDoc` → Firestore
7. `onSnapshot` atualiza lista automaticamente
8. Form fecha, estado reseta

### Fluxo de Edição
1. Clicar botão de tesoura no card
2. Form abre com dados preenchidos
3. `editingId` setado
4. Modificar campos
5. Submit → `updateDoc` → Firestore
6. Lista atualiza via `onSnapshot`

### Fluxo de Exclusão
1. Clicar botão de lixeira
2. `window.confirm` para confirmação
3. Se confirmado → `deleteDoc`
4. Lista atualiza automaticamente

---

## 📱 Responsividade

### Breakpoints
- **Mobile:** < 768px (menu hamburguer, grid 1 coluna)
- **Tablet:** 768px - 1024px (grid 3 colunas, menu desktop)
- **Desktop:** > 1024px (barra de busca visível)

### Ajustes por Tela
- Hero: `text-5xl md:text-7xl lg:text-8xl`
- Padding: `px-6` (mobile) → `px-12` (desktop)
- Grid: `grid-cols-1 md:grid-cols-3`

---

## 🎯 Próximas Melhorias Sugeridas

### Funcionalidades
- [ ] Implementar busca real (filtro por título/categoria)
- [ ] Paginação ou infinite scroll
- [ ] Galeria de imagens (lightbox ao clicar)
- [ ] Carrinho de compras
- [ ] Integração com API de pagamento
- [ ] Sistema de favoritos

### Técnicas
- [ ] Migrar imagens para Firebase Storage
- [ ] Adicionar testes (Vitest + Testing Library)
- [ ] PWA (Service Worker, offline)
- [ ] SEO (meta tags, sitemap)
- [ ] Analytics (Google Analytics 4)

### UX/UI
- [ ] Skeleton loading
- [ ] Toast notifications (substituir `alert`)
- [ ] Drag & drop para reordenar imagens
- [ ] Preview de imagem antes do upload
- [ ] Filtros de categoria na galeria

---

## 📞 Contatos e Links

### Configurações Importantes
- **Email Owner:** `pierre.santos.p@gmail.com`
- **WhatsApp:** `wa.me/5500000000000` (ATUALIZAR!)
- **Firebase Project:** `anja-mila-atelie`
- **Deploy Base:** `/Anja-Mila-Atelie/`

### Recursos Externos
- Fontes: Google Fonts (Playfair Display, Montserrat)
- Imagens Hero/Sobre: Unsplash (com `referrerPolicy="no-referrer"`)
- Ícones: Lucide React

---

## 🎓 Conceitos Aplicados

### React 19
- Hooks modernos (`useState`, `useEffect`)
- Strict Mode
- Controlled components

### TypeScript
- Interfaces (`CollectionItem`)
- Type safety em props e estados
- Generics em Firebase (`collection<T>`)

### Firebase
- Realtime listeners (`onSnapshot`)
- Server timestamps
- Authentication flow
- Firestore queries

### Tailwind CSS 4
- `@theme` directive
- Custom utilities
- Responsive design
- Dark mode ready (não implementado)

### Motion (Framer Motion)
- Declarative animations
- Layout animations
- AnimatePresence
- Gesture animations

---

**Última Atualização:** 2026-04-21  
**Versão do Documento:** 1.0  
**Autor:** Mapeamento automático via Claude Code
