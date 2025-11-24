# Troubleshooting Guide

## 🚨 White Screen Issues

### 1. **Check if Application is Running**
- Open browser and go to: `http://localhost:3000`
- If port 3000 is busy, try: `http://localhost:3001`
- You should see the login screen

### 2. **Test Basic Functionality**
- Go to: `http://localhost:3000/test`
- Should show "Application is working! 🎉"

### 3. **Check Console for Errors**
- Open browser Developer Tools (F12)
- Look for any red error messages in Console tab
- Look for any red error messages in Network tab

### 4. **Common Issues & Solutions**

#### Issue: PowerShell `&&` Error
**Solution:** Use batch file instead
```bash
# Double-click start.bat
# OR run manually:
cd D:\CursorAI\e-Tutor
npm run dev
```

#### Issue: Port Already in Use
**Solution:** Kill existing process or use different port
```bash
# Kill process on port 3000
npx kill-port 3000
# Then restart
npm run dev
```

#### Issue: Database Connection
**Solution:** Check database is running
```bash
# Test database connection
npm run test-db
```

#### Issue: Missing Environment Variables
**Solution:** Create .env.local file
```bash
# Copy environment template
copy config\database.env .env.local
# Edit .env.local with your database credentials
```

### 5. **Step-by-Step Debugging**

1. **Start Application:**
   ```bash
   cd D:\CursorAI\e-Tutor
   npm run dev
   ```

2. **Check Terminal Output:**
   - Look for "Ready in X.Xs" message
   - Look for any error messages
   - Note the port number (3000 or 3001)

3. **Open Browser:**
   - Go to the URL shown in terminal
   - Check if page loads

4. **Test Pages:**
   - `/` - Login page
   - `/test` - Simple test page
   - `/register` - Registration page

### 6. **If Still Having Issues**

1. **Clear Browser Cache:**
   - Press Ctrl+Shift+R to hard refresh
   - Or clear browser cache completely

2. **Check Node.js Version:**
   ```bash
   node --version
   # Should be 18 or higher
   ```

3. **Reinstall Dependencies:**
   ```bash
   rm -rf node_modules
   rm package-lock.json
   npm install
   ```

4. **Check Database:**
   ```bash
   npm run test-db
   ```

## 🆘 Still Need Help?

If you're still having issues, please share:
1. What you see in the browser (screenshot)
2. Any error messages in the terminal
3. Any error messages in browser console
4. What happens when you go to `/test` page

