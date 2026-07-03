// src/app/preview/page.js
export const dynamic = "force-dynamic";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import ContactFormSection from "@/components/ContactFormSection";
import { redirect } from "next/navigation";

const FALLBACK_SERVICES = [
  { id: "s1", title: "Business Funding Consulting", description: "Get guidance on merchant cash advances and alternative business loans.", price: "250" },
  { id: "s2", title: "Credit & Compliance Audit", description: "Full audit of credit profiles and lending compliance regulations.", price: "500" },
  { id: "s3", title: "Financial Strategy Planning", description: "Long-term capital structuring and cash flow optimization.", price: "1200" }
];

const FALLBACK_TEAM = [
  { id: "t1", name: "Sarah Jenkins", role: "Managing Partner", bio: "Over 15 years of alternative finance consulting experience.", avatarUrl: null },
  { id: "t2", name: "David Vance", role: "Lending Specialist", bio: "Ex-underwriter specializing in MCA structuring and credit analysis.", avatarUrl: null },
  { id: "t3", name: "Elena Rostova", role: "Compliance Officer", bio: "Expert in federal regulations, state compliance, and credit audit laws.", avatarUrl: null }
];

const FALLBACK_TESTIMONIALS = [
  { id: "tm1", clientName: "Marcus Thorne", company: "Thorne Logistics", quote: "They helped us restructure our merchant cash advances and saved our cash flow from collapse. Absolutely recommended!", rating: 5 },
  { id: "tm2", clientName: "Angela Harris", company: "Apex Retailers", quote: "The compliance audit was thorough and exposed several lending lies we had been told by brokers.", rating: 5 },
  { id: "tm3", clientName: "Julian Cole", company: "Cole Capital Group", quote: "Professional, straight-to-the-point guidance on alternative business funding.", rating: 5 }
];

const FALLBACK_FAQS = [
  { id: "f1", question: "What is an alternative business loan?", answer: "Alternative business loans are funding options outside of traditional bank credit, such as MCAs, invoice factoring, or asset-backed lines of credit." },
  { id: "f2", question: "How does the compliance audit work?", answer: "We review your active MCA agreements, contract disclosures, interest calculations, and broker representations to identify deceptive lending practices." },
  { id: "f3", question: "Do you offer legal representation?", answer: "No, we provide strategic financial auditing and advisory services. We can refer you to specialized legal partners if litigation is required." }
];

function SafeImage({ src, alt, ...props }) {
  if (!src) return null;
  const isLocal =
    src.startsWith("/") || src.startsWith(".") || src.startsWith("..");
  const isCloudinary = src.includes("res.cloudinary.com");

  if (isLocal || isCloudinary) {
    return <Image src={src} alt={alt} {...props} />;
  }

  const { fill, style, ...rest } = props;
  if (fill) {
    return (
      <img
        src={src}
        alt={alt}
        style={{
          position: "absolute",
          height: "100%",
          width: "100%",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          ...style,
        }}
        {...rest}
      />
    );
  }
  return <img src={src} alt={alt} style={style} {...rest} />;
}

function renderMarkdown(markdownText) {
  if (!markdownText) return "";

  let html = markdownText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 1. Code blocks
  html = html.replace(/```([\s\S]*?)```/g, (match, p1) => {
    return `<pre class="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs my-6 overflow-x-auto"><code>${p1.trim()}</code></pre>`;
  });

  // 2. Headings
  html = html.replace(
    /^# (.*?)$/gm,
    '<h1 class="text-3xl font-extrabold text-slate-900 mt-8 mb-4">$1</h1>',
  );
  html = html.replace(
    /^## (.*?)$/gm,
    '<h2 class="text-2xl font-extrabold text-slate-900 mt-8 mb-4">$1</h2>',
  );
  html = html.replace(
    /^### (.*?)$/gm,
    '<h3 class="text-xl font-bold text-slate-900 mt-6 mb-3">$1</h3>',
  );
  html = html.replace(
    /^#### (.*?)$/gm,
    '<h4 class="text-lg font-bold text-slate-900 mt-4 mb-2">$1</h4>',
  );

  // 3. Blockquotes
  html = html.replace(
    /^&gt; (.*?)$/gm,
    '<blockquote class="border-l-4 border-indigo-500 pl-4 py-1 italic text-slate-650 my-6 bg-slate-50 rounded-r-lg">$1</blockquote>',
  );

  // 4. Unordered Lists
  html = html.replace(
    /^(?:\*|-)\s+(.*?)$/gm,
    '<li class="list-disc ml-6 mb-2">$1</li>',
  );

  // 5. Ordered Lists
  html = html.replace(
    /^(\d+)\.\s+(.*?)$/gm,
    '<li class="list-decimal ml-6 mb-2">$2</li>',
  );

  // 6. Bold
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");

  // 7. Italic
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");

  // 8. Inline Code
  html = html.replace(
    /`(.*?)`/g,
    '<code class="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded font-mono text-[0.9em]">$1</code>',
  );

  // 9. Images
  html = html.replace(
    /!\[(.*?)\]\((.*?)\)/g,
    '<img src="$2" alt="$1" class="my-8 rounded-xl max-w-full h-auto mx-auto shadow-md" />',
  );

  // 10. Links
  html = html.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" class="text-indigo-600 hover:text-indigo-800 underline font-semibold transition" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  const blocks = html.split(/\n\n+/);
  const formattedBlocks = blocks.map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return "";

    const isBlockTag = /^(<h[1-6]|<pre|<blockquote|<ul|<ol|<li|<img|<p)/i.test(
      trimmed,
    );
    if (isBlockTag) {
      return trimmed;
    }

    const paragraphs = trimmed.split("\n").join("<br />");
    return `<p class="text-slate-655 leading-relaxed mb-5">${paragraphs}</p>`;
  });

  let parsed = formattedBlocks.join("\n");

  // Group consecutive list items
  parsed = parsed.replace(/(<li class="list-disc.*<\/li>\n?)+/g, (match) => {
    return `<ul class="my-6 space-y-1">${match}</ul>`;
  });
  parsed = parsed.replace(/(<li class="list-decimal.*<\/li>\n?)+/g, (match) => {
    return `<ol class="my-6 space-y-1">${match}</ol>`;
  });

  return parsed;
}

function Hero({ content }) {
  const bg = content?.bannerUrl || content?.backgroundUrl;
  const alignClass =
    content?.alignment === "left"
      ? "text-left justify-start"
      : content?.alignment === "right"
        ? "text-right justify-end"
        : "text-center justify-center";

  return (
    <section className="relative w-full min-h-[500px] flex items-center bg-slate-900 text-white overflow-x-hidden py-24">
      {bg && (
        <div className="absolute inset-0 z-0">
          <SafeImage
            src={bg}
            alt={content?.title || "Hero Banner"}
            fill
            style={{ objectFit: "cover" }}
            priority
          />
          <div className="absolute inset-0 bg-slate-950/60" />
        </div>
      )}
      <div
        className={`relative z-10 w-full max-w-7xl mx-auto px-6 flex ${alignClass}`}
      >
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            {content?.title || "Legal Clarity for Everyone"}
          </h1>
          {content?.subtitle && (
            <p className="text-base sm:text-lg md:text-xl text-slate-200 mb-8 max-w-2xl font-light">
              {content.subtitle}
            </p>
          )}
          <div className="flex flex-wrap gap-4 items-center justify-center lg:justify-start">
            {content?.primaryButton?.text && (
              <a
                href={content.primaryButton.url || "/"}
                className="px-6 py-3 bg-[#d9b04f] hover:bg-[#c49d41] text-[#1b1b1b] rounded-lg font-bold shadow transition-all hover:-translate-y-0.5 text-sm sm:text-base"
              >
                {content.primaryButton.text}
              </a>
            )}
            {content?.secondaryButton?.text && (
              <a
                href={content.secondaryButton.url || "/"}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg font-semibold backdrop-blur-sm transition-all hover:-translate-y-0.5 text-sm sm:text-base"
              >
                {content.secondaryButton.text}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function TextBlock({ content }) {
  const directionClass =
    content?.imagePosition === "left"
      ? "md:flex-row"
      : content?.imagePosition === "right"
        ? "md:flex-row-reverse"
        : "flex-col";

  return (
    <section className="py-12 sm:py-16 bg-white text-slate-800 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className={`flex flex-col gap-8 sm:gap-10 items-center ${directionClass}`}>
          {content?.imageUrl && (
            <div className="w-full md:w-1/2 relative h-[240px] sm:h-[280px] md:h-[320px] rounded-xl overflow-hidden shadow-md">
              <SafeImage
                src={content.imageUrl}
                alt={content?.title || "Image Block"}
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          )}
          <div
            className={
              content?.imageUrl ? "w-full md:w-1/2" : "w-full max-w-3xl mx-auto"
            }
          >
            {content?.title && (
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1b1b1b] tracking-tight mb-4">
                {content.title}
              </h2>
            )}
            {content?.body &&
              (() => {
                const body = content.body;
                const isHtml =
                  typeof body === "string" && body.trim().startsWith("<");
                return isHtml ? (
                  <div
                    className="prose prose-slate max-w-none space-y-4 text-sm sm:text-base"
                    dangerouslySetInnerHTML={{ __html: body }}
                  />
                ) : (
                  <div
                    className="prose prose-slate max-w-none space-y-4 text-sm sm:text-base"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
                  />
                );
              })()}
            {content?.cta?.text && (
              <div className="mt-6 sm:mt-8">
                <a
                  href={content.cta.url || "/"}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1b1b1b] hover:bg-[#d9b04f] hover:text-[#1b1b1b] text-white rounded-lg font-bold shadow transition text-sm sm:text-base"
                >
                  {content.cta.text}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatPrice(price) {
  if (!price) return "Contact Us";
  const trimmed = String(price).trim();
  const isNumeric = !isNaN(trimmed) && !isNaN(parseFloat(trimmed));
  const hasCurrencySymbol = /[\$\€\£\¥\₹]/.test(trimmed);
  if (isNumeric && !hasCurrencySymbol) {
    return `$${trimmed}`;
  }
  return trimmed;
}

function ServicesSection({ content }) {
  const items = content?.items && content.items.length > 0 ? content.items : FALLBACK_SERVICES;

  return (
    <section className="py-12 sm:py-16 bg-slate-50 text-slate-800 border-t border-b overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1b1b1b]">
            {content?.title || "Our Services"}
          </h2>
          {content?.description && (
            <p className="text-slate-505 mt-2 text-xs sm:text-sm">
              {content.description}
            </p>
          )}
          {!content?.description && !content?.title && (
            <p className="text-slate-505 mt-2 text-xs sm:text-sm">
              Professional legal services customized to your needs.
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 p-5 sm:p-6 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1b1b1b] mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>
              <div className="border-t pt-4 flex items-center justify-between mt-4">
                <span className="font-mono text-xs sm:text-sm font-bold text-[#d9b04f]">
                  {formatPrice(item.price)}
                </span>
                {item.ctaButtonText && (
                  <a
                    href={item.ctaButtonLink || "/"}
                    className="px-3 py-1.5 bg-[#1b1b1b] text-white hover:bg-[#d9b04f] hover:text-[#1b1b1b] rounded text-xs font-semibold"
                  >
                    {item.ctaButtonText}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamSection({ content }) {
  const items = content?.items && content.items.length > 0 ? content.items : FALLBACK_TEAM;

  return (
    <section className="py-12 sm:py-16 bg-white text-slate-800 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1b1b1b]">
            {content?.title || "Meet Our Team"}
          </h2>
          {content?.description && (
            <p className="text-slate-500 mt-2 text-xs sm:text-sm">
              {content.description}
            </p>
          )}
          {!content?.description && !content?.title && (
            <p className="text-slate-500 mt-2 text-xs sm:text-sm">
              Our group of expert professionals and leaders.
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-8">
          {items.map((member) => (
            <div key={member.id} className="text-center group">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto rounded-full overflow-hidden mb-4 border-2 border-slate-100 group-hover:border-[#d9b04f] transition duration-200">
                {member.photo ? (
                  <SafeImage
                    src={member.photo}
                    alt={member.name}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-2xl sm:text-3xl">
                    {member.name?.charAt(0) || "?"}
                  </div>
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {member.name}
              </h3>
              <p className="text-xs sm:text-sm text-[#d9b04f] font-semibold mb-1">
                {member.role}
              </p>
              {member.bio && (
                <p className="text-[11px] sm:text-xs text-slate-400 max-w-xs mx-auto line-clamp-2 px-2">
                  {member.bio}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ content }) {
  const items = content?.items && content.items.length > 0 ? content.items : FALLBACK_TESTIMONIALS;

  return (
    <section className="py-12 sm:py-16 bg-[#1b1b1b] text-white overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {content?.title || "Client Feedback"}
          </h2>
          {content?.description && (
            <p className="text-slate-400 mt-2 text-xs sm:text-sm">
              {content.description}
            </p>
          )}
          {!content?.description && !content?.title && (
            <p className="text-slate-400 mt-2 text-xs sm:text-sm">
              Hear directly what our clients say about us.
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-neutral-900/60 p-5 sm:p-6 rounded-xl border border-neutral-800 backdrop-blur-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-1 mb-4 text-[#d9b04f] font-mono text-sm">
                  {Array.from({ length: item.rating || 5 }).map((_, idx) => (
                    <span key={idx}>★</span>
                  ))}
                </div>
                <p className="text-slate-300 text-xs sm:text-sm italic leading-relaxed mb-6">
                  &ldquo;{item.content}&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 border-t border-neutral-800 pt-4">
                {item.clientImage ? (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                    <SafeImage
                      src={item.clientImage}
                      alt={item.clientName}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {item.clientName?.charAt(0) || "?"}
                  </div>
                )}
                <span className="font-semibold text-xs sm:text-sm text-white">
                  {item.clientName}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection({ content }) {
  const items = content?.items && content.items.length > 0 ? content.items : FALLBACK_FAQS;

  return (
    <section className="py-12 sm:py-16 bg-white text-slate-800 overflow-x-hidden">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1b1b1b]">
            {content?.title || "FAQ"}
          </h2>
          {content?.description && (
            <p className="text-slate-500 mt-2 text-xs sm:text-sm">
              {content.description}
            </p>
          )}
          {!content?.description && !content?.title && (
            <p className="text-slate-500 mt-2 text-xs sm:text-sm">
              Common questions and detailed answers.
            </p>
          )}
        </div>
        <div className="space-y-3 sm:space-y-4">
          {items.map((faq) => (
            <div
              key={faq.id}
              className="border rounded-lg p-4 sm:p-5 hover:bg-slate-50/50 transition"
            >
              <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-2 flex items-start gap-2">
                <span className="text-[#d9b04f] shrink-0">Q.</span>
                {faq.question}
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm pl-6 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection({ content }) {
  return (
    <section className="py-10 sm:py-12 bg-gradient-to-r from-[#1b1b1b] to-neutral-800 text-white border-t border-neutral-700 overflow-x-hidden">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4">
          {content?.title || "Ready to Get Started?"}
        </h2>
        {content?.subtitle && (
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto mb-6">
            {content.subtitle}
          </p>
        )}
        {content?.primaryButtonText && (
          <a
            href={content.primaryButtonUrl || "/"}
            className="px-6 py-2.5 bg-[#d9b04f] hover:bg-[#c49d41] text-[#1b1b1b] font-bold rounded shadow transition hover:-translate-y-0.5 text-sm sm:text-base inline-block"
          >
            {content.primaryButtonText}
          </a>
        )}
      </div>
    </section>
  );
}

function BlogsSection({ content }) {
  const items = content?.items || [];

  return (
    <section className="py-12 sm:py-16 bg-white text-slate-800 border-t border-b overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1b1b1b]">
            {content?.title || "Latest Articles"}
          </h2>
          <p className="text-slate-500 mt-2 text-xs sm:text-sm">
            {content?.description ||
              "Stay updated with our latest news and insights."}
          </p>
        </div>
        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {items.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group block bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {post.featuredImage && (
                  <div className="relative w-full aspect-[16/10]">
                    <SafeImage
                      src={
                        post.featuredImage.secureUrl || post.featuredImage.url
                      }
                      alt={post.title}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                )}
                <div className="p-5 sm:p-6">
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {(post.categories || []).map((c) => (
                      <span
                        key={c.id}
                        className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600"
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1 group-hover:text-[#d9b04f] transition truncate">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-2 mb-4 mt-1">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="text-[10px] sm:text-xs text-slate-400 font-semibold mt-4 pt-4 border-t flex justify-between">
                    <span>
                      By{" "}
                      {post.author
                        ? post.author.email.split("@")[0]
                        : "Author"}
                    </span>
                    <span>
                      {new Date(
                        post.publishedAt || post.createdAt,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 sm:py-20">
            <div className="text-slate-350 mb-4">
              <svg
                className="w-12 h-12 sm:w-16 sm:h-16 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
            </div>
            <p className="text-slate-400 text-sm sm:text-base font-medium">
              No articles yet
            </p>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Check back soon for new content.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default async function PreviewPage({ searchParams }) {
  // Unwrap searchParams if it's a promise-like in this runtime
  const sp = await searchParams;
  const pageId = sp?.pageId;
  const siteId = sp?.siteId;

  if (!pageId || !siteId) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Preview</h1>
        <p className="text-red-600 mt-4">
          pageId and siteId query params are required.
        </p>
        <p className="mt-2">Usage: /preview?pageId=&siteId=</p>
      </div>
    );
  }

// Fetch page directly with Prisma
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: { id: true, title: true, slug: true, status: true, siteId: true, isHardcoded: true },
  });

  if (!page || String(page.siteId) !== String(siteId)) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Preview Error</h1>
        <pre className="mt-4 bg-gray-100 p-4 rounded text-sm text-red-700">
          Page not found or siteId mismatch
        </pre>
      </div>
    );
  }

  if (page.isHardcoded) {
    redirect(`${page.slug || "/"}`);
  }

  // Fetch Site and settings
  const site = (await prisma.site.findUnique({
    where: { id: siteId },
    select: { name: true },
  })) || { name: "Default Website" };

  const settings = await prisma.globalSettings.findUnique({
    where: { siteId },
  });

  let sections = await prisma.section.findMany({
    where: { pageId: page.id, isDeleted: false },
    orderBy: { order: "asc" },
  });

  // Collect referenced media IDs
  const mediaIds = new Set();
  sections.forEach((s) => {
    const content = s.content || {};
    if (content.bannerMediaId) mediaIds.add(content.bannerMediaId);
    if (content.imageMediaId) mediaIds.add(content.imageMediaId);
  });

  // Fetch media rows for referenced ids
  let mediaRows = [];
  if (mediaIds.size > 0) {
    mediaRows = await prisma.media.findMany({
      where: { id: { in: Array.from(mediaIds) } },
      select: { id: true, secureUrl: true, url: true, altText: true },
    });
  }

  // Build map id -> url
  const mediaMap = mediaRows.reduce((acc, m) => {
    acc[m.id] = m.secureUrl || m.url || null;
    return acc;
  }, {});

  // Inject URLs and dynamic collection items into section.content for preview rendering
  sections = await Promise.all(
    sections.map(async (s) => {
      const content = { ...(s.content || {}) };
      if (content.bannerMediaId && mediaMap[content.bannerMediaId]) {
        content.bannerUrl = mediaMap[content.bannerMediaId];
      }
      if (content.imageMediaId && mediaMap[content.imageMediaId]) {
        content.imageUrl = mediaMap[content.imageMediaId];
      }

      // Fetch dynamic collection list items
      const type = String(s.type || "").toUpperCase();
      if (type === "SERVICES") {
        const services = await prisma.service.findMany({
          where: { siteId, status: "ACTIVE", deletedAt: null },
          orderBy: { sortOrder: "asc" },
        });
        content.items = services.map((s) => {
          if (s.price) {
            const trimmed = String(s.price).trim();
            const isNumeric = !isNaN(trimmed) && !isNaN(parseFloat(trimmed));
            const hasCurrencySymbol = /[\$\€\£\¥\₹]/.test(trimmed);
            if (isNumeric && !hasCurrencySymbol) {
              return { ...s, price: `$${trimmed}` };
            }
          }
          return s;
        });
      } else if (type === "TEAM") {
        content.items = await prisma.teamMember.findMany({
          where: { siteId, deletedAt: null },
          orderBy: { sortOrder: "asc" },
        });
      } else if (type === "TESTIMONIALS") {
        content.items = await prisma.testimonial.findMany({
          where: { siteId, showHide: true, deletedAt: null },
          orderBy: { sortOrder: "asc" },
        });
      } else if (type === "FAQ") {
        content.items = await prisma.faq.findMany({
          where: {
            siteId,
            showHide: true,
            deletedAt: null,
            OR: [{ pageId: null }, { pageId: page.id }],
          },
          orderBy: { sortOrder: "asc" },
        });
      } else if (type === "BLOGS") {
        content.items = await prisma.post.findMany({
          where: { siteId, status: "PUBLISHED", deletedAt: null },
          orderBy: { publishedAt: "desc" },
          take: 6,
          include: {
            featuredImage: true,
            categories: true,
            author: { select: { email: true } },
          },
        });
      }

      return { ...s, content };
    }),
  );
  const headerSettings = settings?.header || {};
  const footerSettings = settings?.footer || {};
  const websiteSettings = settings?.websiteSettings || {};
  const headerMenuType = headerSettings.menuType || "main";
  const navigation = settings?.navigation?.[headerMenuType] || [];

  const isSticky = headerSettings.sticky ?? true;
  const isTransparent = headerSettings.transparent ?? false;
  const positionClass = isSticky
    ? "sticky top-[28px] md:top-[32px]"
    : isTransparent
      ? "absolute w-full bg-transparent"
      : "relative";
  const bgClass = isTransparent ? "" : "bg-white";

  const paddingYClass =
    headerSettings.paddingY === "small"
      ? "py-2"
      : headerSettings.paddingY === "large"
        ? "py-6"
        : "py-4";

  const shadowClass =
    headerSettings.shadowSize === "none"
      ? "shadow-none"
      : headerSettings.shadowSize === "medium"
        ? "shadow"
        : "shadow-xs";

  const borderClass = headerSettings.borderBottom !== false ? "border-b" : "";

  const renderLogo = () => {
    if (headerSettings.logoType === "text") {
      return (
        <span className="font-extrabold text-lg text-slate-900">
          {headerSettings.logoText || site.name}
        </span>
      );
    }
    const logoSrc =
      headerSettings.logoUrl || websiteSettings.logoUrl || "/next.svg";

    return (
      <img
        src={logoSrc}
        alt="Logo"
        style={{
          width: headerSettings.logoWidth
            ? `${headerSettings.logoWidth}px`
            : "auto",
          height: headerSettings.logoHeight
            ? `${headerSettings.logoHeight}px`
            : "40px",
          objectFit: "contain",
        }}
      />
    );
  };

  let leftLinks = [];
  let rightLinks = [];
  if (headerSettings.layout === "logo-split") {
    const mid = Math.ceil(navigation.length / 2);
    leftLinks = navigation.slice(0, mid);
    rightLinks = navigation.slice(mid);
  }

  const ctaButton =
    headerSettings.ctaText && headerSettings.ctaLink ? (
      <a
        href={headerSettings.ctaLink}
        className="px-4 py-1.5 bg-[#d9b04f] hover:bg-[#c49d41] text-[#1b1b1b] rounded text-[10px] font-bold whitespace-nowrap shadow-sm transition"
      >
        {headerSettings.ctaText}
      </a>
    ) : null;

  const renderHeaderContent = () => {
    switch (headerSettings.layout) {
      case "logo-center":
        return (
          <div
            className={`max-w-7xl mx-auto px-6 ${paddingYClass} flex items-center justify-between relative`}
          >
            <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-655">
              {navigation.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  className="hover:text-[#d9b04f] transition"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="absolute left-1/2 -translate-x-1/2 shrink-0 flex items-center">
              {renderLogo()}
            </div>
            <div className="flex items-center gap-3 z-10">
              {ctaButton}
              <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[9px] font-bold uppercase shrink-0">
                Draft
              </span>
            </div>
          </div>
        );

      case "logo-split":
        return (
          <div
            className={`max-w-7xl mx-auto px-6 ${paddingYClass} flex items-center justify-between`}
          >
            <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-655">
              {leftLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  className="hover:text-[#d9b04f] transition"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="shrink-0 flex items-center">{renderLogo()}</div>
            <div className="flex items-center gap-6">
              <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-655">
                {rightLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    className="hover:text-[#d9b04f] transition"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[9px] font-bold uppercase shrink-0">
                Draft
              </span>
            </div>
          </div>
        );

      case "logo-right":
        return (
          <div
            className={`max-w-7xl mx-auto px-6 ${paddingYClass} flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              {ctaButton}
              <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[9px] font-bold uppercase shrink-0">
                Draft
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-655">
              {navigation.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  className="hover:text-[#d9b04f] transition"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="shrink-0 flex items-center">{renderLogo()}</div>
          </div>
        );

      case "stacked":
        return (
          <div
            className={`max-w-7xl mx-auto px-6 ${paddingYClass} flex flex-col items-center gap-3`}
          >
            <div className="shrink-0 flex items-center">{renderLogo()}</div>
            <div className="w-full flex justify-between items-center pt-2 border-t border-slate-100">
              <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-655">
                {navigation.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    className="hover:text-[#d9b04f] transition"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="flex items-center gap-3">
                {ctaButton}
                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[9px] font-bold uppercase shrink-0">
                  Draft
                </span>
              </div>
            </div>
          </div>
        );

      case "logo-left":
      default:
        return (
          <div
            className={`max-w-7xl mx-auto px-6 ${paddingYClass} flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">{renderLogo()}</div>
            <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-655">
              {navigation.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  className="hover:text-[#d9b04f] transition"
                >
                  {link.label}
                </a>
              ))}
              {ctaButton}
              <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[9px] font-bold uppercase shrink-0">
                Draft
              </span>
            </nav>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col justify-between">
      <div className="bg-amber-500 text-white text-center py-1.5 text-[10px] font-bold uppercase tracking-wider sticky top-0 z-50 shadow-sm">
        ⚡ Preview Mode &mdash; Viewing Draft Layout for "
        {page.title || page.slug}"
      </div>

      {/* Announcement Bar */}
      {headerSettings.announcementBar?.enabled &&
        headerSettings.announcementBar?.text && (
          <a
            href={headerSettings.announcementBar.link || "#"}
            style={{
              backgroundColor:
                headerSettings.announcementBar.bgColor || "#1e3a5f",
              color: headerSettings.announcementBar.textColor || "#ffffff",
            }}
            className="w-full py-1.5 px-4 text-center text-[10px] font-bold tracking-wide truncate block text-decoration-none z-40 relative"
          >
            {headerSettings.announcementBar.text}
          </a>
        )}

      {/* Dynamic Header */}
      <header
        className={`${positionClass} ${bgClass} ${borderClass} ${shadowClass} z-40`}
      >
        {renderHeaderContent()}
      </header>

      {/* Main Content Area */}
      <main className="grow">
        {sections
          .filter((s) => s.isVisible !== false)
          .map((s) => {
            const type = String(s.type || "").toUpperCase();
            if (type === "HERO") return <Hero key={s.id} content={s.content} />;
            if (type === "TEXT_BLOCK")
              return <TextBlock key={s.id} content={s.content} />;
            if (type === "SERVICES")
              return <ServicesSection key={s.id} content={s.content} />;
            if (type === "TEAM")
              return <TeamSection key={s.id} content={s.content} />;
            if (type === "TESTIMONIALS")
              return <TestimonialsSection key={s.id} content={s.content} />;
            if (type === "FAQ")
              return <FaqSection key={s.id} content={s.content} />;
            if (type === "CTA")
              return <CtaSection key={s.id} content={s.content} />;
            if (type === "BLOGS")
              return <BlogsSection key={s.id} content={s.content} />;
            if (type === "CONTACT_FORM") {
              return (
                <ContactFormSection
                  key={s.id}
                  siteId={siteId}
                  content={s.content}
                  recaptchaSiteKey={
                    settings?.securityControls?.recaptchaSiteKey ||
                    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
                  }
                />
              );
            }

            return (
              <section key={s.id} className="py-8 max-w-7xl mx-auto px-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Fallback: {s.type} Section
                </span>
                <pre className="p-4 bg-white border rounded text-xs font-mono overflow-auto">
                  {JSON.stringify(s.content, null, 2)}
                </pre>
              </section>
            );
          })}
      </main>

      {/* Dynamic Footer */}
      <footer className="bg-[#212121] text-gray-400 py-12 border-t border-[#2d3748]/30">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-[#d9b04f] font-bold text-sm mb-4">{site.name}</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Powered by the Global Backend Headless CMS. High performance
              modular setups.
            </p>
          </div>
          <div>
            <h5 className="text-[#d9b04f] font-bold text-xs mb-3">Links</h5>
            <div className="flex flex-col gap-2 text-xs">
              {navigation.slice(0, 4).map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  className="hover:text-[#d9b04f] transition"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h5 className="text-[#d9b04f] font-bold text-xs mb-3 font-mono">
              Status
            </h5>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950 px-2 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-900 uppercase tracking-wider">
              <span className="h-1 w-1 rounded-full bg-amber-500 animate-pulse" />
              Previewing Draft
            </span>
          </div>
          <div>
            <h5 className="text-[#d9b04f] font-bold text-xs mb-3">Copyright</h5>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              {footerSettings.copyright ||
                `© ${new Date().getFullYear()} ${site.name}. All rights reserved.`}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
