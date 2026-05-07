import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that don't need authentication
const PUBLIC_ROUTES = ['/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(
    route => pathname.startsWith(route)
  )

  // Get token from cookies (Next.js middleware can't read localStorage)
  const token = request.cookies.get('access_token')?.value

  // Not logged in + trying to access protected route → redirect to login
  if (!isPublicRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Already logged in + trying to access login → redirect to billing
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/billing', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}