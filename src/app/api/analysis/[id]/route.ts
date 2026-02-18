import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch analysis with project info
    const { data: analysis, error: analysisError } = await supabase
      .from("analyses")
      .select(
        `
        id,
        site_title,
        site_description,
        product_summary,
        target_audience,
        content_angles,
        created_at,
        projects!inner (
          id,
          url,
          user_id
        )
      `
      )
      .eq("id", id)
      .single();

    if (analysisError || !analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }

    // Fetch keywords
    const { data: keywords } = await supabase
      .from("keywords")
      .select("*")
      .eq("analysis_id", id)
      .order("opportunity_score", { ascending: false });

    // Fetch competitors
    const { data: competitors } = await supabase
      .from("competitors")
      .select("*")
      .eq("analysis_id", id);

    const project = Array.isArray(analysis.projects)
      ? analysis.projects[0]
      : analysis.projects;

    return NextResponse.json({
      site: {
        url: project?.url ?? "",
        title: analysis.site_title,
        description: analysis.site_description,
      },
      analysis: {
        productSummary: analysis.product_summary,
        targetAudience: analysis.target_audience,
        contentAngles: analysis.content_angles,
      },
      competitors:
        competitors?.map((c) => ({
          name: c.name,
          url: c.url,
          reason: c.reason,
        })) ?? [],
      keywords:
        keywords?.map((k) => ({
          keyword: k.keyword,
          intent: k.intent,
          relevance: k.relevance,
          category: k.category ?? "broad",
          searchVolume: k.search_volume,
          cpc: Number(k.cpc),
          competition: Number(k.competition),
          competitionLevel: k.competition_level,
          trend: k.trend ?? [],
          opportunityScore: k.opportunity_score,
          source: k.source ?? "seed",
        })) ?? [],
    });
  } catch (error) {
    console.error("Fetch analysis error:", error);
    return NextResponse.json(
      { error: "Failed to load analysis" },
      { status: 500 }
    );
  }
}
