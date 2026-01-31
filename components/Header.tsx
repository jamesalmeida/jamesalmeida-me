'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <header className="bg-white/90 backdrop-blur shadow-sm sticky top-0 z-50 dark:bg-primary-900/90">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3">
              {/* Logo Image */}
              <div className="relative w-8 h-8 md:w-10 md:h-10">
                <Image
                  src="/AV-logo.png"
                  alt="James Almeida Logo"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 32px, 40px"
                />
              </div>
              {/* Logo Text */}
              <div className="leading-tight">
                <span className="block text-lg md:text-xl font-semibold text-primary-900 dark:text-white">
                  James Almeida
                </span>
                <span className="block text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  AI Consulting & Custom Software
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/" className="nav-link">
                  Home
                </Link>
                <Link href="/services" className="nav-link">
                  Services
                </Link>
                <Link href="/about" className="nav-link">
                  About
                </Link>
                <Link href="/contact" className="nav-link">
                  Contact
                </Link>
              </div>
            </div>

            <ThemeToggle />

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-primary-900 hover:text-primary-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:text-gray-100 dark:hover:text-white dark:hover:bg-primary-800"
                aria-expanded="false"
                aria-label="Main menu"
              >
                <svg
                  className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg
                  className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 rounded-md mt-2 dark:bg-primary-800">
            <Link
              href="/"
              className="block px-3 py-2 text-base font-medium text-primary-900 hover:text-primary-600 hover:bg-gray-100 rounded-md dark:text-gray-200 dark:hover:text-white dark:hover:bg-primary-700"
              onClick={closeMenu}
            >
              Home
            </Link>
            <Link
              href="/services"
              className="block px-3 py-2 text-base font-medium text-primary-900 hover:text-primary-600 hover:bg-gray-100 rounded-md dark:text-gray-200 dark:hover:text-white dark:hover:bg-primary-700"
              onClick={closeMenu}
            >
              Services
            </Link>
            <Link
              href="/about"
              className="block px-3 py-2 text-base font-medium text-primary-900 hover:text-primary-600 hover:bg-gray-100 rounded-md dark:text-gray-200 dark:hover:text-white dark:hover:bg-primary-700"
              onClick={closeMenu}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="block px-3 py-2 text-base font-medium text-primary-900 hover:text-primary-600 hover:bg-gray-100 rounded-md dark:text-gray-200 dark:hover:text-white dark:hover:bg-primary-700"
              onClick={closeMenu}
            >
              Contact
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
