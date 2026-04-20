# Deployment Guide

This guide covers deploying Mertle Bot to various platforms.

## Prerequisites

- Node.js 18+ installed
- Anthropic API key
- Git repository set up

## Environment Variables

Create a `.env.production` file (never commit this):

```bash
# Required: Anthropic API key
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Optional: DeepSeek API key (if adding DeepSeek provider)
DEEPSEEK_API_KEY=sk-your-deepseek-key-here

# Optional: Port (defaults to 3000)
PORT=3000

# Optional: Node environment
NODE_ENV=production
```

## Build Process

```bash
# Install dependencies
npm install

# Build for production
npm run build

# The build output will be in the `build` directory
```

## Deployment Platforms

### Vercel (Recommended)

Vercel provides zero-config deployment for SvelteKit applications.

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel dashboard:
   - `ANTHROPIC_API_KEY`: Your Anthropic API key

4. The app will be available at `https://your-project.vercel.app`

### Railway

Railway provides easy deployment with automatic HTTPS.

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Link your project:
   ```bash
   railway link
   ```

3. Deploy:
   ```bash
   railway up
   ```

4. Set environment variables in Railway dashboard

### Fly.io

Fly.io provides global edge deployment.

1. Install Fly CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Create app:
   ```bash
   fly launch
   ```

3. Set secrets:
   ```bash
   fly secrets set ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

4. Deploy:
   ```bash
   fly deploy
   ```

### Docker

1. Build Docker image:
   ```bash
   docker build -t mertle-bot .
   ```

2. Run container:
   ```bash
   docker run -p 3000:3000 \
     -e ANTHROPIC_API_KEY=sk-ant-your-key-here \
     mertle-bot
   ```

3. Dockerfile:
   ```dockerfile
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM node:20-alpine
   WORKDIR /app
   COPY --from=builder /app/build ./build
   COPY --from=builder /app/package*.json ./
   RUN npm ci --only=production
   EXPOSE 3000
   CMD ["node", "build/index.js"]
   ```

### Traditional VPS (Ubuntu/Debian)

1. SSH into your server
2. Install Node.js 20+:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. Clone repository:
   ```bash
   git clone https://github.com/josephg29/mertlebot.git
   cd mertlebot
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Set environment variables:
   ```bash
   export ANTHROPIC_API_KEY=sk-ant-your-key-here
   # Or add to ~/.bashrc for persistence
   ```

6. Build and run:
   ```bash
   npm run build
   npm start
   ```

7. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start npm --name "mertle-bot" -- start
   pm2 save
   pm2 startup
   ```

8. Set up Nginx reverse proxy:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

9. Set up SSL with Let's Encrypt:
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Domain Configuration

### Buying a Domain
1. Purchase a domain from:
   - Namecheap
   - Google Domains
   - Cloudflare Registrar
   - GoDaddy

2. Recommended domains:
   - mertlebot.com
   - mertle.ai
   - buildwithai.com
   - hardwarehelper.com

### DNS Configuration
1. Add A record pointing to your server IP
2. Add CNAME for www subdomain
3. Set up SSL certificate

## Monitoring

### Basic Health Checks
- Monitor port 3000 is responding
- Check disk space
- Monitor memory usage
- Set up uptime monitoring (UptimeRobot, Pingdom)

### Error Tracking
- Consider adding Sentry for error tracking
- Log API errors to a service (Logtail, Papertrail)
- Monitor rate limiting alerts

## Scaling Considerations

### Current Architecture
- Stateless application
- No database required
- Local file storage for config
- In-memory rate limiting

### Scaling Steps
1. **10-100 users/day**: Current setup is sufficient
2. **100-1000 users/day**: Add Redis for distributed rate limiting
3. **1000+ users/day**: Consider adding:
   - CDN for static assets
   - Load balancer
   - Multiple instances
   - Database for analytics

### Cost Estimates
- **Vercel**: Free tier (100GB bandwidth, unlimited deployments)
- **Railway**: ~$5/month for basic instance
- **Fly.io**: ~$2-5/month for basic instance
- **VPS**: $5-10/month (DigitalOcean, Linode)
- **Anthropic API**: Pay-per-use (~$0.01-0.10 per request)

## Security Checklist

- [ ] HTTPS enabled
- [ ] API key stored securely (not in client code)
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] Security headers set (CSP, HSTS)
- [ ] No sensitive data in logs
- [ ] Regular dependency updates
- [ ] Backup strategy for config files

## Troubleshooting

### Common Issues

1. **API key not working**
   - Check key format (should start with `sk-ant-`)
   - Verify key has sufficient credits
   - Check Anthropic dashboard for usage

2. **Build fails**
   - Clear node_modules and reinstall
   - Check Node.js version (18+ required)
   - Verify all files are committed

3. **App not starting**
   - Check port 3000 is available
   - Verify environment variables are set
   - Check logs for errors

4. **Rate limiting too strict**
   - Adjust `MAX_REQUESTS` in `src/hooks.server.js`
   - Consider user-based rate limiting

### Getting Help
- Check [GitHub Issues](https://github.com/josephg29/mertlebot/issues)
- Review deployment logs
- Test locally first
- Contact maintainers if needed