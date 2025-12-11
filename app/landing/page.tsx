"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, ArrowRight, Shield, Clock, Percent, ChevronRight, Star } from "lucide-react";

export default function LandingPage() {
  const [open, setOpen] = useState(false);

  return (  
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-white font-sans text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-8 py-4 max-w-7xl mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl shadow-lg shadow-emerald-200 group-hover:shadow-emerald-300 transition-all duration-300">
               <span className="text-white font-bold text-xl">B</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-emerald-950 leading-none">BrightLend</span>
              <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold">Financial Group</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {['Personal Loans', 'Business Solutions', 'About Us', 'Contact'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-500 transition-all group-hover:w-full"></span>
              </a>
            ))}
          </nav>

          {/* Desktop Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/login" passHref>
              <button className="text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition-colors">
                Sign In
              </button>
            </Link>
            <Link href="/signup" passHref>
              <button className="flex items-center gap-2 rounded-full px-6 py-2.5 bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/20 hover:bg-emerald-800 hover:shadow-emerald-600/30 hover:-translate-y-0.5 transition-all duration-300">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {open && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-xl py-4 px-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
            {['Personal Loans', 'Business Solutions', 'About Us', 'Contact'].map((item) => (
              <a key={item} href="#" className="text-base font-medium text-slate-700 hover:text-emerald-700 py-2 border-b border-gray-50">
                {item}
              </a>
            ))}
            <div className="flex flex-col gap-3 mt-2">
               <Link href="/login" className="w-full">
                <button className="w-full py-3 rounded-lg border border-emerald-200 text-emerald-800 font-semibold hover:bg-emerald-50">
                  Sign In
                </button>
               </Link>
               <Link href="/signup" className="w-full">
                <button className="w-full py-3 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800 shadow-md">
                  Get Started
                </button>
               </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative w-full overflow-hidden bg-slate-900">
          {/* Background Image & Gradient */}
          <div className="absolute inset-0 z-0">
             <Image 
                src="https://images.unsplash.com/photo-1565514020176-dbf2277f240e?q=80&w=2670&auto=format&fit=crop"
                alt="Background"
                fill
                className="object-cover opacity-20"
                priority
             />
             <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-teal-900/90 to-slate-900/80"></div>
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 mb-6 backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
                <span className="text-sm font-medium text-emerald-100">Trusted by over 50,000 customers</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
                Lending for a <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Greener Future.</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-300 mb-10 leading-relaxed max-w-lg">
                Secure, transparent, and swift financial solutions tailored to your life's goals. Experience the stability of traditional lending with the speed of modern technology.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <button className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all hover:-translate-y-1">
                    Open an Account
                  </button>
                </Link>
                <Link href="/about">
                  <button className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-sm rounded-xl font-bold transition-all">
                    View Solutions
                  </button>
                </Link>
              </div>
              
              <div className="mt-12 flex items-center gap-8 text-slate-400">
                <div className="flex flex-col">
                   <span className="text-2xl font-bold text-white">4.9/5</span>
                   <span className="text-sm">Truspilot Rating</span>
                </div>
                <div className="w-px h-10 bg-white/10"></div>
                 <div className="flex flex-col">
                   <span className="text-2xl font-bold text-white">$2 Billion+</span>
                   <span className="text-sm">Loans Funded</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Abstract Curve */}
          <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-white to-transparent"></div>
        </section>

        {/* Why Choose Section */}
        <section className="py-24 bg-white relative">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-emerald-700 font-semibold tracking-wide uppercase text-sm mb-3">Why BrightLend</h2>
              <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Financial Excellence You Can Trust</h3>
              <p className="text-slate-600 text-lg">We combine decades of financial expertise with cutting-edge security to provide you with the most reliable lending experience.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Clock className="w-6 h-6 text-white" />,
                  title: "Fast Approval Process",
                  desc: "Get a decision in minutes. Our AI-driven underwriting ensures speed without compromising accuracy.",
                  color: "bg-emerald-600"
                },
                {
                  icon: <Percent className="w-6 h-6 text-white" />,
                  title: "Competitive Rates",
                  desc: "Rates as low as 4.5% APR. We believe in fair pricing that helps you save more over time.",
                  color: "bg-teal-600"
                },
                {
                  icon: <Shield className="w-6 h-6 text-white" />,
                  title: "Bank-Grade Security",
                  desc: "Your data is protected by 256-bit AES encryption and monitored 24/7 for fraud prevention.",
                  color: "bg-blue-800"
                }
              ].map((feature, i) => (
                <div key={i} className="group p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-100 hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
                  <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Steps Section */}
        <section className="py-24 bg-emerald-50/50 border-y border-emerald-100/50">
           <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
             <div className="grid lg:grid-cols-2 gap-16 items-center">
               <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">Simple Steps to Funding</h2>
                  <p className="text-lg text-slate-600 mb-8">We've removed the red tape. Access capital for your personal or business needs in three transparent steps.</p>
                  
                  <div className="space-y-8">
                    {[
                      { step: "01", title: "Apply Online", desc: "Complete our secure online application in under 5 minutes." },
                      { step: "02", title: "Receive Approval", desc: "Get an instant decision with clear terms and no hidden fees." },
                      { step: "03", title: "Get Funded", desc: "Funds are deposited directly into your account as soon as the next business day." }
                    ].map((s, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-emerald-200 flex items-center justify-center text-emerald-700 font-bold bg-white">
                          {s.step}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-slate-900">{s.title}</h4>
                          <p className="text-slate-600">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10">
                    <Link href="/signup">
                       <button className="text-emerald-700 font-bold flex items-center gap-2 hover:gap-3 transition-all">
                         Start Application <ChevronRight className="w-5 h-5" />
                       </button>
                    </Link>
                  </div>
               </div>
               
               <div className="relative">
                 <div className="absolute -inset-4 bg-gradient-to-r from-emerald-200 to-teal-200 rounded-2xl blur-lg opacity-30"></div>
                 <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
                   <div className="aspect-[4/3] bg-slate-100 relative">
                     {/* Abstract UI representation */}
                     <div className="absolute inset-x-8 top-8 bottom-0 bg-white shadow-lg rounded-t-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-8">
                           <div className="w-24 h-4 bg-slate-200 rounded"></div>
                           <div className="w-8 h-8 rounded-full bg-emerald-100"></div>
                        </div>
                        <div className="space-y-4">
                          <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                          <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                          <div className="h-16 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-center text-emerald-700 font-medium mt-6">
                            Application Approved
                          </div>
                        </div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-16">Trusted by Thousands</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
               {[
                 { 
                   name: "Sarah Jenkins",
                   role: "Small Business Owner",
                   text: "BrightLend was a lifeline for my bakery. The process was dignified, professional, and incredibly fast. I felt like a valued partner, not just a number." 
                 },
                 { 
                   name: "Marcus Thorne",
                   role: "Investment Consultant",
                   text: "As a finance professional, I appreciate transparency. BrightLend delivers exactly that—clear terms, great rates, and a secure platform." 
                 },
                 { 
                   name: "Elena Rodriguez",
                   role: "Homeowner",
                   text: "I needed funds for a renovation and didn't want to deal with traditional bank delays. BrightLend's service was impeccable." 
                 }
               ].map((t, i) => (
                 <div key={i} className="p-8 bg-slate-50 rounded-2xl border border-slate-100 relative">
                   <div className="flex gap-1 text-yellow-400 mb-4">
                     {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                   </div>
                   <p className="text-slate-700 mb-6 italic">"{t.text}"</p>
                   <div>
                     <p className="font-bold text-slate-900">{t.name}</p>
                     <p className="text-sm text-emerald-600">{t.role}</p>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <span className="text-2xl font-bold text-white tracking-tight">BrightLend</span>
              <p className="mt-4 text-sm text-slate-400">
                Building a brighter financial future with integrity, security, and speed.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Products</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Personal Loans</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Business Lending</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Refinancing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>© 2024 BrightLend Financial Group. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-emerald-400">Privacy Policy</a>
              <a href="#" className="hover:text-emerald-400">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}