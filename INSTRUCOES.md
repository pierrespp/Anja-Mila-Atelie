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
