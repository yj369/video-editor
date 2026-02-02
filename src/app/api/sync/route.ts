import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import { EditorState } from '@/lib/db/models';

export async function POST(req: NextRequest) {
  try {
    const mongoose = await dbConnect();
    console.log(`[Sync] Connected to DB: ${mongoose.connection.name}`); // Debug: Database name

    const body = await req.json();
    const { projectId, ...data } = body;

    console.log(`[Sync] Syncing project: ${projectId}`); // Debug: Project ID

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    // Upsert: update if exists, insert if not
    const updatedState = await EditorState.findOneAndUpdate(
      { projectId },
      { projectId, ...data },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`[Sync] Write result:`, updatedState ? 'Success' : 'Null'); // Debug: Write result

    return NextResponse.json({ success: true, data: updatedState });
  } catch (error: any) {
    console.error('[Sync] POST error:', error);
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

    const state = await EditorState.findOne({ projectId });

    if (!state) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: state });
  } catch (error: any) {
    console.error('Sync GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
