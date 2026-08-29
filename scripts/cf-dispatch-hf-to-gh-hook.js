/**
 * Cloudflare Worker: Hugging Face to GitHub Actions Webhook Relay
 *
 * Listens for webhook events from Hugging Face Hub (e.g. dataset updates)
 * and dispatches a 'content-updated' repository_dispatch event to GitHub Actions
 * to automatically trigger the site build and deployment pipeline.
 *
 * ==============================================================================
 * STEP-BY-STEP SETUP GUIDE
 * ==============================================================================
 *
 * STEP 1: CREATE GITHUB PERSONAL ACCESS TOKEN (PAT)
 * ------------------------------------------------------------------------------
 * 1. Go to: GitHub -> Settings -> Developer Settings -> Personal Access Tokens -> Fine-grained tokens
 *    Direct URL: https://github.com/settings/tokens?type=beta
 * 2. Click "Generate new token".
 * 3. Configure:
 *    - Token Name: "cf-hf-webhook-relay"
 *    - Expiration: Choose duration (e.g., 90 days, 1 year, or Custom)
 *    - Repository access: "Only select repositories" -> choose your site repo (e.g., 'bloatware')
 *    - Repository permissions:
 *        * Actions: Read and write
 *        * Contents: Read and write
 * 4. Click "Generate token" and copy the token value (starts with github_pat_...).
 *
 *
 * STEP 2: CREATE & DEPLOY CLOUDFLARE WORKER
 * ------------------------------------------------------------------------------
 * 1. Log in to Cloudflare Dashboard: https://dash.cloudflare.com/
 * 2. Navigate to: Compute (Workers & Pages) -> Workers & Pages
 * 3. Click "Create application" -> select "Workers" tab -> "Create Worker".
 * 4. Name the worker (e.g., 'bloatware-hf-relay') and click "Deploy".
 * 5. Click "Edit code" to open the online editor.
 * 6. Replace the entire contents of worker.js with this file's code.
 * 7. Click "Save and Deploy".
 *
 *
 * STEP 3: CONFIGURE WORKER ENVIRONMENT VARIABLES & SECRETS
 * ------------------------------------------------------------------------------
 * 1. Go back to Worker details page -> Settings tab -> "Variables and Secrets".
 * 2. Add the following variables:
 *    - GH_PAT            [Type: Secret (Encrypted)] -> Paste GitHub PAT from Step 1
 *    - GH_OWNER          [Type: Text]               -> GitHub username/org (e.g., 'crabwire' or 'dwijbavisi')
 *    - GH_REPO           [Type: Text]               -> Repository name (e.g., 'bloatware')
 *    - HF_WEBHOOK_SECRET [Type: Secret] (Optional)  -> Any custom passphrase
 * 3. Click "Save and Deploy".
 * 4. Copy your Worker URL (e.g., https://bloatware-hf-relay.<subdomain>.workers.dev).
 *
 *
 * STEP 4: ADD WEBHOOK IN HUGGING FACE
 * ------------------------------------------------------------------------------
 * 1. Go to Hugging Face: Settings -> Webhooks
 *    Direct URL: https://huggingface.co/settings/webhooks
 * 2. Click "Add a webhook":
 *    - Target Repositories: Select your dataset (e.g., datasets/crabwire/bloatware-content)
 *    - Webhook URL: Paste your Cloudflare Worker URL from Step 3
 *    - Secret: Enter the same passphrase as HF_WEBHOOK_SECRET (if configured)
 * 3. Click "Create Webhook".
 *
 *
 * STEP 5: TEST & VERIFY
 * ------------------------------------------------------------------------------
 * 1. Edit/commit a file in your Hugging Face dataset.
 * 2. Check "Recent Deliveries" in HF Webhooks settings (should show 200 OK).
 * 3. Check GitHub repository -> "Actions" tab -> Deploy workflow runs automatically!
 * ==============================================================================
 */

export default {
  async fetch(request, env) {
    // 1. Only allow POST requests
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method Not Allowed. Send a POST request." }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Validate Hugging Face Webhook Secret (if configured)
    const secretHeader = request.headers.get("x-webhook-secret");
    if (env.HF_WEBHOOK_SECRET && secretHeader !== env.HF_WEBHOOK_SECRET) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid x-webhook-secret header." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Validate required environment variables
    const missingVars = [];
    if (!env.GH_PAT) missingVars.push("GH_PAT");
    if (!env.GH_OWNER) missingVars.push("GH_OWNER");
    if (!env.GH_REPO) missingVars.push("GH_REPO");

    if (missingVars.length > 0) {
      const msg = `Missing required environment variables in Cloudflare Worker: ${missingVars.join(", ")}`;
      console.error(msg);
      return new Response(
        JSON.stringify({ success: false, error: msg }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      // 4. Parse Hugging Face Webhook payload safely
      let payload = {};
      try {
        const text = await request.text();
        if (text && text.trim().length > 0) {
          payload = JSON.parse(text);
        }
      } catch (parseErr) {
        console.warn("Could not parse JSON body:", parseErr.message);
      }

      const eventAction = payload?.event?.action || "unknown";
      const repoName = payload?.repo?.name || "unknown";
      console.log(`Received HF event '${eventAction}' for repo '${repoName}'`);

      // 5. Dispatch repository_dispatch event to GitHub Actions
      const ghApiUrl = `https://api.github.com/repos/${env.GH_OWNER}/${env.GH_REPO}/dispatches`;

      const ghResponse = await fetch(ghApiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.GH_PAT}`,
          "Accept": "application/vnd.github+json",
          "User-Agent": "Cloudflare-HF-Relay-Worker",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          event_type: "content-updated",
          client_payload: {
            source: "huggingface-webhook",
            event: eventAction,
            repo: repoName,
            triggered_at: new Date().toISOString()
          }
        })
      });

      // GitHub returns 204 No Content on successful dispatch
      if (ghResponse.ok || ghResponse.status === 204) {
        return new Response(
          JSON.stringify({
            success: true,
            message: `Successfully dispatched 'content-updated' to ${env.GH_OWNER}/${env.GH_REPO}`
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } else {
        const errorText = await ghResponse.text();
        console.error(`GitHub API Error (${ghResponse.status}):`, errorText);
        return new Response(
          JSON.stringify({
            success: false,
            status: ghResponse.status,
            github_error: errorText
          }),
          { status: ghResponse.status, headers: { "Content-Type": "application/json" } }
        );
      }
    } catch (err) {
      console.error("Worker Execution Error:", err);
      return new Response(
        JSON.stringify({
          success: false,
          error: err.message,
          stack: err.stack
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
};
