# 🐧 Web Linux Terminal Simulator

A lightweight, educational, and highly interactive Linux terminal simulator built from scratch using vanilla web technologies. 

💡 **The Project Objective**
The primary mission of this project is to introduce people to the Linux operating system in an accessible, zero-risk environment. Many users feel intimidated by the command-line interface or fear breaking their system. This simulator breaks down that barrier, allowing students, tech enthusiasts, and curious users to explore commands, navigate file trees, and learn terminal core concepts safely right inside their web browser.

Based on a Debian GNU/Linux environment, the simulator replicates system files, default configurations, shell behaviors, and logic operators to deliver a realistic experience without the need for virtual machines or complex setups.

---

## 📸 Screenshots

* **Login Screen:** <img width="1328" height="669" alt="image" src="https://github.com/user-attachments/assets/807065be-385d-4a45-93cc-4f3b131d0693" />


---

## 🚀 Live Demo

Experience the environment online instantly:
👉 **[Open the Linux Terminal Simulator](LINK_TO_YOUR_LIVE_DEMO_HERE)**

---

## 🎨 Core Features

* **📚 Interactive Learning Mode:** A built-in curriculum with step-by-step missions. It teaches everything from basic navigation (`pwd`, `ls`) to advanced file manipulation, permissions, and security. Features real-time command validation and hints.
* **📁 Virtual File System (VFS):** A realistic directory tree featuring standard Unix/Linux paths (`/home`, `/etc`, `/var`, `/usr`). Changes, files created, and permissions are persisted locally in the browser.
* **⚙️ Advanced Command Engine:** Supports complex shell mechanics including:
  * Output redirection (`>` and `>>`)
  * Pipelines (`|`) with quote-awareness
  * Logical operators (`&&` and `||`)
  * Tab-autocomplete for files and directories
  * Command history via `ArrowUp` and `ArrowDown`
* **📱 100% Mobile Responsive:** Custom CSS architectures prevent virtual keyboards from breaking the layout and stop native OS zoom issues, providing a seamless "native app" feel on iOS and Android.
* **🖌️ Dynamic Theme Engine:** Switch instantly between classic Default, Dracula, Nord, Gruvbox, Matrix, Catppuccin, and Cyberpunk themes.
* **🌐 Localization:** Multi-language system supporting English and Portuguese on the fly.
* **🐳 Virtual Docker Environment:** Sandboxed simulation for basic containerized workflows (pulling images, running containers) without requiring Docker on the host.
* **📝 Text Editors:** Built-in interactive overlays simulating `nano` and `vim` for file editing.

---

## ⌨️ Supported Commands

The simulation engine parses commands, flags, and basic operators. Here are some of the key commands you can use:

* **Navigation & Discovery:** `cd`, `ls` (supports `-l`, `-a`), `pwd`, `tree`, `find`, `whereis`
* **File Management:** `touch`, `mkdir`, `rm`, `rmdir`, `mv`, `cp`, `cat`, `grep`, `chmod`, `cut`, `head`, `tail`
* **System & Diagnostics:** `neofetch`, `uname`, `uptime`, `df`, `du`, `free`, `ps`, `top`
* **Network Simulators:** `ping`, `curl`, `tcpdump`, `ifconfig`, `ssh-keygen`, `proxychains`
* **Text Editors:** `nano`, `vim`
* **Package Management:** `apt` (simulated package installations to unlock commands)
* **Fun & Easter Eggs:** `cmatrix`, `cowsay`, `sl`, and custom system-crash triggers for restricted root commands.

*(Note: Many commands support standard flags and fallback parameters to mirror real bash behavior).*

---

## 🚀 How to Start (Local Setup)

Since this project is built entirely with Vanilla Web Technologies (HTML, CSS, JS), there are no complex build steps, dependencies, or node modules required.

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/YOUR_USERNAME/linux-terminal-simulator.git](https://github.com/YOUR_USERNAME/linux-terminal-simulator.git)

2. **Navigate to the folder:**
   ```bash
   cd linux-terminal-simulator

    Run the project:
    Simply open the index.html file in your preferred web browser.
    (For the best experience, you can also serve it via VS Code Live Server or any basic HTTP server).

## 🛠️ Built With

    HTML5 – Application structure and canvas boundaries.

    CSS3 – Retro monospace typography, custom layout components, mobile media queries, and theming variables.

    Vanilla JavaScript (ES6+) – DOM manipulation mechanics, robust string parsing/tokenization, VFS mapping, and logic validation for the Learning Mode.

## 📌 Project Status

Current Version: v1.0 Stable

This project has reached its feature-complete milestone. The core architecture, learning mode, and command engine are 90% stable. Future updates to this repository will be strictly dedicated to bug fixes, code maintenance, and stability improvements. No new major features are planned for this specific version.
