import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import { Asset } from '@/lib/db/models';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { projectId, assetId, ...data } = body;

    if (!projectId || !assetId) {
      return NextResponse.json({ error: 'Missing projectId or assetId' }, { status: 400 });
    }

    // Upsert individual asset
    await Asset.findOneAndUpdate(
      { projectId, assetId },
      { projectId, assetId, ...data },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, id: assetId });
  } catch (error: any) {
    console.error('Asset Sync POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    // Find all assets for this project
    const assets = await Asset.find({ projectId });

    return NextResponse.json({ success: true, data: assets });
  } catch (error: any) {
    console.error('Asset Sync GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
