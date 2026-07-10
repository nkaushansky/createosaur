# Createosaur Production Deployment Guide 🚀

This guide provides comprehensive instructions for deploying Createosaur to production environments with optimal performance, security, and scalability.

## 📋 Pre-Deployment Checklist

### Environment Preparation
- [ ] All API keys configured and tested
- [ ] Production environment variables set
- [ ] Build process tested locally
- [ ] Performance optimization complete
- [ ] Security review completed
- [ ] createosaur.com domain configured

### Testing
- [ ] All features tested with real AI providers
- [ ] Gallery system persistence verified
- [ ] Error handling validated
- [ ] Cross-browser compatibility checked
- [ ] Mobile responsiveness confirmed

## 🏗️ Deployment Options

### Option 1: Vercel (Recommended) ⭐

**Pros:** 
- Zero-config deployment
- Automatic SSL
- Global CDN
- Excellent React/Vite support
- Built-in analytics

**Steps:**
1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy from project root:
   ```bash
   vercel --prod
   ```

3. Configure environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add your API keys:
     ```
     VITE_HUGGINGFACE_API_KEY=hf_your_key_here
     VITE_OPENAI_API_KEY=sk-your_key_here
     VITE_STABILITY_API_KEY=sk-your_key_here
     ```

4. Set custom domain:
   - Project Settings → Domains
   - Add **createosaur.com**
   - Configure DNS records as instructed:
     ```
     CNAME: createosaur.com → cname.vercel-dns.com
     CNAME: www.createosaur.com → cname.vercel-dns.com
     ```

### Option 2: Netlify

**Pros:**
- Drag-and-drop deployment
- Form handling
- Split testing
- Good for static sites

**Steps:**
1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy options:
   - **Manual:** Drag `dist/` folder to [Netlify Drop](https://app.netlify.com/drop)
   - **Git Integration:** Connect GitHub repository for auto-deployment

3. Configure environment variables:
   - Site Settings → Environment Variables
   - Add your API keys

4. Configure redirects (create `dist/_redirects`):
   ```
   /*    /index.html   200
   ```

### Option 3: GitHub Pages

**Pros:**
- Free hosting
- GitHub integration
- Good for open source projects

**Steps:**
1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add deployment script to `package.json`:
   ```json
   {
     "scripts": {
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. Build and deploy:
   ```bash
   npm run build
   npm run deploy
   ```

4. Configure GitHub Pages:
   - Repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: gh-pages

**Note:** GitHub Pages doesn't support environment variables, so you'll need to handle API keys client-side only.

### Option 4: Traditional Web Hosting

**For shared hosting or VPS:**

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload contents of `dist/` folder to your web server

3. Configure web server:
   - **Apache:** Create `.htaccess` in web root:
     ```apache
     RewriteEngine On
     RewriteRule ^(?!.*\.).*$ /index.html [L]
     ```
   
   - **Nginx:** Add to server config:
     ```nginx
     location / {
       try_files $uri $uri/ /index.html;
     }
     ```

## ⚡ Performance Optimization

### Build Optimization
```bash
# Enable production optimizations
npm run build

# Analyze bundle size
npm install --save-dev vite-bundle-analyzer
```

### Vite Configuration Enhancements
Add to `vite.config.ts`:

```typescript
export default defineConfig({
  // ... existing config
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-tabs'],
          providers: ['./src/services/providers/index.ts']
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 600
  }
});
```

### CDN Configuration
For optimal global performance:

1. **Images:** Store generated creature images in cloud storage
2. **Assets:** Use CDN for static assets
3. **API Caching:** Implement response caching for repeated requests

## 🔒 Security Best Practices

### API Key Security
- ✅ **Client-side only:** API keys are stored in localStorage (appropriate for this architecture)
- ✅ **No server secrets:** All API calls are client-to-AI provider
- ✅ **User-controlled:** Users manage their own API keys

### Content Security Policy
Add to `index.html`:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  connect-src 'self' https://api-inference.huggingface.co https://api.openai.com https://api.stability.ai;
">
```

### Environment Variables
Never expose server-side secrets. Createosaur architecture uses client-side API keys which is appropriate for:
- Direct API communication
- User-controlled costs
- No server infrastructure requirements

## 📊 Monitoring & Analytics

### Error Tracking
Add error reporting service:
```bash
npm install @sentry/react
```

### Performance Monitoring
- Vercel Analytics (if using Vercel)
- Google Analytics for user insights
- Core Web Vitals monitoring

### API Usage Tracking
Monitor API costs and usage:
- OpenAI usage dashboard
- HuggingFace rate limits
- Stability AI credit consumption

## 🔄 CI/CD Pipeline

### GitHub Actions Example
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## 🎯 Post-Deployment Tasks

### 1. Domain Configuration
- Configure custom domain
- Set up SSL certificate
- Configure DNS records

### 2. SEO Optimization
- Update meta tags in `index.html`
- Add structured data
- Configure sitemap

### 3. Performance Testing
- Test on multiple devices
- Verify AI provider functionality
- Check generation speeds

### 4. User Documentation
- Create user guide
- Setup help documentation
- Configure support channels

## 🚨 Troubleshooting Common Issues

### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### API Key Issues
- Verify keys have correct permissions
- Check rate limits and quotas
- Test with different providers

### Performance Issues
- Analyze bundle size
- Optimize images
- Enable compression

### CORS Issues
```javascript
// All providers are configured for browser requests
// No additional CORS configuration needed
```

## 📞 Support

For deployment issues:
1. Check the deployment platform docs
2. Verify environment variables
3. Test build locally first
4. Check browser console for errors

## 🔮 Future Scaling Considerations

### Backend Migration
When ready to scale:
- Add user authentication
- Implement cloud storage
- Add server-side API management
- Implement rate limiting

### Database Integration
For user accounts and cloud saves:
- PostgreSQL for structured data
- Redis for caching
- Object storage for images

---

**Createosaur is now ready for production at createosaur.com! 🦕⚡**

Choose your deployment method and follow the platform-specific steps above.