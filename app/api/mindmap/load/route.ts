import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
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

        let mindmap = await mindmaps.findOne({ userId: user.userId });

        // Create default mindmap if none exists
        if (!mindmap) {
            const result = await mindmaps.insertOne({
                userId: user.userId,
                nodes: [],
                edges: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            mindmap = await mindmaps.findOne({ _id: result.insertedId });
        }

        return NextResponse.json(
            {
                nodes: mindmap?.nodes || [],
                edges: mindmap?.edges || [],
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Load mindmap error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
