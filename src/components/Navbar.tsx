"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Menu, X } from "lucide-react";

const navLinks = [
  {
    label: "SEO Toolkit",
    href: "#",
    children: [
      { label: "Headline Analyzer", href: "/tools/headline-analyzer" },
      { label: "Readability Checker", href: "/tools/readability-checker" },
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
    ],
  },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl md:px-8">
      {/* Left — Logo */}
      <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
        <Image src="/Logo Octoboost.png" alt="OctoBoost" width={120} height={120} className="h-9 w-9 object-contain" priority />
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
                <ChevronDown className="h-3 w-3" />
              </button>
              {openDropdown === link.label && (
                <div className="absolute top-full left-1/2 mt-1 min-w-[180px] -translate-x-1/2 rounded-lg border border-border bg-card p-1 shadow-lg">
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

      {/* Right — Login */}
      <Link
        href="/login"
        className="hidden rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-muted transition-colors hover:border-accent/50 hover:text-foreground md:inline-flex"
      >
        Login
      </Link>

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
            href="/login"
            className="mt-3 flex w-full items-center justify-center rounded-lg border border-border py-2.5 text-sm font-medium text-muted transition-colors hover:border-accent/50 hover:text-foreground"
            onClick={() => setMobileOpen(false)}
          >
            Login
          </Link>
        </div>
      )}
    </nav>
  );
}
