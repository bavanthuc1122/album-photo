import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Các routes cần bảo vệ
  const protectedRoutes = ['/albums', '/trash'];
  
  // Cho phép truy cập public vào /albums/[slug] (share links)
  if (request.nextUrl.pathname.startsWith('/albums/') && !protectedRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  // Kiểm tra auth cho protected routes
  if (protectedRoutes.includes(request.nextUrl.pathname)) {
    const token = request.cookies.get('token')
    const user = request.cookies.get('user')
    
    if (!token || !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      const userData = JSON.parse(user.value)
      if (!userData.username) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    } catch (error) {
      console.error('Invalid user data:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/albums',
    '/albums/:path*',
    '/trash'
  ]
}