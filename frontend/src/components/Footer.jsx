import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Shield, HelpCircle, Code } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-cobalt border-t-2 border-cobalt-dark dark:border-butter mt-20 text-butter transition-colors">
      <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-butter text-cobalt flex items-center justify-center border-2 border-cobalt-dark shadow-[3px_3px_0px_#121F5C]">
                <GraduationCap size={24} strokeWidth={2.5} />
              </div>
              <span className="font-serif font-black text-xl tracking-tight text-butter">
                Seniors<span className="text-crimson">4</span>Juniors
              </span>
            </div>
            <p className="text-xs font-sans text-butter/80 leading-relaxed">
              Empowering college juniors with authentic guidance, interview preparation, and 1-on-1 peer mentorship from verified seniors of their own college.
            </p>
            <div className="inline-block px-3 py-1 rounded-lg bg-cobalt-dark border border-butter/30 text-[11px] font-sans font-bold uppercase tracking-wider text-butter">
              Built for Campus Excellence
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-sans font-bold text-butter uppercase tracking-widest mb-4 pb-1 border-b-2 border-butter/30">
              Explore Campus
            </h4>
            <ul className="space-y-2.5 text-xs font-sans font-semibold text-butter/85">
              <li><Link to="/" className="hover:text-butter-dark hover:underline">Q&amp;A Knowledge Base</Link></li>
              <li><Link to="/communities" className="hover:text-butter-dark hover:underline">Campus Communities</Link></li>
              <li><Link to="/job-trends" className="hover:text-butter-dark hover:underline">Job &amp; Internship Trends</Link></li>
              <li><Link to="/interview-experiences" className="hover:text-butter-dark hover:underline">Interview Archives</Link></li>
            </ul>
          </div>

          {/* Mentorship & Seniors */}
          <div>
            <h4 className="text-xs font-sans font-bold text-butter uppercase tracking-widest mb-4 pb-1 border-b-2 border-butter/30">
              Mentorship
            </h4>
            <ul className="space-y-2.5 text-xs font-sans font-semibold text-butter/85">
              <li><Link to="/mentorship" className="hover:text-butter-dark hover:underline">Mock Interviews &amp; Slots</Link></li>
              <li><Link to="/seniors" className="hover:text-butter-dark hover:underline">Verified Seniors Directory</Link></li>
              <li><Link to="/signup/senior" className="hover:text-butter-dark hover:underline">Become a Senior Mentor</Link></li>
              <li><Link to="/admin/login" className="hover:text-crimson text-crimson font-bold hover:underline">Admin Portal Access</Link></li>
            </ul>
          </div>

          {/* Safety & Honor Code */}
          <div>
            <h4 className="text-xs font-sans font-bold text-butter uppercase tracking-widest mb-4 pb-1 border-b-2 border-butter/30">
              Campus Guidelines
            </h4>
            <div className="space-y-2.5 text-xs font-sans text-butter/80">
              <p className="flex items-center gap-2">
                <Shield size={15} strokeWidth={2.5} className="text-crimson shrink-0" /> Strictly college-scoped data
              </p>
              <p className="flex items-center gap-2">
                <GraduationCap size={15} strokeWidth={2.5} className="text-butter shrink-0" /> Verified senior credentials
              </p>
              <p className="flex items-center gap-2">
                <HelpCircle size={15} strokeWidth={2.5} className="text-butter shrink-0" /> Zero harassment &amp; spam policy
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t-2 border-butter/20 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-butter/75">
          <p>© {new Date().getFullYear()} Seniors4Juniors. Authentic peer-to-peer collegiate wisdom.</p>
          <div className="flex items-center gap-6">
            <span>Cobalt &amp; Butter Design System</span>
            <span className="flex items-center gap-1 font-bold text-butter">
              <Code size={14} strokeWidth={2.5} /> React + Tailwind v4 + FastAPI
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
