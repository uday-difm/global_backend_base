import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess } from '@/core/errors';

export async function POST(req) {
  try {
    const body = await req.json();
    const adId = body.adId;
    const type = body.type || body.action;
    if (!adId || !['impression', 'click'].includes(type)) {
      return NextResponse.json({ error: 'Invalid adId or tracking type' }, { status: 400 });
    }
    const ad = await prisma.ad.findUnique({
      where: { id: adId }
    });
    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }
    const ipAddress = req.headers.get('x-forwarded-for') || req.ip || null;
    const userAgent = req.headers.get('user-agent') || null;
    await prisma.$transaction([
      prisma.ad.update({
        where: { id: adId },
        data: {
          impressions: type === 'impression' ? { increment: 1 } : undefined,
          clicks: type === 'click' ? { increment: 1 } : undefined,
        }
      }),
      prisma.adAnalytic.create({
        data: {
          adId,
          type,
          ipAddress,
          userAgent,
        }
      })
    ]);
    return NextResponse.json(apiSuccess({ success: true }));
  } catch (err) {
    console.error('Ad tracking error:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 });
  }
}
