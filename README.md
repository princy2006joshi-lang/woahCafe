# Woah Cafe

Woah Cafe is a student ordering and kitchen order-tracking app. The React client and Express API are separate and have separate dependency folders. MongoDB stores accounts, menu items, and orders. The app does not insert sample menu items or orders.

## Requirements

- Node.js 20.19 or newer
- A MongoDB database, either a local MongoDB server or a MongoDB Atlas connection string

## Configure and run

1. In MongoDB Atlas, create a database user and allow your current IP under **Network Access**. These are separate from your Atlas website login.
2. In the cluster, choose **Connect → Drivers → Node.js** and copy the URI. Replace the username and password placeholders and use `/woah_cafe` as the database path. URL-encode special characters in the database password.
3. Copy `server/.env.example` to `server/.env` and fill in `MONGODB_URI`. Set `JWT_SECRET` to a private random value. Generate one in PowerShell with:

   ```powershell
   [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
   ```

4. In Terminal 1, start the API from its own folder. Use this command, not `npx nodemon index.js`:

   ```powershell
   cd C:\Documents\Cafe\hostel-cafe\server
   npm install
   npm run dev
   ```

5. In Terminal 2, start the client from its own folder:

   ```powershell
   cd C:\Documents\Cafe\hostel-cafe\client
   npm install
   npm run dev
   ```

6. Open the Vite URL printed by the client, normally `http://localhost:5173`.

Check `http://localhost:5000/api/health`. It should say `"database":"connected"`. If it says `disconnected`, confirm `server/.env` exists, the Atlas database user/password are correct, and your IP is allowed in Atlas Network Access. MongoDB creates the database and collections automatically on the first real write.

To add the 30 quick-to-prepare starter menu items (five each for burgers, sandwiches, beverages, Maggi, rolls, and omelettes), run this once from the server folder:

```powershell
npm run seed:menu
```

The seed only inserts items that are not already present by name and category. Re-running it does not overwrite prices, descriptions, or availability changed by kitchen staff.

## Create the private kitchen login

There is no kitchen registration page. After connecting MongoDB, temporarily set `KITCHEN_EMAIL`, `KITCHEN_PASSWORD` (at least 12 characters), and optionally `KITCHEN_NAME` in `server/.env`. Then run:

```powershell
cd C:\Documents\Cafe\hostel-cafe\server
npm run create:kitchen
```

Remove `KITCHEN_PASSWORD` from `.env` after the account is created. The password is hashed before it is stored. Kitchen staff sign in at `/kitchen/login`.

The kitchen account is created only once; changing `KITCHEN_EMAIL` or `KITCHEN_PASSWORD` later does not change the stored account. The creation script will report an error if that email already exists. A `401` on sign-in means the submitted email/password does not match an account in the database currently used by the API.

## API outline

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/menu` (available items only; optional `category` filter)
- `POST /api/orders`, `GET /api/orders/my`, `GET /api/orders/:orderId`
- `GET /api/kitchen/payments/counter` (unpaid counter orders; kitchen role only)
- `PATCH /api/kitchen/orders/:orderId/payment` (record received counter payment; kitchen role only)
- `POST /api/orders` accepts `items: [{ menuItemId, quantity }]` and `paymentMethod: "counter"`; prices are read from MongoDB, never from the request.
- `GET /api/kitchen/orders?view=active|history`
- `PATCH /api/kitchen/orders/:orderId/status`
- `GET /api/kitchen/menu` (all menu items; kitchen role only)
- `POST /api/kitchen/menu` (kitchen role only)
- `PATCH /api/kitchen/menu/:id` (edit item fields or availability; kitchen role only)
- `DELETE /api/kitchen/menu/:id` (kitchen role only)

Authentication uses an HTTP-only cookie. Student order queries are scoped to the authenticated student on the server. Kitchen routes check the authenticated database role. Signed-in students can browse currently available items at `/menu`; kitchen staff can add, edit, remove, and toggle availability at `/kitchen/menu`. Menu items can include an optional HTTP(S) image URL. Removing a menu item does not delete historical orders or their saved item/price snapshots. Prices and totals are calculated by the API from available menu items at order time. Orders are never automatically deleted.

Students can add available menu items to `/cart`, adjust quantities, and place orders with pay-at-café checkout. Cart contents are saved in browser storage separately for each signed-in student and restored after a reload on that browser. The server recalculates prices and totals and rejects unavailable items; payment remains pending until kitchen staff record receipt at `/kitchen/payments`. Payment state is stored separately from preparation status. New orders move through `Queued → In Progress → Ready for Pickup → Completed`; kitchen staff can track and update active orders at `/kitchen/orders`, which refreshes every five seconds. Students can view their scoped order history at `/orders`; history and individual order tracking refresh automatically, with a ready-for-pickup alert when applicable. Online checkout is not available yet and is planned for Part 8.

Student registration is limited to addresses ending exactly in `@sst.scaler.com`; student accounts are also checked against this rule by the user model. Email ownership is not verified because no email delivery service is configured.

## Checks

```powershell
cd C:\Documents\Cafe\hostel-cafe\client
npm run build

cd C:\Documents\Cafe\hostel-cafe\server
npm test
```