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
          # Create firebase-config.js in the repository root
          echo "const firebaseConfig = {
            apiKey: '${{ secrets.APIKEY }}',
            authDomain: '${{ secrets.AUTHDOMAIN }}',
            projectId: '${{ secrets.PROJECTID }}',
            storageBucket: '${{ secrets.STORAGEBUCKET }}',
            messagingSenderId: '${{ secrets.MESSAGINGSENDERID }}',
            appId: '${{ secrets.APPID }}',
            databaseURL: '${{ secrets.DATABASEURL }}'
          };" > firebase-config.js
      
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
