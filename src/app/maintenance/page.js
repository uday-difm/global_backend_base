import { Wrench } from "lucide-react";

export const metadata = {
  title: "Site Under Maintenance",
  description:
    "This site is currently undergoing scheduled maintenance. Please check back shortly.",
  robots: { index: false, follow: false },
};

export default async function MaintenancePage(props) {
  const searchParams = await props.searchParams;
  const message =
    typeof searchParams?.message === "string" ? searchParams.message : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-amber-50 px-4">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-4 bg-amber-100 rounded-full inline-flex">
            <Wrench className="w-10 h-10 text-amber-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Under Maintenance
        </h1>

        {/* Message */}
        {message ? (
          <p className="text-base text-gray-600 leading-relaxed">{message}</p>
        ) : (
          <div className="space-y-2">
            <p className="text-base text-gray-600 leading-relaxed">
              We are currently performing scheduled maintenance to improve your
              experience.
            </p>
            <p className="text-sm text-gray-500">
              The site will be back online shortly. Thank you for your patience.
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200 pt-6">
          <p className="text-xs text-gray-400">
            If you are the site owner and believe this is an error, please sign
            in to your dashboard to disable maintenance mode.
          </p>
        </div>
      </div>
    </div>
  );
}
