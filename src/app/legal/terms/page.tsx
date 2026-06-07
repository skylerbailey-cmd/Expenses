import Link from "next/link";

export const metadata = {
  title: "Terms of Use – Expenses",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-slate-500 hover:text-slate-900"
      >
        &larr; Back to app
      </Link>

      <h1 className="text-2xl font-bold">End User License Agreement</h1>
      <p className="mt-1 text-sm text-slate-500">Last updated: June 7, 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="text-base font-semibold text-slate-900">
            1. Acceptance of Terms
          </h2>
          <p className="mt-2">
            By accessing or using the Expenses application (&quot;Service&quot;),
            you agree to be bound by this End User License Agreement
            (&quot;Agreement&quot;). If you do not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            2. Description of Service
          </h2>
          <p className="mt-2">
            Expenses is an expense management platform that allows users to
            submit, track, and approve business expense reports. The Service
            includes AI-assisted receipt capture, expense categorization,
            duplicate detection, and optional integration with third-party
            accounting software such as QuickBooks Online.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            3. License Grant
          </h2>
          <p className="mt-2">
            Subject to this Agreement, we grant you a limited, non-exclusive,
            non-transferable, revocable license to access and use the Service for
            your internal business purposes. You may not sublicense, resell, or
            redistribute the Service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            4. User Accounts
          </h2>
          <p className="mt-2">
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activities that occur under your
            account. You agree to notify us immediately of any unauthorized use.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            5. Acceptable Use
          </h2>
          <p className="mt-2">You agree not to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Submit fraudulent, falsified, or misleading expense reports</li>
            <li>Upload malicious files or content disguised as receipts</li>
            <li>
              Attempt to gain unauthorized access to other users&apos; data or
              administrative functions
            </li>
            <li>
              Use the Service in violation of any applicable law or regulation
            </li>
            <li>
              Interfere with or disrupt the integrity or performance of the
              Service
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            6. Intellectual Property
          </h2>
          <p className="mt-2">
            The Service and all associated technology, content, and branding are
            owned by us and protected by intellectual property laws. You retain
            ownership of the data you submit (receipts, expense details) but
            grant us a license to process it for the purpose of providing the
            Service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            7. AI Processing
          </h2>
          <p className="mt-2">
            The Service uses artificial intelligence to extract information from
            uploaded receipts. While we strive for accuracy, AI-generated results
            may contain errors. You are responsible for reviewing and confirming
            all extracted data before submitting expense reports.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            8. Third-Party Integrations
          </h2>
          <p className="mt-2">
            The Service may integrate with third-party services (e.g., QuickBooks
            Online). Your use of those services is governed by their respective
            terms. We are not responsible for the availability or accuracy of
            third-party services.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            9. Disclaimer of Warranties
          </h2>
          <p className="mt-2">
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
            AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
            INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A
            PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            10. Limitation of Liability
          </h2>
          <p className="mt-2">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR
            ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
            DAMAGES ARISING FROM YOUR USE OF THE SERVICE, INCLUDING BUT NOT
            LIMITED TO LOSS OF DATA, REVENUE, OR PROFITS.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            11. Termination
          </h2>
          <p className="mt-2">
            We may suspend or terminate your access to the Service at any time
            for violation of this Agreement or for any reason with reasonable
            notice. Upon termination, your right to use the Service ceases
            immediately.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            12. Changes to This Agreement
          </h2>
          <p className="mt-2">
            We reserve the right to modify this Agreement at any time. We will
            notify users of material changes. Your continued use of the Service
            after changes constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            13. Governing Law
          </h2>
          <p className="mt-2">
            This Agreement shall be governed by and construed in accordance with
            the laws of the State of Delaware, without regard to its conflict of
            law principles.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            14. Contact
          </h2>
          <p className="mt-2">
            If you have questions about this Agreement, please contact us at
            support@expenses.app.
          </p>
        </section>
      </div>

      <div className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-400">
        <Link href="/legal/privacy" className="hover:text-slate-600">
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}
