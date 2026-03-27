import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/assert-admin'
import { createClient } from '@/lib/auth-client-server'

const API_BASE = 'https://api.almostcrackd.ai'

async function getToken(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

export async function POST(request: Request, { params: _params }: { params: Promise<{ id: string }> }) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getToken()
  if (!token) return NextResponse.json({ error: 'No session token' }, { status: 401 })

  const { image_url } = await request.json()
  if (!image_url) return NextResponse.json({ error: 'image_url is required' }, { status: 400 })

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  // Step 1: Register the image with the pipeline
  const registerRes = await fetch(`${API_BASE}/pipeline/upload-image-from-url`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ imageUrl: image_url, isCommonUse: false }),
  })
  const registerData = await registerRes.json()
  if (!registerRes.ok) {
    return NextResponse.json(
      { error: registerData.message ?? 'Failed to register image', raw: registerData },
      { status: registerRes.status }
    )
  }

  // The API may return imageId, id, or image_id depending on the response shape
  const imageId = registerData.imageId ?? registerData.id ?? registerData.image_id
  if (!imageId) {
    return NextResponse.json(
      { error: 'No imageId returned from image registration', raw: registerData },
      { status: 500 }
    )
  }

  // Step 2: Generate captions using the active humor_flavor_mix config
  const captionsRes = await fetch(`${API_BASE}/pipeline/generate-captions`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ imageId }),
  })
  const captionsData = await captionsRes.json()
  if (!captionsRes.ok) {
    return NextResponse.json(
      { error: captionsData.message ?? 'Failed to generate captions', raw: captionsData },
      { status: captionsRes.status }
    )
  }

  return NextResponse.json({ imageId, result: captionsData })
}