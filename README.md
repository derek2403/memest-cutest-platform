# Memest Cutest Platform 
_A gamified, cross-app based Model Context Protocol platform running in a TEE_

![2289375F-C956-485C-AC6F-8FF9A0074BAE](https://github.com/user-attachments/assets/66de8c94-d973-4c4b-99bd-27f78bdb7286)

We’re building a **unified platform** that brings together your favorite Web3 and Web2 services—like **MetaMask, Uniswap, 1inch, Gmail, Google Sheets**, and more into **one** convenient, visually orchestrated workflow. No more juggling tabs or manually connecting wallets every time!

We’ve deployed a **live demonstration of Memest Cutest Platform** at [**(Link Coming Soon)**](#).

---

## Inspiration: How We Came Up with This Idea 💡
We noticed how **inconvenient** it is to manage multiple wallet connections whether MetaMask, 1inch, or Uniswap—because each service forces you to visit its own site and manually connect your wallet. The same fragmentation appears in Web2 tools like Gmail or Microsoft Excel, which offer no straightforward way to communicate with each other. It leads to a constant juggling act of logins and disjointed experiences. Even worse, there’s no easy way to bridge these Web2 and Web3 worlds together, leading to fragmented experiences, extra logins, and lots of frustration.

> *“What if we had a single platform that connected all these services into building blocks, letting users assemble custom workflows in one place?”*

Thus, **Memest Cutest Platform** was born, a unified space where all your services coexist in one interface, powered by simple drag-and-drop building blocks and AI-driven orchestration for seamless cross-service tasks. We also gamified the visual process, so users can truly see and understand every interaction happening within the MCP making cross-service integration as transparent and engaging as possible. However, as we developed our MPC, we quickly realized a significant challenge. To orchestrate services effectively, the AI needed access to data across multiple platforms. This created an inherent privacy risk as the AI could potentially see sensitive information from your MetaMask wallet, Gmail account, and other connected services. That is how we plan to add the TEE afterwards wrapping it in a tee



## The Problem🚧

1. **Fragmented Wallet Connections:** Each web3 service like MetaMask, 1inch, Uniswap and many more forces you to connect your wallet separately, creating a repetitive and disjointed user experience.

2. **Multiple Platform Juggling:** Users constantly switch between various websites and applications (Web2 and Web3 alike), wasting time and effort on repeated logins and manual data transfers.

3. **Lack of Web2–Web3 Bridging:** Traditional Web2 tools (e.g., Gmail, Microsoft Excel) don’t talk directly to Web3 services, preventing streamlined, cross-platform workflows.

4. **Limited Automation:** Without a unified interface, automating tasks (like notifying yourself by email whenever funds arrive in your wallet) is cumbersome and requires technical skill or third-party hacks.

5. **Poor Visibility & Usability:** Managing multiple services and credentials in different tabs or windows makes it difficult to understand what’s happening at a glance or to trust that you haven’t missed any critical event.

6. **Privacy Vulnerabilities:** Traditional Model Context Protocol implementations expose sensitive user data across services to the orchestrating AI—creating potential privacy risks as more personal accounts and wallets are connected to the system.


---

## The Solution🔑

1. **Unified Web2–Web3 Integration:** Memest Cutest Platform uses MCP to unite disparate platforms like MetaMask, 1inch, Polygon, Celo, Gmail, Spreadsheet into a single cohesive interface, eliminating the hassle of juggling multiple logins and websites.

2. **Drag-and-Drop Workflows:** With a simple visual interface powered by MCP, Memest Cutest Platform lets users assemble cross-service automations using building blocks with no coding required with NLP or drag and drop workflows.

3. **AI-Driven Orchestration:** By harnessing MCP, Memest Cutest Platform enables intelligent agents to seamlessly handle multi-step tasks across your connected services, reducing manual effort and errors.

4. **Gamified Visualization:** Memest Cutest Platform transforms service interactions into an engaging, map-like view, so you can intuitively grasp how workflows progress and which services are talking to each other.

5. **Secure & Scalable Foundation:** Built on MCP standards, Memest Cutest Platform provides a robust environment where anyone can host their own MCP server. Its modular, building-block architecture empowers developers and users alike to add new plugins and services, continuously expanding the ecosystem like building blocks.

6. **TEE-Protected Privacy:** Memest Cutest Platform wraps the entire MCP inside a Trusted Execution Environment (TEE), creating a hardware-level security barrier between users sensitive data and potential threats. This secure enclave ensures that even the user's workflows interact with multiple services, their private keys, credentials, and personal information remain encrypted and inaccessible even to the platform and ai agent operators. 


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

**TEE Attestation Verification**
Each time a step in the AI workflow is executed, a unique attestation hash is generated, providing cryptographic proof that the operation was securely performed inside the TEE. Users can easily view the verification hash for any executed step by simply clicking on it. To confirm the authenticity of the operation, users can copy the hash and paste it into the Phala Network attestation verifier. This straightforward verification process ensures that the action was carried out within the MCP inside the TEE, offering transparent security without sacrificing the user-friendly interface.

---

### Example Workflows
- **For each fund transfer in MetaMask, notify me in Gmail and record the transaction in Google Sheets.**  
- **Upon receiving funds in MetaMask, automatically swap them to Arbitrum using 1inch.**  
- **Listen to a specific smart contract on any supported chain, and notify me by email whenever it emits an event.**

---

**Endless Possibilities**  
Our proof of concept currently includes MetaMask, 1inch, Polygon, Celo, Gmail, and Google Sheets—but any additional plugins can be added to expand the platform’s capabilities. Think of **Memest Cutest Platform** as an “agent kit” with building blocks anyone can contribute to. Best of all, it can be **self-hosted**, giving you full control and privacy over your cross-service automations. Whether it’s purely Web2 integrations (like email and spreadsheets) or advanced cross-chain workflows, **MCP** supports it all as more services are added.



---

## System Architecture High-Level Overview🏗️

![Architecture](https://github.com/derek2403/TeeTee/blob/main/public/Architecture.png?raw=true) 

### 1. **User Interface** (Frontend)
   - **Role**: The user interacts with the system through the **Frontend** interface. This is where users specify their desired workflows using natural language.
   - **Interaction**: The user communicates with the frontend to define and visualize the workflow.

### 2. **AI Agent**
   - **Role**: Once the user specifies the workflow, the **AI Agent** interprets the input, generates the execution plan, and coordinates the interaction with services.
   - **Function**: The AI Agent helps solve the workflow by accessing various external services (e.g., Metamask, Gmail, Google Sheets, etc.) and executing the tasks defined in the workflow.

### 3. **Model Context Protocol (MCP) Environment**
   - **Role**: The **MCP** is the secure environment where the workflow is processed. It ensures that all operations are performed in a trusted and encrypted space provided by **Phala Network’s Trusted Execution Environment (TEE)**.
   - **Function**: The generated workflow is stored in the MCP, and all sensitive data processing happens within this secure environment. The TEE ensures that no unauthorized access to data occurs during execution.

### 4. **External Services**
   - **Role**: External services, such as **Metamask**, **Gmail**, **Google Sheets**, and others, are accessed by the AI Agent to complete the tasks defined in the workflow.
   - **Interaction**: These services can interact with each other as needed. For example, Metamask can trigger actions in Gmail, and the AI Agent facilitates seamless communication between them to execute the specified actions.

### 5. **Phala Network’s Trusted Execution Environment (TEE)**
   - **Role**: Every action performed within the TEE is logged and generates an **attestation report**.
   - **Function**: The **attestation report** provides cryptographic proof of secure execution inside the TEE. This report can be verified through the **Phala Network Attestation Verifier** to ensure that the operations were performed within the TEE and that no data was compromised during execution.


---


## Tech Stack Overview🛠️
- **Next.js 14** – Front-end React framework
- **Three.js** – 3D interactive visualizations and room rendering
- **Tailwind CSS** – UI styling and responsive design
- **Magic UI** – UI components library
- **RainbowKit** – Wallet connection and management
- **Wagmi** – React hooks for Ethereum
- **Ethers.js 6** – Blockchain interaction and smart contract integration
- **Framer Motion** – Animations and transitions
- **Polygon Amoy** – Testnet for event monitoring
- **Viem** – TypeScript interface for Ethereum
- **Anthropic AI SDK** – AI integration for platform features
- **Celo Mainnet L2** - Layer 2 blockchain for deployment
- **Polygon Testnet** - Layer 2 blockchain for testing
- **1inch** - Aggregates DEXes for optimal token swap rates and liquidity
- **Phala Network** – TEE hosting and on chain attestation proofs
- **Docker** – Containerization for hosting code securely in Phala TEEs


---

## Important Code Directories📂 
Here's a brief overview of important directories in our repository:

### 3D Models & Assets
- **/gltf** – GLTF format 3D models  
  - Furniture models (tables, chairs, shelves)  
  - Decorative items (rugs, plants, picture frames)  
  - Room elements and fixtures
- **/public/models** – Additional 3D model assets  
- **/public/fbx** – FBX format 3D models  
- **/public/assets** – Static assets for UI elements  
- **/public/icon** – Icon resources for UI components  

### Pages & Layout
- **/pages** – Core application pages  
  - **index.js** – Main 3D environment with Three.js scene setup  
  - **events.js** – Blockchain event monitoring interface  
  - **mcptest.js** – Platform testing environment
 
### Blockchain & Smart Contract Integration
- **/1inch** – 1inch integration for decentralized finance (DeFi) functionality  
  - Contains code for interacting with the 1inch API and aggregating liquidity from various decentralized exchanges (DEXs).
- **/mcp-server** – Server handling interactions with the Model Context Protocol (MCP)  
  - Manages connections and requests to external services or data providers using MCP.
- **/smart-contract** – Smart contract logic  
  - Contains Solidity smart contracts or other blockchain scripts related to the project.
- **/utils** – Utility functions and helpers  
  - Includes contract ABIs, blockchain-related utilities, and other helper functions needed for contract interactions.

---
## How We Are Different🌟
---

We noticed that while there are several tools to connect Web2 and Web3 services, none of them offer a seamless, visual, and user-friendly experience for managing cross-platform workflows. Many existing platforms are usually either fragmented, complicated, or require technical knowledge to be used effectively.

Here’s how Memest Cutest Platform is uniquely positioned:

| **Feature**                          | **Traditional Web2/Web3 Tools**                                                   | **Memest Cutest Platform**                                                                 |
|--------------------------------------|-----------------------------------------------------------------------------------|------------------------------------------------------------------------------------------|
| **Integration Across Web2 & Web3**   | Web2 and Web3 services are siloed; users must switch between apps and sites manually. | Unified interface to connect Web2 (e.g., Gmail, Google Sheets) and Web3 (e.g., MetaMask, Uniswap) seamlessly in one place. |
| **User Experience**                  | Complicated, requires manual connections, and lacks a visual workflow tool.       | Drag-and-drop, visual, gamified interface that makes cross-platform workflows intuitive and fun to create. |
| **Automation**                       | Limited automation options or require technical knowledge to configure.          | Easy-to-create, AI-driven workflows that automate tasks across platforms without coding. |
| **Privacy & Security**               | Centralized platforms with no control over data privacy.                          | Users can self-host the platform, providing full control over data and privacy within their cross-service automations. |
| **Visibility & Transparency**        | Services run in separate tabs, making it hard to visualize or understand workflows. | Gamified visualization that shows real-time interactions between services, helping users track and understand every action. |
| **Customization & Flexibility**      | Limited customization options; most services require manual intervention or external tools. | Highly customizable workflows that can be adjusted using drag-and-drop tools or natural language instructions. |
| **Platform Ecosystem**               | Rigid and closed ecosystems; adding new services requires external integrations.  | Open and modular system that supports plugin additions and self-hosting for greater flexibility and user control. |
| **Scalability**                      | Centralized platforms are often limited by infrastructure or bandwidth.           | Scalable platform that can grow with more services and users, supporting decentralized workflows. |

Memest Cutest Platform offers a fully integrated, automated, and gamified approach to managing both Web2 and Web3 services, overcoming the pain points of fragmentation, privacy issues, and complicated workflows seen in traditional tools. Whether for developers or non-technical users, it’s designed to be intuitive, secure, and highly customizable.

---


## Future Implementations 🚀
### Cross-Chain Diagram

In the future, Memest Cutest Platform will extend its support for additional blockchain networks beyond those already integrated (e.g., Polygon, Celo). By implementing a cross-chain framework, users will be able to create seamless workflows that span multiple chains, such as Ethereum, Binance Smart Chain, Solana, and more. This will allow for automated actions across a diverse range of blockchain ecosystems—whether it’s token swaps, event listening, or contract interactions—without users needing to manually switch between networks.

We envision a network of interconnected blockchains that are easily accessed and automated within a single, unified interface. This will bring true interoperability to the Web3 space and offer greater flexibility for users building cross-chain workflows.

Advanced AI-Driven Orchestration: Context-Aware Workflows

### Gamification Visualization Diagram

In the future, we plan to expand the visual gamified interface to support real-time data streaming, showing not just the static flow of actions but live updates as workflows execute. Users will be able to watch their actions unfold in real-time, with service blocks reacting interactively to data flows. This will improve the transparency and engagement of the platform, turning automated tasks into a highly interactive experience.

This enhancement will also allow for a more comprehensive monitoring dashboard, where users can view detailed metrics, like transaction speeds, service health, and the efficiency of each step in their workflow.


### Modular Plugin Diagram

To further expand Memest Cutest Platform’s capabilities, we will be developing a modular plugin system where both users and developers can contribute new services, block types, and integrations. This open-source ecosystem will allow the platform to grow continuously, adapting to new tools, services, and blockchain networks as they emerge. Users will be able to install and configure plugins easily, ensuring that they are always able to integrate the latest technologies into their workflows.

We aim to build a community-driven platform where anyone can contribute to the Platform’s evolution, creating a constantly growing repository of pre-built workflows, service blocks, and integrations.


---


## Team👥

- **Derek Liew Qi Jian**  
  - *Role*: Platform Lead, AI & 
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
 
