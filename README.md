# Memest Cutest Project (MCP)
_A gamified, cross app based Model Context Protocol platform_

![Logo](https://github.com/derek2403/memest-cutest-platform/blob/main/public/logo.png?raw=true)

We’re building a **unified platform** that brings together your favorite Web3 and Web2 services—like **MetaMask, Uniswap, 1inch, Gmail, Google Sheets**, and more into **one** convenient, visually orchestrated workflow. No more juggling tabs or manually connecting wallets every time!

We’ve deployed a **live demonstration of MCP** at [**(Link Coming Soon)**](#).

---

## Inspiration: How We Came Up with This Idea 💡
We noticed how **inconvenient** it is to manage multiple wallet connections whether MetaMask, 1inch, or Uniswap—because each service forces you to visit its own site and manually connect your wallet. The same fragmentation appears in Web2 tools like Gmail or Microsoft Excel, which offer no straightforward way to communicate with each other. It leads to a constant juggling act of logins and disjointed experiences. Even worse, there’s no easy way to bridge these Web2 and Web3 worlds together, leading to fragmented experiences, extra logins, and lots of frustration.

> *“What if we had a single platform that connected all these services into building blocks, letting users assemble custom workflows in one place?”*

Thus, **Memest Cutest Project (MCP)** was born, a unified space where all your services coexist in one interface, powered by simple drag-and-drop building blocks and AI-driven orchestration for seamless cross-service tasks. We also gamified the visual process, so users can truly see and understand every interaction happening within the MCP—making cross-service integration as transparent and engaging as possible.




## The Problem🚧

1. **Fragmented Wallet Connections:** Each web3 service like MetaMask, 1inch, Uniswap and many more forces you to connect your wallet separately, creating a repetitive and disjointed user experience.

2. **Multiple Platform Juggling:** Users constantly switch between various websites and applications (Web2 and Web3 alike), wasting time and effort on repeated logins and manual data transfers.

3. **Lack of Web2–Web3 Bridging:** Traditional Web2 tools (e.g., Gmail, Microsoft Excel) don’t talk directly to Web3 services, preventing streamlined, cross-platform workflows.

4. **Limited Automation:** Without a unified interface, automating tasks (like notifying yourself by email whenever funds arrive in your wallet) is cumbersome and requires technical skill or third-party hacks.

5. **Poor Visibility & Usability:** Managing multiple services and credentials in different tabs or windows makes it difficult to understand what’s happening at a glance or to trust that you haven’t missed any critical event.


---

## The Solution🔑



---

## How Our Project Works⚙️
This is done by


---

## System Architecture High-Level Overview🏗️

![Architecture]() 


---





## Tech Stack Overview🛠️



---

## Important Code Directories📂 




---
## How We Are Different🌟


---


## Future Implementations 🚀





---


## Team👥

- **Derek Liew Qi Jian**  
  - *Role*: Project Lead, AI & 
  - [LinkedIn](https://www.linkedin.com/in/derek2403/) | [Twitter](https://x.com/derek2403)

- **Phen Jing Yuan**  
  - *Role*: TEE & Frontend Integration  
  - [LinkedIn](https://www.linkedin.com/in/jing-yuan-phen-b42266295/) | [Twitter](https://x.com/ilovedahmo)
 
- **Marcus Tan Chi Yau**  
  - *Role*: Backend  
  - [LinkedIn](https://www.linkedin.com/in/marcus-tan-8846ba271/)

- **Tan Zhi Wei**  
  - *Role*: Frontend & UI/UX Design  
  - [LinkedIn](https://www.linkedin.com/in/tanzhiwei0328/)
 
- **Edwina Hon**  
  - *Role*: 
  - [LinkedIn](https://www.linkedin.com/in/edwina-hon-548189340/)
 
# 3D Room Visualization

A 3D interactive room visualization built with Next.js and Three.js.

## Preview

This application renders a 3D room with furniture and interactive elements. Users can explore the room using mouse controls.

## Requirements

- Node.js 14.x or higher
- npm 6.x or higher

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd mcp
```

2. Install dependencies:

```bash
npm install
```

## Running the Application

### Development Mode

```bash
npm run dev
```

This starts the application in development mode with hot-reloading at http://localhost:3000.

**Note:** Development mode may have performance issues with the 3D rendering.

### Development Mode with Turbopack (Faster)

For improved development performance, you can use Turbopack:

```bash
npx next dev --turbo
```

This uses Next.js's Turbopack bundler which offers faster refresh rates and improved development performance.

### Production Mode (Recommended for Better Performance)

For optimal performance, use the production build:

```bash
npm run build
npm run start
```

This creates an optimized production build and serves it at http://localhost:3000.

## Controls

- **Rotate view**: Click and drag with the left mouse button
- **Zoom**: Scroll up/down with the mouse wheel

## Performance Tips

If experiencing lag or performance issues:

1. Use the production build (`npm run build` followed by `npm run start`)
2. Close other resource-intensive applications
3. Use a modern browser with hardware acceleration enabled
4. Reduce the browser window size if needed

## Project Structure

- `/pages` - Next.js pages
- `/components` - Reusable React components
- `/gltf` - 3D models in GLTF format
- `/fbx` - 3D models in FBX format

## License

This project is licensed under the MIT License - see the LICENSE file for details.
