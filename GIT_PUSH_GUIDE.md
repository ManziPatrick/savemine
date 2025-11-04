# Git Push Instructions

## If you have a GitHub/GitLab repository:

1. **Add your remote repository**:
   ```bash
   git remote add origin https://github.com/yourusername/your-repo-name.git
   ```

2. **Push to repository**:
   ```bash
   git branch -M main
   git push -u origin main
   ```

## If you need to create a new repository:

1. **Create a new repository on GitHub/GitLab** (don't initialize with README)

2. **Add remote**:
   ```bash
   git remote add origin https://github.com/yourusername/your-repo-name.git
   ```

3. **Push**:
   ```bash
   git branch -M main
   git push -u origin main
   ```

## MongoDB Connection String

Your MongoDB Atlas connection is configured:
- Database: `jbforexonline`
- Cluster: `cluster0.uisjoiq.mongodb.net`
- ⚠️ Make sure to add `MONGODB_URI` to Vercel environment variables when deploying

## Next Steps After Push

1. Deploy backend to Vercel:
   ```bash
   cd backend
   vercel login
   vercel
   ```

2. Set environment variables in Vercel dashboard:
   - `MONGODB_URI`: mongodb+srv://munyeshuri:Munyeshuri1@cluster0.uisjoiq.mongodb.net/jbforexonline?retryWrites=true&w=majority
   - `JWT_SECRET`: (generate a secure secret)
   - `NODE_ENV`: production
   - `PORT`: 5000

3. Deploy frontend:
   ```bash
   cd frontend
   vercel
   ```

4. Set `VITE_API_URL` in frontend Vercel environment variables

