# Title
**One Line**

![Logo]()



---

## Inspiration: How We Came Up with This Idea💡

Long

We thought:

> *“What if we could ?”*

So

---


## The Problem🚧



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
