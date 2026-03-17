import 'reflect-metadata';
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/database';
import { Calculation } from '@/lib/entities/Calculation';

export async function GET() {
  try {
    const ds = await getDataSource();
    const repo = ds.getRepository(Calculation);
    const calculations = await repo.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });
    return NextResponse.json(calculations);
  } catch (error) {
    console.error('GET /api/calculations error:', error);
    return NextResponse.json({ error: 'Failed to fetch calculations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { expression, result } = body;

    if (!expression || !result) {
      return NextResponse.json({ error: 'Missing expression or result' }, { status: 400 });
    }

    const ds = await getDataSource();
    const repo = ds.getRepository(Calculation);
    const calc = repo.create({ expression, result });
    const saved = await repo.save(calc);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error('POST /api/calculations error:', error);
    return NextResponse.json({ error: 'Failed to save calculation' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const ds = await getDataSource();
    const repo = ds.getRepository(Calculation);
    await repo.clear();
    return NextResponse.json({ message: 'History cleared' });
  } catch (error) {
    console.error('DELETE /api/calculations error:', error);
    return NextResponse.json({ error: 'Failed to clear calculations' }, { status: 500 });
  }
}
