import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()
    
    // S'inscrire via Better Auth
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: result
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

