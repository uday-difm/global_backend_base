"use client";

import React, { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faLinkedin, faInstagram, faYoutube, faTwitter, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope, faMapMarkerAlt, faPhone } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import ReCAPTCHA from "react-google-recaptcha";

export default function ContactUsPage() {
  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    textArea: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    phone: "",
  });
  const [status, setStatus] = useState({ message: '', type: '' });
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState(null);
  const [isRecaptchaConfigured, setIsRecaptchaConfigured] = useState(false);
  const [contactDetails, setContactDetails] = useState(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const recaptchaRef = useRef(null);

  React.useEffect(() => {
    // Load recaptcha settings
    fetch("/api/settings?siteId=ebh")
      .then(res => res.json())
      .then(data => {
        const key = data?.securityControls?.recaptchaSiteKey || null;
        if (key && key.trim()) {
          setRecaptchaSiteKey(key);
          setIsRecaptchaConfigured(true);
        }
      })
      .catch(err => {
        console.error("Failed to load settings:", err);
      });

    // Load contact details
    fetch("/api/contact/details?siteId=ebh")
      .then(res => res.json())
      .then(json => {
        const details = json.data?.contactDetails || json.contactDetails;
        if (details) {
          setContactDetails(details);
        }
      })
      .catch(err => {
        console.error("Failed to load contact details:", err);
      });
  }, []);

  const handleNameChange = (e) => {
    const value = e.target.value;
    if (/^[a-zA-Z\s]*$/.test(value)) {
      setValues({ ...values, name: value });
      setErrors({ ...errors, name: "" });
    } else {
      setErrors({ ...errors, name: "Name should only contain alphabets." });
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      if (value.length <= 10) {
        setValues({ ...values, phone: value });
        setErrors({ ...errors, phone: "" });
      }
    } else {
      setErrors({ ...errors, phone: "Phone number should only contain numbers." });
    }
  };

  const onRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (values.phone.length !== 10) {
      setStatus({ message: "Phone number must be exactly 10 digits.", type: 'error' });
      return;
    }

    if (!consentAccepted) {
      setStatus({ message: "You must accept the Privacy Policy and Terms & Conditions.", type: 'error' });
      return;
    }

    if (isRecaptchaConfigured && !recaptchaToken) {
      setStatus({ message: "Please complete the reCAPTCHA.", type: 'error' });
      return;
    }

    setStatus({ message: "Sending...", type: 'loading' });

    try {
      const response = await fetch(`/api/forms/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: "ebh",
          name: values.name,
          email: values.email,
          phone: values.phone,
          message: values.textArea,
          recaptchaToken: recaptchaToken || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus({ message: "Message sent successfully!", type: 'success' });
        setValues({ name: "", email: "", phone: "", subject: "", textArea: "" });
        setErrors({ name: "", phone: "" });
        setRecaptchaToken(null);
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
        }

        setTimeout(() => {
          setStatus({ message: '', type: '' });
        }, 3000);
      } else {
        setStatus({ message: `Error: ${result.message || result.error || "Failed to submit"}`, type: 'error' });
      }
    } catch (error) {
      console.error("Submission Error:", error);
      setStatus({ message: "An internal server error occurred.", type: 'error' });
    }
  };

  // Resolve dynamic vs default contact fields
  const primaryAddress = contactDetails?.addresses?.[0];
  const hasConfiguredAddress = primaryAddress && (primaryAddress.line1 || primaryAddress.city || primaryAddress.state);
  const addressString = hasConfiguredAddress 
    ? [primaryAddress.line1, primaryAddress.line2, primaryAddress.city, primaryAddress.state, primaryAddress.country, primaryAddress.postalCode].filter(Boolean).join(", ")
    : "30 N Gould St #24999, Sheridan, WY 82801";

  const rawEmbedUrl = contactDetails?.maps?.embedUrl;
  let embedUrl = "";
  if (rawEmbedUrl) {
    if (rawEmbedUrl.trim().startsWith("<iframe")) {
      const match = rawEmbedUrl.match(/src=["']([^"']+)["']/);
      embedUrl = match ? match[1] : "";
    } else {
      embedUrl = rawEmbedUrl;
    }
  }

  const gmapsDirections = contactDetails?.maps?.directionsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressString)}`;
  const primaryPhone = contactDetails?.phones?.[0]?.number || "+1-786-371-2232";
  const primaryEmail = contactDetails?.emails?.[0]?.address || "info@earthbyhumans.com";

  // WhatsApp configuration
  const whatsappNumber = contactDetails?.whatsapp?.number;
  const whatsappMessage = contactDetails?.whatsapp?.defaultMessage || "Hello!";
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}` : null;

  // Social Links
  const socials = contactDetails?.socials || {};
  const facebook = socials.facebook || "https://www.facebook.com/earthbyhumans";
  const linkedin = socials.linkedin || "https://www.linkedin.com/company/earth-by-humans/";
  const instagram = socials.instagram || "https://www.instagram.com/earth_by_humans/";
  const youtube = socials.youtube || "https://www.youtube.com/@earthbyhumans";
  const twitter = socials.twitter || "https://twitter.com/earthbyhumans";

  // Business Hours
  const businessHours = contactDetails?.businessHours || [];

  return (
    <>
      <title>Contact Us | Earth by Humans Get in Touch With Us</title>
      <meta name="description" content=" Have questions or feedback? Contact Earth by Humans for support and inquiries. We're here to help you connect with our mission." />
      <meta name="keywords" content="contact us, get in touch, support, feedback, inquiry, phone, email, Earth by Humans, help, reach out." />
      <meta property="og:description" content=" Have questions or feedback? Contact Earth by Humans for support and inquiries. We're here to help you connect with our mission." />
      <link rel="icon" href="https://earthbyhumans.s3-eu-central-2.ionoscloud.com/statics/blog-profile-img.png" type="image/png" />
      <div>
        <section>
          <div className="mx-auto max-w-[1350px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="mb-4 items-center justify-center text-center flex">
              <div className="max-w-3xl text-center sm:text-center md:mb-12">
                <p className="text-base font-semibold mt-20 text-black uppercase tracking-wide">
                  Contact
                </p>
                <h2 className="font-heading m-1 font-bold tracking-tight text-green-600 text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
                  Get in Touch
                </h2>
                <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto">
                  We would love to hear from you! If you have any questions, comments, or suggestions, please don’t hesitate to get in touch with us. At Earth by Humans, we are committed to providing you with the best experience and serving you in the most efficient way possible.
                </p>
              </div>
            </div>
            <div className="flex items-stretch justify-center">
              <div className="flex flex-col-reverse lg:flex-row gap-8 w-full">
                <div className="w-full lg:w-1/2 h-full pr-6">
                  <p className="mt-3 mb-10 text-lg md:text-xl text-justify px-2 md:px-0">
                    You can reach out to us using the contact form below or through the contact information provided. Our dedicated support team is always ready to assist you and will strive to respond to your inquiries as quickly as possible.
                    <br />
                    <br />
                    Your feedback is invaluable to us as we continue to improve and enhance our services. Thank you for choosing Earth by Humans. We look forward to connecting with you!
                    <br /><br />
                    <b className="text-black">Published By:</b> DO IT FOR ME LLC: <Link href={gmapsDirections} target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition duration-300 ease-in-out">{addressString}</Link>
                  </p>
                  <div className="flex flex-col gap-3">
                    <p className="text-lg text-gray-900">
                      <strong>Phone: </strong>
                      <a href={`tel:${primaryPhone.replace(/\D/g, "")}`} className="hover:text-green-600 transition duration-300 ease-in-out inline-flex items-center gap-2">
                        <FontAwesomeIcon icon={faPhone} className="text-green-600 ml-4" />
                        {primaryPhone}
                      </a>
                    </p>
                  </div>
                  
                  <ul className="mb-6 md:mb-0">
                    <li className="flex items-center mt-6">
                      <div className="flex items-center gap-4 text-xl text-gray-700 flex-wrap">
                        <a href={facebook} target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors">
                          <FontAwesomeIcon icon={faFacebookF} className="text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-full p-1 shadow" />
                        </a>
                        <a href={linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors">
                          <FontAwesomeIcon icon={faLinkedin} className="text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-full p-1 shadow" />
                        </a>
                        <a href={instagram} target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors">
                          <FontAwesomeIcon icon={faInstagram} className="text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-full p-1 shadow" />
                        </a>
                        <a href={youtube} target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors">
                          <FontAwesomeIcon icon={faYoutube} className="text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-full p-1 shadow" />
                        </a>
                        <a href={twitter} target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors">
                          <FontAwesomeIcon icon={faTwitter} className="text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-full p-1 shadow" />
                        </a>
                        <a href={gmapsDirections} target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-full p-1 shadow" />
                        </a>
                        <a href={`mailto:${primaryEmail}`} className="hover:text-green-600 transition-colors">
                          <FontAwesomeIcon icon={faEnvelope} className="text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-full p-1 shadow" />
                        </a>
                        {whatsappUrl && (
                          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors">
                            <FontAwesomeIcon icon={faWhatsapp} className="text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-full p-1 shadow" />
                          </a>
                        )}
                      </div>
                    </li>
                  </ul>

                  {/* Business Hours List */}
                  {businessHours && businessHours.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-100 max-w-sm">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">Business Hours</h3>
                      <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-600">
                        {businessHours.map((bh, idx) => (
                          <React.Fragment key={idx}>
                            <div className="font-medium text-gray-700">{bh.day}</div>
                            <div>{bh.closed ? "Closed" : `${bh.open} - ${bh.close}`}</div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="card w-full lg:w-1/2 h-fit p-3 rounded-lg bg-white">
                  <h2 className="text-2xl text-blue-800 font-bold">Contact Form</h2>
                  <p className="mb-4 text-sm text-black">Your email address will not be published. Required fields are marked *</p>
                  <form id="contactForm" onSubmit={handleSubmit}>
                    <div className="mb-6 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <input type="text" id="name" name="name" value={values.name} required onChange={handleNameChange} placeholder="Your name*" className={`w-full rounded-md border ${errors.name ? 'border-red-500' : 'border-gray-300'} py-2 px-3 focus:border-green-500 focus:ring-1 focus:ring-green-500`} />
                          {errors.name && <span className="text-red-500 text-xs mt-1">{errors.name}</span>}
                        </div>
                        <input type="email" id="email" name="email" value={values.email} required onChange={(e) => setValues({ ...values, email: e.target.value })} placeholder="Your email*" className="w-full rounded-md border border-gray-300 py-2 px-3 focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <input id="phone" name="phone" value={values.phone} required onChange={handlePhoneChange} type="text" placeholder="Your phone number*" className={`w-full rounded-md border ${errors.phone ? 'border-red-500' : 'border-gray-300'} py-2 px-3 focus:border-green-500 focus:ring-1 focus:ring-green-500`} />
                          {errors.phone && <span className="text-red-500 text-xs mt-1">{errors.phone}</span>}
                        </div>
                        <input type="text" id="subject" name="subject" value={values.subject} required onChange={(e) => setValues({ ...values, subject: e.target.value })} placeholder="Your subject*" className="w-full rounded-md border border-gray-300 py-2 px-3 focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                      </div>
                      <div>
                        <textarea name="textarea" cols="30" rows="5" value={values.textArea} required onChange={(e) => setValues({ ...values, textArea: e.target.value })} id="textarea" placeholder="Write your message..." className="w-full rounded-md focus:border-green-500 focus:ring-1 focus:ring-green-500 border border-gray-300 py-2 px-3"></textarea>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-gray-600 my-4 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          id="formConsentCheckbox"
                          checked={consentAccepted}
                          onChange={(e) => setConsentAccepted(e.target.checked)}
                          className="mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500 h-4 w-4 shrink-0"
                          required
                        />
                        <label htmlFor="formConsentCheckbox" className="cursor-pointer">
                          I agree to the <Link href="/legal/privacy" target="_blank" className="text-green-600 font-bold hover:underline">Privacy Policy</Link> and <Link href="/legal/terms" target="_blank" className="text-green-600 font-bold hover:underline">Terms & Conditions</Link>.*
                        </label>
                      </div>
                      <div>
                        {isRecaptchaConfigured && (
                          <ReCAPTCHA
                            ref={recaptchaRef}
                            sitekey={recaptchaSiteKey}
                            onChange={onRecaptchaChange}
                          />
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="relative group overflow-hidden rounded-full cursor-pointer w-full">
                        <div className="absolute inset-0 bg-green-600 z-0 transition-opacity duration-500 group-hover:opacity-80 rounded-full"></div>
                        <div className="absolute w-[200px] lg:w-[400px] h-[400px] lg:h-[420px] bg-blue-700 transform rotate-[35deg] transition-all duration-800 ease-in-out top-[-400%] left-[-95%] group-hover:left-0 z-10"></div>
                        <div className="absolute w-[600px] lg:w-[650px] h-[500px] lg:h-[310px] bg-blue-700 transform rotate-[25deg] lg:rotate-[125deg] transition-all duration-800 ease-in-out top-[-150%] md:top-[-320%] left-[100%] group-hover:left-[20%] z-10"></div>
                        <button
                          type="submit"
                          className="relative z-20 text-white px-6 py-3 font-xl rounded-full transition-colors duration-300 flex items-center justify-center w-full"
                        >
                          {status.type === 'loading' ? 'Sending...' : 'Send Message'}
                        </button>
                      </div>
                      {status.message && (
                        <p className={`mt-4 text-sm font-semibold ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{status.message}</p>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Embedded Google Map Section */}
            {embedUrl && (
              <div className="mt-16 w-full h-[450px] rounded-3xl overflow-hidden shadow-lg border border-gray-100">
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}

          </div>
        </section>
      </div>
    </>
  );
}