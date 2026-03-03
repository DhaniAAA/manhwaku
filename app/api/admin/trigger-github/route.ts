import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const GITHUB_REPO = process.env.GITHUB_REPO; // e.g. "DhaniAAA/manhwaku"
const WORKFLOW_FILE = "scrape.yml";

export async function POST(req: NextRequest) {
    if (!GITHUB_TOKEN || !GITHUB_REPO) {
        return NextResponse.json(
            { error: "GITHUB_PAT and GITHUB_REPO must be set in environment variables." },
            { status: 500 }
        );
    }

    const body = await req.json().catch(() => ({}));
    const {
        mode = "not_synced",
        max_per_run = "30",
        delay_ms = "3000",
        scrape_images = "false",
    } = body as { mode?: string; max_per_run?: string; delay_ms?: string; scrape_images?: string };

    try {
        const res = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ref: "master",
                    inputs: {
                        mode,
                        max_per_run: String(max_per_run),
                        delay_ms: String(delay_ms),
                        scrape_images: String(scrape_images),
                    },
                }),
            }
        );

        if (res.status === 204) {
            return NextResponse.json({ success: true, message: "GitHub Actions workflow triggered!" });
        }

        const data = await res.json().catch(() => ({}));
        return NextResponse.json(
            { error: data.message || `GitHub API error: ${res.status}` },
            { status: res.status }
        );
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function GET() {
    if (!GITHUB_TOKEN || !GITHUB_REPO) {
        return NextResponse.json({ runs: [], error: "GITHUB_PAT/GITHUB_REPO not configured" });
    }

    try {
        const res = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/runs?per_page=5`,
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
                cache: "no-store",
            }
        );
        const data = await res.json();
        return NextResponse.json({
            runs: (data.workflow_runs ?? []).map((r: any) => ({
                id: r.id,
                status: r.status,         // queued | in_progress | completed
                conclusion: r.conclusion, // success | failure | null
                created_at: r.created_at,
                html_url: r.html_url,
                name: r.display_title ?? r.name,
            })),
        });
    } catch (err: any) {
        return NextResponse.json({ runs: [], error: err.message });
    }
}
