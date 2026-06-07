export async function register() {
  // Self-ping to prevent Railway from sleeping the service.
  // Only runs on the server, not during builds or on the client.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const url = process.env.APP_URL
      || (process.env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : null);

    if (url) {
      const ping = () => {
        fetch(`${url}/health`).catch(() => {
          // ignore errors — best effort
        });
      };

      // Ping every 5 minutes (300,000 ms).
      setInterval(ping, 5 * 60 * 1000);
      console.log(`Self-ping enabled: ${url}/health every 5 minutes`);
    }
  }
}
