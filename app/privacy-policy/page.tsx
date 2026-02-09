import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Reveal from '@/components/Reveal'

export const metadata = {
  title: 'Privacy Policy - James Almeida',
  description: 'Privacy policy for jamesalmeida.me and related services.',
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        <section className="hero-gradient text-white py-24 md:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute -top-20 -right-24 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />
            <div className="absolute bottom-0 left-10 h-72 w-72 rounded-full bg-accent-500/10 blur-3xl" />
          </div>
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          <div className="max-w-4xl mx-auto relative z-10">
            <Reveal>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-center leading-tight">
                Privacy Policy
              </h1>
              <p className="text-lg text-primary-100/80 text-center">
                Last updated: February 9, 2026
              </p>
            </Reveal>
          </div>
        </section>

        <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert prose-headings:text-primary-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-li:text-gray-700 dark:prose-li:text-gray-300">
            <Reveal>
              <h2>Introduction</h2>
              <p>
                James Almeida (&quot;I,&quot; &quot;me,&quot; or &quot;my&quot;) operates jamesalmeida.me (the &quot;Site&quot;).
                This Privacy Policy explains how I collect, use, and protect information when you visit
                the Site or use my consulting services.
              </p>
              <p>
                I respect your privacy and am committed to protecting any personal data you share with me.
              </p>
            </Reveal>

            <Reveal>
              <h2>Information I Collect</h2>

              <h3>Information You Provide</h3>
              <p>When you contact me through the Site, I may collect:</p>
              <ul>
                <li>Your name</li>
                <li>Email address</li>
                <li>Phone number (if provided)</li>
                <li>Company name (if provided)</li>
                <li>Any other information you include in your message</li>
              </ul>

              <h3>Automatically Collected Information</h3>
              <p>When you visit the Site, certain information may be collected automatically, including:</p>
              <ul>
                <li>IP address</li>
                <li>Browser type and version</li>
                <li>Pages visited and time spent</li>
                <li>Referring website</li>
                <li>Device type and operating system</li>
              </ul>
            </Reveal>

            <Reveal>
              <h2>How I Use Your Information</h2>
              <p>I use the information collected to:</p>
              <ul>
                <li>Respond to your inquiries and provide consulting services</li>
                <li>Improve the Site and user experience</li>
                <li>Send relevant communications (only with your consent)</li>
                <li>Comply with legal obligations</li>
              </ul>
            </Reveal>

            <Reveal>
              <h2>Third-Party Services</h2>
              <p>The Site may use the following third-party services:</p>
              <ul>
                <li><strong>Vercel</strong> — hosting and analytics</li>
                <li><strong>Cal.com</strong> — scheduling and booking</li>
              </ul>
              <p>
                Each of these services has its own privacy policy governing how they handle your data.
                I encourage you to review their respective policies.
              </p>
            </Reveal>

            <Reveal>
              <h2>Cookies</h2>
              <p>
                The Site may use cookies and similar technologies to enhance your browsing experience.
                You can control cookie preferences through your browser settings. Disabling cookies may
                affect certain features of the Site.
              </p>
            </Reveal>

            <Reveal>
              <h2>Data Sharing</h2>
              <p>
                I do not sell, trade, or rent your personal information to third parties. I may share
                your information only in the following circumstances:
              </p>
              <ul>
                <li>With your explicit consent</li>
                <li>To comply with legal requirements or respond to lawful requests</li>
                <li>To protect my rights, privacy, safety, or property</li>
              </ul>
            </Reveal>

            <Reveal>
              <h2>Data Security</h2>
              <p>
                I take reasonable measures to protect your personal information from unauthorized access,
                alteration, disclosure, or destruction. However, no method of transmission over the
                internet is 100% secure, and I cannot guarantee absolute security.
              </p>
            </Reveal>

            <Reveal>
              <h2>Data Retention</h2>
              <p>
                I retain personal information only for as long as necessary to fulfill the purposes
                outlined in this policy, unless a longer retention period is required by law.
              </p>
            </Reveal>

            <Reveal>
              <h2>Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Request access to the personal data I hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p>
                To exercise any of these rights, please contact me using the information below.
              </p>
            </Reveal>

            <Reveal>
              <h2>Children&apos;s Privacy</h2>
              <p>
                The Site is not directed at individuals under the age of 13. I do not knowingly collect
                personal information from children. If you believe a child has provided me with personal
                data, please contact me so I can take appropriate action.
              </p>
            </Reveal>

            <Reveal>
              <h2>Changes to This Policy</h2>
              <p>
                I may update this Privacy Policy from time to time. Changes will be posted on this page
                with an updated revision date. I encourage you to review this policy periodically.
              </p>
            </Reveal>

            <Reveal>
              <h2>Contact</h2>
              <p>
                If you have any questions about this Privacy Policy, please reach out through the{' '}
                <a href="/contact" className="text-accent-500 hover:text-accent-400">contact page</a>.
              </p>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
