import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateResponse } from '@/lib/gemini';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const { query, parentId } = await request.json();

        if (!query) {
            return NextResponse.json(
                { error: 'Query is required' },
                { status: 400 }
            );
        }

        // Generate AI response
        const aiResponse = await generateResponse(query);

        const db = await getDb();
        const mindmaps = db.collection('mindmaps');

        const mindmap = await mindmaps.findOne({ userId: user.userId });

        if (!mindmap) {
            return NextResponse.json(
                { error: 'Mindmap not found' },
                { status: 404 }
            );
        }

        const nodes = mindmap.nodes as any[] || [];
        const edges = mindmap.edges as any[] || [];

        // Calculate position based on chain logic
        let position = { x: 0, y: 0 };
        let chainId = '';

        if (parentId) {
            // Branching: create child node
            const parent = nodes.find((n: any) => n.id === parentId);
            if (parent) {
                position = {
                    x: parent.position.x + 300,
                    y: parent.position.y,
                };
                chainId = parent.chainId;
            }
        } else {
            // New chain: find the bottom-most chain and place below
            if (nodes.length > 0) {
                const chains = new Map<string, { maxY: number; x: number }>();

                nodes.forEach((node: any) => {
                    const current = chains.get(node.chainId) || { maxY: -Infinity, x: 0 };
                    if (node.position.y > current.maxY) {
                        chains.set(node.chainId, { maxY: node.position.y, x: node.position.x });
                    }
                });

                let maxChainY = -Infinity;
                let chainX = 0;

                chains.forEach((value) => {
                    if (value.maxY > maxChainY) {
                        maxChainY = value.maxY;
                        chainX = value.x;
                    }
                });

                position = { x: chainX, y: maxChainY + 250 };
            }

            chainId = `chain-${Date.now()}`;
        }

        // Create new node
        const newNode = {
            id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            parentId: parentId || null,
            query,
            response: aiResponse,
            position,
            chainId,
            createdAt: new Date(),
        };

        // Create edge if there's a parent
        let newEdge = null;
        if (parentId) {
            newEdge = {
                id: `edge-${Date.now()}`,
                source: parentId,
                target: newNode.id,
            };
        }

        // Update mindmap
        const updateData: any = {
            nodes: [...nodes, newNode],
            updatedAt: new Date(),
        };

        if (newEdge) {
            updateData.edges = [...edges, newEdge];
        }

        await mindmaps.updateOne(
            { userId: user.userId },
            { $set: updateData }
        );

        return NextResponse.json(
            {
                node: newNode,
                edge: newEdge,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Update mindmap error:', error);
        return NextResponse.json(
            { error: 'Failed to update mindmap' },
            { status: 500 }
        );
    }
}
