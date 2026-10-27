# Woah Cafe ☕

A campus café ordering website built to make ordering food and managing kitchen orders easier.

Students can browse the menu, place orders, choose how to pay, and track their food. Kitchen staff get a separate dashboard to manage menu items, process orders, and update preparation status.

**Demo video:** [Watch the Woah Cafe walkthrough on Google Drive](https://drive.google.com/drive/folders/1zWzmcAj1OI0KSdJ6fYzVOnLYl42DTCWk?usp=drive_link)

## ✨ Features

**For Students**
- Register and log in using an `@sst.scaler.com` email address.
- Browse food items, filter by category, and view prices and images.
- Add items to the cart and update quantities.
- Pay at the café counter or online through Razorpay.
- View personal order history and track order status.
- Receive an in-app alert when an order is ready for pickup.

**For Kitchen Staff**
- Access a protected kitchen dashboard.
- Add, edit, remove, and manage menu availability.
- View eligible incoming orders and relevant student contact details.
- Update preparation status from `Queued` to `Completed`.
- Record counter payments.

**Behind the Scenes**
- Prices and totals are calculated by the backend.
- Online payments are verified server-side.
- Payment status is separate from food preparation status.
- Student orders are restricted to their owners.
- Orders are stored in MongoDB and are not automatically deleted.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React + Vite | Frontend |
| Tailwind CSS | Styling |
| Node.js + Express | Backend API |
| MongoDB + Mongoose | Database |
| JWT + HttpOnly cookies | Authentication |
| Razorpay | Online payments |
| Vercel + Render | Frontend and backend hosting |

## 🚀 Run Locally

**Requirements:** Node.js 20.19 or newer and a MongoDB database.

**1. Configure the backend**

Copy `server/.env.example` to `server/.env` and configure your MongoDB connection string and a secure `JWT_SECRET`. Add Razorpay test keys if you want to test online payments.

**2. Start the backend**

```powershell
cd server
npm install
npm run dev
```

**3. Start the frontend**

Open a second terminal:

```powershell
cd client
npm install
npm run dev
```

**4. Open the app**

Visit `http://localhost:5173`.

Check `http://localhost:5000/api/health` to verify the backend and database connection.

## 🔐 Kitchen Account Setup

Kitchen staff cannot register publicly. To create the kitchen account, temporarily configure `KITCHEN_EMAIL` and `KITCHEN_PASSWORD` in `server/.env`, then run:

```powershell
cd server
npm run create:kitchen
```

Remove the temporary password from the environment file after creating the account.

Kitchen login is available at `/kitchen/login`.

## 🌐 Deployment

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

Configure the required environment variables on Render and set the correct Render backend URL in `client/vercel.json` before deploying.

## 🔒 Security Notes

- Student registration is restricted to the `@sst.scaler.com` domain, but email ownership is not verified.
- Kitchen routes require an authenticated kitchen account.
- Students can access only their own orders.
- Passwords are hashed, and authentication uses an HttpOnly cookie.
- Online payments are verified by the backend rather than trusted solely from the frontend.

## ✅ Run Checks

Build the frontend:

```powershell
cd client
npm run build
```

Run backend tests:

```powershell
cd server
npm test
```

---

Built with ☕ for a simpler campus café experience.
