import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { postInputSchema } from "@/lib/validators";
import { buildPostData } from "@/lib/posts";

// Create a new post.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = postInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid data" },
      { status: 400 }
    );
  }

  const { data, tags } = await buildPostData(parsed.data);

  const post = await prisma.post.create({
    data: {
      ...data,
      authorId: session.sub,
      tags: { connect: tags },
    },
  });

  return NextResponse.json({ id: post.id, slug: post.slug });
}
