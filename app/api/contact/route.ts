import { NextRequest, NextResponse } from 'next/server'

interface ContactFormData {
  name: string
  email: string
  message: string
}

// Email validation function
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Rate limiting (simple in-memory implementation)
// In production, consider using Redis or a database
const submissions = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_SUBMISSIONS_PER_WINDOW = 3

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const userSubmissions = submissions.get(ip) || []

  // Filter out submissions outside the window
  const recentSubmissions = userSubmissions.filter(
    timestamp => now - timestamp < RATE_LIMIT_WINDOW
  )

  // Update the map
  submissions.set(ip, recentSubmissions)

  // Check if user has exceeded the limit
  if (recentSubmissions.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    return true
  }

  // Add current submission
  recentSubmissions.push(now)
  submissions.set(ip, recentSubmissions)

  return false
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown'

    // Check rate limiting
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { message: 'Too many submissions. Please try again later.' },
        { status: 429 }
      )
    }

    const body: ContactFormData = await request.json()

    // Validate required fields
    if (!body.name || !body.email || !body.message) {
      return NextResponse.json(
        { message: 'All fields are required.' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!isValidEmail(body.email)) {
      return NextResponse.json(
        { message: 'Please provide a valid email address.' },
        { status: 400 }
      )
    }

    // Validate message length
    if (body.message.length < 10) {
      return NextResponse.json(
        { message: 'Message must be at least 10 characters long.' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedData = {
      name: body.name.trim().substring(0, 100),
      email: body.email.trim().toLowerCase(),
      message: body.message.trim().substring(0, 1000),
      timestamp: new Date().toISOString(),
      ip: ip
    }

    // Here you would typically:
    // 1. Send email using a service like SendGrid, Mailgun, or Resend
    // 2. Store in database (Vercel KV, MongoDB, etc.)
    // 3. Send to a CRM system

    // For this example, we'll log to console and simulate success
    console.log('Contact form submission:', {
      ...sanitizedData,
      // Don't log IP in production for privacy
    })

    // Simulate email sending (replace with actual email service)
    try {
      // Example: Send email to business owner
      const emailContent = `
New contact form submission from Arkham Ventures website:

Name: ${sanitizedData.name}
Email: ${sanitizedData.email}
Message: ${sanitizedData.message}

Timestamp: ${sanitizedData.timestamp}
      `.trim()

      // In a real implementation, you would use an email service here
      // For example with Resend:
      // const resend = new Resend(process.env.RESEND_API_KEY)
      // await resend.emails.send({
      //   from: 'noreply@arkham.ventures',
      //   to: process.env.CONTACT_EMAIL || 'info@arkham.ventures',
      //   subject: 'New Contact Form Submission',
      //   text: emailContent,
      // })

      console.log('Email would be sent:', emailContent)

    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      // Don't fail the request if email fails, just log it
    }

    return NextResponse.json(
      {
        message: 'Message sent successfully!',
        success: true
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { message: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
