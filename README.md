# 🌐 Freelancer Marketplace – Frontend

This project was developed as a **Capstone Project** for the **Elm Dev Training Program - Web Track**.  
It showcases the practical implementation of full-stack concepts, including authentication, real-time chat, payments, and responsive UI using **Angular**, **Firebase**, and **Stripe**.

The frontend is built with **Angular 19**, offering a modern, responsive interface where any user can seamlessly act as both a **client** and a **freelancer**.

---

## 🎯 Key Features

- **Unified User Role**: Users can be both clients and freelancers.
- **Project Posting & Proposal Submission**: Clients post projects; freelancers bid.
- **Firebase Authentication**: Email/Password + Google Sign-In.
- **Token-Based API Access**: Uses Firebase ID tokens for secure communication.
- **Real-time Chat**: Integrated using SignalR.
- **Stripe Payment Integration**: Secure and reliable payments.
- **Responsive UI**: Built with Angular Material and Tailwind CSS.
- **Server-Side Rendering (SSR)**: Powered by Angular Universal.

---

## 🗂️ Project Structure
freelance_marketplace/
├── .vscode/                        # VSCode workspace settings
│
├── src/                            # Main source code folder
│   ├── app/                        # Angular application code
│   │   ├── core/                   # Core services (e.g., AuthService, Interceptors)
│   │   ├── features/               # Main Angular Component (e.g., HomeProfile, AddProject)
│   │   ├── shared/                 # Reusable components (footer, navbar, skill-selector, Proposal-card)
│   │   ├── app-route.ts            # Application routing configuration
│   │   ├── app.component.ts        # Root component
│   │   └── app.component.html      # Root component html
│   │
│   ├── assets/                     # Static assets (images in the home page)
│   │
├── ├──environments/                # Environment-specific config               
│   └── environment.ts              # Development environment
│   │
│   ├── main.ts                     # App entry point (browser)
│   ├── main.server.ts              # App entry point for SSR
│   ├── styles.css                  # Global styles (Tailwind + Angular Material)
│   └── server.ts                   # SSR server logic
│
├── angular.json                    # Angular CLI configuration
├── package.json                    # Project metadata, scripts, and dependencies
├── tailwind.config.js              # Tailwind CSS configuration
├── postcss.config.js               # PostCSS plugins for Tailwind
├── tsconfig.app.json               # TypeScript config for app code
├── tsconfig.server.json            # TypeScript config for server-side rendering
├── tsconfig.json                   # Global TypeScript config
├── tsconfig.spec.json              # TypeScript config for tests
├── karma.conf.js                   # Karma test runner config
├── .gitignore                      # Ignored files for Git
└── README.md                       # Project documentation


## 🔧 Getting Started

## 📦 Technologies Used

- Angular 19
- Firebase (Auth + Firestore)
- Tailwind CSS
- Angular Material
- Stripe API
- SignalR

### Prerequisites

- Node.js (v18+ recommended)
- Angular CLI
- Firebase project (with authentication enabled)

### Setup

1. Clone the repo:
2. 
   pre> \`\`\`bash git clone https://github.com/turki-aloufi/freelance_marketplace.git
   cd freelance_marketplace \`\`\` </pre>

3. pre> ` npm install `

4. Set your Firebase config:
   Update src/environments/environment.ts with your Firebase credentials.

pre> \`\`\ export const environment = {
              production: false,
              firebase: {
              apiKey: 'YOUR_API_KEY',
              authDomain: 'YOUR_AUTH_DOMAIN',
              projectId: 'YOUR_PROJECT_ID',
              storageBucket: 'YOUR_STORAGE_BUCKET',
              messagingSenderId: 'YOUR_SENDER_ID',
              appId: 'YOUR_APP_ID',
                }
              }; \`\`\` </pre>
   
6. Start the development server:
    `ng serve`

7. Visit the app at:
    `http://localhost:4200`

## 🔗 Backend Repository

The backend for this project is developed using .NET and SignalR.  
You can find it here:  

pre> \`\`\ https://github.com/turki-aloufi/freelance_marketplace_backend \`\`\` </pre>


## 👥 Team Members

This project was developed by the following team as part of our Elm Dev Training Program - Web Track:

- **Areej shareefi**  –  Full Stack Web Developer
- **Osama Alhejaily** –  Full Stack Web Developer
- **Razan Al-ahmadi** –  Full Stack Web Developer
- **Reham Alsaedi**  –   Full Stack Web Developer
- **Shadia Almutairi** – Full Stack Web Developer
- **Turki Aloufi**   –   Full Stack Web Developer
