# LearniO Frontend

A modern learning platform frontend built with Next.js, Tailwind CSS, and shadcn/ui.

## 🚀 Tech Stack

- **Next.js 15.4.5** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - Beautiful and accessible UI components
- **React 19** - Latest React version
- **ESLint** - Code linting and formatting

## 📁 Project Structure

```
client/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/          # React components
│   │   └── ui/             # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       └── label.tsx
│   └── lib/                # Utility functions
│       └── utils.ts        # shadcn/ui utilities
├── public/                 # Static assets
├── components.json         # shadcn/ui configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Navigate to the client directory:

   ```bash
   cd client
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🎨 UI Components

The project uses shadcn/ui components which are built on top of Radix UI and styled with Tailwind CSS. Available components:

- **Button** - Various button styles and variants
- **Card** - Container component with header, content, and footer
- **Input** - Form input field
- **Label** - Form label component

### Adding New Components

To add more shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

For example:

```bash
npx shadcn@latest add dialog dropdown-menu
```

## 🎯 Features

- **Modern UI** - Beautiful gradient backgrounds and smooth animations
- **Responsive Design** - Works perfectly on all device sizes
- **Dark Mode Ready** - Built-in dark mode support
- **TypeScript** - Full type safety throughout the application
- **Performance Optimized** - Next.js optimizations for fast loading
- **Accessible** - WCAG compliant components

## 🔧 Configuration

### Tailwind CSS

The project uses Tailwind CSS v4 with the latest features. Configuration is in `tailwind.config.ts`.

### shadcn/ui

Component configuration is in `components.json`. You can customize:

- Color scheme
- Border radius
- CSS variables
- Component paths

### TypeScript

Strict TypeScript configuration with path aliases:

- `@/*` points to `src/*`

## 🚀 Deployment

The project is ready for deployment on Vercel, Netlify, or any other platform that supports Next.js.

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Build for Production

```bash
npm run build
npm run start
```

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is part of the LearniO learning platform.
