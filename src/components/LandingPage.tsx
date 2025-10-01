"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

const featureHighlights = [
  {
    title: "Effortless uploads",
    description:
      "Send entire folders or high-resolution galleries in seconds with Storgbay's optimized pipeline.",
  },
  {
    title: "Crystal-clear organization",
    description:
      "Keep your creative workspaces tidy with smart collections, powerful search, and instant previews.",
  },
  {
    title: "Share on your terms",
    description:
      "Collaborate securely with password-protected links, expiring shares, and real-time analytics.",
  },
];

export function LandingPage({ isAuthenticated }: { isAuthenticated: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: { revert: () => void } | null = null;
    let active = true;

    const initGsap = async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      if (!active || !containerRef.current) {
        return;
      }

      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const layers = gsap.utils.toArray<HTMLElement>(".landing-parallax-layer");
        layers.forEach((layer) => {
          const depth = Number(layer.dataset.depth ?? 0.25);
          gsap.to(layer, {
            yPercent: depth * 20,
            ease: "none",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
        });

        gsap.utils.toArray<HTMLElement>(".feature-card").forEach((card) => {
          gsap.fromTo(
            card,
            { y: 48, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: {
                trigger: card,
                start: "top 80%",
              },
            },
          );
        });
      }, containerRef);
    };

    initGsap();

    document.body.classList.add("landing-active");

    return () => {
      active = false;
      document.body.classList.remove("landing-active");
      ctx?.revert();
    };
  }, []);

  const primaryCtaHref = isAuthenticated ? "/dashboard" : "/api/auth/signin";
  const primaryCtaLabel = isAuthenticated ? "Open my drive" : "Start uploading";

  return (
    <div ref={containerRef} className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero-content">
          <span className="landing-badge">Cloud-native media hub</span>
          <h1>
            Store, organize, and share
            <span className="landing-highlight"> beautifully.</span>
          </h1>
          <p>
            Storgbay is your creative team's command center for assets. Upload once, collaborate from anywhere, and
            deliver experiences that wow your clients.
          </p>
          <div className="landing-cta-group">
            <Link className="landing-cta primary" href={primaryCtaHref}>
              {primaryCtaLabel}
            </Link>
            <Link className="landing-cta secondary" href="/gallery">
              Explore public galleries
            </Link>
          </div>
          <div className="landing-stats">
            <div>
              <strong>12k+</strong>
              <span>files distributed every week</span>
            </div>
            <div>
              <strong>99.9%</strong>
              <span>uptime for mission-critical delivery</span>
            </div>
            <div>
              <strong>256-bit</strong>
              <span>end-to-end encryption</span>
            </div>
          </div>
        </div>
        <div className="landing-hero-visual">
          <div className="landing-parallax">
            <div className="landing-parallax-layer" data-depth="0.15" />
            <div className="landing-parallax-layer" data-depth="0.3" />
            <div className="landing-parallax-layer" data-depth="0.45" />
          </div>
          <div className="landing-hero-card">
            <p className="landing-hero-card-title">Recent uploads</p>
            <ul>
              <li>
                <span className="item-info">
                  <span className="dot" />
                  <span>Brand campaign shots</span>
                </span>
                <span className="meta">1.2 GB</span>
              </li>
              <li>
                <span className="item-info">
                  <span className="dot" />
                  <span>Product teasers</span>
                </span>
                <span className="meta">768 MB</span>
              </li>
              <li>
                <span className="item-info">
                  <span className="dot" />
                  <span>Investor deck</span>
                </span>
                <span className="meta">12 pages</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <header>
          <span className="landing-eyebrow">Built for velocity</span>
          <h2>Everything you need to keep content flowing</h2>
          <p>
            From onboarding freelancers to shipping campaigns, Storgbay empowers modern teams with instant access,
            granular permissions, and beautiful viewing experiences.
          </p>
        </header>
        <div className="landing-feature-grid">
          {featureHighlights.map((feature) => (
            <article key={feature.title} className="feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section--cta">
        <div className="landing-cta-panel">
          <h2>Ready to launch faster?</h2>
          <p>
            Consolidate every file, feedback loop, and delivery into a single source of truth. Join creators who rely on
            Storgbay to ship outstanding work at record speed.
          </p>
          <div className="landing-cta-group">
            <Link className="landing-cta primary" href={primaryCtaHref}>
              {primaryCtaLabel}
            </Link>
            <Link className="landing-cta secondary" href="mailto:hello@storgbay.com">
              Talk to sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
