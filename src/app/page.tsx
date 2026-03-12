"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LordIcon } from "@/components/lord-icon";
import { useScrambleText } from "@/hooks/useScrambleText";
import BottomBar from "@/components/BottomBar";
import { SurpriseFooter } from "@/surprise-footer/SurpriseFooter";
import FormlessBoot from "@/components/FormlessBoot";
import FormlessAnimatedContainer from "@/components/FormlessAnimatedContainer";
import WorkCarousel from "@/components/WorkCarousel";

const LORDICON = {
  education: "https://cdn.lordicon.com/ofrdcast.json",
  work: "https://cdn.lordicon.com/kthelypq.json",
  contact: "https://cdn.lordicon.com/slkvcfos.json",
} as const;

export default function Home() {
  const educationHeader = useScrambleText("Education");
  const contactHeader = useScrambleText("Contact");

  return (
    <div className="relative min-h-screen bg-transparent font-sans antialiased">
      <FormlessBoot />
      <FormlessAnimatedContainer
        id="home"
        className="fixed inset-0 h-screen w-screen"
        containerClassName="min-h-screen"
        gradientTop={undefined}
        gradientBottom={28}
      >
      {/* Minimal nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
          <nav className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
            <Link
              href="/"
              className="text-sm font-medium text-foreground hover:text-muted-foreground transition-colors"
            >
            Micah Blackburn
            </Link>
            <div className="flex items-center gap-4">
              <Link
                id="nav-education"
                href="#education"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <LordIcon
                  src={LORDICON.education}
                  trigger="hover"
                  target="#nav-education"
                  size={18}
                  className="text-muted-foreground"
                />
                <span>Education</span>
              </Link>
              <Link
                id="nav-work"
                href="#work"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
              <LordIcon
                src={LORDICON.work}
                trigger="hover"
                target="#nav-work"
                size={18}
                className="text-muted-foreground"
              />
              <span>Work</span>
              </Link>
              <Link
                id="nav-contact"
                href="#contact"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
              <LordIcon
                src={LORDICON.contact}
                trigger="hover"
                target="#nav-contact"
                size={18}
                className="text-muted-foreground"
              />
              <span>Contact</span>
              </Link>
            </div>
          </nav>
      </header>

      {/* Centered card with rounded bottom so fluid shows on sides and below; doesn’t cover fluid. */}
      <div className="relative z-10 mx-auto w-full max-w-3xl px-6 rounded-b-3xl bg-background overflow-hidden">
      {/* Hero — Wabi-style: one clear message, lots of space */}
      <main id="main" className="pt-32 pb-24 sm:pt-40 sm:pb-32">
          <section className="flex flex-col gap-8">
            <h1 className="text-4xl font-semibold tracking-tight leading-[1.1] text-foreground sm:text-5xl md:text-6xl">
            Full Stack Developer. Builder of cool things.
            </h1>
            <p className="max-w-xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
            My name is Micah — Go Blue.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 items-center">
              <Button asChild size="lg" className="rounded-full px-6">
              <Link href="#work">View work</Link>
              </Button>
              <div className="glass-btn-wrap glass-btn-wrap--cta">
                <div className="glass-btn-shadow" aria-hidden />
                <Link href="#contact" className="glass-btn">
                  <span>Get in touch</span>
                </Link>
              </div>
            </div>
          </section>

          <section id="education" className="mt-32 pt-16 border-t border-black">
            <h2
              className="text-2xl font-semibold tracking-tight text-foreground mb-8 cursor-default"
              onMouseEnter={educationHeader.scramble}
              onMouseLeave={educationHeader.reset}
            >
              {educationHeader.displayText}
            </h2>
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary/80">
                  <Image
                    src="/work_logos/Michigan.png"
                    alt=""
                    width={64}
                    height={64}
                    className="object-contain p-1.5"
                  />
                </div>
                <div>
                  <p className="font-medium text-foreground">University of Michigan</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Ann Arbor, MI · Aug 2020 – May 2024 · GPA: 3.78</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary/80">
                  <Image
                    src="/work_logos/IE.png"
                    alt=""
                    width={64}
                    height={64}
                    className="object-contain p-1.5"
                  />
                </div>
                <div>
                  <p className="font-medium text-foreground">IE Business School</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Madrid, Spain · Jan 2023 – May 2023 · Study abroad</p>
                </div>
              </div>
            </div>
          </section>

          <WorkCarousel />

          <section id="contact" className="mt-32 pt-16 border-t border-black ">
            <h2
              className="text-2xl font-semibold tracking-tight text-foreground cursor-default"
              onMouseEnter={contactHeader.scramble}
              onMouseLeave={contactHeader.reset}
            >
              {contactHeader.displayText}
            </h2>
            <ul className="mt-4 space-y-2 text-muted-foreground">
              <li>
                <a
                  href="https://github.com/micahcb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-muted-foreground transition-colors underline underline-offset-4"
                >
                  GitHub
                </a>
                {" — "}
                <a
                  href="https://github.com/micahcb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/80 hover:text-foreground transition-colors break-all"
                >
                  https://github.com/micahcb
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/micah-blackburn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-muted-foreground transition-colors underline underline-offset-4"
                >
                  LinkedIn
                </a>
                {" — "}
                <a
                  href="https://www.linkedin.com/in/micah-blackburn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/80 hover:text-foreground transition-colors break-all"
                >
                  https://www.linkedin.com/in/micah-blackburn/
                </a>
              </li>
              <li>
                <span className="text-foreground">Email</span>
                {" — "}
                <a
                  href="mailto:micahcb@umich.edu"
                  className="text-foreground/80 hover:text-foreground transition-colors break-all"
                >
                  micahcb@umich.edu
                </a>
              </li>
              <li>
                <span className="text-foreground">Text</span>
                {" — "}
                <a
                  href="tel:+13035051169"
                  className="text-foreground/80 hover:text-foreground transition-colors"
                >
                  +1 303 505 1169
                </a>
              </li>
            </ul>
          </section>

         
      </main>

      <footer className="border-t border-border/40 py-8">
          <div className="mx-auto max-w-3xl px-6 text-sm text-muted-foreground">
            © {new Date().getFullYear()} Micah Blackburn
          </div>
      </footer>

      </div>

      <SurpriseFooter />
      </FormlessAnimatedContainer>

      <BottomBar />
    </div>
  );
}
