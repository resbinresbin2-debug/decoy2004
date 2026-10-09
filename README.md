# PhotoProof: Blockchain-Based Photo Ownership & Provenance

> **"Prove it’s yours."** — An immutable, decentralized copyright and proof-of-ownership protocol for digital photography powered by Ethereum Sepolia, IPFS (Pinata), and browser-computed perceptual hashing.

---

## 📌 Problem Statement

Digital photographs are vulnerable to unauthorized copying, cropping, and copyright theft across the internet. Traditional metadata (EXIF) can be easily stripped or modified. 

**PhotoProof** solves this by establishing an immutable, verifiable proof of existence and ownership on the **Ethereum Sepolia blockchain**:
1. **Cryptographic Fingerprint (SHA-256)**: Uniquely identifies image bytes client-side.
2. **Perceptual Hash (pHash)**: Computes a 64-bit DCT visual fingerprint in the browser that detects cropped, resized, or color-adjusted copies.
3. **Decentralized Storage (IPFS / Pinata)**: Preserves the actual high-resolution image off-chain; only the cryptographic hash and IPFS CID are stored on-chain.
4. **On-Chain Timestamping**: Ethereum block timestamps provide undeniable legal and technical proof of when a photo was registered.
5. **Decentralized Ownership Transfer**: Creators can permanently reassign ownership to another wallet address through smart contract execution.
6. **Downloadable Ownership Certificate**: Generates an official, print-ready PDF certificate of ownership with verification badges.

---

## 🛠️ Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 18 (Vite), Tailwind CSS, React Router v6 | Glassmorphism UI, Dark mode, Responsive |
| **Web3 Client** | `ethers.js` (v6) | MetaMask connection, network auto-switch to Sepolia |
| **Client Crypto** | Web Crypto API (SHA-256), HTML5 Canvas 2D DCT (pHash) | Fast, secure browser-based hashing |
| **Certificates** | `jspdf` | High-resolution official PDF certificate generator |
| **Backend** | Node.js, Express | REST API, rate-limiting, CORS, JWT sessions |
| **Database** | MongoDB (Mongoose) | Users, photo metadata, and transfer history |
| **Blockchain** | Solidity `^0.8.20`, Hardhat | Sepolia testnet smart contract, custom events |
| **Storage** | IPFS via Pinata API | Content-addressable decentralized image storage |
| **Auth** | Google OAuth 2.0 (Google Identity Services) + Email/Password | JWT session tokens, bcryptjs encryption |

---

## 📁 Repository Structure

```text
Assignment 2/
├── contracts/                  # Hardhat Smart Contracts
│   ├── contracts/
│   │   └── PhotoProof.sol      # Solidity Smart Contract
│   ├── scripts/
│   │   └── deploy.js           # Hardhat Sepolia deploy script
│   ├── test/
│   │   └── PhotoProof.test.js  # Smart contract unit tests
│   ├── hardhat.config.js       # Hardhat network & compiler configuration
│   ├── package.json
│   └── .env.example
├── server/                     # Node.js & Express REST Backend
│   ├── src/
│   │   ├── config/db.js        # MongoDB connection handler
│   │   ├── controllers/
│   │   │   ├── authController.js   # Email/password & Google OAuth
│   │   │   └── photoController.js  # IPFS, duplicates, pHash & metadata
│   │   ├── middleware/auth.js      # JWT authentication middleware
│   │   ├── models/
│   │   │   ├── User.js         # User Mongoose schema
│   │   │   └── Photo.js        # Photo & transfer history schema
│   │   ├── routes/
│   │   │   ├── authRoutes.js   # /api/auth endpoints
│   │   │   └── photoRoutes.js  # /api/photos endpoints
│   │   ├── services/
│   │   │   └── pinataService.js # Pinata IPFS pinning & dev fallback
│   │   └── server.js           # Express app entrypoint
│   ├── package.json
│   └── .env.example
├── client/                     # React Vite Frontend Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Responsive header & wallet indicator
│   │   │   ├── Footer.jsx          # Protocol footer with contract links
│   │   │   ├── ProtectedRoute.jsx  # Route guard for authenticated users
│   │   │   ├── CertificateModal.jsx# PDF preview & download trigger
│   │   │   └── TransferModal.jsx   # On-chain transfer dialog
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     # User session management
│   │   │   └── WalletContext.jsx   # MetaMask & ethers.js v6 provider
│   │   ├── contracts/
│   │   │   ├── PhotoProofABI.json  # Smart contract ABI
│   │   │   └── contractConfig.js   # Sepolia network parameters
│   │   ├── pages/
│   │   │   ├── Login.jsx           # Split-screen auth with Google button
│   │   │   ├── Dashboard.jsx       # Stats, network status & recent photos
│   │   │   ├── RegisterPhoto.jsx   # Drag-and-drop, hashing, MetaMask tx
│   │   │   ├── Gallery.jsx         # My Works grid & PDF certificate
│   │   │   ├── VerifyOwnership.jsx # Inspector (image or hash input)
│   │   │   ├── TransferOwnership.jsx # Dedicated transfer screen
│   │   │   └── Profile.jsx         # User & linked wallet details
│   │   ├── utils/
│   │   │   ├── api.js              # Axios instance with JWT interceptor
│   │   │   ├── cryptoUtils.js      # SHA-256 and formatting helpers
│   │   │   ├── pHash.js            # Perceptual hash algorithm (2D DCT)
│   │   │   └── pdfGenerator.js     # jsPDF certificate builder
│   │   ├── App.jsx                 # Routing configuration
│   │   ├── index.css               # Tailwind CSS & glassmorphism
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── .env.example
├── package.json                # Root monorepo workspace configuration
├── .env.example                # Unified environment variables template
└── README.md
```

---

## 🚀 Setup & Installation Guide

### Prerequisites
1. **Node.js**: v18 or higher (v24 tested)
2. **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or MongoDB Atlas URI
3. **MetaMask Extension**: Installed in your browser with Sepolia Testnet configured
4. **Sepolia ETH**: Obtain free testnet ETH from faucets:
   - [Google Cloud Web3 Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
   - [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
   - [Sepolia PoW Faucet](https://sepolia-faucet.pk910.de/)

---

### Step 1: Smart Contract Deployment (Ethereum Sepolia)

1. Open a terminal and navigate to `/contracts`:
   ```bash
   cd contracts
   npm install
   ```
2. Configure `contracts/.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in your Sepolia RPC and private key:
   ```env
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
   PRIVATE_KEY=your_metamask_private_key_without_0x
   ETHERSCAN_API_KEY=your_etherscan_api_key_optional
   ```
3. Run automated tests to verify contract logic:
   ```bash
   npm test
   ```
4. Deploy to Ethereum Sepolia:
   ```bash
   npm run deploy:sepolia
   ```
   *(Or for local testing: `npx hardhat node` in one terminal, then `npm run deploy:localhost`)*
5. The deploy script automatically writes the deployed contract address and ABI into `client/src/contracts/contractConfig.js` and `client/src/contracts/PhotoProofABI.json`.

---

### Step 2: Google OAuth 2.0 Credentials Setup

To enable **"Continue with Google"** on the login page:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `PhotoProof App`).
3. In the sidebar, navigate to **APIs & Services > OAuth consent screen**:
   - User Type: Select **External**, click **Create**.
   - App name: `PhotoProof`
   - User support email: Select your email.
   - Developer contact email: Enter your email.
   - Click **Save and Continue** through Scopes and Test Users.
4. In the sidebar, go to **Credentials > Create Credentials > OAuth client ID**:
   - Application type: Select **Web application**.
   - Name: `PhotoProof Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:5173`
     - `http://127.0.0.1:5173`
   - **Authorized redirect URIs**:
     - `http://localhost:5173`
     - `http://localhost:5173/login`
5. Click **Create**. Copy your **Client ID** and **Client Secret**.
6. Set these values in `server/.env` and `client/.env`:
   - `server/.env`:
     ```env
     GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=your_client_secret
     ```
   - `client/.env`:
     ```env
     VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
     ```

> **Note**: A built-in 1-click test creator button is also provided on the login page for effortless local testing if you don't have Google credentials ready.

---

### Step 3: IPFS Storage Setup (Pinata)

Photo files are pinned to IPFS so only the content identifier (CID) goes on the blockchain:

1. Sign up for a free account at [Pinata](https://pinata.cloud/).
2. In the Pinata dashboard, navigate to **API Keys** and click **New Key**.
3. Enable `pinFileToIPFS` and create the key.
4. Copy the **API Key**, **API Secret**, or **JWT** into `server/.env`:
   ```env
   PINATA_API_KEY=your_pinata_api_key
   PINATA_API_SECRET=your_pinata_api_secret
   # OR:
   PINATA_JWT=your_pinata_jwt_token
   PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs
   ```
> **Automatic Fallback**: If Pinata keys are left empty, the server automatically enters simulated local IPFS mode (`/uploads` preview) with deterministic `Qm...` mock CIDs so the application remains 100% functional out of the box!

---

### Step 4: Backend Server Setup

1. Open a terminal in `/server`:
   ```bash
   cd server
   npm install
   ```
2. Verify `server/.env` configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   MONGO_URI=mongodb://127.0.0.1:27017/photoproof
   JWT_SECRET=super_secret_jwt_photoproof_key_2026_xyz987
   ```
3. Start the backend server:
   ```bash
   npm run dev
   ```
   Server will be listening at `http://localhost:5000`. Test health at `http://localhost:5000/api/health`.

---

### Step 5: Frontend Client Setup

1. Open a terminal in `/client`:
   ```bash
   cd client
   npm install
   ```
2. Verify `client/.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_CONTRACT_ADDRESS=your_deployed_contract_address
   VITE_SEPOLIA_RPC=https://rpc.sepolia.org
   VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser.

---

## 💻 Pages & Features Walkthrough

### 1. Split-Screen Login & Registration (`/login`)
- **Branded Showcase**: Tagline *"Prove it's yours"*, protocol feature highlights, and ambient glassmorphism visuals.
- **Google Sign-In**: Powered by Google Identity Services.
- **Email & Password**: Client-side validation, password length checks, and a "Forgot Password" modal.
- **Session Protection**: Automatically redirects to `/dashboard` upon authentication and protects all internal routes.

### 2. Dashboard (`/dashboard`)
- Metric cards showing **Total Network Registrations**, **My Registered Works**, and **MetaMask Status**.
- Network detection: Live indicator displaying if MetaMask is connected to **Ethereum Sepolia**. If on another network, shows an animated prompt to switch in one click.
- Recent registrations feed with direct links to Sepolia Etherscan transactions and instant verification buttons.

### 3. Register Photo (`/register`)
- **Drag-and-Drop Upload**: Live preview with dimension and file size calculations.
- **Browser-Side Cryptographic Hashing**:
  - Computes **SHA-256** using the native Web Crypto API.
  - Computes 64-bit **Perceptual Hash (pHash)** using 32x32 DCT on HTML5 Canvas.
- **Duplicate & Near-Duplicate Detection**:
  - Checks if the exact SHA-256 hash already exists.
  - Computes **Hamming distance** against existing perceptual hashes to detect near-duplicates (>84% visual similarity), alerting you if another user registered a cropped or altered version!
- **MetaMask Transaction**:
  - Automatically requests confirmation of `registerPhoto(bytes32 photoHash, string ipfsCID)`.
  - Links directly to the Sepolia Etherscan transaction receipt.
  - Saves verified metadata in MongoDB.

### 4. My Gallery (`/gallery`)
- Card grid of all photos registered by your wallet/account.
- Shows Title, Creator, Block Timestamp, SHA-256 hash, and IPFS link.
- **Download Certificate (PDF)**: Uses `jspdf` to generate a high-resolution, print-ready Certificate of Ownership complete with gold verification seal, border ornamentation, and transaction details.
- **Quick Transfer**: Modal to transfer ownership to another wallet directly from the card.

### 5. Verify Ownership Inspector (`/verify`)
- Dual verification mode:
  1. Upload any image file (hash computed in browser without uploading raw bytes).
  2. Paste any SHA-256 hash.
- Queries both the MongoDB provenance registry and the **Ethereum Sepolia smart contract directly via RPC**.
- Displays a prominent **Green "Verified On-Chain"** badge with owner wallet address, block timestamp, and Etherscan link, or a **Red "Not Registered"** badge.
- If a visually similar photo is registered, warns the inspector with the similarity percentage.

### 6. Transfer Ownership (`/transfer`)
- Choose from your registered photos or enter any photo hash.
- Input recipient Ethereum wallet address (with checksum validation).
- Triggers on-chain `transferOwnership` contract call with confirmation.
- Updates metadata and provenance history in the database.

### 7. Profile (`/profile`)
- Google profile info (avatar, display name, email).
- Displays linked Ethereum wallet address.
- One-click button to synchronize and update your connected MetaMask wallet with your profile account.
- Sign out action.

---

## 📜 Smart Contract Reference (`PhotoProof.sol`)

```solidity
function registerPhoto(bytes32 photoHash, string calldata ipfsCID) external;
function verifyPhoto(bytes32 photoHash) external view returns (address owner, uint256 timestamp, string memory ipfsCID, bool isRegistered);
function transferOwnership(bytes32 photoHash, address newOwner) external;
function getPhoto(bytes32 photoHash) external view returns (bytes32, string memory, address, uint256, bool);
function getUserPhotos(address user) external view returns (bytes32[] memory);
function getTotalPhotos() external view returns (uint256);

event PhotoRegistered(bytes32 indexed photoHash, address indexed owner, string ipfsCID, uint256 timestamp);
event OwnershipTransferred(bytes32 indexed photoHash, address indexed previousOwner, address indexed newOwner, uint256 timestamp);
```

---

## 🛡️ Backend REST API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user with email & password | No |
| `POST` | `/api/auth/login` | Login with email & password | No |
| `POST` | `/api/auth/google` | Google OAuth token verification | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes (JWT) |
| `PUT` | `/api/auth/wallet` | Bind Ethereum address to user profile | Yes (JWT) |
| `POST` | `/api/photos/upload-ipfs` | Upload photo to Pinata IPFS | Yes (JWT) |
| `POST` | `/api/photos/check-duplicate` | Check SHA-256 and pHash duplicates | Yes (JWT) |
| `POST` | `/api/photos` | Save verified on-chain photo metadata | Yes (JWT) |
| `GET` | `/api/photos/mine` | List photos owned by user/wallet | Yes (JWT) |
| `GET` | `/api/photos/stats` | Retrieve platform and user statistics | Yes (JWT) |
| `GET` | `/api/photos/recent` | Retrieve latest public registrations | No |
| `GET` | `/api/photos/verify/:hash` | Verify photo existence by SHA-256 | No |
| `PUT` | `/api/photos/transfer` | Update ownership record post-transfer | Yes (JWT) |

---

## 🧪 Testing

### Smart Contract Tests
Run Hardhat Chai unit tests:
```bash
cd contracts
npm test
```
Tests cover:
- Successful registration and event emission
- Duplicate rejection (`Photo hash already registered`)
- Zero-hash and empty-CID validation
- Owner-only transfer execution
- Non-owner transfer rejection
- User photo list tracking

---

## 📄 License
MIT License. Free for personal, educational, and commercial use.
