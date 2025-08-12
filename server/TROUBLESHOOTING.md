# Troubleshooting User Database Issues

## Problem: Users not being saved to database after login

### 1. Check Database Connection

Make sure your PostgreSQL database is running and accessible. Check your `.env` file:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/learnio_db"
```

### 2. Test Database Connection

Run the test script to verify database connectivity:

```bash
cd server
node test-db.js
```

### 3. Check Server Logs

Start the server and look for these log messages:

- ✅ Database connected successfully
- 🚀 Server running at http://localhost:5000
- 🔗 Health check: http://localhost:5000/health

### 4. Test Health Endpoint

Visit `http://localhost:5000/health` in your browser to verify the server is running.

### 5. Check CORS Configuration

Ensure your frontend URL matches the CORS origin in the server logs.

### 6. Verify Environment Variables

Make sure these are set in your `.env` file:

- `DATABASE_URL`
- `CLIENT_URL` (or it will default to http://localhost:3000)
- `NODE_ENV`

### 7. Check Prisma Schema

Ensure your database schema matches the Prisma schema:

```bash
cd server
npx prisma db push
npx prisma generate
```

### 8. Common Issues and Solutions

#### Issue: "Database connection failed"

- Check if PostgreSQL is running
- Verify database credentials in DATABASE_URL
- Ensure database exists

#### Issue: "Table 'user' doesn't exist"

- Run `npx prisma db push` to create tables
- Check if schema.prisma has the correct model names

#### Issue: CORS errors in browser console

- Verify CLIENT_URL in server .env
- Check browser console for CORS policy errors

#### Issue: "fetch failed" errors

- Ensure server is running on port 5000
- Check if the API endpoint `/api/auth/users` is accessible

### 9. Debug Steps

1. Check server console for error messages
2. Check browser console for network errors
3. Verify the NextAuth callback is being triggered
4. Test the backend API endpoint directly

### 10. Test API Endpoint

Test the user creation endpoint directly:

```bash
curl -X POST http://localhost:5000/api/auth/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","profile_picture":"https://example.com/avatar.jpg"}'
```

If you're still having issues, check the server logs for specific error messages and ensure all environment variables are properly configured.
