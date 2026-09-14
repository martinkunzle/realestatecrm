# CloseKey CRM launch guide

This ZIP is the self-hosted edition of CloseKey CRM. It includes public email/password accounts, secure sessions, Cloudflare D1 storage, a 14-day trial, Stripe subscription checkout, Stripe Customer Portal access, and subscription enforcement after the trial.

## 1. Upload to GitHub

1. Create a new private repository named `closekey-crm` on GitHub.
2. Extract this ZIP and upload every file and folder to the repository. Keep `.github`, `app`, `db`, `drizzle`, and `public` intact.
3. Do not upload a real `.env` file or any Stripe secret keys.

## 2. Create the Cloudflare database

1. In Cloudflare, open **Workers & Pages → D1 SQL Database → Create**.
2. Name it `closekey-crm-db`.
3. Copy its database ID.
4. In `wrangler.jsonc`, replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` with that ID.
5. Replace `https://REPLACE_WITH_YOUR_DOMAIN` with your final `https://` domain.

## 3. Create the Stripe subscription

1. In Stripe, create a product named **CloseKey CRM Pro**.
2. Add a recurring monthly price of **$49 USD**.
3. Copy the Price ID beginning with `price_` into `STRIPE_PRICE_ID` in `wrangler.jsonc`.
4. In Stripe Developers, copy your live secret key beginning with `sk_live_`.
5. Create a webhook endpoint at `https://YOURDOMAIN.com/api/stripe/webhook`.
6. Subscribe it to `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.
7. Copy the webhook signing secret beginning with `whsec_`.

Never put the Stripe secret key or webhook secret in GitHub files.

## 4. Configure Cloudflare secrets

After the Worker exists, open **Settings → Variables and Secrets** and add encrypted secrets:

- `STRIPE_SECRET_KEY` = your live `sk_live_...` key
- `STRIPE_WEBHOOK_SECRET` = your `whsec_...` signing secret

The non-secret values `APP_URL` and `STRIPE_PRICE_ID` are already read from `wrangler.jsonc`.

## 5. Connect GitHub to Cloudflare

1. In Cloudflare, choose **Workers & Pages → Create → Import a repository**.
2. Select the GitHub repository.
3. Use `pnpm install --frozen-lockfile` as the install command and `pnpm build` as the build command.
4. Use `npx wrangler deploy --config wrangler.jsonc` as the deploy command if Cloudflare asks for one.
5. Add GitHub repository secrets named `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` if you use the included deployment workflow.
6. Run the workflow once. It applies the D1 migrations before deployment.

## 6. Attach your domain

1. Open the deployed Worker in Cloudflare.
2. Choose **Settings → Domains & Routes → Add → Custom Domain**.
3. Enter your domain or subdomain, such as `app.yourdomain.com`.
4. Cloudflare creates the DNS record and SSL certificate.
5. Confirm that `APP_URL` in `wrangler.jsonc` exactly matches the live domain, then redeploy.

## Test before taking live payments

Use Stripe test keys first. Create an account, finish onboarding, add CRM records, open Billing, complete checkout with Stripe test card `4242 4242 4242 4242`, verify the subscription in Stripe, open the customer portal, log out, and log back in. Switch to live Stripe keys only after that complete test passes.

## Important launch items

Before advertising, add your legal business name, support email, refund/cancellation policy, Terms of Service, and Privacy Policy. Configure transactional email and password reset before a broad public launch. This ZIP includes secure signup/login, but password reset email requires an email provider such as Resend or Postmark.
