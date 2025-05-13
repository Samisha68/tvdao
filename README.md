# TV DAO: Decentralized Television for the Modern Age

Welcome to TV DAO, a next-generation platform reimagining video content distribution and monetization through the power of decentralization, built with Next.js, Solana, and MongoDB.

## 🚀 Concept

TV DAO aims to empower video content creators and engage viewers in a transparent, community-driven ecosystem. Creators can launch their channels, set their own terms, and directly connect with their audience. Viewers can discover unique content, participate in channel governance through voting, and support their favorite creators. By leveraging blockchain technology, we aim to create a fairer and more direct model for video content.

## ✨ Core Features

### For Viewers:
*   **Discover & Watch:** Browse a diverse range of channels across various categories.
*   **Channel Voting:** Participate in a decentralized voting mechanism to influence channel popularity and potentially content direction (future).
*   **Direct Creator Support:** (Future) Support creators directly through mechanisms like pay-to-watch or subscriptions using Solana.
*   **Solana Wallet Integration:** Seamlessly connect your Solana wallet for on-chain interactions.

### For Creators:
*   **Launch Your Channel:** Easily create and manage your video content channels.
*   **Set Your Price:** Define your broadcaster price and (future) monetization models.
*   **Creator Dashboard:** Track your channel's performance (mock data currently, real data with smart contract integration).
*   **Community Engagement:** Build a direct relationship with your audience.

### Decentralized Aspects:
*   **On-Chain Identity (Future):** Leverage Solana for user identity and creator verification.
*   **Transparent Voting:** Channel upvotes/downvotes are recorded and tallied via backend logic, with potential for future on-chain voting.
*   **Decentralized Monetization (Future):** Payments and revenue sharing could be handled via smart contracts on Solana.

## 🛠️ Tech Stack

*   **Frontend:** Next.js (React Framework) with TypeScript
*   **Styling:** Tailwind CSS with Framer Motion for animations
*   **Blockchain Integration:** Solana (`@solana/web3.js`, `@solana/wallet-adapter`)
*   **Backend API:** Next.js API Routes
*   **Database:** MongoDB (with Mongoose ODM)
*   **State Management:** React Hooks (useState, useEffect, useCallback)
*   **Environment Management:** `dotenv`

## 📂 Project Structure

The project is a monolithic Next.js application, with backend API logic and frontend components co-located for streamlined development.

```
tv-dao/
├── public/             # Static assets (images, fonts, etc.)
├── src/
│   ├── app/            # Next.js App Router
│   │   ├── (pages)/    # Route groups for main pages (channels, dashboard, signin, etc.)
│   │   │   └── page.tsx
│   │   ├── api/        # Backend API routes
│   │   │   ├── channels/
│   │   │   │   ├── [id]/route.ts
│   │   │   │   └── route.ts
│   │   │   ├── users/route.ts
│   │   │   └── votes/route.ts
│   │   ├── WalletProvider.tsx # Solana wallet context
│   │   ├── globals.css # Global styles
│   │   └── layout.tsx  # Root layout
│   ├── components/     # Reusable React components
│   └── lib/
│       └── db/         # Database connection (connect.ts) and Mongoose models (models.ts)
├── .env.local.example  # Example environment variables
├── .gitignore
├── next.config.ts      # Next.js configuration
├── package.json
├── postcss.config.mjs
├── README.md           # This file
└── tsconfig.json       # TypeScript configuration
```

## 🚀 Getting Started

Follow these instructions to set up and run the TV DAO project locally.

### Prerequisites
*   Node.js (v18.x or later recommended)
*   npm (v9.x or later) or yarn
*   MongoDB instance (local or cloud-hosted like MongoDB Atlas)
*   A Solana wallet browser extension (e.g., Phantom, Solflare) for frontend interaction.

### Environment Setup

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/Samisha68/tvdao.git
    cd tvdao
    ```

2.  **Create Environment File:**
    Duplicate the `.env.local.example` file (if it exists, otherwise create a new one) and rename it to `.env.local`. Populate it with your specific configuration:

    ```env
    # MongoDB
    MONGODB_URI=your_mongodb_connection_string # e.g., mongodb://localhost:27017/tv_dao_db or Atlas string
    
    # JWT (Not yet fully implemented, but good to have)
    JWT_SECRET=your_strong_jwt_secret
    
    # Solana (currently defaults to devnet in wallet adapter if not specified elsewhere)
    # RPC_URL=https://api.devnet.solana.com 
    
    # Next.js public variables (if needed by client-side code, prefix with NEXT_PUBLIC_)
    # NEXT_PUBLIC_SOME_VAR=some_value
    ```
    *   Ensure your `MONGODB_URI` points to a unique database name (e.g., `tv_dao_db`).

### Installation & Running

1.  **Install Dependencies:**
    Open your terminal in the project root (`tv-dao/`) and run:
    ```bash
    npm install
    ```
    *(If you prefer yarn, use `yarn install`)*

2.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    This will start the Next.js development server, typically on `http://localhost:3000`.

3.  **Open in Browser:**
    Navigate to `http://localhost:3000` in your web browser.

## 📜 Available Scripts

In the project directory, you can run the following scripts:

*   `npm run dev`: Starts the application in development mode.
*   `npm run build`: Creates an optimized production build of the application.
*   `npm start`: Starts the application in production mode (requires a build first).
*   `npm run lint`: Lints the codebase using Next.js's built-in ESLint configuration.

## 💡 Future Vision

The TV DAO project is just getting started! Future enhancements could include:
*   **Full Smart Contract Integration:** For on-chain channel creation, voting, and payments.
*   **Advanced Creator Tools:** Analytics, content scheduling, and community management features.
*   **Tokenomics:** Introducing a DAO token for governance and platform incentives.
*   **Live Streaming Capabilities:** Integrating real-time video streaming.
*   **Enhanced User Profiles:** Customizable profiles for viewers and creators.
*   **NFT Integration:** For exclusive content, channel memberships, or collectibles.

---

We're excited about the potential of TV DAO to revolutionize how video content is shared and consumed! 