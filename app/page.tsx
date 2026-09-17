import Link from "next/link";
import { ArrowRight, FileText, ScanSearch, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 py-4">
          <span className="font-serif text-lg">ResumeForge AI</span>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-ink-soft">
            <a href="#how-it-works" className="hover:text-ink">
              How it works
            </a>
            <a href="#principles" className="hover:text-ink">
              Principles
            </a>
          </nav>
          <Link
            href="/dashboard"
            className="text-sm font-medium bg-navy text-paper-alt px-4 py-2 rounded-md hover:bg-navy-dark transition-colors"
          >
            Start Tailoring
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-14 pb-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs tracking-wide text-brass font-medium mb-4">One-Page ATS Resume Tailor</p>
          <h1 className="font-serif text-[2.6rem] sm:text-[3.2rem] leading-[1.08] text-ink">
            Tailor your resume to every job. Stay one page. Stay ATS-ready.
          </h1>
          <p className="mt-5 text-[15px] text-ink-soft max-w-md leading-relaxed">
            Paste a job description, analyze your resume, optimize the content, and generate a
            job-specific one-page resume with transparent ATS alignment.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-navy text-paper-alt px-5 py-3 rounded-md text-sm font-medium hover:bg-navy-dark transition-colors"
            >
              Start Tailoring <ArrowRight size={15} />
            </Link>
            <Link
              href="/dashboard?upload=1"
              className="inline-flex items-center gap-2 border border-navy/30 text-navy px-5 py-3 rounded-md text-sm font-medium hover:bg-navy-soft/40 transition-colors"
            >
              Upload Resume
            </Link>
          </div>
          <p className="mt-6 text-xs text-ink-soft">
            No account needed to try it. Your resume isn&rsquo;t stored on our servers by default.
          </p>
        </div>

        <HeroPreview />
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-line bg-paper-alt/60">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <h2 className="font-serif text-2xl mb-8">How it works</h2>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { n: "01", title: "Bring your resume", body: "Paste your text, upload a file, or use your saved master resume as the factual baseline." },
              { n: "02", title: "Paste the job description", body: "We extract required skills, preferred skills, tools, and responsibilities." },
              { n: "03", title: "Review the alignment", body: "See exactly what matches, what's missing, and why your score is what it is." },
              { n: "04", title: "Tailor and export", body: "Get a truthful, one-page, ATS-readable resume as PDF or DOCX." },
            ].map((step) => (
              <li key={step.n}>
                <div className="text-2xl font-serif text-brass mb-2">{step.n}</div>
                <h3 className="font-medium text-[15px] mb-1.5">{step.title}</h3>
                <p className="text-sm text-ink-soft leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Principles */}
      <section id="principles" className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="font-serif text-2xl mb-8">Built around one promise</h2>
        <p className="max-w-2xl text-ink-soft text-[15px] leading-relaxed mb-10">
          Give me the strongest truthful version of my resume for this specific job — while keeping
          it one page and ATS-readable.
        </p>
        <div className="grid sm:grid-cols-3 gap-8">
          <Principle
            icon={<ShieldCheck size={18} />}
            title="Truthful by design"
            body="We never invent employers, titles, certifications, or metrics. Missing skills are flagged, not fabricated."
          />
          <Principle
            icon={<ScanSearch size={18} />}
            title="Transparent scoring"
            body="Every point in your ATS alignment score traces back to specific evidence in your resume — never a black box."
          />
          <Principle
            icon={<FileText size={18} />}
            title="One page, always"
            body="Automatic layout checks keep your resume to a single, readable page without shrinking type past legibility."
          />
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="max-w-6xl mx-auto px-5 py-8 text-xs text-ink-soft space-y-2">
          <p>
            ATS scores are estimates. Different applicant tracking systems use different parsing and
            ranking methods. This score measures alignment against the supplied job description and
            resume content; it does not guarantee an interview or application outcome.
          </p>
          <p>
            Your resume is your personal data. This application does not require permanent storage of
            your resume for the core tailoring workflow.
          </p>
        </div>
      </footer>
    </main>
  );
}

function Principle({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="border border-line rounded-lg p-5 bg-paper-alt">
      <div className="w-8 h-8 rounded-full bg-navy-soft/60 text-navy flex items-center justify-center mb-3">{icon}</div>
      <h3 className="font-medium text-[15px] mb-1.5">{title}</h3>
      <p className="text-sm text-ink-soft leading-relaxed">{body}</p>
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="relative">
      <div className="border border-line rounded-lg bg-paper-alt shadow-[0_1px_0_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-line text-[11px]">
          <div className="p-4">
            <p className="text-ink-soft mb-2 font-medium">Job Description</p>
            <div className="space-y-1.5 text-ink-soft">
              <p className="h-2 bg-line/70 rounded w-[90%]" />
              <p className="h-2 bg-line/70 rounded w-[75%]" />
              <p className="h-2 bg-brass-soft rounded w-[60%]" />
              <p className="h-2 bg-line/70 rounded w-[82%]" />
              <p className="h-2 bg-brass-soft rounded w-[55%]" />
            </div>
          </div>
          <div className="p-4">
            <p className="text-ink-soft mb-2 font-medium">Your Resume</p>
            <div className="space-y-1.5">
              <p className="h-2 bg-forest-soft rounded w-[85%]" />
              <p className="h-2 bg-line/70 rounded w-[70%]" />
              <p className="h-2 bg-forest-soft rounded w-[65%]" />
              <p className="h-2 bg-line/70 rounded w-[78%]" />
              <p className="h-2 bg-clay-soft rounded w-[50%]" />
            </div>
          </div>
        </div>
        <div className="border-t border-line px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-forest/70 flex items-center justify-center text-[11px] font-serif">
            87
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-medium">ATS Alignment</p>
            <p className="text-[10px] text-ink-soft">Strong alignment</p>
          </div>
          <div className="flex gap-1">
            <span className="text-[9px] bg-forest-soft text-forest px-1.5 py-0.5 rounded-full">SIEM</span>
            <span className="text-[9px] bg-clay-soft text-clay px-1.5 py-0.5 rounded-full">Splunk</span>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 w-24 h-32 bg-paper-alt border border-line rounded-md shadow-sm p-2 hidden sm:block">
        <div className="h-1.5 bg-navy/70 rounded w-2/3 mb-1.5" />
        <div className="space-y-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-1 bg-line rounded" style={{ width: `${90 - i * 6}%` }} />
          ))}
        </div>
        <p className="text-[7px] text-ink-soft mt-1.5 text-center">One page</p>
      </div>
    </div>
  );
}
