"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Menu, X } from "lucide-react";

const navLinks = [
  {
    label: "SEO Toolkit",
    href: "#",
    children: [
      { label: "AI Content Scorer", href: "/tools/ai-content-scorer" },
      { label: "Headline Analyzer", href: "/tools/headline-analyzer" },
      { label: "Keyword Density", href: "/tools/keyword-density" },
      { label: "SERP Preview", href: "/tools/serp-preview" },
    ],
  },
  { label: "Pricing", href: "/#pricing" },
  {
    label: "Resources",
    href: "#",
    children: [
      { label: "Blog", href: "/blog" },
      { label: "About", href: "/about" },
    ],
  },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 80) {
        setVisible(true);
      } else {
        setVisible(currentY < lastScrollY.current);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 right-0 left-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl transition-transform duration-300 md:translate-y-0 md:px-8 ${visible ? "translate-y-0" : "-translate-y-full"}`}>
      {/* Left — Logo */}
      <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
        <Image src="/Logo Octoboost.png" alt="OctoBoost logo — automated SEO content engine" width={120} height={120} className="h-9 w-9 object-contain" priority />
        <span className="text-lg font-bold tracking-tight">OctoBoost</span>
      </Link>

      {/* Center — Nav links */}
      <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
        {navLinks.map((link) =>
          link.children ? (
            <div
              key={link.label}
              className="relative"
              onMouseEnter={() => setOpenDropdown(link.label)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:text-foreground">
                {link.label}
                <ChevronDown className={`h-3 w-3 transition-transform ${openDropdown === link.label ? "rotate-180" : ""}`} />
              </button>
              {openDropdown === link.label && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2">
                  <div className="min-w-[180px] rounded-lg border border-border bg-card p-1 shadow-lg">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-card-hover hover:text-foreground"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          )
        )}
      </div>

      {/* Right — Demo + Login */}
      <div className="hidden items-center gap-3 md:flex">
        <Link
          href="/demo"
          className="rounded-lg border border-accent px-4 py-1.5 text-sm font-medium text-accent-light transition-all hover:bg-accent/10 hover:shadow-[0_0_12px_rgba(108,92,231,0.25)]"
        >
          Try the Demo
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-muted transition-colors hover:border-accent/50 hover:text-foreground"
        >
          Login
        </Link>
      </div>

      {/* Mobile toggle */}
      <button
        className="rounded-lg p-2 text-muted transition-colors hover:text-foreground md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-16 right-0 left-0 border-b border-border bg-background p-4 md:hidden">
          {navLinks.map((link) =>
            link.children ? (
              <div key={link.label} className="mb-2">
                <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-muted/50">
                  {link.label}
                </p>
                {link.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className="block rounded-md px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="block rounded-md px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            )
          )}
          <Link
            href="/demo"
            className="mt-3 flex w-full items-center justify-center rounded-lg bg-accent/10 py-2.5 text-sm font-medium text-accent-light transition-colors hover:bg-accent/20"
            onClick={() => setMobileOpen(false)}
          >
            Try the Demo
          </Link>
          <Link
            href="/login"
            className="mt-2 flex w-full items-center justify-center rounded-lg border border-border py-2.5 text-sm font-medium text-muted transition-colors hover:border-accent/50 hover:text-foreground"
            onClick={() => setMobileOpen(false)}
          >
            Login
          </Link>
        </div>
      )}
    </nav>
  );
}
