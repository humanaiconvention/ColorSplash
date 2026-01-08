# ColorSplash 🎨

**Infinite AI-Powered Pixel Art for Kids**

ColorSplash is a magical color-by-numbers web application that turns any idea into a paintable pixel art puzzle. Designed for children, it uses Google's **Gemini 2.5 Flash** model to generate safe, vibrant concept art on the fly, which is then algorithmically processed into a pixel grid for coloring.

![ColorSplash Icon](https://cdn.jsdelivr.net/npm/twemoji@11.3.0/2/72x72/1f58c.png)

## 🎮 Play Now

You can play the live version here:
**[https://colorsplash-357116799368.us-west1.run.app/](https://colorsplash-357116799368.us-west1.run.app/)**

## ✨ Features

*   **Infinite Puzzles:** never run out of coloring pages. Choose from categories like Animals 🦁, Space 🚀, and Fantasy 🦄, or mix them up with dynamic characters.
*   **Adaptive Learning:** The app listens to feedback. If a puzzle is "Too Complex" or "Scary", the local learning engine adjusts future prompts to enforce simpler lines or cuter styles using a strict safety constraint system.
*   **Client-Side Privacy:** This is a serverless application. Your API key and game history are stored locally in your browser (`localStorage`). No images or data are sent to a third-party backend developer.
*   **PWA Support:** Installable on Chromebooks, iPads, and Desktops as a standalone app.

## 🕵️ Transparent Mode (Parental Gate)

ColorSplash includes a unique educational feature called **Transparent Mode**.

Toggle this in the settings to reveal the "magic" behind the AI:
1.  **Prompt Reveal:** See the exact system instructions sent to Gemini.
2.  **Token Economics:** View input/output token usage for every generation.
3.  **Adaptive Logic:** Watch how the app modifies prompts based on your feedback (e.g., *“Forcing simplification level 2/3”*).

It turns the game into a learning tool for understanding how Generative AI works under the hood.

## 🚀 How It Works

1.  **Generation:** The app constructs a prompt based on the selected category and user profile (e.g., *"Create a cute vector illustration of a lion..."*).
2.  **AI Creation:** Google's `gemini-2.5-flash-image` model generates a high-quality source image.
3.  **Image Processing:** The browser takes the raw image, downscales it to a grid (e.g., 32x32), clusters similar colors, and generates a solvable palette.
4.  **Gameplay:** The user paints pixels to match the palette.

## 🛠️ Setup & Installation

This project is built with **React**, **Vite**, **Tailwind CSS**, and the **Google Gen AI SDK**.

### Prerequisites
*   Node.js (v18+)
*   A Google Gemini API Key (Get one [here](https://aistudio.google.com/app/apikey))

### Running Locally

1.  **Clone the repository**
    ```bash
    git clone https://github.com/humanaiconvention/semantic-grounding-test-module.git
    cd colorsplash
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```

4.  **Enter your API Key**
    Open `http://localhost:3000`. You will be prompted to enter your Gemini API Key. This key is saved only to your browser.

## 📦 Tech Stack

*   **Frontend:** React 19, TypeScript
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS
*   **AI Model:** Google Gemini 2.5 Flash Image (`gemini-2.5-flash-image`)
*   **SDK:** `@google/genai`

## 📝 License

This project is open source. Feel free to fork and modify!
