'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'

export default function Hero() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section className="hero-gradient text-white py-20 md:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-60">
        <div className="absolute -top-20 -right-24 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      </div>
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center">
          <motion.p
            className="text-sm uppercase tracking-[0.3em] text-primary-100/80 mb-4"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            James Almeida
          </motion.p>
          <motion.h1
            className="text-4xl md:text-6xl font-semibold leading-tight mb-6"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          >
            Turning AI into your competitive advantage.
          </motion.h1>
          <motion.p
            className="text-lg md:text-2xl text-primary-100/90 max-w-3xl mx-auto mb-8"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          >
            AI consulting and custom software delivered with clarity, speed, and measurable outcomes.
            I help teams ship smarter automation, products, and workflows that stick.
          </motion.p>
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
          >
            <Link href="/contact" className="btn-primary inline-flex items-center justify-center">
              Book a Call
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
