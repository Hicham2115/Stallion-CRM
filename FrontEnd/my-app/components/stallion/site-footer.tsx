export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 px-6 py-12">
      <p className="mx-auto mb-5 max-w-[640px] text-center text-xs leading-relaxed text-[#6b7280]">
        Testimonials reflect individual client experiences and are not a
        guarantee of specific results. Outcomes vary based on your market,
        offer, and execution.
      </p>
      <div className="mb-5 flex justify-center gap-6">
        <a
          href="#"
          className="text-[13px] text-[#ace044] underline hover:text-[#bafc0c]"
        >
          Privacy Policy
        </a>
        <a
          href="#"
          className="text-[13px] text-[#ace044] underline hover:text-[#bafc0c]"
        >
          Terms of Service
        </a>
      </div>
      <p className="text-center text-[11px] tracking-[2px] text-[#6b7280] uppercase">
        Stallion Advertising &middot; &copy; {new Date().getFullYear()} All
        Rights Reserved
      </p>
    </footer>
  );
}
