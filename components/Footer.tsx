import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-primary-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">Arkham Ventures</h3>
            <p className="text-primary-100 mb-4 max-w-md">
              Empowering innovation through diverse ventures. A holding company managing
              multiple projects in technology and innovation.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.linkedin.com/company/arkham-ventures-inc"
                className="w-10 h-10 bg-primary-800 hover:bg-accent-500 rounded-full flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
                target="_blank"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              {/* <a
                href="#"
                className="w-10 h-10 bg-primary-800 hover:bg-accent-500 rounded-full flex items-center justify-center transition-colors"
                aria-label="Twitter/X"
                target="_blank"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a> */}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-primary-100 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-primary-100 hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-primary-100 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <div className="space-y-2 text-primary-100">
              <p>
                <a href="mailto:james@almeida.ventures" className="hover:text-white transition-colors">
                  james@almeida.ventures
                </a>
              </p>
              <p>
                <a href="tel:+16692583337" className="hover:text-white transition-colors">
                  +1 (669) 258-3337
                </a>
              </p>
              <p>2108 N ST. STE N<br />Sacramento CA 95816<br />United States</p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-primary-800 mt-8 pt-8 text-center">
          <p className="text-primary-100">
            © {new Date().getFullYear()} Arkham Ventures. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
