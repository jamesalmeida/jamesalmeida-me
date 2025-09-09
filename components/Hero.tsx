import Link from 'next/link'

export default function Hero() {
  return (
    <section className="hero-gradient text-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Arkham Ventures
        </h1>
        <p className="text-xl md:text-2xl text-primary-100 mb-4">
          Empowering Innovation Through Diverse Ventures
        </p>
        <p className="text-lg md:text-xl text-primary-200 mb-8 max-w-2xl mx-auto">
          A holding company managing multiple projects in technology and innovation.
          We foster transformative ideas and build sustainable ventures.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/contact" className="btn-primary inline-block">
            Get Started
          </Link>
          <Link href="/about" className="btn-secondary inline-block">
            Learn More
          </Link>
        </div>
      </div>
    </section>
  )
}
