# Production Deployment Guide

## Setup on EC2 with Nginx

### 1. Copy nginx configuration
```bash
sudo cp nginx.conf /etc/nginx/sites-available/momo
sudo ln -s /etc/nginx/sites-available/momo /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default config
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

### 2. Start Docker containers
```bash
docker-compose up -d
```

### 3. Verify services are running
```bash
# Check if backend is responding
curl http://localhost:3000/api/list-images

# Check if frontend is running
curl http://localhost:5173

# Check nginx status
sudo systemctl status nginx
```

### 4. Check logs if issues occur
```bash
# Nginx logs
sudo tail -f /var/log/nginx/momo_error.log

# Docker logs
docker-compose logs -f
```

## Environment Variables

Make sure these are set:
- `backend/.env`: AWS credentials and S3 bucket name
- `frontend/.env`: Should be set to `VITE_API_ENDPOINT=/api`

## SSL/HTTPS (Optional but recommended)

Install certbot for free SSL:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d momo.rishikesh.info.np -d www.momo.rishikesh.info.np
```

## Troubleshooting

### API not responding
1. Check if backend container is running: `docker ps`
2. Check backend logs: `docker-compose logs backend`
3. Test backend directly: `curl http://localhost:3000/api/list-images`

### CORS errors
- Nginx config includes CORS headers, but Flask also has CORS enabled
- Check both are allowing your domain

### 502 Bad Gateway
- Backend or frontend containers are not running
- Check with `docker-compose ps`
