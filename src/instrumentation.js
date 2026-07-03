export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { register: backendRegister } = await import(
      "@yourcompany/global-backend-next/instrumentation"
    );
    backendRegister();
  }
}
