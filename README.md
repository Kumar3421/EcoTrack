# 🌍 EcoTrack — Personal Carbon Footprint Tracker

EcoTrack is a visually stunning, production-grade carbon footprint tracker built with a premium **liquid glassmorphism** design system. Track your daily activities, set carbon budgets, unlock achievements, and see real-time interactive insights about your ecological footprint.

### 🔗 Live Demo
Visit the live application deployed on Google Cloud Run:
👉 **[https://ecotrack-369202417662.us-central1.run.app/](https://ecotrack-369202417662.us-central1.run.app/)**

---

## ✨ Features

* **💎 Premium Liquid Glass Design**: Frosted glass cards, double-highlight borders, animated floating lava-lamp background orbs, and mouse spotlight coordinate glow tracking.
* **📊 Interactive Donut Breakdown**: A highly responsive, vanilla-rendered canvas breakdown chart. Hovering over segments pops them out with a glow and dynamically updates the central metric and matching legend details.
* **🎮 Gamification & Achievements**: Level-up system (1-10) with custom badges, daily eco-challenges, experience points (XP), and canvas confetti particle physics celebrations.
* **🌳 Carbon Offset Tree Simulator**: Interactive drag-and-drop tool to calculate exactly how many trees must be planted (and estimated cost) to offset your weekly footprint.
* **⚙️ Regionalization & Budgets**: Set local comparison baselines (World, US, EU, UK, India) and configure a daily carbon limit with warning banners.
* **📤 Backup & Restore**: Export your historical data logs to a JSON file and import them back at any time.

---

## 🛠️ Technology Stack

* **Structure**: Semantic HTML5 layout
* **Styling**: Vanilla CSS (CSS Grid, Flexbox, Custom Properties, Backdrop Filters)
* **Interactivity**: Pure ES6+ JavaScript
* **Database & Storage**: Client-side `localStorage` state persistence
* **Deployment**: Dockerized using `nginx:alpine` and hosted on Google Cloud Run

---

## 📦 Local Setup & Development

To run the project locally on your machine:

1. Clone the repository:
   ```bash
   git clone https://github.com/Kumar3421/EcoTrack.git
   cd EcoTrack
   ```
2. Serve the directory using any static web server. For example, using Python or Node.js:
   ```bash
   # Using Python
   python -m http.server 8000

   # Or using Node
   npx http-server -p 8000
   ```
3. Open `http://localhost:8000` in your web browser.

---

## ☁️ Google Cloud Run Manual Deployment

The project is pre-configured with a production-grade `Dockerfile` that packages the application with Nginx. To deploy a new revision to Google Cloud Run from Cloud Shell:

```bash
# Enable APIs (first time only)
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# Deploy directly from source
gcloud run deploy ecotrack --source . --region us-central1 --allow-unauthenticated
```
