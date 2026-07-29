import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight, BarChart3, ChevronRight, Clock3, ShieldCheck, Sparkles
} from 'lucide-react';

const pageContent = {
  '/smm-panel': {
    eyebrow: 'Social media marketing platform',
    title: 'A smarter SMM panel for steady, meaningful growth',
    description: 'Plan social campaigns, find reliable promotion services, and keep every order in one clear workspace. Built for creators, teams, and agencies that want to grow with intention.',
    keyword: 'SMM panel',
    benefits: ['Clear campaign tracking', 'Vetted service options', 'Human support when you need it'],
    question: 'What is an SMM panel?',
    answer: 'An SMM panel is a dashboard that helps marketers and creators organise social media promotion services in one place. A thoughtful panel makes it easier to compare options, track delivery, and connect promotion activity to a wider content strategy.',
  },
  '/instagram-followers': {
    eyebrow: 'Instagram growth tools',
    title: 'Build an Instagram audience that stays for your work',
    description: 'Use targeted Instagram promotion as one part of a content-led growth plan. Reach the right people, monitor campaign progress, and keep your brand voice at the centre.',
    keyword: 'Instagram followers',
    benefits: ['Audience-focused campaign options', 'Simple delivery updates', 'Campaigns that complement original content'],
    question: 'How should I approach Instagram follower growth?',
    answer: 'Sustainable Instagram growth starts with useful Reels, consistent publishing, and a clear reason to follow. Promotion can help introduce strong content to relevant audiences, but it should support—not replace—real community building and platform-safe practices.',
  },
  '/youtube-views': {
    eyebrow: 'YouTube video promotion',
    title: 'Give your best YouTube videos a stronger launch',
    description: 'Put your videos in front of interested viewers while you focus on helpful scripts, engaging thumbnails, and a channel people want to return to.',
    keyword: 'YouTube views',
    benefits: ['Video campaign visibility', 'Straightforward order management', 'Built around your publishing calendar'],
    question: 'Do YouTube views help a channel grow?',
    answer: 'Views can create early awareness for a video, especially when the topic, title, thumbnail, and audience match. Long-term channel growth comes from viewer satisfaction, watch time, and a consistent library of useful videos—not a view count alone.',
  },
  '/tiktok-followers': {
    eyebrow: 'TikTok creator growth',
    title: 'Turn TikTok reach into a community around your ideas',
    description: 'Pair short-form content that earns attention with promotion tools that help your strongest posts travel further—without losing sight of your audience.',
    keyword: 'TikTok followers',
    benefits: ['Creator-friendly campaign setup', 'Progress you can check anytime', 'A practical companion to organic content'],
    question: 'What helps TikTok accounts grow?',
    answer: 'The best TikTok growth is earned through a fast opening, a useful or entertaining idea, and a reason to watch again. Study retention, reply to comments, and repeat the formats that genuinely resonate with your audience.',
  },
};

const Stat = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><Icon size={20} /></div>
    <div><p className="font-semibold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></div>
  </div>
);

const SmmPanel = () => {
  const { pathname } = useLocation();
  const content = pageContent[pathname] || pageContent['/smm-panel'];

  useEffect(() => {
    document.title = `${content.keyword} Services & Social Growth Tools | Growly`;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', content.description);
  }, [content]);

  return (
    <main className="min-h-screen bg-[#fcfcff] text-slate-900">
      <nav className="border-b border-slate-100 bg-white/90 px-5 py-4 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/smm-panel" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white"><Sparkles size={18} /></span>Growly
          </Link>
          <div className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <Link to="/instagram-followers" className="hover:text-violet-700">Instagram</Link>
            <Link to="/youtube-views" className="hover:text-violet-700">YouTube</Link>
            <Link to="/tiktok-followers" className="hover:text-violet-700">TikTok</Link>
            <a href="#learn" className="hover:text-violet-700">How it works</a>
          </div>
          <Link to="/register" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700">Get started</Link>
        </div>
      </nav>

      <section className="relative overflow-hidden px-5 pb-20 pt-16 md:px-8 md:pt-24">
        <div className="absolute -right-32 -top-20 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-cyan-100 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-700"><Sparkles size={14} />{content.eyebrow}</p>
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl">{content.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{content.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700">Explore services <ArrowRight size={18} /></Link>
              <a href="#learn" className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 font-semibold text-slate-700 transition hover:border-violet-200 hover:text-violet-700">Learn how it works</a>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-slate-500"><ShieldCheck size={16} className="text-emerald-600" />Designed for responsible, policy-aware promotion</p>
          </div>
          <div className="rounded-3xl border border-white bg-white p-5 shadow-2xl shadow-slate-200/70">
            <div className="rounded-2xl bg-slate-950 p-6 text-white">
              <div className="flex items-center justify-between"><span className="text-sm text-slate-400">Campaign overview</span><span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">On track</span></div>
              <div className="mt-8 flex items-end gap-3"><p className="text-4xl font-bold">One place</p><p className="pb-1 text-sm text-slate-400">for your growth activity</p></div>
              <div className="mt-7 flex h-20 items-end gap-2">{[35, 55, 42, 76, 61, 88, 72, 96].map((height, index) => <span key={index} className="flex-1 rounded-t-md bg-gradient-to-t from-violet-500 to-fuchsia-300" style={{ height: `${height}%` }} />)}</div>
            </div>
            <div className="grid grid-cols-2 gap-4 px-2 py-6"><Stat icon={BarChart3} value="Simple" label="campaign tracking" /><Stat icon={Clock3} value="Clear" label="delivery updates" /></div>
          </div>
        </div>
      </section>

      <section id="learn" className="border-y border-slate-100 bg-white px-5 py-16 md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-widest text-violet-700">A better way to promote</p>
          <div className="mt-3 flex flex-col justify-between gap-6 md:flex-row md:items-end"><h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">Growth tools should make your next decision easier.</h2><p className="max-w-md leading-7 text-slate-600">Use promotion alongside content, community management, and analysis—not as a shortcut around them.</p></div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">{content.benefits.map((benefit, index) => <div key={benefit} className="rounded-2xl border border-slate-100 p-6"><span className="text-sm font-bold text-violet-600">0{index + 1}</span><h3 className="mt-6 text-lg font-semibold">{benefit}</h3><p className="mt-2 text-sm leading-6 text-slate-600">A focused workspace that keeps each campaign visible and understandable.</p></div>)}</div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 rounded-3xl bg-violet-50 p-8 md:grid-cols-2 md:p-12">
          <div><p className="font-semibold text-violet-700">A useful question</p><h2 className="mt-3 text-3xl font-bold tracking-tight">{content.question}</h2></div>
          <div><p className="leading-8 text-slate-600">{content.answer}</p><Link to="/faq" className="mt-6 inline-flex items-center gap-1 font-semibold text-violet-700 hover:text-violet-900">Read our promotion FAQ <ChevronRight size={17} /></Link></div>
        </div>
      </section>

      <footer className="bg-slate-950 px-5 py-10 text-slate-300 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 md:flex-row"><div><p className="text-lg font-bold text-white">Growly</p><p className="mt-2 text-sm">Thoughtful tools for social media marketing.</p></div><div className="flex gap-5 text-sm"><Link to="/smm-panel">SMM panel</Link><Link to="/instagram-followers">Instagram</Link><Link to="/youtube-views">YouTube</Link><Link to="/tiktok-followers">TikTok</Link></div></div>
      </footer>
    </main>
  );
};

export default SmmPanel;
