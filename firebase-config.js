name: Deploy to GitHub Pages

on:
  push:
    branches: [ "main" ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Create Firebase Config
        run: |
          mkdir -p scripts
          echo "const firebaseConfig = {
            apiKey: '${{ secrets.FIREBASE_API_KEY }}',
            authDomain: '${{ secrets.FIREBASE_AUTH_DOMAIN }}',
            projectId: '${{ secrets.FIREBASE_PROJECT_ID }}',
            storageBucket: '${{ secrets.FIREBASE_STORAGE_BUCKET }}',
            messagingSenderId: '${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}',
            appId: '${{ secrets.FIREBASE_APP_ID }}',
            databaseURL: '${{ secrets.FIREBASE_DATABASE_URL }}'
          };" > scripts/firebase-config.js
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
