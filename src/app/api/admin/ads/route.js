import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkSitePermission } from '@/lib/apiAuth';
import { z } from 'zod';
import { apiSuccess } from '@/core/errors';

const CreateAdSchema = z.object({
  zoneId: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['banner', 'adsense']),
  code: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  targetUrl: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

export async function GET(req) {
  const auth = await checkSitePermission(req, 'EDITOR');
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const ads = await prisma.ad.findMany({
      where: {
        zone: { siteId: auth.siteId }
      },
      include: {
        zone: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(apiSuccess({ ads }));
  } catch (err) {
    console.error('Fetch ads error:', err);
    return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = await checkSitePermission(req, 'EDITOR');
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const body = await req.json();
    const data = CreateAdSchema.parse(body);
    const zone = await prisma.adZone.findFirst({
      where: {
        id: data.zoneId,
        siteId: auth.siteId
      }
    });
    if (!zone) {
      return NextResponse.json({ error: 'Selected zone not found for this site' }, { status: 404 });
    }
    const ad = await prisma.ad.create({
      data: {
        zoneId: data.zoneId,
        name: data.name,
        type: data.type,
        code: data.code || null,
        imageUrl: data.imageUrl || null,
        targetUrl: data.targetUrl || null,
        isActive: data.isActive,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      }
    });
    return NextResponse.json(apiSuccess({ ad }), { status: 201 });
  } catch (err) {
    console.error('Create ad error:', err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create ad' }, { status: 500 });
  }
}
