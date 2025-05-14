import { NextResponse } from 'next/server';
import { getDesignById } from '@/app/utils/DataAccess';
export async function GET(request: Request, { params }: { params: Promise<{ designId: string }> }) {
  const { designId } = await params;

  try {
    // Parse designId as an integer
    const id = parseInt(designId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid designId' }, { status: 400 });
    }

    // Fetch design using dataAccess
    const design = await getDesignById(id);

    // Check if design exists
    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }

    // Return the design
    return NextResponse.json(design, { status: 200 });
  } catch (error) {
    console.error('Error fetching design:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}