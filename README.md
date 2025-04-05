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

![Architecture](https://github.com/derek2403/memest-cutest-platform/blob/main/public/Architecture.png?raw=true) 

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

## 1inch Integration: Cross-Chain Swaps

We integrate **1inch Fusion+** to provide efficient cross-chain swaps within our platform. This feature allows users to seamlessly swap tokens across chains without the need for bridging. 

- **Use Case Example**: In our workflow, when a user holds **Arbitrum USDC**, the system automatically converts it to **Base USDC**. This entire process is managed by the AI Agent, which executes the cross-chain swap without user intervention.
  
By using 1inch, we provide an efficient way to enable cross-chain swaps for our users, simplifying the process and improving liquidity.

---

## Polygon and Celo Integration

### Polygon Integration
- **Event Capturing**: We have verified a smart contract (`0xFaDC1F029af77faE9405B9f565b92Ec0B59130E1`) on Polygon PoS and capture blockchain events.
- **Gmail Integration**: We use captured blockchain events and link them to **Gmail**, enabling notifications or other actions based on blockchain events.

### Celo Integration
- We have deployed a smart contract on the **Celo Mainnet** with contract address `0x35643527da0fe2251445dcd77d313ad280a50fe4`. This contract is fully verified and operational, showing successful transactions on the Celo blockchain.

### Use Case:
We leverage **Polygon** and **Celo** to interact with decentralized applications (dApps) and blockchain events. When a smart contract is triggered on either Polygon or Celo, events are captured and used to trigger actions. For example, upon triggering events, the system sends notifications or triggers further actions (e.g., interacting with the AI agent), ensuring seamless integration and enhanced functionality for blockchain interactions across both networks.



---


## How We Are Different 🌟
---

Unlike general Multi-Party Computation (MPC) models, our platform focuses on **orchestration and workflow management** from the **user’s perspective**. We’re not just optimizing AI; we’re making workflows intuitive, transparent, and customizable for everyday users. Here’s how **Memest Cutest Platform** stands out:

| **Feature**                          | **Traditional MPC Models**                                             | **Memest Cutest Platform**                                                                 |
|--------------------------------------|-----------------------------------------------------------------------|------------------------------------------------------------------------------------------|
| **Focus**                            | Focus on AI-centric models and algorithms.                           | **User-centric orchestration**, enabling seamless workflows for both Web2 and Web3 services. |
| **Source Code**                      | Closed-source, proprietary platforms.                                | **Open-source**, allowing users and developers to contribute and expand the platform. |
| **Web2 & Web3 Integration**          | Typically Web2-only or Web3-only solutions.                          | Unified platform that integrates **both Web2 (e.g., Gmail, Google Sheets)** and **Web3 (e.g., MetaMask, Uniswap)** services. |
| **Trusted Execution Environment (TEE)** | Lack of built-in TEE for data security.                              | Integrated **TEE** provided by **Phala Network** for added privacy and security in workflows. |
| **Workflow Flexibility**             | Limited workflows with few integration tools.                        | Highly customizable workflows with **multiple tools**, including blockchain, data services, and APIs. |
| **User Interface**                   | Often lacks user-friendly interfaces or requires technical knowledge. | **Gamified front-end** that makes building workflows visually engaging and intuitive. |
| **Cross-DApp Communication**         | Web3 services typically operate in isolation.                        | **Web3 services** can interact with each other across DApps, allowing for **cross-DApp connections** in workflows. |
| **Platform Ecosystem**               | Closed ecosystems with limited ability for user contributions.       | Open, **community-driven ecosystem** where users can contribute new services, plugins, and integrations. |

**Memest Cutest Platform** goes beyond traditional models by offering a **full-stack, user-friendly solution** that integrates both **Web2 and Web3**. It’s designed to provide **privacy, flexibility, and scalability** with an easy-to-use interface, while supporting **cross-platform interoperability**.

---

## Future Implementations 🚀

We are committed to continuously improving our platform and enabling the community to build on it. Here are some exciting future plans:

### Super DApp: Connecting All DApps
In the future, **Memest Cutest Platform** aims to become the **super DApp**, a platform that connects to **all other DApps**. We envision a future where users can interact with and automate workflows across every decentralized application, regardless of the underlying blockchain network.


## Team👥

- **Derek Liew Qi Jian**  
  - *Role*: Platform Lead, AI & TEE  
  - [LinkedIn](https://www.linkedin.com/in/derek2403/) | [Twitter](https://x.com/derek2403)

- **Phen Jing Yuan**  
  - *Role*: Backend Integration  
  - [LinkedIn](https://www.linkedin.com/in/jing-yuan-phen-b42266295/) | [Twitter](https://x.com/ilovedahmo)

- **Marcus Tan Chi Yau**  
  - *Role*: Frontend Developer & UI/UX Design  
  - [LinkedIn](https://www.linkedin.com/in/marcus-tan-8846ba271/)

- **Tan Zhi Wei**  
  - *Role*: Frontend Developer & UI/UX Design  
  - [LinkedIn](https://www.linkedin.com/in/tanzhiwei0328/)

- **Edwina Hon**  
  - *Role*: 1inch Integration & Backend Integration 
  - [LinkedIn](https://www.linkedin.com/in/edwina-hon-548189340/)

