# Memest Cutest Project 
_A gamified, cross app based Model Context Protocol platform_

![Logo](https://github.com/derek2403/memest-cutest-platform/blob/main/public/logo.png?raw=true)

We’re building a **unified platform** that brings together your favorite Web3 and Web2 services—like **MetaMask, Uniswap, 1inch, Gmail, Google Sheets**, and more into **one** convenient, visually orchestrated workflow. No more juggling tabs or manually connecting wallets every time!

We’ve deployed a **live demonstration of Memest Cutest Project** at [**(Link Coming Soon)**](#).

---

## Inspiration: How We Came Up with This Idea 💡
We noticed how **inconvenient** it is to manage multiple wallet connections whether MetaMask, 1inch, or Uniswap—because each service forces you to visit its own site and manually connect your wallet. The same fragmentation appears in Web2 tools like Gmail or Microsoft Excel, which offer no straightforward way to communicate with each other. It leads to a constant juggling act of logins and disjointed experiences. Even worse, there’s no easy way to bridge these Web2 and Web3 worlds together, leading to fragmented experiences, extra logins, and lots of frustration.

> *“What if we had a single platform that connected all these services into building blocks, letting users assemble custom workflows in one place?”*

Thus, **Memest Cutest Project** was born, a unified space where all your services coexist in one interface, powered by simple drag-and-drop building blocks and AI-driven orchestration for seamless cross-service tasks. We also gamified the visual process, so users can truly see and understand every interaction happening within the MCP making cross-service integration as transparent and engaging as possible.




## The Problem🚧

1. **Fragmented Wallet Connections:** Each web3 service like MetaMask, 1inch, Uniswap and many more forces you to connect your wallet separately, creating a repetitive and disjointed user experience.

2. **Multiple Platform Juggling:** Users constantly switch between various websites and applications (Web2 and Web3 alike), wasting time and effort on repeated logins and manual data transfers.

3. **Lack of Web2–Web3 Bridging:** Traditional Web2 tools (e.g., Gmail, Microsoft Excel) don’t talk directly to Web3 services, preventing streamlined, cross-platform workflows.

4. **Limited Automation:** Without a unified interface, automating tasks (like notifying yourself by email whenever funds arrive in your wallet) is cumbersome and requires technical skill or third-party hacks.

5. **Poor Visibility & Usability:** Managing multiple services and credentials in different tabs or windows makes it difficult to understand what’s happening at a glance or to trust that you haven’t missed any critical event.


---

## The Solution🔑

1. **Unified Web2–Web3 Integration:** Memest Cutest Project uses MCP to unite disparate platforms like MetaMask, 1inch, Polygon, Celo, Gmail, Spreadsheet into a single cohesive interface, eliminating the hassle of juggling multiple logins and websites.

2. **Drag-and-Drop Workflows:** With a simple visual interface powered by MCP, Memest Cutest Project lets users assemble cross-service automations using building blocks with no coding required with NLP or drag and drop workflows.

3. **AI-Driven Orchestration:** By harnessing MCP, Memest Cutest Project enables intelligent agents to seamlessly handle multi-step tasks across your connected services, reducing manual effort and errors.

4. **Gamified Visualization:** Memest Cutest Project transforms service interactions into an engaging, map-like view, so you can intuitively grasp how workflows progress and which services are talking to each other.

5. **Secure & Scalable Foundation:** Built on MCP standards, Memest Cutest Project provides a robust environment where anyone can host their own MCP server. Its modular, building-block architecture empowers developers and users alike to add new plugins and services, continuously expanding the ecosystem like building blocks


---

## How Our Project Works ⚙️

**Single-Platform Integration**  
Users begin by connecting their wallets (via RainbowKit) and linking Web2 services (e.g., Gmail) directly within our unified interface thus no more hopping across separate websites.

**Visual Service Blocks**  
We spawn a playful representation of each service once it’s added. For example:  
- **MetaMask** appears as a fox  
- **1inch** appears as a unicorn  
- **Polygon** is a purple crystal ball  
- **Celo** is a plant  
- **Google Sheets** appears as a paper spreadsheet  
- **Gmail** is shown as a laptop with Gmail open

**Drag-and-Drop Workflows**  
Inspired by Apple Shortcuts, users can simply drag, drop, and connect these service blocks. An AI agent automatically translates these connections into real actions behind the scenes. You can also define workflows via natural language—our agent will interpret phrases like “For each MetaMask fund transfer, notify me by Gmail and record it in Google Sheets.”

**AI Agent Execution**  
Once you’ve configured a workflow, our AI agent (a little robot in the interface) “walks” between the relevant service blocks to illustrate how your automation runs. In the background, MCP triggers event listeners (for instance, on MetaMask) and processes each command (like sending an email, logging data to a spreadsheet, or initiating a token swap).

---

### Example Workflows
- **For each fund transfer in MetaMask, notify me in Gmail and record the transaction in Google Sheets.**  
- **Upon receiving funds in MetaMask, automatically swap them to Arbitrum using 1inch.**  
- **Listen to a specific smart contract on any supported chain, and notify me by email whenever it emits an event.**

---

**Endless Possibilities**  
Our proof of concept currently includes MetaMask, 1inch, Polygon, Celo, Gmail, and Google Sheets—but any additional plugins can be added to expand the platform’s capabilities. Think of **Memest Cutest Project** as an “agent kit” with building blocks anyone can contribute to. Best of all, it can be **self-hosted**, giving you full control and privacy over your cross-service automations. Whether it’s purely Web2 integrations (like email and spreadsheets) or advanced cross-chain workflows, **MCP** supports it all as more services are added.



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
