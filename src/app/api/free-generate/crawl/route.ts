import { NextRequest, NextResponse } from "next/server";
import { crawlUrl } from "@/lib/engine/crawler";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const crawlData = await crawlUrl(normalizedUrl);

    return NextResponse.json({
      url: crawlData.url,
      title: crawlData.title,
      description: crawlData.metaDescription,
      ogImage: crawlData.ogData?.image ?? null,
      _ip: ip,
    });
  } catch (error) {
    console.error("Free crawl error:", error);
    return NextResponse.json(
      { error: "Could not reach this website. Please check the URL." },
      { status: 422 }
    );
  }
}
