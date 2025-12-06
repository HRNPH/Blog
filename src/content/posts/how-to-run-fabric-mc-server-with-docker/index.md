---
title: How to Run a Fabric Minecraft Server with Docker - Zero to Hero Guide
published: 2025-12-06
updated: 2025-12-06
description: "A beginner-friendly, step-by-step guide to setting up a Fabric Minecraft server using Docker."
image: "./cover.png"
tags: [Minecraft, Fabric, Docker, Server Setup, Gaming]
category: "Gaming"
draft: false
---

# Introduction

This is a "Zero-to-Hero" guide designed for someone who has never touched a server, doesn't know what a terminal is, and just wants to play Minecraft with friends using the Fabric mod loader.

We are using **Docker**. Think of Docker as a "robot" that runs software for you in a neat, isolated box so it doesn't mess up your actual computer.

-----

### **Phase 1: Get the Tools**

Before we do anything, you need the engine that runs the server.

1.  **Download Docker Desktop:**

      * Go to [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/).
      * Download it for your OS (Windows or Mac).
      * Install it just like any other program (Next, Next, Finish).
      * **Crucial Step:** Once installed, **OPEN Docker Desktop**. It must be running in the background. If it asks you to log in, you can usually skip it or create a free account.

2.  **Open your "Command Center" (Terminal):**

      * **Windows:** Press the `Windows Key`, type `PowerShell`, and hit Enter.
      * **Mac:** Press `Command + Space`, type `Terminal`, and hit Enter.

-----

### **Phase 2: Create the Server Folder (The "cd" stuff)**

You need a specific place on your computer where your server files will live. We will do this using the terminal to get you comfortable with it.

1.  **Type this command** to create a folder named `mc-server` (and press Enter):

    ```bash
    mkdir mc-server
    ```

    *(Note: `mkdir` stands for "Make Directory".)*

2.  **Type this command** to "walk inside" that folder:

    ```bash
    cd mc-server
    ```

    *(Note: `cd` stands for "Change Directory". Your terminal prompt should now look different, showing `mc-server` at the end.)*

-----

### **Phase 3: The Blueprint (docker-compose.yml)**

We need to give the Docker robot a set of instructions. This is called a "Compose file". It tells Docker: "I want Minecraft, I want Fabric, and I want it on this port."

1.  **Create the file:**

      * **Windows:** Type `notepad docker-compose.yml` and press Enter. It will ask if you want to create a new file. Click **Yes**.
      * **Mac:** You can use TextEdit, but ensure it saves as plain text. Or just run `touch docker-compose.yml` in the terminal to create it, then open that file with any text editor.

2.  **Copy and Paste the specific code:**
    Copy the code block below exactly. Don't change anything yet.

    ```yaml
    services:
      mc:
        image: itzg/minecraft-server
        container_name: my-fabric-server
        tty: true
        stdin_open: true
        ports:
          - "25565:25565"
        environment:
          EULA: "TRUE"
          TYPE: "FABRIC"
          VERSION: "1.20.1"
          MEMORY: "4G"
        volumes:
          - ./data:/data
        restart: unless-stopped
    ```

3.  **Understand what you just pasted:**

      * `image: itzg/minecraft-server`: This downloads a pre-made Minecraft server created by a legend named *itzg*.
      * `TYPE: "FABRIC"`: Tells the server to use Fabric, not normal Minecraft.
      * `VERSION: "1.20.1"`: **Important.** This dictates the game version. Change this to whatever version you and your friends want to play.
      * `MEMORY: "4G"`: Gives the server 4 Gigabytes of RAM. If your computer is weak, lower this to "2G".
      * `volumes`: This saves your world. It creates a folder called `data` in your `mc-server` folder so your world doesn't vanish when you turn the server off.

4.  **Save the file** and close the text editor.

-----

### **Phase 4: Start the Engine**

Now we tell Docker to read that file and build your server.

1.  Go back to your terminal (make sure you are still inside the `mc-server` folder).

2.  **Run this command:**

    ```bash
    docker compose up -d
    ```

      * `up`: Start everything.
      * `-d`: Detached mode. This means "run in the background, don't lock up my terminal window."

3.  **Wait.** The first time you run this, it will take a while (5-10 mins) because it is downloading Minecraft, Fabric, and Java.

4.  **Check if it's working:**
    Type this command to watch the logs (the server "thinking"):

    ```bash
    docker compose logs -f
    ```

      * You will see a lot of text scrolling.
      * Wait until you see a line that says: **`Done (X.XXs)! For help, type "help"`**.
      * **Press `Ctrl + C`** to stop watching the logs (this **does not** stop the server, it just stops the scrolling text).

**Congratulations\!** You now have a vanilla Fabric server running.

  * **IP Address:** `localhost` (for you).
  * **IP Address:** Your real IP (for friends—you will likely need to Port Forward your router for friends to join, but that is a separate networking topic).

-----

### **Phase 5: Installing Mods (The "Asshole Beginner" Friendly Way)**

You probably want mods. Here is the safest way to do it.

**Step 1: Turn off the server**
You cannot add mods while the server is running.

```bash
docker compose down
```

**Step 2: Locate the mods folder**

1.  Open your regular file explorer (Finder on Mac, File Explorer on Windows).
2.  Find the `mc-server` folder we created in Phase 2.
3.  Inside, you will see a new folder called `data`.
4.  Inside `data`, you will see a folder called `mods`.

**Step 3: Download your mods**

1.  Go to Modrinth or CurseForge.
2.  Download the **Fabric** version of the mod.
3.  **CRITICAL:** The mod version MUST match your server version (e.g., if server is 1.20.1, mod must be 1.20.1).
4.  **CRITICAL:** You must also download the **Fabric API** mod. Almost all Fabric mods require this. Put it in the folder too.

**Step 4: Drag and Drop**
Drag the `.jar` files you downloaded into that `mc-server/data/mods` folder.

**Step 5: Turn the server back on**
Go back to your terminal:

```bash
docker compose up -d
```

Watch the logs again (`docker compose logs -f`) to make sure the server doesn't crash. If it crashes, one of your mods is probably the wrong version.

-----

### **Phase 6: You are the Admin (OP Yourself)**

You want to be able to ban people or switch to creative mode. You need to access the server console.

1.  **Run this command** to execute the admin tool inside the server:
    ```bash
    docker exec -i my-fabric-server rcon-cli
    ```
2.  Your terminal prompt will change to something like `>`. You are now talking directly to the Minecraft server.
3.  Type:
    ```text
    op YourMinecraftUsername
    ```
    (Replace `YourMinecraftUsername` with your actual in-game name).
4.  It should say "Made YourMinecraftUsername a server operator".
5.  Type `exit` to leave the admin console.

-----

### **Phase 7: The "Cheat Sheet" for Daily Use**

Save this list. These are the only commands you need to know.

  * **Turn Server ON:**
    `docker compose up -d`
  * **Turn Server OFF:**
    `docker compose down`
  * **Restart Server (after adding new mods):**
    `docker compose restart`
  * **Check Server Status/Logs:**
    `docker compose logs -f`
    *(Press Ctrl+C to exit logs)*
  * **Access Admin Console:**
    `docker exec -i my-fabric-server rcon-cli`

### **Summary of Common Mistakes**

1.  **Client/Server Mismatch:** You need to install Fabric and the **exact same mods** on your own computer's Minecraft Launcher to join the server.
2.  **Wrong Java Version:** If you change the Minecraft version to an old one (like 1.12), the server might fail. The `itzg` image usually handles this automatically, but stick to versions 1.18+ for the smoothest experience with this guide.
3.  **EULA:** If you edited the file and didn't put `EULA: "TRUE"`, the server will immediately shut down.
