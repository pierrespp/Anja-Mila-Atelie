# 📋 Instruções para Claude Code

## ⚠️ REGRAS OBRIGATÓRIAS

1. **SEMPRE ler este arquivo ANTES de executar qualquer comando do usuário**
2. **SEMPRE perguntar ao usuário quando houver múltiplas opções ou falta de informação**
3. **NUNCA executar comandos sem confirmação quando houver dúvidas**
4. **Respostas CONCISAS - usar mínimo de palavras possível para economizar tokens**
5. **Evitar repetições e explicações longas**
6. **NUNCA fazer commit/push sem solicitação explícita do usuário**

---

# 🎨 Documentação Técnica - Anja Mila Ateliê

## 📦 Funcionalidades Implementadas

### 🔍 Sistema de Busca e Filtros
- **Busca por texto**: Campo de busca que filtra por título, descrição e categoria
- **Ordenação**: 4 opções (Mais Recentes, Nome A-Z, Menor Preço, Maior Preço)
- **Paginação**: 12 itens por página com navegação anterior/próxima
- **Loading skeleton**: Animação de carregamento ao buscar produtos

### 🎨 Interface e UX
- **Modo escuro**: Toggle sol/lua para alternar tema
- **Badge "Novo"**: Produtos com menos de 7 dias ganham badge animado
- **Lazy loading**: Imagens carregam sob demanda (`loading="lazy"`)
- **Compartilhar produto**: Botão WhatsApp em cada card

### 📱 Redes Sociais (Botões Flutuantes)
**Localização**: Canto inferior direito, fixos (z-50)

**3 Botões:**
1. **Instagram** - Gradiente roxo/rosa
2. **Facebook** - Azul
3. **WhatsApp** - Verde

**Comportamento:**
- **Modo Normal**: Clique abre link em nova aba
- **Modo Curadoria**: Clique abre modal de configuração

**Configuração (Modo Curadoria):**
- Modal com 3 campos de URL
- Validação: aceita apenas http/https
- Campos vazios permitidos
- Salva no Firestore: `settings/social-links`
- Documento: `{ instagram: string, facebook: string, whatsapp: string }`

### 🗂️ Gerenciamento de Categorias
**Localização**: Botão "Gerenciar Categorias" na seção de coleções (modo curadoria)

**Funcionalidades:**
- Adicionar novas categorias
- Remover categorias existentes (com confirmação)
- Persistência no Firestore: `settings/app-categories`
- Select dinâmico no formulário de produtos

### 🔐 Sistema de Autenticação
**Email autorizado**: `pierre.santos.p@gmail.com`
- Login com email/senha (Firebase Auth)
- Persistência local (browserLocalPersistence)
- Modo curadoria ativa automaticamente após login

### 📊 Estrutura Firestore

**Collections:**
```
collections/
  {id}/
    - category: string
    - title: string
    - images: string[] (Base64 ou URLs)
    - desc: string
    - price?: string
    - availability: "Pronta Entrega" | "Sob Encomenda" | "Vendido"
    - createdAt: Timestamp
    - updatedAt?: Timestamp

settings/
  app-categories/
    - categories: string[]
  
  social-links/
    - instagram: string
    - facebook: string
    - whatsapp: string
```

### 🎯 Estados Globais Principais

**Busca e Filtros:**
- `searchTerm`: string - Termo de busca
- `sortBy`: 'recent' | 'price-asc' | 'price-desc' | 'name'
- `currentPage`: number - Página atual
- `itemsPerPage`: 12 - Itens por página

**Redes Sociais:**
- `socialLinks`: { instagram, facebook, whatsapp }
- `isSocialLinksOpen`: boolean - Modal aberto
- `tempInstagram/Facebook/Whatsapp`: string - Inputs temporários

**Categorias:**
- `categories`: string[] - Lista de categorias
- `isCategoriesOpen`: boolean - Modal aberto
- `newCategoryName`: string - Input nova categoria

**UI:**
- `darkMode`: boolean - Tema escuro ativo
- `isLoading`: boolean - Carregando produtos

### 🔄 Funções Principais

**Busca e Ordenação:**
```typescript
filteredItems = items.filter(busca).sort(ordenação)
paginatedItems = filteredItems.slice(inicio, fim)
```

**Redes Sociais:**
```typescript
validateUrl(url: string): boolean // Valida http/https
saveSocialLinks(): Promise<void> // Salva no Firestore
handleSocialClick(platform): void // Abre link ou modal
```

**Categorias:**
```typescript
saveCategories(newCategories: string[]): Promise<void>
addCategory(): Promise<void>
removeCategory(category: string): Promise<void>
```

**Produtos:**
```typescript
shareProduct(item): void // Compartilha via WhatsApp
isNewItem(item): boolean // Verifica se tem < 7 dias
```

### 🎨 Classes CSS Customizadas

**Dark Mode:**
```css
.dark body { bg-cottage-wood text-cottage-cream }
.dark { inverte cores cottage-cream ↔ cottage-wood }
```

**Cores:**
- `cottage-cream`: #F1EAD7 (fundo claro)
- `cottage-rose`: #D4A373 (destaque)
- `cottage-sage`: #A3B18A (secundário)
- `cottage-wood`: #5E503F (texto escuro)

### 📱 Responsividade
- Mobile: < 768px (grid 1 coluna)
- Tablet: 768px - 1024px (grid 3 colunas)
- Desktop: > 1024px (todos recursos visíveis)

### ⚡ Performance
- Lazy loading de imagens
- Compressão de imagens (100KB, 1024px)
- Limite de 5 imagens por produto (Firestore < 1MB)
- Paginação para evitar renderizar todos itens

### 🔧 Melhorias Implementadas (Resumo)
1. ✅ Compartilhar produto (WhatsApp)
2. ✅ Busca por texto funcional
3. ✅ Ordenação (4 opções)
4. ✅ Paginação (12 itens/página)
5. ✅ Lazy loading de imagens
6. ✅ Badge "Novo" (< 7 dias)
7. ✅ Modo escuro
8. ✅ Loading skeleton
9. ✅ Botões redes sociais flutuantes (Instagram, Facebook, WhatsApp)
10. ✅ Configuração de links sociais (modo curadoria)

---

# 🧶 Manual de Publicação: Anja Mila Ateliê

Este guia explica como colocar seu site online manualmente se você baixou o código como ZIP.

## 🚀 Passo a Passo para Publicação

1. **Crie um repositório no GitHub**:
   - Vá em [github.com/new](https://github.com/new).
   - Nomeie como `site-anja-mila`.
   - Mantenha como Público e clique em **Create Repository**.

2. **Suba o código**:
   No seu terminal (dentro da pasta do projeto), rode estes comandos:
   ```bash
   git init
   git add .
   git commit -m "Primeira versão do site"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/site-anja-mila.git
   git push -u origin main
   ```
   *(Troque SEU_USUARIO pelo seu nome no GitHub).*

3. **Ative o Site**:
   - No GitHub, no seu repositório, vá em **Settings** > **Pages**.
   - Em **Build and deployment**, selecione **GitHub Actions**.
   - O GitHub detectará que é um projeto Vite/React e fará a mágica sozinho!

## 🔐 Lembrete Importante (Firebase)
Para o login e as fotos funcionarem no seu novo site:
1. Vá no [Console do Firebase](https://console.firebase.google.com/).
2. **Authentication** > **Settings** > **Authorized domains**.
3. Adicione `SEU_USUARIO.github.io`.

## 🛠️ Como rodar no seu computador
Se quiser editar algo no futuro:
1. Instale o Node.js.
2. Rode `npm install`.
3. Rode `npm run dev`.
