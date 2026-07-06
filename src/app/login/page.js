"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from "lucide-react";

// Inner component that uses useSearchParams — must be inside <Suspense>
function LoginAndProjectLanding() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [twoFaRequired, setTwoFaRequired] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState("");

  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState(null);

  useEffect(() => {
    const hostname = window.location.hostname;
    const isIpAddress = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
    const isNgrok = hostname.endsWith(".ngrok.io") ||
      hostname.endsWith(".ngrok-free.dev");

    // Use test key on localhost, IPs, and ngrok domains
    const useTestKey = isIpAddress || isNgrok || hostname === "localhost" || hostname === "127.0.0.1";
    const activeKey = useTestKey
      ? "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
      : process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    console.log("[reCAPTCHA Debug] Host:", hostname, "Using test key:", useTestKey, "Site Key:", activeKey);
    setTimeout(() => {
      setRecaptchaSiteKey(activeKey);
    }, 0);
  }, []);

  // Load the reCAPTCHA v3 script dynamically.
  useEffect(() => {
    if (!recaptchaSiteKey) return;

    const scriptId = "recaptcha-script";
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    } else {
      const currentSrc = script.getAttribute("src");
      if (currentSrc && !currentSrc.includes(recaptchaSiteKey)) {
        script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`;
      }
    }
  }, [recaptchaSiteKey]);

  // If already authenticated, go straight to dashboard
  useEffect(() => {
    if (status === "authenticated") {
      const callbackUrl = searchParams.get("callbackUrl") || "/dashboard/dashboard";
      router.replace(callbackUrl);
    }
  }, [status, router, searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim()) return setError("Email is required.");
    if (!password) return setError("Password is required.");

    setLoading(true);

    try {
      // 1. Get reCAPTCHA v3 token
      let token = "dev_bypass_recaptcha";
      if (
        typeof window !== "undefined" &&
        window.grecaptcha &&
        recaptchaSiteKey
      ) {
        token = await new Promise((resolve) => {
          window.grecaptcha.ready(() => {
            window.grecaptcha
              .execute(recaptchaSiteKey, { action: "login" })
              .then(resolve)
              .catch((err) => {
                console.error("reCAPTCHA execution error:", err);
                resolve("recaptcha_error");
              });
          });
        });
      }

      // 2. Call Pre-Login checking (2FA Check + reCAPTCHA validation)
      const preRes = await fetch("/api/auth/pre-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, token }),
      });

      const preData = await preRes.json();
      if (!preRes.ok) {
        setLoading(false);
        return setError(preData.error || "Verification failed");
      }

      // If 2FA is required and not yet submitted, request code from user
      if (preData.twoFaRequired && !twoFaRequired) {
        setTwoFaRequired(true);
        setLoading(false);
        return;
      }

      // 3. Complete NextAuth sign-in
      const res = await signIn("credentials", {
        email,
        password,
        twoFaCode: twoFaCode || undefined,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        // Successful login, route to callbackUrl
        const callbackUrl = searchParams.get("callbackUrl") || "/dashboard/dashboard";
        router.replace(callbackUrl);
      }
    } catch (err) {
      console.error("Login submission error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <Loader2
            className="animate-spin text-indigo-500 mx-auto mb-4"
            size={40}
          />
          <p className="text-slate-400 text-sm">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-3xl -z-10" />

      {/* Login Widget Container */}
      <div
        id="login-card-section"
        className="w-full max-w-md rounded-2xl bg-slate-900/60 border border-slate-800 p-8 shadow-2xl backdrop-blur-xl hover:border-indigo-500/30 transition duration-300 relative z-10"
      >
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold mb-3 border border-indigo-500/20">
            <ShieldCheck size={12} />
            Secure Login
          </div>
          <h2 className="text-xl font-bold text-white">
            Dashboard Portal
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Sign in with your CMS admin credentials
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {twoFaRequired ? (
            <div>
              <label
                htmlFor="twoFaCode"
                className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5"
              >
                Two-Factor Authentication Code
              </label>
              <input
                id="twoFaCode"
                type="text"
                required
                maxLength={6}
                value={twoFaCode}
                onChange={(e) => {
                  setTwoFaCode(e.target.value);
                  setError("");
                }}
                placeholder="e.g. 123456"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none hover:border-slate-700 focus:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-center font-mono tracking-widest text-base"
              />
              <p className="text-[10px] text-slate-500 mt-1.5 text-center">
                Open your authenticator app to retrieve your security code.
              </p>
            </div>
          ) : (
            <>
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="admin@example.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none hover:border-slate-700 focus:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-bold text-slate-400 uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 pr-11 text-xs text-white outline-none hover:border-slate-700 focus:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 transition"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/25 px-3 py-2.5 text-xs text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 text-xs font-bold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {twoFaRequired
                  ? "Verifying OTP…"
                  : "Verifying Credentials…"}
              </>
            ) : twoFaRequired ? (
              "Verify Code & Sign In"
            ) : (
              "Sign In to Dashboard"
            )}
          </button>

          {twoFaRequired && (
            <button
              type="button"
              onClick={() => {
                setTwoFaRequired(false);
                setTwoFaCode("");
                setError("");
              }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-350 transition duration-150 mt-1 font-semibold"
            >
              Back to Sign In
            </button>
          )}
        </form>

        <p className="mt-5 text-center text-[10px] text-slate-500">
          Protected by NextAuth credentials verification.
        </p>
      </div>
    </div>
  );
}

// Outer page component with Suspense
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      }
    >
      <LoginAndProjectLanding />
    </Suspense>
  );
}
