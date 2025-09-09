# Arkham Ventures - Business Website

A professional, minimalistic business website for Arkham Ventures, a holding company managing multiple projects in technology and innovation. Built with Next.js 14, TypeScript, and Tailwind CSS, optimized for Vercel deployment.

## 🚀 Features

- **Modern Design**: Clean, professional design with navy, white, and gold accent colors
- **Responsive**: Mobile-first design that works perfectly on all devices
- **SEO Optimized**: Meta tags, Open Graph tags, and structured data for social media
- **Fast Performance**: Optimized with Next.js Image component and best practices
- **Accessibility**: ARIA-compliant with keyboard navigation and screen reader support
- **Contact Form**: Functional contact form with server-side validation and rate limiting
- **TypeScript**: Full type safety throughout the application

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Font**: Inter (Google Fonts)

## 📁 Project Structure

```
arkham-ventures/
├── app/
│   ├── api/
│   │   └── contact/
│   │       └── route.ts          # Contact form API endpoint
│   ├── about/
│   │   └── page.tsx              # About page
│   ├── contact/
│   │   └── page.tsx              # Contact page
│   ├── globals.css               # Global styles and Tailwind imports
│   ├── layout.tsx                # Root layout with metadata
│   └── page.tsx                  # Homepage
├── components/
│   ├── ContactForm.tsx           # Contact form component
│   ├── Footer.tsx                # Footer component
│   ├── Header.tsx                # Navigation header
│   └── Hero.tsx                  # Hero section component
├── env.example                   # Environment variables template
├── package.json                  # Dependencies and scripts
├── next.config.js               # Next.js configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── tsconfig.json                # TypeScript configuration
├── vercel.json                  # Vercel deployment configuration
└── README.md                    # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/arkham-ventures.git
   cd arkham-ventures
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   ```

   Edit `.env.local` and add your actual values:
   ```env
   CONTACT_EMAIL=your-email@arkham.ventures
   # Add other environment variables as needed
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📧 Contact Form Configuration

The contact form uses a serverless API route. To enable email functionality:

### Option 1: Resend (Recommended)

1. Sign up at [Resend](https://resend.com)
2. Get your API key
3. Add to `.env.local`:
   ```env
   RESEND_API_KEY=your_resend_api_key
   ```

4. Update the API route (`app/api/contact/route.ts`) to use Resend:
   ```typescript
   import { Resend } from 'resend'

   const resend = new Resend(process.env.RESEND_API_KEY)
   ```

### Option 2: SendGrid

1. Sign up at [SendGrid](https://sendgrid.com)
2. Get your API key
3. Install SendGrid package:
   ```bash
   npm install @sendgrid/mail
   ```

4. Update the API route accordingly

### Option 3: Vercel KV (For Storage)

To store form submissions:

1. Set up Vercel KV in your Vercel dashboard
2. Add environment variables:
   ```env
   KV_URL=your_kv_url
   KV_REST_API_URL=your_kv_rest_api_url
   KV_REST_API_TOKEN=your_kv_token
   ```

## 🚀 Deployment to Vercel

### Step 1: Prepare Your Repository

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

### Step 2: Deploy to Vercel

1. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "New Project"
   - Import your repository

2. **Configure Build Settings:**
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (leave as default)

3. **Add Environment Variables:**
   In the Vercel dashboard, go to your project settings and add:
   - `CONTACT_EMAIL`: Your contact email
   - Any other environment variables from your `.env.local`

4. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete
   - Your site will be live at `your-project-name.vercel.app`

### Step 3: Domain Setup with Namecheap

#### Option A: Connect Custom Domain (arkham.ventures)

1. **Purchase Domain:**
   - Buy `arkham.ventures` from Namecheap

2. **Add Domain to Vercel:**
   - In Vercel dashboard, go to your project
   - Click "Settings" → "Domains"
   - Add `arkham.ventures`
   - Vercel will provide DNS records

3. **Configure DNS in Namecheap:**
   - Log into your Namecheap account
   - Go to "Domain List" → select your domain
   - Click "Manage" → "Advanced DNS"

4. **Add DNS Records:**
   For the root domain (`arkham.ventures`), add these records:

   **Type: A Record**
   - Host: `@`
   - Value: `76.76.21.21` (Vercel's load balancer IP)
   - TTL: Automatic

   **Type: CNAME Record**
   - Host: `www`
   - Value: `cname.vercel-dns.com`
   - TTL: Automatic

5. **Wait for Propagation:**
   - DNS changes can take up to 48 hours
   - Check status at [dnschecker.org](https://dnschecker.org)

#### Option B: Connect Subdomain (www.arkham.ventures)

If you prefer `www.arkham.ventures`:

1. **Add Domain to Vercel:**
   - Add `www.arkham.ventures` in Vercel

2. **DNS Configuration:**
   **Type: CNAME Record**
   - Host: `www`
   - Value: `cname.vercel-dns.com`

3. **Redirect Root Domain:**
   - Add another CNAME record:
     - Host: `@`
     - Value: `cname.vercel-dns.com`

### Step 4: SSL Certificate

Vercel automatically provisions SSL certificates for your domains. No additional configuration needed.

### Step 5: Verify Deployment

1. **Check Site:**
   - Visit `https://arkham.ventures`
   - Test contact form functionality
   - Verify mobile responsiveness

2. **Test Contact Form:**
   - Submit a test message
   - Check that you receive the email
   - Verify rate limiting works

## 🔧 Customization

### Colors
Edit `tailwind.config.js` to modify the color scheme:

```javascript
colors: {
  primary: {
    500: '#0f172a', // Navy
    600: '#0e141b',
  },
  accent: {
    500: '#fbbf24', // Gold
  },
}
```

### Content
Update the following files with your content:
- `app/layout.tsx`: Site metadata
- `app/page.tsx`: Homepage content
- `app/about/page.tsx`: About page content
- `app/contact/page.tsx`: Contact page content

### Contact Information
Update contact details in:
- `app/contact/page.tsx`
- `components/Footer.tsx`

## 🔍 SEO and Social Media

### Meta Tags
SEO meta tags are configured in `app/layout.tsx`. Update:
- Title and description
- Open Graph tags for social sharing
- Twitter Card tags

### Google Search Console
1. Add your Google Site Verification code to `app/layout.tsx`
2. Submit your sitemap to Google Search Console

### Social Media Images
Add social media preview images to the `public` folder and update Open Graph tags.

## 📱 Accessibility

The site includes:
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Semantic HTML structure

## 🚀 Performance Optimization

- **Next.js Image Component**: Optimized images with lazy loading
- **Font Optimization**: Self-hosted Inter font
- **CSS Optimization**: Tailwind CSS purging unused styles
- **Code Splitting**: Automatic route-based code splitting

## 🧪 Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Code Quality

- **ESLint**: Configured for Next.js and TypeScript
- **TypeScript**: Strict type checking enabled
- **Prettier**: Code formatting (configure in your editor)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is private and proprietary to Arkham Ventures.

## 🆘 Support

For support or questions:
- Email: info@arkham.ventures
- Create an issue in the repository

## 📝 Changelog

### Version 1.0.0
- Initial release
- Basic business website with contact form
- SEO optimization
- Vercel deployment ready
- Responsive design
- Accessibility compliance

---

**Built with ❤️ for Arkham Ventures**
