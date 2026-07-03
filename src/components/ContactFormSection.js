// src/components/ContactFormSection.js
"use client";

import { useState, useEffect } from "react";

export default function ContactFormSection({ siteId = "", content = {}, recaptchaSiteKey = "" }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [hp, setHp] = useState(""); // Honeypot
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Dynamic loading of Google reCAPTCHA script if sitekey is present
  useEffect(() => {
    if (recaptchaSiteKey) {
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, [recaptchaSiteKey]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    // Get reCAPTCHA token if configured
    let recaptchaToken = undefined;
    if (recaptchaSiteKey && typeof window !== "undefined" && window.grecaptcha) {
      try {
        recaptchaToken = window.grecaptcha.getResponse();
      } catch (err) {
        console.error("reCAPTCHA getResponse error:", err);
      }
      if (!recaptchaToken) {
        setAlert({ type: "error", text: "Please complete the reCAPTCHA security verification." });
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          name,
          email,
          phone,
          message,
          recaptchaToken,
          _hp: hp,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setAlert({ type: "error", text: json.error || "Failed to submit message." });
        setLoading(false);
        return;
      }

      setAlert({ type: "success", text: "Thank you! Your message has been sent successfully." });
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      if (recaptchaSiteKey && typeof window !== "undefined" && window.grecaptcha) {
        window.grecaptcha.reset();
      }
    } catch (err) {
      setAlert({ type: "error", text: "A network error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-16 bg-white text-slate-800 border-t border-b animate-fade-in">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {content?.title || "Get In Touch"}
          </h2>
          {content?.description && (
            <p className="text-slate-500 mt-2 text-sm max-w-xl mx-auto leading-relaxed">
              {content.description}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Honeypot field (hidden from real users) */}
          <div style={{ display: "none" }} aria-hidden="true">
            <input
              type="text"
              name="honeypot"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              placeholder="Leave this empty"
              tabIndex={-1}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/20 px-3.5 py-2.5 text-xs text-slate-700 outline-none hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@company.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/20 px-3.5 py-2.5 text-xs text-slate-700 outline-none hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/20 px-3.5 py-2.5 text-xs text-slate-700 outline-none hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Your Message
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about your project or inquiry..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/20 px-3.5 py-2.5 text-xs text-slate-700 leading-relaxed outline-none hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 resize-none"
            />
          </div>

          {/* reCAPTCHA Placement */}
          {recaptchaSiteKey && (
            <div className="flex justify-start my-4">
              <div className="g-recaptcha" data-sitekey={recaptchaSiteKey}></div>
            </div>
          )}

          {/* Success/Error Alerts */}
          {alert && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                alert.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  alert.type === "success" ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              {alert.text}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 text-xs font-bold shadow-xs transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5"
          >
            {loading ? "Sending Message..." : content?.buttonText || "Send Message"}
          </button>
        </form>
      </div>
    </section>
  );
}
