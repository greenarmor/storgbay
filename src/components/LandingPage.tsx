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
        const layers = gsap.utils.toArray<HTMLElement>(
          ".landing-parallax-layer",
        );
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

  const primaryCtaHref = isAuthenticated ? "/dashboard" : "/login";
  const primaryCtaLabel = isAuthenticated ? "Open my drive" : "Start uploading";

  return (
    <div ref={containerRef} className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero-content">
          <span className="landing-badge">BUILT FOR VELOCITY</span>
          <h1>
            Everything you need to keep content flowing
            <span className="landing-highlight"> beautifully.</span>
          </h1>
          <p>
            Storgbay is your creative team's command center for assets. Upload
            once, collaborate from anywhere, and deliver experiences that wow
            your clients.
          </p>
        </div>
      </section>
    </div>
  );
}
