graph TD
    %% Global Styling
    classDef main fill:#3b82f6,stroke:#1e3a8a,stroke-width:2px,color:#fff,font-weight:bold
    classDef sub fill:#f8fafc,stroke:#3b82f6,stroke-width:1px,color:#1e293b
    classDef system fill:#22c55e,stroke:#14532d,stroke-width:2px,color:#fff
    classDef storage fill:#f59e0b,stroke:#78350f,stroke-width:1px,color:#fff

    Root((DevFlow Suite)):::main

    %% 📋 Task Management
    Root --> Tasks[📋 Task Management]:::main
    Tasks --> Scan[Smart Scanner]:::sub
    Tasks --> Explorer[Sidebar Explorer]:::sub
    Scan --> Extracted[// TODO & // FIXME]:::sub
    Explorer --> Folders[User Folders]:::sub
    Explorer --> Pri[Priority Tab]:::sub
    Explorer --> Recycle[Recycle Bin]:::sub

    %% 📌 Pin System
    Root --> Pins[📌 Pin System]:::main
    Pins --> Manual[Manual Pin]:::sub
    Pins --> Auto[Auto-Pin Timer]:::sub
    Pins --> Diff[Git-Style Diff View]:::sub
    Pins --> Meta[Tags & Stars]:::sub

    %% ⏱️ Timeline & Audit
    Root --> Timeline[⏱️ Timeline & Audit]:::main
    Timeline --> Events[Action Logging]:::sub
    Timeline --> Export[Export Engine]:::sub
    Export --> JSON[JSON / CSV]:::sub
    Export --> PDF[HTML / PDF Report]:::sub

    %% 🔒 Local Engine
    Root --> Engine[🔒 Local Engine]:::system
    Engine --> GState[VS Code GlobalState]:::storage
    Engine --> LFS[Local Filesystem .devflow-pins]:::storage
    Engine --> Privacy[100% Privacy - No Cloud]:::system

    %% Styling specific nodes for colors
    style Tasks fill:#3b82f6,color:#fff
    style Pins fill:#8b5cf6,color:#fff
    style Timeline fill:#ec4899,color:#fff
    style Engine fill:#10b981,color:#fff
