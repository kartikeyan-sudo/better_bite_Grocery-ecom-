# Backend (Node + Express + Mongoose)

Install and run (PowerShell):

```powershell
cd "c:\Users\Kartikeyan Dubey\Desktop\ecomm part 2\backend"
npm install
# copy .env.example to .env and edit MONGO_URI if needed
npm run dev
```

The API exposes:
- `GET /api/health` — health check
- `GET /api/products` — sample products list

Connect the frontend by calling these endpoints or enable a proxy in the frontend dev server.
