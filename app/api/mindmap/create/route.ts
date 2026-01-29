import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const db = await getDb();
        const mindmaps = db.collection('mindmaps');

        const result = await mindmaps.insertOne({
            userId: user.userId,
            nodes: [],
            edges: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return NextResponse.json(
            { message: 'Mindmap created', mindmapId: result.insertedId },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create mindmap error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
