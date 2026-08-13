import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { makeSlug } from "@/lib/posts";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = makeSlug(parsed.data.name);
  if (!slug) return NextResponse.json({ error: "Invalid name" }, { status: 400 });

  const existing = await prisma.category.findFirst({
    where: { OR: [{ slug }, { name: parsed.data.name }] },
  });
  if (existing) return NextResponse.json({ error: "Category already exists" }, { status: 409 });

  const category = await prisma.category.create({
    data: { name: parsed.data.name, slug, description: parsed.data.description || null },
  });
  return NextResponse.json({ id: category.id, slug: category.slug });
}
