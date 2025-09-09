import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              About Arkham Ventures
            </h1>
            <p className="text-xl md:text-2xl text-primary-100">
              Empowering Innovation Through Diverse Ventures
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-primary-900 mb-6">
                Our Mission
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                To foster transformative ideas and build sustainable ventures that drive positive change
                in technology and innovation sectors worldwide.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-primary-900 mb-4">
                  Who We Are
                </h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Arkham Ventures is a dynamic holding company established in 2023 with a global presence.
                  We oversee a diverse portfolio of technology and innovation projects, providing strategic
                  guidance, resources, and expertise to help ventures reach their full potential.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Our team consists of seasoned entrepreneurs, technology experts, and business leaders
                  who share a passion for innovation and a commitment to building sustainable businesses
                  that make a positive impact on society.
                </p>
              </div>

              <div className="bg-gray-50 p-8 rounded-lg">
                <h3 className="text-2xl font-semibold text-primary-900 mb-6">
                  Our Values
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-accent-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                    <div>
                      <strong className="text-primary-900">Innovation:</strong>
                      <span className="text-gray-700 ml-1">Embracing cutting-edge technologies and creative solutions.</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-accent-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                    <div>
                      <strong className="text-primary-900">Integrity:</strong>
                      <span className="text-gray-700 ml-1">Building trust through transparency and ethical practices.</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-accent-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                    <div>
                      <strong className="text-primary-900">Collaboration:</strong>
                      <span className="text-gray-700 ml-1">Partnering with talented teams to achieve shared goals.</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-accent-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                    <div>
                      <strong className="text-primary-900">Sustainability:</strong>
                      <span className="text-gray-700 ml-1">Creating long-term value for stakeholders and communities.</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* History Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-primary-900 text-center mb-12">
              Our History
            </h2>

            <div className="space-y-8">
              <div className="flex flex-col md:flex-row items-start md:items-center">
                <div className="flex-shrink-0 w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mb-4 md:mb-0 md:mr-6">
                  <span className="text-white font-bold text-lg">2023</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-primary-900 mb-2">
                    Foundation
                  </h3>
                  <p className="text-gray-700">
                    Arkham Ventures was founded with a vision to create a holding company that would
                    serve as a catalyst for technological innovation. Our initial focus was on identifying
                    promising startups and providing them with the resources needed to scale.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center">
                <div className="flex-shrink-0 w-16 h-16 bg-accent-500 rounded-full flex items-center justify-center mb-4 md:mb-0 md:mr-6">
                  <span className="text-white font-bold text-lg">2024</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-primary-900 mb-2">
                    Expansion
                  </h3>
                  <p className="text-gray-700">
                    Throughout 2024, we expanded our portfolio to include diverse technology sectors
                    including AI, blockchain, renewable energy, and digital transformation solutions.
                    Our global network grew significantly as we established partnerships worldwide.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center">
                <div className="flex-shrink-0 w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mb-4 md:mb-0 md:mr-6">
                  <span className="text-white font-bold text-lg">2025</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-primary-900 mb-2">
                    Future Vision
                  </h3>
                  <p className="text-gray-700">
                    Looking ahead to 2025 and beyond, Arkham Ventures continues to focus on emerging
                    technologies and sustainable innovation. We remain committed to building ventures
                    that not only generate financial returns but also contribute positively to society.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
